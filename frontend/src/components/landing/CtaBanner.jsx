// src/components/landing/CtaBanner.jsx
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import FadeInSection from "./FadeInSection";

export default function CtaBanner() {
  return (
    <section className="py-20 md:py-28">
      <FadeInSection className="max-w-2xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-4">
          Ready to print?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Sign in with Google and start printing in under a minute.
          No downloads, no drivers — just your phone and a kiosk.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-8 py-4 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 transition-colors text-sm"
        >
          Start Printing Now
          <ArrowRight className="w-4 h-4" />
        </Link>
      </FadeInSection>
    </section>
  );
}
