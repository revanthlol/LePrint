// src/components/PublicNavbar.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

export default function PublicNavbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(undefined); // undefined = loading, null = signed out
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Firebase auth listener (works outside AuthProvider context too)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsub();
  }, []);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;

      if (currentY < 50) {
        // Always show near top
        setVisible(true);
      } else if (currentY > lastScrollY.current + 10) {
        // Scrolling down past threshold
        setVisible(false);
      } else if (currentY < lastScrollY.current - 10) {
        // Scrolling up past threshold
        setVisible(true);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-[#0a0a0a]/90 backdrop-blur-md transition-transform duration-300 ease-in-out ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Left: back + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 -ml-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <Link
            to="/"
            className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
          >
            <Printer className="w-4 h-4" />
            <span className="text-sm font-semibold">LePrint</span>
          </Link>
        </div>

        {/* Right: auth-conditional button */}
        {user !== undefined && (
          <Link
            to={user ? "/app" : "/login"}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {user ? "Back to App" : "Login"}
          </Link>
        )}
      </div>
    </nav>
  );
}
