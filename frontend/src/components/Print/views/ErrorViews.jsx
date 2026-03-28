import React from 'react';
import { XCircle, RefreshCw, AlertTriangle, CheckCircle, AlertCircle, ScanLine, Copy, Printer, ExternalLink, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export function PrinterErrorView({ printerStatusResult, resetFlow }) {
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
            <div className="text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4"
                >
                    <span className="text-3xl">{errorInfo.icon}</span>
                </motion.div>
                <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">
                    {errorInfo.title}
                </h3>
                <p className="text-[13px] text-muted-foreground/80 leading-relaxed max-w-[280px] mx-auto">
                    {errorInfo.desc}
                </p>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-[13px] font-semibold text-red-400">Upload Blocked</p>
                        <p className="text-[12px] text-red-400/60 leading-relaxed mt-0.5">
                            To protect your payment, we've prevented file upload until this issue is resolved.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                    <Button
                        onClick={resetFlow}
                        className="w-full bg-white text-black hover:bg-neutral-200 font-semibold py-5 rounded-xl transition-colors"
                    >
                        <RefreshCw className="mr-2 w-4 h-4" />
                        Scan a Different Kiosk
                    </Button>
                </motion.div>

                <motion.div whileHover={{ x: -2 }}>
                    <Button
                        variant="ghost"
                        onClick={resetFlow}
                        className="w-full text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-xl text-sm"
                    >
                        ← Back to Scanner
                    </Button>
                </motion.div>
            </div>
        </motion.div>
    );
}

export function PrinterWarningView({ proceedDespiteWarning, resetFlow }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5 py-2"
        >
            <div className="text-center">
                <motion.div
                    animate={{ rotate: [-3, 3, -3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4"
                >
                    <AlertTriangle className="w-8 h-8 text-amber-400" />
                </motion.div>
                <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">
                    Quick Check Needed
                </h3>
                <p className="text-[13px] text-muted-foreground/80 leading-relaxed">
                    We couldn't automatically verify this printer's status. 
                    This is common with some printer models.
                </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-3">
                <p className="text-[13px] font-semibold text-amber-400 flex items-center gap-2">
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
                            className="flex items-start gap-2 text-[12px] text-amber-400/70"
                        >
                            <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500/50" />
                            {item}
                        </motion.li>
                    ))}
                </ul>
            </div>

            <div className="space-y-2">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                        onClick={proceedDespiteWarning}
                        className="w-full bg-white text-black hover:bg-neutral-200 font-bold py-5 rounded-xl transition-colors"
                    >
                        <CheckCircle className="mr-2 w-5 h-5" />
                        Looks Good, Proceed
                    </Button>
                </motion.div>

                <motion.div whileHover={{ x: -2 }}>
                    <Button
                        variant="ghost"
                        onClick={resetFlow}
                        className="w-full text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-xl text-sm"
                    >
                        ← Scan a Different Kiosk
                    </Button>
                </motion.div>
            </div>
        </motion.div>
    );
}

export function JobErrorView({ serviceType, logs, backToServiceSelect, resetFlow }) {
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
                    className="w-16 h-16 mx-auto bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-4"
                >
                    <Icon className="w-8 h-8 text-red-400" />
                </motion.div>
                <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">{title}</h3>
                <p className="text-[13px] text-muted-foreground/80 leading-relaxed">
                    {errorMsg}
                </p>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                    <p className="text-[13px] text-red-400/70 leading-relaxed">
                        If you've already been charged, you can request a refund below.
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                    <Button
                        onClick={backToServiceSelect}
                        className="w-full bg-white text-black hover:bg-neutral-200 font-semibold py-5 rounded-xl transition-colors"
                    >
                        <RefreshCw className="mr-2 w-4 h-4" />
                        Try Again
                    </Button>
                </motion.div>

                <a
                    href={`/contact?subject=${encodeURIComponent('Refund Request')}`}
                    className="block"
                >
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                        <Button
                            variant="outline"
                            className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl"
                        >
                            <ExternalLink className="mr-2 w-4 h-4" />
                            Request Refund
                        </Button>
                    </motion.div>
                </a>

                <motion.div whileHover={{ x: -2 }}>
                    <Button
                        variant="ghost"
                        onClick={resetFlow}
                        className="w-full text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-xl text-sm"
                    >
                        <ArrowLeft className="mr-1 w-4 h-4" /> Scan a Different Kiosk
                    </Button>
                </motion.div>
            </div>
        </motion.div>
    );
}
