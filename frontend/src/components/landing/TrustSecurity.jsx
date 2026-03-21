// src/components/landing/TrustSecurity.jsx
import { ShieldCheck, BadgeIndianRupee, Trash2 } from "lucide-react";
import FadeInSection from "./FadeInSection";

const items = [
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    desc: "Powered by PayU — PCI-DSS compliant. Your payment data never touches our servers.",
  },
  {
    icon: BadgeIndianRupee,
    title: "No Hidden Charges",
    desc: "Price shown = price paid. Always. No surge pricing, no platform fees.",
  },
  {
    icon: Trash2,
    title: "Auto-Delete Files",
    desc: "Your documents are permanently deleted within 2 hours of upload. Zero retention.",
  },
];

export default function TrustSecurity() {
  return (
    <section className="bg-card/40 border-y border-border py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <FadeInSection className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            Trust &amp; Security
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Your privacy and payment security are non-negotiable.
          </p>
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <FadeInSection key={item.title} delay={i * 0.1}>
              <div className="bg-card border border-border rounded-2xl p-7 text-center h-full">
                <div className="w-12 h-12 mx-auto bg-emerald-500/10 text-emerald-400 flex items-center justify-center rounded-xl mb-5">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}
