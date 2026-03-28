// src/components/landing/ServicesPricing.jsx
import { FileText, ScanLine, Copy } from "lucide-react";
import { motion } from "framer-motion";
import FadeInSection from "./FadeInSection";

export default function ServicesPricing() {
  return (
    <section id="pricing" className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <FadeInSection className="text-center mb-16 md:mb-20">
          <span className="block text-[10px] md:text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold mb-4">
            SIMPLE PRICING
          </span>
          <h2 className="text-3xl md:text-4xl font-light tracking-tight text-foreground">
            Pay per page. <span className="font-bold text-muted-foreground/60">No subscriptions.</span>
          </h2>
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {/* Featured Service: Print */}
          <FadeInSection className="md:col-span-2 h-full">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-foreground text-background rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden h-full flex flex-col justify-between group"
            >
              {/* Most Popular badge */}
              <div className="absolute top-6 right-6 text-[10px] md:text-xs font-bold uppercase tracking-widest bg-background/20 text-background px-4 py-1.5 rounded-full border border-background/20 backdrop-blur-sm">
                Most Popular
              </div>
              
              <div>
                <div className="w-14 h-14 bg-background text-foreground flex items-center justify-center rounded-2xl mb-8 group-hover:scale-110 transition-transform duration-500">
                  <FileText className="w-7 h-7" />
                </div>
                <h3 className="text-3xl font-bold mb-3">Print</h3>
                <p className="text-background/70 text-base md:text-lg max-w-sm leading-relaxed mb-12">
                  Upload PDFs, Word docs, or images. Get laser-quality black &amp; white prints in under 60 seconds.
                </p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black">₹3</span>
                <span className="text-lg font-medium text-background/50">per page</span>
              </div>
            </motion.div>
          </FadeInSection>

          {/* Secondary Services Stack */}
          <div className="flex flex-col gap-4 lg:gap-6">
            <FadeInSection delay={0.1} className="h-full">
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-card border border-white/10 rounded-[2rem] p-8 h-full flex flex-col group"
              >
                <div className="w-12 h-12 bg-white/5 border border-white/10 text-white flex items-center justify-center rounded-xl mb-6 group-hover:bg-white/10 transition-colors">
                  <ScanLine className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-1">Scan</h3>
                <div className="text-3xl font-black text-foreground mb-3 flex items-baseline gap-1.5">
                  ₹10<span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">/doc</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Scan physical documents directly to PDF. Download instantly on your device.
                </p>
              </motion.div>
            </FadeInSection>

            <FadeInSection delay={0.2} className="h-full">
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-card border border-white/10 rounded-[2rem] p-8 h-full flex flex-col group"
              >
                <div className="w-12 h-12 bg-white/5 border border-white/10 text-white flex items-center justify-center rounded-xl mb-6 group-hover:bg-white/10 transition-colors">
                  <Copy className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-1">Xerox</h3>
                <div className="text-3xl font-black text-foreground mb-3 flex items-baseline gap-1.5">
                  ₹5<span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">/copy</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Digital photocopying. Scan once, print multiple copies instantly.
                </p>
              </motion.div>
            </FadeInSection>
          </div>
        </div>
      </div>
    </section>
  );
}
