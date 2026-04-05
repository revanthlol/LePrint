// frontend/src/components/Dashboard/History.jsx
// Redesigned User history page into a Premium User Activity Feed with sorting and pagination

import { useState, useEffect, memo, useMemo } from 'react';
import { useAuth } from '../AuthProvider';
import axios from 'axios';
import { 
  FileText, Clock, CheckCircle, XCircle, Loader2, Calendar, 
  IndianRupee, TrendingUp, Copy, Download, ExternalLink,
  ChevronDown, ChevronRight, Printer, Scissors, QrCode
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

// ─── Job Detail Modal (Receipt Aesthetic) ──────────────────────────────────
function JobDetailModal({ job, open, onClose, onJobUpdated }) {
  const [copied, setCopied] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { getAuthHeader } = useAuth();

  if (!job) return null;

  const copyId = () => {
    navigator.clipboard.writeText(job.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const jobType = job.job_type || 'print';
  const printSettings = job.metadata?.print_settings;

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this job?')) return;
    try {
      setIsCancelling(true);
      const authHeader = await getAuthHeader();
      await axios.post(`${API_URL}/api/jobs/${job.id}/cancel`, {}, {
        headers: { 'Authorization': authHeader }
      });
      alert('Job cancelled successfully');
      if (onJobUpdated) onJobUpdated(job.id, 'CANCELLED');
      onClose();
    } catch (err) {
      alert('Failed to cancel job: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="p-0 border-none bg-transparent shadow-none w-[95vw] sm:max-w-md print:max-w-none print:w-full print:m-0 print:bg-white print:text-black">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative bg-[#0d0d0d] border border-white/[0.08] rounded-[2.5rem] overflow-hidden shadow-2xl print:bg-white print:shadow-none print:border-none print:rounded-none"
        >
          {/* Paper Texture Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] mix-blend-overlay print:hidden" />
          
          <div className="relative p-8 space-y-8">
            {/* Receipt Header */}
            <header className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white text-black mb-2 shadow-lg shadow-white/10 print:bg-black print:text-white">
                <Printer className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black tracking-tight text-white print:text-black">Leprint Official Receipt</h2>
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold">Transaction Confirmed</p>
              </div>
            </header>

            {/* Status Stamp */}
            {job.status === 'COMPLETED' && (
              <div className="absolute top-10 right-[-20px] rotate-[25deg] border-4 border-emerald-500/30 px-4 py-1 rounded-xl pointer-events-none print:border-emerald-600 print:text-emerald-600">
                <span className="text-2xl font-black text-emerald-500/40 uppercase tracking-widest print:text-emerald-600">SUCCESS</span>
              </div>
            )}

            {/* Tear line */}
            <div className="flex items-center gap-2 overflow-hidden px-4">
              <Scissors className="w-3 h-3 text-white/20 shrink-0 print:hidden" />
              <div className="h-[1px] w-full border-t border-dashed border-white/20 print:border-black/20" />
            </div>

            {/* Main Content */}
            <div className="space-y-6 font-mono text-[13px]">
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-muted-foreground uppercase text-[10px]">Job ID</span>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-white font-bold select-all print:text-black">#{job.id.substring(0, 12)}...</span>
                    <button onClick={copyId} className="text-[9px] text-primary hover:underline print:hidden">
                      {copied ? 'Copied' : 'Copy Full ID'}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground uppercase text-[10px]">Date</span>
                  <span className="text-white font-bold print:text-black">{new Date(job.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground uppercase text-[10px]">Time</span>
                  <span className="text-white font-bold print:text-black">{new Date(job.created_at).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="h-[1px] border-t border-white/10 print:border-black/10" />

              <div className="space-y-2.5">
                <p className="text-muted-foreground uppercase text-[10px] tracking-widest mb-2">Itemized Details</p>
                <div className="flex justify-between items-center bg-white/[0.03] p-3 rounded-xl print:bg-gray-50">
                  <span className="text-white/80 font-medium truncate max-w-[180px]">{job.filename}</span>
                  <span className="text-white font-bold tabular-nums">×{job.pages}</span>
                </div>
                {printSettings && (
                   <div className="grid grid-cols-2 gap-2 text-[11px] mt-2">
                     <span className="bg-white/5 px-2 py-1 rounded text-muted-foreground italic">Mode: {printSettings.colorMode === 'color' ? 'Color' : 'B&W'}</span>
                     <span className="bg-white/5 px-2 py-1 rounded text-muted-foreground italic">Paper: A4 Standard</span>
                   </div>
                )}
              </div>

              <div className="h-[1px] border-t border-dashed border-white/20 pt-4 print:border-black/20" />

              <div className="flex justify-between items-center py-2">
                <span className="text-xl font-black text-white uppercase print:text-black">TOTAL</span>
                <span className="text-3xl font-black text-emerald-400 print:text-emerald-700">₹{job.total_cost || 0}</span>
              </div>
            </div>

            {/* Receipt Footer */}
            <footer className="pt-4 space-y-6">
              <div className="flex justify-center flex-col items-center gap-3">
                 <div className="p-3 bg-white rounded-2xl print:invert print:p-1">
                   <QrCode className="w-16 h-16 text-black" />
                 </div>
                 <p className="text-[9px] text-muted-foreground/60 text-center uppercase tracking-[2px]">Scan to re-order • Thank you for choosing Leprint</p>
              </div>

              <div className="flex gap-3 print:hidden">
                <Button 
                   onClick={handlePrintReceipt}
                   className="flex-1 bg-white text-black hover:bg-neutral-200 h-12 rounded-2xl font-black italic shadow-xl"
                >
                  <Download className="mr-2 h-4 w-4" /> Download
                </Button>
                <Button 
                   variant="outline"
                   onClick={onClose}
                   className="flex-1 border-white/10 text-white hover:bg-white/5 h-12 rounded-2xl font-bold"
                >
                  Close
                </Button>
              </div>
            </footer>
          </div>
        </motion.div>
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
          <StatCard icon={FileText} label="Jobs" value={stats.total_jobs || 0} color="text-blue-400" delay={0} />
          <StatCard icon={TrendingUp} label="Pages" value={stats.total_pages || 0} color="text-purple-400" delay={0.1} />
          <StatCard icon={IndianRupee} label="Spent" value={`₹${stats.total_spent || 0}`} color="text-emerald-400" delay={0.2} />
          <StatCard icon={CheckCircle} label="Success" value={`${Math.round((stats.success_rate || 0) * 100)}%`} color="text-emerald-400" delay={0.3} />
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-col gap-5">
          <div className="relative bg-white/[0.03] border border-white/[0.08] rounded-[1.25rem] p-1.5 overflow-hidden">
             {/* Animated Tab Background Indicator (Sleeker Pill) */}
             <div className="absolute top-1.5 bottom-1.5 left-1.5 flex transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
                  style={{ 
                    width: 'calc(25% - 0.375rem)',
                    left: filter === 'all' ? '0.375rem' : 
                          filter === 'COMPLETED' ? '25%' : 
                          filter === 'PRINTING' ? '50%' : '75%'
                  }}>
               <div className="w-full h-full bg-white rounded-xl shadow-[0_4px_20px_rgb(255,255,255,0.1)]" />
             </div>

             <div className="relative flex items-center justify-between w-full">
               {[
                 { id: 'all', label: 'Overview', count: stats?.total_jobs || 0, color: 'text-white/40' },
                 { id: 'COMPLETED', label: 'Success', count: stats?.completed_count || 0, color: 'text-emerald-500/50' },
                 { id: 'PRINTING', label: 'Active', count: stats?.active_count || 0, color: 'text-blue-500/50' },
                 { id: 'FAILED', label: 'Failed', count: stats?.failed_count || 0, color: 'text-red-500/50' },
               ].map((tab) => (
                 <button
                   key={tab.id}
                   onClick={() => { setFilter(tab.id); setCurrentPage(1); }}
                   className={`flex-1 relative py-2.5 h-10 flex items-center justify-center gap-2 transition-all duration-500`}
                 >
                   <span className={`text-[10px] font-black uppercase tracking-[0.08em] transition-all duration-500 ${filter === tab.id ? 'text-black' : 'text-muted-foreground/60'}`}>
                     {tab.label}
                   </span>
                   <span className={`text-[9px] font-mono font-bold transition-all duration-500 ${filter === tab.id ? 'text-black/40' : tab.color}`}>
                     {tab.count}
                   </span>
                 </button>
               ))}
             </div>
          </div>

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
        onJobUpdated={(id, newStatus) => {
          setJobs(prev => prev.map(j => j.id === id ? { ...j, status: newStatus } : j));
        }}
      />
    </motion.div>
  );
}