// src/components/Footer.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

const BRAND = "LePrint";
const SUPPORT_EMAIL = "support@leprint.in";
const YEAR = new Date().getFullYear();

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Landing", href: "/" },
      { label: "App", href: "/app" },
      { label: "About Us", href: "/about" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact Us", href: "/contact" },
      { label: "Pricing", href: "/#pricing" }, // Added a logical 6th link for symmetry
    ],
    isTwoColumn: true,
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Refund Policy", href: "/refund-policy" },
    ],
  },
];

function AccordionSection({ title, links, isTwoColumn }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-foreground text-xs font-bold uppercase tracking-widest">
          {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-60 pb-4" : "max-h-0"
        }`}
      >
        <ul className={isTwoColumn ? "grid grid-cols-2 gap-x-6 gap-y-3" : "space-y-3"}>
          {links.map((link) => (
            <li key={link.label}>
              <Link
                to={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] text-muted-foreground border-t border-border/50 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        {/* ── Desktop layout (md+): 3-column grid ── */}
        <div className="hidden md:grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                <img src="/favicon.svg" alt="LePrint logo" className="h-6 w-6" />
              </div>
              <span className="text-foreground font-bold text-xl tracking-tight">
                {BRAND}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground/60 max-w-sm mb-6">
              A premium, IoT-powered self-service print kiosk system. 
              Built for speed, privacy, and absolute reliability.
            </p>
            <p className="text-xs text-muted-foreground/40 font-mono tracking-wider">
              {SUPPORT_EMAIL}
            </p>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.title} className={section.title === "Product" ? "col-span-1" : ""}>
              <h4 className="text-foreground text-xs font-bold mb-6 uppercase tracking-widest">
                {section.title}
              </h4>
              <ul className={section.isTwoColumn ? "grid grid-cols-2 gap-x-8 gap-y-3" : "space-y-4"}>
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm hover:text-foreground transition-colors duration-150 whitespace-nowrap"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Mobile layout (<md): brand + accordions ── */}
        <div className="md:hidden mb-8">
          {/* Brand — always visible */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                <img src="/favicon.svg" alt="LePrint logo" className="h-6 w-6" />
              </div>
              <span className="text-foreground font-bold text-lg tracking-tight">
                {BRAND}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground/60">
              Self-service print kiosks for everyone.
            </p>
          </div>

          {/* Collapsible sections */}
          {footerSections.map((section) => (
            <AccordionSection
              key={section.title}
              title={section.title}
              links={section.links}
              isTwoColumn={section.isTwoColumn}
            />
          ))}
        </div>

        {/* Divider + bottom bar — both breakpoints */}
        <div className="border-t border-border/50 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest text-muted-foreground/30 font-medium">
          <span>© {YEAR} {BRAND}. All rights reserved.</span>
          <div className="flex gap-8">
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/refund-policy" className="hover:text-foreground transition-colors">
              Refunds
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
