import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, FileText } from "lucide-react";

export const Route = createFileRoute("/terms-and-conditions")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Slice Retail" },
      { name: "description", content: "Terms and conditions for using the Slice Retail digital platform services." },
    ],
  }),
  component: TermsPage,
});

const sections: { title: string; body: string }[] = [
  { title: "1. User Responsibilities", body: "By accessing the Slice Retail platform, you agree to provide accurate information, safeguard your credentials, and use the digital financial services responsibly. You are accountable for all activity performed under your account and must promptly report any unauthorised access." },
  { title: "2. Account Access Guidelines", body: "Access to your Retail Account Services is granted only upon successful verification of your username, password, and security challenge. Sharing credentials, automating sign-in, or attempting to bypass authentication is strictly prohibited and may lead to suspension of platform services." },
  { title: "3. Privacy and Security", body: "Slice Retail treats your information with the highest level of confidentiality. Personal and transactional data is processed only for the purpose of delivering Digital Financial Services and is protected with industry-standard encryption, access controls, and continuous monitoring." },
  { title: "4. Digital Usage Policy", body: "The platform is intended for lawful personal financial activities. You agree not to use the services for fraudulent transactions, money laundering, or any activity that violates applicable regulations. Slice Retail reserves the right to investigate suspicious behaviour and restrict access where necessary." },
  { title: "5. Payments and Transfers", body: "All money movement instructions submitted through the Retail Platform are processed on a best-effort basis subject to network availability, beneficiary validation, and transaction limits. You are responsible for verifying recipient details before confirming any payment or transfer." },
  { title: "6. Account Monitoring", body: "You are expected to review your account activity regularly. Any discrepancies, unauthorised debits, or unfamiliar transactions should be reported immediately through the support channels listed within the platform." },
  { title: "7. Statement Access", body: "Electronic statements are made available through the platform and may be downloaded as PDF or CSV. Statements reflect activity recorded up to the latest synchronisation and should be retained for your records." },
  { title: "8. Fraud Awareness", body: "Slice Retail will never request your password, full debit card number, OTP, or PIN through email, SMS, or phone. Treat such requests as fraudulent and report them through the official support channel without sharing any information." },
  { title: "9. Device & Browser Security", body: "Always access the platform from trusted devices and updated browsers. Avoid using public or shared computers. Enable device locks, install security updates, and sign out completely after each session." },
  { title: "10. OTP & Security Guidelines", body: "One-Time Passwords are personal, time-bound, and meant for single use. Never share an OTP with anyone, including persons claiming to represent Slice Retail. Expired or unused OTPs cannot be reused and a fresh code must be requested." },
  { title: "11. Service Availability", body: "The Retail Platform aims to remain available around the clock, however scheduled maintenance, upgrades, or unforeseen technical issues may temporarily limit access. Slice Retail will make reasonable efforts to communicate planned downtime in advance." },
  { title: "12. Contact & Support", body: "For assistance with platform services, account queries, or to report issues, please use the in-app help section. Authorised support representatives will only communicate through official channels and will never request sensitive credentials." },
  { title: "13. Limitation of Liability", body: "To the extent permitted by applicable law, Slice Retail is not liable for indirect, incidental, or consequential losses arising from use of the platform, third-party service interruptions, or events beyond its reasonable control." },
  { title: "14. Policy Updates", body: "These terms may be updated periodically to reflect new features, regulatory changes, or operational improvements. Continued use of the platform after an update constitutes acceptance of the revised terms." },
  { title: "15. User Consent", body: "By using Slice Retail, you confirm that you have read, understood, and agreed to these terms. If you do not agree with any part of these terms, you should discontinue use of the platform services." },
];

function TermsPage() {
  return (
    <div className="min-h-screen bg-secondary/40 flex flex-col">
      <header className="border-b border-border bg-white px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
        <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-destructive transition">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>
        <span className="h-6 w-px bg-border" />
        <span className="text-xl font-bold italic tracking-tight text-primary">slice</span>
        <div className="ml-auto text-[11px] text-muted-foreground hidden md:flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-success" /> Secured by 256-bit TLS
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-2xl shadow-card border border-border overflow-hidden">
          <div className="bg-destructive/10 px-6 sm:px-8 py-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-destructive text-destructive-foreground grid place-items-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Terms & Conditions</h1>
                <p className="text-sm text-muted-foreground">Please read these terms carefully before using Slice Retail platform services.</p>
              </div>
            </div>
          </div>

          <div className="px-6 sm:px-8 py-8 space-y-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              These Terms & Conditions govern your use of the Slice Retail digital platform and the Retail Account Services made available through it.
              By accessing the platform you acknowledge and agree to the following provisions.
            </p>

            {sections.map((s) => (
              <section key={s.title} className="bg-secondary/40 border border-border rounded-xl p-5">
                <h2 className="font-bold text-foreground text-sm sm:text-base">{s.title}</h2>
                <p className="text-sm text-foreground/80 leading-relaxed mt-2">{s.body}</p>
              </section>
            ))}

            <div className="text-center pt-4">
              <Link to="/" className="inline-block px-6 py-2.5 rounded-md bg-destructive text-destructive-foreground text-sm font-semibold hover:brightness-110 transition shadow-soft">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-destructive text-destructive-foreground text-center text-xs py-2">
        © 2026 Slice Retail. All Rights Reserved
      </footer>
    </div>
  );
}