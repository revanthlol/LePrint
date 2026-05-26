// src/components/ShippingPolicy.jsx
import { useEffect } from "react";
import Footer from "./Footer";
import PublicNavbar from "./PublicNavbar";

const BRAND = "LePrint";
const SUPPORT_EMAIL = "support@leprint.in";
const LAST_UPDATED = "May 26, 2026";

function Section({ title, children }) {
  return (
    <section className="mb-12 last:mb-0">
      <h2 className="text-xl font-bold text-foreground mb-6 pb-4 border-b border-white/[0.05]">
        {title}
      </h2>
      <div className="text-muted-foreground/90 text-sm md:text-base leading-8 space-y-6">
        {children}
      </div>
    </section>
  );
}

export default function ShippingPolicy() {
  useEffect(() => {
    document.title = "Shipping & Delivery Policy — LePrint";
    window.scrollTo(0, 0);
    return () => { document.title = "LePrint"; };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <PublicNavbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 pt-32 pb-20">
        <div className="mb-12">
          <span className="block text-[10px] md:text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold mb-4">LEGAL</span>
          <h1 className="text-4xl md:text-6xl font-light tracking-tight text-foreground mb-4">
            Shipping &amp; <span className="font-bold">Delivery Policy</span>
          </h1>
          <p className="text-sm text-muted-foreground/40 font-medium">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.05] rounded-[2.5rem] shadow-2xl shadow-black/50 p-8 md:p-16">
          <Section title="1. Overview">
            <p>
              {BRAND} is a cloud-based digital print service and does not ship physical products
              via courier or postal services.
            </p>
            <p>
              All print, scan, and photocopy services are fulfilled directly at self-service{" "}
              {BRAND} kiosks selected by the user during the checkout process.
            </p>
          </Section>

          <Section title="2. Service Delivery">
            <p>After successful payment:</p>
            <ul className="space-y-4 mt-6">
              {[
                "The uploaded document is securely transmitted to the selected kiosk",
                "The print or scan job becomes available immediately or within a few seconds",
                "Users can collect printed documents directly from the kiosk location",
              ].map((item, i) => (
                <li key={i} className="flex gap-4">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-white/20 mt-3" />
                  <span className="text-muted-foreground/80">{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="3. No Physical Shipping">
            <p>Since {BRAND} operates through on-site kiosk fulfillment:</p>
            <ul className="space-y-4 mt-6">
              {[
                "No courier delivery is involved",
                "No shipping charges are applied",
                "No tracking IDs or shipment partners are used",
              ].map((item, i) => (
                <li key={i} className="flex gap-4">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-white/20 mt-3" />
                  <span className="text-muted-foreground/80">{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="4. Delivery Failures">
            <p>
              If a kiosk is offline, unavailable, or unable to complete the job after payment:
            </p>
            <ul className="space-y-4 mt-6">
              {[
                "The job may be retried automatically",
                "Users may contact support for assistance",
                "Eligible cases are covered under our Refund & Cancellation Policy",
              ].map((item, i) => (
                <li key={i} className="flex gap-4">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-white/20 mt-3" />
                  <span className="text-muted-foreground/80">{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="5. Contact">
            <div className="mt-2 p-8 bg-white/[0.04] border border-white/[0.05] rounded-2xl shadow-inner">
              <p className="font-bold text-white text-lg mb-2">{BRAND} Support</p>
              <p className="mb-4">
                Email:{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-blue-400/80 underline decoration-white/20 underline-offset-4 hover:text-white transition-colors"
                >
                  {SUPPORT_EMAIL}
                </a>
              </p>
              <p className="text-xs text-muted-foreground/60 leading-relaxed uppercase tracking-widest font-bold">
                Response time: within 2 business days
              </p>
            </div>
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
