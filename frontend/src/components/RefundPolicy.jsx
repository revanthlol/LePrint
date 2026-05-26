// src/components/RefundPolicy.jsx
import { useEffect } from "react";
import Footer from "./Footer";
import PublicNavbar from "./PublicNavbar";

const BRAND = "LePrint";
const SUPPORT_EMAIL = "support@leprint.in";
const LAST_UPDATED = "March 21, 2026";

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

function StatusBadge({ type, children }) {
  const styles = {
    eligible: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    ineligible: "bg-red-500/10 text-red-400 border-red-500/20",
    conditional: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border ${styles[type]}`}
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
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 pt-32 pb-20">
        <div className="mb-12">
          <span className="block text-[10px] md:text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold mb-4">LEGAL</span>
          <h1 className="text-4xl md:text-6xl font-light tracking-tight text-foreground mb-4">
            Refund &amp; <span className="font-bold">Cancellation Policy</span>
          </h1>
          <p className="text-sm text-muted-foreground/40 font-medium">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.05] rounded-[2.5rem] shadow-2xl shadow-black/50 p-8 md:p-16">
          {/* Quick reference table */}
          <div className="mb-12 p-8 bg-white/[0.02] rounded-3xl border border-white/[0.05]">
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60 mb-6 px-1">Quick Reference Guide</p>
            <div className="overflow-hidden rounded-2xl border border-white/[0.05] bg-[#0c0c0c]/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/[0.04] border-b border-white/[0.08]">
                    <th className="text-left px-6 py-5 font-bold text-foreground">Scenario</th>
                    <th className="text-left px-6 py-5 font-bold text-foreground">Eligibility Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {[
                    ["Job failed before printing started", "eligible", "✓ Full Refund"],
                    ["Job failed mid-print (partial output)", "conditional", "Partial Refund"],
                    ["Kiosk offline / out of paper after payment", "eligible", "✓ Full Refund"],
                    ["Print completed successfully", "ineligible", "✗ Not Eligible"],
                    ["User error (wrong file, wrong pages)", "ineligible", "✗ Not Eligible"],
                    ["User changed mind after payment", "ineligible", "✗ Not Eligible"],
                    ["Scan job failed (no output delivered)", "eligible", "✓ Full Refund"],
                    ["Duplicate payment (technical error)", "eligible", "✓ Full Refund"]
                  ].map(([scenario, type, label]) => (
                    <tr key={scenario} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-5 text-muted-foreground/90">{scenario}</td>
                      <td className="px-6 py-5">
                        <StatusBadge type={type}>{label}</StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Section title="1. Overview">
            <p>
              At {BRAND}, we want every transaction to be successful. This policy
              outlines when and how refunds are issued for print, scan, and
              photocopy services.
            </p>
            <p>
              Refunds are issued only when a job fails to complete due to a
              technical fault on our end or a kiosk-side issue. We do not offer
              refunds for completed jobs or for user errors.
            </p>
          </Section>

          <Section title="2. Eligible Refund Scenarios">
            <p>You are entitled to a full refund if:</p>
            <ul className="space-y-4 mt-6">
              {[
                "Your print, scan, or photocopy job is marked as FAILED by our system after exhausting all automatic retries.",
                "The kiosk goes offline or runs out of paper after your payment is confirmed and the job cannot be rescheduled.",
                "Your payment was charged but no job was created due to a payment gateway error or duplicate charge.",
                "A scan job completed but the scanned file was not delivered or available for download."
              ].map((item, i) => (
                <li key={i} className="flex gap-4">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-white/20 mt-3" />
                  <span className="text-muted-foreground/80">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 italic text-muted-foreground/60">
              Note: In the case of a mid-print failure (some pages printed, some did
              not), a partial refund proportional to the unprinted pages will be
              issued.
            </p>
          </Section>

          <Section title="3. Non-Eligible Scenarios">
            <p>Refunds will NOT be issued if:</p>
            <ul className="space-y-4 mt-6">
              {[
                "The job completed successfully and output was delivered.",
                "You uploaded the wrong file, selected the wrong settings, or changed your mind after the job began processing.",
                "The print quality issue is due to the source file quality (e.g., low-resolution images in the document).",
                "You were unable to collect the printout in time (timeout at kiosk)."
              ].map((item, i) => (
                <li key={i} className="flex gap-4">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-white/20 mt-3" />
                  <span className="text-muted-foreground/80">{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="4. Cancellation Policy">
            <p>
              Once payment is confirmed and a job enters the processing queue
              (status: <strong className="text-white">PAID</strong> or later),
              it cannot be cancelled. Please verify your document and settings
              before completing payment.
            </p>
            <p>
              If your job is still in <strong className="text-white">PENDING</strong>{" "}
              status and payment has not been confirmed, no charge has been applied.
            </p>
          </Section>

          <Section title="5. Refund Timeline">
            <p>
              Refunds are processed only after verification of transaction logs and kiosk job status.
              Approved refunds are then processed within{" "}
              <strong className="text-white">5–7 business days</strong> to the
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
            <ol className="space-y-6 mt-8">
              {[
                { step: "01", text: <span>Check your job status on the <a href="/history" className="text-blue-400/80 underline underline-offset-4 hover:text-white transition-colors">Job History</a> page — failed jobs are clearly marked.</span> },
                { step: "02", text: <span>Email us at <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-400/80 underline underline-offset-4 hover:text-white transition-colors">{SUPPORT_EMAIL}</a> with your Job ID, Payment ID, and registered email address.</span> },
                { step: "03", text: <span>We will review your request within <strong className="text-white">2 business days</strong> and confirm eligibility.</span> }
              ].map((item, i) => (
                <li key={i} className="flex gap-6">
                  <span className="shrink-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white tracking-widest">{item.step}</span>
                  <div className="pt-2 text-muted-foreground/90">{item.text}</div>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="7. Disputes">
            <p>
              If you believe a refund was incorrectly denied, you may escalate
              by replying to your refund email thread. We commit to resolving all
              disputes within 7 business days.
            </p>
          </Section>

          <Section title="8. Contact">
            <div className="mt-2 p-8 bg-white/[0.04] border border-white/[0.05] rounded-2xl shadow-inner">
              <p className="font-bold text-white text-lg mb-2">{BRAND} Support</p>
              <p className="mb-4">
                Email:{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-400/80 underline decoration-white/20 underline-offset-4 hover:text-white transition-colors">
                  {SUPPORT_EMAIL}
                </a>
              </p>
              <p className="text-xs text-muted-foreground/60 leading-relaxed uppercase tracking-widest font-bold">
                Response time: within 2 business days
              </p>
            </div>
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
