// src/components/PublicNavbar.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { ArrowLeft, Printer, Menu, X, HelpCircle, Mail, Info, Home } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Landing", href: "/", icon: Home },
  { label: "About", href: "/about", icon: Info },
  { label: "FAQ", href: "/faq", icon: HelpCircle },
  { label: "Contact", href: "/contact", icon: Mail },
];

export default function PublicNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(undefined);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Firebase auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => setUser(firebaseUser));
    return () => unsub();
  }, []);

  // Handle scroll for floating effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4">
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", damping: 20 }}
          className={`
            relative flex items-center justify-between w-full max-w-5xl px-4 py-2 
            rounded-2xl transition-all duration-500
            ${isScrolled 
              ? "bg-[#0a0a0a]/90 backdrop-blur-lg border-b border-white/[0.08] shadow-2xl shadow-black/30" 
              : "bg-transparent border border-transparent"}
          `}
        >
          {/* Left: back + logo */}
          <div className="flex items-center gap-4">
            {location.pathname !== "/" && (
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all duration-200"
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
                    ${isActive 
                      ? "text-white" 
                      : "text-muted-foreground hover:text-foreground"}
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
                {user ? "Dashboard" : "Sign In"}
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
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed inset-x-4 top-20 z-40 bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 shadow-2xl shadow-black/40 md:hidden"
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
                        ? "bg-white/[0.06] border border-white/[0.08]" 
                        : "hover:bg-white/[0.04] text-muted-foreground hover:text-foreground"}
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                      ${isActive 
                        ? "bg-white/10 text-white border border-white/[0.08]" 
                        : "bg-white/[0.03] text-muted-foreground group-hover:text-foreground border border-white/[0.06]"}
                    `}>
                      <link.icon className="w-5 h-5" />
                    </div>
                    <span className={`text-base font-medium ${isActive ? "text-white" : ""}`}>
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
                    {user ? "Dashboard" : "Sign In"}
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
