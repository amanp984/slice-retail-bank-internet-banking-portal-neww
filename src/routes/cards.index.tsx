import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { Wifi, ShoppingBag, ShoppingCart, Store, Banknote, UtensilsCrossed, ShieldCheck, Headphones } from "lucide-react";

export const Route = createFileRoute("/cards/")({
  head: () => ({
    meta: [
      { title: "My Cards — Slice Bank" },
      { name: "description", content: "View and manage your Slice Bank debit and credit cards." },
    ],
  }),
  component: Cards,
});

const txns = [
  { date: "25 December 2025, 10:45 AM", icon: ShoppingBag, desc: "Online Purchase", merchant: "Amazon India", amount: 1299 },
  { date: "21 May 2024, 07:32 PM", icon: Store, desc: "POS Transaction", merchant: "Reliance Smart", amount: 2450 },
  { date: "20 May 2024, 06:15 PM", icon: ShoppingCart, desc: "Online Purchase", merchant: "Flipkart", amount: 3899 },
  { date: "19 May 2024, 03:20 PM", icon: Banknote, desc: "ATM Withdrawal", merchant: "HDFC Bank ATM", amount: 5000 },
  { date: "18 May 2024, 11:05 AM", icon: UtensilsCrossed, desc: "Online Purchase", merchant: "Zomato", amount: 450 },
];

function Cards() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold">My Cards</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">View and manage your card details, limits and transactions</p>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-7">
          <motion.div whileHover={{ y: -3, rotate: -0.5 }}
            className="rounded-2xl p-6 bg-card-gradient text-white shadow-card relative overflow-hidden aspect-[16/10] max-w-md">
            <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.25), transparent 50%)" }} />
            <div className="flex items-start justify-between relative">
              <span className="px-2 py-1 text-[10px] bg-white/15 rounded">Primary Card</span>
              <div className="text-right">
                <div className="text-lg font-bold italic">slice</div>
                <div className="text-[10px] tracking-widest">BANK</div>
              </div>
            </div>
            <div className="mt-6 relative">
              <div className="text-2xl font-bold italic">VISA</div>
              <div className="text-xs opacity-90">Platinum Debit</div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-10 h-7 rounded bg-gradient-to-br from-amber-300 to-amber-500" />
              <Wifi className="w-5 h-5 rotate-90 opacity-90 ml-auto" />
            </div>
            <div className="mt-3 tracking-[0.3em] text-base font-medium">**** **** **** 4587</div>
            <div className="mt-4 flex justify-between text-[10px] uppercase opacity-90">
              <div><div>Card Holder</div><div className="text-sm font-semibold tracking-wider mt-1">​SONI TELECO</div></div>
              <div><div>Valid Thru</div><div className="text-sm font-semibold mt-1">11/18</div></div>
            </div>
          </motion.div>
          <div className="flex items-center gap-2 mt-4 text-sm">
            <span className="w-2 h-2 rounded-full" style={{ background: "var(--success)" }} />
            <span className="text-foreground">Card is Active</span>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-5">
          <div className="rounded-2xl p-6 bg-accent/40 border border-accent">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-primary">Enjoy Secure Payments</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Your card is protected with advanced security features for safe banking.</p>
                <button className="mt-3 text-xs font-semibold text-primary hover:underline">Know More →</button>
              </div>
              <ShieldCheck className="w-10 h-10 text-primary/70" />
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
            <h3 className="font-bold">Need Help?</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">If your card is lost or stolen, block it immediately.</p>
            <Link to="/cards/block-card" className="w-full mt-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition flex items-center justify-center gap-2 active:scale-[0.98]">
              <ShieldCheck className="w-4 h-4" /> Block My Card
            </Link>
            <Link to="/help" className="w-full mt-2 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-accent/40 transition flex items-center justify-center gap-2">
              <Headphones className="w-4 h-4 text-primary" /> Report an Issue
            </Link>
          </div>
        </div>

        <div className="col-span-12 bg-card rounded-2xl p-6 shadow-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Recent Card Transactions</h2>
            <a className="text-sm font-semibold text-primary cursor-pointer">View All</a>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left font-medium pb-2">Date & Time</th>
                <th className="text-left font-medium pb-2">Description</th>
                <th className="text-left font-medium pb-2">Merchant</th>
                <th className="text-right font-medium pb-2">Amount (₹)</th>
                <th className="text-right font-medium pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {txns.map((t, i) => (
                <tr key={i} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
                  <td className="py-3">{t.date}</td>
                  <td className="py-3"><span className="inline-flex items-center gap-2"><t.icon className="w-4 h-4 text-primary" /> {t.desc}</span></td>
                  <td className="py-3">{t.merchant}</td>
                  <td className="py-3 text-right text-foreground">{new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(t.amount)}</td>
                  <td className="py-3 text-right"><span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-semibold">Successful</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground mt-4">Slice Bank Internet Banking is safe, secure and easy to use. Do not share your password, OTP or card details with anyone.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
