import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthProvider';
import { useGuest } from '../GuestContext';
import { useNotifications } from '../NotificationProvider';
import {
    API_URL,
    ALLOWED_FILE_TYPES,
    ALLOWED_EXTENSIONS,
    getFileExt
} from './printUtils';

// ─── Constants ──────────────────────────────────────────────
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
const VIEW_TO_NAV_STEP = {
    'SERVICE_SELECT': 'SERVICE_SELECT',
    'CONNECTED':      'UPLOAD',
    'SCAN_OPTIONS':   'UPLOAD',
    'XEROX_OPTIONS':  'UPLOAD',
    'CALCULATING':    'CONFIRM',
    'PAYMENT':        'PAYMENT',
    'PRINTING':       'STATUS',
    'SCANNING':       'STATUS',
    'XEROXING':       'STATUS',
    'COMPLETED':      'STATUS',
    'SCAN_COMPLETE':  'STATUS',
    'ERROR':          'STATUS',
    'FAILED':         'STATUS',
};

// Session storage key for active job recovery
const SESSION_KEY = 'juspri_active_jobs';
const MAX_JOBS = 5;

function saveSession(data) {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch {}
}

function loadSession() {
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function clearSession() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
}

// ─── Job entry factory ──────────────────────────────────────
function createJobEntry(overrides = {}) {
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
        // Navigation stack
        navStack: [],
        // Expiry tracking
        expiresAt: null,
        locallyExpired: false,
        ...overrides
    };
}

