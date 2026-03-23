// src/components/Terms.jsx
import { useEffect } from "react";
import Footer from "./Footer";
import PublicNavbar from "./PublicNavbar";

const BRAND = "LePrint";
const DOMAIN = "leprint.in";
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

export default function Terms() {
  useEffect(() => {
    document.title = "Terms & Conditions — LePrint";
    window.scrollTo(0, 0);
    return () => { document.title = "LePrint"; };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <PublicNavbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 pt-20 pb-14">
        <div className="mb-10">
          <p className="text-xs text-muted-foreground/50 uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Terms &amp; Conditions
          </h1>
          <p className="text-sm text-muted-foreground/50">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-8 md:p-10">
          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using {BRAND} (available at{" "}
              <a href={`https://${DOMAIN}`} className="text-blue-400 hover:underline">
                {DOMAIN}
              </a>
              ), you agree to be bound by these Terms &amp; Conditions. If you
              disagree with any part, you must not use the service.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              {BRAND} provides a cloud-based self-service print, scan, and xerox
              (photocopy) kiosk system. Users can:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Upload documents from their phone by scanning a QR code at a physical kiosk</li>
              <li>Pay online and receive printed documents at the kiosk</li>
              <li>Scan physical documents and receive a digital PDF download</li>
              <li>Photocopy documents by scanning and printing multiple copies</li>
            </ul>
          </Section>

          <Section title="3. User Accounts & Eligibility">
            <p>
              You must sign in with a valid Google account to use the service. You
              must be at least 13 years of age. You are responsible for maintaining
              the security of your account and for all activity that occurs under
              your account.
            </p>
          </Section>

          <Section title="4. Pricing">
            <p>Current pricing (subject to change with notice):</p>
            <div className="mt-3 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-foreground/80">Service</th>
                    <th className="text-left px-4 py-2.5 font-medium text-foreground/80">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-2.5 text-muted-foreground">Print (B&W)</td>
                    <td className="px-4 py-2.5 text-muted-foreground">₹3 per page</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-muted-foreground">Scan</td>
                    <td className="px-4 py-2.5 text-muted-foreground">₹10 per document</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-muted-foreground">Xerox / Photocopy</td>
                    <td className="px-4 py-2.5 text-muted-foreground">₹5 per copy</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">
              All prices are inclusive of applicable taxes. Prices are displayed
              clearly before payment. We reserve the right to change pricing with
              30 days' notice posted on the website.
            </p>
          </Section>

          <Section title="5. Payments">
            <p>
              Payments are processed securely via Razorpay (PCI-DSS compliant).
              LePrint does not store card or UPI details.
            </p>
            <p>
              All services are prepaid. Jobs are processed only after successful
              payment confirmation.
            </p>
            <p>
              Payment must be completed before a print or xerox job is dispatched
              to the kiosk. Scan jobs are initiated after payment confirmation.
            </p>
          </Section>

          <Section title="5A. Service Delivery">
            <p>
              A service is considered successfully delivered once the document is
              printed at the kiosk, or made available for download (scan jobs).
            </p>
          </Section>

          <Section title="6. Acceptable Use">
            <p>You agree NOT to use {BRAND} to print, scan, or reproduce:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Copyrighted material without authorization from the rights holder</li>
              <li>Illegal, obscene, defamatory, or hateful content</li>
              <li>Government-issued documents with intent to forge or misrepresent</li>
              <li>Any content that violates applicable Indian law</li>
            </ul>
            <p>
              Violations may result in immediate account suspension and reporting
              to relevant authorities.
            </p>
          </Section>

          <Section title="7. Uploaded Documents">
            <p>
              You retain full ownership of the files you upload. By uploading, you
              grant {BRAND} a limited, temporary license to process and transmit
              your files solely for the purpose of fulfilling your print/scan job.
            </p>
            <p>
              Uploaded files are automatically and permanently deleted from our
              servers within 2 hours of upload or 30 minutes after job completion.
              We do not read, analyse, or share your document content.
            </p>
          </Section>

          <Section title="8. Refunds & Cancellations">
            <p>
              Please refer to our{" "}
              <a href="/refund-policy" className="text-blue-400 hover:underline">
                Refund Policy
              </a>{" "}
              for complete details. In summary: refunds are issued only when a job
              fails to complete due to a technical error on our side. No refund is
              issued once printing has started.
            </p>
          </Section>

          <Section title="9. Service Availability">
            <p>
              {BRAND} is dependent on physical kiosk hardware, network
              connectivity, printer availability, and paper stock. We do not
              guarantee 100% uptime. Kiosk status is displayed in real time on
              the service interface.
            </p>
            <p>
              If a kiosk is offline or out of paper at the time of your job, we
              will attempt to notify you and process a refund if the job cannot
              be completed.
            </p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>
              {BRAND} is provided "as is." To the fullest extent permitted by
              applicable law, we disclaim all warranties and shall not be liable
              for any indirect, incidental, or consequential damages arising from
              your use of the service. Our total liability for any claim shall not
              exceed the amount paid by you for the specific transaction giving
              rise to the claim.
            </p>
          </Section>

          <Section title="11. Governing Law">
            <p>
              These Terms are governed by the laws of India. Any disputes shall
              be subject to the exclusive jurisdiction of the courts of Hyderabad,
              Telangana, India.
            </p>
          </Section>

          <Section title="12. Changes to Terms">
            <p>
              We may update these Terms at any time. Significant changes will be
              communicated via email or a notice on the website. Continued use
              after the effective date constitutes acceptance.
            </p>
          </Section>

          <Section title="13. Contact">
            <p>Questions about these Terms? Contact us:</p>
            <div className="mt-3 p-4 bg-muted/30 rounded-lg text-sm">
              <p className="font-medium text-foreground/80">{BRAND}</p>
              <p>
                Email:{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-400 hover:underline">
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
