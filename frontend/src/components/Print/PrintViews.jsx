import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import {
  Loader2, QrCode, AlertCircle, Zap, FileUp,
  IndianRupee, CheckCircle, Printer,
  ScanLine, Copy, Download, Minus, Plus, ArrowLeft, ExternalLink,
  ArrowUp, ArrowRight, FileText
} from 'lucide-react';
import { getFileIcon, getFileExt } from './printUtils';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;
import { AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogFooter,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { PENDING_JOB_EXPIRY_MINUTES } from './usePrint';
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


// ─── VIEW: Print Settings + Live Preview ────────────────────
// Helper to parse page range
function countPagesInRangeLocal(rangeStr, maxPages) {
    if (!rangeStr || rangeStr === 'all') return maxPages;
    try {
        const pages = new Set();
        const parts = rangeStr.split(',');
        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.includes('-')) {
                const [s, e] = trimmed.split('-');
                const start = Math.max(1, parseInt(s) || 1);
                const end = Math.min(maxPages, parseInt(e) || maxPages);
                for (let i = start; i <= end; i++) pages.add(i);
            } else {
                const p = parseInt(trimmed);
                if (p >= 1 && p <= maxPages) pages.add(p);
            }
        }
        return Math.max(1, pages.size);
    } catch {
        return maxPages;
    }
}

