// src/components/About.jsx
import { Printer, Heart, Zap, Shield } from "lucide-react";
import { motion } from "framer-motion";
import PublicNavbar from "./PublicNavbar";
import Footer from "./Footer";

const features = [
  {
    icon: Zap,
    title: "Instant Printing",
    desc: "Scan a QR code and print in seconds. No apps, no drivers, no fuss.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    desc: "Your documents are encrypted and auto-deleted after printing. We value your privacy.",
  },
  {
    icon: Heart,
    title: "Built for India",
    desc: "A homegrown solution for libraries, universities, and coworking spaces.",
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-foreground flex flex-col font-sans selection:bg-white/10">
      <PublicNavbar />
      
      <main className="flex-grow pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 text-white/90 mb-6 border border-white/10 shadow-2xl shadow-white/5">
              <Printer className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Making Printing <span className="text-white font-serif italic">Effortless</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              LePrint started with a simple question: Why is printing still so hard? 
              We're on a mission to bring cloud-based, self-service printing to every corner of India.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-foreground mb-4">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="prose prose-invert max-w-none text-muted-foreground leading-relaxed space-y-6"
          >
            <h2 className="text-2xl font-bold text-foreground">Our Story</h2>
            <p>
              Founded in 2024, LePrint was born out of the frustration of finding a working printer in a library. 
              We realized that the hardware exists, but the software was stuck in the 90s. 
              By bridging the gap between mobile devices and physical printers, we created a system 
              that is as easy to use as scanning a UPI QR code.
            </p>
            <p>
              Today, our kiosks are being deployed in coworking spaces and educational hubs, 
              providing millions with access to high-quality, affordable printing without the need 
              for personal hardware or complex setup.
            </p>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
