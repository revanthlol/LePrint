/**
 * Job entry factory
 * Creates a standard job object used across the multi-job flow.
 */
export function createJobEntry(overrides = {}) {
    return {
        jobId: null,
        jobType: 'print',   // 'print' | 'scan' | 'xerox'
        status: 'IDLE',
        statusMessage: null,
        filename: null,
        pages: null,
        createdAt: new Date(),
        completedAt: null,
        success: null,
        downloadUrl: null,
        // Internal state per job
        pricing: null,
        jobPhase: null,
        scanResult: null,
        serviceType: 'print',
        file: null,
        kiosk_id: null,
        // Print settings
        printSettings: {
            colorMode: 'bw',
            orientation: 'portrait',
            copies: 1,
            pageRange: 'all',
            scaling: 'fit',
        },
        // Navigation stack
        navStack: [],
        // Expiry tracking
        expiresAt: null,
        locallyExpired: false,
        ...overrides
    };
}