export function PrintSettingsView({ file, pages, pricing, printSettings, updatePrintSettings, onProceed }) {
    const canvasRef = useRef(null);
    const [customRange, setCustomRange] = useState('');
    const [rangeError, setRangeError] = useState(false);

    const ext = file ? getFileExt(file.name) : '';
    const isPdf = ext === 'pdf';
    const isImage = ['jpg', 'jpeg', 'png'].includes(ext);

    const { colorMode = 'bw', orientation = 'portrait', copies = 1, pageRange = 'all', scaling = 'fit' } = printSettings || {};
    const pricePerPage = colorMode === 'color' ? 10 : 3;
    const effectivePages = pageRange === 'all' ? (pages || 1) : countPagesInRangeLocal(customRange || pageRange, pages || 1);
    const totalPrice = effectivePages * copies * pricePerPage;

    // PDF preview renderer — scales to fit container width
    useEffect(() => {
        if (!isPdf || !file || !canvasRef.current) return;
        let cancelled = false;
        (async () => {
            try {
                const data = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data }).promise;
                const page = await pdf.getPage(1);

                // Get the canvas container width to calculate scale
                const canvas = canvasRef.current;
                if (!canvas || cancelled) return;

                // Use container width — fallback to 300 if not measurable
                const containerWidth = canvas.parentElement?.offsetWidth || 300;

                // Get natural viewport at scale 1.0 to know the PDF dimensions
                const naturalViewport = page.getViewport({ scale: 1.0 });

                // Scale to fit container width
                const scale = containerWidth / naturalViewport.width;
                const viewport = page.getViewport({ scale });

                const ctx = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                if (!cancelled) {
                    await page.render({ canvasContext: ctx, viewport }).promise;
                }
            } catch (err) {
                console.error('PDF preview error:', err);
            }
        })();
        return () => { cancelled = true; };
    }, [file, isPdf, orientation]); // re-render when orientation changes

    // Image preview URL
    const [imgUrl, setImgUrl] = useState(null);
    useEffect(() => {
        if (!isImage || !file) return;
        const url = URL.createObjectURL(file);
        setImgUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file, isImage]);

    // Handle custom range changes
    const handleRangeInput = useCallback((val) => {
        setCustomRange(val);
        const valid = /^[\d,\- ]+$/.test(val) || val === '';
        setRangeError(!valid && val !== '');
        if (valid && val.trim()) {
            updatePrintSettings({ pageRange: val.trim() });
        }
    }, [updatePrintSettings]);



    const ToggleBtn = ({ active, onClick, children, className = '' }) => (
        <button
            onClick={onClick}
            className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all ${
                active
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-muted-foreground border border-border hover:bg-white/10'
            } ${className}`}
        >
            {children}
        </button>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            {/* ─── Preview Section ─── */}
            {/* Paper shape wrapper */}
            <div className="w-full relative">
                <p className="text-xs text-muted-foreground mb-2">Live preview</p>

                {/* A4 paper — white, with shadow, proper aspect ratio */}
                <div
                    className="relative w-full mx-auto shadow-lg"
                    style={{
                        maxWidth: orientation === 'landscape' ? '100%' : '75%',
                        paddingBottom: orientation === 'portrait' ? '141.4%' : '70.7%',
                        backgroundColor: '#ffffff',
                        borderRadius: '4px',
                        overflow: 'hidden',
                    }}
                >
                    {/* Content positioned absolutely to fill the paper */}
                    <div
                        className="absolute inset-0 flex items-center justify-center overflow-hidden"
                        style={colorMode === 'bw' ? { filter: 'grayscale(1)' } : {}}
                    >
                        {isPdf ? (
                            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : isImage ? (
                            imgUrl && <img src={imgUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Preview" />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center">
                                <FileText className="w-10 h-10 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">Preview not available for this file type</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">Your document will print as-is</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Page indicator below paper */}
                {isPdf && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                        Page 1 of {pages}
                    </p>
                )}
            </div>

            {/* ─── Settings ─── */}
            <div className="space-y-3 mt-4">
                {/* Color Mode */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Color Mode</span>
                    <div className="flex gap-1.5">
                        <ToggleBtn active={colorMode === 'bw'} onClick={() => updatePrintSettings({ colorMode: 'bw' })}>
                            B&W · ₹3/pg
                        </ToggleBtn>
                        <ToggleBtn active={colorMode === 'color'} onClick={() => updatePrintSettings({ colorMode: 'color' })}>
                            Color · ₹10/pg
                        </ToggleBtn>
                    </div>
                </div>

                {/* Orientation */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Orientation</span>
                    <div className="flex gap-1.5">
                        <ToggleBtn active={orientation === 'portrait'} onClick={() => updatePrintSettings({ orientation: 'portrait' })}>
                            <ArrowUp className="w-3 h-3 inline mr-1" /> Portrait
                        </ToggleBtn>
                        <ToggleBtn active={orientation === 'landscape'} onClick={() => updatePrintSettings({ orientation: 'landscape' })}>
                            <ArrowRight className="w-3 h-3 inline mr-1" /> Landscape
                        </ToggleBtn>
                    </div>
                </div>

                {/* Copies */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Copies</span>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => updatePrintSettings({ copies: Math.max(1, copies - 1) })}
                            disabled={copies <= 1}
                            className="w-8 h-8 rounded-lg bg-white/5 border border-border hover:bg-white/10 flex items-center justify-center disabled:opacity-30 transition-all"
                        >
                            <Minus className="w-4 h-4 text-foreground" />
                        </button>
                        <span className="text-lg font-bold text-foreground w-8 text-center">{copies}</span>
                        <button
                            onClick={() => updatePrintSettings({ copies: Math.min(20, copies + 1) })}
                            disabled={copies >= 20}
                            className="w-8 h-8 rounded-lg bg-white/5 border border-border hover:bg-white/10 flex items-center justify-center disabled:opacity-30 transition-all"
                        >
                            <Plus className="w-4 h-4 text-foreground" />
                        </button>
                    </div>
                </div>

                {/* Page Range */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Page Range</span>
                        <div className="flex gap-1.5">
                            <ToggleBtn active={pageRange === 'all'} onClick={() => { updatePrintSettings({ pageRange: 'all' }); setCustomRange(''); setRangeError(false); }}>
                                All pages
                            </ToggleBtn>
                            <ToggleBtn active={pageRange !== 'all'} onClick={() => { updatePrintSettings({ pageRange: customRange || '1' }); }}>
                                Custom
                            </ToggleBtn>
                        </div>
                    </div>
                    {pageRange !== 'all' && (
                        <div className="space-y-1">
                            <input
                                type="text"
                                value={customRange}
                                onChange={(e) => handleRangeInput(e.target.value)}
                                placeholder="e.g. 1-3 or 1,3,5"
                                className={`w-full px-3 py-2 bg-muted/10 border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 text-sm transition-all ${
                                    rangeError ? 'border-red-500 focus:ring-red-500/30' : 'border-border focus:ring-white/30'
                                }`}
                            />
                            {!rangeError && customRange && (
                                <p className="text-xs text-muted-foreground">{effectivePages} page{effectivePages !== 1 ? 's' : ''} selected</p>
                            )}
                            {rangeError && (
                                <p className="text-xs text-red-400">Invalid format. Use numbers, commas, and dashes.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Scaling */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Scaling</span>
                    <div className="flex gap-1.5">
                        <ToggleBtn active={scaling === 'fit'} onClick={() => updatePrintSettings({ scaling: 'fit' })}>
                            Fit to page
                        </ToggleBtn>
                        <ToggleBtn active={scaling === 'actual'} onClick={() => updatePrintSettings({ scaling: 'actual' })}>
                            Actual size
                        </ToggleBtn>
                    </div>
                </div>
            </div>

            {/* ─── Price Summary ─── */}
            <div className="mt-4 p-3 rounded-xl bg-white/5 border border-border text-sm">
                <p className="text-foreground">
                    {effectivePages} page{effectivePages !== 1 ? 's' : ''} × {copies} {copies === 1 ? 'copy' : 'copies'} × ₹{pricePerPage}/page = <span className="font-bold">₹{totalPrice}</span>
                </p>
                {colorMode === 'color' && (
                    <p className="text-amber-400 text-xs mt-1">Color printing: ₹10/page</p>
                )}
            </div>

            {/* ─── Proceed Button ─── */}
            <button
                onClick={onProceed}
                disabled={rangeError}
                className="w-full bg-white text-black hover:bg-neutral-200 py-3 mt-4 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
                Continue to Payment →
            </button>
        </motion.div>
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
      
    </div>
  );
}

// ─── Fun facts data ─────────────────────────────────────────
const FUN_FACTS = [
    "The first laser printer was built by Xerox in 1969",
    "A standard inkjet nozzle is thinner than a human hair",
    "CUPS (used to run this kiosk) is open-source software from Apple",
    "The average office printer handles ~10,000 pages before needing maintenance",
    "PDF was invented by Adobe in 1993 — originally called 'Camelot'",
    "A4 paper dimensions come from a German DIN standard set in 1922",
    "The word 'printer' comes from the Latin 'premere' — to press",
    "A single cartridge of toner can print around 2,500 pages",
];

// ─── Step definitions for each service type ─────────────────
const STEP_MAP = {
    print: [
        { id: 'PAID',       label: 'Paid' },
        { id: 'SENT_TO_PI', label: 'Sent to Kiosk' },
        { id: 'QUEUED',     label: 'Queued' },
        { id: 'PRINTING',   label: 'Printing' },
        { id: 'COMPLETED',  label: 'Done' },
    ],
    scan: [
        { id: 'QUEUED',               label: 'Queued' },
        { id: 'DISCOVERING_SCANNER',   label: 'Discovering' },
        { id: 'SCANNING',             label: 'Scanning' },
        { id: 'PROCESSING',           label: 'Processing' },
        { id: 'COMPLETED',            label: 'Done' },
    ],
    xerox: [
        { id: 'PAID',       label: 'Paid' },
        { id: 'SENT_TO_PI', label: 'Sent to Kiosk' },
        { id: 'SCANNING',   label: 'Scanning' },
        { id: 'PRINTING',   label: 'Printing' },
        { id: 'COMPLETED',  label: 'Done' },
    ],
};

function getActiveStepIndex(steps, jobPhase) {
    if (!jobPhase) return 0;
    const idx = steps.findIndex(s => s.id === jobPhase);
    return idx >= 0 ? idx : 0;
}

function FunFactsTicker() {
    const [factIdx, setFactIdx] = useState(0);
    const [paused, setPaused] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (paused) return;
        intervalRef.current = setInterval(() => {
            setFactIdx(prev => (prev + 1) % FUN_FACTS.length);
        }, 6000);
        return () => clearInterval(intervalRef.current);
    }, [paused]);

    return (
        <div
            className="mt-6 bg-white/5 border border-border rounded-xl p-4 min-h-[60px] flex items-center cursor-default"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <AnimatePresence mode="wait">
                <motion.p
                    key={factIdx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="text-xs text-muted-foreground italic text-center w-full"
                >
                    💡 {FUN_FACTS[factIdx]}
                </motion.p>
            </AnimatePresence>
        </div>
    );
}

// ─── Unified Job Progress View ──────────────────────────────
export function JobProgressView({ serviceType, jobPhase, resetFlow, backToServiceSelect }) {
    const type = serviceType || 'print';
    const steps = STEP_MAP[type] || STEP_MAP.print;
    const activeIdx = getActiveStepIndex(steps, jobPhase);

    const titles = {
        print: 'Printing...',
        scan: 'Scanning...',
        xerox: 'Xeroxing...',
    };

    const currentStep = steps[activeIdx];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 py-6"
        >
            {/* Title */}
            <div className="text-center">
                <p className="text-xl font-semibold text-foreground mb-1">{titles[type]}</p>
                <p className="text-sm text-muted-foreground">{currentStep?.label || 'Processing'}</p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-0 px-2">
                {steps.map((step, i) => {
                    const isCompleted = i < activeIdx;
                    const isActive = i === activeIdx;
                    const isFuture = i > activeIdx;

                    return (
                        <React.Fragment key={step.id}>
                            {/* Connector line */}
                            {i > 0 && (
                                <div className={`h-px flex-1 max-w-[32px] transition-colors duration-300 ${
                                    isCompleted || isActive ? 'bg-white/50' : 'bg-white/10'
                                }`} />
                            )}

                            {/* Step dot + label */}
                            <div className="flex flex-col items-center gap-1.5 min-w-0">
                                <div className={`relative w-3 h-3 rounded-full transition-all duration-300 ${
                                    isCompleted ? 'bg-white' :
                                    isActive ? 'bg-white' :
                                    'bg-white/15'
                                }`}>
                                    {isActive && (
                                        <motion.div
                                            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                            className="absolute inset-0 rounded-full bg-white"
                                        />
                                    )}
                                </div>
                                <span className={`text-[10px] leading-tight text-center whitespace-nowrap transition-colors ${
                                    isCompleted ? 'text-white/70' :
                                    isActive ? 'text-white font-medium' :
                                    'text-white/25'
                                }`}>
                                    {step.label}
                                </span>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Fun facts */}
            <FunFactsTicker />
        </motion.div>
    );
}

export function CompletedView({ serviceType, printAnotherOnSameKiosk, resetFlow }) {
  const title = serviceType === 'xerox' ? 'Xerox Complete!' : 'Print Complete!';
  const subtitle = serviceType === 'xerox' ? 'Collect your copies' : 'Collect your document';

  return (
    <div className="space-y-6 text-center py-8">
      <div className="relative">
        <CheckCircle className="h-20 w-20 mx-auto text-foreground"/>
      </div>
      <div>
        <p className="text-2xl font-bold mb-2 text-foreground">
          {title}
        </p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={printAnotherOnSameKiosk}
          className="w-full bg-white text-black hover:bg-neutral-200 font-semibold py-6 transition-colors"
        >
          <Printer className="mr-2 h-5 w-5"/>
          {serviceType === 'xerox' ? 'Xerox Another Document' : 'Print Another Document'}
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
export function ServiceSelectView({ selectService, setScanKioskMode }) {
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
                onClick={() => setScanKioskMode(true)}
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


// ScanningView and XeroxingView are now handled by JobProgressView
// Kept as aliases for backward compatibility if directly imported
export function ScanningView({ jobPhase, ...rest }) {
    return <JobProgressView serviceType="scan" jobPhase={jobPhase} {...rest} />;
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


// ─── VIEW: Xeroxing in progress (alias for JobProgressView) ─
export function XeroxingView({ jobPhase, ...rest }) {
    return <JobProgressView serviceType="xerox" jobPhase={jobPhase} {...rest} />;
}


// ─── VIEW: Generic Job Error (with refund button) ──────────
export function JobErrorView({ serviceType, logs, backToServiceSelect, resetFlow }) {
    // Extract the latest error from logs
    const errorLog = logs.find(l => l.includes('Job failed:') || l.includes('error'));
    const errorMsg = errorLog
        ? errorLog.replace(/^\[.*?\]\s*/, '')
        : 'Something went wrong. Please try again.';

    const title = serviceType === 'scan' ? 'Scan Failed'
        : serviceType === 'xerox' ? 'Xerox Failed'
        : 'Print Failed';
    const icon = serviceType === 'scan' ? ScanLine
        : serviceType === 'xerox' ? Copy
        : Printer;
    const Icon = icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-5 py-4"
        >
            <div className="text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-16 h-16 mx-auto bg-red-500/10 rounded-2xl flex items-center justify-center mb-4"
                >
                    <Icon className="w-8 h-8 text-red-400" />
                </motion.div>
                <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {errorMsg}
                </p>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-400/80">
                        If you've already been charged, you can request a refund below.
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <Button
                    onClick={backToServiceSelect}
                    className="w-full bg-white text-black hover:bg-neutral-200 font-semibold py-5 transition-colors"
                >
                    <RefreshCw className="mr-2 w-4 h-4" />
                    Try Again
                </Button>

                <a
                    href={`/contact?subject=${encodeURIComponent('Refund Request')}`}
                    className="block"
                >
                    <Button
                        variant="outline"
                        className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                        <ExternalLink className="mr-2 w-4 h-4" />
                        Request Refund
                    </Button>
                </a>

                <Button
                    variant="ghost"
                    onClick={resetFlow}
                    className="w-full text-muted-foreground hover:text-foreground hover:bg-white/5 text-sm"
                >
                    <ArrowLeft className="mr-1 w-4 h-4" /> Scan a Different Kiosk
                </Button>
            </div>
        </motion.div>
    );
}


// ─── VIEW: All Jobs Summary (shown when every job is done) ──
const JOB_ICONS_MAP = { print: '🖨️', scan: '📄', xerox: '📋' };
const JOB_LABELS_MAP = { print: 'Print', scan: 'Scan', xerox: 'Xerox' };

function formatDuration(start, end) {
    if (!start || !end) return '—';
    const ms = new Date(end) - new Date(start);
    const totalSec = Math.floor(ms / 1000);
    if (totalSec < 60) return `${totalSec}s`;
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}m ${sec}s`;
}

