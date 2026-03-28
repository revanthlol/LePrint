// frontend/src/components/Dashboard/History.jsx
// Redesigned User history page into a Premium User Activity Feed with sorting and pagination

import { useState, useEffect, memo, useMemo } from 'react';
import { useAuth } from '../AuthProvider';
import axios from 'axios';
import { 
  FileText, Clock, CheckCircle, XCircle, Loader2, Calendar, 
  IndianRupee, TrendingUp, Copy, Download, ExternalLink,
  ChevronDown, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const JOB_TYPE_ICONS = { print: '🖨️', scan: '📄', xerox: '📋' };
const JOB_TYPE_LABELS = { print: 'Print', scan: 'Scan', xerox: 'Xerox' };

const STATUS_STYLES = {
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  PRINTING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  PAID: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  CANCELLED: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

function StatusBadge({ status }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${STATUS_STYLES[status] || STATUS_STYLES.PENDING}`}>
      {status}
    </span>
  );
}

// ─── Job Detail Modal ───────────────────────────────────────
function JobDetailModal({ job, open, onClose }) {
  const [copied, setCopied] = useState(false);
  const [metaExpanded, setMetaExpanded] = useState(false);

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
      <DialogContent className="sm:max-w-md bg-[#0a0a0a] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 tracking-tight text-lg">
            <span>{JOB_TYPE_ICONS[jobType] || '🖨️'}</span>
            <span className="truncate">{job.filename || 'Untitled'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-5 text-sm">
          {/* Job Info */}
          <section className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">Job Info</h4>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Job ID</span>
                <div className="flex items-center gap-1.5">
                  <code className="text-xs font-mono text-foreground bg-white/5 px-1.5 py-0.5 rounded border border-white/10">{job.id}</code>
                  <button onClick={copyId} className="text-muted-foreground hover:text-white hover:bg-white/[0.06] rounded p-1 transition-colors">
                    <Copy className="w-3 h-3" />
                  </button>
                  {copied && <span className="text-[11px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">Copied!</span>}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-foreground capitalize">
                  {JOB_TYPE_LABELS[jobType] || 'Print'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={job.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="text-foreground text-xs font-medium tabular-nums">{new Date(job.created_at).toLocaleString()}</span>
              </div>
            </div>
          </section>

          {/* Document Section */}
          <section className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">Document</h4>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Filename</span>
                <span className="text-foreground truncate font-medium text-xs text-right" title={job.filename}>{job.filename || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pages</span>
                <span className="text-foreground font-bold tabular-nums">{job.pages || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="text-emerald-400 font-bold text-base tabular-nums">₹{job.total_cost || 0}</span>
              </div>
            </div>
          </section>

          {/* Settings Section (only for relevant types) */}
          {printSettings && (jobType === 'print' || jobType === 'xerox') && (
            <section className="space-y-2">
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">Print Details</h4>
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 grid grid-cols-2 gap-y-3 gap-x-6">
                {Object.entries(printSettings).map(([key, value]) => (
                  <div key={key} className="space-y-0.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50">{key.replace('_', ' ')}</p>
                    <p className="text-[13px] font-bold text-foreground capitalize">{value === 'bw' ? 'B&W' : value}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Download Support */}
          {jobType === 'scan' && job.status === 'COMPLETED' && (
            <motion.div whileTap={{ scale: 0.98 }}>
              <a href={`${API_URL}/api/jobs/${job.id}/download`} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full bg-white text-black hover:bg-neutral-200 font-bold rounded-2xl py-6 shadow-xl shadow-white/5">
                  <Download className="mr-2 h-5 w-5" />
                  Download Files
                </Button>
              </a>
            </motion.div>
          )}

          {/* Refund Call for Failures */}
          {job.status === 'FAILED' && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-3">
              <div className="flex gap-3">
                <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-100">Job failed during processing</p>
                  <p className="text-[11px] text-red-200/60 font-mono mt-1 leading-relaxed">
                    {job.error_message || 'System error. You were not charged for this failure.'}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full border-red-500/30 text-red-300 hover:bg-red-500/20 hover:text-red-100 rounded-xl font-bold py-5"
                onClick={() => window.location.href = '/contact?subject=Refund%20Request'}
              >
                Request Support →
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-0">
          <Button variant="ghost" onClick={onClose} className="w-full text-muted-foreground hover:text-white rounded-xl py-5 transition-colors">
            Back to History
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Stat Card ──────────────────────────────────────────────
const StatCard = memo(({ icon: Icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.06] transition-all duration-300 group"
  >
    <div className="flex items-center gap-3 mb-2.5">
      <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center group-hover:bg-white/[0.1] transition-colors">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground/60 font-bold">{label}</span>
    </div>
    <p className="text-2xl font-bold text-white tabular-nums tracking-tight">
      {value}
    </p>
  </motion.div>
));

StatCard.displayName = 'StatCard';

// ─── Statics / Helpers ─────────────────────────────────────
const getStatusIcon = (status) => {
  switch (status) {
    case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    case 'PRINTING': return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
    case 'FAILED': return <XCircle className="w-4 h-4 text-red-400" />;
    default: return <Clock className="w-4 h-4 text-amber-400" />;
  }
};

const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
};

// ─── Skeleton View ───────────────────────────────────────────
const HistorySkeleton = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 h-28 animate-pulse" />
      ))}
    </div>
    <div className="space-y-4">
      <div className="h-10 bg-white/[0.03] rounded-xl w-64 animate-pulse" />
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl space-y-3 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-white/[0.02] rounded-xl border border-white/[0.04] animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

// ─── Main Component ─────────────────────────────────────────
export function History() {
  const { getAuthHeader } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState(null);
  const JOBS_PER_PAGE = 6;

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const authHeader = await getAuthHeader();
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

  const sortedJobs = useMemo(() => {
    const sorted = [...jobs];
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'cost-high':
        return sorted.sort((a, b) => (b.total_cost || 0) - (a.total_cost || 0));
      case 'pages-high':
        return sorted.sort((a, b) => (b.pages || 0) - (a.pages || 0));
      default:
        return sorted;
    }
  }, [jobs, sortBy]);

  const totalPages = Math.ceil(sortedJobs.length / JOBS_PER_PAGE);
  const paginatedJobs = sortedJobs.slice(
    (currentPage - 1) * JOBS_PER_PAGE,
    currentPage * JOBS_PER_PAGE
  );

  if (loading) return <HistorySkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="mb-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">Activity Log</span>
        <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
          Your Print History
        </h1>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={FileText} label="Jobs" value={stats.totalJobs || 0} color="text-blue-400" delay={0} />
          <StatCard icon={TrendingUp} label="Pages" value={stats.totalPages || 0} color="text-purple-400" delay={0.1} />
          <StatCard icon={IndianRupee} label="Cost" value={`₹${stats.totalSpent || 0}`} color="text-emerald-400" delay={0.2} />
          <StatCard icon={CheckCircle} label="Rate" value={`${Math.round((stats.successRate || 0) * 100)}%`} color="text-emerald-400" delay={0.3} />
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-col gap-6">
          <Tabs value={filter} onValueChange={(v) => { setFilter(v); setCurrentPage(1); }} className="w-full">
            <TabsList className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-1 flex w-full overflow-x-auto scrollbar-hide">
              {['all', 'COMPLETED', 'PRINTING', 'FAILED'].map((s) => (
                <TabsTrigger 
                  key={s} value={s} 
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black rounded-xl transition-all font-bold text-[10px] sm:text-[11px] uppercase tracking-wider h-10 px-3 sm:px-6 whitespace-nowrap"
                >
                  {s.replace('COMPLETED', 'Success').replace('all', 'All Jobs')}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 font-bold shrink-0 mr-1 ml-1">Sort by</span>
            {[
              { id: 'newest', label: 'Newest' },
              { id: 'cost-high', label: 'Value' },
              { id: 'pages-high', label: 'Pages' }
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => { setSortBy(opt.id); setCurrentPage(1); }}
                className={`px-4 py-2 h-9 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border transition-all shrink-0 ${
                  sortBy === opt.id
                    ? 'bg-white text-black border-white shadow-lg'
                    : 'text-muted-foreground hover:text-white border-white/[0.08] hover:bg-white/[0.04]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl shadow-black/20">
          <AnimatePresence mode="wait">
            {jobs.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="p-16 text-center"
              >
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center mb-6 shadow-xl shadow-white/5">
                  <FileText className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <p className="text-lg font-bold text-white">No history found</p>
                <p className="text-sm text-muted-foreground/60 mt-1.5">Start printing to see your documents here.</p>
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="divide-y divide-white/[0.04]">
                {paginatedJobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-4 sm:p-6 hover:bg-white/[0.03] transition-all cursor-pointer group"
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="flex items-center gap-3 sm:gap-5">
                      {/* Status Icon */}
                      <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 group-hover:bg-white/[0.1] transition-colors shadow-lg shadow-black/5">
                        {getStatusIcon(job.status)}
                      </div>

                      {/* Info Bundle */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[14px] sm:text-[16px] font-bold text-white truncate leading-tight">{job.filename || 'Untitled'}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 text-[11px] sm:text-[13px] text-muted-foreground/70 font-medium">
                          <span className="text-emerald-400 font-bold tabular-nums shrink-0">₹{job.total_cost || 0}</span>
                          <span className="opacity-30">·</span>
                          <span className="tabular-nums truncate max-w-[80px] sm:max-w-none">{formatTimeAgo(job.created_at)}</span>
                          <span className="opacity-30 hidden xs:inline">·</span>
                          <span className="tabular-nums hidden xs:inline shrink-0">{job.pages || 0} pages</span>
                        </div>
                      </div>

                      {/* Right Badge */}
                      <div className="shrink-0">
                        <StatusBadge status={job.status} />
                      </div>
                    </div>

                    {/* Compact Error Info */}
                    {job.status === 'FAILED' && (
                      <div className="mt-3 ml-14 p-2 pl-3 rounded-lg bg-red-500/5 border border-red-500/10 text-[11px] text-red-300 font-mono flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-red-400" />
                        {job.error_message || 'Processing error'}
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground/40 font-bold">
              {jobs.length} items · {currentPage}/{totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center disabled:opacity-20 hover:bg-white/[0.08] transition-all"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-2xl text-[13px] font-bold tabular-nums transition-all border ${
                    page === currentPage
                      ? 'bg-white text-black border-white shadow-xl'
                      : 'bg-white/[0.02] text-muted-foreground border-white/[0.08] hover:border-white/[0.2]'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center disabled:opacity-20 hover:bg-white/[0.08] transition-all"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      <JobDetailModal
        job={selectedJob}
        open={!!selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </motion.div>
  );
}