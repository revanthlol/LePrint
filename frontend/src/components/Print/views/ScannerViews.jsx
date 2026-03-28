import React, { Suspense } from 'react';
import { Loader2, QrCode, AlertCircle, Printer, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ZXingScanner from '../ZXingScanner';

export function QRScannerView({ 
  scannerActive, 
  cameraError, 
  handleScan, 
  handleScanError, 
  setScannerActive, 
  setCameraError 
}) {
  return (
    <div className="space-y-5">
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-lg shadow-black/10">
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
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square bg-white/[0.02] flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 shadow-2xl shadow-white/5 flex items-center justify-center mb-6">
                <QrCode className="h-10 w-10 text-white/60" />
              </div>
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed max-w-[200px] mx-auto">
                {cameraError || 'Camera permission is required to scan QR codes'}
              </p>
              <Button 
                size="sm" 
                onClick={() => { setScannerActive(true); setCameraError(null); }}
                className="bg-white text-black hover:bg-neutral-200 transition-colors rounded-xl font-semibold px-6"
              >
                Enable Camera
              </Button>
            </motion.div>
          )}
        </Suspense>
      </div>
      
      {cameraError && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-sm text-yellow-500">
          <AlertCircle className="inline mr-2 h-4 w-4"/>
          {cameraError}
        </div>
      )}
      
      <p className="text-center text-sm text-muted-foreground tracking-wide">
        Point your camera at the kiosk QR code
      </p>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/[0.06]"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#0a0a0a] px-2 tracking-[0.15em] font-medium text-muted-foreground/60">
            Or enter manually
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Kiosk ID (e.g., kiosk_001)"
          className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/15 text-sm transition-all"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
              handleScan([{ rawValue: e.target.value.trim() }]);
              e.target.value = '';
            }
          }}
        />
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={(e) => {
              const input = e.currentTarget.parentElement.parentElement.querySelector('input');
              if (input && input.value.trim()) {
                handleScan([{ rawValue: input.value.trim() }]);
                input.value = '';
              }
            }}
            className="w-full bg-white text-black hover:bg-neutral-200 py-3 rounded-xl font-semibold transition-colors"
          >
            Connect
          </Button>
        </motion.div>
      </div>

      <div className="mt-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-sm text-muted-foreground space-y-1.5">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">Getting started</span>
        <p className="font-semibold tracking-tight text-foreground text-sm">
          How LePrint works
        </p>
        <div className="space-y-1">
          <p className="text-[13px] text-muted-foreground/80 leading-relaxed">1. Scan the QR code at the printer kiosk</p>
          <p className="text-[13px] text-muted-foreground/80 leading-relaxed">2. Upload your document and choose print settings</p>
          <p className="text-[13px] text-muted-foreground/80 leading-relaxed">3. Pay securely online via Razorpay</p>
          <p className="text-[13px] text-muted-foreground/80 leading-relaxed">4. Collect your printout at the kiosk</p>
        </div>
        <p className="pt-1.5 text-muted-foreground/50 text-xs">
          Printing starts only after successful payment confirmation.
        </p>
      </div>
    </div>
  );
}

export function StatusCheckView() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 text-center py-8"
        >
            <div className="relative mx-auto w-20 h-20">
                <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 shadow-2xl shadow-white/5 flex items-center justify-center"
                >
                    <Printer className="w-10 h-10 text-white" />
                </motion.div>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 rounded-[1.5rem] border-2 border-transparent border-t-white/30"
                />
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 text-center">
                <p className="text-lg font-semibold tracking-tight text-foreground mb-1">
                    Checking Printer Status...
                </p>
                <p className="text-sm text-muted-foreground">
                    Verifying kiosk is ready
                </p>
            </div>

            <div className="flex justify-center gap-1.5">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                        className="w-1.5 h-1.5 rounded-full bg-white/40"
                    />
                ))}
            </div>
        </motion.div>
    );
}

