// frontend/src/components/Print/PrintInterface.jsx
// Supports Print, Scan, and Xerox flows with multi-job tab switching.

import React, { useState, useEffect } from 'react';
import { Printer, ChevronLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGuest } from '../GuestContext';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePrint } from './usePrint';
import { NAV_STEPS } from './usePrint';
import { getFileExt, getFileIcon } from './printUtils';

import {
  QRScannerView,
  ConnectView,
  FileUploadView,
  PaymentView,
  JobProgressView,
  CompletedView,
  StatusCheckView,
  PrinterErrorView,
  PrinterWarningView,
  ServiceSelectView,
  ScanOptionsView,
  ScanningView,
  ScanCompleteView,
  XeroxOptionsView,
  XeroxingView,
  JobErrorView,
  AllJobsSummaryView,
  BackConfirmModal,
  ExpiryModal,
} from './PrintViews';

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

function JobTabBar({ jobs, activeJobIndex, setActiveJobIndex, onAddJob, canAdd }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide px-1 py-2 border-b border-border -mx-6 px-6">
      {jobs.map((job, i) => {
        const isActive = i === activeJobIndex;
        const isExpired = job.locallyExpired;

        return (
          <button
            key={job.jobId || i}
            onClick={() => setActiveJobIndex(i)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
              isExpired
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : isActive
                ? 'bg-white/15 text-foreground border border-white/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{isExpired ? '⚠' : (JOB_ICONS[job.jobType] || '🖨️')}</span>
              <span>{isExpired ? 'Expired' : (JOB_LABELS[job.jobType] || 'Job')}</span>
              {!isExpired && <StatusDot status={job.status} />}
            </div>
            {/* Countdown timer for pending jobs with expiry */}
            {job.expiresAt && !isExpired && (
              <CountdownTimer expiresAt={job.expiresAt} />
            )}
          </button>
        );
      })}

      {/* Add another job "+" tab */}
      {canAdd && (
        <button
          onClick={onAddJob}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 border border-dashed border-border shrink-0 transition-all text-lg leading-none"
          title="Add another job"
        >
          +
        </button>
      )}
    </div>
  );
}

// ─── Navigation Bar (Back + Step Indicator) ─────────────────
function NavigationBar({ canGoBack, goBack, currentNavStepIndex }) {
  // Don't show on SERVICE_SELECT (step 0) or when no step is active
  if (currentNavStepIndex <= 0) return null;

  // Steps to show (skip SERVICE_SELECT since it's the starting point)
  const stepsToShow = NAV_STEPS.slice(1); // Upload, Confirm, Pay, Status
  const adjustedIndex = currentNavStepIndex - 1; // adjust for sliced array

  return (
    <div className="flex items-center gap-3 py-2 -mx-1">
      {/* Back arrow — left side */}
      {canGoBack ? (
        <button
          onClick={goBack}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors shrink-0 pr-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-xs">Back</span>
        </button>
      ) : (
        <div className="w-[52px] shrink-0" /> /* spacer to keep dots centered */
      )}

      {/* Step dots — centered */}
      <div className="flex items-center gap-1.5 flex-1 justify-center">
        {stepsToShow.map((step, i) => {
          const isCompleted = i < adjustedIndex;
          const isActive = i === adjustedIndex;

          return (
            <React.Fragment key={step.id}>
              {i > 0 && (
                <div className={`h-px w-4 transition-colors ${
                  isCompleted || isActive ? 'bg-white/40' : 'bg-white/10'
                }`} />
              )}
              <div className="flex flex-col items-center gap-0.5">
                <div className={`w-2 h-2 rounded-full transition-all ${
                  isCompleted ? 'bg-white' :
                  isActive ? 'bg-white' :
                  'bg-white/15'
                }`}>
                  {isCompleted && (
                    <Check className="w-2 h-2 text-black" />
                  )}
                </div>
                <span className={`text-[9px] leading-none transition-colors ${
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

      {/* Right spacer for balance */}
      <div className="w-[52px] shrink-0" />
    </div>
  );
}

export function PrintInterface() {
  const printState = usePrint();
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
    currentNavStepIndex,
    showBackConfirmModal,
    setShowBackConfirmModal,
    confirmGoBack,
    showExpiryModal,
    setShowExpiryModal,
  } = printState;

  // Can add another job: < 5 jobs AND not a guest
  const canAddJob = jobs.length < 5 && !isGuest;

  // Get the expired job for the expiry modal
  const expiredJob = showExpiryModal ? jobs.find(j => j.jobId === showExpiryModal) : null;

  // Pass hook state + helpers down to child views
  const viewProps = {
    ...printState,
    getFileExt,
    getFileIcon,
    navigate,
    isGuest,
  };

  // Show tab bar when there are 1+ jobs
  const showTabBar = jobs.length >= 1;

  // Show all-jobs summary when all jobs are done AND we have >0 jobs
  const showSummary = allJobsDone && jobs.length > 0;

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="bg-card/90 backdrop-blur-xl border border-border shadow-2xl rounded-3xl">
        <CardHeader className="space-y-1 pb-4 border-b border-border">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center shadow-lg">
              <Printer className="h-6 w-6" />
            </div>
            <span className="text-foreground">LePrint</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
          {/* Tab bar — only when 1+ jobs */}
          {showTabBar && !showSummary && (
            <JobTabBar
              jobs={jobs}
              activeJobIndex={activeJobIndex}
              setActiveJobIndex={setActiveJobIndex}
              onAddJob={addAnotherJob}
              canAdd={canAddJob}
            />
          )}

          {/* Navigation bar — back + step dots */}
          {!showSummary && (
            <NavigationBar
              canGoBack={canGoBack}
              goBack={goBack}
              currentNavStepIndex={currentNavStepIndex}
            />
          )}

          {/* All-jobs Summary View */}
          {showSummary ? (
            <AllJobsSummaryView {...viewProps} />
          ) : (
            <>
              {/* VIEW: QR Scanner */}
              {status === 'IDLE' && <QRScannerView {...viewProps} />}

              {/* VIEW: Checking kiosk / printer status */}
              {status === 'CHECKING_STATUS' && <StatusCheckView {...viewProps} />}

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
            </>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}

export default PrintInterface;
