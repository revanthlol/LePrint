// src/components/landing/Locations.jsx
import { MapPin } from "lucide-react";
import FadeInSection from "./FadeInSection";

const cities = [
  "Hyderabad",
  "Bangalore",
  "Chennai",
  "Mumbai",
  "Delhi NCR",
  "Pune",
];

export default function Locations() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <FadeInSection>
          <div className="w-12 h-12 mx-auto bg-foreground/10 text-foreground flex items-center justify-center rounded-xl mb-6">
            <MapPin className="w-5 h-5" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            Available at Select Locations
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8">
            We're expanding across India. Find a kiosk near you.
          </p>
        </FadeInSection>

        <FadeInSection delay={0.15}>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {cities.map((city) => (
              <span
                key={city}
                className="px-4 py-2 bg-card border border-border rounded-full text-sm text-muted-foreground font-medium"
              >
                {city}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground/50">
            More cities coming soon — want LePrint in your area?{" "}
            <a href="/contact" className="text-foreground/60 underline underline-offset-2 hover:text-foreground transition-colors">
              Let us know
            </a>
          </p>
        </FadeInSection>
      </div>
    </section>
  );
}