export function KioskProfileView({ config, printerStatusResult, connectPrinterAfterStatusCheck, resetFlow, isAdmin }) {
  const kioskId = config?.kiosk_id;
  const location = config?.location || printerStatusResult?.kiosk_location_name || 'Main Lobby';
  const floor = config?.floor || printerStatusResult?.kiosk_floor;
  const paperCount = printerStatusResult?.paper_count ?? 0;
  const maxPaper = 500;
  const paperPercent = Math.min(100, Math.max(0, (paperCount / maxPaper) * 100));
  const isRestricted = printerStatusResult?.restricted === true;
  const canProceed = !isRestricted || isAdmin;

  // Determine paper status color
  const getPaperColor = () => {
    if (paperCount > 200) return 'bg-emerald-500/60';
    if (paperCount > 50) return 'bg-amber-500/60';
    return 'bg-red-500/60';
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="w-20 h-20 mx-auto rounded-[2rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center shadow-2xl shadow-white/5"
        >
          <Printer className="h-10 w-10 text-white" />
        </motion.div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">{location}</h2>
            {isRestricted && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                Admin Only
              </span>
            )}
          </div>
          {floor && (
            <p className="text-sm text-muted-foreground/60 uppercase tracking-[0.2em] font-bold">
              Floor {floor}
            </p>
          )}
        </div>
      </div>

      {isRestricted && !isAdmin && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-500">Test Printing Disabled</p>
            <p className="text-xs text-amber-500/70 leading-relaxed">
              This kiosk is reserved for system testing. Only administrators can connect to this environment.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {/* Connection Status Card */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="text-sm font-medium text-foreground">Kiosk Online</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/40 px-2 py-1 rounded bg-white/[0.05] border border-white/[0.06]">
            #{kioskId}
          </span>
        </div>

        {/* Paper Level Card */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground/60 font-bold">Printer Health</span>
            </div>
            <span className="text-[13px] font-bold text-foreground tabular-nums">
              {paperCount} / {maxPaper} <span className="text-[11px] font-normal text-muted-foreground/40 ml-1">pages</span>
            </span>
          </div>
          
          <div className="space-y-1.5">
            <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${paperPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${getPaperColor()}`}
              />
            </div>
            <p className="text-[11px] text-muted-foreground/50 text-right italic font-medium">
              {paperCount > 50 ? 'Ample paper available' : 'Low paper warning'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <motion.div whileHover={canProceed ? { scale: 1.01 } : {}} whileTap={canProceed ? { scale: 0.98 } : {}}>
          <Button
            onClick={() => canProceed && connectPrinterAfterStatusCheck(kioskId)}
            disabled={!canProceed}
            className={`w-full font-semibold py-7 transition-colors rounded-2xl text-lg shadow-xl shadow-white/5 ${
              canProceed 
                ? 'bg-white text-black hover:bg-neutral-200' 
                : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
            }`}
          >
            {isRestricted && !isAdmin ? 'Restricted Access' : 'Get Started'}
          </Button>
        </motion.div>

        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            variant="ghost"
            onClick={resetFlow}
            className="w-full text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-xl py-5"
          >
            ← Scan different kiosk
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

export function ConnectView({ config, status, connectPrinter, resetFlow }) {
  return (
    <div className="space-y-5">
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
            <QrCode className="h-5 w-5 text-white" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">Kiosk Detected</span>
        </div>
        <p className="text-lg font-bold text-foreground font-mono tracking-wide">{config?.kiosk_id}</p>
        {config?.location && (
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
            <span className="opacity-70">📍</span> {config.location} {config.floor && `• Floor ${config.floor}`}
          </p>
        )}
      </div>

      {status === 'ERROR' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-500">
          <AlertCircle className="inline mr-2 h-4 w-4"/>
          Kiosk offline or not found
        </div>
      )}
      
      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
        <Button 
          onClick={connectPrinter} 
          disabled={status === 'CONNECTING'} 
          className="w-full bg-white text-black hover:bg-neutral-200 shadow-lg font-semibold py-6 transition-colors rounded-xl"
        >
          {status === 'CONNECTING' ? (
            <><Loader2 className="animate-spin mr-2 h-5 w-5"/> Checking...</>
          ) : (
            <><Zap className="mr-2 h-5 w-5 fill-current"/> Connect</>
          )}
        </Button>
      </motion.div>
      
      <motion.div whileHover={{ x: -2 }} whileTap={{ scale: 0.97 }}>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={resetFlow}
          className="w-full text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-xl"
        >
          ← Scan Again
        </Button>
      </motion.div>
    </div>
  );
}
