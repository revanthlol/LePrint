// src/components/landing/TrustSecurity.jsx
import { ShieldCheck, BadgeIndianRupee, Trash2, UserCircle } from "lucide-react";
import FadeInSection from "./FadeInSection";

const items = [
  {
    icon: ShieldCheck,
    title: "Razorpay Secure",
    desc: "PCI-DSS compliant payments. Your payment data never touches our servers.",
  },
  {
    icon: BadgeIndianRupee,
    title: "No Hidden Fees",
    desc: "Price shown = price paid. No surge pricing, no platform fees.",
  },
  {
    icon: Trash2,
    title: "Auto-Delete",
    desc: "Files permanently deleted within 2 hours. Zero retention policy.",
  },
  {
    icon: UserCircle,
    title: "No Signup Required",
    desc: "Use as guest with free daily prints. No account or app needed.",
  },
];

export default function TrustSecurity() {
  return (
    <section className="bg-card/30 border-y border-border py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <FadeInSection className="text-center md:text-left mb-16 md:mb-20">
          <span className="block text-[10px] md:text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold mb-4">
            TRUST &amp; SECURITY
          </span>
          <h2 className="text-3xl md:text-4xl font-light tracking-tight text-foreground">
            Your privacy is <span className="font-bold">non-negotiable.</span>
          </h2>
        </FadeInSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 lg:gap-x-12">
          {items.map((item, i) => (
            <FadeInSection key={item.title} delay={i * 0.1}>
              <div className="flex flex-col items-center md:items-start text-center md:text-left group">
                <div className="w-12 h-12 bg-white/5 border border-white/5 text-white flex items-center justify-center rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-500">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-foreground mb-2">
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
