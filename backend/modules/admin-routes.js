const express = require('express');
const router = express.Router();
const log = require('./logger');

// Database & Auth Imports
const db = require('../db');
const { verifyToken } = require('../auth-middleware');
const { requireAdmin, logAdminAction } = require('../middleware/admin-auth');

// ==================== PUBLIC ROUTES ====================

// Public Status
router.get('/status', async (req, res) => {
    try {
        const stats = await db.getStats();
        res.json({
            server: 'online',
            database: 'connected',
            auth: 'firebase',
            model: 'pull-based',
            kiosks: stats.onlineKiosks,
            jobs_pending: stats.pendingJobs,
            jobs_printing: stats.printingJobs,
            jobs_completed: stats.completedJobs
        });
    } catch (error) {
        log.error('[ADMIN] ERROR | route: /api/status | reason: ' + error.message);
        res.status(500).json({ error: 'Failed to get status' });
    }
});

router.post('/connect', async (req, res) => {
    try {
        const stats = await db.getStats();
        res.json({
            ok: true,
            message: 'Backend reachable',
            kiosks: stats.onlineKiosks
        });
    } catch (err) {
        log.error('[ADMIN] ERROR | route: /api/connect | reason: ' + err.message);
        res.status(503).json({ error: 'Service unavailable' });
    }
});

// ==================== ADMIN DASHBOARD METRICS ====================

/**
 * GET /admin/metrics
 * Returns overall system statistics for the dashboard
 */
