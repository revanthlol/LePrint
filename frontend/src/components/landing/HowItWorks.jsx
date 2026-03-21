// src/components/landing/HowItWorks.jsx
import { QrCode, Upload, Printer } from "lucide-react";
import FadeInSection from "./FadeInSection";

const steps = [
  {
    icon: QrCode,
    num: "01",
    title: "Scan the QR",
    desc: "Walk up to any LePrint kiosk and scan the QR code with your phone.",
  },
  {
    icon: Upload,
    num: "02",
    title: "Upload & Pay",
    desc: "Choose your file, set preferences, and pay securely online.",
  },
  {
    icon: Printer,
    num: "03",
    title: "Collect Your Print",
    desc: "Your document prints instantly — pick it up and go.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-card/40 border-y border-border py-20 md:py-28"
    >
      <div className="max-w-6xl mx-auto px-6">
        <FadeInSection>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-2">
            How It Works
          </h2>
          <div className="w-16 h-1 bg-foreground rounded-full mb-12" />
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step, i) => (
            <FadeInSection key={step.num} delay={i * 0.1}>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center rounded-xl">
                  <step.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {step.num}. {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}
