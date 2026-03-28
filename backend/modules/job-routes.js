const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const { optionalAuth, ensureUserExists } = require('../auth-middleware');
const verifyToken = require('../middleware/verifyToken');
const { upload, generateJobId, generatePrintToken, countPDFPages, PRICE_PER_PAGE } = require('./utils');
const socketManager = require('./socket-manager');
const log = require('./logger');

const router = express.Router();

router.post('/test-simple', (req, res) => {
    console.log("🔥 TEST ROUTE HIT");
    res.json({ success: true });
});


// Simple ping to verify router mount
router.get('/ping', (req, res) => res.json({ status: 'ok', message: 'Job router is alive' }));

// Debug middleware to log all requests to this router
router.use((req, res, next) => {
    log.info(`[DEBUG] JOB-ROUTER | Request: ${req.method} ${req.url}`);
    next();
});


// ===============================
// User's Job History
// ===============================
router.get('/jobs/my-jobs', verifyToken, async (req, res) => {
    try {
        const filters = {};
        if (req.query.status) filters.status = req.query.status;

        const jobs = await db.getUserJobs(req.user.uid, filters);
        res.json({ jobs });
    } catch (error) {
        log.error('[JOB] ERROR | route: /api/jobs/my-jobs | reason: ' + error.message);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});


// ===============================
// User Stats
// ===============================
router.get('/users/stats', verifyToken, async (req, res) => {
    try {
        const stats = await db.getUserStats(req.user.uid);
        res.json({
            totalJobs: parseInt(stats.total_jobs || 0),
            totalPages: parseInt(stats.total_pages || 0),
            totalSpent: parseFloat(stats.total_spent || 0),
            successRate: parseFloat(stats.success_rate || 0),
            jobsThisMonth: parseInt(stats.jobs_this_month || 0),
            spentThisMonth: parseFloat(stats.spent_this_month || 0)
        });
    } catch (error) {
        log.error('[JOB] ERROR | route: /api/users/stats | reason: ' + error.message);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});


// ===============================
// User Profile (role fetch)
// ===============================
router.get('/user/profile', verifyToken, async (req, res) => {
    try {
        const user = await db.getUser(req.user.uid);

        if (!user) {
            return res.json({ role: 'user' });
        }

        res.json({
            role: user.role || 'user',
            email: user.email,
            name: user.name
        });
    } catch (error) {
        log.error('[JOB] ERROR | route: /api/user/profile | reason: ' + error.message);
        res.json({ role: 'user' });
    }
});


// ===============================
// Kiosk Connect
// ===============================
router.post('/connect', optionalAuth, async (req, res) => {
    const { kiosk_id } = req.body;
    log.info('[JOB] Connect request for kiosk: ' + kiosk_id);

    try {
        const TEST_KIOSK_ID = process.env.TEST_KIOSK_ID || null;

        // Restriction Check: Test kiosk is admin-only (unless public access is enabled)
        if (TEST_KIOSK_ID && kiosk_id === TEST_KIOSK_ID) {
            const allowPublic = await db.getSetting('allow_public_test_kiosk', false);
            const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
            
            if (!allowPublic && !isAdmin) {
                return res.status(403).json({ 
                    status: 'error', 
                    message: 'Admin access required to use the test kiosk. Please login as an admin.' 
                });
            }

            // Success response for mock kiosk
            return res.json({
                status: 'connected',
                message: 'Mock kiosk connected',
                kiosk_name: 'Test Kiosk',
                printer: 'Mock Printer',
                paper_count: 999
            });
        }

        const kiosk = await db.getKiosk(kiosk_id);

        if (kiosk && kiosk.status === 'online') {
            res.json({
                status: 'connected',
                message: 'Kiosk is online',
                kiosk_name: kiosk.hostname,
                printer: kiosk.printer_name,
                paper_count: kiosk.current_paper_count
            });
        } else {
            res.status(503).json({ status: 'error', message: 'Kiosk is offline or not found' });
        }

    } catch (error) {
        log.error('[JOB] ERROR | route: /api/connect | reason: ' + error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// DEBUG: Catch-all to see if it hits
router.use('/jobs/create', (req, res, next) => {
    log.info(`[DEBUG] HIT /jobs/create | Method: ${req.method} | Content-Type: ${req.headers['content-type']}`);
    next();
});

// ===============================
// Create Print Job
// ===============================
router.post(
  '/jobs/create',
  verifyToken,
  upload.single('file'),
  async (req, res) => {
      console.log("🔥 FULL ROUTE HIT");
      res.json({ ok: true });
  }
);



// ===============================
// Verify Payment
// ===============================
router.post('/jobs/:job_id/verify-payment', verifyToken, async (req, res) => {

    const { job_id } = req.params;

    try {

        const job = await db.getJob(job_id);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Access check: user_id match OR guest match via metadata
        if (req.user.isGuest) {
            const meta = job.metadata || {};
            if (meta.guestId !== req.user.guestId) {
                return res.status(403).json({ error: 'Forbidden' });
            }
        } else if (job.user_id !== req.user.uid) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { token, timestamp } = generatePrintToken(job_id, job.kiosk_id);

        const printSettings = req.body.print_settings || {};
        const copies = req.body.copies || 1;
        const existingMetadata = job.metadata || {};

        await db.updateJob(job_id, {
            status: 'PAID',
            payment_status: 'paid',
            payment_id: req.body.payment_id,
            paid_at: new Date(),
            print_token: token,
            token_timestamp: timestamp,
            metadata: {
                ...existingMetadata,
                print_settings: printSettings,
                copies,
                total_pages_to_print: (
                    printSettings.pageRange && printSettings.pageRange !== 'all'
                        ? Math.max(1, copies)
                        : (job.pages || 1) * copies
                )
            }
        });

        const payerId = req.user.isGuest ? 'guest:' + req.user.guestId : req.user.uid;
        log.job(`${job_id} | payment verified | amount: ${job.total_cost} | by: ${payerId}`);

        res.json({ status: 'success', job_status: 'PAID' });

        // Trigger mock simulation immediately for test kiosk
        if (TEST_KIOSK_ID && job.kiosk_id === TEST_KIOSK_ID) {
            log.info(`[MOCK] ${job_id} | simulation triggered from payment verify`);
            // Re-fetch job to get updated PAID status
            const paidJob = await db.getJob(job_id);
            if (paidJob) {
                // Mark as SENT_TO_PI (same as poll would do)
                await db.updateJob(job_id, { status: 'SENT_TO_PI', queued_at: new Date(), last_status_update: new Date() });
                startMockSimulation(paidJob, Date.now());
            }
        }

    } catch (error) {
        log.error(`[JOB] ${job_id} | ERROR | route: /api/jobs/${job_id}/verify-payment | reason: ${error.message}`);
        res.status(500).json({ error: 'Payment verification failed' });
    }
});


// ===============================
// Get Job Status (Frontend polling)
// ===============================
router.get('/jobs/:job_id/status', verifyToken, async (req, res) => {
    const { job_id } = req.params;

    try {
        const job = await db.getJob(job_id);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Access check: user_id match OR guest match via metadata
        if (req.user.isGuest) {
            const meta = job.metadata || {};
            if (meta.guestId !== req.user.guestId) {
                return res.status(403).json({ error: 'Forbidden' });
            }
        } else if (job.user_id !== req.user.uid) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        res.json({
            status: job.status,
            job_type: job.job_type || 'print',
            error_message: job.error_message || null,
            status_message: job.status_message || null,
            output_file_url: job.output_file_url || null
        });

    } catch (error) {
        log.error(`[JOB] ${job_id} | ERROR | route: /api/jobs/${job_id}/status | reason: ${error.message}`);
        res.status(500).json({ error: 'Failed to get job status' });
    }
});


// Mock kiosk configuration (read from env)
const TEST_KIOSK_ID = process.env.TEST_KIOSK_ID || null;
const MOCK_STEP_DELAY_MS = parseInt(process.env.MOCK_STEP_DELAY_MS) || 2000;
const MOCK_COMPLETE_DELAY_MS = parseInt(process.env.MOCK_COMPLETE_DELAY_MS) || 5000;

// Helper: safe mock step — wraps each setTimeout callback
async function mockStep(jobId, stepName, startTime, fn) {
    try {
        const job = await db.getJob(jobId);
        if (!job || job.status === 'COMPLETED' || job.status === 'FAILED' || job.status === 'CANCELLED') {
            log.info(`[MOCK] ${jobId} | ${stepName} | SKIPPED (job ${job ? job.status : 'not found'})`);
            return false;
        }
        await fn(job);
        log.info(`[MOCK] ${jobId} | ${stepName} | ${Date.now() - startTime}ms elapsed`);
        return true;
    } catch (err) {
        log.error(`[MOCK] ${jobId} | ${stepName} | ERROR: ${err.message}`);
        return false;
    }
}

// Mock simulation chains per job type
function startMockSimulation(job, startTime) {
    const jobId = job.id;
    const jobType = job.job_type || 'print';

    if (jobType === 'print') {
        // Print: QUEUED → PRINTING → COMPLETED
        setTimeout(async () => {
            const ok = await mockStep(jobId, 'QUEUED', startTime, async () => {
                await db.transitionJobState(jobId, 'QUEUED', { message: 'Mock kiosk acknowledged job' });
            });
            if (!ok) return;

            setTimeout(async () => {
                const ok2 = await mockStep(jobId, 'PRINTING', startTime, async () => {
                    await db.transitionJobState(jobId, 'PRINTING', { message: 'Mock: printing started' });
                });
                if (!ok2) return;

                setTimeout(async () => {
                    await mockStep(jobId, 'COMPLETED', startTime, async (latestJob) => {
                        await db.transitionJobState(jobId, 'COMPLETED', {
                            message: 'Mock: print completed',
                            pages_printed: latestJob.pages || 1
                        });
                    });
                }, MOCK_COMPLETE_DELAY_MS - MOCK_STEP_DELAY_MS);

            }, MOCK_STEP_DELAY_MS * 0.5);

        }, MOCK_STEP_DELAY_MS * 0.5);

    } else if (jobType === 'scan') {
        // Scan: DISCOVERING_SCANNER → SCANNING → COMPLETED
        setTimeout(async () => {
            const ok = await mockStep(jobId, 'DISCOVERING_SCANNER', startTime, async () => {
                await db.updateJob(jobId, { status: 'DISCOVERING_SCANNER', status_message: 'Mock: finding scanner', last_status_update: new Date() });
            });
            if (!ok) return;

            setTimeout(async () => {
                const ok2 = await mockStep(jobId, 'SCANNING', startTime, async () => {
                    await db.updateJob(jobId, { status: 'SCANNING', status_message: 'Mock: scanning', last_status_update: new Date() });
                });
                if (!ok2) return;

                setTimeout(async () => {
                    await mockStep(jobId, 'COMPLETED', startTime, async () => {
                        await db.transitionJobState(jobId, 'COMPLETED', { message: 'Mock: scan completed' });
                    });
                }, MOCK_COMPLETE_DELAY_MS - MOCK_STEP_DELAY_MS);

            }, MOCK_STEP_DELAY_MS * 0.5);

        }, MOCK_STEP_DELAY_MS * 0.5);

    } else if (jobType === 'xerox') {
        // Xerox: DISCOVERING_SCANNER → SCANNING → PRINTING → COMPLETED
        setTimeout(async () => {
            const ok = await mockStep(jobId, 'DISCOVERING_SCANNER', startTime, async () => {
                await db.updateJob(jobId, { status: 'DISCOVERING_SCANNER', status_message: 'Mock: finding scanner', last_status_update: new Date() });
            });
            if (!ok) return;

            setTimeout(async () => {
                const ok2 = await mockStep(jobId, 'SCANNING', startTime, async () => {
                    await db.updateJob(jobId, { status: 'SCANNING', status_message: 'Mock: scanning document', last_status_update: new Date() });
                });
                if (!ok2) return;

                setTimeout(async () => {
                    const ok3 = await mockStep(jobId, 'PRINTING', startTime, async () => {
                        await db.transitionJobState(jobId, 'PRINTING', { message: 'Mock: printing copies' });
                    });
                    if (!ok3) return;

                    setTimeout(async () => {
                        await mockStep(jobId, 'COMPLETED', startTime, async (latestJob) => {
                            const copies = latestJob.metadata?.copies || 1;
                            await db.transitionJobState(jobId, 'COMPLETED', {
                                message: 'Mock: xerox completed',
                                pages_printed: copies
                            });
                        });
                    }, MOCK_COMPLETE_DELAY_MS - MOCK_STEP_DELAY_MS * 1.5);

                }, MOCK_STEP_DELAY_MS * 0.5);

            }, MOCK_STEP_DELAY_MS * 0.5);

        }, MOCK_STEP_DELAY_MS * 0.5);
    }
}


// ===============================
// Poll for Jobs (Pi Agent)
// ===============================
router.get('/jobs/poll', async (req, res) => {

    const { kiosk_id } = req.query;

    if (!kiosk_id) {
        return res.status(400).json({ error: 'kiosk_id required' });
    }

    try {

        // Auto-upsert mock kiosk on first poll
        if (TEST_KIOSK_ID && kiosk_id === TEST_KIOSK_ID) {
            await db.query(`
                INSERT INTO kiosks (id, hostname, printer_name, status, last_seen, printer_status)
                VALUES ($1, 'mock', 'mock_printer', 'online', NOW(), 'healthy')
                ON CONFLICT (id) DO UPDATE SET
                    status = 'online',
                    last_seen = NOW()
            `, [TEST_KIOSK_ID]);
        }

        const result = await db.query(`
            UPDATE jobs
            SET status = 'SENT_TO_PI',
                queued_at = NOW(),
                last_status_update = NOW()
            WHERE id = (
                SELECT id
                FROM jobs
                WHERE kiosk_id = $1
                AND status = 'PAID'
                AND (
                    metadata->>'retry_after' IS NULL
                    OR (metadata->>'retry_after')::bigint <= $2
                )
                ORDER BY created_at
                LIMIT 1
                FOR UPDATE SKIP LOCKED
            )
            RETURNING *
        `, [kiosk_id, Date.now()]);

        if (result.rows.length === 0) {
            return res.json({ jobs: [] });
        }

        const job = result.rows[0];
        log.job(`${job.id} | claimed by kiosk: ${kiosk_id}`);

        res.json({
            jobs: [{
                job_id: job.id,
                filename: job.filename,
                pages: job.pages,
                job_type: job.job_type,
                download_url: `/api/jobs/${job.id}/download`,
                scan_options: job.scan_options || null,
                metadata: job.metadata || null
            }]
        });

        // Start mock simulation AFTER response is sent
        if (TEST_KIOSK_ID && kiosk_id === TEST_KIOSK_ID) {
            log.info(`[MOCK] ${job.id} | Starting mock simulation for ${job.job_type} job`);
            startMockSimulation(job, Date.now());
        }

    } catch (err) {
        log.error('[JOB] ERROR | route: /api/jobs/poll | reason: ' + err.message);
        res.status(500).json({ error: 'Poll failed' });
    }

});


// ===============================
// Download Job File (Pi Agent)
// ===============================
router.get('/jobs/:job_id/download', async (req, res) => {

    const { job_id } = req.params;

    try {

        const job = await db.getJob(job_id);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        if (!fs.existsSync(job.file_path)) {
            log.error(`[JOB] ${job_id} | ERROR | route: /api/jobs/${job_id}/download | reason: File missing at ${job.file_path}`);
            return res.status(404).json({ error: 'File missing' });
        }

        res.download(job.file_path, job.filename);

    } catch (error) {
        log.error(`[JOB] ${job_id} | ERROR | route: /api/jobs/${job_id}/download | reason: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});


// ===============================
// Create Scan Job
// ===============================
router.post('/jobs/scan', verifyToken, async (req, res) => {

    try {

        const { kiosk_id, scan_options } = req.body;

        if (!kiosk_id) {
            return res.status(400).json({ error: 'kiosk_id required' });
        }

        // Check kiosk is online and reachable
        const kiosk = await db.getKiosk(kiosk_id);
        if (!kiosk || kiosk.status !== 'online') {
            return res.status(503).json({ error: 'Kiosk is offline or not found' });
        }

        const kioskSocket = socketManager.getKioskSocket(kiosk_id);
        if (!kioskSocket) {
            return res.status(503).json({ error: 'Kiosk is not connected. Please try again.' });
        }

        if (!req.user.isGuest) {
            await ensureUserExists(db, req.user);
        }

        const jobId = generateJobId();
        const metadata = req.user.isGuest
            ? { guest: true, guestId: req.user.guestId }
            : {};

        await db.createJob({
            id: jobId,
            user_id: req.user.isGuest ? null : req.user.uid,
            kiosk_id,
            job_type: 'scan',
            filename: `scan_${Date.now()}.pdf`,
            file_path: '',
            file_size: 0,
            pages: 1,
            price_per_page: 0,
            total_cost: 5,
            status: 'QUEUED',
            scan_options: scan_options || {},
            metadata
        });

        const scanUserId = req.user.isGuest ? 'guest:' + req.user.guestId : 'user:' + req.user.uid;
        log.job(`${jobId} | SCAN | QUEUED | ${scanUserId}`);

        kioskSocket.emit('scan_job', {
            job_id: jobId,
            scan_options: scan_options || {}
        });

        res.json({
            job_id: jobId,
            status: 'QUEUED'
        });

    } catch (error) {
        log.error('[JOB] ERROR | route: /api/jobs/scan | reason: ' + error.message);
        res.status(500).json({ error: error.message });
    }
});


// ===============================
// Create Xerox (Photocopy) Job
// ===============================
router.post('/jobs/xerox', verifyToken, async (req, res) => {

    try {

        const { kiosk_id, copies, scan_options } = req.body;

        if (!kiosk_id) {
            return res.status(400).json({ error: 'kiosk_id required' });
        }

        // Check kiosk is online and reachable
        const kiosk = await db.getKiosk(kiosk_id);
        if (!kiosk || kiosk.status !== 'online') {
            return res.status(503).json({ error: 'Kiosk is offline or not found' });
        }

        const numCopies = Math.max(1, Math.min(parseInt(copies) || 1, 20));

        if (!req.user.isGuest) {
            await ensureUserExists(db, req.user);
        }

        const XEROX_PRICE_PER_COPY = 5;
        const totalCost = numCopies * XEROX_PRICE_PER_COPY;
        const jobId = generateJobId();

        const metadata = req.user.isGuest
            ? { copies: numCopies, scan_options: scan_options || {}, guest: true, guestId: req.user.guestId }
            : { copies: numCopies, scan_options: scan_options || {} };

        await db.createJob({
            id: jobId,
            user_id: req.user.isGuest ? null : req.user.uid,
            kiosk_id,
            job_type: 'xerox',
            filename: `xerox_${Date.now()}.pdf`,
            file_path: '',
            file_size: 0,
            pages: numCopies,
            price_per_page: XEROX_PRICE_PER_COPY,
            total_cost: totalCost,
            status: 'PENDING',
            payment_status: 'pending',
            metadata
        });

        res.json({
            job_id: jobId,
            copies: numCopies,
            price_per_copy: XEROX_PRICE_PER_COPY,
            total_cost: totalCost,
            currency: 'INR'
        });

    } catch (error) {
        log.error('[JOB] ERROR | route: /api/jobs/xerox | reason: ' + error.message);
        res.status(500).json({ error: 'Failed to create xerox job' });
    }
});


// ===============================
// Upload Scan Result
// ===============================
router.post('/jobs/:job_id/scan-upload', upload.single('file'), async (req, res) => {

    try {

        const { job_id } = req.params;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const downloadURL =
            `${process.env.BACKEND_URL}/api/jobs/${job_id}/download`;

        await db.updateJob(job_id, {
            status: 'COMPLETED',
            output_file_url: downloadURL,
            file_path: req.file.path,
            file_size: req.file.size
        });

        log.job(`${job_id} | scan uploaded | size: ${Math.round(req.file.size / 1024)}kb`);

        res.json({
            success: true,
            download_url: downloadURL
        });

    } catch (error) {
        log.error(`[JOB] ${req.params.job_id} | ERROR | route: /api/jobs/${req.params.job_id}/scan-upload | reason: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;