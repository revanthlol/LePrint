// frontend/src/pages/MapPage.tsx
//
// Layout strategy:
//   Map containers use position:fixed inset:0 — never flex/flow height chains.
//   PublicNavbar floats above at z-[1500]. Map at z-0.
//   KioskBottomSheet integrated Map/List tabs replace floating ViewSwitcher.

import { KioskMap } from '@/components/Map/KioskMap';
import { KioskSidebar } from '@/components/kiosk/KioskSidebar';
import { KioskBottomSheet } from '@/components/kiosk/KioskBottomSheet';
// @ts-ignore
import PublicNavbar from '@/components/PublicNavbar';
// @ts-ignore
import Footer from '@/components/Footer';

interface MapPageProps {
  inApp?: boolean;
}

export default function MapPage({ inApp = false }: MapPageProps) {

  // ── In-App (logged-in, hosted inside DashboardLayout) ────────────────────
  if (inApp) {
    return (
      <div className="fixed inset-0 z-10 overflow-hidden">
        <div className="relative w-full h-full">
          {/* Full-size Map Background */}
          <KioskMap />

          {/* Sidebar Transition Overlay (Gradual Blur) */}
          <div className="
          absolute inset-y-0 left-0 w-1/3 
          bg-gradient-to-r from-black/80 via-black/40 to-transparent 
          backdrop-blur-xl pointer-events-none z-[10]
          transition-all duration-700
        " />

          {/* Desktop: Floating Sidebar */}
          <KioskSidebar inApp />

          {/* Mobile: Bottom Sheet Handles interaction */}
          <div className="lg:hidden">
            <KioskBottomSheet />
          </div>
        </div>
      </div>
    );
  }

  // ── Public / Guest ────────────────────────────────────────────────────────
  return (
    <>
      <PublicNavbar />
      
      <div className="fixed inset-0 z-[1] overflow-hidden bg-zinc-900/10">
        <div className="relative w-full h-full">
          {/* Background Map */}
          <KioskMap />

          {/* Desktop: Floating Sidebar */}
          <KioskSidebar topOffset />

          {/* Mobile: Bottom Sheet */}
          <div className="lg:hidden">
            <KioskBottomSheet />
          </div>
        </div>
      </div>
    </>
  );
}
