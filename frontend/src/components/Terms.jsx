// src/components/Terms.jsx
import { useEffect } from "react";
import Footer from "./Footer";
import PublicNavbar from "./PublicNavbar";

const BRAND = "LePrint";
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

export default function Terms() {
  useEffect(() => {
    document.title = "Terms of Service — LePrint";
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
            Terms <span className="font-bold">of Service</span>
          </h1>
          <p className="text-sm text-muted-foreground/40 font-medium">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.05] rounded-[2.5rem] shadow-2xl shadow-black/50 p-8 md:p-16">
          <Section title="1. Agreement to Terms">
            <p>
              By accessing or using the services provided by {BRAND} ("we", "us",
              or "our"), including our kiosks and website (
              <a href="https://leprint.in" className="text-blue-400/80 underline decoration-white/20 underline-offset-4 hover:text-white transition-colors">
                leprint.in
              </a>
              ), you agree to be bound by these Terms of Service. If you do not
              agree, do not use our services.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              {BRAND} provides self-service cloud printing, scanning, and
              photocopy solutions via automated kiosks. Users upload
              documents via our web interface and execute jobs at physical kiosk
              locations.
            </p>
          </Section>

          <Section title="3. User Accounts">
            <p>
              To use certain features, you must sign in via Google OAuth. You are
              responsible for maintaining the security of your authentication
              session and for all activities that occur under your account. We
              reserve the right to suspend accounts that violate these terms.
            </p>
          </Section>

          <Section title="4. File Uploads and Content">
            <p>
              You retain ownership of any documents you upload. However, by
              uploading, you grant us a temporary, limited license to process,
              store, and transmit the files solely for the purpose of fulfilling
              your print/scan request.
            </p>
            <p className="font-bold text-white mt-4">Prohibited Content:</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {[
                "Illegal or infringing materials",
                "Pornographic or highly offensive content",
                "Malicious software or code",
                "Documents violating local laws"
              ].map((item, i) => (
                <li key={i} className="flex gap-3 items-center p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="5. Pricing and Payments">
            <p>
              Pricing for services is displayed at the time of job configuration.
              All payments are processed via our partner gateway (Razorpay).
            </p>
            <div className="overflow-hidden rounded-2xl border border-white/[0.05] bg-[#0c0c0c]/50 my-8">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/[0.04] border-b border-white/[0.08]">
                  <tr>
                    <th className="px-6 py-4 font-bold text-foreground">Service</th>
                    <th className="px-6 py-4 font-bold text-foreground">Pricing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  <tr>
                    <td className="px-6 py-4 text-muted-foreground">Printing / Scanning / Photocopy Services</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      Pricing varies based on paper type, colour mode, page count, and kiosk location.
                      Final charges are displayed before payment confirmation.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground/60 italic">
              Final price is calculated and displayed before payment. No hidden charges.
            </p>
          </Section>

          <Section title="6. Refund Policy">
            <p>
              Refunds are issued only for technical failures (e.g., job failed to
              print, kiosk paper jam). We do not issue refunds for user errors
              (e.g., uploading wrong file). Please refer to our full{" "}
              <a href="/refund-policy" className="text-blue-400/80 underline decoration-white/20 underline-offset-4 hover:text-white transition-colors">
                Refund & Cancellation Policy
              </a>{" "}
              for details.
            </p>
          </Section>

          <Section title="7. Data Privacy">
            <p>
              Your privacy is important to us. Our{" "}
              <a href="/privacy-policy" className="text-blue-400/80 underline decoration-white/20 underline-offset-4 hover:text-white transition-colors">
                Privacy Policy
              </a>{" "}
              explains how we handle your personal data and protect your privacy
              when you use our Services.
            </p>
          </Section>

          <Section title="8. Intellectual Property">
            <p>
              The {BRAND} name, logo, software, and kiosk hardware design are the
              exclusive property of {BRAND}. You may not copy, modify, or reverse
              engineer any part of our service.
            </p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, {BRAND} shall not be liable
              for any indirect, incidental, special, consequential, or punitive
              damages, including loss of data or profits, arising from your use
              of the service.
            </p>
          </Section>

          <Section title="10. Disclaimer of Warranties">
            <p>
              Services are provided "as is" and "as available" without any
              warranties of any kind, whether express or implied, including
              merchantability or fitness for a particular purpose.
            </p>
          </Section>

          <Section title="11. Indemnification">
            <p>
              You agree to indemnify and hold harmless {BRAND} and its employees
              from any claims or damages resulting from your violation of these
              terms or misuse of the service.
            </p>
          </Section>

          <Section title="12. Governing Law">
            <p>
              These terms are governed by the laws of India. Any disputes shall
              be subject to the exclusive jurisdiction of the courts in Bangalore,
              Karnataka.
            </p>
          </Section>

          <Section title="13. Changes to Terms">
            <p>
              We may update these terms from time to time. Your continued use of
              the service after changes constitutes acceptance of the new terms.
            </p>
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
