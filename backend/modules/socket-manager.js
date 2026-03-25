// backend/modules/socket-manager.js
const db = require('../db');
const log = require('./logger');

// In-memory tracking
const kioskSockets = new Map();
const kioskConnectedAt = new Map(); // Track connection time per socket
const lastPrinterStatus = new Map(); // Track last printer status per kiosk

// State ordering for preventing backward transitions
const STATE_ORDER = {
    PENDING: 0, PAID: 1, SENT_TO_PI: 2, QUEUED: 3,
    DISCOVERING_SCANNER: 4, SCANNING: 5, PROCESSING: 6,
    PRINTING: 7, COMPLETED: 8, FAILED: 9
};

function emitToKiosk(kioskId, eventName, payload) {
    const socket = kioskSockets.get(kioskId);
    if (!socket) return false;
    socket.emit(eventName, payload);
    return true;
}

function initSocketServer(io) {
    io.on('connection', (socket) => {
        kioskConnectedAt.set(socket.id, Date.now());
        log.socket(`New connection: ${socket.id}`);
        
        // ===== REGISTER: Initializes kiosk and printer_status =====
        socket.on('register', async (data) => {
            const { kiosk_id, hostname, printer_name, printer_brand, printer_driver } = data;
            try {
                // Using direct SQL upsert so we can initialize printer_status
                await db.query(
                    `INSERT INTO kiosks (id, hostname, printer_name, status, socket_id, last_seen, printer_status, printer_brand, printer_driver)
                     VALUES ($1, $2, $3, 'online', $4, NOW(), 'unknown', $5, $6)
                     ON CONFLICT (id) DO UPDATE SET
                        hostname = EXCLUDED.hostname,
                        printer_name = EXCLUDED.printer_name,
                        status = 'online',
                        socket_id = EXCLUDED.socket_id,
                        last_seen = NOW(),
                        printer_brand = COALESCE(EXCLUDED.printer_brand, kiosks.printer_brand),
                        printer_driver = COALESCE(EXCLUDED.printer_driver, kiosks.printer_driver)`,
                    [kiosk_id, hostname, printer_name, socket.id, printer_brand || null, printer_driver || null]
                );

                kioskSockets.set(kiosk_id, socket);
                log.socket(`Kiosk registered — id: ${kiosk_id}, hostname: ${hostname}, printer: ${printer_name}, socket: ${socket.id}`);
            } catch (error) {
                log.error(`[SOCKET] Registration error for ${kiosk_id}: ${error.message}`);
            }
        });
        
        socket.on('job_received', async (data) => {
            try {
                const currentJob = await db.getJob(data.job_id);
                const oldStatus = currentJob?.status || 'unknown';
                await db.transitionJobState(data.job_id, 'QUEUED', { message: 'Pi agent acknowledged job' });
                log.job(`${data.job_id} | ${currentJob?.job_type || 'print'} | ${oldStatus} → QUEUED | Pi agent acknowledged`);
            } catch (error) {
                log.error(`[JOB] job_received error: ${error.message}`);
            }
        });
        
        socket.on('print_started', async (data) => {
            try {
                const currentJob = await db.getJob(data.job_id);
                const oldStatus = currentJob?.status || 'unknown';
                await db.transitionJobState(data.job_id, 'PRINTING', { message: 'Printing started' });
                log.job(`${data.job_id} | ${currentJob?.job_type || 'print'} | ${oldStatus} → PRINTING | Printing started`);
            } catch (error) {
                log.error(`[JOB] print_started error: ${error.message}`);
            }
        });
        
        // ===== PRINT COMPLETE: Updates Job + Updates Paper Count (Phase 3) =====
        socket.on('print_complete', async (data) => {
            const { job_id, success, pages_printed, error } = data;
            try {
                // Idempotency guard: skip if already completed or failed
                const currentJob = await db.getJob(job_id);
                if (currentJob && (currentJob.status === 'COMPLETED' || currentJob.status === 'FAILED')) {
                    log.socket(`Duplicate event received: print_complete for ${job_id} — ignored (already ${currentJob.status})`);
                    return;
                }

                const oldStatus = currentJob?.status || 'unknown';
                const jobType = currentJob?.job_type || 'print';

                if (success) {
                    // 1. Update job status to COMPLETED
                    await db.transitionJobState(job_id, 'COMPLETED', {
                        message: 'Print completed',
                        pages_printed
                    });

                    // 2. Subtract pages from kiosk paper count (skip for mock kiosk)
                    if (pages_printed && pages_printed > 0) {
                        try {
                            // Find which kiosk printed this job
                            const jobResult = await db.query(
                                'SELECT kiosk_id FROM jobs WHERE id = $1',
                                [job_id]
                            );

                            if (jobResult.rows.length > 0) {
                                const kioskId = jobResult.rows[0].kiosk_id;

                                // Skip paper decrement for test kiosk
                                const testKioskId = process.env.TEST_KIOSK_ID || null;
                                if (testKioskId && kioskId === testKioskId) {
                                    log.info(`[Paper] Skipping decrement for test kiosk ${kioskId}`);
                                } else {
                                    // Decrement paper count (ensure it doesn't go below 0)
                                    await db.query(`
                                        UPDATE kiosks 
                                        SET current_paper_count = GREATEST(0, current_paper_count - $1)
                                        WHERE id = $2
                                    `, [pages_printed, kioskId]);

                                    log.info(`[Paper] Kiosk ${kioskId}: -${pages_printed} pages`);
                                }
                            }
                        } catch (paperError) {
                            // Log error but don't fail the job completion process
                            log.error(`[Paper] Tracking error: ${paperError.message}`);
                        }
                    }

                    log.job(`${job_id} | ${jobType} | ${oldStatus} → COMPLETED | ${pages_printed || 0} pages printed`);
                } else {
                    // Handle Failure with retry logic + exponential backoff
                    const jobData = await db.getJob(job_id);
                    const retryCount = jobData?.retry_count || 0;

                    // Max 3 total attempts: original + 2 retries (retry_count 0 → 1 → 2 → FAILED)
                    if (retryCount < 2) {
                        // Exponential backoff: retry 1 = 30s, retry 2 = 60s
                        const backoffSeconds = 30 * (retryCount + 1);
                        const retryAfter = Date.now() + (backoffSeconds * 1000);

                        // Merge retry_after into existing metadata (preserves any other metadata fields)
                        const existingMetadata = jobData?.metadata || {};
                        const updatedMetadata = { ...existingMetadata, retry_after: retryAfter };

                        await db.updateJob(job_id, {
                            status: 'PAID',
                            retry_count: retryCount + 1,
                            error_message: `Retry ${retryCount + 1}/2: ${error}`,
                            metadata: updatedMetadata
                        });
                        log.job(`${job_id} | ${jobType} | ${oldStatus} → PAID (retry ${retryCount + 1}/2, backoff ${backoffSeconds}s) | ${error}`);
                    } else {
                        await db.transitionJobState(job_id, 'FAILED', {
                            message: 'Print failed after 3 attempts',
                            error_message: error
                        });
                        log.job(`${job_id} | ${jobType} | ${oldStatus} → FAILED (3 attempts exhausted) | ${error}`);
                    }
                }
            } catch (err) {
                log.error(`[JOB] print_complete error: ${err.message}`);
            }
        });
        
        // ===== SCAN COMPLETE: Updates scan job status =====
        socket.on('scan_complete', async (data) => {
            const { job_id, success, error } = data;
            try {
                // Idempotency guard: skip if already completed or failed
                const currentJob = await db.getJob(job_id);
                if (currentJob && (currentJob.status === 'COMPLETED' || currentJob.status === 'FAILED')) {
                    log.socket(`Duplicate event received: scan_complete for ${job_id} — ignored (already ${currentJob.status})`);
                    return;
                }

                const oldStatus = currentJob?.status || 'unknown';
                const jobType = currentJob?.job_type || 'scan';

                if (success) {
                    await db.transitionJobState(job_id, 'COMPLETED', {
                        message: 'Scan completed'
                    });
                    log.job(`${job_id} | ${jobType} | ${oldStatus} → COMPLETED | Scan finished`);
                } else {
                    await db.transitionJobState(job_id, 'FAILED', {
                        message: 'Scan failed',
                        error_message: error
                    });
                    log.job(`${job_id} | ${jobType} | ${oldStatus} → FAILED | ${error}`);
                }
            } catch (err) {
                log.error(`[JOB] scan_complete error: ${err.message}`);
            }
        });

        // ===== JOB STATE CHANGE: Generic status update from pi-agent =====
        socket.on('job_state_change', async (data) => {
            const { job_id, status: newStatus, status_message } = data;
            try {
                // Ordered state transition guard
                const currentJob = await db.getJob(job_id);
                if (currentJob && newStatus !== 'FAILED') {
                    const currentOrder = STATE_ORDER[currentJob.status];
                    const newOrder = STATE_ORDER[newStatus];
                    if (currentOrder !== undefined && newOrder !== undefined && newOrder <= currentOrder) {
                        log.warn(`[JOB] Skipping backward transition — ${job_id}: ${currentJob.status} → ${newStatus}`);
                        return;
                    }
                }

                const oldStatus = currentJob?.status || 'unknown';
                const jobType = currentJob?.job_type || 'unknown';

                const updateFields = {
                    status: newStatus,
                    status_message: status_message || null,
                    last_status_update: new Date()
                };

                // Propagate error details when job fails
                if (newStatus === 'FAILED' && status_message) {
                    updateFields.error_message = status_message;
                }

                await db.updateJob(job_id, updateFields);
                log.job(`${job_id} | ${jobType} | ${oldStatus} → ${newStatus} | ${status_message || ''}`);
            } catch (err) {
                log.error(`[JOB] job_state_change error: ${err.message}`);
            }
        });

        // ===== HEARTBEAT: Updates detailed status =====
        socket.on('heartbeat', async (data) => {
            try {
                // Expecting data: { kiosk_id, uptime, printer_ipp_status, printer_ipp_detail }
                await db.query(
                    `UPDATE kiosks SET
                        status = 'online',
                        last_seen = NOW(),
                        uptime = $1,
                        socket_id = $2,
                        printer_status = $3,
                        printer_status_detail = $4,
                        last_status_check = NOW(),
                        printer_brand = COALESCE($6, printer_brand),
                        printer_driver = COALESCE($7, printer_driver)
                     WHERE id = $5`,
                    [
                        data.uptime || 0,
                        socket.id,
                        data.printer_ipp_status || 'unknown',
                        data.printer_ipp_detail || null,
                        data.kiosk_id,
                        data.printer_brand || null,
                        data.printer_driver || null
                    ]
                );

                // Only log if printer status changed
                if (data.kiosk_id && data.printer_ipp_status) {
                    const lastStatus = lastPrinterStatus.get(data.kiosk_id);
                    if (lastStatus !== data.printer_ipp_status) {
                        log.info(`[Heartbeat] Kiosk ${data.kiosk_id} printer: ${lastStatus || 'unknown'} → ${data.printer_ipp_status}`);
                        lastPrinterStatus.set(data.kiosk_id, data.printer_ipp_status);
                    }
                }
            } catch (error) {
                log.error(`[Heartbeat] Error: ${error.message}`);
            }
        });
        
        socket.on('disconnect', async () => {
            const connectedAt = kioskConnectedAt.get(socket.id);
            const aliveMs = connectedAt ? Date.now() - connectedAt : 0;
            kioskConnectedAt.delete(socket.id);

            log.socket(`Disconnected: ${socket.id} (alive ${(aliveMs / 1000).toFixed(1)}s)`);
            try {
                const testKioskId = process.env.TEST_KIOSK_ID || null;
                for (const [kioskId, sock] of kioskSockets.entries()) {
                    if (sock.id === socket.id) {
                        // Skip marking test kiosk offline on disconnect
                        if (testKioskId && kioskId === testKioskId) {
                            log.socket(`Test kiosk ${kioskId} disconnect ignored`);
                            kioskSockets.delete(kioskId);
                            break;
                        }
                        await db.updateKioskStatus(kioskId, 'offline');
                        kioskSockets.delete(kioskId);
                        lastPrinterStatus.delete(kioskId);
                        log.socket(`Kiosk ${kioskId} went offline`);
                        break;
                    }
                }
            } catch (error) {
                log.error(`[Disconnect] Error: ${error.message}`);
            }
        });
    });
}

function getKioskSocket(kioskId) {
    return kioskSockets.get(kioskId) || null;
}

module.exports = {
    initSocketServer,
    kioskSockets,
    emitToKiosk,
    getKioskSocket
};