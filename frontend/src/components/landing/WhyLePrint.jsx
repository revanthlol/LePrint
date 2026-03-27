// src/components/landing/WhyLePrint.jsx
import { Activity } from "lucide-react";
import FeatureCards from "../FeatureCards";
import FadeInSection from "./FadeInSection";

export default function WhyLePrint() {
  return (
    <section className="bg-card/40 border-y border-border py-20 md:py-28">
      <div className="max-w-md mx-auto px-6">
        <FadeInSection className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            Why LePrint
          </h2>
          <p className="text-muted-foreground text-sm">
            Built for speed, security, and round-the-clock availability.
          </p>
        </FadeInSection>

        <FadeInSection delay={0.15}>
          <FeatureCards />
        </FadeInSection>

        {/* System status strip */}
        <FadeInSection delay={0.25} className="mt-8">
          <div className="flex items-center justify-center gap-6 p-3 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse" />
              <span className="text-xs text-muted-foreground">All systems operational</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground">Avg print time: &lt; 60s</span>
            </div>
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}