export function AllJobsSummaryView({ jobs, resetFlow, isGuest, navigate }) {
    const succeeded = jobs.filter(j => j.success === true).length;
    const total = jobs.length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5 py-4"
        >
            {/* Header */}
            <div className="text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                    <CheckCircle className="h-16 w-16 mx-auto text-foreground mb-3" />
                </motion.div>
                <h3 className="text-xl font-bold text-foreground mb-1">All jobs complete</h3>
                <p className="text-sm text-muted-foreground">
                    {succeeded} of {total} job{total !== 1 ? 's' : ''} completed successfully
                </p>
            </div>

            {/* Per-job rows */}
            <div className="space-y-2">
                {jobs.map((job, i) => {
                    const isSuccess = job.success === true;
                    return (
                        <motion.div
                            key={job.jobId || i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="flex items-center gap-3 bg-white/5 border border-border rounded-xl p-3"
                        >
                            <span className="text-lg">{JOB_ICONS_MAP[job.jobType] || '🖨️'}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                    {JOB_LABELS_MAP[job.jobType] || 'Job'}
                                    {job.filename ? ` — ${job.filename}` : ''}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {job.pages ? `${job.pages} page${job.pages !== 1 ? 's' : ''}` : ''}
                                    {job.pages ? ' · ' : ''}
                                    {formatDuration(job.createdAt, job.completedAt)}
                                </p>
                            </div>
                            <div className="shrink-0">
                                {isSuccess ? (
                                    <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">Completed</span>
                                ) : (
                                    <span className="text-xs font-medium text-red-400 bg-red-400/10 px-2 py-1 rounded-lg">Failed</span>
                                )}
                            </div>
                            {/* Download for scan jobs */}
                            {job.jobType === 'scan' && job.downloadUrl && isSuccess && (
                                <a href={job.downloadUrl} target="_blank" rel="noopener noreferrer">
                                    <Download className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                                </a>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="space-y-2">
                <Button
                    onClick={resetFlow}
                    className="w-full bg-white text-black hover:bg-neutral-200 font-semibold py-5 transition-colors"
                >
                    <Printer className="mr-2 h-5 w-5" />
                    Print again
                </Button>

                {!isGuest && (
                    <Button
                        variant="ghost"
                        onClick={() => navigate && navigate('/history')}
                        className="w-full text-muted-foreground hover:text-foreground hover:bg-white/5"
                    >
                        Go to History →
                    </Button>
                )}
            </div>
        </motion.div>
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


// ─── Modal: Back Confirmation (Task 3) ──────────────────────
const JOB_TYPE_LABELS = { print: 'Print', scan: 'Scan', xerox: 'Xerox' };

export function BackConfirmModal({ open, onOpenChange, onConfirm }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Go back?</DialogTitle>
          <DialogDescription>
            This job will stay as pending. You have {PENDING_JOB_EXPIRY_MINUTES} minutes to resume
            it before it expires.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            Stay here
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-white text-black hover:bg-neutral-200"
          >
            Go back
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


// ─── Modal: Job Expired (Task 4) ────────────────────────────
export function ExpiryModal({ open, onOpenChange, jobType }) {
  const label = JOB_TYPE_LABELS[jobType] || 'Print';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Job expired</DialogTitle>
          <DialogDescription>
            Your {label} job expired before payment was completed. No charge was made.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-white text-black hover:bg-neutral-200"
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
