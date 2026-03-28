// frontend/src/components/Admin/KioskHealthGrid.jsx
// Real-time kiosk status monitor with card-based layout and capability awareness

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Printer, AlertTriangle, CheckCircle, XCircle, 
  Droplet, RefreshCw, Edit, MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Offline</Badge>;
    }
    if (kiosk.currentJobId) {
      return <Badge variant="secondary" className="gap-1 bg-yellow-500/20 text-yellow-500 dark:text-yellow-400 border-yellow-500/30">🟡 Busy</Badge>;
    }
    return <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"><CheckCircle className="w-3 h-3" />Online</Badge>;
  };

  const getPrinterStatusBadge = (status, detail) => {
    if (status === 'healthy') {
      return <Badge variant="outline" className="gap-1 bg-green-500/5 text-green-600 dark:text-green-400 border-green-500/20"><CheckCircle className="w-3 h-3" />Ready</Badge>;
    }
    if (status === 'error') {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" />{detail || 'Error'}</Badge>;
    }
    return <Badge variant="outline" className="gap-1 text-muted-foreground"><AlertTriangle className="w-3 h-3" />Unknown</Badge>;
  };

  const getPaperBadge = (level, count) => {
    const badges = {
      high: <Badge variant="outline" className="gap-1 bg-green-500/5 text-green-600 dark:text-green-400 border-green-500/20"><Droplet className="w-3 h-3" />{count}</Badge>,
      medium: <Badge variant="outline" className="gap-1 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400 border-yellow-500/20"><Droplet className="w-3 h-3" />{count}</Badge>,
      low: <Badge variant="outline" className="gap-1 bg-orange-500/5 text-orange-600 dark:text-orange-400 border-orange-500/20"><Droplet className="w-3 h-3" />{count}</Badge>,
      empty: <Badge variant="destructive" className="gap-1"><Droplet className="w-3 h-3" />Empty</Badge>
    };
    return badges[level] || badges.empty;
  };

  const getCardBorderClass = (kiosk) => {
    if (!kiosk.isOnline) return 'border-l-4 border-l-red-500/70';
    if (kiosk.currentJobId) return 'border-l-4 border-l-yellow-500/70';
    return 'border-l-4 border-l-green-500/70';
  };

  const EpsonBadge = () => (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-bold bg-[#003399]/10 text-[#003399] dark:bg-[#4d8bff]/15 dark:text-[#6da3ff] border border-[#003399]/15 dark:border-[#4d8bff]/20">
      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor">
        <path d="M0 7.5h19.5v2.25H2.25v2.25H19.5V14.25H2.25v2.25h19.5v2.25H0V7.5z"/>
      </svg>
      Epson
    </span>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" />
            Kiosk Health Monitor
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-card/40 border border-border rounded-xl p-6 h-48"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" />
            Kiosk Health Monitor
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="gap-2 backdrop-blur-sm bg-background/50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {kiosks.length === 0 ? (
          <Card className="bg-card/40 border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <XCircle className="w-12 h-12 mb-4 opacity-20" />
              <p>No kiosks registered yet</p>
            </CardContent>
          </Card>
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
                  className={`relative overflow-hidden bg-card/60 backdrop-blur-md border border-border rounded-xl shadow-sm hover:brightness-105 transition-all group ${getCardBorderClass(kiosk)}`}
                >
                  <div className="p-5 space-y-4">
                    {/* Header: Location & Online Status */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg leading-none tracking-tight">
                            {kiosk.locationName || kiosk.hostname || kiosk.id}
                            <span className="ml-2 text-xs font-mono font-normal text-muted-foreground/60">
                              #{kiosk.id}
                            </span>
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
                        {/* ID hidden here since it's now in the header */}
                      </div>
                      <div>
                        {getStatusBadge(kiosk)}
                      </div>
                    </div>

                    {/* Printer Info & Capabilities */}
                    <div className="space-y-2 py-2 border-y border-border/50">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Printer className="w-3.5 h-3.5" />
                          {kiosk.printerName || 'Unknown Printer'}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {kiosk.printerBrand === 'epson' && <EpsonBadge />}
                          {kiosk.printerDriver && (
                            <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground border border-border/50">
                              {kiosk.printerDriver}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Row (Health + Paper) */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        {getPrinterStatusBadge(kiosk.printerStatus, kiosk.printerStatusDetail)}
                      </div>
                      <div className="flex items-center gap-1.5 bg-background/40 px-2 py-1 rounded-lg border border-border/40">
                        {getPaperBadge(kiosk.paperLevel, kiosk.paperCount)}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingKiosk(kiosk);
                            setNewPaperCount(kiosk.paperCount.toString());
                          }}
                          className="h-6 w-6"
                        >
                          <Edit className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                      <div className="bg-background/40 p-2 rounded-lg border border-border/40">
                        <p className="text-muted-foreground mb-0.5 uppercase tracking-wider font-semibold text-[10px]">Jobs Today</p>
                        <p className="text-base font-bold">{kiosk.jobsToday}</p>
                      </div>
                      <div className="bg-background/40 p-2 rounded-lg border border-border/40">
                        <p className="text-muted-foreground mb-0.5 uppercase tracking-wider font-semibold text-[10px]">Revenue</p>
                        <p className="text-base font-bold text-green-500">₹{kiosk.revenueToday}</p>
                      </div>
                    </div>

                    {/* Footer: Last Seen */}
                    <div className="pt-2 text-[10px] uppercase tracking-widest font-bold text-center">
                      {kiosk.isOnline ? (
                        <span className="text-green-500/80 animate-pulse">● System Active</span>
                      ) : (
                        <span className="text-muted-foreground flex items-center justify-center gap-1">
                          <XCircle className="w-2.5 h-2.5" />
                          {kiosk.lastSeen 
                            ? `LAST SEEN: ${new Date(kiosk.lastSeen).toLocaleTimeString()}`
                            : 'NEVER SEEN'
                          }
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
        <DialogContent className="bg-card border-border sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-primary" />
              Set Paper Count
            </DialogTitle>
            <DialogDescription>
              Update the current paper stack for <span className="font-medium text-foreground">{editingKiosk?.locationName || editingKiosk?.hostname || editingKiosk?.id}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
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
                    className="bg-background/50 h-12 text-lg font-bold pl-4"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                    pages
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current level</span>
                <span className="font-bold">{editingKiosk?.paperCount} pages</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setEditingKiosk(null)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSetPaper}
              disabled={updating}
              className="px-8"
            >
              {updating ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Location Name Dialog */}
      <Dialog open={!!editingLocation} onOpenChange={(open) => !open && setEditingLocation(null)}>
        <DialogContent className="bg-card border-border sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Set Display Name
            </DialogTitle>
            <DialogDescription>
              Set a friendly name for kiosk <span className="font-mono text-xs">{editingLocation?.id}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Location Name / Alias
              </label>
              <Input
                type="text"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="e.g. Library Front Desk"
                className="bg-background/50 h-12"
              />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-2">
                This name will be visible to administrators in this grid
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setEditingLocation(null)}
              disabled={updating}
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
              className="px-8"
            >
              {updating ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}