export function usePrint() {
    const { signOut, getAuthHeader, getGuestHeaders } = useAuth();
    const { isGuest, canCreateJob, isLastJob, incrementJobCount, guestId } = useGuest();
    const { notifyJobStatus, notifyAllComplete } = useNotifications();

    // Helper: build request headers (works for both auth and guest)
    const buildHeaders = useCallback(async () => {
        const authHeader = await getAuthHeader();
        if (authHeader) return { 'Authorization': authHeader };

        // Guest fallback
        const guestHeaders = getGuestHeaders();
        if (guestHeaders) return guestHeaders;

        return {};
    }, [getAuthHeader, getGuestHeaders]);

    // ==========================================
    // 1. State
    // ==========================================

    // Multi-job state
    const [jobs, setJobs] = useState([]);
    const [activeJobIndex, setActiveJobIndex] = useState(0);

    // Shared pre-submission state (kiosk connection, scanner, etc.)
    const [config, setConfig] = useState(null);
    const [logs, setLogs] = useState([]);
    const [cameraError, setCameraError] = useState(null);
    const [scannerActive, setScannerActive] = useState(true);
    const [printerStatusResult, setPrinterStatusResult] = useState(null);

    // Pre-submission options (shared — applies to the job being configured)
    const [scanOptions, setScanOptions] = useState({
        resolution: 300,
        colorMode: 'RGB24'
    });
    const [xeroxCopies, setXeroxCopies] = useState(1);

    // "View" status — controls which screen is shown
    // When no job is active or being configured, this drives the UI
    const [viewStatus, setViewStatus] = useState('IDLE');

    // Modal state
    const [showBackConfirmModal, setShowBackConfirmModal] = useState(false);
    const [showExpiryModal, setShowExpiryModal] = useState(null); // jobId or null

    // Scan kiosk mode (Bug 4)
    const [scanKioskMode, setScanKioskMode] = useState(false);

    // Kiosk session decoupling (Task 5)
    const sessionKioskId = useRef(null);
    const [newKioskId, setNewKioskId] = useState(null);
    const initialUrlProcessed = useRef(false);

    // Derived: current active job (or null)
    const activeJob = useMemo(() => jobs[activeJobIndex] || null, [jobs, activeJobIndex]);

    // Derived: effective status for UI rendering
    const status = useMemo(() => {
        if (activeJob) {
            // If the active job has a real in-flight status, show that
            const jobStatus = activeJob.status;
            if (['PRINTING', 'SCANNING', 'XEROXING', 'COMPLETED', 'SCAN_COMPLETE', 'ERROR', 'PAYMENT', 'CALCULATING'].includes(jobStatus)) {
                return jobStatus;
            }
        }
        return viewStatus;
    }, [activeJob, viewStatus]);

    // Derived: current canonical nav step
    const currentNavStep = useMemo(() => {
        return VIEW_TO_NAV_STEP[status] || null;
    }, [status]);

    // Derived: current nav step index (for step indicator)
    const currentNavStepIndex = useMemo(() => {
        if (!currentNavStep) return -1;
        return NAV_STEPS.findIndex(s => s.id === currentNavStep);
    }, [currentNavStep]);

    // Derived: can go back?
    const canGoBack = useMemo(() => {
        // Pre-job screens: always allow back to SERVICE_SELECT
        const preJobScreens = ['CONNECTED', 'SCAN_OPTIONS', 'XEROX_OPTIONS'];
        if (preJobScreens.includes(viewStatus) && (!activeJob || !activeJob.jobId)) {
            return true;
        }
        // Post-job-creation screens
        if (!activeJob) return false;
        if (activeJob.navStack.length === 0) return false;
        const blocked = ['COMPLETED', 'SCAN_COMPLETE', 'FAILED'];
        if (blocked.includes(activeJob.status)) return false;
        if (['PRINTING', 'SCANNING', 'XEROXING'].includes(activeJob.status)) return false;
        return true;
    }, [activeJob, viewStatus]);

    // Derived: are all jobs done?
    const allJobsDone = useMemo(() => {
        if (jobs.length === 0) return false;
        return jobs.every(j => j.status === 'COMPLETED' || j.status === 'SCAN_COMPLETE' || j.status === 'FAILED' || j.status === 'ERROR');
    }, [jobs]);

    // Derived: file & pricing from active job for backward compat
    const file = activeJob?.file || null;
    const pricing = activeJob?.pricing || null;
    const scanResult = activeJob?.scanResult || null;
    const jobPhase = activeJob?.jobPhase || null;
    const serviceType = activeJob?.serviceType || viewStatus === 'SCAN_OPTIONS' ? 'scan' : viewStatus === 'XEROX_OPTIONS' ? 'xerox' : 'print';

    // Track the active job's service type for views that need it
    const activeServiceType = activeJob?.jobType || 'print';

    const addLog = useCallback((msg) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);
    }, []);

    // Track whether we've already tried session recovery (prevent double-fire)
    const recoveryAttempted = useRef(false);

    // ==========================================
    // 2. Job Array Helpers
    // ==========================================

    const updateJob = useCallback((jobId, updates) => {
        setJobs(prev => prev.map(j =>
            j.jobId === jobId ? { ...j, ...updates } : j
        ));
    }, []);

    const addJob = useCallback((entry) => {
        setJobs(prev => {
            const newJobs = [...prev, createJobEntry(entry)];
            return newJobs;
        });
    }, []);

    // ==========================================
    // 2b. Navigation Helpers
    // ==========================================

    // Push current viewStatus onto active job's navStack, then set new step
    const navigateTo = useCallback((newViewStatus) => {
        if (activeJob && activeJob.jobId) {
            // Push current status onto navStack
            setJobs(prev => prev.map(j =>
                j.jobId === activeJob.jobId
                    ? { ...j, navStack: [...j.navStack, viewStatus] }
                    : j
            ));
        }
        setViewStatus(newViewStatus);
    }, [activeJob, viewStatus]);

    // Go back one step
    const goBack = useCallback(() => {
        // Pre-job screens: just go back to SERVICE_SELECT
        const preJobScreens = ['CONNECTED', 'SCAN_OPTIONS', 'XEROX_OPTIONS'];
        if (preJobScreens.includes(status) && (!activeJob || !activeJob.jobId)) {
            setViewStatus('SERVICE_SELECT');
            return;
        }

        if (!activeJob || activeJob.navStack.length === 0) return;

        // Block if paid/completed/failed/in-flight
        const blocked = ['COMPLETED', 'SCAN_COMPLETE', 'FAILED', 'PRINTING', 'SCANNING', 'XEROXING'];
        if (blocked.includes(activeJob.status)) return;

        // If at PAYMENT screen → show confirmation modal
        if (status === 'PAYMENT') {
            setShowBackConfirmModal(true);
            return;
        }

        // Otherwise → pop and navigate
        const stack = [...activeJob.navStack];
        const prevStep = stack.pop();
        setJobs(prev => prev.map(j =>
            j.jobId === activeJob.jobId
                ? { ...j, navStack: stack }
                : j
        ));
        setViewStatus(prevStep || 'SERVICE_SELECT');
    }, [activeJob, status]);

    // Confirm going back from PAYMENT (called by modal)
    const confirmGoBack = useCallback(() => {
        if (!activeJob) return;
        const isBackingFromPayment = viewStatus === 'PAYMENT';

        const stack = [...activeJob.navStack];
        const prevStep = stack.pop();

        setJobs(prev => prev.map(j =>
            j.jobId === activeJob.jobId
                ? {
                    ...j,
                    navStack: stack,
                    // Only set expiry when backing out of PAYMENT specifically
                    ...(isBackingFromPayment ? {
                        expiresAt: Date.now() + (PENDING_JOB_EXPIRY_MINUTES * 60 * 1000)
                    } : {})
                }
                : j
        ));
        setViewStatus(prevStep || 'SERVICE_SELECT');
        setShowBackConfirmModal(false);
    }, [activeJob, viewStatus]);

    // ==========================================
    // 3. Core Helper Functions
    // ==========================================

    // Helper: get the current effective kiosk_id
    const getCurrentKioskId = useCallback(() => {
        return newKioskId || sessionKioskId.current || config?.kiosk_id;
    }, [newKioskId, config]);

    // Helper: Connect to printer (used by status check and manual connect)
    const connectPrinterAfterStatusCheck = useCallback(async (kioskId) => {
        try {
            setViewStatus('CONNECTING');
            addLog(`Connecting to kiosk ${kioskId}...`);

            const response = await axios.post(`${API_URL}/api/connect`, {
                kiosk_id: kioskId
            }, { timeout: 5000 });

            if (response.data.status === 'connected') {
                setViewStatus('SERVICE_SELECT');
                addLog(`✓ Connected to "${response.data.kiosk_name || kioskId}"`);
                addLog(`Printer: ${response.data.printer || 'Unknown'}`);
            }
        } catch (e) {
            setViewStatus('ERROR');
            addLog('✗ Kiosk offline or not found');
        }
    }, [API_URL, addLog]);

    // Helper: Check Kiosk Status
    const checkKioskStatus = useCallback(async (kioskId) => {
        try {
            setViewStatus('CHECKING_STATUS');
            addLog(`Checking kiosk status...`);

            const response = await axios.get(
                `${API_URL}/api/kiosk/status`,
                {
                    params: { kiosk_id: kioskId },
                    timeout: 8000
                }
            );

            const result = response.data;
            setPrinterStatusResult(result);

            const printerStatus = result.printer_status;

            addLog(`Kiosk: ${result.kiosk_online ? 'Online' : 'Offline'}`);
            addLog(`Printer: ${printerStatus}`);

            if (!result.kiosk_online) {
                setViewStatus('SCANNED');
                addLog('✗ Kiosk is offline');
                return;
            }

            if (printerStatus === 'healthy') {
                addLog('✓ Printer ready');
                await connectPrinterAfterStatusCheck(kioskId);
                return;
            }

            if (printerStatus === 'error') {
                setViewStatus('PRINTER_ERROR');
                addLog(`✗ Printer error: ${result.printer_status_detail || 'unknown'}`);
                return;
            }

            setViewStatus('PRINTER_WARNING');
            addLog('⚠ Printer status unverified');

        } catch (err) {
            addLog('⚠ Could not reach status check, proceeding with warning');
            setPrinterStatusResult({ printer_status: 'unknown', kiosk_online: true });
            setViewStatus('PRINTER_WARNING');
        }
    }, [API_URL, addLog, connectPrinterAfterStatusCheck]);

    // ==========================================
    // 4. Effects
    // ==========================================

    // Save active jobs to sessionStorage for refresh recovery
    useEffect(() => {
        const activeJobs = jobs.filter(j =>
            ['PRINTING', 'SCANNING', 'XEROXING'].includes(j.status) && j.jobId
        );
        if (activeJobs.length > 0 && config?.kiosk_id) {
            saveSession({
                jobs: activeJobs.map(j => ({
                    jobId: j.jobId,
                    serviceType: j.serviceType,
                    jobType: j.jobType,
                    status: j.status,
                    createdAt: j.createdAt,
                    filename: j.filename,
                    pages: j.pages,
                })),
                kiosk_id: config.kiosk_id,
                activeJobIndex
            });
        }
    }, [jobs, config?.kiosk_id, activeJobIndex]);

    // Recover active jobs from sessionStorage on mount
    useEffect(() => {
        if (recoveryAttempted.current) return;
        recoveryAttempted.current = true;

        const saved = loadSession();
        if (!saved?.jobs?.length) return;

        // Restore state
        setConfig({ kiosk_id: saved.kiosk_id });
        sessionKioskId.current = saved.kiosk_id;
        setScannerActive(false);

        const recoveredJobs = saved.jobs.map(j => createJobEntry({
            jobId: j.jobId,
            jobType: j.jobType,
            serviceType: j.serviceType,
            status: j.status,
            filename: j.filename,
            pages: j.pages,
            createdAt: new Date(j.createdAt),
            pricing: { job_id: j.jobId },
            kiosk_id: saved.kiosk_id,
        }));

        setJobs(recoveredJobs);
        setActiveJobIndex(saved.activeJobIndex || 0);
        addLog('Reconnecting to active job(s)...');
    }, [addLog]);

    // Auto-connect if kiosk_id is in the URL (skip if recovering active job)
    // Also handles kiosk decoupling (Task 5)
    useEffect(() => {
        const saved = loadSession();
        if (saved?.jobs?.length) return;

        const params = new URLSearchParams(window.location.search);
        const kioskIdFromUrl = params.get('kiosk_id');
        const location = params.get('location');
        const floor = params.get('floor');

        if (!kioskIdFromUrl) return;

        // First time processing URL
        if (!initialUrlProcessed.current) {
            initialUrlProcessed.current = true;
            sessionKioskId.current = kioskIdFromUrl;

            setConfig({
                kiosk_id: kioskIdFromUrl,
                location: location,
                floor: floor
            });
            setViewStatus('SCANNED');
            setScannerActive(false);

            addLog(`Auto-scanned: ${kioskIdFromUrl}`);
            if (location) addLog(`Location: ${location}, Floor: ${floor || 'N/A'}`);

            checkKioskStatus(kioskIdFromUrl);
            return;
        }

        // Subsequent URL changes — kiosk switch detection
        if (kioskIdFromUrl !== sessionKioskId.current) {
            if (jobs.length === 0) {
                // No active jobs — update session kiosk
                sessionKioskId.current = kioskIdFromUrl;
                setConfig({
                    kiosk_id: kioskIdFromUrl,
                    location: location,
                    floor: floor
                });
                setViewStatus('SCANNED');
                addLog(`Auto-scanned: ${kioskIdFromUrl}`);
                checkKioskStatus(kioskIdFromUrl);
            } else {
                // Active jobs exist — store new kiosk for next "+" job
                setNewKioskId(kioskIdFromUrl);
                addLog(`[Session] New kiosk detected: ${kioskIdFromUrl} — will apply to next job`);
            }
        }
    }, [addLog, checkKioskStatus, jobs.length]);

    // Status polling for all in-flight jobs
    useEffect(() => {
        const pollableJobs = jobs.filter(j =>
            ['PRINTING', 'SCANNING', 'XEROXING'].includes(j.status) && j.jobId
        );

        if (pollableJobs.length === 0) return;

        const pollInterval = setInterval(async () => {
            for (const job of pollableJobs) {
                try {
                    const headers = await buildHeaders();
                    const response = await axios.get(`${API_URL}/api/jobs/${job.jobId}/status`, {
                        headers
                    });
                    const jobStatus = response.data.status;

                    // Notify on transitions
                    if (job.jobPhase !== jobStatus) {
                        notifyJobStatus(jobStatus, job.jobId, job.jobType);
                    }

                    if (jobStatus === 'COMPLETED') {
                        const updates = {
                            status: job.jobType === 'scan' ? 'SCAN_COMPLETE' : 'COMPLETED',
                            jobPhase: jobStatus,
                            completedAt: new Date(),
                            success: true,
                        };
                        if (job.jobType === 'scan') {
                            updates.scanResult = {
                                downloadUrl: `${API_URL}/api/jobs/${job.jobId}/download`
                            };
                            updates.downloadUrl = `${API_URL}/api/jobs/${job.jobId}/download`;
                        }
                        updateJob(job.jobId, updates);
                    } else if (jobStatus === 'FAILED' || jobStatus === 'CANCELLED') {
                        updateJob(job.jobId, {
                            status: 'ERROR',
                            jobPhase: jobStatus,
                            completedAt: new Date(),
                            success: false,
                        });
                        addLog(`Job failed: ${response.data.error_message || 'Unknown error'}`);
                    } else {
                        // Update phase for progress display
                        updateJob(job.jobId, { jobPhase: jobStatus });
                    }
                } catch (e) {
                    // Poll error — silent retry
                }
            }
        }, 3000);

        return () => clearInterval(pollInterval);
    }, [jobs, API_URL, addLog, buildHeaders, notifyJobStatus, updateJob]);

    // Clear session when all jobs complete
    useEffect(() => {
        if (allJobsDone && jobs.length > 0) {
            clearSession();
            // Fire summary notification
            const succeeded = jobs.filter(j => j.success === true).length;
            const failed = jobs.filter(j => j.success === false).length;
            if (jobs.length > 1) {
                notifyAllComplete(jobs.length, succeeded, failed);
            }
        }
    }, [allJobsDone, jobs, notifyAllComplete]);

    // ─── Job Expiry Tracking (Task 4) ───────────────────────────
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setJobs(prev => {
                let changed = false;
                const updated = prev.map(j => {
                    if (j.expiresAt && !j.locallyExpired && now > j.expiresAt) {
                        // Only expire if still in a pre-payment state
                        const prePaid = ['IDLE', 'PAYMENT', 'CALCULATING', 'ERROR'].includes(j.status);
                        if (prePaid) {
                            changed = true;
                            return { ...j, locallyExpired: true };
                        }
                    }
                    return j;
                });
                return changed ? updated : prev;
            });
        }, 30000); // every 30 seconds

        return () => clearInterval(interval);
    }, []);

    // Show expiry modal when a job becomes locally expired
    useEffect(() => {
        const expiredJob = jobs.find(j => j.locallyExpired && !showExpiryModal);
        if (expiredJob) {
            setShowExpiryModal(expiredJob.jobId);
        }
    }, [jobs, showExpiryModal]);

    // Remove locally expired jobs after 30s
    useEffect(() => {
        const expiredJobs = jobs.filter(j => j.locallyExpired);
        if (expiredJobs.length === 0) return;

        const timers = expiredJobs.map(j => {
            return setTimeout(() => {
                setJobs(prev => prev.filter(pj => pj.jobId !== j.jobId));
                // If this was the active job, reset index
                setActiveJobIndex(prev => {
                    const remaining = jobs.filter(pj => pj.jobId !== j.jobId);
                    if (prev >= remaining.length) return Math.max(0, remaining.length - 1);
                    return prev;
                });
            }, 30000);
        });

        return () => timers.forEach(t => clearTimeout(t));
    }, [jobs]);

    // ==========================================
    // 5. Handlers
    // ==========================================

    const handleScan = useCallback((detectedCodes) => {
        if (!Array.isArray(detectedCodes) || detectedCodes.length === 0) {
            return;
        }

        const code = detectedCodes[0];
        const rawValue = code?.rawValue;

        if (!rawValue || typeof rawValue !== 'string') {
            setScannerActive(true);
            return;
        }

        setScannerActive(false);

        try {
            let printerData = {};

            if (rawValue.startsWith('http://') || rawValue.startsWith('https://')) {
                const url = new URL(rawValue);
                const kioskId = url.searchParams.get('kiosk_id');
                const location = url.searchParams.get('location');
                const floor = url.searchParams.get('floor');

                if (!kioskId) {
                    addLog('❌ QR URL missing kiosk_id');
                    setScannerActive(true);
                    return;
                }

                printerData = {
                    kiosk_id: kioskId,
                    location: location || undefined,
                    floor: floor || undefined,
                };

                addLog(`✅ QR Decoded: Kiosk ${kioskId}`);
                if (location) {
                    addLog(`📍 Location: ${location}${floor ? `, Floor ${floor}` : ''}`);
                }
            }
            else if (rawValue.trim().startsWith('{')) {
                const parsed = JSON.parse(rawValue);
                printerData = {
                    kiosk_id: parsed.kiosk_id || parsed.ip || 'default_kiosk',
                    ...parsed,
                };
                addLog(`✅ QR Decoded: Kiosk ${printerData.kiosk_id}`);
            }
            else {
                const value = rawValue.trim();
                printerData = {
                    kiosk_id: value,
                    ip: value,
                    port: 9100,
                };
                addLog(`✅ QR Decoded: Kiosk ${value}`);
            }

            // Handle kiosk switching (Task 5)
            if (jobs.length > 0 && sessionKioskId.current && printerData.kiosk_id !== sessionKioskId.current) {
                setNewKioskId(printerData.kiosk_id);
                addLog(`[Session] New kiosk detected: ${printerData.kiosk_id} — will apply to next job`);
                return;
            }

            sessionKioskId.current = printerData.kiosk_id;
            setConfig(printerData);
            setViewStatus('SCANNED');
            checkKioskStatus(printerData.kiosk_id);

        } catch (err) {
            addLog('Invalid QR format');
            setScannerActive(true);
        }
    }, [addLog, setConfig, checkKioskStatus, jobs.length]);

    const handleScanError = useCallback((error) => {
        setCameraError(
            'Camera not available. Allow permissions or use manual entry.'
        );
        setScannerActive(false);
    }, []);

    const connectPrinter = useCallback(async () => {
        if (config?.kiosk_id) {
            await connectPrinterAfterStatusCheck(config.kiosk_id);
        }
    }, [config, connectPrinterAfterStatusCheck]);

    const proceedDespiteWarning = useCallback(async () => {
        addLog('User acknowledged warning, proceeding...');
        if (config?.kiosk_id) {
            await connectPrinterAfterStatusCheck(config.kiosk_id);
        }
    }, [config, connectPrinterAfterStatusCheck, addLog]);

    const rescanQR = useCallback(() => {
        setViewStatus('IDLE');
        setConfig(null);
        setPrinterStatusResult(null);
        setScannerActive(true);
        addLog('Ready to scan');
    }, [addLog]);

    // ---- Service Selection ----

    const selectService = useCallback((type) => {
        if (type === 'print') {
            navigateTo('CONNECTED');
            addLog('Selected: Print');
        } else if (type === 'scan') {
            navigateTo('SCAN_OPTIONS');
            addLog('Selected: Scan');
        } else if (type === 'xerox') {
            navigateTo('XEROX_OPTIONS');
            addLog('Selected: Xerox (Photocopy)');
        }
    }, [addLog, navigateTo]);

    // ---- Scan Job ----

    const handleScanStart = useCallback(async () => {
        if (isGuest && !canCreateJob) {
            addLog('Guest job limit reached (3/day). Sign in for unlimited access.');
            setViewStatus('ERROR');
            return;
        }

        if (isGuest) {
            try {
                const warned = localStorage.getItem('leprint_guest_scan_warned');
                if (!warned) {
                    localStorage.setItem('leprint_guest_scan_warned', '1');
                    addLog('⚠ Guest scan: download link expires when you close this tab.');
                }
            } catch {}
        }

        addLog('Creating scan job...');

        const kioskId = getCurrentKioskId();

        try {
            const headers = await buildHeaders();
            const response = await axios.post(`${API_URL}/api/jobs/scan`, {
                kiosk_id: kioskId,
                scan_options: scanOptions
            }, {
                headers,
                timeout: 10000
            });

            const { job_id } = response.data;

            // Create job entry
            const newJob = createJobEntry({
                jobId: job_id,
                jobType: 'scan',
                serviceType: 'scan',
                status: 'SCANNING',
                filename: `scan_${Date.now()}.pdf`,
                createdAt: new Date(),
                pricing: { job_id, totalPrice: 5 },
                kiosk_id: kioskId,
                navStack: [viewStatus],
            });

            setJobs(prev => [...prev, newJob]);
            setActiveJobIndex(prev => jobs.length); // point to new job
            setViewStatus('SCANNING');

            addLog(`Scan job created: ${job_id}`);
            addLog('Scanning in progress...');

            if (isGuest) incrementJobCount();
            if (isGuest && isLastJob) addLog('⚠ This is your last guest job today. Sign in for unlimited access.');

        } catch (e) {
            if (e.response?.status === 401) {
                addLog('Session expired. Please log in again.');
                if (!isGuest) await signOut();
                return;
            }

            setViewStatus('ERROR');
            addLog(`Scan error: ${e.response?.data?.error || e.message}`);
        }
    }, [config, scanOptions, API_URL, addLog, buildHeaders, signOut, isGuest, canCreateJob, isLastJob, incrementJobCount, jobs.length, viewStatus, getCurrentKioskId]);

    // ---- Xerox Job ----

    const handleXeroxStart = useCallback(async () => {
        if (isGuest && !canCreateJob) {
            addLog('Guest job limit reached (3/day). Sign in for unlimited access.');
            setViewStatus('ERROR');
            return;
        }

        addLog(`Creating xerox job (${xeroxCopies} copies)...`);

        const kioskId = getCurrentKioskId();

        try {
            const headers = await buildHeaders();
            const response = await axios.post(`${API_URL}/api/jobs/xerox`, {
                kiosk_id: kioskId,
                copies: xeroxCopies,
                scan_options: scanOptions
            }, {
                headers,
                timeout: 10000
            });

            const { job_id, total_cost } = response.data;

            // Auto-pay for xerox (same as scan — mock payment)
            await axios.post(
                `${API_URL}/api/jobs/${job_id}/verify-payment`,
                { payment_id: 'mock_payment_' + Date.now() },
                { headers }
            );

            // Create job entry
            const newJob = createJobEntry({
                jobId: job_id,
                jobType: 'xerox',
                serviceType: 'xerox',
                status: 'XEROXING',
                filename: `xerox_${Date.now()}.pdf`,
                pages: xeroxCopies,
                createdAt: new Date(),
                pricing: { job_id, totalPrice: total_cost },
                kiosk_id: kioskId,
                navStack: [viewStatus],
            });

            setJobs(prev => [...prev, newJob]);
            setActiveJobIndex(prev => jobs.length);
            setViewStatus('XEROXING');

            addLog(`Xerox job created & paid: ₹${total_cost}`);
            addLog('Scanning & printing in progress...');

            if (isGuest) incrementJobCount();
            if (isGuest && isLastJob) addLog('⚠ This is your last guest job today. Sign in for unlimited access.');

        } catch (e) {
            if (e.response?.status === 401) {
                addLog('Session expired. Please log in again.');
                if (!isGuest) await signOut();
                return;
            }

            setViewStatus('ERROR');
            addLog(`Xerox error: ${e.response?.data?.error || e.message}`);
        }
    }, [config, xeroxCopies, scanOptions, API_URL, addLog, buildHeaders, signOut, isGuest, canCreateJob, isLastJob, incrementJobCount, jobs.length, viewStatus, getCurrentKioskId]);

    // ---- Print Handlers ----

    const handleFileSelect = useCallback(async (selectedFile) => {
        if (!selectedFile) return;

        if (isGuest && !canCreateJob) {
            addLog('Guest job limit reached (3/day). Sign in for unlimited access.');
            return;
        }

        const fileExt = getFileExt(selectedFile.name);

        if (!ALLOWED_FILE_TYPES.includes(selectedFile.type) && !ALLOWED_EXTENSIONS.includes(fileExt)) {
            alert(`⚠️ File type not supported. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
            return;
        }

        if (fileExt !== 'pdf') {
            addLog(`File will be converted to PDF before printing`);
        }

        navigateTo('CALCULATING');
        addLog(`Creating job for ${selectedFile.name}...`);

        const kioskId = getCurrentKioskId();

        const fd = new FormData();
        fd.append('file', selectedFile);
        fd.append('kiosk_id', kioskId);
        fd.append('job_type', 'print');

        try {
            const headers = await buildHeaders();

            const response = await axios.post(`${API_URL}/api/jobs/create`, fd, {
                timeout: 15000,
                headers
            });

            const { job_id, pages, price_per_page, total_cost } = response.data;

            // Create job entry in PAYMENT state
            const newJob = createJobEntry({
                jobId: job_id,
                jobType: 'print',
                serviceType: 'print',
                status: 'PAYMENT',
                filename: selectedFile.name,
                file: selectedFile,
                pages,
                createdAt: new Date(),
                pricing: {
                    job_id,
                    pages,
                    pricePerPage: price_per_page,
                    totalPrice: total_cost
                },
                kiosk_id: kioskId,
                navStack: ['SERVICE_SELECT', 'CONNECTED'],
            });

            setJobs(prev => [...prev, newJob]);
            setActiveJobIndex(prev => jobs.length);
            setViewStatus('PAYMENT');

            addLog(`Job created: ${pages} pages × ₹${price_per_page} = ₹${total_cost}`);

            if (isGuest) incrementJobCount();
            if (isGuest && isLastJob) addLog('⚠ This is your last guest job today. Sign in for unlimited access.');

        } catch (e) {
            if (e.response?.status === 401) {
                addLog('Session expired. Please log in again.');
                if (!isGuest) await signOut();
                return;
            }

            setViewStatus('ERROR');
            addLog(`Error: ${e.response?.data?.error || e.message}`);
        }
    }, [config, API_URL, addLog, buildHeaders, signOut, isGuest, canCreateJob, isLastJob, incrementJobCount, jobs.length, navigateTo, getCurrentKioskId]);

    const handlePayment = useCallback(async () => {
        if (!activeJob?.jobId) return;

        updateJob(activeJob.jobId, { status: 'PRINTING' });
        setViewStatus('PRINTING');
        addLog('Processing payment...');

        try {
            const headers = await buildHeaders();

            await axios.post(
                `${API_URL}/api/jobs/${activeJob.jobId}/verify-payment`,
                { payment_id: 'mock_payment_' + Date.now() },
                { headers }
            );

            addLog('Payment verified! Job sent to printer.');
        } catch (e) {
            if (e.response?.status === 401) {
                addLog('Session expired. Please log in again.');
                if (!isGuest) await signOut();
                return;
            }

            updateJob(activeJob.jobId, { status: 'ERROR', success: false, completedAt: new Date() });
            setViewStatus('ERROR');
            addLog(`Payment failed: ${e.response?.data?.error || e.message}`);
        }
    }, [activeJob, API_URL, addLog, buildHeaders, signOut, isGuest, updateJob]);

    const resetFlow = useCallback(() => {
        clearSession();
        setJobs([]);
        setActiveJobIndex(0);
        setViewStatus('IDLE');
        setConfig(null);
        setPrinterStatusResult(null);
        setScannerActive(true);
        setScanOptions({ resolution: 300, colorMode: 'RGB24' });
        setXeroxCopies(1);
        sessionKioskId.current = null;
        setNewKioskId(null);
        initialUrlProcessed.current = false;
        addLog('Reset to scanner');
    }, [addLog]);

    const printAnotherOnSameKiosk = useCallback(() => {
        clearSession();
        setViewStatus('SERVICE_SELECT');
        setScanOptions({ resolution: 300, colorMode: 'RGB24' });
        setXeroxCopies(1);
        addLog('Ready for next job');
    }, [addLog]);

    const backToServiceSelect = useCallback(() => {
        clearSession();
        setViewStatus('SERVICE_SELECT');
        setScanOptions({ resolution: 300, colorMode: 'RGB24' });
        setXeroxCopies(1);
        addLog('Back to service selection');
    }, [addLog]);

    // ---- Multi-job: Add another job ----
    const addAnotherJob = useCallback(() => {
        console.log('[DEBUG] addAnotherJob called, isGuest:', isGuest, 'jobs:', jobs.length);
        // Don't exceed max
        if (jobs.length >= MAX_JOBS) return;
        // Guests capped at 1
        if (isGuest === true) return;

        // Use newKioskId if available (Task 5), otherwise sessionKioskId
        const kioskForNewJob = newKioskId || sessionKioskId.current || config?.kiosk_id;

        // If no kiosk is known, activate scan kiosk mode instead
        if (!kioskForNewJob) {
            setScanKioskMode(true);
            return;
        }

        // Create new job entry and switch to it
        const newJob = createJobEntry({
            status: 'IDLE',
            kiosk_id: kioskForNewJob,
        });
        setJobs(prev => [...prev, newJob]);
        setActiveJobIndex(jobs.length); // point to the new entry (0-based)
        setViewStatus('SERVICE_SELECT');
        setScanOptions({ resolution: 300, colorMode: 'RGB24' });
        setXeroxCopies(1);

        if (newKioskId) {
            addLog(`Adding another job on kiosk ${newKioskId}...`);
            setNewKioskId(null); // consumed
        } else {
            addLog('Adding another job...');
        }
    }, [jobs.length, isGuest, addLog, newKioskId, config]);

    // ---- Scan Kiosk Mode: connect to scanned kiosk ----
    const handleScanKioskConnect = useCallback(async (kioskId) => {
        if (!kioskId) return;

        addLog(`Connecting to new kiosk: ${kioskId}...`);

        try {
            const response = await axios.post(`${API_URL}/api/connect`, {
                kiosk_id: kioskId
            }, { timeout: 5000 });

            if (response.data.status === 'connected') {
                // Update kiosk session
                setNewKioskId(kioskId);
                sessionKioskId.current = kioskId;
                setConfig(prev => ({ ...prev, kiosk_id: kioskId }));

                // Exit scan mode
                setScanKioskMode(false);
                setScanOptions({ resolution: 300, colorMode: 'RGB24' });
                setXeroxCopies(1);

                // Check if current active job is still IDLE (not yet submitted)
                const currentActiveJob = jobs[activeJobIndex];
                if (currentActiveJob && !currentActiveJob.jobId) {
                    // Reuse the existing IDLE job entry — just update its kiosk_id
                    setJobs(prev => prev.map((j, i) =>
                        i === activeJobIndex ? { ...j, kiosk_id: kioskId } : j
                    ));
                    setViewStatus('SERVICE_SELECT');
                } else {
                    // Active job already submitted — create a new job entry
                    const newJob = createJobEntry({ status: 'IDLE', kiosk_id: kioskId });
                    setJobs(prev => [...prev, newJob]);
                    setActiveJobIndex(jobs.length);
                    setViewStatus('SERVICE_SELECT');
                }

                addLog(`✓ Connected to "${response.data.kiosk_name || kioskId}"`);
                setNewKioskId(null); // consumed
            }
        } catch (e) {
            addLog(`✗ Failed to connect to ${kioskId}: ${e.message}`);
        }
    }, [API_URL, addLog, jobs, activeJobIndex]);

    // ---- Cancel a pending job ----
    const cancelJob = useCallback((jobIndex) => {
        const job = jobs[jobIndex];
        if (!job) return;
        // Only allow cancelling jobs that haven't been paid
        const cancellable = ['IDLE', 'PAYMENT', 'CALCULATING', 'ERROR'];
        if (!cancellable.includes(job.status)) return;

        setJobs(prev => {
            const filtered = prev.filter((_, i) => i !== jobIndex);
            // If no jobs left, reset to scanner
            if (filtered.length === 0) {
                setViewStatus('IDLE');
                setConfig(null);
                sessionKioskId.current = null;
            }
            return filtered;
        });

        // Adjust activeJobIndex
        setActiveJobIndex(prev => {
            if (jobIndex < prev) return prev - 1;
            if (jobIndex === prev) return Math.max(0, prev - 1);
            return prev;
        });

        addLog(`Job cancelled`);
    }, [jobs, addLog]);

    // ==========================================
    // 6. Return
    // ==========================================
    return {
        // Multi-job state
        jobs,
        activeJobIndex,
        setActiveJobIndex,
        activeJob,
        allJobsDone,

        // Backward-compatible single-job state
        status,
        config,
        file,
        pricing,
        logs,
        cameraError,
        scannerActive,
        printerStatusResult,
        serviceType: activeServiceType,
        scanResult,
        scanOptions,
        xeroxCopies,
        jobPhase,

        // Navigation
        canGoBack,
        goBack,
        currentNavStep,
        currentNavStepIndex,

        // Modals
        showBackConfirmModal,
        setShowBackConfirmModal,
        confirmGoBack,
        showExpiryModal,
        setShowExpiryModal,

        // Scan Kiosk Mode
        scanKioskMode,
        setScanKioskMode,
        handleScanKioskConnect,

        // Handlers
        handleScan,
        handleScanError,
        connectPrinter,
        handleFileSelect,
        handlePayment,
        resetFlow,
        printAnotherOnSameKiosk,
        checkKioskStatus,
        proceedDespiteWarning,
        rescanQR,
        selectService,
        handleScanStart,
        handleXeroxStart,
        backToServiceSelect,
        addAnotherJob,
        cancelJob,
        addLog,

        // Setters (backward compat)
        setStatus: setViewStatus,
        setFile: () => {}, // no-op — file is per-job now
        setPricing: () => {}, // no-op — pricing is per-job now
        setScannerActive,
        setCameraError,
        setScanOptions,
        setXeroxCopies,
    };
}
