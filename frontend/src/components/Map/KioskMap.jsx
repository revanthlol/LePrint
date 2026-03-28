import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const DEFAULT_CENTER = [12.9716, 77.5946];
const DEFAULT_ZOOM = 12;

function hasCoordinates(kiosk) {
  return kiosk?.latitude !== null && kiosk?.latitude !== undefined
    && kiosk?.longitude !== null && kiosk?.longitude !== undefined;
}

export function KioskMap({ kiosks = [], selectedKiosk, onSelectKiosk, isVisible = true }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) {
      return undefined;
    }

    mapInstanceRef.current = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible || !mapInstanceRef.current) return;

    const timeoutId = window.setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 80);

    return () => window.clearTimeout(timeoutId);
  }, [isVisible]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    kiosks.forEach((kiosk) => {
      if (!hasCoordinates(kiosk)) return;

      const isSelected = selectedKiosk?.id === kiosk.id;
      const isOnline = Boolean(kiosk.is_online);

      const icon = L.divIcon({
        className: 'leprint-map-marker',
        html: `
          <div style="
            width: 44px;
            height: 44px;
            border-radius: 999px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            background: ${isOnline ? 'linear-gradient(180deg, #34d399, #059669)' : 'linear-gradient(180deg, #64748b, #475569)'};
            border: 2px solid ${isSelected ? '#ffffff' : 'rgba(255,255,255,0.28)'};
            box-shadow: ${isSelected ? '0 0 0 5px rgba(255,255,255,0.16)' : '0 12px 30px rgba(0,0,0,0.32)'};
            transform: ${isSelected ? 'scale(1.12)' : 'scale(1)'};
            transition: transform 180ms ease, box-shadow 180ms ease;
          ">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:20px;height:20px;">
              <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 11-6 0 3 3 0 016 0z" clip-rule="evenodd" />
            </svg>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([kiosk.latitude, kiosk.longitude], { icon })
        .addTo(map)
        .on('click', () => onSelectKiosk(kiosk));

      marker.bindPopup(`
        <div style="min-width: 170px; padding: 4px 2px;">
          <div style="font-size: 14px; font-weight: 700; color: #111827;">
            ${kiosk.location_name || kiosk.id}
          </div>
          <div style="margin-top: 4px; font-size: 12px; color: #4b5563;">
            ${isOnline ? 'Online and ready' : 'Currently offline'}
          </div>
        </div>
      `);

      if (isSelected) {
        marker.openPopup();
      }

      markersRef.current[kiosk.id] = marker;
    });
  }, [kiosks, onSelectKiosk, selectedKiosk]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isVisible) return;

    const mappedKiosks = kiosks.filter(hasCoordinates);
    if (!mappedKiosks.length) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    const bounds = L.latLngBounds(mappedKiosks.map((kiosk) => [kiosk.latitude, kiosk.longitude]));
    map.fitBounds(bounds, {
      padding: [48, 48],
      maxZoom: 15,
    });
  }, [isVisible, kiosks]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isVisible || !hasCoordinates(selectedKiosk)) return;

    map.flyTo([selectedKiosk.latitude, selectedKiosk.longitude], 15, {
      animate: true,
      duration: 0.8,
    });
  }, [isVisible, selectedKiosk]);

  const hasAnyCoordinates = kiosks.some(hasCoordinates);

  if (!hasAnyCoordinates) {
    return (
      <div className="relative flex h-full min-h-[360px] w-full items-center justify-center overflow-hidden bg-[#05070a]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.06),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))]" />
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative z-10 mx-6 max-w-sm rounded-[28px] border border-white/[0.07] bg-[#080b10]/92 px-6 py-7 text-center shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-white/56">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 11-6 0 3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold tracking-[-0.03em] text-white/92">Live Kiosk Locations Unavailable</h3>
          <p className="mt-2 text-sm leading-6 text-white/44">
            {kiosks.length === 0
              ? 'No kiosks are available yet. They will appear here once a kiosk reports in.'
              : 'Our kiosks are currently online, but their precise map coordinates haven\'t been set. You can still use the list view to find and print at these locations.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-[300] bg-[linear-gradient(180deg,rgba(4,7,10,0.08),rgba(4,7,10,0.22))]" />
      <div ref={mapContainerRef} className="h-full min-h-[360px] w-full" />
    </div>
  );
}
