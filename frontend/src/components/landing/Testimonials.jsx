// src/components/landing/Testimonials.jsx
import { Quote } from "lucide-react";
import FadeInSection from "./FadeInSection";

const testimonials = [
  {
    quote:
      "Printed my entire assignment in under a minute. The kiosk was right outside my campus — no shops, no waiting.",
    role: "Student, Hyderabad",
  },
  {
    quote:
      "We removed our office printer entirely. Our team just uses LePrint across the street. Saves us maintenance and ink costs.",
    role: "Working Professional",
  },
  {
    quote:
      "Had to print my boarding pass at 11 PM. Found a LePrint kiosk at the bus station. Lifesaver.",
    role: "Freelancer & Traveler",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-card/40 border-y border-border py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <FadeInSection className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            What People Say
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Real feedback from real users.
          </p>
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <FadeInSection key={i} delay={i * 0.1}>
              <div className="bg-card border border-border rounded-2xl p-7 h-full flex flex-col">
                <Quote className="w-5 h-5 text-muted-foreground/30 mb-4 flex-shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  "{t.quote}"
                </p>
                <p className="text-xs font-semibold text-foreground/60 mt-5 pt-4 border-t border-border/50">
                  — {t.role}
                </p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}
