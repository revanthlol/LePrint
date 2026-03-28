import { useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    saveSession,
    loadSession,
    clearSession,
    PENDING_JOB_EXPIRY_MINUTES
} from './printConstants';
import { createJobEntry } from './jobFactory';

export function useJobPoller({
    jobs,
    setJobs,
    activeJobIndex,
    setActiveJobIndex,
    config,
    addLog,
    buildHeaders,
    API_URL,
    notifyJobStatus,
    notifyAllComplete,
    signOut,
    isGuest,
    // State setters (usePrint owns the state, we just update it):
    setPrinterStatusResult,
    setShowExpiryModal,
    setConfig,
    setScannerActive,
    setViewStatus,
    sessionKioskIdRef, // useRef
    initialUrlProcessedRef, // useRef
    recoveryAttemptedRef, // useRef
    updateJob, // helper from usePrint
}) {

    // ─── Helper: Connect to printer ───────────────────────────
    const connectPrinterAfterStatusCheck = useCallback(async (kioskId) => {
        try {
            setViewStatus('CONNECTING');
            addLog(`Connecting to kiosk ${kioskId}...`);

            const headers = await buildHeaders();
            const response = await axios.post(`${API_URL}/api/connect`, {
                kiosk_id: kioskId
            }, { 
                headers,
                timeout: 5000 
            });

            if (response.data.status === 'connected') {
                setViewStatus('SERVICE_SELECT');
                addLog(`✓ Connected to "${response.data.kiosk_name || kioskId}"`);
                
                // Ensure config knows where we are
                setConfig(prev => ({ 
                    ...prev, 
                    kiosk_id: kioskId,
                    location: response.data.kiosk_location_name || prev?.location,
                    floor: response.data.kiosk_floor || prev?.floor
                }));
            }
        } catch (e) {
            setViewStatus('ERROR');
            addLog('✗ Kiosk offline or not found');
        }
    }, [API_URL, addLog, setViewStatus]);

    // ─── Helper: Check Kiosk Status ──────────────────────────
    const checkKioskStatus = useCallback(async (kioskId) => {
        try {
            setViewStatus('CHECKING_STATUS');
            addLog(`Checking kiosk status...`);

            const headers = await buildHeaders();
            const response = await axios.get(
                `${API_URL}/api/kiosk/status`,
                {
                    params: { kiosk_id: kioskId },
                    headers,
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

            if (printerStatus === 'healthy' || printerStatus === 'ready') {
                addLog('✓ Printer ready');
                setViewStatus('KIOSK_READY');
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
    }, [API_URL, addLog, connectPrinterAfterStatusCheck, setPrinterStatusResult, setViewStatus]);

    // ─── Save active jobs to sessionStorage for refresh recovery 
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

    // ─── Recover active jobs from sessionStorage on mount ─────
    useEffect(() => {
        if (recoveryAttemptedRef.current) return;
        recoveryAttemptedRef.current = true;

        const saved = loadSession();
        if (!saved?.jobs?.length) return;

        // Restore state
        setConfig({ kiosk_id: saved.kiosk_id });
        sessionKioskIdRef.current = saved.kiosk_id;
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
    }, [addLog, setConfig, sessionKioskIdRef, setScannerActive, setJobs, setActiveJobIndex, recoveryAttemptedRef]);

    // ─── Auto-connect if kiosk_id is in the URL ───────────────
    useEffect(() => {
        const saved = loadSession();
        if (saved?.jobs?.length) return;

        const params = new URLSearchParams(window.location.search);
        const kioskIdFromUrl = params.get('kiosk_id');
        const location = params.get('location');
        const floor = params.get('floor');

        if (!kioskIdFromUrl) return;

        if (!initialUrlProcessedRef.current) {
            initialUrlProcessedRef.current = true;
            sessionKioskIdRef.current = kioskIdFromUrl;

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

        if (kioskIdFromUrl !== sessionKioskIdRef.current) {
            if (jobs.length === 0) {
                sessionKioskIdRef.current = kioskIdFromUrl;
                setConfig({
                    kiosk_id: kioskIdFromUrl,
                    location: location,
                    floor: floor
                });
                setViewStatus('SCANNED');
                addLog(`Auto-scanned: ${kioskIdFromUrl}`);
                checkKioskStatus(kioskIdFromUrl);
            }
        }
    }, [addLog, checkKioskStatus, jobs.length, initialUrlProcessedRef, sessionKioskIdRef, setConfig, setScannerActive, setViewStatus]);

    // ─── Status polling for all in-flight jobs ────────────────
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
                        updateJob(job.jobId, { jobPhase: jobStatus });
                    }
                } catch (e) {}
            }
        }, 3000);

        return () => clearInterval(pollInterval);
    }, [jobs, API_URL, addLog, buildHeaders, notifyJobStatus, updateJob]);

    // ─── Clear session when all jobs complete ─────────────────
    useEffect(() => {
        const allJobsDone = jobs.length > 0 && jobs.every(j => 
            ['COMPLETED', 'SCAN_COMPLETE', 'FAILED', 'ERROR'].includes(j.status)
        );

        if (allJobsDone && jobs.length > 0) {
            clearSession();
            const succeeded = jobs.filter(j => j.success === true).length;
            const failed = jobs.filter(j => j.success === false).length;
            if (jobs.length > 1) {
                notifyAllComplete(jobs.length, succeeded, failed);
            }
        }
    }, [jobs, notifyAllComplete]);

    // ─── Job Expiry Tracking ──────────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setJobs(prev => {
                let changed = false;
                const updated = prev.map(j => {
                    if (j.expiresAt && !j.locallyExpired && now > j.expiresAt) {
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
        }, 30000);

        return () => clearInterval(interval);
    }, [setJobs]);

    // ─── Show expiry modal when a job becomes locally expired ──
    useEffect(() => {
        const expiredJob = jobs.find(j => j.locallyExpired);
        if (expiredJob) {
            setShowExpiryModal(expiredJob.jobId);
        }
    }, [jobs, setShowExpiryModal]);

    // ─── Remove locally expired jobs after 30s ────────────────
    useEffect(() => {
        const expiredJobs = jobs.filter(j => j.locallyExpired);
        if (expiredJobs.length === 0) return;

        const timers = expiredJobs.map(j => {
            return setTimeout(() => {
                setJobs(prev => prev.filter(pj => pj.jobId !== j.jobId));
                setActiveJobIndex(prev => {
                    const remaining = jobs.filter(pj => pj.jobId !== j.jobId);
                    if (prev >= remaining.length) return Math.max(0, remaining.length - 1);
                    return prev;
                });
            }, 30000);
        });

        return () => timers.forEach(t => clearTimeout(t));
    }, [jobs, setJobs, setActiveJobIndex]);

    return {
        checkKioskStatus,
        connectPrinterAfterStatusCheck
    };
}
