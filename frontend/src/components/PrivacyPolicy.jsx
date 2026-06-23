// src/components/PrivacyPolicy.jsx
import { useEffect } from "react";
import Footer from "./Footer";
import PublicNavbar from "./PublicNavbar";

const BRAND = "LePrint";
const COMPANY_NAME = "FUTURE WAVE IT PVT LTD";
const SUPPORT_EMAIL = "support@leprint.in";
const LAST_UPDATED = "June 23, 2026";

function Section({ title, children }) {
  return (
    <section className="mb-12 last:mb-0">
      <h2 className="text-xl font-bold text-foreground mb-6 pb-4 border-b border-white/[0.05]">
        {title}
      </h2>
      <div className="text-muted-foreground/90 text-sm md:text-base leading-8 space-y-6">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy — LePrint";
    window.scrollTo(0, 0);
    return () => { document.title = "LePrint"; };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <PublicNavbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-6 pt-32 pb-20">
        <div className="mb-12">
          <span className="block text-[10px] md:text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold mb-4">LEGAL</span>
          <h1 className="text-4xl md:text-6xl font-light tracking-tight text-foreground mb-4">
            Privacy <span className="font-bold">Policy</span>
          </h1>
          <p className="text-sm text-muted-foreground/40 font-medium">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="md:bg-white/[0.03] md:backdrop-blur-2xl md:border md:border-white/[0.05] md:rounded-[2.5rem] md:shadow-2xl md:shadow-black/50 md:p-16 space-y-0">
          <Section title="1. Introduction">
            <p>
              {BRAND} is a cloud-based print, scan, and photocopy kiosk service owned and operated by <strong>{COMPANY_NAME}</strong> ("we", "us", or "our"), accessible via{" "}
              <a href="https://leprint.in" className="text-blue-400/80 underline decoration-white/20 underline-offset-4 hover:text-white transition-colors">
                leprint.in
              </a>
              . This Privacy Policy explains how we collect, use, disclose, and
              protect your information when you use our services.
            </p>
            <p>
              By using {BRAND}, you agree to the collection and use of information
              as described in this policy. If you do not agree, please discontinue
              use of the service.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <p>We collect the following categories of information:</p>
            <ul className="space-y-6 mt-6">
              {[
                { label: "Account Information", value: "Name, email address, and profile picture obtained via Google OAuth login (Firebase Authentication)." },
                { label: "Uploaded Documents", value: "Files you upload for printing or photocopy (PDF, DOCX, images). Uploaded documents are stored temporarily only for job processing and are automatically deleted immediately after successful kiosk retrieval, or within a maximum of 2 hours if the job is not completed." },
                { label: "Payment Information", value: "Transaction IDs and payment status processed through PayU and PCI DSS compliant payment gateway partners. LePrint does not store card or UPI details." },
                { label: "Usage Data", value: "Job history (print/scan/photocopy jobs), timestamps, kiosk IDs, and service preferences." },
                { label: "Device & Technical Data", value: "IP address, browser type, and device information collected automatically for security and service operation." }
              ].map((item, i) => (
                <li key={i} className="flex gap-4">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-white/20 mt-3" />
                  <div>
                    <span className="block font-bold text-white text-xs uppercase tracking-widest mb-2">{item.label}</span>
                    <span className="text-muted-foreground/80">{item.value}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use collected information to:</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {[
                "Authenticate your identity",
                "Process print/scan/photocopy jobs",
                "Process payments and refunds",
                "Send job status notifications",
                "Detect fraud or security issues",
                "Comply with legal obligations",
                "Improve service performance"
              ].map((item, i) => (
                <li key={i} className="flex gap-3 items-center p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="4. Data Sharing & Disclosure">
            <p>
              We do not sell or rent your personal information. We share data
              only in the following limited circumstances:
            </p>
            <ul className="space-y-4 mt-6">
              {[
                { partner: "PayU (Payment Gateway)", purpose: "Payment processing (transaction data only)" },
                { partner: "Google Firebase", purpose: "Authentication and identity management" },
                { partner: "Kiosk Operators", purpose: "Job details required for physical printing" },
                { partner: "Legal Requirements", purpose: "When required by law or government authority" }
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-white/20 mt-3" />
                  <span>
                    <strong className="text-white">{item.partner}:</strong> {item.purpose}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="5. Data Retention">
            <p>
              <span className="font-bold text-white">Uploaded files</span> are stored temporarily only for job processing
              and are automatically deleted immediately after successful kiosk retrieval,
              or within a maximum of 2 hours if the job is not completed.
            </p>
            <p>
              Account information and job history records are retained for up to
              12 months for support and dispute resolution purposes, after which
              they are deleted.
            </p>
          </Section>

          <Section title="6. Data Security">
            <p>
              We implement industry-standard security measures including HTTPS
              encryption for all data in transit, JWT-based authentication,
              and server-level access controls. However, no method of transmission
              over the internet is 100% secure.
            </p>
          </Section>

          <Section title="7. Your Rights">
            <p>You have the right to access, correct, or request deletion of your data.</p>
            <p>
              To exercise these rights, contact us at{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-400/80 underline decoration-white/20 underline-offset-4 hover:text-white transition-colors">
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </Section>

          <Section title="8. Cookies">
            <p>
              {BRAND} uses minimal cookies necessary for session management. 
              We do not use tracking or advertising cookies.
            </p>
          </Section>

          <Section title="9. Children's Privacy">
            <p>
              Our service is not directed at individuals under 13. We do not 
              knowingly collect personal information from children.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy periodically. Continued use of 
              the service after changes constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section title="11. Contact">
            <div className="mt-2 p-8 bg-white/[0.04] border border-white/[0.05] rounded-2xl shadow-inner">
              <p className="font-bold text-white text-lg mb-1">{BRAND}</p>
              <p className="text-xs text-muted-foreground/50 font-semibold mb-4">Owned &amp; Operated by {COMPANY_NAME}</p>
              <p className="mb-4">
                Email:{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-400/80 underline decoration-white/20 underline-offset-4 hover:text-white transition-colors">
                  {SUPPORT_EMAIL}
                </a>
              </p>
              <p className="text-xs text-muted-foreground/60 leading-relaxed uppercase tracking-widest font-bold">
                J-04 J-Block Zonasha Elegance Apartments Phase-1 DAST Road Haralur Bangalore 560102
              </p>
            </div>
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
