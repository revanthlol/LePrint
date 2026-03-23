// src/components/PrivacyPolicy.jsx
import { useEffect } from "react";
import Footer from "./Footer";
import PublicNavbar from "./PublicNavbar";

const BRAND = "LePrint";
const SUPPORT_EMAIL = "support@leprint.in";
const LAST_UPDATED = "March 21, 2026";

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border">
        {title}
      </h2>
      <div className="text-muted-foreground text-sm leading-7 space-y-3">{children}</div>
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
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 pt-20 pb-14">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs text-muted-foreground/50 uppercase tracking-widest mb-2">
            Legal
          </p>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground/50">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-8 md:p-10">
          <Section title="1. Introduction">
            <p>
              {BRAND} ("we", "us", or "our") operates a cloud-based print, scan,
              and photocopy kiosk service accessible via{" "}
              <a
                href="https://leprint.in"
                className="text-blue-400 hover:underline"
              >
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
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong className="text-foreground/80">Account Information:</strong>{" "}
                Name, email address, and profile picture obtained via Google
                OAuth login (Firebase Authentication).
              </li>
              <li>
                <strong className="text-foreground/80">Uploaded Documents:</strong>{" "}
                Files you upload for printing or xerox (PDF, DOCX, images). These
                are stored temporarily on our servers and automatically deleted
                within 2 hours of upload or 30 minutes after job completion.
              </li>
              <li>
                <strong className="text-foreground/80">Payment Information:</strong>{" "}
                Transaction IDs and payment status processed through Razorpay.
                Payments are processed securely via Razorpay (PCI-DSS compliant).
                LePrint does not store card or UPI details.
              </li>
              <li>
                <strong className="text-foreground/80">Usage Data:</strong> Job
                history (print/scan/xerox jobs), timestamps, kiosk IDs, and
                service preferences.
              </li>
              <li>
                <strong className="text-foreground/80">Device & Technical Data:</strong>{" "}
                IP address, browser type, and device information collected
                automatically for security and service operation.
              </li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use collected information to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Authenticate your identity and manage your account</li>
              <li>Process print, scan, and xerox jobs</li>
              <li>Process payments and issue refunds when applicable</li>
              <li>Send job status notifications and service communications</li>
              <li>Detect fraud, misuse, or security issues</li>
              <li>Comply with legal obligations</li>
              <li>Improve the service based on aggregated usage patterns</li>
            </ul>
          </Section>

          <Section title="4. Data Sharing & Disclosure">
            <p>
              We do not sell or rent your personal information. We share data
              only in the following limited circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong className="text-foreground/80">Razorpay:</strong> Payment
                processing (transaction data only)
              </li>
              <li>
                <strong className="text-foreground/80">Google Firebase:</strong>{" "}
                Authentication and identity management
              </li>
              <li>
                <strong className="text-foreground/80">Kiosk Operators:</strong>{" "}
                Job details required for physical printing at the kiosk
              </li>
              <li>
                <strong className="text-foreground/80">Legal Requirements:</strong>{" "}
                When required by law, court order, or government authority
              </li>
            </ul>
          </Section>

          <Section title="5. Data Retention">
            <p>
              Uploaded files are automatically deleted from our servers within 2
              hours of upload, or 30 minutes after your print job completes —
              whichever comes first.
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
              over the internet is 100% secure, and we cannot guarantee absolute
              security.
            </p>
          </Section>

          <Section title="7. Your Rights">
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Withdraw consent for data processing (where applicable)</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-blue-400 hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </Section>

          <Section title="8. Cookies">
            <p>
              {BRAND} uses minimal cookies and browser storage necessary for
              authentication session management. We do not use tracking cookies
              or third-party advertising cookies.
            </p>
          </Section>

          <Section title="9. Children's Privacy">
            <p>
              Our service is not directed at individuals under 13 years of age.
              We do not knowingly collect personal information from children.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy periodically. When we do, we will
              revise the "Last updated" date at the top of this page. Continued
              use of the service after changes constitutes acceptance of the
              updated policy.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>For privacy-related inquiries, contact us at:</p>
            <div className="mt-3 p-4 bg-muted/30 rounded-lg text-sm">
              <p className="font-medium text-foreground/80">{BRAND}</p>
              <p>
                Email:{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-blue-400 hover:underline"
                >
                  {SUPPORT_EMAIL}
                </a>
              </p>
              <p>Address: J-04 J-Block Zonasha Elegance Apartments Phase-1 DAST Road Haralur Bangalore 560102</p>
            </div>
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
