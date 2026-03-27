// src/components/landing/UseCases.jsx
import { GraduationCap, Building2, Plane } from "lucide-react";
import FadeInSection from "./FadeInSection";

const cases = [
  {
    icon: GraduationCap,
    title: "Students",
    desc: "Print assignments, notes, and project reports between classes — no printer needed.",
    accent: "bg-white/5 text-white/60",
  },
  {
    icon: Building2,
    title: "Offices",
    desc: "Quick prints without maintaining a dedicated printer. Walk in, print, walk out.",
    accent: "bg-white/5 text-white/60",
  },
  {
    icon: Plane,
    title: "Travelers",
    desc: "Print boarding passes, itineraries, or documents on the go — available 24/7.",
    accent: "bg-white/5 text-white/60",
  },
];

export default function UseCases() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <FadeInSection className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            Built for Everyone
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Whether you're a student, a professional, or on the move.
          </p>
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cases.map((c, i) => (
            <FadeInSection key={c.title} delay={i * 0.1}>
              <div className="bg-card border border-border rounded-2xl p-7 h-full">
                <div className={`w-12 h-12 ${c.accent} flex items-center justify-center rounded-xl mb-5`}>
                  <c.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">
                  {c.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {c.desc}
                </p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}