router.get('/admin/metrics', verifyToken, requireAdmin, async (req, res) => {
    try {
        // NOTE: This assumes your db module has a .query() method. 
        // If not, you may need to export the pool from your db module.
        
        // Get metrics from the system_metrics view
        const metricsResult = await db.query('SELECT * FROM system_metrics');
        const metrics = metricsResult.rows[0] || {
            total_jobs: 0,
            completed_jobs: 0,
            failed_jobs: 0,
            total_revenue: 0,
            total_pages_printed: 0,
            success_rate: 0
        };

        // Get today's stats
        const todayResult = await db.query(`
            SELECT 
                COUNT(id) as jobs_today,
                COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_cost ELSE 0 END), 0) as revenue_today,
                COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN pages ELSE 0 END), 0) as pages_today
            FROM jobs 
            WHERE created_at >= CURRENT_DATE
        `);
        const today = todayResult.rows[0];

        res.json({
            overall: {
                totalRevenue: parseFloat(metrics.total_revenue || 0),
                totalPages: parseInt(metrics.total_pages_printed || 0),
                totalJobs: parseInt(metrics.total_jobs || 0),
                completedJobs: parseInt(metrics.completed_jobs || 0),
                failedJobs: parseInt(metrics.failed_jobs || 0),
                successRate: parseFloat(metrics.success_rate || 0)
            },
            today: {
                jobs: parseInt(today.jobs_today || 0),
                revenue: parseFloat(today.revenue_today || 0),
                pages: parseInt(today.pages_today || 0)
            }
        });

    } catch (error) {
        log.error('[ADMIN] ERROR | route: /api/admin/metrics | reason: ' + error.message);
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

// ==================== KIOSK MANAGEMENT ====================

/**
 * GET /admin/kiosks
 * Returns real-time status of all kiosks with paper counts and revenue
 */
router.get('/admin/kiosks', verifyToken, requireAdmin, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                k.id,
                k.hostname,
                k.printer_name,
                k.status,
                k.printer_status,
                k.printer_status_detail,
                k.current_paper_count,
                k.last_seen,
                k.uptime,
                k.location_name,
                k.printer_brand,
                k.printer_driver,
                -- Today's stats for this kiosk
                COUNT(j.id) FILTER (WHERE j.created_at >= CURRENT_DATE) as jobs_today,
                COALESCE(
                    SUM(j.total_cost) FILTER (
                        WHERE j.created_at >= CURRENT_DATE 
                        AND j.payment_status = 'paid'
                    ), 0
                ) as revenue_today,
                -- Current active job
                (
                    SELECT j2.id FROM jobs j2 
                    WHERE j2.kiosk_id = k.id 
                    AND j2.status IN ('PRINTING', 'QUEUED')
                    ORDER BY j2.created_at DESC 
                    LIMIT 1
                ) as current_job_id
            FROM kiosks k
            LEFT JOIN jobs j ON k.id = j.kiosk_id
            GROUP BY k.id, k.hostname, k.printer_name, k.status, 
                     k.printer_status, k.printer_status_detail,
                     k.current_paper_count, k.last_seen, k.uptime, k.location_name,
                     k.printer_brand, k.printer_driver
            ORDER BY k.id
        `);

        const kiosks = result.rows.map(k => ({
            id: k.id,
            name: k.hostname,
            hostname: k.hostname,
            locationName: k.location_name || null,
            printerName: k.printer_name,
            status: k.status,
            printerStatus: k.printer_status,
            printerStatusDetail: k.printer_status_detail,
            paperCount: parseInt(k.current_paper_count || 0),
            paperLevel: getPaperLevel(k.current_paper_count),
            lastSeen: k.last_seen,
            uptime: k.uptime ? Math.floor(k.uptime) : 0,
            isOnline: isKioskOnline(k.last_seen, k.status),
            jobsToday: parseInt(k.jobs_today || 0),
            revenueToday: parseFloat(k.revenue_today || 0),
            currentJobId: k.current_job_id,
            printerBrand: k.printer_brand || null,
            printerDriver: k.printer_driver || null
        }));

        res.json({ kiosks });

    } catch (error) {
        log.error('[ADMIN] ERROR | route: /api/admin/kiosks | reason: ' + error.message);
        res.status(500).json({ error: 'Failed to fetch kiosk data' });
    }
});

/**
 * POST /admin/kiosks/:id/set-paper
 * Admin can set custom paper count for a kiosk
 */
router.post('/admin/kiosks/:id/set-paper', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id: kioskId } = req.params;
        const { paperCount } = req.body;

        // Validate input
        if (typeof paperCount !== 'number' || paperCount < 0 || paperCount > 1000) {
            return res.status(400).json({ 
                error: 'Invalid paper count',
                message: 'Paper count must be between 0 and 1000' 
            });
        }

        // Get current value for audit log
        const current = await db.query(
            'SELECT current_paper_count FROM kiosks WHERE id = $1',
            [kioskId]
        );

        if (current.rows.length === 0) {
            return res.status(404).json({ error: 'Kiosk not found' });
        }

        const oldCount = current.rows[0].current_paper_count;

        // Update paper count
        await db.query(
            'UPDATE kiosks SET current_paper_count = $1 WHERE id = $2',
            [paperCount, kioskId]
        );

        // Log admin action (using req.user or req.adminUser depending on your auth setup)
        const adminId = req.user ? req.user.uid : 'system';
        await logAdminAction(
            adminId,
            'SET_PAPER_COUNT',
            'kiosk',
            kioskId,
            { oldCount, newCount: paperCount }
        );

        log.info(`[ADMIN] ${adminId} | SET_PAPER_COUNT | target: ${kioskId} (${oldCount} → ${paperCount})`);

        res.json({ 
            success: true, 
            kioskId, 
            oldCount, 
            newCount: paperCount 
        });

    } catch (error) {
        log.error('[ADMIN] ERROR | route: /api/admin/kiosks/:id/set-paper | reason: ' + error.message);
        res.status(500).json({ error: 'Failed to update paper count' });
    }
});

/**
 * PATCH /admin/kiosks/:id
 * Update kiosk settings (e.g., location_name)
 */
router.patch('/admin/kiosks/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { id: kioskId } = req.params;
        const { location_name } = req.body;

        if (location_name !== undefined) {
            await db.query(
                'UPDATE kiosks SET location_name = $1, updated_at = NOW() WHERE id = $2',
                [location_name || null, kioskId]
            );
        }

        const adminId = req.user ? req.user.uid : 'system';
        await logAdminAction(
            adminId,
            'UPDATE_KIOSK',
            'kiosk',
            kioskId,
            { location_name }
        );

        log.info(`[ADMIN] ${adminId} | UPDATE_KIOSK | target: ${kioskId}`);

        res.json({ success: true, kioskId });
    } catch (error) {
        log.error('[ADMIN] ERROR | route: /api/admin/kiosks/:id | reason: ' + error.message);
        res.status(500).json({ error: 'Failed to update kiosk' });
    }
});

// ==================== JOB MANAGEMENT ====================

/**
 * GET /admin/jobs
 * Filterable job list
 */
router.get('/admin/jobs', verifyToken, requireAdmin, async (req, res) => {
    const { status, kiosk_id } = req.query;
    try {
        const filters = {};
        if (status) filters.status = status;
        if (kiosk_id) filters.kiosk_id = kiosk_id;
        filters.limit = 100;
        
        const jobs = await db.getJobs(filters);
        res.json({ jobs: jobs, total: jobs.length });
    } catch (error) {
        log.error('[ADMIN] ERROR | route: /api/admin/jobs | reason: ' + error.message);
        res.status(500).json({ error: 'Failed to get jobs' });
    }
});

/**
 * GET /admin/recent-jobs
 * Detailed recent job feed with user info and privacy masking
 */
router.get('/admin/recent-jobs', verifyToken, requireAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;

        const result = await db.query(`
            SELECT 
                j.id,
                j.filename,
                j.pages,
                j.total_cost,
                j.status,
                j.payment_status,
                j.created_at,
                j.print_completed_at,
                j.error_message,
                j.kiosk_id,
                j.user_id,
                j.job_type,
                j.metadata,
                k.hostname as kiosk_name,
                k.location_name as kiosk_location,
                u.email as user_email,
                u.name as user_name
            FROM jobs j
            LEFT JOIN kiosks k ON j.kiosk_id = k.id
            LEFT JOIN users u ON j.user_id = u.id
            ORDER BY j.created_at DESC
            LIMIT $1
        `, [limit]);

        const jobs = result.rows.map(j => {
            // Determine user display info
            let userEmail, isGuestJob = false, guestId = null;
            if (j.user_id === null || j.user_id === undefined) {
                const meta = j.metadata || {};
                isGuestJob = !!meta.guest;
                guestId = meta.guestId || null;
                userEmail = 'Guest';
            } else {
                userEmail = j.user_email ? maskEmail(j.user_email) : 'Unknown';
            }

            return {
                id: j.id,
                filename: j.filename,
                pages: j.pages,
                totalCost: parseFloat(j.total_cost),
                status: j.status,
                paymentStatus: j.payment_status,
                createdAt: j.created_at,
                completedAt: j.print_completed_at,
                errorMessage: j.error_message,
                kioskId: j.kiosk_id,
                kioskName: j.kiosk_location || j.kiosk_name,
                jobType: j.job_type || 'print',
                userEmail,
                userName: j.user_name,
                isGuest: isGuestJob,
                guestId,
            };
        });

        res.json({ jobs });

    } catch (error) {
        log.error('[ADMIN] ERROR | route: /api/admin/recent-jobs | reason: ' + error.message);
        res.status(500).json({ error: 'Failed to fetch recent jobs' });
    }
});

// ==================== SYSTEM SETTINGS ====================

/**
 * GET /admin/settings
 * Returns all system settings
 */
router.get('/admin/settings', verifyToken, requireAdmin, async (req, res) => {
    try {
        const result = await db.query('SELECT key, value FROM settings');
        const settings = {};
        result.rows.forEach(row => {
            settings[row.key] = row.value;
        });
        res.json({ settings });
    } catch (error) {
        log.error('[ADMIN] ERROR | route: /api/admin/settings | reason: ' + error.message);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

/**
 * POST /admin/settings
 * Update a specific system setting
 */
router.post('/admin/settings', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { key, value } = req.body;

        if (!key) {
            return res.status(400).json({ error: 'Setting key is required' });
        }

        // Get old value for logging
        const oldValue = await db.getSetting(key);
        
        // Update setting
        const newValue = await db.updateSetting(key, value);

        // Log admin action
        const adminId = req.user ? req.user.uid : 'system';
        await logAdminAction(
            adminId,
            'UPDATE_SETTING',
            'system',
            key,
            { oldValue, newValue }
        );

        log.info(`[ADMIN] ${adminId} | UPDATE_SETTING | key: ${key} (${JSON.stringify(oldValue)} → ${JSON.stringify(newValue)})`);

        res.json({ success: true, key, value: newValue });
    } catch (error) {
        log.error('[ADMIN] ERROR | route: /api/admin/settings | reason: ' + error.message);
        res.status(500).json({ error: 'Failed to update setting' });
    }
});

// ==================== HELPERS ====================

// Helper: Determine paper level category
function getPaperLevel(count) {
    if (!count) return 'empty';
    if (count >= 300) return 'high';
    if (count >= 100) return 'medium';
    if (count > 0) return 'low';
    return 'empty';
}

// Helper: Check if kiosk is online (last seen within 2 minutes)
function isKioskOnline(lastSeen, status) {
    if (status !== 'online') return false;
    if (!lastSeen) return false;
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    return new Date(lastSeen) > twoMinutesAgo;
}

// Helper: Mask email for privacy (show first 3 chars + ***)
function maskEmail(email) {
    if (!email) return 'Unknown';
    const [name, domain] = email.split('@');
    if (name.length <= 3) return email;
    return `${name.substring(0, 3)}***@${domain}`;
}

module.exports = router;