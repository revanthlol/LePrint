// src/components/HowItWorks.jsx
import { useEffect } from "react";
import Footer from "./Footer";
import PublicNavbar from "./PublicNavbar";

const BRAND = "LePrint";

const steps = [
  { num: "01", title: "Scan QR Code", desc: "Scan the QR code at a LePrint kiosk using your phone." },
  { num: "02", title: "Log In or Continue as Guest", desc: "Sign in with Google for full features, or continue as a guest for quick printing." },
  { num: "03", title: "Upload Document", desc: "Upload your file (PDF, Word, image, etc.) directly from your phone." },
  { num: "04", title: "Select Print Settings", desc: "Choose paper size, colour mode, number of copies, and other preferences." },
  { num: "05", title: "Review Final Cost", desc: "The system calculates and displays the exact total before you pay — no surprises." },
  { num: "06", title: "Complete Payment", desc: "Pay securely online through PayU. No card details are ever stored by LePrint." },
  { num: "07", title: "Kiosk Receives Job", desc: "The kiosk receives your encrypted print job immediately after payment confirmation." },
  { num: "08", title: "Collect Your Printout", desc: "Pick up your printed document directly from the kiosk — usually ready in seconds." },
  { num: "09", title: "File Auto-Deleted", desc: "Your uploaded file is automatically and permanently deleted from our servers after processing." },
];

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

export default function HowItWorks() {
  useEffect(() => {
    document.title = "How It Works — LePrint";
    window.scrollTo(0, 0);
    return () => { document.title = "LePrint"; };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <PublicNavbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 pt-32 pb-20">
        <div className="mb-12">
          <span className="block text-[10px] md:text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold mb-4">GUIDE</span>
          <h1 className="text-4xl md:text-6xl font-light tracking-tight text-foreground mb-4">
            How <span className="font-bold">LePrint Works</span>
          </h1>
          <p className="text-base text-muted-foreground/70 max-w-xl">
            From QR scan to printed document in under a minute — no app install, no USB, no hassle.
          </p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.05] rounded-[2.5rem] shadow-2xl shadow-black/50 p-8 md:p-16">
          <Section title="Complete Payment Flow">
            <ol className="space-y-8">
              {steps.map((step) => (
                <li key={step.num} className="flex gap-6">
                  <span className="shrink-0 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white tracking-widest">
                    {step.num}
                  </span>
                  <div className="pt-2">
                    <p className="font-bold text-white text-sm mb-1">{step.title}</p>
                    <p className="text-muted-foreground/80 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="About LePrint">
            <p>
              {BRAND} is a cloud-based self-service kiosk platform that enables users to print,
              scan, and photocopy documents directly from their mobile devices.
            </p>
            <p>
              Users scan a QR code at a {BRAND} kiosk, upload documents through the website,
              select print settings, complete payment online, and collect printed output instantly
              at the kiosk.
            </p>
            <p>
              The platform supports both guest access and Google sign-in. Payments are collected
              digitally before print execution. No physical goods are shipped through courier services.
            </p>
            <p>
              Uploaded files are stored temporarily only for processing and are automatically
              deleted after successful kiosk retrieval or expiry. {BRAND} operates as a digital
              document fulfillment platform and does not provide downloadable digital products or
              subscription services.
            </p>
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
