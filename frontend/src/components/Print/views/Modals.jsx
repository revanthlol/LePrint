import React from 'react';
import { motion } from 'framer-motion';
import {
  Dialog, DialogContent, DialogHeader, DialogFooter,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PENDING_JOB_EXPIRY_MINUTES } from '../logic/printConstants';

const JOB_TYPE_LABELS = { print: 'Print', scan: 'Scan', xerox: 'Xerox' };

export function BackConfirmModal({ open, onOpenChange, onConfirm }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-[#0a0a0a] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50">
        <DialogHeader>
          <DialogTitle className="tracking-tight text-lg">Go back?</DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground/80 leading-relaxed mt-2">
            This job will stay as pending. You have {PENDING_JOB_EXPIRY_MINUTES} minutes to resume
            it before it expires.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-xl"
          >
            Stay here
          </Button>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              onClick={onConfirm}
              className="w-full bg-white text-black hover:bg-neutral-200 rounded-xl"
            >
              Go back
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ExpiryModal({ open, onOpenChange, jobType }) {
  const label = JOB_TYPE_LABELS[jobType] || 'Print';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-[#0a0a0a] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50">
        <DialogHeader>
          <DialogTitle className="tracking-tight text-lg">Job expired</DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground/80 leading-relaxed mt-2">
            Your {label} job expired before payment was completed. No charge was made.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <motion.div whileTap={{ scale: 0.97 }} className="w-full">
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full bg-white text-black hover:bg-neutral-200 rounded-xl"
            >
              OK
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function KioskChoiceModal({ open, onOpenChange, onContinue, onSwitch, title, description }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0a0a0a] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 p-6">
        <DialogHeader>
          <div className="flex flex-col items-center text-center gap-4 mb-4">
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center shadow-2xl shadow-white/5"
            >
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L4 20M18 18l2 2M6 6l-2-2M18 6l2-2M6 9h12a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4a2 2 0 012-2zM9 13h.01M12 13h.01" />
              </svg>
            </motion.div>
            <div className="space-y-1.5">
              <DialogTitle className="text-xl font-bold tracking-tight text-white">
                {title || 'Print another document?'}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground/80 leading-relaxed max-w-[280px] mx-auto">
                {description || 'Choose to stay on this kiosk or switch to a different one for your next job.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-2">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={onContinue}
              variant="outline"
              className="w-full h-auto py-5 px-4 flex flex-col items-center gap-3 bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] rounded-2xl transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-center space-y-1">
                <p className="text-white font-bold text-sm">Same Kiosk</p>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em] font-bold">Stay Here</p>
              </div>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={onSwitch}
              className="w-full h-auto py-5 px-4 flex flex-col items-center gap-3 bg-white text-black hover:bg-neutral-200 rounded-2xl shadow-xl shadow-white/5 transition-all duration-300 border border-transparent"
            >
              <div className="w-10 h-10 rounded-xl bg-black/[0.05] flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m0 14v1m-7-8H4m16 0h-1M6.343 6.343l-.707-.707m12.728 12.728l-.707-.707M6.343 17.657l-.707.707M17.657 6.343l-.707.707" />
                </svg>
              </div>
              <div className="text-center space-y-1">
                <p className="font-bold text-sm">New Kiosk</p>
                <p className="text-[10px] text-black/40 uppercase tracking-[0.2em] font-bold">Scan QR</p>
              </div>
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
