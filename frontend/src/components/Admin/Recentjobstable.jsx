// frontend/src/components/Admin/RecentJobsTable.jsx
// Table showing recent print jobs across all kiosks with Premium Admin Activity Feed styling

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, CheckCircle, Loader2, XCircle, Clock, 
  Copy, Download, ExternalLink, ChevronDown, ChevronRight 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg bg-[#0a0a0a] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg tracking-tight">
            <span>{jobType === 'scan' ? '📄' : jobType === 'xerox' ? '📋' : '🖨️'}</span>
            <span className="truncate">{job.filename || 'Untitled'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm mt-4">
          {/* Job Info */}
          <section className="space-y-2">
            <h4 className="text-[10px] lowercase text-muted-foreground uppercase tracking-[0.2em] font-bold">Job Info</h4>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Job ID</span>
                <div className="flex items-center gap-1.5">
                  <code className="text-xs font-mono text-foreground bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 rounded">{job.id}</code>
                  <button onClick={() => copyText(job.id)} className="text-muted-foreground hover:text-foreground hover:bg-white/[0.06] rounded p-1 transition-colors" title="Copy ID">
                    <Copy className="w-3 h-3" />
                  </button>
                  {copied && <span className="text-[11px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">Copied!</span>}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.05] border border-white/[0.08] capitalize">{jobType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                {getStatusBadge(job.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="text-foreground text-xs tabular-nums">{new Date(job.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Completed</span>
                <span className="text-foreground text-xs tabular-nums">{job.completedAt ? new Date(job.completedAt).toLocaleString() : '—'}</span>
              </div>
            </div>
          </section>

          {/* User Info */}
          <section className="space-y-2">
            <h4 className="text-[10px] lowercase text-muted-foreground uppercase tracking-[0.2em] font-bold">User</h4>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 space-y-2.5">
              {job.isGuest ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[11px] px-2 py-0.5 font-medium">Guest</span>
                  </div>
                  {job.guestId && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Guest ID</span>
                      <code className="text-xs font-mono text-foreground bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 rounded">{job.guestId}</code>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="text-foreground text-xs font-medium">{job.userEmail || '—'}</span>
                  </div>
                  {job.userId && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">User ID</span>
                      <code className="text-xs font-mono text-foreground bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 rounded truncate max-w-[180px]">{job.userId}</code>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Document Info */}
          <section className="space-y-2">
            <h4 className="text-[10px] lowercase text-muted-foreground uppercase tracking-[0.2em] font-bold">Document</h4>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Filename</span>
                <span className="text-foreground truncate max-w-[200px] text-xs font-medium" title={job.filename}>{job.filename || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pages</span>
                <span className="text-foreground tabular-nums font-medium">{job.pages || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cost</span>
                <span className="text-emerald-400 font-bold tabular-nums">₹{job.totalCost || 0}</span>
              </div>
            </div>
          </section>

          {/* Kiosk */}
          <section className="space-y-2">
            <h4 className="text-[10px] lowercase text-muted-foreground uppercase tracking-[0.2em] font-bold">Kiosk</h4>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Kiosk ID</span>
                <code className="text-[11px] font-mono text-foreground bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 rounded">{job.kioskId || '—'}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="text-foreground text-xs font-medium">{job.kioskName || job.kioskId || '—'}</span>
              </div>
            </div>
          </section>

          {/* Error section */}
          {job.status === 'FAILED' && (
            <section className="space-y-2">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <div>
                    <p className="text-sm text-red-400 font-bold">Internal Error</p>
                    <p className="text-xs text-red-400/70 mt-1 font-mono leading-relaxed">{job.errorMessage || 'No error message'}</p>
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
                className="flex items-center gap-1 text-[10px] lowercase text-muted-foreground uppercase tracking-[0.2em] font-bold hover:text-foreground transition-colors"
              >
                {metaExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Raw Metadata
              </button>
              {metaExpanded && (
                <pre className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-[11px] font-mono text-muted-foreground/70 overflow-x-auto max-h-60 overflow-y-auto">
                  {JSON.stringify(job.metadata, null, 2)}
                </pre>
              )}
            </section>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="ghost" onClick={onClose} className="w-full text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-xl py-6">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Helpers ────────────────────────────────────────────────
const getStatusIcon = (status) => {
  const icons = {
    'COMPLETED': <CheckCircle className="w-4 h-4 text-emerald-400" />,
    'PRINTING': <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />,
    'FAILED': <XCircle className="w-4 h-4 text-red-400" />,
    'PENDING': <Clock className="w-4 h-4 text-amber-400" />
  };
  return icons[status] || <FileText className="w-4 h-4 text-muted-foreground" />;
};

const getStatusBadge = (status) => {
  const styles = {
    'COMPLETED': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'PRINTING': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'FAILED': 'bg-red-500/10 text-red-400 border-red-500/20',
    'PENDING': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'PAID': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'CANCELLED': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${styles[status] || styles.PENDING}`}>
      {getStatusIcon(status)}
      {status}
    </span>
  );
};

const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
};

// ─── Main Table Component ───────────────────────────────────
export function RecentJobsTable({ jobs, loading }) {
  const [selectedJob, setSelectedJob] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const JOBS_PER_PAGE = 6;

  const sortedJobs = useMemo(() => {
    const sorted = [...jobs];
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'status':
        const statusOrder = { PRINTING: 0, PENDING: 1, PAID: 2, COMPLETED: 3, FAILED: 4, CANCELLED: 5 };
        return sorted.sort((a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99));
      case 'cost-high':
        return sorted.sort((a, b) => (b.totalCost || 0) - (a.totalCost || 0));
      case 'cost-low':
        return sorted.sort((a, b) => (a.totalCost || 0) - (b.totalCost || 0));
      case 'pages':
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

  if (loading) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="h-6 bg-white/[0.06] rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 h-16 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">Activity</span>
          <h2 className="text-xl font-semibold tracking-tight text-foreground mt-1 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            Recent Jobs
          </h2>
        </div>
      </div>

      {/* Sorting Controls */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold shrink-0 mr-1">Sort by</span>
        {[
          { id: 'newest', label: 'Newest' },
          { id: 'oldest', label: 'Oldest' },
          { id: 'status', label: 'Status' },
          { id: 'cost-high', label: 'Cost ↓' },
          { id: 'cost-low', label: 'Cost ↑' },
          { id: 'pages', label: 'Pages ↓' },
        ].map((opt) => (
          <button
            key={opt.id}
            onClick={() => { setSortBy(opt.id); setCurrentPage(1); }}
            className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all shrink-0 ${
              sortBy === opt.id
                ? 'bg-white text-black shadow-sm rounded-lg'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.06] rounded-lg'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Job Feed */}
      {jobs.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-[1.5rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <p className="text-[15px] font-medium text-foreground">No jobs recorded</p>
          <p className="text-[13px] text-muted-foreground/70 mt-1">Jobs will appear here as users print</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {paginatedJobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer group"
              onClick={() => setSelectedJob(job)}
            >
              <div className="flex items-center gap-4">
                {/* Status icon in container */}
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                  {getStatusIcon(job.status)}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[14px] font-medium text-foreground truncate">{job.filename || 'Untitled'}</p>
                    <span className="text-[10px] font-mono text-muted-foreground/30 uppercase tracking-tight shrink-0">#{job.kioskId}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[12px] text-muted-foreground/70 tracking-tight">
                    <span className="tabular-nums">{formatTimeAgo(job.createdAt)}</span>
                    <span className="opacity-30">·</span>
                    <span className="tabular-nums">{job.pages || 0} pages</span>
                    <span className="opacity-30">·</span>
                    <span className="text-foreground font-semibold tabular-nums">₹{job.totalCost || 0}</span>
                    <span className="opacity-30">·</span>
                    <span className="truncate max-w-[150px]">
                      {job.isGuest ? (
                        <span className="text-amber-400/70 font-medium">Guest</span>
                      ) : (
                        <span className="truncate">{job.userEmail || '—'}</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Status badge */}
                <div className="shrink-0 hidden sm:block">
                  {getStatusBadge(job.status)}
                </div>
              </div>

              {/* Error message */}
              {job.status === 'FAILED' && job.errorMessage && (
                <div className="mt-2 ml-14 text-[12px] text-red-red flex items-start gap-1.5 bg-red-500/5 p-2 rounded-lg border border-red-500/10">
                  <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-400" />
                  <span className="truncate text-red-400/80 font-mono text-[11px]">{job.errorMessage}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/[0.04]">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground/40 font-bold">
            {sortedJobs.length} total · Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] flex items-center justify-center disabled:opacity-20 transition-all text-muted-foreground hover:text-foreground"
            >
              ‹
            </button>
            {/* Show limited page buttons if needed, but for simplicity here we show all as it's likely small */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-xl text-[13px] font-bold tabular-nums transition-all flex items-center justify-center border ${
                        page === currentPage
                            ? 'bg-white text-black border-white'
                            : 'bg-white/[0.03] text-muted-foreground border-white/[0.08] hover:border-white/[0.2] hover:text-foreground'
                    }`}
                >
                    {page}
                </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] flex items-center justify-center disabled:opacity-20 transition-all text-muted-foreground hover:text-foreground"
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* Admin Job Detail Modal */}
      <AdminJobDetailModal
        job={selectedJob}
        open={!!selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
}