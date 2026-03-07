import React, { Suspense } from 'react';
import {
  Loader2, QrCode, AlertCircle, Zap, FileUp,
  IndianRupee, CheckCircle, Printer,
  ScanLine, Copy, Download, Minus, Plus, ArrowLeft
} from 'lucide-react';
import { getFileIcon, getFileExt } from './printUtils';
import { AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ZXingScanner from './ZXingScanner'

export function QRScannerView({ 
  scannerActive, 
  cameraError, 
  handleScan, 
  handleScanError, 
  setScannerActive, 
  setCameraError 
}) {
  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden border border-border shadow-inner">
        <Suspense fallback={
          <div className="aspect-square bg-muted/20 flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-white"/>
          </div>
        }>
          {scannerActive && !cameraError ? (
            <ZXingScanner
            active={scannerActive && !cameraError}
            onScan={handleScan}
            onError={handleScanError}
          />
          
          
          ) : (
            <div className="aspect-square bg-muted/10 flex flex-col items-center justify-center p-6 text-center">
              <QrCode className="h-16 w-16 text-muted-foreground mb-4"/>
              <p className="text-muted-foreground text-sm mb-4">{cameraError || 'Camera not active'}</p>
              <Button 
                size="sm" 
                onClick={() => { setScannerActive(true); setCameraError(null); }}
                className="bg-white text-black hover:bg-neutral-200 transition-colors"
              >
                Enable Camera
              </Button>
            </div>
          )}
        </Suspense>
      </div>
      
      {cameraError && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-500">
          <AlertCircle className="inline mr-2 h-4 w-4"/>
          {cameraError}
        </div>
      )}
      
      <div className="text-center text-muted-foreground text-sm">
        <p>Point camera at printer's QR code</p>
      </div>

      {/* Manual Entry */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or enter manually</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Kiosk ID (e.g., kiosk_001)"
          className="w-full px-4 py-3 bg-muted/10 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30 text-sm transition-all"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
              handleScan([{ rawValue: e.target.value.trim() }]);
              e.target.value = '';
            }
          }}
        />
        <Button
          onClick={(e) => {
            const input = e.target.parentElement.querySelector('input');
            if (input.value.trim()) {
              handleScan([{ rawValue: input.value.trim() }]);
              input.value = '';
            }
          }}
          className="w-full bg-white text-black hover:bg-neutral-200 py-3 transition-colors"
        >
          Connect
        </Button>
      </div>
    </div>
  );
}


// ─── VIEW: Checking Status (shown immediately after QR scan) ─
export function StatusCheckView() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 text-center py-8"
        >
            {/* Animated printer icon */}
            <div className="relative mx-auto w-20 h-20">
                <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center"
                >
                    <Printer className="w-10 h-10 text-white" />
                </motion.div>
                {/* Spinning ring around the icon */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-white/40"
                />
            </div>

            <div>
                <p className="text-lg font-semibold text-foreground mb-1">
                    Checking Printer Status...
                </p>
                <p className="text-sm text-muted-foreground">
                    Verifying kiosk is ready
                </p>
            </div>

            {/* Animated dots */}
            <div className="flex justify-center gap-1.5">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                        className="w-2 h-2 rounded-full bg-white/50"
                    />
                ))}
            </div>
        </motion.div>
    );
}


