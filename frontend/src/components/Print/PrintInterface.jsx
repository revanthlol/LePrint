// frontend/src/components/Print/PrintInterface.jsx
// Supports Print, Scan, and Xerox flows with multi-job tab switching.

import React, { useState, useEffect, Suspense } from 'react';
import { Printer, ChevronLeft, Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthProvider';
import { useGuest } from '../GuestContext';

import { usePrint } from './usePrint';
import { NAV_STEPS } from './logic/printConstants';
import { getFileExt, getFileIcon } from './printUtils';
import ZXingScanner from './ZXingScanner';

import { QRScannerView, StatusCheckView, ConnectView, KioskProfileView } from './views/ScannerViews';
import { PrinterErrorView, PrinterWarningView, JobErrorView } from './views/ErrorViews';
import { ServiceSelectView, FileUploadView } from './views/ServiceViews';
import { PrintSettingsView } from './views/SettingsView';
import { ScanOptionsView, ScanningView, ScanCompleteView, XeroxOptionsView, XeroxingView } from './views/ScanXeroxViews';
import { PaymentView, JobProgressView, CompletedView } from './views/ProgressViews';
import { AllJobsSummaryView } from './views/SummaryView';
import { BackConfirmModal, ExpiryModal, KioskChoiceModal } from './views/Modals';

// ─── Job Tab Bar ───────────────────────────────────────────
const JOB_ICONS = { print: '🖨️', scan: '📄', xerox: '📋' };
const JOB_LABELS = { print: 'Print', scan: 'Scan', xerox: 'Xerox' };

function StatusDot({ status }) {
  const isPending = ['PRINTING', 'SCANNING', 'XEROXING', 'PAYMENT', 'CALCULATING', 'IDLE'].includes(status);
  const isSuccess = ['COMPLETED', 'SCAN_COMPLETE'].includes(status);
  const isFailed = ['ERROR', 'FAILED'].includes(status);

  if (isPending) {
    return (
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
      </span>
    );
  }
  if (isSuccess) return <span className="inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />;
  if (isFailed) return <span className="inline-flex rounded-full h-2.5 w-2.5 bg-red-400" />;
  return null;
}

// ─── Countdown timer for expiring jobs ──────────────────────
function CountdownTimer({ expiresAt }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = expiresAt - Date.now();
      if (diff <= 0) { setTimeLeft('0:00'); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return <span className="text-[10px] text-muted-foreground tabular-nums">{timeLeft}</span>;
}

function JobTabBar({ jobs, activeJobIndex, setActiveJobIndex, onAddJob, canAdd, scanKioskMode, setScanKioskMode, cancelJob }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide px-1 py-2 border-b border-white/[0.06] -mx-6 px-6">
      {/* Placeholder tab when no jobs exist yet */}
      {jobs.length === 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground border border-dashed border-white/[0.08] shrink-0 whitespace-nowrap">
          <span>🖨️</span>
          <span>New job</span>
        </div>
      )}

      {jobs.map((job, i) => {
        const isActive = i === activeJobIndex && !scanKioskMode;
        const isExpired = job.locallyExpired;
        const isCancellable = ['IDLE', 'PAYMENT', 'CALCULATING', 'ERROR'].includes(job.status) && !isExpired;

        return (
          <motion.button
            key={job.jobId || i}
            onClick={() => { setActiveJobIndex(i); setScanKioskMode(false); }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
              isExpired
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : isActive
                ? 'text-white border border-white/[0.08]'
                : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground border border-transparent'
            }`}
          >
            {/* Sliding active pill background */}
            {isActive && !isExpired && (
              <motion.div
                layoutId="active-job-tab"
                className="absolute inset-0 rounded-lg bg-white/[0.06]"
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}

            <div className="relative flex items-center gap-2">
              <span>{isExpired ? '⚠' : (JOB_ICONS[job.jobType] || '🖨️')}</span>
              <span>{isExpired ? 'Expired' : (JOB_LABELS[job.jobType] || 'Job')}</span>
              {!isExpired && <StatusDot status={job.status} />}
              {isCancellable && (
                <motion.span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); cancelJob(i); }}
                  whileHover={{ scale: 1.1 }}
                  className="ml-0.5 w-5 h-5 flex items-center justify-center rounded-full text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors text-xs leading-none cursor-pointer"
                  title="Cancel job"
                >
                  ✕
                </motion.span>
              )}
            </div>
            {/* Countdown timer for pending jobs with expiry */}
            {job.expiresAt && !isExpired && (
              <CountdownTimer expiresAt={job.expiresAt} />
            )}
          </motion.button>
        );
      })}

      {/* Scan kiosk tab — shown when scanKioskMode is active */}
      {scanKioskMode && (
        <motion.button
          onClick={() => setScanKioskMode(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors text-white border border-white/[0.08]"
        >
          <motion.div
            layoutId="active-job-tab"
            className="absolute inset-0 rounded-lg bg-white/[0.06]"
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          />
          <span className="relative">📡</span>
          <span className="relative">New Kiosk</span>
        </motion.button>
      )}

      {/* Add another job "+" tab */}
      {canAdd && (
        <motion.button
          onClick={onAddJob}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.04] border border-dashed border-white/[0.08] hover:border-white/20 shrink-0 transition-colors text-xl leading-none"
          title="Add another job"
        >
          +
        </motion.button>
      )}
    </div>
  );
}

// ─── Navigation Bar (Back + Step Indicator) ─────────────────
function NavigationBar({ canGoBack, goBack, currentNavStep, currentNavStepIndex }) {
  const isServiceSelect = !currentNavStep || currentNavStep === 'SERVICE_SELECT';
  if (isServiceSelect) return null;

  const stepsToShow = NAV_STEPS.slice(1);
  const adjustedIndex = currentNavStepIndex - 1;

  return (
    <div className="flex items-center gap-3 py-2 -mx-1">
      {canGoBack ? (
        <motion.button
          onClick={goBack}
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors shrink-0 pr-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-xs">Back</span>
        </motion.button>
      ) : (
        <div className="w-[52px] shrink-0" />
      )}

      <div className="flex items-center gap-1.5 flex-1 justify-center">
        {stepsToShow.map((step, i) => {
          const isCompleted = i < adjustedIndex;
          const isActive = i === adjustedIndex;

          return (
            <React.Fragment key={step.id}>
              {i > 0 && (
                <div className={`h-px w-6 transition-colors ${
                  isCompleted || isActive ? 'bg-white/40' : 'bg-white/10'
                }`} />
              )}
              <div className="flex flex-col items-center gap-0.5">
                <div className="relative flex items-center justify-center">
                  {/* Pulse ring for active step */}
                  {isActive && (
                    <motion.div
                      className="absolute w-2.5 h-2.5 rounded-full bg-white/30"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  <div className={`w-2.5 h-2.5 rounded-full transition-all flex items-center justify-center ${
                    isCompleted ? 'bg-white' :
                    isActive ? 'bg-white' :
                    'bg-white/15'
                  }`}>
                    {isCompleted && (
                      <Check className="w-2.5 h-2.5 text-black" />
                    )}
                  </div>
                </div>
                <span className={`text-[10px] leading-none transition-colors ${
                  isCompleted ? 'text-white/60' :
                  isActive ? 'text-white font-medium' :
                  'text-white/20'
                }`}>
                  {step.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="w-[52px] shrink-0" />
    </div>
  );
}

// ─── Inline Kiosk Scanner View (for scan kiosk mode) ────────
function KioskScannerInline({ handleScanKioskConnect, scannerActive, setScannerActive, cameraError, setCameraError, handleScanError, addLog }) {
  const [manualKioskId, setManualKioskId] = useState('');

  const onScanDetect = (detectedCodes) => {
    if (!Array.isArray(detectedCodes) || detectedCodes.length === 0) return;
    const rawValue = detectedCodes[0]?.rawValue;
    if (!rawValue) return;

    let kioskId = rawValue;
    try {
      if (rawValue.startsWith('http://') || rawValue.startsWith('https://')) {
        const url = new URL(rawValue);
        kioskId = url.searchParams.get('kiosk_id') || rawValue;
      } else if (rawValue.trim().startsWith('{')) {
        const parsed = JSON.parse(rawValue);
        kioskId = parsed.kiosk_id || parsed.ip || rawValue;
      }
    } catch {}

    handleScanKioskConnect(kioskId.trim());
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-3">Scan a new kiosk QR code</p>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-inner">
        <Suspense fallback={
          <div className="aspect-square bg-muted/20 flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-white"/>
          </div>
        }>
          <ZXingScanner
            active={true}
            onScan={onScanDetect}
            onError={handleScanError}
          />
        </Suspense>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/[0.06]"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#0a0a0a] px-2 text-muted-foreground">Or enter manually</span>
        </div>
      </div>

      <div className="space-y-2">
        <input
          type="text"
          placeholder="Kiosk ID (e.g., kiosk_001)"
          value={manualKioskId}
          onChange={(e) => setManualKioskId(e.target.value)}
          className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 text-sm transition-all"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && manualKioskId.trim()) {
              handleScanKioskConnect(manualKioskId.trim());
              setManualKioskId('');
            }
          }}
        />
        <button
          onClick={() => {
            if (manualKioskId.trim()) {
              handleScanKioskConnect(manualKioskId.trim());
              setManualKioskId('');
            }
          }}
          className="w-full bg-white text-black hover:bg-neutral-200 py-3 rounded-xl text-sm font-medium transition-colors"
        >
          Connect to Kiosk
        </button>
      </div>
    </div>
  );
}

// ─── Shared view transition props ───────────────────────────
const viewTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: 'easeInOut' },
};

export function PrintInterface() {
  const printState = usePrint();
  const { user, isAdmin, isGuest: isAuthGuest } = useAuth();
  const { isGuest } = useGuest();
  const navigate = useNavigate();

  const {
    status,
    jobs,
    activeJobIndex,
    setActiveJobIndex,
    activeJob,
    allJobsDone,
    addAnotherJob,
    canGoBack,
    goBack,
    currentNavStep,
    currentNavStepIndex,
    showBackConfirmModal,
    setShowBackConfirmModal,
    confirmGoBack,
    showExpiryModal,
    setShowExpiryModal,
    scanKioskMode,
    setScanKioskMode,
    handleScanKioskConnect,
    cancelJob,
    updatePrintSettings,
    handleProceedToPayment,

    // Kiosk Choice
    showKioskChoiceModal,
    setShowKioskChoiceModal,
    continueOnSameKiosk,
    switchToNewKiosk,
  } = printState;

  const isConnected = ['SERVICE_SELECT', 'CONNECTED', 'SCAN_OPTIONS',
    'XEROX_OPTIONS', 'CALCULATING', 'SETTINGS_PREVIEW', 'PAYMENT', 'PRINTING', 'SCANNING',
    'XEROXING', 'COMPLETED', 'SCAN_COMPLETE', 'ERROR'].includes(status);
  const canAddJob = jobs.length < 5 && !isGuest && isConnected;

  const expiredJob = showExpiryModal ? jobs.find(j => j.jobId === showExpiryModal) : null;

  const viewProps = {
    ...printState,
    getFileExt,
    getFileIcon,
    navigate,
    isGuest,
    isAdmin, // <--- ADDED: Access to admin status in views
  };

  const showTabBar = jobs.length >= 1
    || scanKioskMode
    || ['SERVICE_SELECT', 'CONNECTED', 'SCAN_OPTIONS', 'XEROX_OPTIONS',
        'CALCULATING', 'SETTINGS_PREVIEW', 'PAYMENT'].includes(status);

  const showSummary = allJobsDone && jobs.length > 0 && !scanKioskMode;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* ─── Glassmorphism container ──────────────────────────── */}
      <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-3xl shadow-2xl shadow-black/20">

        {/* ─── Header ──────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.06]">
          <div className="w-10 h-10 rounded-[1rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center shadow-lg shrink-0">
            <Printer className="h-5 w-5 text-white" />
          </div>
          <span className="text-foreground text-2xl font-semibold tracking-tight">LePrint</span>
        </div>

        {/* ─── Content ─────────────────────────────────────────── */}
        <div className="p-6 space-y-5">
          {/* Tab bar — only when 1+ jobs or scanning kiosk */}
          {showTabBar && !showSummary && (
            <JobTabBar
              jobs={jobs}
              activeJobIndex={activeJobIndex}
              setActiveJobIndex={setActiveJobIndex}
              onAddJob={addAnotherJob}
              canAdd={canAddJob}
              scanKioskMode={scanKioskMode}
              setScanKioskMode={setScanKioskMode}
              cancelJob={cancelJob}
            />
          )}

          {/* Navigation bar — back + step dots (hidden during scan kiosk mode) */}
          {!showSummary && !scanKioskMode && (
            <NavigationBar
              canGoBack={canGoBack}
              goBack={goBack}
              currentNavStep={currentNavStep}
              currentNavStepIndex={currentNavStepIndex}
            />
          )}

          {/* ─── Views with AnimatePresence transitions ─────────── */}
          <AnimatePresence mode="wait">
            {scanKioskMode ? (
              <motion.div key="kiosk-scanner" {...viewTransition}>
                <KioskScannerInline
                  handleScanKioskConnect={handleScanKioskConnect}
                  scannerActive={printState.scannerActive}
                  setScannerActive={printState.setScannerActive}
                  cameraError={printState.cameraError}
                  setCameraError={printState.setCameraError}
                  handleScanError={printState.handleScanError}
                  addLog={printState.addLog}
                />
              </motion.div>
            ) : showSummary ? (
              <motion.div key="summary" {...viewTransition}>
                <AllJobsSummaryView {...viewProps} />
              </motion.div>
            ) : (
              <motion.div key={status} {...viewTransition}>
                {/* VIEW: QR Scanner */}
                {status === 'IDLE' && <QRScannerView {...viewProps} />}

                {/* VIEW: Checking kiosk / printer status */}
                {status === 'CHECKING_STATUS' && <StatusCheckView {...viewProps} />}
                
                {/* VIEW: Kiosk Status/Profile summary */}
                {status === 'KIOSK_READY' && <KioskProfileView {...viewProps} />}

                {/* VIEW: Hard printer error (block) */}
                {status === 'PRINTER_ERROR' && (
                  <PrinterErrorView
                    printerStatusResult={printState.printerStatusResult}
                    resetFlow={printState.resetFlow}
                  />
                )}

                {/* VIEW: Soft printer warning (user can proceed or rescan) */}
                {status === 'PRINTER_WARNING' && (
                  <PrinterWarningView
                    proceedDespiteWarning={printState.proceedDespiteWarning}
                    resetFlow={printState.rescanQR}
                    printerStatusResult={printState.printerStatusResult}
                  />
                )}

                {/* VIEW: Manual / fallback connect */}
                {(status === 'SCANNED' || status === 'CONNECTING') && (
                  <ConnectView {...viewProps} />
                )}

                {/* VIEW: Generic error — context-aware */}
                {status === 'ERROR' && (activeJob?.serviceType || 'print') === 'print' && (
                  <ConnectView {...viewProps} />
                )}
                {status === 'ERROR' && (activeJob?.serviceType || 'print') !== 'print' && (
                  <JobErrorView {...viewProps} />
                )}

                {/* VIEW: Service selector (Print / Scan / Xerox) */}
                {status === 'SERVICE_SELECT' && <ServiceSelectView {...viewProps} />}

                {/* VIEW: File upload / calculation (Print flow) */}
                {(status === 'CONNECTED' || status === 'CALCULATING') && (
                  <FileUploadView {...viewProps} />
                )}

                {/* VIEW: Print Settings + Preview (Print flow) */}
                {status === 'SETTINGS_PREVIEW' && (
                  <PrintSettingsView
                    file={activeJob?.file}
                    pages={activeJob?.pages}
                    pricing={activeJob?.pricing}
                    printSettings={activeJob?.printSettings}
                    updatePrintSettings={updatePrintSettings}
                    onProceed={handleProceedToPayment}
                  />
                )}

                {/* VIEW: Payment (Print flow) */}
                {status === 'PAYMENT' && <PaymentView {...viewProps} />}

                {/* VIEW: Printing progress */}
                {status === 'PRINTING' && <JobProgressView serviceType={activeJob?.jobType || 'print'} jobPhase={activeJob?.jobPhase} resetFlow={viewProps.resetFlow} backToServiceSelect={viewProps.backToServiceSelect} />}

                {/* VIEW: Completed / success */}
                {status === 'COMPLETED' && <CompletedView {...viewProps} />}

                {/* VIEW: Scan options */}
                {status === 'SCAN_OPTIONS' && <ScanOptionsView {...viewProps} />}

                {/* VIEW: Scanning in progress */}
                {status === 'SCANNING' && <ScanningView {...viewProps} />}

                {/* VIEW: Scan complete with download */}
                {status === 'SCAN_COMPLETE' && <ScanCompleteView {...viewProps} />}

                {/* VIEW: Xerox options */}
                {status === 'XEROX_OPTIONS' && <XeroxOptionsView {...viewProps} />}

                {/* VIEW: Xeroxing in progress */}
                {status === 'XEROXING' && <XeroxingView {...viewProps} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Modals ────────────────────────────────────────────── */}
      <BackConfirmModal
        open={showBackConfirmModal}
        onOpenChange={setShowBackConfirmModal}
        onConfirm={confirmGoBack}
      />

      <ExpiryModal
        open={!!showExpiryModal}
        onOpenChange={(open) => { if (!open) setShowExpiryModal(null); }}
        jobType={expiredJob?.jobType || 'print'}
      />

      <KioskChoiceModal
        open={showKioskChoiceModal}
        onOpenChange={setShowKioskChoiceModal}
        onContinue={continueOnSameKiosk}
        onSwitch={switchToNewKiosk}
      />
    </div>
  );
}

export default PrintInterface;
