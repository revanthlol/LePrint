import { useRef, useEffect } from 'react';
import { Search, MapPin, Wifi, WifiOff, Radio } from 'lucide-react';
import { KioskCard } from './KioskCard';
import { useKioskState } from '@/hooks/useKioskState';
import { useNavigate } from 'react-router-dom';

interface KioskSidebarProps {
  /** Add extra top padding to clear a floating PublicNavbar (guest/public view) */
  topOffset?: boolean;
  /** Whether the sidebar is within the main app/dashboard sidebar context */
  inApp?: boolean;
}

export function KioskSidebar({ topOffset = false, inApp = false }: KioskSidebarProps) {
  const {
    filteredKiosks,
    selectedKioskId,
    setSelectedKioskId,
    setHoveredKioskId,
    searchQuery,
    setSearchQuery,
    onlineOnly,
    setOnlineOnly,
    loading
  } = useKioskState();

  const navigate = useNavigate();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedKioskId && listRef.current) {
      const el = listRef.current.querySelector(`[data-kiosk-id="${selectedKioskId}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedKioskId]);

  return (
    <div
      className={`
        hidden lg:flex flex-col
        absolute bottom-6 w-[340px] z-[1000]
        bg-[#0a0a0a]/60 backdrop-blur-3xl
        border border-white/[0.08]
        rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]
        overflow-hidden transition-all duration-500
        ${inApp ? 'left-6 lg:left-72 top-6' : `left-6 ${topOffset ? 'top-24' : 'top-6'}`}
      `}
      style={{ 
        maxHeight: inApp ? 'calc(100vh - 48px)' : 'calc(100vh - 120px)'
      }}
    >
      <div className="flex flex-col h-full bg-gradient-to-b from-white/[0.02] to-transparent">
        {/* Header */}
        <div className="p-7 pb-5 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center shadow-inner">
                <MapPin className="w-5 h-5 text-white/90" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Find Kiosk</h2>
                <p className="text-[11px] text-white/30 font-bold uppercase tracking-widest mt-0.5">
                  {filteredKiosks.length} {filteredKiosks.length === 1 ? 'kiosk' : 'kiosks'} nearby
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-white/40 transition-colors" />
              <input
                type="text"
                placeholder="Search location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 bg-white/[0.03] border border-white/[0.06] rounded-2xl pl-11 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/[0.15] focus:bg-white/[0.05] transition-all"
              />
            </div>
            
            <button
              onClick={() => setOnlineOnly(!onlineOnly)}
              className={`
                w-full h-11 flex items-center justify-center gap-3 rounded-2xl border transition-all duration-300
                ${onlineOnly 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.05)]' 
                  : 'bg-white/[0.02] border-white/[0.05] text-white/30 hover:border-white/10 hover:text-white/60'}
              `}
            >
              {onlineOnly ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="text-[10px] font-bold uppercase tracking-[0.15em]">Online Only</span>
            </button>
          </div>
        </div>

        {/* ── Kiosk List ─────────────────────────────────────────────────────── */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto overflow-x-hidden pt-3 scroll-smooth"
          style={{ scrollbarWidth: 'none' }}
        >
          {loading ? (
            <div className="flex flex-col gap-3 px-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 rounded-3xl bg-white/[0.02] animate-pulse border border-white/[0.03]" />
              ))}
            </div>
          ) : filteredKiosks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-10 text-center opacity-30">
              <Radio className="w-10 h-10 mb-4" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] leading-relaxed">No kiosks broadcasting in this region</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 px-3 pb-8">
              {filteredKiosks.map((kiosk) => (
                <div key={kiosk.id} data-kiosk-id={kiosk.id} className="transition-transform duration-300">
                  <KioskCard
                    kiosk={kiosk}
                    isSelected={selectedKioskId === kiosk.id}
                    onSelect={() => setSelectedKioskId(kiosk.id)}
                    onMouseEnter={() => setHoveredKioskId(kiosk.id)}
                    onMouseLeave={() => setHoveredKioskId(null)}
                    onPrint={() => navigate(`/app?kiosk_id=${kiosk.id}`)}
                    onRoute={() => {
                      if (kiosk.latitude && kiosk.longitude) {
                        window.open(
                          `https://www.google.com/maps/dir/?api=1&destination=${kiosk.latitude},${kiosk.longitude}`,
                          '_blank'
                        );
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
