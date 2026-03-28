// src/components/Landing.jsx
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "./AuthProvider";
import PublicNavbar from "./PublicNavbar";
import Footer from "./Footer";

import Hero from "./landing/Hero";
import HowItWorks from "./landing/HowItWorks";
import ServicesPricing from "./landing/ServicesPricing";
import TrustSecurity from "./landing/TrustSecurity";
import SocialProof from "./landing/SocialProof";
import Locations from "./landing/Locations";
import CtaBanner from "./landing/CtaBanner";
import FadeInSection from "./landing/FadeInSection";

/* ── Page Root ── */
export default function Landing() {
  useEffect(() => {
    document.title = "LePrint — Self-Service Cloud Printing";
    return () => {
      document.title = "LePrint";
    };
  }, []);

  // Smooth scroll for anchor links
  useEffect(() => {
    const handleClick = (e) => {
      const link = e.target.closest("a");
      const href = link?.getAttribute("href");
      
      if (href && (href.startsWith("#") || (href.startsWith("/") && href.includes("#")))) {
        const hash = href.split("#")[1];
        if (!hash) return;
        
        // If it's an internal link or we're already on the page it points to
        const targetPath = href.split("#")[0];
        if (targetPath === "" || targetPath === "/" || targetPath === window.location.pathname) {
          const el = document.getElementById(hash);
          if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Handle initial scroll if URL has hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const id = hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        // Use a small timeout to ensure everything is rendered
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <PublicNavbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <ServicesPricing />
        <TrustSecurity />
        <SocialProof />
        <Locations />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
