import React from 'react';
import { motion } from 'framer-motion';
import { ScanLine, Download, Copy, Minus, Plus, IndianRupee, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JobProgressView } from './ProgressViews';

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
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center mb-3">
                    <ScanLine className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold tracking-tight text-foreground">Scan Options</h3>
                <p className="text-sm text-muted-foreground/80">Place your document on the scanner</p>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 space-y-5">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">Scan Settings</span>
                
                <div className="space-y-2">
                    <label className="text-[13px] text-muted-foreground font-medium">Resolution (DPI)</label>
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-1 flex gap-1">
                        {resolutions.map((dpi) => (
                            <button
                                key={dpi}
                                onClick={() => setScanOptions(prev => ({ ...prev, resolution: dpi }))}
                                className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                                    scanOptions.resolution === dpi
                                        ? 'bg-white text-black shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.06]'
                                }`}
                            >
                                {dpi}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[13px] text-muted-foreground font-medium">Color Mode</label>
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-1 flex gap-1">
                        {colorModes.map((mode) => (
                            <button
                                key={mode.value}
                                onClick={() => setScanOptions(prev => ({ ...prev, colorMode: mode.value }))}
                                className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                                    scanOptions.colorMode === mode.value
                                        ? 'bg-white text-black shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.06]'
                                }`}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">Price</span>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Standard Scan</span>
                    <span className="text-lg font-bold text-foreground">₹5</span>
                </div>
            </div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button
                    onClick={handleScanStart}
                    className="w-full bg-white text-black hover:bg-neutral-200 font-bold py-6 text-lg rounded-xl transition-colors"
                >
                    <ScanLine className="mr-2 h-5 w-5" />
                    Start Scan — ₹5
                </Button>
            </motion.div>

            <motion.div whileHover={{ x: -2 }}>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={backToServiceSelect}
                    className="w-full text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-xl"
                >
                    <ArrowLeft className="mr-1 w-4 h-4" /> Back
                </Button>
            </motion.div>
        </motion.div>
    );
}

export function ScanningView({ jobPhase, ...rest }) {
    return <JobProgressView serviceType="scan" jobPhase={jobPhase} {...rest} />;
}

export function ScanCompleteView({ scanResult, printAnotherOnSameKiosk, resetFlow }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-5 text-center py-5"
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 mx-auto rounded-[1.5rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center shadow-2xl shadow-white/5"
            >
                <CheckCircle className="h-10 w-10 text-white" />
            </motion.div>
            <div>
                <p className="text-2xl font-bold tracking-tight text-foreground">Scan Complete!</p>
                <p className="text-sm text-muted-foreground/80 mt-1">Your document has been scanned</p>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 text-center">
                <p className="text-[13px] text-muted-foreground">Your scanned document is ready for download.</p>
            </div>

            <div className="space-y-3">
                {scanResult?.downloadUrl && (
                    <a
                        href={scanResult.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                    >
                        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                            <Button className="w-full bg-white text-black hover:bg-neutral-200 font-bold py-6 text-lg rounded-xl transition-colors">
                                <Download className="mr-2 h-5 w-5" />
                                Download Scanned PDF
                            </Button>
                        </motion.div>
                    </a>
                )}

                <Button
                    onClick={printAnotherOnSameKiosk}
                    variant="outline"
                    className="w-full border-white/[0.08] hover:bg-white/[0.04] py-5 rounded-xl transition-colors"
                >
                    <ScanLine className="mr-2 h-5 w-5" />
                    Scan Another Document
                </Button>

                <motion.div whileHover={{ x: -2 }}>
                    <Button
                        onClick={resetFlow}
                        variant="ghost"
                        className="w-full text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-xl"
                    >
                        <ArrowLeft className="mr-1 w-4 h-4" /> Exit to Scanner
                    </Button>
                </motion.div>
            </div>
        </motion.div>
    );
}

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
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center mb-3">
                    <Copy className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold tracking-tight text-foreground">Xerox Options</h3>
                <p className="text-sm text-muted-foreground/80">Place your document on the scanner</p>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 space-y-5">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">Xerox Settings</span>
                
                <div className="space-y-2">
                    <label className="text-[13px] text-muted-foreground font-medium">Number of Copies</label>
                    <div className="flex items-center justify-center gap-4">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setXeroxCopies(prev => Math.max(1, prev - 1))}
                            disabled={xeroxCopies <= 1}
                            className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] flex items-center justify-center disabled:opacity-30 transition-all"
                        >
                            <Minus className="w-5 h-5 text-foreground" />
                        </motion.button>
                        <span className="text-4xl font-bold text-foreground w-16 text-center tabular-nums">{xeroxCopies}</span>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setXeroxCopies(prev => Math.min(20, prev + 1))}
                            disabled={xeroxCopies >= 20}
                            className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] flex items-center justify-center disabled:opacity-30 transition-all"
                        >
                            <Plus className="w-5 h-5 text-foreground" />
                        </motion.button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[13px] text-muted-foreground font-medium">Color Mode</label>
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-1 flex gap-1">
                        {colorModes.map((mode) => (
                            <button
                                key={mode.value}
                                onClick={() => setScanOptions(prev => ({ ...prev, colorMode: mode.value }))}
                                className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                                    scanOptions.colorMode === mode.value
                                        ? 'bg-white text-black shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.06]'
                                }`}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">Price</span>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">₹{PRICE_PER_COPY} x {xeroxCopies} {xeroxCopies === 1 ? 'copy' : 'copies'}</span>
                    <span className="text-2xl font-bold text-foreground">₹{totalPrice}</span>
                </div>
            </div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button
                    onClick={handleXeroxStart}
                    className="w-full bg-white text-black hover:bg-neutral-200 font-bold py-6 text-lg rounded-xl transition-colors"
                >
                    <IndianRupee className="mr-2 h-5 w-5" />
                    Xerox {xeroxCopies} {xeroxCopies === 1 ? 'Copy' : 'Copies'} — ₹{totalPrice}
                </Button>
            </motion.div>

            <motion.div whileHover={{ x: -2 }}>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={backToServiceSelect}
                    className="w-full text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-xl"
                >
                    <ArrowLeft className="mr-1 w-4 h-4" /> Back
                </Button>
            </motion.div>
        </motion.div>
    );
}

export function XeroxingView({ jobPhase, ...rest }) {
    return <JobProgressView serviceType="xerox" jobPhase={jobPhase} {...rest} />;
}
