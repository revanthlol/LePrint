// frontend/src/components/Dashboard/History.jsx
import { useState, useEffect, memo } from 'react';
import { useAuth } from '../AuthProvider';
import axios from 'axios';
import { FileText, Clock, CheckCircle, XCircle, Loader2, Calendar, IndianRupee, TrendingUp, Copy, Download, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const JOB_TYPE_ICONS = { print: '🖨️', scan: '📄', xerox: '📋' };
const JOB_TYPE_LABELS = { print: 'Print', scan: 'Scan', xerox: 'Xerox' };

const STATUS_STYLES = {
    COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    PRINTING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
    PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    PAID: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    CANCELLED: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

function StatusBadge({ status }) {
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[status] || STATUS_STYLES.PENDING}`}>
            {status}
        </span>
    );
}

// ─── Job Detail Modal ───────────────────────────────────────
function JobDetailModal({ job, open, onClose }) {
    const [copied, setCopied] = useState(false);

    if (!job) return null;

    const copyId = () => {
        navigator.clipboard.writeText(job.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const jobType = job.job_type || 'print';
    const printSettings = job.metadata?.print_settings;

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="sm:max-w-md rounded-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <span>{JOB_TYPE_ICONS[jobType] || '🖨️'}</span>
                        <span className="truncate">{job.filename || 'Untitled'}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 text-sm">
                    {/* Job Info */}
                    <section className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Job Info</h4>
                        <div className="bg-muted/10 border border-border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Job ID</span>
                                <div className="flex items-center gap-1.5">
                                    <code className="text-xs font-mono text-foreground bg-muted/20 px-1.5 py-0.5 rounded">{job.id}</code>
                                    <button onClick={copyId} className="text-muted-foreground hover:text-foreground transition-colors" title="Copy ID">
                                        <Copy className="w-3 h-3" />
                                    </button>
                                    {copied && <span className="text-[10px] text-emerald-400">Copied!</span>}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Type</span>
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/5 border border-border">
                                    {JOB_TYPE_LABELS[jobType] || 'Print'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <StatusBadge status={job.status} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Created</span>
                                <span className="text-foreground text-xs">{new Date(job.created_at).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Completed</span>
                                <span className="text-foreground text-xs">{job.completed_at ? new Date(job.completed_at).toLocaleString() : '—'}</span>
                            </div>
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
                                <span className="text-foreground">{job.pages ? `${job.pages} page${job.pages !== 1 ? 's' : ''}` : '—'}</span>
                            </div>
                        </div>
                    </section>

                    {/* Print Settings */}
                    {printSettings && (jobType === 'print' || jobType === 'xerox') && (
                        <section className="space-y-2">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Print Settings</h4>
                            <div className="bg-muted/10 border border-border rounded-lg p-3 space-y-2">
                                {printSettings.color_mode && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Color</span>
                                        <span className="text-foreground">{printSettings.color_mode === 'bw' ? 'B&W' : 'Color'}</span>
                                    </div>
                                )}
                                {printSettings.copies && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Copies</span>
                                        <span className="text-foreground">{printSettings.copies}</span>
                                    </div>
                                )}
                                {printSettings.page_range && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Page range</span>
                                        <span className="text-foreground">{printSettings.page_range}</span>
                                    </div>
                                )}
                                {printSettings.orientation && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Orientation</span>
                                        <span className="text-foreground">{printSettings.orientation}</span>
                                    </div>
                                )}
                                {printSettings.scaling && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Scaling</span>
                                        <span className="text-foreground">{printSettings.scaling}</span>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Payment */}
                    <section className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment</h4>
                        <div className="bg-muted/10 border border-border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Amount</span>
                                <span className="text-foreground font-semibold">₹{job.total_cost || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Transaction ID</span>
                                <span className="text-muted-foreground/60 text-xs italic">Razorpay integration</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Payment status</span>
                                <StatusBadge status={job.status === 'COMPLETED' || job.status === 'PRINTING' ? 'PAID' : job.status} />
                            </div>
                        </div>
                    </section>

                    {/* Kiosk */}
                    <section className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kiosk</h4>
                        <div className="bg-muted/10 border border-border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Kiosk ID</span>
                                <code className="text-xs font-mono text-foreground bg-muted/20 px-1.5 py-0.5 rounded">{job.kiosk_id || '—'}</code>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Location</span>
                                <span className="text-foreground text-xs">{job.kiosk_location_name || job.kiosk_id || '—'}</span>
                            </div>
                        </div>
                    </section>

                    {/* Scan download */}
                    {jobType === 'scan' && job.status === 'COMPLETED' && (
                        <a href={`${API_URL}/api/jobs/${job.id}/download`} target="_blank" rel="noopener noreferrer" className="block">
                            <Button className="w-full bg-white text-black hover:bg-neutral-200 font-semibold">
                                <Download className="mr-2 h-4 w-4" />
                                Download Scanned PDF
                            </Button>
                        </a>
                    )}

                    {/* Error section */}
                    {job.status === 'FAILED' && (
                        <section className="space-y-2">
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm text-red-400 font-medium">Job Failed</p>
                                        <p className="text-xs text-red-400/70 mt-1">{job.error_message || 'Unknown error'}</p>
                                    </div>
                                </div>
                            </div>
                            <a href="/contact?subject=Refund%20Request" className="block">
                                <Button variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10">
                                    <ExternalLink className="mr-2 w-4 h-4" /> Request Refund →
                                </Button>
                            </a>
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

// ─── Stat Card ──────────────────────────────────────────────
const StatCard = memo(({ icon: Icon, label, value, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay }}
        className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 hover:bg-card/70 transition-colors"
    >
        <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{label}</span>
            <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <motion.p
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: delay + 0.1, type: "spring" }}
            className="text-2xl font-bold text-foreground"
        >
            {value}
        </motion.p>
    </motion.div>
));

StatCard.displayName = 'StatCard';

// ─── Job Card ───────────────────────────────────────────────
const JobCard = memo(({ job, index, onClick }) => {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
            case 'PRINTING': return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
            case 'FAILED': return <XCircle className="w-5 h-5 text-red-400" />;
            default: return <Clock className="w-5 h-5 text-yellow-400" />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            layout
            className="p-4 hover:bg-card/30 transition-colors cursor-pointer"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onClick(job)}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <motion.div
                        className="mt-1"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.05 + 0.1, type: "spring" }}
                    >
                        {getStatusIcon(job.status)}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                            {job.filename}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {job.pages} pages
                            </span>
                            <span className="flex items-center gap-1">
                                <IndianRupee className="w-3 h-3" />
                                ₹{job.total_cost}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(job.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 + 0.15 }}
                >
                    <StatusBadge status={job.status} />
                </motion.div>
            </div>
        </motion.div>
    );
});

JobCard.displayName = 'JobCard';

// Skeleton loader component
const HistorySkeleton = () => (
    <div className="space-y-6">
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card/50 border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-4 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                </div>
            ))}
        </div>

        {/* Filter skeleton */}
        <Skeleton className="h-10 w-full max-w-md" />

        {/* Jobs skeleton */}
        <div className="bg-card/50 border border-border rounded-xl overflow-hidden">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 border-b border-border last:border-b-0">
                    <div className="flex items-start gap-3">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export function History() {
    const { getAuthHeader } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedJob, setSelectedJob] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, [filter]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const authHeader = await getAuthHeader();

            // Fetch both in parallel for better performance
            const [jobsResponse, statsResponse] = await Promise.all([
                axios.get(`${API_URL}/api/jobs/my-jobs`, {
                    headers: { 'Authorization': authHeader },
                    params: { status: filter !== 'all' ? filter : undefined }
                }),
                axios.get(`${API_URL}/api/users/stats`, {
                    headers: { 'Authorization': authHeader }
                })
            ]);

            setJobs(jobsResponse.data.jobs || []);
            setStats(statsResponse.data);
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <HistorySkeleton />;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
        >
            {/* Stats Cards - Stagger animation */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={FileText}
                        label="Total Jobs"
                        value={stats.totalJobs || 0}
                        color="text-blue-400"
                        delay={0}
                    />
                    <StatCard
                        icon={FileText}
                        label="Total Pages"
                        value={stats.totalPages || 0}
                        color="text-purple-400"
                        delay={0.1}
                    />
                    <StatCard
                        icon={IndianRupee}
                        label="Total Spent"
                        value={`₹${stats.totalSpent || 0}`}
                        color="text-emerald-400"
                        delay={0.2}
                    />
                    <StatCard
                        icon={TrendingUp}
                        label="Success Rate"
                        value={`${Math.round((stats.successRate || 0) * 100)}%`}
                        color="text-emerald-400"
                        delay={0.3}
                    />
                </div>
            )}

            {/* Filter Tabs - Using shadcn Tabs */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Tabs value={filter} onValueChange={setFilter} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
                        <TabsTrigger value="all">All Jobs</TabsTrigger>
                        <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
                        <TabsTrigger value="PRINTING">Printing</TabsTrigger>
                        <TabsTrigger value="FAILED">Failed</TabsTrigger>
                    </TabsList>
                </Tabs>
            </motion.div>

            {/* Jobs List - Animated */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden"
            >
                <AnimatePresence mode="wait">
                    {jobs.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center py-12"
                        >
                            <motion.div
                                animate={{ 
                                    y: [0, -10, 0],
                                }}
                                transition={{ 
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            </motion.div>
                            <p className="text-muted-foreground">No print jobs yet</p>
                            <p className="text-sm text-muted-foreground/60 mt-1">
                                Start by printing your first document!
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="jobs"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="divide-y divide-border"
                        >
                            <AnimatePresence>
                                {jobs.map((job, index) => (
                                    <JobCard
                                        key={job.id}
                                        job={job}
                                        index={index}
                                        onClick={setSelectedJob}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Job Detail Modal */}
            <JobDetailModal
                job={selectedJob}
                open={!!selectedJob}
                onClose={() => setSelectedJob(null)}
            />
        </motion.div>
    );
}