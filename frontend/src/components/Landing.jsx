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
    window.scrollTo(0, 0);
    return () => {
      document.title = "LePrint";
    };
  }, []);

  // Smooth scroll for anchor links
  useEffect(() => {
    const handleClick = (e) => {
      const href = e.target.closest("a")?.getAttribute("href");
      if (href?.startsWith("#")) {
        e.preventDefault();
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
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
