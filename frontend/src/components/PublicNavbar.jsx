// src/components/PublicNavbar.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { ArrowLeft, Printer, Menu, X, HelpCircle, Mail, Info, Home } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Home", href: "/", icon: Home },
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
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsub();
  }, []);

  // Handle scroll for floating effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
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
            rounded-2xl transition-all duration-300
            ${isScrolled 
              ? "bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50" 
              : "bg-transparent border border-transparent"}
          `}
        >
          {/* Left: back + logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <Link
              to="/"
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/90 group-hover:scale-110 group-hover:bg-white/10 border border-white/10 transition-all">
                <Printer className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold tracking-tight text-foreground/90 group-hover:text-foreground">
                LePrint
              </span>
            </Link>
          </div>

          {/* Center: Desktop Links */}
          <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`
                    px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                    ${isActive 
                      ? "bg-white/10 text-white shadow-sm shadow-black/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"}
                  `}
                >
                  {link.label}
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
                  hidden sm:flex text-xs font-semibold px-4 py-2 rounded-xl
                  ${user
                    ? "bg-white text-black hover:bg-neutral-200"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"}
                  transition-all duration-200 shadow-lg shadow-black/10
                `}
              >
                {user ? "Dashboard" : "Sign In / Sign Up"}
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
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
            className="fixed inset-x-4 top-20 z-40 bg-[#1a1a1a]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl md:hidden"
          >
            <div className="space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-foreground">
                    <link.icon className="w-5 h-5" />
                  </div>
                  <span className="text-base font-medium text-foreground">{link.label}</span>
                </Link>
              ))}
              <div className="pt-4 border-t border-white/5">
                {user !== undefined && (
                  <Link
                    to={user ? "/app" : "/login"}
                    className="flex items-center justify-center w-full py-4 rounded-2xl bg-white text-black font-bold"
                  >
                    {user ? "Back to App" : "Sign In / Sign Up"}
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
