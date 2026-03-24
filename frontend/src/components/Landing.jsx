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
import UseCases from "./landing/UseCases";
import Testimonials from "./landing/Testimonials";
import Locations from "./landing/Locations";
import WhyLePrint from "./landing/WhyLePrint";
import CtaBanner from "./landing/CtaBanner";
import FadeInSection from "./landing/FadeInSection";

/* ── Mid-page CTA (inline, small) ── */
function MidCta() {
  const { currentUser } = useAuth();
  return (
    <section className="py-14 md:py-20">
      <FadeInSection className="max-w-xl mx-auto px-6 text-center">
        <p className="text-muted-foreground text-sm mb-4">
          Got a file ready?
        </p>
        <Link
          to={currentUser ? '/app' : '/login'}
          className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground font-semibold text-sm rounded-xl hover:bg-card transition-colors"
        >
          Upload Your File
          <ArrowRight className="w-4 h-4" />
        </Link>
      </FadeInSection>
    </section>
  );
}

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
        <MidCta />
        <UseCases />
        <Testimonials />
        <Locations />
        <WhyLePrint />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
