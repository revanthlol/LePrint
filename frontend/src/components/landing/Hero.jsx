// src/components/landing/Hero.jsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Zap, IndianRupee } from "lucide-react";
import { useAuth } from "../AuthProvider";

export default function Hero() {
  const { currentUser } = useAuth();
  
  return (
    <section className="max-w-6xl mx-auto px-6 pt-32 pb-20 md:pt-48 md:pb-28">
      <div className="flex flex-col items-center md:items-start text-center md:text-left">
        {/* Eyebrow */}
        <motion.span
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="block text-[10px] md:text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold mb-6"
        >
          SELF-SERVICE CLOUD PRINTING
        </motion.span>

        {/* H1 Headline */}
        <motion.h1
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-5xl sm:text-7xl md:text-8xl lg:text-[7rem] font-bold tracking-tight text-foreground leading-[1] mb-8"
        >
          Scan. Pay. Print. <br />
          <span className="font-light text-muted-foreground">Done.</span>
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed mb-10"
        >
          A premium, IoT-powered self-service print kiosk system. 
          No signup, no apps, no hassle — just scan and print in 60 seconds.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <Link
            to={currentUser ? '/app' : '/login'}
            className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-black font-bold text-base rounded-2xl hover:bg-neutral-200 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/5"
          >
            Start Printing
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center px-10 py-4 border border-white/10 text-white font-bold text-base rounded-2xl hover:bg-white/5 transition-all hover:scale-105 active:scale-95"
          >
            How it works
          </a>
        </motion.div>

        {/* Trust Strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-wrap items-center justify-center md:justify-start gap-x-8 gap-y-4 pt-12 text-sm text-muted-foreground font-medium"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-white/40" />
            No signup required
          </span>
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-white/40" />
            60-second prints
          </span>
          <span className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-white/40" />
            Starting ₹3/page
          </span>
        </motion.div>
      </div>
    </section>
  );
}
