import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, Mail, Clock, MessageCircle, Search, ChevronDown, FileText, ShieldAlert,
  CreditCard, Landmark, ArrowLeftRight, AlertOctagon, Download, ArrowUpRight, LifeBuoy,
  Headphones, TicketCheck, FileWarning, Banknote, Bot, Send
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [
    { title: "Help & Support — Slice Bank" },
    { name: "description", content: "24x7 enterprise banking support from Slice Bank — tickets, disputes, FAQs and more." },
  ] }),
  component: HelpPage,
});

const categories = [
  { i: ArrowLeftRight, t: "Transfer Issues", d: "IMPS / NEFT / RTGS failures, pending transfers" },
  { i: CreditCard, t: "Card Support", d: "Block, replace, dispute or activate cards" },
  { i: AlertOctagon, t: "Transaction Dispute", d: "Raise dispute on an unauthorized transaction" },
  { i: Landmark, t: "Loan Support", d: "EMI, foreclosure, statement & loan queries" },
  { i: ShieldAlert, t: "Fraud / Security", d: "Suspicious activity, account compromise" },
  { i: FileText, t: "Account Services", d: "Statements, chequebook, KYC, nominee" },
];

const faqs = [
  { q: "How do I reset my internet banking password?", a: "Go to Profile & Settings → Security → Reset Password. You'll need to verify with OTP sent to your registered mobile number." },
  { q: "What is the daily IMPS transfer limit?", a: "The default IMPS daily limit is ₹2,00,000. You can manage limits under Transfers → Account Limits." },
  { q: "How long does NEFT take to process?", a: "NEFT is processed in half-hourly batches, typically completed within 30 minutes during banking hours." },
  { q: "How can I block my debit card immediately?", a: "Go to Cards → Block My Card and verify with OTP. Your card will be blocked instantly across all channels." },
  { q: "How do I raise a transaction dispute?", a: "Use the Raise Dispute action below within 60 days of the disputed transaction. Provide details and supporting documents if any." },
  { q: "Is my data secure with Slice Bank?", a: "All data is encrypted with 256-bit SSL and stored as per RBI guidelines. We never share your information with third parties." },
];

const tickets = [
  { id: "TKT2024-1872", subject: "NEFT to vendor pending", cat: "Transfers", status: "In Progress", date: "21 May 2024", color: "bg-amber-100 text-amber-700" },
  { id: "TKT2024-1791", subject: "Debit card chip damaged", cat: "Cards", status: "Resolved", date: "18 May 2024", color: "bg-emerald-100 text-emerald-700" },
  { id: "TKT2024-1683", subject: "Statement download error", cat: "Accounts", status: "Closed", date: "12 May 2024", color: "bg-slate-100 text-slate-700" },
];

const escalation = [
  { l: "L1", t: "Customer Care Executive", e: "support@slice.bank", h: "Response within 24 hrs" },
  { l: "L2", t: "Branch Service Manager", e: "branch.head@slice.bank", h: "Response within 48 hrs" },
  { l: "L3", t: "Nodal Officer", e: "nodal.officer@slice.bank", h: "Response within 7 days" },
  { l: "L4", t: "Principal Nodal Officer", e: "po.nodal@slice.bank", h: "Response within 10 days" },
];

const forms = [
  { t: "Transaction Dispute Form", s: "PDF · 124 KB" },
  { t: "Chequebook Request Form", s: "PDF · 86 KB" },
  { t: "Nominee Update Form", s: "PDF · 102 KB" },
  { t: "Address Change Form", s: "PDF · 96 KB" },
  { t: "Account Closure Form", s: "PDF · 158 KB" },
];

