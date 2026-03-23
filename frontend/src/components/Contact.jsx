// src/components/Contact.jsx
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  User,
  MessageSquare,
  CheckCircle,
  Send,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import Footer from "./Footer";
import PublicNavbar from "./PublicNavbar";

const BRAND = "LePrint";
const SUPPORT_EMAIL = "support@leprint.in";

/* ── animation helpers ── */
function FadeIn({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Info card ── */
function InfoCard({ icon: Icon, label, value, href, delay = 0 }) {
  const inner = (
    <div className="flex items-start gap-4 p-5 bg-card rounded-xl border border-border hover:border-border/80 hover:bg-card/80 transition-colors duration-150">
      <div className="flex-shrink-0 w-10 h-10 bg-foreground/10 rounded-lg flex items-center justify-center">
        <Icon className="w-4 h-4 text-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-semibold mb-0.5">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground leading-snug break-words">
          {value}
        </p>
      </div>
    </div>
  );

  return (
    <FadeIn delay={delay}>
      {href ? (
        <a href={href} className="block">
          {inner}
        </a>
      ) : (
        inner
      )}
    </FadeIn>
  );
}

/* ── Input wrapper with icon ── */
function InputField({ icon: Icon, label, required, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
        <Icon className="w-3 h-3" />
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-3.5 py-2.5 text-sm bg-muted/20 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30 transition-all duration-150";

const subjectOptions = [
  { value: "", label: "Select a topic" },
  { value: "Refund Request", label: "Refund Request" },
  { value: "Print Job Issue", label: "Print Job Issue" },
  { value: "Scan Job Issue", label: "Scan Job Issue" },
  { value: "Payment Issue", label: "Payment Issue" },
  { value: "Kiosk Issue", label: "Kiosk / Hardware Issue" },
  { value: "General Enquiry", label: "General Enquiry" },
  { value: "Partnership / Franchise", label: "Partnership / Franchise" },
];

function CustomSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${inputClass} flex items-center justify-between text-left ${
          !value ? "text-muted-foreground/40" : ""
        }`}
      >
        <span className="truncate">{selected?.label || "Select a topic"}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground/50 flex-shrink-0 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-xl overflow-hidden"
          >
            {options.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-sm transition-colors ${
                    opt.value === value
                      ? "bg-foreground/10 text-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  useEffect(() => {
    document.title = "Contact Us — LePrint";
    window.scrollTo(0, 0);
    return () => {
      document.title = "LePrint";
    };
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.message) return;

    const subject = encodeURIComponent(
      form.subject || `Contact from ${form.name} — ${BRAND}`
    );
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <PublicNavbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 pt-20 pb-14">
        {/* Header */}
        <FadeIn>
          <div className="mb-10">
            <p className="text-xs text-muted-foreground/50 uppercase tracking-widest mb-2">
              Support
            </p>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Contact Us
            </h1>
            <p className="text-muted-foreground text-sm">
              Have a question or need help? We'll get back within 24 hours.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: contact info */}
          <div className="lg:col-span-2 space-y-3">
            <InfoCard
              icon={Mail}
              label="Email"
              value={SUPPORT_EMAIL}
              href={`mailto:${SUPPORT_EMAIL}`}
              delay={0.05}
            />
            <InfoCard
              icon={Phone}
              label="Phone"
              value="+91 95388 01540"
              href="tel:+919538801540"
              delay={0.1}
            />
            <InfoCard
              icon={MapPin}
              label="Address"
              value="J-04 J-Block Zonasha Elegance Apartments Phase-1 DAST Road Haralur Bangalore 560102"
              delay={0.15}
            />
            <InfoCard
              icon={Clock}
              label="Support Hours"
              value="Mon–Sat, 10:00 AM – 6:00 PM IST"
              delay={0.2}
            />

            {/* Quick links */}
            <FadeIn delay={0.25}>
              <div className="p-5 bg-card rounded-xl border border-border mt-1">
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-semibold mb-3">
                  Quick Links
                </p>
                <ul className="space-y-2">
                  {[
                    { label: "View job history", href: "/history" },
                    { label: "Refund policy", href: "/refund-policy" },
                    { label: "FAQ", href: "/faq" },
                  ].map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ArrowRight className="w-3 h-3" />
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>

          {/* Right: contact form */}
          <FadeIn delay={0.1} className="lg:col-span-3">
            <div className="bg-card rounded-2xl border border-border p-8">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-10"
                >
                  <div className="w-14 h-14 mx-auto bg-emerald-500/10 text-emerald-400 flex items-center justify-center rounded-2xl mb-5">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Message prepared!
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Your mail client should have opened with a pre-filled message.
                    If not, email us directly at{" "}
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="text-foreground underline underline-offset-2"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                    .
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 text-sm text-muted-foreground/60 hover:text-foreground transition-colors underline underline-offset-2"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <>
                  <h2 className="text-base font-semibold text-foreground mb-1">
                    Send us a message
                  </h2>
                  <p className="text-xs text-muted-foreground/50 mb-6">
                    We typically respond within 1–2 business days.
                  </p>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField icon={User} label="Name" required>
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Your name"
                          className={inputClass}
                        />
                      </InputField>
                      <InputField icon={Mail} label="Email" required>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="you@example.com"
                          className={inputClass}
                        />
                      </InputField>
                    </div>

                    <InputField icon={MessageSquare} label="Subject">
                      <CustomSelect
                        value={form.subject}
                        onChange={(val) =>
                          setForm((prev) => ({ ...prev, subject: val }))
                        }
                        options={subjectOptions}
                      />
                    </InputField>

                    <InputField icon={MessageSquare} label="Message" required>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        placeholder="Describe your issue or question. Include your Job ID if it's about a specific job."
                        rows={5}
                        className={`${inputClass} resize-none`}
                      />
                    </InputField>

                    <button
                      onClick={handleSubmit}
                      disabled={!form.name || !form.email || !form.message}
                      className="w-full py-3 px-4 bg-foreground text-background text-sm font-semibold rounded-xl hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send Message
                    </button>
                    <p className="text-[11px] text-muted-foreground/40 text-center">
                      This will open your email client with a pre-filled message.
                    </p>
                  </div>
                </>
              )}
            </div>
          </FadeIn>
        </div>
      </main>
      <Footer />
    </div>
  );
}
