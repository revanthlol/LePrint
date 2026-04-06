// src/components/PublicNavbar.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { ArrowLeft, Printer, Menu, X, HelpCircle, Mail, Info, Home, Map as MapIcon } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Home",    href: "/",       icon: Home },
  { label: "Map",     href: "/map",    icon: MapIcon },
  { label: "About",   href: "/about",  icon: Info },
  { label: "FAQ",     href: "/faq",    icon: HelpCircle },
  { label: "Contact", href: "/contact",icon: Mail },
];

/**
 * PublicNavbar
 * @param {boolean} minimal  — when true, renders inline (not fixed) at full width
 *                             Use this on pages with their own scroll-less layout like /map
 */
export default function PublicNavbar({ minimal = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(undefined);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // On /map the map is always full-screen behind the navbar — always show dark
  const isMapPage = location.pathname === '/map';

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    setIsScrolled(false);
    if (minimal || isMapPage) return;
    const handler = () => setIsScrolled(window.scrollY > 20);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [minimal, isMapPage, location.pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // ── Minimal (inline) variant ──────────────────────────────────────────────
  if (minimal) {
    return (
      <nav className="w-full flex items-center justify-between px-6 h-14 bg-black/40 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 group transition-all duration-500 hover:border-white/[0.15]">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group/logo transition-transform hover:scale-[1.02]">
          <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center text-white/80 group-hover/logo:bg-white/[0.1] border border-white/[0.08] transition-all duration-300 shadow-inner">
            <Printer className="w-4 h-4" />
          </div>
          <span className="text-sm font-black tracking-tighter text-white/90 group-hover/logo:text-white transition-colors">
            LePrint
          </span>
        </Link>

        {/* Desktop links - Center Pill */}
        <div className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.05]">
          {navLinks.slice(0, 2).map(link => {
            const active = location.pathname === link.href;
            return (
              <Link
                key={link.label}
                to={link.href}
                className={`relative px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-200 ${
                  active ? "text-white" : "text-white/30 hover:text-white/60"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="navbar-mini-pill"
                    className="absolute inset-0 bg-white/[0.05] rounded-lg border border-white/[0.08] shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {user !== undefined && (
            <Link
              to={user ? "/app" : "/login"}
              className={`hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-xl transition-all duration-300 ${
                user
                  ? "bg-white text-black hover:bg-neutral-200 shadow-[0_4px_12px_rgba(255,255,255,0.1)] hover:scale-[1.02]"
                  : "bg-white/[0.05] border border-white/[0.08] text-white/70 hover:bg-white/[0.1] hover:text-white"
              }`}
            >
              {user ? "Dashboard" : "Sign In"}
            </Link>
          )}
          {/* mobile back gesture */}
          <button
            onClick={() => navigate(-1)}
            className="md:hidden p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </nav>
    );
  }

  // ── Standard (fixed floating) variant ─────────────────────────────────────
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[1500] flex justify-center p-3 pointer-events-none">
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", damping: 20 }}
          className={`
            pointer-events-auto relative flex items-center justify-between w-full max-w-5xl px-4 py-2 
            rounded-2xl transition-all duration-500
            ${isScrolled
              ? "bg-[#0a0a0a]/85 backdrop-blur-xl border border-white/[0.1] shadow-2xl shadow-black/40"
              : isMapPage
                ? "bg-black/30 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/20"
                : "bg-transparent border border-transparent"}
          `}
        >
          {/* Left: back + logo */}
          <div className="flex items-center gap-4">
            {location.pathname !== "/" && (
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.08] transition-all duration-200"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-white/90 group-hover:scale-110 group-hover:bg-white/[0.08] border border-white/[0.08] transition-all duration-200">
                <Printer className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold tracking-tight text-white group-hover:text-white/100 transition-colors">
                LePrint
              </span>
            </Link>
          </div>

          {/* Center: Desktop Links */}
          <div className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06] relative">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`
                    relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 z-10
                    ${isActive ? "text-white" : "text-white/50 hover:text-white/90"}
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active-pill"
                      className="absolute inset-0 bg-white/10 rounded-lg border border-white/[0.08]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right: Auth / Action */}
          <div className="flex items-center gap-2">
            {user !== undefined && (
              <Link
                to={user ? "/app" : "/login"}
                className={`
                  hidden sm:flex text-xs font-semibold px-5 py-2 rounded-xl transition-all duration-200
                  ${user
                    ? "bg-white text-black hover:bg-white/90 shadow-lg shadow-white/5"
                    : "border border-white/20 text-white/90 hover:bg-white/10 hover:border-white/30 backdrop-blur-md"}
                `}
              >
                {user ? "Back to App" : "Sign In"}
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden rounded-xl border border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/10 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </motion.nav>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop Layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xl md:hidden"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed inset-x-4 top-24 z-40 bg-black/40 backdrop-blur-3xl [backdrop-filter:blur(24px)_saturate(140%)_contrast(110%)] border border-white/[0.08] rounded-3xl p-6 shadow-2xl shadow-black/50 md:hidden overflow-hidden"
            >
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    to={link.href}
                    className={`
                      flex items-center gap-4 p-3 rounded-2xl transition-colors group
                      ${isActive
                        ? "bg-white/[0.08] border border-white/[0.1] text-white"
                        : "hover:bg-white/[0.04] text-white/70 hover:text-white"}
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                      ${isActive
                        ? "bg-white/10 text-white border border-white/[0.1]"
                        : "bg-white/[0.05] text-white/40 group-hover:text-white/70 border border-white/[0.06]"}
                    `}>
                      <link.icon className="w-5 h-5" />
                    </div>
                    <span className="text-base font-medium">
                      {link.label}
                    </span>
                  </Link>
                );
              })}

              <div className="pt-4 border-t border-white/[0.06] mt-2">
                {user !== undefined && (
                  <Link
                    to={user ? "/app" : "/login"}
                    className={`
                      flex items-center justify-center w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200
                      ${user
                        ? "bg-white text-black hover:bg-white/90 shadow-lg shadow-white/5"
                        : "border border-white/20 text-white/90 hover:bg-white/10 hover:border-white/30 backdrop-blur-md"}
                    `}
                  >
                    {user ? "Back to App" : "Sign In"}
                  </Link>
                )}
              </div>

              {/* Bottom Glow Overlay */}
              <div className="absolute inset-0 rounded-3xl pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/40" />
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
