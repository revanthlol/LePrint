import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IndianRupee, CheckCircle, Printer, Loader2, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Fun facts data ───
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

// ─── Step definitions for each service type ───
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

export function FunFactsTicker() {
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
            className="mt-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 min-h-[60px] flex flex-col items-center justify-center cursor-default"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40 font-bold mb-1 justify-center">
                <span>💡</span>
                <span>Did you know?</span>
            </div>
            <AnimatePresence mode="wait">
                <motion.p
                    key={factIdx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="text-[13px] text-muted-foreground/70 italic text-center w-full"
                >
                    {FUN_FACTS[factIdx]}
                </motion.p>
            </AnimatePresence>
        </div>
    );
}

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
            {/* Hero icon */}
            <div className="flex justify-center mb-4">
                <motion.div
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center"
                >
                    <Printer className="w-8 h-8 text-white" />
                </motion.div>
            </div>

            <div className="text-center">
                <p className="text-xl font-semibold tracking-tight text-foreground mb-1">{titles[type]}</p>
                <span className="bg-white/[0.05] px-3 py-1 rounded-full text-[12px] text-muted-foreground inline-block mt-2">
                    {currentStep?.label || 'Processing'}
                </span>
            </div>

            {/* Stepper in glass card */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
                <div className="flex items-center justify-center gap-0 px-2">
                    {steps.map((step, i) => {
                        const isCompleted = i < activeIdx;
                        const isActive = i === activeIdx;

                        return (
                            <React.Fragment key={step.id}>
                                {i > 0 && (
                                    <div className={`h-px flex-1 max-w-[40px] transition-colors duration-300 ${
                                        isCompleted || isActive ? 'bg-white/50' : 'bg-white/10'
                                    }`} />
                                )}

                                <div className="flex flex-col items-center gap-1.5 min-w-0">
                                    <div className={`relative w-3.5 h-3.5 rounded-full transition-all duration-300 flex items-center justify-center ${
                                        isCompleted ? 'bg-white' :
                                        isActive ? 'bg-white' :
                                        'bg-white/15'
                                    }`}>
                                        {isCompleted && (
                                            <Check className="w-2.5 h-2.5 text-black" />
                                        )}
                                        {isActive && (
                                            <motion.div
                                                animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                                className="absolute inset-0 rounded-full bg-white"
                                            />
                                        )}
                                    </div>
                                    <span className={`text-[11px] leading-tight text-center whitespace-nowrap transition-colors ${
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
            </div>

            <FunFactsTicker />
        </motion.div>
    );
}

export function PaymentView({ pricing, handlePayment, setStatus, setFile, setPricing }) {
  return (
    <div className="space-y-5">
      {/* Order summary card */}
      <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-5 shadow-lg shadow-black/10">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">Payment Summary</span>

        <div className="mt-4 space-y-3">
          {/* Job ID row */}
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-muted-foreground">Job ID</span>
            <span className="text-[12px] text-muted-foreground/70 font-mono bg-white/[0.04] px-2 py-0.5 rounded">{pricing.job_id.slice(0, 16)}...</span>
          </div>
          {/* Pages row */}
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-muted-foreground">Pages</span>
            <span className="text-foreground text-lg font-bold tabular-nums">{pricing.pages}</span>
          </div>
          {/* Rate row */}
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-muted-foreground">Rate</span>
            <span className="text-foreground text-[13px]">₹{pricing.pricePerPage}/page</span>
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-white/[0.06] mt-4 pt-4 flex justify-between items-center">
          <span className="text-sm font-medium text-foreground">Total</span>
          <span className="text-3xl font-bold text-foreground tabular-nums">₹{pricing.totalPrice}</span>
        </div>
      </div>

      {/* Trust signal */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground/50">
        <Shield className="w-3.5 h-3.5" />
        <span>Secured by Razorpay · Instant refund policy</span>
      </div>

      {/* Pay button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={handlePayment}
        className="w-full bg-white text-black hover:bg-neutral-200 font-bold py-4 text-lg rounded-xl shadow-lg shadow-black/10 transition-colors flex items-center justify-center gap-2"
      >
        <IndianRupee className="h-5 w-5"/>
        Pay ₹{pricing.totalPrice} & Print
      </motion.button>
    </div>
  );
}

export function CompletedView({ serviceType, printAnotherOnSameKiosk, resetFlow }) {
  const title = serviceType === 'xerox' ? 'Xerox Complete!' : 'Print Complete!';
  const subtitle = serviceType === 'xerox' ? 'Collect your copies' : 'Collect your document';

  return (
    <div className="space-y-5 text-center py-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-24 h-24 mx-auto rounded-[2rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center shadow-2xl shadow-white/5"
      >
        <CheckCircle className="h-12 w-12 text-white" />
      </motion.div>

      <div>
        <p className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </p>
        <p className="text-sm text-muted-foreground/80 mt-1">{subtitle}</p>
      </div>

      {/* Success detail card */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 text-center">
        <p className="text-[13px] text-muted-foreground">
          Your {serviceType === 'xerox' ? 'copies are' : 'document is'} ready for collection at the kiosk.
        </p>
      </div>

      <div className="space-y-3">
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={printAnotherOnSameKiosk}
            className="w-full bg-white text-black hover:bg-neutral-200 font-semibold py-6 transition-colors rounded-xl"
          >
            <Printer className="mr-2 h-5 w-5"/>
            {serviceType === 'xerox' ? 'Xerox Another Document' : 'Print Another Document'}
          </Button>
        </motion.div>

        <motion.div whileHover={{ x: -2 }}>
          <Button
            onClick={resetFlow}
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-xl"
          >
            ← Exit to Scanner
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
