// frontend/src/components/Map/KioskMap.tsx
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useKioskState } from '@/hooks/useKioskState';
import { Plus, Minus, Crosshair } from 'lucide-react';

const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946];
const DEFAULT_ZOOM = 12;

export function KioskMap() {
  const { filteredKiosks, selectedKioskId, setSelectedKioskId, hoveredKioskId } = useKioskState();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [locating, setLocating] = useState(false);

  // ── Initialize Map ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Invalidate immediately + after a short delay (handles flex/grid layout settle)
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);

    // ResizeObserver: re-invalidate whenever the container is resized
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(mapContainerRef.current);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      ro.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // ── Sync Markers ───────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove stale markers
    Object.keys(markersRef.current).forEach((id) => {
      if (!filteredKiosks.find(k => k.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    filteredKiosks.forEach((kiosk) => {
      if (!kiosk.latitude || !kiosk.longitude) return;

      const isSelected = selectedKioskId === kiosk.id;
      const isHovered = hoveredKioskId === kiosk.id;
      const isOnline = Boolean(kiosk.is_online);

      const icon = L.divIcon({
        className: 'kiosk-marker',
        html: `
          <div style="
            width: 48px; height: 48px;
            display: flex; align-items: center; justify-content: center;
            transition: all 400ms cubic-bezier(0.23,1,0.32,1);
            transform: scale(${isSelected || isHovered ? 1.35 : 1});
            z-index: ${isSelected ? 1000 : 1};
          ">
            <div style="
              width: ${isSelected ? '26px' : '18px'};
              height: ${isSelected ? '26px' : '18px'};
              background: ${isOnline ? '#34d399' : '#64748b'};
              border-radius: 999px;
              border: 3px solid white;
              box-shadow: ${isSelected
                ? '0 0 24px rgba(52,211,153,0.9), 0 0 0 10px rgba(52,211,153,0.15)'
                : '0 4px 12px rgba(0,0,0,0.6)'};
              transition: all 400ms cubic-bezier(0.23,1,0.32,1);
            "></div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      if (markersRef.current[kiosk.id]) {
        markersRef.current[kiosk.id].setIcon(icon);
      } else {
        const marker = L.marker([kiosk.latitude, kiosk.longitude], { icon })
          .addTo(map)
          .on('click', () => setSelectedKioskId(kiosk.id));
        markersRef.current[kiosk.id] = marker;
      }
    });
  }, [filteredKiosks, selectedKioskId, hoveredKioskId, setSelectedKioskId]);

  // ── Fly to selected kiosk ──────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedKioskId) return;
    const kiosk = filteredKiosks.find(k => k.id === selectedKioskId);
    if (kiosk?.latitude && kiosk?.longitude) {
      map.flyTo([kiosk.latitude, kiosk.longitude], 16, { animate: true, duration: 0.8 });
    }
  }, [selectedKioskId, filteredKiosks]);

  // ── Fit bounds on load ─────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || selectedKioskId) return;
    const coords = filteredKiosks
      .filter(k => k.latitude && k.longitude)
      .map(k => [k.latitude!, k.longitude!] as [number, number]);
    if (coords.length > 0) {
      map.fitBounds(L.latLngBounds(coords), { padding: [60, 60], maxZoom: 15 });
    }
  }, [filteredKiosks, selectedKioskId]);

  // ── Locate Me ─────────────────────────────────────────────────────────────
  const handleLocateMe = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocating(false);

        // Place/update "you are here" marker
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([latitude, longitude]);
        } else {
          const youIcon = L.divIcon({
            className: '',
            html: `
              <div class="user-pulse-marker" style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
                <div class="pulse" style="
                  position:absolute; inset:0;
                  background:rgba(59,130,246,0.3);
                  border-radius:999px;
                  animation: pulse-ring 2s cubic-bezier(0.24, 0, 0.38, 1) infinite;
                "></div>
                <div style="
                  position:relative;
                  width:14px;height:14px;
                  background:#3b82f6;
                  border-radius:999px;
                  border:2.5px solid white;
                  box-shadow:0 0 20px rgba(59,130,246,0.8);
                  z-index:2;
                "></div>
                <style>
                  @keyframes pulse-ring {
                    0% { transform: scale(0.33); opacity: 0.8; }
                    80%, 100% { transform: scale(1); opacity: 0; }
                  }
                </style>
              </div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 24],
          });
          userMarkerRef.current = L.marker([latitude, longitude], { icon: youIcon }).addTo(map);
        }

        map.flyTo([latitude, longitude], 15, { animate: true, duration: 1 });
      },
      () => {
        setLocating(false);
        // Silently fail — browser will show its own permission prompt
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#05070a' }}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Custom Controls — bottom right */}
      <div className="absolute bottom-40 lg:bottom-10 right-4 z-[900] flex flex-col gap-2">
        {/* Zoom In */}
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="w-11 h-11 flex items-center justify-center bg-[#0c0c0f]/90 backdrop-blur-xl border border-white/[0.1] rounded-2xl text-white hover:bg-white/[0.1] active:scale-95 transition-all shadow-2xl"
          aria-label="Zoom in"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="w-11 h-11 flex items-center justify-center bg-[#0c0c0f]/90 backdrop-blur-xl border border-white/[0.1] rounded-2xl text-white hover:bg-white/[0.1] active:scale-95 transition-all shadow-2xl"
          aria-label="Zoom out"
        >
          <Minus className="w-5 h-5" />
        </button>

        {/* Locate Me */}
        <button
          onClick={handleLocateMe}
          disabled={locating}
          className={`w-11 h-11 flex items-center justify-center backdrop-blur-xl border rounded-2xl active:scale-95 transition-all shadow-2xl ${
            locating
              ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 animate-pulse'
              : 'bg-[#0a0a0a]/90 border-white/[0.1] text-white hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400'
          }`}
          aria-label="Locate me"
        >
          <Crosshair className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
