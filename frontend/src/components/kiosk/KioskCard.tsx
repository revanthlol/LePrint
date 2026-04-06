import { Printer, Navigation } from 'lucide-react';
import type { Kiosk } from '@/hooks/useKioskState';

interface KioskCardProps {
  kiosk: Kiosk;
  isSelected?: boolean;
  onSelect: () => void;
  onPrint: () => void;
  onRoute: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function KioskCard({
  kiosk,
  isSelected,
  onSelect,
  onPrint,
  onRoute,
  onMouseEnter,
  onMouseLeave,
}: KioskCardProps) {
  const isOnline = kiosk.is_online;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        group relative flex flex-col p-4 m-2 rounded-2xl transition-all duration-300 cursor-pointer border
        ${isSelected 
          ? 'bg-white/[0.08] border-white/[0.15] shadow-[0_8px_32px_rgba(0,0,0,0.4)] scale-[1.02] z-10' 
          : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1] hover:scale-[1.01]'}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 shrink-0 rounded-full transition-all duration-500 ${isOnline ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]' : 'bg-white/20'}`} />
            <h3 className="truncate text-[15px] font-bold tracking-tight text-white/90 group-hover:text-white transition-colors">
              {kiosk.location_name || kiosk.id}
            </h3>
          </div>
          <p className="mt-1 truncate text-[10px] text-white/30 font-bold uppercase tracking-widest">
            {kiosk.printer_status_detail || kiosk.printer_status || (isOnline ? 'Online' : 'Offline')} • {kiosk.id}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 transition-all duration-300 opacity-100 translate-y-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrint();
          }}
          disabled={!isOnline}
          className={`
            flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all
            ${isOnline 
              ? 'bg-white text-black hover:bg-neutral-200' 
              : 'bg-white/5 text-white/20 cursor-not-allowed'}
          `}
        >
          <Printer className="w-3 h-3" />
          Print
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRoute();
          }}
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all"
        >
          <Navigation className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
