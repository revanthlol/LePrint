// frontend/src/components/Print/PrintInterface.jsx
// Supports Print, Scan, and Xerox flows with multi-job tab switching.

import React from 'react';
import { Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGuest } from '../GuestContext';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePrint } from './usePrint';
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

function JobTabBar({ jobs, activeJobIndex, setActiveJobIndex, onAddJob, canAdd }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide px-1 py-2 border-b border-border -mx-6 px-6">
      {jobs.map((job, i) => {
        const isActive = i === activeJobIndex;
        return (
          <button
            key={job.jobId || i}
            onClick={() => setActiveJobIndex(i)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
              isActive
                ? 'bg-white/15 text-foreground border border-white/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
            }`}
          >
            <span>{JOB_ICONS[job.jobType] || '🖨️'}</span>
            <span>{JOB_LABELS[job.jobType] || 'Job'}</span>
            <StatusDot status={job.status} />
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
  } = printState;

  // Can add another job: < 5 jobs AND not a guest
  const canAddJob = jobs.length < 5 && !isGuest;

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
          {/* Tab bar — only when 2+ jobs */}
          {showTabBar && !showSummary && (
            <JobTabBar
              jobs={jobs}
              activeJobIndex={activeJobIndex}
              setActiveJobIndex={setActiveJobIndex}
              onAddJob={addAnotherJob}
              canAdd={canAddJob}
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
    </div>
  );
}

export default PrintInterface;
