// src/components/landing/CtaBanner.jsx
import { Link } from "react-router-dom";
import { ArrowRight, Printer } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../AuthProvider";

export default function CtaBanner() {
  const { currentUser } = useAuth();
  
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/10 mb-8">
            <Printer className="w-7 h-7 text-foreground" />
          </div>

          {/* Headline */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-foreground mb-4">
            Ready to <span className="font-bold">print?</span>
          </h2>

          {/* Subhead */}
          <p className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto mb-10">
            No downloads, no drivers, no signup required. Just your phone and a kiosk.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              to={currentUser ? '/app' : '/login'}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-foreground text-background font-semibold text-sm rounded-xl hover:bg-foreground/90 transition-colors"
            >
              Start Printing
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-8 py-4 border border-border text-muted-foreground font-semibold text-sm rounded-xl hover:bg-card hover:text-foreground transition-colors"
            >
              Partner With Us
            </Link>
          </div>

          {/* Trust reminder */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground/60">
            <span>No signup required</span>
            <span className="hidden sm:inline">·</span>
            <span>₹3/page</span>
            <span className="hidden sm:inline">·</span>
            <span>Files auto-deleted</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
