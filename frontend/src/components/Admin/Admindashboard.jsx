// frontend/src/components/Admin/AdminDashboard.jsx
// Main admin dashboard redesign with Premium Shell and auto-refresh logic

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { MetricsGrid } from './MetricsGrid';
import { KioskHealthGrid } from './Kioskhealthgrid';
import { RecentJobsTable } from './Recentjobstable';
import { useAuth } from '../AuthProvider';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const AUTO_REFRESH_INTERVAL = 10000; // 10 seconds

export function AdminDashboard() {
  const { getAuthHeader } = useAuth();

  const [metrics, setMetrics] = useState(null);
  const [kiosks, setKiosks] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);

  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingKiosks, setLoadingKiosks] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const authHeader = await getAuthHeader();
      const response = await axios.get(`${API_URL}/api/admin/metrics`, {
        headers: { Authorization: authHeader }
      });
      setMetrics(response.data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoadingMetrics(false);
    }
  }, [getAuthHeader]);

  // Fetch kiosks
  const fetchKiosks = useCallback(async () => {
    try {
      const authHeader = await getAuthHeader();
      const response = await axios.get(`${API_URL}/api/admin/kiosks`, {
        headers: { Authorization: authHeader }
      });
      setKiosks(response.data.kiosks || []);
    } catch (error) {
      console.error('Failed to fetch kiosks:', error);
    } finally {
      setLoadingKiosks(false);
    }
  }, [getAuthHeader]);

  // Fetch recent jobs
  const fetchRecentJobs = useCallback(async () => {
    try {
      const authHeader = await getAuthHeader();
      const response = await axios.get(
        `${API_URL}/api/admin/recent-jobs?limit=20`,
        { headers: { Authorization: authHeader } }
      );
      setRecentJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Failed to fetch recent jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  }, [getAuthHeader]);

  const [settings, setSettings] = useState({});
  const [updatingSetting, setUpdatingSetting] = useState(false);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const authHeader = await getAuthHeader();
      const response = await axios.get(`${API_URL}/api/admin/settings`, {
        headers: { Authorization: authHeader }
      });
      setSettings(response.data.settings || {});
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  }, [getAuthHeader]);

  // Update a specific setting
  const togglePublicTestKiosk = async () => {
    setUpdatingSetting(true);
    const newValue = !settings.allow_public_test_kiosk;
    try {
      const authHeader = await getAuthHeader();
      await axios.post(`${API_URL}/api/admin/settings`, 
        { key: 'allow_public_test_kiosk', value: newValue },
        { headers: { Authorization: authHeader } }
      );
      setSettings(prev => ({ ...prev, allow_public_test_kiosk: newValue }));
    } catch (error) {
      console.error('Failed to update setting:', error);
    } finally {
      setUpdatingSetting(false);
    }
  };

  // Manual refresh
  const handleRefresh = useCallback(() => {
    setLoadingMetrics(true);
    setLoadingKiosks(true);
    setLoadingJobs(true);
    setLastRefresh(new Date());

    fetchMetrics();
    fetchKiosks();
    fetchRecentJobs();
    fetchSettings();
  }, [fetchMetrics, fetchKiosks, fetchRecentJobs, fetchSettings]);

  // Initial load
  useEffect(() => {
    fetchMetrics();
    fetchKiosks();
    fetchRecentJobs();
    fetchSettings();
  }, [fetchMetrics, fetchKiosks, fetchRecentJobs, fetchSettings]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      setLastRefresh(new Date());
      fetchMetrics();
      fetchKiosks();
      fetchRecentJobs();
      fetchSettings();
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, fetchMetrics, fetchKiosks, fetchRecentJobs, fetchSettings]);

  return (
    <div className="space-y-8 pb-12">
      {/* Premium Header ... (remains at line 111) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">Administration</span>
          <h1 className="text-3xl font-light tracking-tight text-foreground mt-1">
            System <span className="font-extrabold italic font-serif">Overview</span>
          </h1>
          <p className="text-[13px] text-muted-foreground/70 mt-1">Real-time kiosk monitoring and job management center</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            className={`inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-full transition-all border ${
              autoRefreshEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-white/[0.03] text-muted-foreground border-white/[0.08] grayscale'
            }`}
          >
            {autoRefreshEnabled && (
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
            )}
            {autoRefreshEnabled ? 'Live Feed' : 'Paused'}
          </button>

          {/* Manual Refresh button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-2xl hover:bg-neutral-200 transition-colors font-bold text-[13px] shadow-xl shadow-white/5"
          >
            <RefreshCw className={`w-4 h-4 ${(loadingMetrics || loadingKiosks || loadingJobs) ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </div>
      </motion.div>

      {/* Last Refresh Timestamp line */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground/40 font-medium">
        <span className={`w-1.5 h-1.5 rounded-full ${autoRefreshEnabled ? 'bg-emerald-500/50' : 'bg-muted-foreground/30'}`}></span>
        <span>Last updated <span className="font-bold tabular-nums text-muted-foreground/60 ml-0.5">{lastRefresh.toLocaleTimeString()}</span></span>
      </div>

      {/* Dashboard Sections separated by the space-y-8 */}
      <div className="space-y-8">
        {/* Metrics Overview */}
        <MetricsGrid metrics={metrics} loading={loadingMetrics} />

        {/* System Preferences Section */}
        <motion.div
           initial={{ opacity: 0, y: 15 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">System Preferences</span>
              <h3 className="text-lg font-semibold tracking-tight text-white">Public Access Control</h3>
              <p className="text-[12px] text-muted-foreground/70 max-w-lg">
                Controls whether the mock test kiosk (<span className="font-mono text-white/50 text-[11px]">kiosk_test</span>) 
                is accessible to all users or restricted exclusively to administrators.
              </p>
            </div>

            <div className="flex items-center gap-4">
               <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 ${settings.allow_public_test_kiosk ? 'text-emerald-400' : 'text-muted-foreground/40'}`}>
                 {settings.allow_public_test_kiosk ? 'Public Enabled' : 'Public Disabled'}
               </span>
               <button
                  onClick={togglePublicTestKiosk}
                  disabled={updatingSetting}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 ${updatingSetting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${settings.allow_public_test_kiosk ? 'bg-emerald-500' : 'bg-white/10 border border-white/5'}`}
               >
                 <motion.div
                   animate={{ x: settings.allow_public_test_kiosk ? 28 : 4 }}
                   className={`absolute top-1 w-5 h-5 rounded-full shadow-lg ${settings.allow_public_test_kiosk ? 'bg-white shadow-emerald-900/40' : 'bg-white/20'}`}
                 />
                 {updatingSetting && (
                   <div className="absolute inset-0 flex items-center justify-center">
                     <RefreshCw className="w-3 h-3 text-white animate-spin" />
                   </div>
                 )}
               </button>
            </div>
          </div>
        </motion.div>

        {/* Dynamic Monitor Component (Kiosks) */}
        <KioskHealthGrid
          kiosks={kiosks}
          loading={loadingKiosks}
          onRefresh={fetchKiosks}
          getAuthHeader={getAuthHeader}
        />

        {/* Global Activity Feed */}
        <RecentJobsTable jobs={recentJobs} loading={loadingJobs} />
      </div>
    </div>
  );
}
