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
    // 3. Core Helper Functions
    // ==========================================

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
        }));

        setJobs(recoveredJobs);
        setActiveJobIndex(saved.activeJobIndex || 0);
        addLog('Reconnecting to active job(s)...');
    }, [addLog]);

    // Auto-connect if kiosk_id is in the URL (skip if recovering active job)
    useEffect(() => {
        const saved = loadSession();
        if (saved?.jobs?.length) return;

        const params = new URLSearchParams(window.location.search);
        const kioskIdFromUrl = params.get('kiosk_id');
        const location = params.get('location');
        const floor = params.get('floor');

        if (kioskIdFromUrl) {
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
        }
    }, [addLog, checkKioskStatus]);

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

            setConfig(printerData);
            setViewStatus('SCANNED');
            checkKioskStatus(printerData.kiosk_id);

        } catch (err) {
            addLog('Invalid QR format');
            setScannerActive(true);
        }
    }, [addLog, setConfig, checkKioskStatus]);

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
            setViewStatus('CONNECTED');
            addLog('Selected: Print');
        } else if (type === 'scan') {
            setViewStatus('SCAN_OPTIONS');
            addLog('Selected: Scan');
        } else if (type === 'xerox') {
            setViewStatus('XEROX_OPTIONS');
            addLog('Selected: Xerox (Photocopy)');
        }
    }, [addLog]);

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

        try {
            const headers = await buildHeaders();
            const response = await axios.post(`${API_URL}/api/jobs/scan`, {
                kiosk_id: config.kiosk_id,
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
    }, [config, scanOptions, API_URL, addLog, buildHeaders, signOut, isGuest, canCreateJob, isLastJob, incrementJobCount, jobs.length]);

    // ---- Xerox Job ----

    const handleXeroxStart = useCallback(async () => {
        if (isGuest && !canCreateJob) {
            addLog('Guest job limit reached (3/day). Sign in for unlimited access.');
            setViewStatus('ERROR');
            return;
        }

        addLog(`Creating xerox job (${xeroxCopies} copies)...`);

        try {
            const headers = await buildHeaders();
            const response = await axios.post(`${API_URL}/api/jobs/xerox`, {
                kiosk_id: config.kiosk_id,
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
    }, [config, xeroxCopies, scanOptions, API_URL, addLog, buildHeaders, signOut, isGuest, canCreateJob, isLastJob, incrementJobCount, jobs.length]);

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

        setViewStatus('CALCULATING');
        addLog(`Creating job for ${selectedFile.name}...`);

        const fd = new FormData();
        fd.append('file', selectedFile);
        fd.append('kiosk_id', config.kiosk_id);
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
    }, [config, API_URL, addLog, buildHeaders, signOut, isGuest, canCreateJob, isLastJob, incrementJobCount, jobs.length]);

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
        // Don't exceed max
        if (jobs.length >= MAX_JOBS) return;
        // Guests capped at 1
        if (isGuest) return;

        setViewStatus('SERVICE_SELECT');
        setScanOptions({ resolution: 300, colorMode: 'RGB24' });
        setXeroxCopies(1);
        addLog('Adding another job...');
    }, [jobs.length, isGuest, addLog]);

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
