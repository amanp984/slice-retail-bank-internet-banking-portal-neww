import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftRight, Receipt, ConciergeBell, Download, Eye, EyeOff,
  FileText, FileType, MonitorPlay, Users, FileCheck2, Settings, ShieldCheck, Landmark, X, Info
} from "lucide-react";
import { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { formatDescription } from "@/lib/formatTxn";
import { downloadStatementPdf, downloadStatementCsv } from "@/lib/statement";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Slice Bank" },
      { name: "description", content: "Your Slice Bank account overview, balances, transactions and quick actions." },
    ],
  }),
  component: Dashboard,
});

const quick = [
  { icon: ArrowLeftRight, title: "Fund Transfer", desc: "Transfer money within Slice Bank or to other banks", cta: "Transfer Now", to: "/transfers" },
  { icon: Receipt, title: "Bill Payments", desc: "Pay your bills and recharges instantly", cta: "Pay Now", to: "/payments" },
  { icon: ConciergeBell, title: "Request Services", desc: "Cheque book, debit card, statement & more", cta: "Request Now", to: "/cards" },
  { icon: Download, title: "Download Statement", desc: "View and download your account statements", cta: "Download", to: "/dashboard" },
];

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(Math.abs(n));
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
const labelType = (t: "credit" | "debit") => (t === "credit" ? "Credit" : "Debit");

