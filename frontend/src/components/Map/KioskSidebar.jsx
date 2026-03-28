import { useMemo, useState } from 'react';
import { ExternalLink, MapPin, Navigation, Printer, Search, Wifi, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { id: 'all', label: 'All kiosks' },
  { id: 'online', label: 'Online', icon: Wifi },
  { id: 'mapped', label: 'Mapped', icon: Navigation },
];

function hasCoordinates(kiosk) {
  return kiosk?.latitude !== null && kiosk?.latitude !== undefined
    && kiosk?.longitude !== null && kiosk?.longitude !== undefined;
}

export function KioskSidebar({ kiosks = [], selectedKiosk, onSelectKiosk, loading = false }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const visibleKiosks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    let nextKiosks = [...kiosks];

    if (category === 'online') {
      nextKiosks = nextKiosks.filter((kiosk) => kiosk.is_online);
    }

    if (category === 'mapped') {
      nextKiosks = nextKiosks.filter(hasCoordinates);
    }

    if (normalizedQuery) {
      nextKiosks = nextKiosks.filter((kiosk) => {
        const name = kiosk.location_name?.toLowerCase() || '';
        const id = kiosk.id?.toLowerCase() || '';
        return name.includes(normalizedQuery) || id.includes(normalizedQuery);
      });
    }

    return nextKiosks.sort((a, b) => {
      if (a.is_online !== b.is_online) {
        return a.is_online ? -1 : 1;
      }

      const aHasCoordinates = hasCoordinates(a);
      const bHasCoordinates = hasCoordinates(b);

      if (aHasCoordinates !== bHasCoordinates) {
        return aHasCoordinates ? -1 : 1;
      }

      return (a.location_name || a.id || '').localeCompare(b.location_name || b.id || '');
    });
  }, [category, kiosks, query]);

  const getCount = (categoryId) => {
    if (categoryId === 'all') return kiosks.length;
    if (categoryId === 'online') return kiosks.filter((kiosk) => kiosk.is_online).length;
    if (categoryId === 'mapped') return kiosks.filter(hasCoordinates).length;
    return 0;
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-transparent text-white">
      <div className="border-b border-white/[0.06] px-4 py-4 sm:px-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/36">
              <MapPin className="h-3.5 w-3.5" />
              Browse kiosks
            </div>
            <h2 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-white/92">Choose your location</h2>
            <p className="mt-1 text-sm leading-6 text-white/46">
              Search by kiosk name, filter by availability, and jump straight into print or directions.
            </p>
          </div>
        </div>

        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(({ id, label, icon: Icon }) => {
            const isActive = id === category;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'border-white bg-white text-black'
                    : 'border-white/[0.06] bg-white/[0.025] text-white/56 hover:border-white/[0.1] hover:text-white'
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{label}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                  isActive ? 'bg-black/10 text-black/60' : 'bg-white/[0.05] text-white/36'
                }`}>
                  {getCount(id)}
                </span>
              </button>
            );
          })}
        </div>

        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by kiosk name or ID"
            className="h-11 w-full rounded-2xl border border-white/[0.06] bg-white/[0.025] pl-10 pr-4 text-sm text-white/88 placeholder:text-white/24 focus:border-white/[0.12] focus:bg-white/[0.04] focus:outline-none"
          />
        </label>

        <div className="mt-3 text-[11px] font-medium uppercase tracking-[0.16em] text-white/28">
          {loading ? 'Loading kiosks' : `Showing ${visibleKiosks.length} of ${kiosks.length}`}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-[24px] border border-white/[0.05] bg-white/[0.02] p-4"
            >
              <div className="mb-4 h-4 w-40 rounded bg-white/[0.07]" />
              <div className="mb-2 h-3 w-24 rounded bg-white/[0.05]" />
              <div className="h-10 rounded-2xl bg-white/[0.05]" />
            </div>
          ))
        ) : visibleKiosks.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[28px] border border-dashed border-white/[0.07] bg-white/[0.02] px-6 text-center">
            <div className="mb-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
              <XCircle className="h-5 w-5 text-white/35" />
            </div>
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-white/90">No kiosks match right now</h3>
            <p className="mt-2 max-w-xs text-sm leading-6 text-white/42">
              Try a different search, switch filters, or refresh the list to pull the latest available kiosks.
            </p>
          </div>
        ) : (
          visibleKiosks.map((kiosk) => (
            <KioskCard
              key={kiosk.id}
              kiosk={kiosk}
              isSelected={selectedKiosk?.id === kiosk.id}
              onSelect={() => onSelectKiosk(kiosk)}
              onPrint={() => navigate(`/app?kiosk_id=${kiosk.id}`)}
              onRoute={() => {
                if (hasCoordinates(kiosk)) {
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${kiosk.latitude},${kiosk.longitude}`,
                    '_blank',
                    'noopener,noreferrer',
                  );
                }
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function KioskCard({ kiosk, isSelected, onSelect, onPrint, onRoute }) {
  const online = Boolean(kiosk.is_online);
  const mapped = hasCoordinates(kiosk);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`rounded-[26px] border p-4 transition focus:outline-none focus:ring-2 focus:ring-white/20 ${
        isSelected
          ? 'border-white/[0.1] bg-white/[0.04] shadow-[0_20px_60px_rgba(0,0,0,0.3)]'
          : 'border-white/[0.05] bg-white/[0.018] hover:border-white/[0.08] hover:bg-white/[0.03]'
      }`}
    >
      <div className="mb-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${
            online
              ? 'bg-emerald-500/12 text-emerald-300'
              : 'bg-white/[0.06] text-white/40'
          }`}>
            {online ? 'Online' : 'Offline'}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${
            mapped
              ? 'bg-white/[0.06] text-white/58'
              : 'bg-white/[0.06] text-white/40'
          }`}>
            {mapped ? 'Mapped' : 'No coordinates'}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${
            online
              ? 'bg-emerald-500/10 text-emerald-200'
              : 'bg-white/[0.05] text-white/38'
          }`}>
            {online ? 'Ready' : 'Unavailable'}
          </span>
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-[1.18rem] font-semibold tracking-[-0.035em] text-white/92">
            {kiosk.location_name || kiosk.id}
          </h3>
          <p className="mt-1 text-sm text-white/40">Kiosk ID: {kiosk.id}</p>
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <div className="rounded-[22px] border border-white/[0.05] bg-black/10 px-4 py-3">
          <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/28">
            Directions
          </div>
          <div className="text-sm text-white/68">
            {mapped ? 'Coordinates ready' : 'Not available yet'}
          </div>
        </div>
        <div className="rounded-[22px] border border-white/[0.05] bg-black/10 px-4 py-3">
          <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/28">
            Printer
          </div>
          <div className="text-sm text-white/68">
            {kiosk.printer_status_detail || kiosk.printer_status || (online ? 'Ready' : 'Unavailable')}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (online) onPrint();
          }}
          disabled={!online}
          className={`flex h-10 w-full items-center justify-center gap-2 rounded-full px-4 text-[15px] font-medium transition ${
            online
              ? 'bg-white text-black hover:bg-neutral-200'
              : 'cursor-not-allowed bg-white/[0.05] text-white/22'
          }`}
        >
          <Printer className="h-4 w-4" />
          Print here
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (mapped) onRoute();
          }}
          disabled={!mapped}
          className={`flex h-10 w-full items-center justify-center gap-2 rounded-full border px-4 text-[15px] font-medium transition ${
            mapped
              ? 'border-white/[0.08] bg-transparent text-white/70 hover:border-white/[0.14] hover:text-white'
              : 'cursor-not-allowed border-white/[0.04] text-white/22'
          }`}
        >
          <ExternalLink className="h-4 w-4" />
          Directions
        </button>
      </div>
    </div>
  );
}
