// frontend/src/components/Admin/KioskHealthGrid.jsx
// Real-time kiosk status monitor with Premium Monochrome aesthetic

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Printer, AlertTriangle, CheckCircle, XCircle, 
  RefreshCw, Edit, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import axios from 'axios';

export function KioskHealthGrid({ kiosks, loading, onRefresh, getAuthHeader }) {
  const [editingKiosk, setEditingKiosk] = useState(null);
  const [newPaperCount, setNewPaperCount] = useState('');
  const [editingLocation, setEditingLocation] = useState(null);
  const [newLocationName, setNewLocationName] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleSetPaper = async () => {
    if (!editingKiosk || !newPaperCount) return;

    const count = parseInt(newPaperCount);
    if (isNaN(count) || count < 0 || count > 1000) {
      alert('Paper count must be between 0 and 1000');
      return;
    }

    setUpdating(true);
    try {
      const authHeader = await getAuthHeader();
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      await axios.post(
        `${API_URL}/api/admin/kiosks/${editingKiosk.id}/set-paper`,
        { paperCount: count },
        { headers: { 'Authorization': authHeader } }
      );

      setEditingKiosk(null);
      setNewPaperCount('');
      onRefresh(); // Refresh kiosk data
    } catch (error) {
      console.error('Failed to set paper count:', error);
      alert(error.response?.data?.message || 'Failed to update paper count');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (kiosk) => {
    if (!kiosk.isOnline) {
      return <Badge className="gap-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[11px]"><XCircle className="w-3 h-3" />Offline</Badge>;
    }
    if (kiosk.currentJobId) {
      return <Badge className="gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[11px]">🟡 Busy</Badge>;
    }
    return <Badge className="gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[11px]"><CheckCircle className="w-3 h-3" />Online</Badge>;
  };

  const getPrinterStatusBadge = (status, detail) => {
    if (status === 'healthy') {
      return <Badge className="gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[11px] font-medium"><CheckCircle className="w-3 h-3" />Ready</Badge>;
    }
    if (status === 'error') {
      return <Badge className="gap-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[11px] font-medium"><AlertTriangle className="w-3 h-3" />{detail || 'Error'}</Badge>;
    }
    return <Badge className="gap-1 bg-white/[0.05] text-muted-foreground border border-white/[0.1] rounded-full text-[11px] font-medium"><AlertTriangle className="w-3 h-3" />Unknown</Badge>;
  };

  const getCardBorderClass = (kiosk) => {
    if (!kiosk.isOnline) return 'border-l-red-500/50';
    if (kiosk.currentJobId) return 'border-l-amber-500/50';
    return 'border-l-emerald-500/50';
  };

  const EpsonBadge = () => (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold bg-blue-500/10 text-blue-400 border border-blue-500/15">
        Epson
    </span>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">Live Monitor</span>
            <div className="h-6 bg-white/[0.06] rounded w-32 mt-1"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 h-64 animate-pulse">
                <div className="flex justify-between mb-4">
                    <div className="h-4 bg-white/[0.06] rounded w-32"></div>
                    <div className="h-5 bg-white/[0.06] rounded-full w-16"></div>
                </div>
                <div className="bg-white/[0.04] rounded-xl h-10 mb-4"></div>
                <div className="h-2 bg-white/[0.06] rounded-full w-full mb-4"></div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/[0.04] rounded-xl h-16"></div>
                    <div className="bg-white/[0.04] rounded-xl h-16"></div>
                </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">Live Monitor</span>
                <h2 className="text-xl font-semibold tracking-tight text-foreground mt-1 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                        <Printer className="w-4 h-4 text-white" />
                    </div>
                    Kiosk Health
                </h2>
            </div>
            <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRefresh}
                    className="gap-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-xl"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </Button>
            </motion.div>
        </div>

        {kiosks.length === 0 ? (
          <div className="bg-white/[0.03] border-2 border-dashed border-white/[0.08] rounded-2xl flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center mb-4">
                  <XCircle className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="text-[15px] font-medium text-foreground">No kiosks registered</p>
              <p className="text-[13px] text-muted-foreground/70 mt-1">Kiosks will appear here once connected</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {kiosks.map((kiosk, index) => (
                <motion.div
                  key={kiosk.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={`group bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] border-l-2 ${getCardBorderClass(kiosk)} rounded-2xl hover:bg-white/[0.05] transition-all duration-300 overflow-hidden`}
                >
                  <div className="p-5 space-y-4">
                    {/* Row 1: Name + Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-base tracking-tight text-foreground truncate">
                                    {kiosk.locationName || kiosk.hostname || kiosk.id}
                                </h3>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => {
                                        setEditingLocation(kiosk);
                                        setNewLocationName(kiosk.locationName || '');
                                    }} 
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Edit className="w-3 h-3" />
                                </Button>
                            </div>
                            <p className="text-[11px] font-mono text-muted-foreground/50 mt-0.5">#{kiosk.id}</p>
                        </div>
                        {getStatusBadge(kiosk)}
                    </div>

                    {/* Row 2: Printer Info */}
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[13px] text-muted-foreground flex items-center gap-1.5">
                                <Printer className="w-3.5 h-3.5" />
                                {kiosk.printerName || 'Unknown Printer'}
                            </span>
                            <div className="flex items-center gap-2">
                                {kiosk.printerBrand === 'epson' && <EpsonBadge />}
                                {kiosk.printerDriver && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-white/[0.04] text-[10px] font-mono text-muted-foreground/60 border border-white/[0.06]">
                                        {kiosk.printerDriver}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Health + Paper Progress Bar */}
                    <div className="space-y-3">
                        {/* Printer health badge */}
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">Printer Health</span>
                            {getPrinterStatusBadge(kiosk.printerStatus, kiosk.printerStatusDetail)}
                        </div>

                        {/* Paper Level Progress Bar */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">Paper Level</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[13px] font-bold text-foreground tabular-nums">{kiosk.paperCount}</span>
                                    <span className="text-[11px] text-muted-foreground/50">/ 500</span>
                                    <Button variant="ghost" size="icon" onClick={() => { setEditingKiosk(kiosk); setNewPaperCount(kiosk.paperCount.toString()); }} className="h-5 w-5 ml-1">
                                        <Edit className="w-3 h-3 text-muted-foreground/50" />
                                    </Button>
                                </div>
                            </div>
                            {/* Progress track */}
                            <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, (kiosk.paperCount / 500) * 100)}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                    className={`h-full rounded-full transition-colors ${
                                        kiosk.paperCount > 200 ? 'bg-emerald-500/70' :
                                        kiosk.paperCount > 100 ? 'bg-amber-500/70' :
                                        kiosk.paperCount > 30 ? 'bg-orange-500/70' :
                                        'bg-red-500/70'
                                    }`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Row 4: Stats */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold mb-1">Jobs Today</p>
                            <p className="text-lg font-bold text-foreground tabular-nums">{kiosk.jobsToday}</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold mb-1">Revenue</p>
                            <p className="text-lg font-bold text-emerald-400 tabular-nums">₹{kiosk.revenueToday}</p>
                        </div>
                    </div>

                    {/* Row 5: Footer status */}
                    <div className="pt-1 text-center">
                        {kiosk.isOnline ? (
                            <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-emerald-500/70 flex items-center justify-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                                </span>
                                System Active
                            </span>
                        ) : (
                            <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground/50 flex items-center justify-center gap-1">
                                <XCircle className="w-2.5 h-2.5" />
                                {kiosk.lastSeen ? `Last seen: ${new Date(kiosk.lastSeen).toLocaleTimeString()}` : 'Never seen'}
                            </span>
                        )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Edit Paper Count Dialog */}
      <Dialog open={!!editingKiosk} onOpenChange={(open) => !open && setEditingKiosk(null)}>
        <DialogContent className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-tight">
              <RefreshCw className="w-5 h-5 text-primary" />
              Set Paper Count
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground/80 leading-relaxed">
              Update the current paper stack for <span className="font-medium text-foreground">{editingKiosk?.locationName || editingKiosk?.hostname || editingKiosk?.id}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">
                  Remaining Sheets (0-1000)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="1000"
                    value={newPaperCount}
                    onChange={(e) => setNewPaperCount(e.target.value)}
                    placeholder="e.g. 500"
                    className="bg-white/[0.03] border border-white/[0.08] rounded-xl h-12 text-lg font-bold pl-4 focus:ring-white/20"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                    pages
                  </div>
                </div>
              </div>
              
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current level</span>
                <span className="font-bold text-foreground">{editingKiosk?.paperCount} pages</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setEditingKiosk(null)}
              disabled={updating}
              className="text-muted-foreground hover:bg-white/[0.04] rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSetPaper}
              disabled={updating}
              className="px-8 bg-white text-black hover:bg-neutral-200 rounded-xl"
            >
              {updating ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Location Name Dialog */}
      <Dialog open={!!editingLocation} onOpenChange={(open) => !open && setEditingLocation(null)}>
        <DialogContent className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-tight">
              <MapPin className="w-5 h-5 text-primary" />
              Set Display Name
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground/80 leading-relaxed">
              Set a friendly name for kiosk <span className="font-mono text-xs">{editingLocation?.id}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">
                Location Name / Alias
              </label>
              <Input
                type="text"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="e.g. Library Front Desk"
                className="bg-white/[0.03] border border-white/[0.08] rounded-xl h-12 focus:ring-white/20"
              />
              <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mt-2">
                This name will be visible to administrators in this grid
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setEditingLocation(null)}
              disabled={updating}
              className="text-muted-foreground hover:bg-white/[0.04] rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!editingLocation) return;
                setUpdating(true);
                try {
                  const authHeader = await getAuthHeader();
                  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                  await axios.patch(
                    `${API_URL}/api/admin/kiosks/${editingLocation.id}`,
                    { location_name: newLocationName.trim() || null },
                    { headers: { 'Authorization': authHeader } }
                  );
                  setEditingLocation(null);
                  setNewLocationName('');
                  onRefresh();
                } catch (error) {
                  console.error('Failed to update location:', error);
                  alert(error.response?.data?.message || 'Failed to update location name');
                } finally {
                  setUpdating(false);
                }
              }}
              disabled={updating}
              className="px-8 bg-white text-black hover:bg-neutral-200 rounded-xl"
            >
              {updating ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