function Dashboard() {
  const [show, setShow] = useState(true);
  const navigate = useNavigate();
  const { txns, balance, loading } = useTransactions(50);
  const recent = txns.slice(0, 5);
  const balanceInt = Math.floor(balance);
  const balanceDec = (Math.abs(balance) % 1).toFixed(2).slice(1); // ".50"
  return (
    <DashboardLayout showGreeting>
      <div className="grid grid-cols-12 gap-5">
        {/* Balance card */}
        <motion.div whileHover={{ y: -2 }} className="col-span-12 lg:col-span-4 bg-card-gradient rounded-2xl p-5 text-white relative overflow-hidden shadow-card">
          <Landmark className="absolute -right-2 -top-2 w-20 h-20 text-white/10" />
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium">Current Account</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/15 text-[9px] font-semibold">Primary</span>
          </div>
          <div className="text-[11px] opacity-80 mt-0.5">​033311501068990</div>
          <div className="mt-4 text-[11px] opacity-90">Available Balance</div>
          <div className="flex items-center gap-2 mt-0.5 h-9">
            <AnimatePresence mode="wait" initial={false}>
              {show ? (
                <motion.span key={`v-${balance}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}
                  className="text-2xl font-bold tabular-nums">₹{new Intl.NumberFormat("en-IN").format(balanceInt)}<span className="text-sm">{balanceDec}</span></motion.span>
              ) : (
                <motion.span key="h" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}
                  className="text-2xl font-bold tracking-widest">₹ ••••••••</motion.span>
              )}
            </AnimatePresence>
            <button onClick={() => setShow((s) => !s)} aria-label={show ? "Hide balance" : "Show balance"}
              className="p-1 rounded-md hover:bg-white/15 transition active:scale-95">
              {show ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3 text-[11px]">
            <div><div className="opacity-80">Total Balance</div><div className="font-semibold text-sm">{show ? `₹${fmt(balance)}` : "₹ ••••••"}</div></div>
            <div><div className="opacity-80">Uncleared</div><div className="font-semibold text-sm">{show ? "₹0.00" : "₹ ••••"}</div></div>
          </div>
          <Link to="/accounts" className="inline-block mt-4 px-3.5 py-1.5 rounded-lg bg-white text-primary text-xs font-semibold hover:bg-white/90 transition active:scale-[0.98] shadow-sm">View Account Details</Link>
        </motion.div>

        {/* Quick actions */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quick.map((q) => (
            <motion.div key={q.title} whileHover={{ y: -3 }}
              className="bg-card rounded-2xl p-5 shadow-card border border-border text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary text-primary-foreground grid place-items-center mb-3">
                <q.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">{q.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{q.desc}</p>
              <Link to={q.to} className="inline-block mt-3 text-xs font-semibold text-primary hover:underline">{q.cta} →</Link>
            </motion.div>
          ))}
        </div>

        {/* Transactions */}
        <div className="col-span-12 lg:col-span-8 bg-card rounded-2xl p-6 shadow-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground">Recent Transactions</h2>
            <Link to="/transactions" className="text-sm font-semibold text-primary cursor-pointer">View All</Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left font-medium pb-2">Date</th>
                <th className="text-left font-medium pb-2">Description</th>
                <th className="text-left font-medium pb-2">Type</th>
                <th className="text-right font-medium pb-2">Amount (₹)</th>
                <th className="text-right font-medium pb-2">Balance (₹)</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {recent.map((t) => (
                  <motion.tr
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: -6, backgroundColor: "rgba(0,0,0,0.04)" }}
                    animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,0,0,0)" }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="border-b border-border/60 last:border-0 hover:bg-secondary/30"
                  >
                    <td className="py-3 text-foreground">{fmtDate(t.created_at)}</td>
                    <td className="py-3 text-foreground">{formatDescription(t)}</td>
                    <td className="py-3 text-muted-foreground">{labelType(t.type)}</td>
                    <td className="py-3 text-right font-medium text-foreground tabular-nums">
                      {t.type === "debit" ? "-" : "+"}{fmt(t.amount)}
                    </td>
                    <td className="py-3 text-right text-foreground">{fmt(t.balance_after_transaction)}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {!loading && recent.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No transactions yet</td></tr>
              )}
              {loading && recent.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Loading…</td></tr>
              )}
            </tbody>
          </table>
          <div className="text-center mt-4">
            <Link to="/transactions" className="text-sm font-semibold text-primary cursor-pointer">View All Transactions →</Link>
          </div>
        </div>

        {/* Download statement */}
        <div className="col-span-12 lg:col-span-4 bg-card rounded-2xl p-6 shadow-card border border-border">
          <h2 className="font-bold text-foreground">Download Statement</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Select account and period to download your statement</p>
          <label className="text-xs text-muted-foreground">Account</label>
          <select className="w-full mt-1 mb-3 px-3 py-2 rounded-lg border border-border text-sm bg-white">
            <option>Current Account - ​033311501068990</option>
          </select>
          <label className="text-xs text-muted-foreground">Select Period</label>
          <select className="w-full mt-1 mb-4 px-3 py-2 rounded-lg border border-border text-sm bg-white">
            <option>May 2024</option><option>April 2024</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            {[
              { Icon: FileType, label: "PDF", sub: "Download PDF", onClick: () => downloadStatementPdf(recent, balance) },
              { Icon: Eye, label: "View Statement", sub: "View Online", onClick: () => navigate({ to: "/transactions" }) },
              { Icon: FileText, label: "CSV", sub: "Download CSV", onClick: () => downloadStatementCsv(recent) },
              { Icon: MonitorPlay, label: "View Online", sub: "View Statement", onClick: () => navigate({ to: "/transactions" }) },
            ].map(({ Icon, label, sub, onClick }) => (
              <button key={label} onClick={onClick} className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-accent/40 transition text-left">
                <Icon className="w-5 h-5 text-primary" />
                <div><div className="text-xs font-semibold">{label}</div><div className="text-[10px] text-muted-foreground">{sub}</div></div>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-4 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Your statement password will be your DOB (DDMMYYYY)
          </p>
        </div>

        {/* Account summary */}
        <div className="col-span-12 lg:col-span-8 bg-card rounded-2xl p-6 shadow-card border border-border">
          <h2 className="font-bold text-foreground mb-4">Account Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              ["Account Type", "Current Account"],
              ["Account Number", "​033311501068990"],
              ["IFSC Code", "NESF0000333"],
              ["Branch", "Mumbai - Corporate Branch"],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-xs text-muted-foreground">{k}</div>
                <div className="font-medium text-foreground mt-1">{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-card rounded-2xl p-6 shadow-card border border-border">
          <h2 className="font-bold text-foreground mb-3">Quick Links</h2>
          <QuickLinks />
        </div>
      </div>
    </DashboardLayout>
  );
}

function QuickLinks() {
  const [chequeOpen, setChequeOpen] = useState(false);
  const items: { icon: any; label: string; to?: string; action?: () => void }[] = [
    { icon: Users, label: "Manage Beneficiaries", to: "/transfers/managebeneficiaries" },
    { icon: FileCheck2, label: "View Cheque Status", action: () => setChequeOpen(true) },
    { icon: ConciergeBell, label: "Service Request", to: "/help" },
    { icon: Settings, label: "Debit Card Controls", to: "/cards" },
  ];
  return (
    <>
      <ul className="divide-y divide-border">
        {items.map(({ icon: I, label, to, action }) => {
          const inner = (
            <span className="w-full flex items-center justify-between py-3 hover:text-primary text-sm transition group">
              <span className="flex items-center gap-3"><I className="w-4 h-4 text-primary" /> {label}</span>
              <span className="text-muted-foreground group-hover:translate-x-0.5 transition">›</span>
            </span>
          );
          return (
            <li key={label}>
              {to ? <Link to={to} className="block">{inner}</Link> : <button onClick={action} className="w-full text-left">{inner}</button>}
            </li>
          );
        })}
      </ul>

      <AnimatePresence>
        {chequeOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm grid place-items-center px-4"
            onClick={() => setChequeOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl shadow-2xl border border-border max-w-md w-full overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
                <h3 className="font-bold text-foreground flex items-center gap-2"><FileCheck2 className="w-5 h-5 text-primary" /> Cheque Status</h3>
                <button onClick={() => setChequeOpen(false)} className="p-1 hover:bg-secondary rounded-md"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-accent grid place-items-center mb-3">
                  <Info className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-bold text-foreground">No checkbook issued yet.</h4>
                <p className="text-sm text-muted-foreground mt-2">You haven't requested a chequebook on your account. Request one anytime via the service requests center.</p>
                <div className="mt-6 flex justify-center gap-3">
                  <button onClick={() => setChequeOpen(false)} className="px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-secondary">Close</button>
                  <Link to="/help" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110">Request Chequebook</Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
