// backend/modules/kiosk-routes.js
// Phase 1: Smart Printer Verification
// PUBLIC endpoint - called right after QR scan, no auth needed

const express = require('express');
const router = express.Router();

/**
 * GET /api/kiosk/status?kiosk_id=xxx
 *
 * Returns printer status stored from the pi-agent's last heartbeat.
 * Three possible outcomes:
 *   - healthy       → Printer idle/processing, safe to proceed
 *   - error         → Printer has known issue (no paper, offline), hard block
 *   - unknown       → Pi-agent didn't report IPP status, soft warning
 *
 * PUBLIC - no auth required (called before user uploads anything)
 */
router.get('/status', async (req, res) => {
    const { kiosk_id } = req.query;

    // Validate input
    if (!kiosk_id || typeof kiosk_id !== 'string') {
        return res.status(400).json({
            error: 'kiosk_id is required',
            printer_status: 'unknown'
        });
    }

    try {
        const db = req.app.get('db');

        // Test kiosk — always online, no DB lookup needed
        const testKioskId = process.env.TEST_KIOSK_ID || null;
        if (testKioskId && kiosk_id === testKioskId) {
            try {
                const allowPublic = await db.getSetting('allow_public_test_kiosk', false);
                
                return res.json({
                    kiosk_id: testKioskId,
                    kiosk_online: true,
                    kiosk_location_name: 'System Test Lab',
                    kiosk_floor: 'M',
                    printer_status: 'healthy',
                    printer_status_detail: null,
                    current_paper_count: 999,
                    restricted: !allowPublic,  // Mock kiosk restricted if setting is false
                    message: allowPublic ? 'Mock kiosk — Public access enabled.' : 'Mock kiosk — Admin access only.'
                });
            } catch (err) {
                console.error('[KIOSK] Error fetching settings for test kiosk: ' + err.message);
                // Default to restricted if setting fetch fails
                return res.json({
                    kiosk_id: testKioskId,
                    kiosk_online: true,
                    kiosk_location_name: 'System Test Lab',
                    kiosk_floor: 'M',
                    printer_status: 'healthy',
                    printer_status_detail: null,
                    current_paper_count: 999,
                    restricted: true,
                    message: 'Mock kiosk — Admin access only.'
                });
            }
        }

        // Fetch kiosk record from DB
        const result = await db.query(
            `SELECT 
                id,
                status,
                printer_name,
                printer_status,
                printer_status_detail,
                last_status_check,
                last_seen,
                current_paper_count
             FROM kiosks 
             WHERE id = $1`,
            [kiosk_id]
        );

        // Kiosk not found at all
        if (result.rows.length === 0) {
            return res.status(404).json({
                kiosk_id,
                kiosk_online: false,
                printer_status: 'unknown',
                printer_status_detail: 'kiosk_not_registered',
                message: 'Kiosk not found. Make sure the pi-agent is running.'
            });
        }

        const kiosk = result.rows[0];

        // Check if kiosk itself is online
        // Consider offline if last heartbeat was > 2 minutes ago
        const lastSeen = kiosk.last_seen ? new Date(kiosk.last_seen) : null;
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        const kioskOnline = lastSeen && lastSeen > twoMinutesAgo && kiosk.status === 'online';

        if (!kioskOnline) {
            return res.json({
                kiosk_id,
                kiosk_online: false,
                printer_status: 'error',
                printer_status_detail: 'kiosk_offline',
                message: 'This kiosk appears to be offline.',
                last_seen: kiosk.last_seen
            });
        }

        // Kiosk is online - return printer status from last heartbeat
        return res.json({
            kiosk_id,
            kiosk_online: true,
            printer_name: kiosk.printer_name,
            printer_status: kiosk.printer_status || 'unknown',
            printer_status_detail: kiosk.printer_status_detail || null,
            last_status_check: kiosk.last_status_check,
            current_paper_count: kiosk.current_paper_count,
            message: buildStatusMessage(kiosk.printer_status, kiosk.printer_status_detail)
        });

    } catch (err) {
        console.error('[Kiosk Status] DB error:', err.message);
        // On DB error, return unknown so user gets soft warning, not hard block
        return res.json({
            kiosk_id,
            kiosk_online: true,
            printer_status: 'unknown',
            printer_status_detail: 'db_error',
            message: 'Could not verify printer status.'
        });
    }
});

/**
 * Build a human-readable message from status codes
 */
function buildStatusMessage(printerStatus, detail) {
    if (printerStatus === 'healthy') {
        return 'Printer is ready.';
    }

    if (printerStatus === 'error') {
        const errorMessages = {
            'media-empty':      'Printer is out of paper.',
            'media-low':        'Printer paper is running low.',
            'toner-empty':      'Printer is out of toner/ink.',
            'cover-open':       'Printer cover is open.',
            'offline':          'Printer is offline.',
            'kiosk_offline':    'This kiosk appears to be offline.',
            'stopped':          'Printer has stopped. Please contact staff.'
        };
        return errorMessages[detail] || 'Printer has an error. Please contact staff.';
    }

    // unknown
    return 'Printer status could not be verified automatically.';
}


/**
 * GET /api/kiosks/public
 * 
 * Returns a list of all kiosks currently online, with their locations for the map.
 * PUBLIC - no auth required.
 */
router.get('/public', async (req, res) => {
    try {
        const db = req.app.get('db');
        const testKioskId = process.env.TEST_KIOSK_ID || 'kiosk_test';
        
        // Fetch all kiosks that were seen in the last 10 minutes
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        
        const result = await db.query(`
            SELECT 
                id,
                location_name,
                status,
                printer_status,
                printer_status_detail,
                latitude,
                longitude,
                current_paper_count,
                last_seen
            FROM kiosks
            WHERE (status = 'online' AND last_seen > $1)
               OR id = $2
            ORDER BY location_name ASC
        `, [tenMinutesAgo, testKioskId]);

        const kiosks = result.rows.map(k => ({
            id: k.id,
            location_name: k.location_name || (k.id === testKioskId ? 'System Test Lab' : 'Unnamed Kiosk'),
            status: k.status,
            printer_status: k.printer_status,
            printer_status_detail: k.printer_status_detail,
            latitude: k.latitude ? parseFloat(k.latitude) : null,
            longitude: k.longitude ? parseFloat(k.longitude) : null,
            current_paper_count: k.current_paper_count,
            is_online: k.id === testKioskId || (k.last_seen && new Date(k.last_seen) > tenMinutesAgo)
        }));

        res.json({ kiosks });
    } catch (err) {
        console.error('[Public Kiosks] DB error:', err.message);
        res.status(500).json({ error: 'Failed to fetch kiosks' });
    }
});

module.exports = router;
