// src/components/Landing.jsx
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  Printer,
  QrCode,
  Upload,
  CreditCard,
  FileText,
  ScanLine,
  Copy,
  ArrowRight,
} from "lucide-react";
import PublicNavbar from "./PublicNavbar";
import Footer from "./Footer";
import FeatureCards from "./FeatureCards";

/* ── animation helpers ── */
function FadeInSection({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   Section 1 — Hero
   ════════════════════════════════════════════════════════════ */
function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-6 pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
        {/* Left copy */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="md:col-span-7 space-y-6"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.05]">
            Print anything, from anywhere.
            <br />
            <span className="text-muted-foreground">Scan. Pay. Print. Done.</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed">
            Self-service cloud printing — scan a QR code, upload your file,
            pay online, and pick up your prints. No queues, no hassle.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-foreground text-background font-semibold text-sm rounded-xl hover:bg-foreground/90 transition-colors"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center px-7 py-3.5 border border-border text-muted-foreground font-semibold text-sm rounded-xl hover:bg-card hover:text-foreground transition-colors"
            >
              Learn More
            </a>
          </div>
        </motion.div>

        {/* Right — visual */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="md:col-span-5 relative"
        >
          <div className="aspect-square max-w-xs mx-auto md:max-w-none flex items-center justify-center bg-card/60 border border-border rounded-3xl backdrop-blur-md">
            <Printer className="w-24 h-24 md:w-32 md:h-32 text-foreground/20" />
          </div>

          {/* Floating spec chip */}
          <div className="absolute -bottom-4 -left-2 md:-left-6 bg-card border border-border rounded-xl p-4 shadow-lg hidden sm:block">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-2">
              Specs
            </p>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="font-bold text-foreground">₹3</span>
                <span className="text-muted-foreground/60 ml-1">/ page</span>
              </div>
              <div>
                <span className="font-bold text-foreground">&lt; 60s</span>
                <span className="text-muted-foreground/60 ml-1">print</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   Section 2 — How It Works
   ════════════════════════════════════════════════════════════ */
const steps = [
  {
    icon: QrCode,
    num: "01",
    title: "Scan the QR",
    desc: "Walk up to any LePrint kiosk and scan the QR code with your phone.",
  },
  {
    icon: Upload,
    num: "02",
    title: "Upload & Pay",
    desc: "Choose your file, set preferences, and pay securely online.",
  },
  {
    icon: Printer,
    num: "03",
    title: "Collect Your Print",
    desc: "Your document prints instantly — pick it up and go.",
  },
];

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-card/40 border-y border-border py-20 md:py-28"
    >
      <div className="max-w-6xl mx-auto px-6">
        <FadeInSection>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-2">
            How It Works
          </h2>
          <div className="w-16 h-1 bg-foreground rounded-full mb-12" />
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step, i) => (
            <FadeInSection key={step.num} delay={i * 0.1}>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center rounded-xl">
                  <step.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {step.num}. {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   Section 3 — Services & Pricing
   ════════════════════════════════════════════════════════════ */
const services = [
  {
    icon: FileText,
    name: "Print",
    price: "₹3 / page",
    desc: "Upload PDFs or images and get laser-quality B&W prints at the kiosk.",
  },
  {
    icon: ScanLine,
    name: "Scan",
    price: "₹10 / document",
    desc: "Scan physical documents and receive a high-res PDF download on your phone.",
  },
  {
    icon: Copy,
    name: "Xerox",
    price: "₹5 / copy",
    desc: "Photocopy documents instantly — scan once, print multiple copies.",
  },
];

function ServicesPricing() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <FadeInSection className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            Services &amp; Pricing
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Transparent pricing with no hidden fees. Pay only for what you use.
          </p>
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <FadeInSection key={s.name} delay={i * 0.1}>
              <div className="bg-card border border-border rounded-2xl p-7 hover:bg-card/80 transition-colors duration-200 h-full flex flex-col">
                <div className="w-11 h-11 bg-foreground text-background flex items-center justify-center rounded-xl mb-5">
                  <s.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  {s.name}
                </h3>
                <span className="inline-block text-xs font-semibold bg-foreground/10 text-foreground px-2.5 py-1 rounded-full mb-4 w-fit">
                  {s.price}
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed mt-auto">
                  {s.desc}
                </p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   Section 4 — Why LePrint (reuses FeatureCards)
   ════════════════════════════════════════════════════════════ */
function WhyLePrint() {
  return (
    <section className="bg-card/40 border-y border-border py-20 md:py-28">
      <div className="max-w-md mx-auto px-6">
        <FadeInSection className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            Why LePrint
          </h2>
          <p className="text-muted-foreground text-sm">
            Built for speed, security, and round-the-clock availability.
          </p>
        </FadeInSection>

        <FadeInSection delay={0.15}>
          <FeatureCards />
        </FadeInSection>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   Section 5 — CTA Banner
   ════════════════════════════════════════════════════════════ */
function CtaBanner() {
  return (
    <section className="py-20 md:py-28">
      <FadeInSection className="max-w-2xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-4">
          Ready to print?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Sign in with Google and start printing in under a minute.
          No downloads, no drivers — just your phone and a kiosk.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-8 py-4 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 transition-colors text-sm"
        >
          Get Started
          <ArrowRight className="w-4 h-4" />
        </Link>
      </FadeInSection>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   Page Root
   ════════════════════════════════════════════════════════════ */
export default function Landing() {
  useEffect(() => {
    document.title = "LePrint — Self-Service Cloud Printing";
    window.scrollTo(0, 0);
    return () => {
      document.title = "LePrint";
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <PublicNavbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <ServicesPricing />
        <WhyLePrint />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
