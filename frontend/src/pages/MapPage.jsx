import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ExternalLink,
  MapPinned,
  Navigation,
  Printer,
  RefreshCcw,
  Rows3,
  Wifi,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
import { KioskMap } from '@/components/Map/KioskMap';
import { KioskSidebar } from '@/components/Map/KioskSidebar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

function hasCoordinates(kiosk) {
  return kiosk?.latitude !== null && kiosk?.latitude !== undefined
    && kiosk?.longitude !== null && kiosk?.longitude !== undefined;
}

function ViewModeToggle({ mode, onChange, isFloating = false }) {
  return (
    <div className={`flex items-center rounded-full border border-white/[0.08] bg-black/40 p-1 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
      isFloating ? 'fixed bottom-8 left-1/2 z-[1000] -translate-x-1/2' : ''
    }`}>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
          mode === 'list'
            ? 'bg-white text-black shadow-lg'
            : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.05]'
        }`}
      >
        <Rows3 className="h-3.5 w-3.5" />
        List
      </button>
      <button
        type="button"
        onClick={() => onChange('map')}
        className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
          mode === 'map'
            ? 'bg-white text-black shadow-lg'
            : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.05]'
        }`}
      >
        <MapPinned className="h-3.5 w-3.5" />
        Map
      </button>
    </div>
  );
}

function MapShell({
  kiosks,
  selectedKiosk,
  loading,
  refreshing,
  mobileView,
  onMobileViewChange,
  onRefresh,
  onSelectKiosk,
  onClearSelection,
  onPrint,
  onRoute,
  isDesktop,
  inApp,
}) {
  return (
    <section className={`relative flex flex-col overflow-hidden rounded-[2.5rem] md:rounded-[3.5rem] border border-white/10 bg-[#0a0a0a] text-foreground shadow-[0_32px_120px_rgba(0,0,0,0.6)] ${
      inApp ? 'min-h-[calc(100vh-12rem)]' : 'mx-auto max-w-7xl min-h-[calc(100vh-10rem)]'
    }`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.03),transparent_40%)] pointer-events-none" />
      
      <div className="relative flex min-h-full flex-1 flex-col">
        <header className="px-6 py-4 md:py-5 border-b border-white/[0.08] bg-white/[0.01]">
          <div className="flex items-center justify-between gap-6">
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white/50">
                  <MapPinned className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-lg md:text-2xl font-light tracking-tight leading-tight">
                    Find <span className="hidden sm:inline">your </span><span className="font-bold italic font-serif">Kiosk</span>
                  </h1>
                </div>
              </div>
            </motion.div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="flex items-center justify-center h-9 w-9 md:h-8 md:w-8 rounded-full md:rounded-lg border border-white/10 bg-white/[0.03] text-muted-foreground transition hover:text-foreground hover:bg-white/[0.06] active:scale-90 disabled:opacity-50"
                title="Refresh status"
              >
                <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <div className="hidden lg:block">
                <ViewModeToggle mode={mobileView} onChange={onMobileViewChange} />
              </div>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside className={`min-h-0 flex-1 shrink-0 bg-black/10 transition-all duration-300 ${
            mobileView === 'list' 
              ? 'w-full block' 
              : 'hidden lg:block lg:w-[40%] border-r border-white/[0.06]'
          }`}>
            <KioskSidebar
              kiosks={kiosks}
              selectedKiosk={selectedKiosk}
              onSelectKiosk={(kiosk) => onSelectKiosk(kiosk, false)}
              loading={loading}
              fullWidth={mobileView === 'list'}
            />
          </aside>

          <div className={`min-h-0 flex-1 flex-col ${mobileView === 'map' ? 'flex' : 'hidden'}`}>
            <div className="relative min-h-[420px] flex-1 lg:min-h-0">
              <KioskMap
                kiosks={kiosks}
                selectedKiosk={selectedKiosk}
                onSelectKiosk={(kiosk) => onSelectKiosk(kiosk, false)}
                isVisible={isDesktop || mobileView === 'map'}
              />
            </div>
          </div>
        </div>

        {!isDesktop && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: 'spring', damping: 20 }}
          >
            <ViewModeToggle 
              mode={mobileView} 
              onChange={onMobileViewChange} 
              isFloating={true} 
            />
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default function MapPage({ inApp = false }) {
  const navigate = useNavigate();
  const [kiosks, setKiosks] = useState([]);
  const [selectedKiosk, setSelectedKiosk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileView, setMobileView] = useState('list');
  const [isDesktop, setIsDesktop] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  ));

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleViewportChange = (event) => setIsDesktop(event.matches);

    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleViewportChange);

    return () => mediaQuery.removeEventListener('change', handleViewportChange);
  }, []);

  const onSelectKiosk = (kiosk, shouldShowPopup = true) => {
    setSelectedKiosk({ ...kiosk, _showPopup: shouldShowPopup });
  };

  const onClearSelection = () => {
    setSelectedKiosk(null);
  };

  const fetchKiosks = async (showFeedback = false) => {
    setRefreshing(true);

    try {
      const { data } = await axios.get(`${API_URL}/api/kiosks/public`);
      const nextKiosks = data.kiosks || [];

      setKiosks(nextKiosks);
      setSelectedKiosk((currentSelection) => {
        if (!nextKiosks.length) return null;

        if (currentSelection) {
          const refreshedSelection = nextKiosks.find((kiosk) => kiosk.id === currentSelection.id);
          if (refreshedSelection) {
            return { ...refreshedSelection, _showPopup: currentSelection._showPopup };
          }
        }

        return nextKiosks.find(hasCoordinates)
          || nextKiosks.find((kiosk) => kiosk.is_online)
          || nextKiosks[0];
      });

      if (showFeedback) toast.success('Locations refreshed');
    } catch {
      if (showFeedback) toast.error('Could not refresh locations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchKiosks();
    const intervalId = setInterval(() => fetchKiosks(), 120_000);
    return () => clearInterval(intervalId);
  }, []);

  const selectedHasCoords = hasCoordinates(selectedKiosk);

  const shell = (
    <MapShell
      kiosks={kiosks}
      selectedKiosk={selectedKiosk}
      loading={loading}
      refreshing={refreshing}
      mobileView={mobileView}
      onMobileViewChange={setMobileView}
      onRefresh={() => fetchKiosks(true)}
      onSelectKiosk={setSelectedKiosk}
      onClearSelection={() => setSelectedKiosk(null)}
      onPrint={() => {
        if (selectedKiosk?.is_online) {
          navigate(`/app?kiosk_id=${selectedKiosk.id}`);
        }
      }}
      onRoute={() => {
        if (selectedHasCoords) {
          window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${selectedKiosk.latitude},${selectedKiosk.longitude}`,
            '_blank',
            'noopener,noreferrer',
          );
        }
      }}
      isDesktop={isDesktop}
      inApp={inApp}
    />
  );

  if (inApp) {
    return (
      <div className="w-full">
        {shell}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-foreground flex flex-col font-sans selection:bg-white/10 scroll-smooth">
      <PublicNavbar />
      <div className="flex-grow px-6 pt-32 pb-20">
        {shell}
      </div>
      <Footer />
    </div>
  );
}
