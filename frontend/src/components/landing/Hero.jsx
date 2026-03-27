// src/components/landing/Hero.jsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, QrCode, Upload, Printer } from "lucide-react";
import { useAuth } from "../AuthProvider";

export default function Hero() {
  const { currentUser } = useAuth();
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
              to={currentUser ? '/app' : '/login'}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-foreground text-background font-semibold text-sm rounded-xl hover:bg-foreground/90 transition-colors"
            >
              Start Printing
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

        {/* Right — mock phone UI */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="md:col-span-5 relative"
        >
          <div className="max-w-[280px] mx-auto md:max-w-none">
            {/* Phone frame */}
            <div className="bg-card/80 border border-border rounded-3xl p-5 md:p-6 backdrop-blur-md shadow-2xl">
              {/* Status bar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-white/40" />
                  <span className="text-[10px] text-muted-foreground/60 font-medium">LePrint</span>
                </div>
                <span className="text-[10px] text-muted-foreground/40">Ready</span>
              </div>

              {/* Steps inside phone */}
              <div className="space-y-4">
                {[
                  { icon: QrCode, label: "Scan QR at kiosk", color: "bg-white text-black" },
                  { icon: Upload, label: "Upload your file", color: "bg-white/5 text-white/70" },
                  { icon: Printer, label: "Collect print", color: "bg-white/10 text-white" },
                ].map((step, i) => (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.15, duration: 0.4 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${step.color}`}>
                      <step.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{step.label}</p>
                      <div className="mt-1.5 h-1 rounded-full bg-border overflow-hidden">
                        <motion.div
                          className="h-full bg-foreground/40 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ delay: 0.6 + i * 0.15, duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Price strip */}
              <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Starting at</span>
                <span className="text-sm font-bold text-foreground">₹3 / page</span>
              </div>
            </div>
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
