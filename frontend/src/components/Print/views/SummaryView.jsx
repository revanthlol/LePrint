import React from 'react';
import { motion } from 'framer-motion';
import { Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
            <div className="text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-20 h-20 mx-auto rounded-[1.5rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center shadow-2xl shadow-white/5 mb-4"
                >
                    <CheckCircle className="h-10 w-10 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold tracking-tight text-foreground mb-1">All jobs complete</h3>
                <p className="text-[13px] text-muted-foreground/80">
                    {succeeded} of {total} job{total !== 1 ? 's' : ''} completed successfully
                </p>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 space-y-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">Job Results</span>
                <div className="space-y-2 mt-2">
                    {jobs.map((job, i) => {
                        const isSuccess = job.success === true;
                        return (
                            <motion.div
                                key={job.jobId || i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 hover:bg-white/[0.04] transition-all"
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
                                        <span className="text-[11px] font-medium text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full">Completed</span>
                                    ) : (
                                        <span className="text-[11px] font-medium text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full">Failed</span>
                                    )}
                                </div>
                                {job.jobType === 'scan' && job.downloadUrl && isSuccess && (
                                    <a href={job.downloadUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition-colors">
                                        <Download className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                                    </a>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-2">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                    <Button
                        onClick={resetFlow}
                        className="w-full bg-white text-black hover:bg-neutral-200 font-semibold py-5 rounded-xl transition-colors"
                    >
                        <Printer className="mr-2 h-5 w-5" />
                        Print again
                    </Button>
                </motion.div>

                {!isGuest && (
                    <Button
                        variant="ghost"
                        onClick={() => navigate && navigate('/history')}
                        className="w-full text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-xl"
                    >
                        Go to History →
                    </Button>
                )}
            </div>
        </motion.div>
    );
}

const CheckCircle = ({ className, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
