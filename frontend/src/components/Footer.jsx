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
      { label: "Home", href: "/" },
      { label: "Landing", href: "/landing" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Refund Policy", href: "/refund-policy" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "About LePrint", href: "/faq" },
    ],
  },
];

function AccordionSection({ title, links }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <span className="text-foreground text-sm font-medium uppercase tracking-widest">
          {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          open ? "max-h-40 pb-3" : "max-h-0"
        }`}
      >
        <ul className="space-y-2">
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
    <footer className="bg-[#0a0a0a] text-muted-foreground border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* ── Desktop layout (md+): 4-column grid ── */}
        <div className="hidden md:grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/favicon.svg" alt="LePrint logo" className="h-7 w-7" />
              <span className="text-foreground font-semibold text-lg tracking-tight">
                {BRAND}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground/70">
              Scan. Upload. Print. — A self-service print kiosk for everyone.
            </p>
            <p className="text-xs mt-4 text-muted-foreground/50">
              {SUPPORT_EMAIL}
            </p>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-foreground text-sm font-medium mb-4 uppercase tracking-widest">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm hover:text-foreground transition-colors duration-150"
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
        <div className="md:hidden mb-6">
          {/* Brand — always visible */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <img src="/favicon.svg" alt="LePrint logo" className="h-6 w-6" />
              <span className="text-foreground font-semibold text-base tracking-tight">
                {BRAND}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground/70">
              Scan. Upload. Print. — A self-service print kiosk for everyone.
            </p>
          </div>

          {/* Collapsible sections */}
          {footerSections.map((section) => (
            <AccordionSection
              key={section.title}
              title={section.title}
              links={section.links}
            />
          ))}
        </div>

        {/* Divider + bottom bar — both breakpoints */}
        <div className="border-t border-border pt-5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground/50">
          <span>© {YEAR} {BRAND}. All rights reserved.</span>
          <div className="flex gap-5">
            <Link to="/terms" className="hover:text-muted-foreground transition-colors">
              Terms
            </Link>
            <Link to="/privacy-policy" className="hover:text-muted-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/refund-policy" className="hover:text-muted-foreground transition-colors">
              Refunds
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
