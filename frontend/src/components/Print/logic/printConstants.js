// Session storage key for active job recovery
export const SESSION_KEY = 'juspri_active_jobs';
export const MAX_JOBS = 5;

// Matches backend JOB_TIMEOUT_MS in tasks.js (15 * 60 * 1000)
export const PENDING_JOB_EXPIRY_MINUTES = 15;

// Navigation step flow for the step indicator
export const NAV_STEPS = [
    { id: 'SERVICE_SELECT', label: 'Select' },
    { id: 'UPLOAD',         label: 'Upload' },
    { id: 'CONFIRM',        label: 'Confirm' },
    { id: 'PAYMENT',        label: 'Pay' },
    { id: 'STATUS',         label: 'Status' },
];

// Map viewStatus values → canonical nav step id
export const VIEW_TO_NAV_STEP = {
    'SELECTING_KIOSK':   null,  // No nav step shown during kiosk selection
    'SERVICE_SELECT':    'SERVICE_SELECT',
    'CONNECTED':         'UPLOAD',
    'SCAN_OPTIONS':      'UPLOAD',
    'XEROX_OPTIONS':     'UPLOAD',
    'CALCULATING':       'CONFIRM',
    'SETTINGS_PREVIEW':  'CONFIRM',
    'PAYMENT':           'PAYMENT',
    'PRINTING':          'STATUS',
    'SCANNING':          'STATUS',
    'XEROXING':          'STATUS',
    'COMPLETED':         'STATUS',
    'SCAN_COMPLETE':     'STATUS',
    'ERROR':             'STATUS',
    'FAILED':            'STATUS',
    'KIOSK_READY':       'SERVICE_SELECT',
};

export function saveSession(data) {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch {}
}

export function loadSession() {
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

export function clearSession() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
}