// ─── VIEW: Printer Error (hard block) ───────────────────────
export function PrinterErrorView({ printerStatusResult, resetFlow }) {

    // Map detail codes to user-friendly messages
    const getErrorInfo = (detail) => {
        const errors = {
            'media-empty':      { title: 'Out of Paper',     desc: 'This printer has run out of paper. Please try another kiosk.',         icon: '📄' },
            'media-low':        { title: 'Low Paper',        desc: 'This printer is almost out of paper. Please try another kiosk.',        icon: '📄' },
            'toner-empty':      { title: 'Out of Ink/Toner', desc: 'This printer has run out of ink or toner. Please try another kiosk.',   icon: '🖨️' },
            'cover-open':       { title: 'Cover Open',       desc: 'This printer\'s cover is open. Please contact staff.',                  icon: '⚠️' },
            'stopped':          { title: 'Printer Stopped',  desc: 'This printer has stopped. Please contact staff.',                       icon: '🛑' },
            'offline':          { title: 'Printer Offline',  desc: 'This printer is not responding. Please try another kiosk.',             icon: '📡' },
            'kiosk_offline':    { title: 'Kiosk Offline',    desc: 'This kiosk appears to be offline. Please try another kiosk or scan again shortly.', icon: '📡' },
        };
        return errors[detail] || { title: 'Printer Error', desc: 'This printer has an issue. Please contact staff or try another kiosk.', icon: '⚠️' };
    };

    const detail = printerStatusResult?.printer_status_detail;
    const errorInfo = getErrorInfo(detail);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-5 py-4"
        >
            {/* Error header */}
            <div className="text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="text-5xl mb-4"
                >
                    {errorInfo.icon}
                </motion.div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                    {errorInfo.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {errorInfo.desc}
                </p>
            </div>

            {/* Error box */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-red-400">Upload Blocked</p>
                        <p className="text-xs text-red-400/70 mt-0.5">
                            To protect your payment, we've prevented file upload until this issue is resolved.
                        </p>
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
                <Button
                    onClick={resetFlow}
                    className="w-full bg-white text-black hover:bg-neutral-200 font-semibold py-5 transition-colors"
                >
                    <RefreshCw className="mr-2 w-4 h-4" />
                    Scan a Different Kiosk
                </Button>

                <Button
                    variant="ghost"
                    onClick={resetFlow}
                    className="w-full text-muted-foreground hover:text-foreground hover:bg-white/5 text-sm"
                >
                    ← Back to Scanner
                </Button>
            </div>
        </motion.div>
    );
}


// ─── VIEW: Printer Warning Dialog (soft warning) ─────────────
export function PrinterWarningView({ proceedDespiteWarning, resetFlow }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5 py-2"
        >
            {/* Warning icon */}
            <div className="text-center">
                <motion.div
                    animate={{ rotate: [-3, 3, -3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="inline-block text-5xl mb-4"
                >
                    ⚠️
                </motion.div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                    Quick Check Needed
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    We couldn't automatically verify this printer's status. 
                    This is common with some printer models.
                </p>
            </div>

            {/* Checklist */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-yellow-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Please take a quick look at the printer:
                </p>
                <ul className="space-y-2">
                    {[
                        'Printer is turned on and not in sleep mode',
                        'Paper tray has paper',
                        'No error lights are blinking',
                        'No paper jams visible'
                    ].map((item, i) => (
                        <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="flex items-start gap-2 text-xs text-yellow-400/80"
                        >
                            <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-yellow-500/60" />
                            {item}
                        </motion.li>
                    ))}
                </ul>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
                {/* Primary: Proceed */}
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                        onClick={proceedDespiteWarning}
                        className="w-full bg-white text-black hover:bg-neutral-200 font-bold py-5 transition-colors"
                    >
                        <CheckCircle className="mr-2 w-5 h-5" />
                        Looks Good, Proceed
                    </Button>
                </motion.div>

                {/* Secondary: Scan different kiosk */}
                <Button
                    variant="ghost"
                    onClick={resetFlow}
                    className="w-full text-muted-foreground hover:text-foreground hover:bg-white/5 text-sm"
                >
                    ← Scan a Different Kiosk
                </Button>
            </div>
        </motion.div>
    );
}




export function ConnectView({ config, status, connectPrinter, resetFlow }) {
  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-2">
          <QrCode className="h-5 w-5 text-white"/>
          <span className="text-sm font-medium text-muted-foreground">Kiosk Detected</span>
        </div>
        <p className="text-lg font-bold text-foreground font-mono">{config?.kiosk_id}</p>
        {config?.location && (
          <p className="text-xs text-muted-foreground mt-1">
            📍 {config.location} {config.floor && `• Floor ${config.floor}`}
          </p>
        )}
      </div>

      {status === 'ERROR' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-500">
          <AlertCircle className="inline mr-2 h-4 w-4"/>
          Kiosk offline or not found
        </div>
      )}
      
      <Button 
        onClick={connectPrinter} 
        disabled={status === 'CONNECTING'} 
        className="w-full bg-white text-black hover:bg-neutral-200 shadow-lg font-semibold py-6 transition-colors"
      >
        {status === 'CONNECTING' ? (
          <><Loader2 className="animate-spin mr-2 h-5 w-5"/> Checking...</>
        ) : (
          <><Zap className="mr-2 h-5 w-5"/> Connect</>
        )}
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={resetFlow}
        className="w-full text-muted-foreground hover:text-foreground hover:bg-white/5"
      >
        ← Scan Again
      </Button>
    </div>
  );
}

export function FileUploadView({ file, status, handleFileSelect }) {
  return (
    <div className="space-y-4">
      <label className="block w-full cursor-pointer group">
        <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
          file 
          ? 'border-white/40 bg-white/5' 
          : 'border-border hover:border-white/30 hover:bg-white/5'
        }`}>
          <div className={`mx-auto h-16 w-16 mb-3 rounded-full flex items-center justify-center transition-all ${
            file ? 'bg-white/10' : 'bg-muted/20 group-hover:bg-white/10'
          }`}>
            <FileUp className={`h-8 w-8 ${file ? 'text-white' : 'text-muted-foreground group-hover:text-white'}`} />
          </div>
        
          <p className="text-base font-medium mb-1 text-foreground">
            {file ? `${getFileIcon(file.name)} ${file.name}` : "Drop file here"}
          </p>
        
          {file && (
            <>
              <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              {getFileExt(file.name) !== 'pdf' && (
                <p className="text-xs text-yellow-500 mt-2">
                  ⚡ Will be converted to PDF
                </p>
              )}
            </>
          )}
        
          {!file && (
            <>
              <p className="text-xs text-muted-foreground mt-2">or click to browse</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Supports: PDF, Word, Text, Images
              </p>
            </>
          )}
        </div>
      
        <input 
          type="file" 
          className="hidden" 
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.rtf,.odt,.md"
          onChange={e => handleFileSelect(e.target.files[0])}
          disabled={status === 'CALCULATING'}
        />
      </label>
    

      {status === 'CALCULATING' && (
        <div className="flex items-center justify-center gap-3 text-foreground bg-white/5 rounded-lg p-4 border border-white/10">
          <Loader2 className="animate-spin h-5 w-5"/>
          <span className="text-sm font-medium">Processing file...</span>
        </div>
      )}
   </div>
  );
}

export function PaymentView({ pricing, handlePayment, setStatus, setFile, setPricing }) {
  return (
    <div className="space-y-4">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 shadow-lg">
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-border">
            <span className="text-muted-foreground text-sm">Job ID</span>
            <span className="text-foreground text-xs font-mono">{pricing.job_id.slice(0, 16)}...</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm">Pages</span>
            <span className="text-foreground text-lg font-bold">{pricing.pages}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm">Rate</span>
            <span className="text-foreground text-sm">₹{pricing.pricePerPage}/page</span>
          </div>
          <div className="border-t border-border mt-4 pt-4 flex justify-between items-center">
            <span className="text-foreground font-semibold text-lg">Total</span>
            <span className="text-foreground text-3xl font-bold">₹{pricing.totalPrice}</span>
          </div>
        </div>
      </div>
      
      <Button 
        onClick={handlePayment} 
        className="w-full bg-white text-black hover:bg-neutral-200 font-bold py-6 text-lg shadow-lg transition-colors"
      >
        <IndianRupee className="mr-2 h-5 w-5"/>
        Pay ₹{pricing.totalPrice} & Print
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => { setStatus('CONNECTED'); setFile(null); setPricing(null); }} 
        className="w-full text-muted-foreground hover:text-foreground hover:bg-white/5"
      >
        ← Choose Different File
      </Button>
    </div>
  );
}

export function PrintingView() {
  return (
    <div className="space-y-6 text-center py-8">
      <div className="relative">
        <Loader2 className="animate-spin h-16 w-16 mx-auto text-white"/>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-20 w-20 bg-white/10 rounded-full blur-xl"></div>
        </div>
      </div>
      <div>
        <p className="text-xl font-semibold mb-2 text-foreground">Printing...</p>
        <p className="text-sm text-muted-foreground">Checking status</p>
      </div>
    </div>
  );
}

export function CompletedView({ printAnotherOnSameKiosk, resetFlow }) {
  return (
    <div className="space-y-6 text-center py-8">
      <div className="relative">
        <CheckCircle className="h-20 w-20 mx-auto text-foreground"/>
      </div>
      <div>
        <p className="text-2xl font-bold mb-2 text-foreground">
          Print Complete!
        </p>
        <p className="text-sm text-muted-foreground">Collect your document</p>
      </div>
      
      <div className="space-y-3">
        <Button 
          onClick={printAnotherOnSameKiosk} 
          className="w-full bg-white text-black hover:bg-neutral-200 font-semibold py-6 transition-colors"
        >
          <Printer className="mr-2 h-5 w-5"/>
          Print Another Document
        </Button>
        
        <Button 
          onClick={resetFlow} 
          variant="ghost"
          className="w-full text-muted-foreground hover:text-foreground hover:bg-white/5"
        >
          ← Exit to Scanner
        </Button>
      </div>
    </div>
  );
}

// ─── VIEW: Service Selector (Print / Scan / Xerox) ──────────
export function ServiceSelectView({ selectService, resetFlow }) {
    const services = [
        {
            type: 'print',
            icon: Printer,
            title: 'Print',
            desc: 'Upload a document to print',
        },
        {
            type: 'scan',
            icon: ScanLine,
            title: 'Scan',
            desc: 'Scan a document to PDF',
        },
        {
            type: 'xerox',
            icon: Copy,
            title: 'Xerox',
            desc: 'Photocopy a document',
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
        >
            <p className="text-sm text-muted-foreground text-center mb-2">
                What would you like to do?
            </p>
            {services.map((svc) => {
                const Icon = svc.icon;
                return (
                    <motion.button
                        key={svc.type}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => selectService(svc.type)}
                        className="w-full flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-border hover:border-white/20 rounded-xl p-4 text-left transition-all"
                    >
                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-foreground font-semibold">{svc.title}</p>
                            <p className="text-xs text-muted-foreground">{svc.desc}</p>
                        </div>
                    </motion.button>
                );
            })}

            <Button
                variant="ghost"
                size="sm"
                onClick={resetFlow}
                className="w-full text-muted-foreground hover:text-foreground hover:bg-white/5 mt-2"
            >
                <ArrowLeft className="mr-1 w-4 h-4" /> Scan Different Kiosk
            </Button>
        </motion.div>
    );
}


// ─── VIEW: Scan Options ─────────────────────────────────────
export function ScanOptionsView({ scanOptions, setScanOptions, handleScanStart, backToServiceSelect }) {
    const resolutions = [150, 300, 600];
    const colorModes = [
        { value: 'RGB24', label: 'Color' },
        { value: 'Grayscale8', label: 'Grayscale' },
        { value: 'BlackAndWhite1', label: 'B&W' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
        >
            <div className="text-center">
                <ScanLine className="w-10 h-10 mx-auto text-white mb-2" />
                <h3 className="text-lg font-bold text-foreground">Scan Options</h3>
                <p className="text-xs text-muted-foreground">Place your document on the scanner</p>
            </div>

            {/* Resolution */}
            <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Resolution (DPI)</label>
                <div className="flex gap-2">
                    {resolutions.map((dpi) => (
                        <button
                            key={dpi}
                            onClick={() => setScanOptions(prev => ({ ...prev, resolution: dpi }))}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                                scanOptions.resolution === dpi
                                    ? 'bg-white text-black'
                                    : 'bg-white/5 text-muted-foreground border border-border hover:bg-white/10'
                            }`}
                        >
                            {dpi}
                        </button>
                    ))}
                </div>
            </div>

            {/* Color Mode */}
            <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Color Mode</label>
                <div className="flex gap-2">
                    {colorModes.map((mode) => (
                        <button
                            key={mode.value}
                            onClick={() => setScanOptions(prev => ({ ...prev, colorMode: mode.value }))}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                                scanOptions.colorMode === mode.value
                                    ? 'bg-white text-black'
                                    : 'bg-white/5 text-muted-foreground border border-border hover:bg-white/10'
                            }`}
                        >
                            {mode.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Price info */}
            <div className="bg-white/5 border border-border rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Scan Price</span>
                <span className="text-lg font-bold text-foreground">₹5</span>
            </div>

            <Button
                onClick={handleScanStart}
                className="w-full bg-white text-black hover:bg-neutral-200 font-bold py-6 text-lg transition-colors"
            >
                <ScanLine className="mr-2 h-5 w-5" />
                Start Scan — ₹5
            </Button>

            <Button
                variant="ghost"
                size="sm"
                onClick={backToServiceSelect}
                className="w-full text-muted-foreground hover:text-foreground hover:bg-white/5"
            >
                <ArrowLeft className="mr-1 w-4 h-4" /> Back
            </Button>
        </motion.div>
    );
}


// ─── VIEW: Scanning in progress ─────────────────────────────
export function ScanningView() {
    return (
        <div className="space-y-6 text-center py-8">
            <div className="relative">
                <Loader2 className="animate-spin h-16 w-16 mx-auto text-white" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="h-20 w-20 bg-white/10 rounded-full blur-xl"></div>
                </div>
            </div>
            <div>
                <p className="text-xl font-semibold mb-2 text-foreground">Scanning...</p>
                <p className="text-sm text-muted-foreground">Please wait while the document is scanned</p>
            </div>
        </div>
    );
}


// ─── VIEW: Scan Complete ────────────────────────────────────
export function ScanCompleteView({ scanResult, printAnotherOnSameKiosk, resetFlow }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center py-6"
        >
            <div className="relative">
                <CheckCircle className="h-20 w-20 mx-auto text-foreground" />
            </div>
            <div>
                <p className="text-2xl font-bold mb-2 text-foreground">Scan Complete!</p>
                <p className="text-sm text-muted-foreground">Your document has been scanned</p>
            </div>

            <div className="space-y-3">
                {scanResult?.downloadUrl && (
                    <a
                        href={scanResult.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                    >
                        <Button className="w-full bg-white text-black hover:bg-neutral-200 font-bold py-6 text-lg transition-colors">
                            <Download className="mr-2 h-5 w-5" />
                            Download Scanned PDF
                        </Button>
                    </a>
                )}

                <Button
                    onClick={printAnotherOnSameKiosk}
                    variant="outline"
                    className="w-full border-border hover:bg-white/5 py-5 transition-colors"
                >
                    <ScanLine className="mr-2 h-5 w-5" />
                    Scan Another Document
                </Button>

                <Button
                    onClick={resetFlow}
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-foreground hover:bg-white/5"
                >
                    <ArrowLeft className="mr-1 w-4 h-4" /> Exit to Scanner
                </Button>
            </div>
        </motion.div>
    );
}


// ─── VIEW: Xerox Options ────────────────────────────────────
export function XeroxOptionsView({ xeroxCopies, setXeroxCopies, scanOptions, setScanOptions, handleXeroxStart, backToServiceSelect }) {
    const PRICE_PER_COPY = 5;
    const totalPrice = xeroxCopies * PRICE_PER_COPY;

    const colorModes = [
        { value: 'RGB24', label: 'Color' },
        { value: 'Grayscale8', label: 'Grayscale' },
        { value: 'BlackAndWhite1', label: 'B&W' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
        >
            <div className="text-center">
                <Copy className="w-10 h-10 mx-auto text-white mb-2" />
                <h3 className="text-lg font-bold text-foreground">Xerox Options</h3>
                <p className="text-xs text-muted-foreground">Place your document on the scanner</p>
            </div>

            {/* Copies counter */}
            <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Number of Copies</label>
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={() => setXeroxCopies(prev => Math.max(1, prev - 1))}
                        disabled={xeroxCopies <= 1}
                        className="w-12 h-12 rounded-lg bg-white/5 border border-border hover:bg-white/10 flex items-center justify-center disabled:opacity-30 transition-all"
                    >
                        <Minus className="w-5 h-5 text-foreground" />
                    </button>
                    <span className="text-4xl font-bold text-foreground w-16 text-center">{xeroxCopies}</span>
                    <button
                        onClick={() => setXeroxCopies(prev => Math.min(20, prev + 1))}
                        disabled={xeroxCopies >= 20}
                        className="w-12 h-12 rounded-lg bg-white/5 border border-border hover:bg-white/10 flex items-center justify-center disabled:opacity-30 transition-all"
                    >
                        <Plus className="w-5 h-5 text-foreground" />
                    </button>
                </div>
            </div>

            {/* Color Mode */}
            <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Color Mode</label>
                <div className="flex gap-2">
                    {colorModes.map((mode) => (
                        <button
                            key={mode.value}
                            onClick={() => setScanOptions(prev => ({ ...prev, colorMode: mode.value }))}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                                scanOptions.colorMode === mode.value
                                    ? 'bg-white text-black'
                                    : 'bg-white/5 text-muted-foreground border border-border hover:bg-white/10'
                            }`}
                        >
                            {mode.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Price */}
            <div className="bg-white/5 border border-border rounded-xl p-4">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">₹{PRICE_PER_COPY} x {xeroxCopies} {xeroxCopies === 1 ? 'copy' : 'copies'}</span>
                    <span className="text-2xl font-bold text-foreground">₹{totalPrice}</span>
                </div>
            </div>

            <Button
                onClick={handleXeroxStart}
                className="w-full bg-white text-black hover:bg-neutral-200 font-bold py-6 text-lg transition-colors"
            >
                <IndianRupee className="mr-2 h-5 w-5" />
                Xerox {xeroxCopies} {xeroxCopies === 1 ? 'Copy' : 'Copies'} — ₹{totalPrice}
            </Button>

            <Button
                variant="ghost"
                size="sm"
                onClick={backToServiceSelect}
                className="w-full text-muted-foreground hover:text-foreground hover:bg-white/5"
            >
                <ArrowLeft className="mr-1 w-4 h-4" /> Back
            </Button>
        </motion.div>
    );
}


// ─── VIEW: Xeroxing in progress ─────────────────────────────
export function XeroxingView() {
    return (
        <div className="space-y-6 text-center py-8">
            <div className="relative">
                <Loader2 className="animate-spin h-16 w-16 mx-auto text-white" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="h-20 w-20 bg-white/10 rounded-full blur-xl"></div>
                </div>
            </div>
            <div>
                <p className="text-xl font-semibold mb-2 text-foreground">Xeroxing...</p>
                <p className="text-sm text-muted-foreground">Scanning & printing your copies</p>
            </div>
        </div>
    );
}


export function LogTerminal({ logs }) {
  return (
    <div className="bg-black/40 backdrop-blur-sm text-muted-foreground text-[10px] font-mono p-4 rounded-xl h-24 overflow-y-auto border border-border shadow-inner">
      {logs.length === 0 ? (
        <div>// System ready...</div>
      ) : (
        logs.slice(0, 10).map((l, i) => <div key={i} className="mb-1">{l}</div>)
      )}
    </div>
  );
}
