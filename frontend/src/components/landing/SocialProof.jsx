// src/components/landing/SocialProof.jsx
import { GraduationCap, Building2, Plane, Quote } from "lucide-react";
import { motion } from "framer-motion";
import FadeInSection from "./FadeInSection";

const stories = [
  {
    icon: GraduationCap,
    audience: "Students",
    quote: "Printed my entire assignment in under a minute. The kiosk was right outside my campus — no shops, no waiting.",
    attribution: "Engineering Student, Hyderabad",
  },
  {
    icon: Building2,
    audience: "Professionals",
    quote: "We removed our office printer entirely. Our team just uses LePrint across the street. Saves us maintenance and ink costs.",
    attribution: "Product Manager, Bangalore",
  },
  {
    icon: Plane,
    audience: "Travelers",
    quote: "Had to print my boarding pass at 11 PM. Found a LePrint kiosk at the bus station. Lifesaver.",
    attribution: "Freelancer & Traveler",
  },
];

export default function SocialProof() {
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <FadeInSection className="text-center mb-16 md:mb-20">
          <span className="block text-[10px] md:text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold mb-4">
            WHO USES LEPRINT
          </span>
          <h2 className="text-3xl md:text-4xl font-light tracking-tight text-foreground">
            Built for <span className="font-bold">everyone</span>
          </h2>
        </FadeInSection>

        <div className="space-y-6 md:space-y-8">
          {stories.map((story, i) => (
            <FadeInSection key={story.audience} delay={i * 0.1}>
              <div className="bg-card/50 border border-border rounded-2xl p-6 md:p-8 hover:bg-card/70 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  {/* Left: Audience label */}
                  <div className="flex items-center gap-3 md:w-48 md:flex-shrink-0 md:pt-1">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-foreground">
                      <story.icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-foreground uppercase tracking-wider">
                      {story.audience}
                    </span>
                  </div>

                  {/* Right: Quote */}
                  <div className="flex-1 md:border-l md:border-border md:pl-6">
                    <Quote className="w-4 h-4 text-white/20 mb-3" />
                    <p className="text-base md:text-lg text-foreground/80 leading-relaxed mb-3">
                      {story.quote}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      — {story.attribution}
                    </p>
                  </div>
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}
