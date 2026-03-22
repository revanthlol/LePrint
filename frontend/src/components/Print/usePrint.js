import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthProvider';
import { useGuest } from '../GuestContext';
import {
    API_URL,
    ALLOWED_FILE_TYPES,
    ALLOWED_EXTENSIONS,
    getFileExt
} from './printUtils';

// Session storage key for active job recovery
const SESSION_KEY = 'juspri_active_job';

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

export function usePrint() {
    const { signOut, getAuthHeader, getGuestHeaders } = useAuth();
    const { isGuest, canCreateJob, isLastJob, incrementJobCount, guestId } = useGuest();

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
    const [status, setStatus] = useState('IDLE');
    const [config, setConfig] = useState(null);
    const [file, setFile] = useState(null);
    const [pricing, setPricing] = useState(null);
    const [logs, setLogs] = useState([]);
    const [cameraError, setCameraError] = useState(null);
    const [scannerActive, setScannerActive] = useState(true);
    const [printerStatusResult, setPrinterStatusResult] = useState(null);

    // Scan & Xerox state
    const [serviceType, setServiceType] = useState('print');
    const [scanResult, setScanResult] = useState(null);
    const [jobPhase, setJobPhase] = useState(null); // Backend status for progress display
    const [scanOptions, setScanOptions] = useState({
        resolution: 300,
        colorMode: 'RGB24'
    });
    const [xeroxCopies, setXeroxCopies] = useState(1);

    const addLog = useCallback((msg) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);
    }, []);

    // Track whether we've already tried session recovery (prevent double-fire)
    const recoveryAttempted = useRef(false);

    // ==========================================
    // 2. Core Helper Functions
    // (Moved UP so they exist before they are called)
    // ==========================================

    // Helper: Connect to printer (used by status check and manual connect)
    const connectPrinterAfterStatusCheck = useCallback(async (kioskId) => {
        try {
            setStatus('CONNECTING');
            addLog(`Connecting to kiosk ${kioskId}...`);

            const response = await axios.post(`${API_URL}/api/connect`, {
                kiosk_id: kioskId
            }, { timeout: 5000 });

            if (response.data.status === 'connected') {
                setStatus('SERVICE_SELECT');
                addLog(`✓ Connected to "${response.data.kiosk_name || kioskId}"`);
                addLog(`Printer: ${response.data.printer || 'Unknown'}`);
            }
        } catch (e) {
            setStatus('ERROR');
            addLog('✗ Kiosk offline or not found');
        }
    }, [API_URL, addLog]);

    // Helper: Check Kiosk Status
    // MOVED UP: Must be defined before handleScan and useEffect
    const checkKioskStatus = useCallback(async (kioskId) => {
        try {
            setStatus('CHECKING_STATUS');
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
                // Kiosk is completely offline → hard block
                setStatus('SCANNED'); // Stay on connect screen with error
                addLog('✗ Kiosk is offline');
                return;
            }

            if (printerStatus === 'healthy') {
                // All good → go straight to connect → connected
                addLog('✓ Printer ready');
                await connectPrinterAfterStatusCheck(kioskId);
                return;
            }

            if (printerStatus === 'error') {
                // Known printer error → hard block
                setStatus('PRINTER_ERROR');
                addLog(`✗ Printer error: ${result.printer_status_detail || 'unknown'}`);
                return;
            }

            // status === 'unknown' → soft warning, let user decide
            setStatus('PRINTER_WARNING');
            addLog('⚠ Printer status unverified');

        } catch (err) {
            // Network error reaching backend → treat as unknown, soft warning
            addLog('⚠ Could not reach status check, proceeding with warning');
            setPrinterStatusResult({ printer_status: 'unknown', kiosk_online: true });
            setStatus('PRINTER_WARNING');
        }
    }, [API_URL, addLog, connectPrinterAfterStatusCheck]);

    // ==========================================
    // 3. Effects (Now safe to define)
    // ==========================================

    // Save active job to sessionStorage for refresh recovery
    useEffect(() => {
        const activeStatuses = ['PRINTING', 'SCANNING', 'XEROXING'];
        if (activeStatuses.includes(status) && pricing?.job_id && config?.kiosk_id) {
            saveSession({
                job_id: pricing.job_id,
                serviceType,
                kiosk_id: config.kiosk_id,
                status
            });
        }
    }, [status, pricing?.job_id, serviceType, config?.kiosk_id]);

    // Recover active job from sessionStorage on mount
    useEffect(() => {
        if (recoveryAttempted.current) return;
        recoveryAttempted.current = true;

        const saved = loadSession();
        if (!saved?.job_id) return;

        // Restore state for polling
        setConfig({ kiosk_id: saved.kiosk_id });
        setServiceType(saved.serviceType || 'print');
        setPricing({ job_id: saved.job_id });
        setScannerActive(false);

        if (saved.serviceType === 'scan') {
            setStatus('SCANNING');
        } else if (saved.serviceType === 'xerox') {
            setStatus('XEROXING');
        } else {
            setStatus('PRINTING');
        }

        addLog('Reconnecting to active job...');
    }, [addLog]);

    // Auto-connect if kiosk_id is in the URL (skip if recovering active job)
    useEffect(() => {
        // Don't auto-connect if we just recovered an active job
        const saved = loadSession();
        if (saved?.job_id) return;

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
            setStatus('SCANNED');
            setScannerActive(false);

            addLog(`Auto-scanned: ${kioskIdFromUrl}`);
            if (location) addLog(`Location: ${location}, Floor: ${floor || 'N/A'}`);

            // This call was causing the error before. Now it works.
            checkKioskStatus(kioskIdFromUrl);
        }
    }, [addLog, checkKioskStatus]);

    // Status polling for print/scan/xerox jobs
    useEffect(() => {
        const pollStatuses = ['PRINTING', 'SCANNING', 'XEROXING'];
        if (!pricing?.job_id || !pollStatuses.includes(status)) return;

        const pollInterval = setInterval(async () => {
            try {
                const headers = await buildHeaders();
                const response = await axios.get(`${API_URL}/api/jobs/${pricing.job_id}/status`, {
                    headers
                });
                const jobStatus = response.data.status;

                // Track backend phase for progress display (xerox: SCANNING → PRINTING)
                setJobPhase(jobStatus);

                if (jobStatus === 'COMPLETED') {
                    clearSession();
                    if (serviceType === 'scan') {
                        // Fetch the download URL for scan result
                        setScanResult({
                            downloadUrl: `${API_URL}/api/jobs/${pricing.job_id}/download`
                        });
                        setStatus('SCAN_COMPLETE');
                    } else {
                        setStatus('COMPLETED');
                    }
                    clearInterval(pollInterval);
                } else if (jobStatus === 'FAILED' || jobStatus === 'CANCELLED') {
                    clearSession();
                    setStatus('ERROR');
                    clearInterval(pollInterval);
                    addLog(`Job failed: ${response.data.error_message || 'Unknown error'}`);
                }

            } catch (e) {
                // Poll error — silent retry
            }
        }, 3000);

        return () => clearInterval(pollInterval);
    }, [pricing?.job_id, status, serviceType, API_URL, addLog, buildHeaders]);

    // ==========================================
    // 4. Handlers
    // ==========================================

    const handleScan = useCallback((detectedCodes) => {
        // ZXing sometimes sends undefined / empty arrays
        if (!Array.isArray(detectedCodes) || detectedCodes.length === 0) {
            return;
        }

        const code = detectedCodes[0];
        const rawValue = code?.rawValue;

        // Extra guard
        if (!rawValue || typeof rawValue !== 'string') {
            setScannerActive(true);
            return;
        }

        // Stop scanner once we have *something*
        setScannerActive(false);

        try {
            let printerData = {};

            // 1️⃣ URL QR (recommended)
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
            // 2️⃣ JSON QR
            else if (rawValue.trim().startsWith('{')) {
                const parsed = JSON.parse(rawValue);
                printerData = {
                    kiosk_id: parsed.kiosk_id || parsed.ip || 'default_kiosk',
                    ...parsed,
                };
                addLog(`✅ QR Decoded: Kiosk ${printerData.kiosk_id}`);
            }
            // 3️⃣ Plain text QR
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
            setStatus('SCANNED');

            // This call was also causing errors. Now it works.
            checkKioskStatus(printerData.kiosk_id);

        } catch (err) {
            addLog('Invalid QR format');
            setScannerActive(true);
        }
    }, [addLog, setConfig, setStatus, checkKioskStatus]);

    const handleScanError = useCallback((error) => {
        setCameraError(
            'Camera not available. Allow permissions or use manual entry.'
        );
        setScannerActive(false);
    }, []);

    // Manual connect button handler (if used in UI)
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
        setStatus('IDLE');
        setConfig(null);
        setPrinterStatusResult(null);
        setScannerActive(true);
        addLog('Ready to scan');
    }, [addLog]);

    // ---- Service Selection ----

    const selectService = useCallback((type) => {
        setServiceType(type);
        if (type === 'print') {
            setStatus('CONNECTED');
            addLog('Selected: Print');
        } else if (type === 'scan') {
            setStatus('SCAN_OPTIONS');
            addLog('Selected: Scan');
        } else if (type === 'xerox') {
            setStatus('XEROX_OPTIONS');
            addLog('Selected: Xerox (Photocopy)');
        }
    }, [addLog]);

    // ---- Scan Job ----

    const handleScanStart = useCallback(async () => {
        // Guest job limit check
        if (isGuest && !canCreateJob) {
            addLog('Guest job limit reached (3/day). Sign in for unlimited access.');
            setStatus('ERROR');
            return;
        }

        // Guest scan warning (one-time per device)
        if (isGuest) {
            try {
                const warned = localStorage.getItem('leprint_guest_scan_warned');
                if (!warned) {
                    // The UI layer should show this as a modal — for now we log and set the flag
                    localStorage.setItem('leprint_guest_scan_warned', '1');
                    addLog('⚠ Guest scan: download link expires when you close this tab.');
                }
            } catch {}
        }

        setStatus('SCANNING');
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
            setPricing({ job_id, totalPrice: 5 });
            addLog(`Scan job created: ${job_id}`);
            addLog('Scanning in progress...');

            // Increment guest job count
            if (isGuest) incrementJobCount();
            if (isGuest && isLastJob) addLog('⚠ This is your last guest job today. Sign in for unlimited access.');

        } catch (e) {
            if (e.response?.status === 401) {
                addLog('Session expired. Please log in again.');
                if (!isGuest) await signOut();
                return;
            }

            setStatus('ERROR');
            addLog(`Scan error: ${e.response?.data?.error || e.message}`);
        }
    }, [config, scanOptions, API_URL, addLog, buildHeaders, signOut, isGuest, canCreateJob, isLastJob, incrementJobCount]);

    // ---- Xerox Job ----

    const handleXeroxStart = useCallback(async () => {
        // Guest job limit check
        if (isGuest && !canCreateJob) {
            addLog('Guest job limit reached (3/day). Sign in for unlimited access.');
            setStatus('ERROR');
            return;
        }

        setStatus('XEROXING');
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

            setPricing({ job_id, totalPrice: total_cost });
            addLog(`Xerox job created & paid: ₹${total_cost}`);
            addLog('Scanning & printing in progress...');

            // Increment guest job count
            if (isGuest) incrementJobCount();
            if (isGuest && isLastJob) addLog('⚠ This is your last guest job today. Sign in for unlimited access.');

        } catch (e) {
            if (e.response?.status === 401) {
                addLog('Session expired. Please log in again.');
                if (!isGuest) await signOut();
                return;
            }

            setStatus('ERROR');
            addLog(`Xerox error: ${e.response?.data?.error || e.message}`);
        }
    }, [config, xeroxCopies, scanOptions, API_URL, addLog, buildHeaders, signOut, isGuest, canCreateJob, isLastJob, incrementJobCount]);

    // ---- Existing Print Handlers ----

    const handleFileSelect = useCallback(async (selectedFile) => {
        if (!selectedFile) return;

        // Guest job limit check
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

        setFile(selectedFile);
        setStatus('CALCULATING');
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
            setPricing({
                job_id,
                pages,
                pricePerPage: price_per_page,
                totalPrice: total_cost
            });
            setStatus('PAYMENT');
            addLog(`Job created: ${pages} pages × ₹${price_per_page} = ₹${total_cost}`);

            // Increment guest job count after successful creation
            if (isGuest) incrementJobCount();
            if (isGuest && isLastJob) addLog('⚠ This is your last guest job today. Sign in for unlimited access.');

        } catch (e) {
            if (e.response?.status === 401) {
                addLog('Session expired. Please log in again.');
                if (!isGuest) await signOut();
                return;
            }

            setStatus('ERROR');
            addLog(`Error: ${e.response?.data?.error || e.message}`);
        }
    }, [config, API_URL, addLog, buildHeaders, signOut, isGuest, canCreateJob, isLastJob, incrementJobCount]);

    const handlePayment = useCallback(async () => {
        setStatus('PRINTING');
        addLog('Processing payment...');

        try {
            const headers = await buildHeaders();

            await axios.post(
                `${API_URL}/api/jobs/${pricing.job_id}/verify-payment`,
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

            setStatus('ERROR');
            addLog(`Payment failed: ${e.response?.data?.error || e.message}`);
        }
    }, [pricing, API_URL, addLog, buildHeaders, signOut, isGuest]);

    const resetFlow = useCallback(() => {
        clearSession();
        setStatus('IDLE');
        setConfig(null);
        setFile(null);
        setPricing(null);
        setPrinterStatusResult(null);
        setScannerActive(true);
        setServiceType('print');
        setScanResult(null);
        setXeroxCopies(1);
        addLog('Reset to scanner');
    }, [addLog]);

    const printAnotherOnSameKiosk = useCallback(() => {
        clearSession();
        setStatus('SERVICE_SELECT');
        setFile(null);
        setPricing(null);
        setServiceType('print');
        setScanResult(null);
        setXeroxCopies(1);
        addLog('Ready for next job');
    }, [addLog]);

    const backToServiceSelect = useCallback(() => {
        clearSession();
        setStatus('SERVICE_SELECT');
        setFile(null);
        setPricing(null);
        setScanResult(null);
        setXeroxCopies(1);
        addLog('Back to service selection');
    }, [addLog]);

    // ==========================================
    // 5. Return
    // ==========================================
    return {
        // State
        status,
        config,
        file,
        pricing,
        logs,
        cameraError,
        scannerActive,
        printerStatusResult,
        serviceType,
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

        // Setters
        setStatus,
        setFile,
        setPricing,
        setScannerActive,
        setCameraError,
        setScanOptions,
        setXeroxCopies
    };
}
