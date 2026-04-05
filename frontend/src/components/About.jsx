// src/components/About.jsx
import { Printer, Heart, Zap, Shield } from "lucide-react";
import { motion } from "framer-motion";
import PublicNavbar from "./PublicNavbar";
import Footer from "./Footer";

const features = [
  {
    icon: Zap,
    title: "Instant Printing",
    desc: "Scan a QR code and print in seconds. No apps, no drivers, no fuss. The fastest way to get your thoughts on paper.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    desc: "Your documents are encrypted and auto-deleted after printing. We value your privacy as much as you do.",
  },
  {
    icon: Heart,
    title: "Built for India",
    desc: "A homegrown solution tailored for libraries, colleges, and shared working spaces across the country.",
  },
];

const stats = [
  { number: "50+", label: "Kiosks Deployed" },
  { number: "1M+", label: "Pages Printed" },
  { number: "10+", label: "Cities" }
];

export default function About() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-foreground flex flex-col font-sans selection:bg-white/10 scroll-smooth">
      <PublicNavbar />
      
      <main className="flex-grow pt-32 md:pt-48 pb-32 px-6">
        <div className="max-w-5xl mx-auto">
          {/* ── Hero Section ── */}
          <section className="text-center mb-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="block text-[10px] md:text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold mb-8">
                ABOUT LEPRINT
              </span>
              
              <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-[2rem] bg-gradient-to-br from-white/10 to-transparent text-white mb-10 border border-white/10 shadow-2xl shadow-white/5">
                <Printer className="w-10 h-10 md:w-12 md:h-12" />
              </div>
              
              <h1 className="text-5xl md:text-7xl font-light tracking-tight leading-[1.1] mb-10">
                Making Printing <br />
                <span className="font-bold italic font-serif">Effortless</span>
              </h1>
              
              <div className="max-w-2xl mx-auto space-y-6">
                <p className="text-xl md:text-2xl text-foreground font-medium leading-relaxed">
                  LePrint started with a simple question: why is printing still so hard?
                </p>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  We're on a mission to bring cloud-based, self-service printing to every corner of India, 
                  reimagining hardware for a mobile-first generation.
                </p>
              </div>
            </motion.div>
          </section>

          {/* ── Stats Row ── */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-3 gap-8 py-16 border-y border-white/10 mb-32"
          >
            {stats.map((stat, i) => (
              <motion.div 
                key={stat.label} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-5xl font-bold text-foreground mb-2">{stat.number}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-[0.2em] font-bold">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* ── Feature Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.05] transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-500">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight mb-3 text-foreground">{f.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* ── Story Section ── */}
          <section className="max-w-3xl mx-auto space-y-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="block text-[10px] md:text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold mb-6 text-center md:text-left">
                THE JOURNEY
              </span>
              <h2 className="text-3xl md:text-5xl font-light tracking-tight text-center md:text-left mb-10">
                Our <span className="font-bold">Story</span>
              </h2>
              
              <div className="prose prose-invert max-w-none text-muted-foreground space-y-8">
                <p className="text-lg md:text-xl leading-relaxed">
                  LePrint was born out of the frustration of finding a working printer in a library. 
                  We realized that the hardware exists, but the software was stuck in the 90s.
                </p>

                <blockquote className="my-12 pl-8 border-l-2 border-white/20">
                  <p className="text-xl md:text-3xl font-serif italic text-foreground/90 leading-tight">
                    "By bridging the gap between mobile devices and physical printers, we created a system that is as easy to use as scanning a UPI QR code."
                  </p>
                </blockquote>

                <p className="text-lg leading-relaxed">
                  Today, our kiosks are being deployed in coworking spaces and educational hubs, 
                  providing <span className="text-foreground font-semibold">millions</span> with access to high-quality, affordable printing 
                  without the need for personal hardware or complex setup.
                </p>
              </div>
            </motion.div>
          </section>

          {/* ── Bottom CTA ── */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mt-40 p-12 md:p-20 rounded-[3rem] bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 text-center"
          >
            <h2 className="text-3xl md:text-5xl font-light mb-8 leading-tight">
              Ready to <br className="md:hidden" />
              <span className="font-bold">Print Smarter?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-12 max-w-md mx-auto leading-relaxed">
              Experience the future of self-service printing. Find a kiosk near you or partner with us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/login" 
                className="inline-flex items-center justify-center px-10 py-4 rounded-full bg-white text-black font-semibold hover:bg-neutral-200 transition-all hover:scale-105 active:scale-95"
              >
                Try Out!
              </a>
              <a 
                href="/contact" 
                className="inline-flex items-center justify-center px-10 py-4 rounded-full border border-white/20 text-white font-semibold hover:bg-white/5 transition-all hover:scale-105 active:scale-95"
              >
                Partner With Us
              </a>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
