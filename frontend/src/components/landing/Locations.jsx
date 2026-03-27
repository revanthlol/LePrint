// src/components/landing/Locations.jsx
import { MapPin, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
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
    <section className="bg-card/30 border-y border-border py-24 md:py-32">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <FadeInSection>
          <span className="block text-[10px] md:text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold mb-4">
            WHERE TO FIND US
          </span>
          <h2 className="text-3xl md:text-4xl font-light tracking-tight text-foreground mb-4">
            Expanding across <span className="font-bold">India</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-12">
            Currently deploying kiosks in select cities. More locations every month.
          </p>
        </FadeInSection>

        <FadeInSection delay={0.15}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap md:justify-center gap-3 mb-10">
            {cities.map((city) => (
              <div
                key={city}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-card border border-border rounded-full text-sm text-foreground font-medium"
              >
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                {city}
              </div>
            ))}
          </div>
        </FadeInSection>

        <FadeInSection delay={0.25}>
          <Link 
            to="/contact"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            Want LePrint in your city?
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </FadeInSection>
      </div>
    </section>
  );
}
