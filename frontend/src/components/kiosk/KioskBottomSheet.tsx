// KioskBottomSheet — Apple Maps / Uber style draggable bottom sheet
// 
// COORDINATE SYSTEM (this is what was broken before):
// - Element: absolute bottom-0, height = SHEET_H
//   → Naturally sits flush with viewport bottom, top of element at (vh - SHEET_H)
// - y: 0         → element at its natural position = FULLY visible
// - y: positive  → moves DOWN → element hides below viewport bottom
// - y: COLLAPSE  → (SHEET_H - PEEK) px down → only PEEK px visible at bottom ✓
//
// dragConstraints: top=0 (can't go more open), bottom=COLLAPSE (can't go more closed)

import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Search, Wifi, WifiOff, Map as MapIcon, List } from 'lucide-react';
import { KioskCard } from './KioskCard';
import { useKioskState } from '@/hooks/useKioskState';
import { useNavigate } from 'react-router-dom';

const PEEK_PX = 148;          // how many px are visible when collapsed (handle + tabs)
const SHEET_H_RATIO = 0.88;   // sheet max height = 88% of viewport

export function KioskBottomSheet() {
  const {
    filteredKiosks,
    selectedKioskId,
    setSelectedKioskId,
    searchQuery,
    setSearchQuery,
    onlineOnly,
    setOnlineOnly,
    loading
  } = useKioskState();

  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Recalculate on every render (handles orientation change)
  const sheetH = useMemo(() => Math.round(window.innerHeight * SHEET_H_RATIO), []);
  const COLLAPSE = sheetH - PEEK_PX;

  const open = () => { setIsOpen(true); };
  const close = () => { setIsOpen(false); };

  const handleDragEnd = (_: unknown, info: { velocity: { y: number }; offset: { y: number } }) => {
    if (info.velocity.y > 250) {
      // Fast swipe down → collapse
      close();
    } else if (info.velocity.y < -250) {
      // Fast swipe up → open
      open();
    } else {
      // Slow drag — snap based on offset from current position
      if (isOpen) {
        // Currently open: close if dragged down significantly
        if (info.offset.y > 80) close();
      } else {
        // Currently closed: open if dragged up significantly
        if (info.offset.y < -60) open();
      }
    }
  };

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: COLLAPSE + 8 }}
      dragElastic={{ top: 0.08, bottom: 0.08 }}
      dragMomentum={false}
      initial={{ y: COLLAPSE }}
      animate={{ y: isOpen ? 0 : COLLAPSE }}
      onDragEnd={handleDragEnd}
      transition={{ type: 'spring', damping: 30, stiffness: 280 }}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: sheetH,
        zIndex: 500,
      }}
      className="bg-[#0a0a0a]/75 backdrop-blur-3xl border-t border-white/[0.08] rounded-t-[28px] shadow-[0_-12px_40px_rgba(0,0,0,0.7)] flex flex-col md:hidden"
    >
      {/* ── Drag Handle ─────────────────────────────────────────────────────── */}
      <div
        className="flex flex-col items-center pt-3 shrink-0 cursor-grab active:cursor-grabbing select-none"
        onPointerDown={(e) => e.currentTarget.closest('div')?.setPointerCapture?.(e.pointerId)}
      >
        <div className="w-10 h-1 rounded-full bg-white/20 mb-3" />

        {/* ── Map / List tabs ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-2xl border border-white/[0.07] w-[calc(100%-32px)] mb-3">
          <button
            onClick={close}
            className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-200 ${
              !isOpen
                ? 'bg-white text-black shadow'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            Map
          </button>
          <button
            onClick={open}
            className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-200 ${
              isOpen
                ? 'bg-white text-black shadow'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            List
          </button>
        </div>

        {/* ── Search bar ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 w-[calc(100%-32px)] mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => open()}
              placeholder="Search kiosks…"
              className="w-full h-10 bg-white/[0.04] border border-white/[0.07] rounded-xl pl-10 pr-4 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/[0.16] transition-all"
            />
          </div>
          <button
            onClick={() => setOnlineOnly(!onlineOnly)}
            className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border transition-all ${
              onlineOnly
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-white/[0.03] border-white/[0.07] text-white/30 hover:text-white/60'
            }`}
          >
            {onlineOnly ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-white/[0.06] shrink-0" />

      {/* ── Kiosk List ─────────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain px-3 pt-2 pb-8"
        style={{ scrollbarWidth: 'none' }}
      >
        {loading ? (
          <div className="flex flex-col gap-2 py-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-2xl bg-white/[0.03] animate-pulse border border-white/[0.04]" />
            ))}
          </div>
        ) : filteredKiosks.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[11px] text-white/20 font-bold uppercase tracking-widest">No kiosks found</p>
          </div>
        ) : (
          filteredKiosks.map((kiosk) => (
            <KioskCard
              key={kiosk.id}
              kiosk={kiosk}
              isSelected={selectedKioskId === kiosk.id}
              onSelect={() => {
                setSelectedKioskId(kiosk.id);
                // Removed close() to keep sheet open when selecting from list
              }}
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
          ))
        )}
      </div>
    </motion.div>
  );
}
