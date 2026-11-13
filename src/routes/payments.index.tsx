import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { Zap, Shield, Smartphone, Home, CreditCard, Droplet, Flame, History, Users, Bookmark, Repeat, Info, FileCheck2 } from "lucide-react";

export const Route = createFileRoute("/payments/")({
  head: () => ({
    meta: [
      { title: "Payments — Slice Bank" },
      { name: "description", content: "Pay your bills, utilities, EMIs and recharges seamlessly with Slice Bank." },
    { property: "og:title", content: "Payments — Slice Bank" }, { property: "og:description", content: "Pay your bills, utilities, EMIs and recharges seamlessly with Slice Bank." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }],
  }),
  component: Payments,
});

const cats = [
  { icon: Zap, title: "Electricity Bill Payment", desc: "Pay your electricity bills instantly and securely.", slug: "electricity" },
  { icon: FileCheck2, title: "GST Payment", desc: "Make GST payments quickly and hassle-free.", slug: "gst" },
  { icon: Shield, title: "Life Insurance Payment", desc: "Pay your life insurance premiums securely.", slug: "insurance" },
  { icon: Smartphone, title: "Mobile Bill Payment", desc: "Recharge your mobile number instantly.", slug: "mobile" },
  { icon: Home, title: "Home Loan Payment", desc: "Pay your home loan EMIs easily and on time.", slug: "home-loan" },
  { icon: CreditCard, title: "Credit Card Payment", desc: "Pay your credit card bills instantly and securely.", slug: "credit-card" },
  { icon: Droplet, title: "Water Bill Payment", desc: "Pay your water bills instantly and securely.", slug: "water" },
  { icon: Flame, title: "Gas Bill Payment", desc: "Pay your gas bills instantly and securely.", slug: "gas" },
];

const recent = [
  { date: "25 December 2025, 08:45 AM", cat: "Electricity", biller: "TATA Power Delhi", amount: 1249, txn: "PAYN5123456789" },
  { date: "21 May 2024, 07:30 PM", cat: "Mobile", biller: "Airtel Prepaid", amount: 299, txn: "PAYN5123456788" },
  { date: "20 May 2024, 11:15 AM", cat: "Credit Card", biller: "HDFC Bank Credit Card", amount: 25000, txn: "PAYN5123456787" },
  { date: "19 May 2024, 09:05 PM", cat: "Home Loan", biller: "SBI Home Loans", amount: 18500, txn: "PAYN5123456786" },
  { date: "18 May 2024, 10:10 AM", cat: "Insurance", biller: "LIC Premium", amount: 6753, txn: "PAYN5123456785" },
];

const catColor: Record<string, string> = {
  Electricity: "bg-purple-100 text-purple-700", Mobile: "bg-blue-100 text-blue-700",
  "Credit Card": "bg-pink-100 text-pink-700", "Home Loan": "bg-amber-100 text-amber-700",
  Insurance: "bg-green-100 text-green-700",
};

function Payments() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold">Payments</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">Choose a payment category to pay your bills and recharges instantly</p>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-9 grid grid-cols-2 md:grid-cols-4 gap-4">
          {cats.map((c) => (
            <motion.div key={c.title} whileHover={{ y: -3 }} className="bg-card rounded-2xl p-5 shadow-card border border-border text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary text-primary-foreground grid place-items-center mb-3">
                <c.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm">{c.title}</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{c.desc}</p>
              <Link to="/payments/$category" params={{ category: c.slug }} className="mt-3 inline-block text-xs font-semibold text-primary hover:underline">Pay Now →</Link>
            </motion.div>
          ))}

          <div className="col-span-2 md:col-span-4 bg-card rounded-2xl p-6 shadow-card border border-border mt-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Recent Payments</h2>
              <a className="text-sm font-semibold text-primary cursor-pointer">View All</a>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left font-medium pb-2">Date & Time</th>
                  <th className="text-left font-medium pb-2">Category</th>
                  <th className="text-left font-medium pb-2">Biller Name</th>
                  <th className="text-right font-medium pb-2">Amount (₹)</th>
                  <th className="text-right font-medium pb-2">Status</th>
                  <th className="text-right font-medium pb-2">Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r, i) => (
                  <tr key={i} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
                    <td className="py-3">{r.date}</td>
                    <td className="py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${catColor[r.cat]}`}>{r.cat}</span></td>
                    <td className="py-3">{r.biller}</td>
                    <td className="py-3 text-right text-foreground">{new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(r.amount)}</td>
                    <td className="py-3 text-right"><span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-semibold">Successful</span></td>
                    <td className="py-3 text-right text-muted-foreground">{r.txn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground mt-4">Slice Bank Internet Banking is safe, secure and easy to use. Do not share your password, OTP or card details with anyone.</p>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-5">
          <div className="rounded-2xl p-6 bg-card-gradient text-white shadow-card relative overflow-hidden">
            <FileCheck2 className="absolute right-4 top-4 w-20 h-20 text-white/15" />
            <h3 className="font-bold text-lg">Pay Bills Seamlessly</h3>
            <p className="text-xs opacity-90 mt-2 leading-relaxed">Fast, secure and convenient bill payments in just a few clicks.</p>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
            <h3 className="font-bold mb-2">Quick Actions</h3>
            <ul className="divide-y divide-border">
              {[{i: History, l: "View Payment History"}, {i: Users, l: "Manage Beneficiaries"}, {i: Bookmark, l: "Saved Billers"}, {i: Repeat, l: "Autopay Management"}].map(({i: I, l}) => (
                <li key={l} className="flex items-center justify-between py-3 text-sm cursor-pointer hover:text-primary">
                  <span className="flex items-center gap-3"><I className="w-4 h-4 text-primary" /> {l}</span>
                  <span className="text-muted-foreground">›</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
            <h3 className="font-bold flex items-center gap-2"><Info className="w-4 h-4 text-primary" /> Important Note</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Ensure correct biller details before making any payment. Transactions once processed cannot be reversed.</p>
            <button className="mt-3 text-xs font-semibold text-primary hover:underline">Know More →</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
