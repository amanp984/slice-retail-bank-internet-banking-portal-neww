import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { Banknote, TrendingUp, Calendar, Info, Plus } from "lucide-react";
import { useState } from "react";
import { InfoModal } from "@/components/InfoModal";

export const Route = createFileRoute("/fixeddeposits")({
  head: () => ({ meta: [{ title: "Fixed Deposits — Slice Bank" }, { name: "description", content: "Fixed Deposits in the Slice Bank test environment." }, { property: "og:title", content: "Fixed Deposits — Slice Bank" }, { property: "og:description", content: "Fixed Deposits in the Slice Bank test environment." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: FixedDepositsPage,
});

const deposits = [
  { id: "FD0033112025001", principal: 250000, rate: "7.25%", tenure: "24 Months", maturity: "₹2,88,562", date: "15 Mar 2027", status: "Active" },
  { id: "FD0033112024014", principal: 100000, rate: "6.90%", tenure: "12 Months", maturity: "₹1,06,900", date: "08 Aug 2026", status: "Active" },
  { id: "FD0033112024003", principal: 500000, rate: "7.50%", tenure: "36 Months", maturity: "₹6,21,500", date: "22 Jan 2028", status: "Active" },
];

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(n);

function FixedDepositsPage() {
  const [open, setOpen] = useState(false);

  const total = deposits.reduce((s, d) => s + d.principal, 0);

  return (
    <DashboardLayout showGreeting={false}>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Fixed Deposits</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your fixed deposit portfolio</p>
        </div>
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 shadow-sm">
          <Plus className="w-4 h-4" /> Open New FD
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        {[
          { l: "Total Deposits", v: `₹${fmt(total)}`, i: Banknote },
          { l: "Active FDs", v: deposits.length, i: TrendingUp },
          { l: "Next Maturity", v: "08 Aug 2026", i: Calendar },
        ].map((s) => (
          <div key={s.l} className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent grid place-items-center">
                <s.i className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{s.l}</div>
                <div className="font-bold text-foreground">{s.v}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mt-5">
        <h2 className="font-bold mb-4">My Fixed Deposits</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {deposits.map((d) => (
            <motion.div whileHover={{ y: -2 }} key={d.id}
              className="border border-border rounded-xl p-5 hover:border-primary/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{d.id}</span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">{d.status}</span>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">Principal</div>
              <div className="text-xl font-bold text-foreground">₹{fmt(d.principal)}</div>
              <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                <div><div className="text-muted-foreground">Interest Rate</div><div className="font-semibold">{d.rate}</div></div>
                <div><div className="text-muted-foreground">Tenure</div><div className="font-semibold">{d.tenure}</div></div>
                <div><div className="text-muted-foreground">Maturity Value</div><div className="font-semibold">{d.maturity}</div></div>
                <div><div className="text-muted-foreground">Maturity Date</div><div className="font-semibold">{d.date}</div></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-accent/30 border border-accent rounded-xl p-4 flex items-center gap-3 mt-5">
        <Info className="w-5 h-5 text-primary shrink-0" />
        <p className="text-xs text-foreground">Premature withdrawal of FDs may attract a penalty. Please visit your branch for assistance.</p>
      </div>

      <InfoModal
        open={open}
        onClose={() => setOpen(false)}
        title="New FD Booking Unavailable"
        message="Opening a new fixed deposit is currently unavailable through internet banking. Please visit your registered branch to proceed."
        cta="Okay"
        variant="warning"
      />
    </DashboardLayout>
  );
}