function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <DashboardLayout showGreeting>
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Help & Support Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Enterprise-grade banking support, 24x7. We're here for every question.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> All systems operational
          </span>
        </div>
      </div>

      {/* Hero search */}
      <div className="rounded-2xl bg-card-gradient text-white p-6 shadow-card relative overflow-hidden">
        <LifeBuoy className="absolute -right-4 -top-4 w-32 h-32 text-white/10" />
        <h2 className="text-lg font-bold">How can we help you today?</h2>
        <p className="text-sm opacity-85 mt-1">Search FAQs, raise a ticket, or chat with our banking assistant.</p>
        <div className="mt-4 flex items-center gap-2 bg-white rounded-xl px-4 py-3 max-w-xl">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for help, e.g. block card, NEFT delay, statement"
            className="flex-1 text-sm text-foreground outline-none bg-transparent" />
          <button className="text-xs font-semibold text-primary">Search</button>
        </div>
      </div>

      {/* Quick contact */}
      <div className="grid md:grid-cols-4 gap-4 mt-5">
        {[
          { I: Phone, t: "24x7 Helpline", v: "1800 572 9999", s: "Toll-free in India" },
          { I: Mail, t: "Email Support", v: "support@slice.bank", s: "Reply in 24 hrs" },
          { I: MessageCircle, t: "Chat with Us", v: "Live Banking Assistant", s: "Avg wait < 1 min" },
          { I: Clock, t: "Branch Timings", v: "Mon - Sat · 10am - 4pm", s: "24x7 ATM access" },
        ].map(({ I, t, v, s }) => (
          <motion.div key={t} whileHover={{ y: -3 }} className="bg-card rounded-2xl p-5 shadow-card border border-border">
            <div className="w-10 h-10 rounded-full bg-accent text-primary grid place-items-center mb-3"><I className="w-5 h-5" /></div>
            <div className="text-xs text-muted-foreground">{t}</div>
            <div className="font-semibold mt-0.5">{v}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{s}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5 mt-5">
        <div className="col-span-12 lg:col-span-8 space-y-5">
          {/* Support categories */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <h2 className="font-bold mb-4">Support Categories</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((c) => (
                <motion.button whileHover={{ y: -2 }} key={c.t}
                  className="text-left p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-secondary/40 transition">
                  <div className="w-9 h-9 rounded-lg bg-accent text-primary grid place-items-center mb-2"><c.i className="w-4 h-4" /></div>
                  <div className="font-semibold text-sm">{c.t}</div>
                  <div className="text-xs text-muted-foreground mt-1">{c.d}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <h2 className="font-bold mb-4">Frequently Asked Questions</h2>
            <div className="divide-y divide-border">
              {faqs.map((f, i) => (
                <div key={i}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between py-3.5 text-left">
                    <span className="font-semibold text-sm">{f.q}</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaq === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden">
                        <p className="text-sm text-muted-foreground pb-4 leading-relaxed">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction dispute */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="font-bold flex items-center gap-2"><FileWarning className="w-4 h-4 text-destructive" /> Transaction Dispute</h2>
                <p className="text-xs text-muted-foreground mt-1">Report unauthorized or incorrect transactions within 60 days.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input placeholder="Transaction Reference ID" className="px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:border-primary" />
              <input placeholder="Disputed Amount (₹)" className="px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:border-primary" />
              <select className="sm:col-span-2 px-3 py-2.5 rounded-lg border border-border bg-white text-sm">
                <option>Reason — Unauthorized transaction</option>
                <option>Reason — Duplicate debit</option>
                <option>Reason — Merchant did not deliver</option>
                <option>Reason — Incorrect amount</option>
              </select>
              <textarea placeholder="Describe the issue…" rows={3} className="sm:col-span-2 px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:border-primary" />
            </div>
            <button className="mt-4 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110">Raise Dispute</button>
          </div>

          {/* Support ticket history */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2"><TicketCheck className="w-4 h-4 text-primary" /> Support Ticket History</h2>
              <button className="text-xs font-semibold text-primary hover:underline">+ New Ticket</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border">
                    <th className="text-left font-medium pb-2">Ticket ID</th>
                    <th className="text-left font-medium pb-2">Subject</th>
                    <th className="text-left font-medium pb-2">Category</th>
                    <th className="text-left font-medium pb-2">Date</th>
                    <th className="text-right font-medium pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
                      <td className="py-3 font-semibold text-primary">{t.id}</td>
                      <td className="py-3">{t.subject}</td>
                      <td className="py-3 text-muted-foreground">{t.cat}</td>
                      <td className="py-3 text-muted-foreground">{t.date}</td>
                      <td className="py-3 text-right"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${t.color}`}>{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-5">
          {/* Emergency */}
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
            <div className="flex items-center gap-2 text-destructive font-bold">
              <ShieldAlert className="w-5 h-5" /> Emergency Banking Support
            </div>
            <p className="text-xs text-foreground/80 mt-2 leading-relaxed">For fraud, lost card or unauthorized access, contact our 24x7 emergency line immediately.</p>
            <div className="mt-3 text-base font-bold text-destructive">1800 200 0000</div>
            <Link to="/cards/block-card" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-destructive hover:underline">
              Block your card now <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Downloadable forms */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <h3 className="font-bold flex items-center gap-2"><Download className="w-4 h-4 text-primary" /> Downloadable Forms</h3>
            <ul className="mt-3 divide-y divide-border">
              {forms.map((f) => (
                <li key={f.t} className="flex items-center justify-between py-2.5 text-sm hover:text-primary cursor-pointer">
                  <div>
                    <div className="font-medium">{f.t}</div>
                    <div className="text-[11px] text-muted-foreground">{f.s}</div>
                  </div>
                  <Download className="w-4 h-4 text-muted-foreground" />
                </li>
              ))}
            </ul>
          </div>

          {/* Escalation matrix */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <h3 className="font-bold">Escalation Matrix</h3>
            <p className="text-xs text-muted-foreground mt-1">Reach the right team if your issue is not resolved.</p>
            <ol className="mt-3 space-y-3">
              {escalation.map((e) => (
                <li key={e.l} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent text-primary grid place-items-center font-bold text-xs shrink-0">{e.l}</div>
                  <div className="text-sm">
                    <div className="font-semibold">{e.t}</div>
                    <div className="text-[11px] text-primary">{e.e}</div>
                    <div className="text-[11px] text-muted-foreground">{e.h}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Loan/Transfer/Card support shortcuts */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <h3 className="font-bold">Quick Support Channels</h3>
            <ul className="mt-3 divide-y divide-border">
              {[
                { i: Banknote, l: "Loan & EMI Support", s: "loans@slice.bank" },
                { i: ArrowLeftRight, l: "Transfer / IMPS Issues", s: "transfers@slice.bank" },
                { i: CreditCard, l: "Card Blocking / Replacement", s: "cards@slice.bank" },
                { i: Headphones, l: "Premium Banking Desk", s: "priority@slice.bank" },
              ].map(({ i: I, l, s }) => (
                <li key={l} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="flex items-center gap-3"><I className="w-4 h-4 text-primary" /> {l}</span>
                  <span className="text-[11px] text-muted-foreground">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Chatbot widget */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[340px] bg-card rounded-2xl shadow-2xl border border-border z-50 overflow-hidden">
            <div className="bg-card-gradient text-white px-4 py-3 flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <div>
                <div className="font-bold text-sm">Slice Assistant</div>
                <div className="text-[10px] opacity-85">Online · usually replies in 30s</div>
              </div>
            </div>
            <div className="h-64 p-4 overflow-y-auto bg-secondary/30 space-y-2 text-sm">
              <div className="bg-card rounded-xl px-3 py-2 max-w-[80%] shadow-sm">Hi ​AKASH T PR 👋 How can I help you today?</div>
              <div className="bg-card rounded-xl px-3 py-2 max-w-[80%] shadow-sm">You can ask about transfers, cards, statements or loans.</div>
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <input placeholder="Type your message…" className="flex-1 px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary" />
              <button className="p-2 rounded-lg bg-primary text-primary-foreground"><Send className="w-4 h-4" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={() => setChatOpen((s) => !s)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl grid place-items-center hover:brightness-110 transition active:scale-95 z-50">
        <MessageCircle className="w-6 h-6" />
      </button>
    </DashboardLayout>
  );
}
