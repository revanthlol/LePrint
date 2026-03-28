// frontend/src/components/Admin/RecentJobsTable.jsx
// Table showing recent print jobs across all kiosks + admin detail modal

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, Loader2, XCircle, Clock, Copy, Download, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const STATUS_BADGE_COLORS = {
    'COMPLETED': 'bg-green-500/20 text-green-400 border-green-500/30',
    'PRINTING': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'FAILED': '',
    'PENDING': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'PAID': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'CANCELLED': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

// ─── Admin Job Detail Modal ─────────────────────────────────
function AdminJobDetailModal({ job, open, onClose }) {
    const [copied, setCopied] = useState(false);
    const [metaExpanded, setMetaExpanded] = useState(false);

    if (!job) return null;

    const copyText = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const jobType = job.jobType || 'print';
    const printSettings = job.metadata?.print_settings;

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="sm:max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <span>{jobType === 'scan' ? '📄' : jobType === 'xerox' ? '📋' : '🖨️'}</span>
                        <span className="truncate">{job.filename || 'Untitled'}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 text-sm">
                    {/* Job Info */}
                    <section className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Job Info</h4>
                        <div className="bg-muted/10 border border-border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Job ID</span>
                                <div className="flex items-center gap-1.5">
                                    <code className="text-xs font-mono text-foreground bg-muted/20 px-1.5 py-0.5 rounded">{job.id}</code>
                                    <button onClick={() => copyText(job.id)} className="text-muted-foreground hover:text-foreground transition-colors" title="Copy ID">
                                        <Copy className="w-3 h-3" />
                                    </button>
                                    {copied && <span className="text-[10px] text-emerald-400">Copied!</span>}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Type</span>
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/5 border border-border capitalize">{jobType}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <Badge variant="secondary" className={`gap-1 ${STATUS_BADGE_COLORS[job.status] || ''}`}>
                                    {job.status}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Created</span>
                                <span className="text-foreground text-xs">{new Date(job.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Completed</span>
                                <span className="text-foreground text-xs">{job.completedAt ? new Date(job.completedAt).toLocaleString() : '—'}</span>
                            </div>
                            {job.retryCount !== undefined && job.retryCount !== null && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Retry count</span>
                                    <span className="text-foreground">{job.retryCount}</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* User Info */}
                    <section className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</h4>
                        <div className="bg-muted/10 border border-border rounded-lg p-3 space-y-2">
                            {job.isGuest ? (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Type</span>
                                        <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">Guest</Badge>
                                    </div>
                                    {job.guestId && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Guest ID</span>
                                            <code className="text-xs font-mono text-foreground bg-muted/20 px-1.5 py-0.5 rounded">{job.guestId}</code>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Email</span>
                                        <span className="text-foreground text-xs">{job.userEmail || '—'}</span>
                                    </div>
                                    {job.userId && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">User ID</span>
                                            <code className="text-xs font-mono text-foreground bg-muted/20 px-1.5 py-0.5 rounded truncate max-w-[200px]">{job.userId}</code>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </section>

                    {/* Document Info */}
                    <section className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Document</h4>
                        <div className="bg-muted/10 border border-border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Filename</span>
                                <span className="text-foreground truncate max-w-[200px] text-xs" title={job.filename}>{job.filename || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Pages</span>
                                <span className="text-foreground">{job.pages || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Cost</span>
                                <span className="text-foreground font-semibold">₹{job.totalCost || 0}</span>
                            </div>
                        </div>
                    </section>

                    {/* Kiosk */}
                    <section className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kiosk</h4>
                        <div className="bg-muted/10 border border-border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Kiosk ID</span>
                                <code className="text-xs font-mono text-foreground bg-muted/20 px-1.5 py-0.5 rounded">{job.kioskId || '—'}</code>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Name</span>
                                <span className="text-foreground text-xs">{job.kioskName || job.kioskId || '—'}</span>
                            </div>
                        </div>
                    </section>

                    {/* Error section */}
                    {job.status === 'FAILED' && (
                        <section className="space-y-2">
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm text-red-400 font-medium">Internal Error</p>
                                        <p className="text-xs text-red-400/70 mt-1 font-mono">{job.errorMessage || 'No error message'}</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Raw Metadata (collapsible) */}
                    {job.metadata && (
                        <section className="space-y-2">
                            <button
                                onClick={() => setMetaExpanded(!metaExpanded)}
                                className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                            >
                                {metaExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                Raw Metadata
                            </button>
                            {metaExpanded && (
                                <pre className="bg-muted/10 border border-border rounded-lg p-3 text-xs font-mono text-muted-foreground overflow-x-auto max-h-60 overflow-y-auto">
                                    {JSON.stringify(job.metadata, null, 2)}
                                </pre>
                            )}
                        </section>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} className="w-full text-muted-foreground hover:text-foreground">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main Table Component ───────────────────────────────────
export function RecentJobsTable({ jobs, loading }) {
    const [selectedJob, setSelectedJob] = useState(null);

    const getStatusIcon = (status) => {
        const icons = {
            'COMPLETED': <CheckCircle className="w-4 h-4 text-green-400" />,
            'PRINTING': <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />,
            'FAILED': <XCircle className="w-4 h-4 text-red-400" />,
            'PENDING': <Clock className="w-4 h-4 text-yellow-400" />
        };
        return icons[status] || <FileText className="w-4 h-4 text-muted-foreground" />;
    };

    const getStatusBadge = (status) => {
        const variants = {
            'COMPLETED': 'secondary',
            'PRINTING': 'secondary',
            'FAILED': 'destructive',
            'PENDING': 'secondary'
        };

        return (
            <Badge variant={variants[status] || 'secondary'} className={`gap-1 ${STATUS_BADGE_COLORS[status] || ''}`}>
                {getStatusIcon(status)}
                {status}
            </Badge>
        );
    };

    const formatTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return new Date(date).toLocaleDateString();
    };

    if (loading) {
        return (
            <Card className="bg-card/60">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Recent Jobs
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="animate-pulse bg-muted/10 rounded-lg p-3 h-16"></div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-card/60">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Recent Jobs
                </CardTitle>
            </CardHeader>
            <CardContent>
                {jobs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No jobs yet
                    </div>
                ) : (
                    <div className="space-y-2">
                        {jobs.map((job, index) => (
                            <motion.div
                                key={job.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="bg-muted/10 border border-border rounded-lg p-3 hover:bg-muted/20 transition-colors cursor-pointer"
                                onClick={() => setSelectedJob(job)}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center text-sm">
                                    {/* Time */}
                                    <div className="text-muted-foreground">
                                        {formatTimeAgo(job.createdAt)}
                                    </div>

                                    {/* User */}
                                    <div className="text-muted-foreground">
                                        {job.isGuest ? (
                                            <div className="flex items-center gap-1.5">
                                                <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">Guest</Badge>
                                                {job.guestId && (
                                                    <span className="text-[10px] text-muted-foreground/50 font-mono">{job.guestId.slice(0, 8)}</span>
                                                )}
                                            </div>
                                        ) : (
                                            job.userEmail
                                        )}
                                    </div>

                                    {/* Kiosk */}
                                    <div className="flex flex-col">
                                        <span className="text-foreground font-medium truncate">{job.kioskName || 'Unknown'}</span>
                                        <span className="text-[10px] text-muted-foreground font-mono uppercase">{job.kioskId}</span>
                                    </div>

                                    {/* File */}
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <span className="text-foreground truncate max-w-[150px]" title={job.filename}>
                                            {job.filename}
                                        </span>
                                    </div>

                                    {/* Pages & Cost */}
                                    <div className="text-foreground">
                                        {job.pages} pages • ₹{job.totalCost}
                                    </div>

                                    {/* Status */}
                                    <div className="flex justify-end">
                                        {getStatusBadge(job.status)}
                                    </div>
                                </div>

                                {/* Error message if failed */}
                                {job.status === 'FAILED' && job.errorMessage && (
                                    <div className="mt-2 text-xs text-red-400 flex items-start gap-2">
                                        <XCircle className="w-3 h-3 mt-0.5 shrink-0" />
                                        <span>{job.errorMessage}</span>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* Admin Job Detail Modal */}
            <AdminJobDetailModal
                job={selectedJob}
                open={!!selectedJob}
                onClose={() => setSelectedJob(null)}
            />
        </Card>
    );
}