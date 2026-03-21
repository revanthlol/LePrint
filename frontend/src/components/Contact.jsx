// src/components/Contact.jsx
import { useState, useEffect } from "react";
import Footer from "./Footer";
import PublicNavbar from "./PublicNavbar";

const BRAND = "LePrint";
const SUPPORT_EMAIL = "support@leprint.in";

function InfoCard({ icon, label, value, href }) {
  const content = (
    <div className="flex items-start gap-4 p-5 bg-card rounded-xl border border-border shadow-sm">
      <div className="flex-shrink-0 w-10 h-10 bg-foreground rounded-lg flex items-center justify-center text-background text-lg">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground/50 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block hover:scale-[1.01] transition-transform duration-150">
        {content}
      </a>
    );
  }
  return content;
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
    return () => { document.title = "LePrint"; };
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Opens mail client with prefilled content — no backend needed
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
        <div className="mb-10">
          <p className="text-xs text-muted-foreground/50 uppercase tracking-widest mb-2">Support</p>
          <h1 className="text-3xl font-bold text-foreground mb-2">Contact Us</h1>
          <p className="text-muted-foreground text-sm">
            We typically respond within 2 business days.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: contact info */}
          <div className="lg:col-span-2 space-y-4">
            <InfoCard
              icon="✉️"
              label="Email"
              value={SUPPORT_EMAIL}
              href={`mailto:${SUPPORT_EMAIL}`}
            />
            <InfoCard
              icon="📞"
              label="Phone"
              value="+91 98765 43210"
              href="tel:+919876543210"
            />
            <InfoCard
              icon="📍"
              label="Address"
              value="123 Business Street, Hyderabad, Telangana 500001, India"
            />
            <InfoCard
              icon="🕐"
              label="Support Hours"
              value="Mon–Sat, 10:00 AM – 6:00 PM IST"
            />

            {/* Quick links */}
            <div className="p-5 bg-card rounded-xl border border-border shadow-sm">
              <p className="text-xs text-muted-foreground/50 uppercase tracking-widest mb-3">
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
                      className="text-sm text-blue-400 hover:underline"
                    >
                      → {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: contact form */}
          <div className="lg:col-span-3">
            <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
              {submitted ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-4">✅</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Message prepared!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your mail client should have opened with a pre-filled message.
                    If not, email us directly at{" "}
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="text-blue-400 hover:underline"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                    .
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 text-sm text-muted-foreground/60 hover:text-muted-foreground underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-base font-semibold text-foreground mb-6">
                    Send us a message
                  </h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                          Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Your name"
                          className="w-full px-3.5 py-2.5 text-sm bg-muted/20 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                          Email <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="you@example.com"
                          className="w-full px-3.5 py-2.5 text-sm bg-muted/20 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                        Subject
                      </label>
                      <select
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm bg-muted/20 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
                      >
                        <option value="">Select a topic</option>
                        <option value="Refund Request">Refund Request</option>
                        <option value="Print Job Issue">Print Job Issue</option>
                        <option value="Scan Job Issue">Scan Job Issue</option>
                        <option value="Payment Issue">Payment Issue</option>
                        <option value="Kiosk Issue">Kiosk / Hardware Issue</option>
                        <option value="General Enquiry">General Enquiry</option>
                        <option value="Partnership / Franchise">
                          Partnership / Franchise
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                        Message <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        placeholder="Describe your issue or question. Include your Job ID if it's about a specific job."
                        rows={5}
                        className="w-full px-3.5 py-2.5 text-sm bg-muted/20 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition resize-none"
                      />
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={!form.name || !form.email || !form.message}
                      className="w-full py-2.5 px-4 bg-foreground text-background text-sm font-medium rounded-lg hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                      Send Message →
                    </button>
                    <p className="text-xs text-muted-foreground/50 text-center">
                      This will open your email client with a pre-filled message.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
