// src/components/RefundPolicy.jsx
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

function StatusBadge({ type, children }) {
  const styles = {
    eligible: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    ineligible: "bg-red-500/15 text-red-400 border-red-500/30",
    conditional: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[type]}`}
    >
      {children}
    </span>
  );
}

export default function RefundPolicy() {
  useEffect(() => {
    document.title = "Refund & Cancellation Policy — LePrint";
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
            Refund &amp; Cancellation Policy
          </h1>
          <p className="text-sm text-muted-foreground/50">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-8 md:p-10">
          {/* Quick reference table */}
          <div className="mb-10 p-5 bg-muted/20 rounded-xl border border-border">
            <p className="text-sm font-medium text-foreground/80 mb-4">Quick Reference</p>
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-foreground/80">Scenario</th>
                    <th className="text-left px-4 py-2.5 font-medium text-foreground/80">Refund Eligible?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">Job failed before printing started</td>
                    <td className="px-4 py-3"><StatusBadge type="eligible">✓ Full Refund</StatusBadge></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">Job failed mid-print (partial output)</td>
                    <td className="px-4 py-3"><StatusBadge type="conditional">Partial Refund</StatusBadge></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">Kiosk offline / out of paper after payment</td>
                    <td className="px-4 py-3"><StatusBadge type="eligible">✓ Full Refund</StatusBadge></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">Print completed successfully</td>
                    <td className="px-4 py-3"><StatusBadge type="ineligible">✗ Not Eligible</StatusBadge></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">User error (wrong file, wrong pages)</td>
                    <td className="px-4 py-3"><StatusBadge type="ineligible">✗ Not Eligible</StatusBadge></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">User changed mind after payment</td>
                    <td className="px-4 py-3"><StatusBadge type="ineligible">✗ Not Eligible</StatusBadge></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">Scan job failed (no output delivered)</td>
                    <td className="px-4 py-3"><StatusBadge type="eligible">✓ Full Refund</StatusBadge></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">Duplicate payment (technical error)</td>
                    <td className="px-4 py-3"><StatusBadge type="eligible">✓ Full Refund</StatusBadge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <Section title="1. Overview">
            <p>
              At {BRAND}, we want every transaction to be successful. This policy
              outlines when and how refunds are issued for print, scan, and xerox
              (photocopy) services.
            </p>
            <p>
              Refunds are issued only when a job fails to complete due to a
              technical fault on our end or a kiosk-side issue. We do not offer
              refunds for completed jobs or for user errors.
            </p>
          </Section>

          <Section title="2. Eligible Refund Scenarios">
            <p>You are entitled to a full refund if:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                Your print, scan, or xerox job is marked as{" "}
                <strong className="text-foreground/80">FAILED</strong> by our system
                after exhausting all automatic retries (3 attempts)
              </li>
              <li>
                The kiosk goes offline or runs out of paper after your payment is
                confirmed and the job cannot be rescheduled
              </li>
              <li>
                Your payment was charged but no job was created (payment gateway
                error or duplicate charge)
              </li>
              <li>
                A scan job completed but the scanned file was not delivered or
                available for download
              </li>
            </ul>
            <p>
              In the case of a mid-print failure (some pages printed, some did
              not), a partial refund proportional to the unprinted pages will be
              issued.
            </p>
          </Section>

          <Section title="3. Non-Eligible Scenarios">
            <p>Refunds will NOT be issued if:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>The job completed successfully and output was delivered</li>
              <li>
                You uploaded the wrong file, selected the wrong settings, or
                changed your mind after the job began processing
              </li>
              <li>
                The print quality issue is due to the source file quality (e.g.,
                low-resolution images in the document)
              </li>
              <li>You were unable to collect the printout in time (timeout at kiosk)</li>
            </ul>
          </Section>

          <Section title="4. Cancellation Policy">
            <p>
              Once payment is confirmed and a job enters the processing queue
              (status: <strong className="text-foreground/80">PAID</strong> or later),
              it cannot be cancelled. Please verify your document and settings
              before completing payment.
            </p>
            <p>
              If your job is still in <strong className="text-foreground/80">PENDING</strong>{" "}
              status and payment has not been confirmed, no charge has been applied.
            </p>
          </Section>

          <Section title="5. Refund Timeline">
            <p>
              Approved refunds are processed within{" "}
              <strong className="text-foreground/80">5–7 business days</strong> to the
              original payment method. The actual credit timeline depends on your
              bank or card issuer and may take up to 10 business days to reflect.
            </p>
            <p>
              You will receive an email confirmation at your registered email
              address once the refund has been initiated.
            </p>
          </Section>

          <Section title="6. How to Request a Refund">
            <p>If your job has failed and you believe you are eligible for a refund:</p>
            <ol className="list-decimal pl-5 space-y-2 mt-2">
              <li>
                Check your job status on the{" "}
                <a href="/history" className="text-blue-400 hover:underline">
                  Job History
                </a>{" "}
                page — failed jobs are clearly marked
              </li>
              <li>
                Email us at{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-400 hover:underline">
                  {SUPPORT_EMAIL}
                </a>{" "}
                with:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Your registered email address</li>
                  <li>Job ID (visible on the Job History page)</li>
                  <li>Payment transaction ID (from your email receipt)</li>
                  <li>Brief description of the issue</li>
                </ul>
              </li>
              <li>
                We will review your request within{" "}
                <strong className="text-foreground/80">2 business days</strong> and
                confirm eligibility
              </li>
            </ol>
          </Section>

          <Section title="7. Disputes">
            <p>
              If you believe a refund was incorrectly denied, you may escalate
              by replying to your refund email thread. We commit to resolving all
              disputes within 7 business days.
            </p>
            <p>
              For payment disputes, you may also contact Razorpay's customer support
              directly if the issue is payment-gateway related.
            </p>
            <p>
              Payments are processed securely via Razorpay (PCI-DSS compliant).
              LePrint does not store card or UPI details.
            </p>
          </Section>

          <Section title="8. Contact">
            <div className="p-4 bg-muted/30 rounded-lg text-sm">
              <p className="font-medium text-foreground/80">{BRAND} Support</p>
              <p>
                Email:{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-blue-400 hover:underline"
                >
                  {SUPPORT_EMAIL}
                </a>
              </p>
              <p>Response time: within 2 business days</p>
              <p>Address: 123 Business Street, Hyderabad, Telangana 500001, India</p>
            </div>
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
