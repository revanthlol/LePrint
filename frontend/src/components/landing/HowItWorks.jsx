// src/components/landing/HowItWorks.jsx
import { motion } from "framer-motion";
import { QrCode, Upload, Printer } from "lucide-react";
import FadeInSection from "./FadeInSection";

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
    title: "Collect Print",
    desc: "Your document prints instantly — pick it up and go.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-card/30 border-y border-border py-24 md:py-32"
    >
      <div className="max-w-6xl mx-auto px-6">
        <FadeInSection className="text-center mb-20 md:mb-24">
          <span className="block text-[10px] md:text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold mb-4">
            HOW IT WORKS
          </span>
          <h2 className="text-3xl md:text-4xl font-light tracking-tight text-foreground">
            Three steps to your <span className="font-bold">print</span>
          </h2>
        </FadeInSection>

        <div className="relative">
          {/* Desktop: centered grid with horizontal line */}
          <div className="hidden md:block relative">
            {/* Horizontal line */}
            <div className="absolute top-[23px] left-[16.67%] right-[16.67%] h-px bg-white/10">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: "easeInOut", delay: 0.5 }}
                className="h-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-8 relative z-10">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold shadow-lg shadow-white/5 group-hover:scale-110 transition-transform mb-6">
                    {step.num}
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground mb-6 group-hover:text-white transition-colors">
                    <step.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px]">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile: left-aligned vertical timeline */}
          <div className="md:hidden relative pl-16">
            {/* Vertical line */}
            <div className="absolute left-[23px] top-0 bottom-0 w-px bg-white/10">
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: "easeInOut", delay: 0.3 }}
                className="w-full bg-gradient-to-b from-white/40 via-white/20 to-transparent"
              />
            </div>

            <div className="space-y-16">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="relative"
                >
                  {/* Circle on the line */}
                  <div className="absolute -left-16 top-0 w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold shadow-lg shadow-white/5">
                    {step.num}
                  </div>

                  {/* Content */}
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground mb-4">
                      <step.icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
