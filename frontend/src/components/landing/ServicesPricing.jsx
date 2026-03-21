// src/components/landing/ServicesPricing.jsx
import { FileText, ScanLine, Copy } from "lucide-react";
import FadeInSection from "./FadeInSection";

const services = [
  {
    icon: FileText,
    name: "Print",
    price: "₹3 / page",
    desc: "Upload PDFs or images and get laser-quality B&W prints at the kiosk.",
  },
  {
    icon: ScanLine,
    name: "Scan",
    price: "₹10 / document",
    desc: "Scan physical documents and receive a high-res PDF download on your phone.",
  },
  {
    icon: Copy,
    name: "Xerox",
    price: "₹5 / copy",
    desc: "Photocopy documents instantly — scan once, print multiple copies.",
  },
];

export default function ServicesPricing() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <FadeInSection className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            Services &amp; Pricing
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Transparent pricing with no hidden fees. Pay only for what you use.
          </p>
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <FadeInSection key={s.name} delay={i * 0.1}>
              <div className="bg-card border border-border rounded-2xl p-7 hover:bg-card/80 transition-colors duration-200 h-full flex flex-col">
                <div className="w-11 h-11 bg-foreground text-background flex items-center justify-center rounded-xl mb-5">
                  <s.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  {s.name}
                </h3>
                <span className="inline-block text-xs font-semibold bg-foreground/10 text-foreground px-2.5 py-1 rounded-full mb-4 w-fit">
                  {s.price}
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed mt-auto">
                  {s.desc}
                </p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}
