import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3002';

export interface Kiosk {
  id: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  is_online: boolean;
  printer_status?: string;
  printer_status_detail?: string;
  [key: string]: any;
}

export function useKioskState() {
  const [kiosks, setKiosks] = useState<Kiosk[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKioskId, setSelectedKioskId] = useState<string | null>(null);
  const [hoveredKioskId, setHoveredKioskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(false);

  const fetchKiosks = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/kiosks/public`);
      setKiosks(data.kiosks || []);
    } catch (error) {
      console.error('Failed to fetch kiosks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKiosks();
    const interval = setInterval(fetchKiosks, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const filteredKiosks = useMemo(() => {
    return kiosks
      .filter((kiosk) => {
        const matchesSearch = 
          searchQuery === '' || 
          kiosk.location_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          kiosk.id.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesOnline = !onlineOnly || kiosk.is_online;
        
        return matchesSearch && matchesOnline;
      })
      .sort((a, b) => {
        // Sort by online status first, then by name
        if (a.is_online !== b.is_online) return a.is_online ? -1 : 1;
        return (a.location_name || a.id).localeCompare(b.location_name || b.id);
      });
  }, [kiosks, searchQuery, onlineOnly]);

  const selectedKiosk = useMemo(() => 
    kiosks.find(k => k.id === selectedKioskId) || null,
  [kiosks, selectedKioskId]);

  return {
    kiosks,
    filteredKiosks,
    loading,
    selectedKioskId,
    selectedKiosk,
    hoveredKioskId,
    searchQuery,
    onlineOnly,
    setSelectedKioskId,
    setHoveredKioskId,
    setSearchQuery,
    setOnlineOnly,
    refreshKiosks: fetchKiosks,
  };
}
