import React from 'react';
import { motion } from 'framer-motion';
import {
  Dialog, DialogContent, DialogHeader, DialogFooter,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PENDING_JOB_EXPIRY_MINUTES } from '../usePrint';

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
