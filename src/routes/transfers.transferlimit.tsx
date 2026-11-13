import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ShieldCheck, Zap, Landmark, Clock, Pencil, Sliders, Timer, CalendarClock, TrendingUp, Info } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/transfers/transferlimit")({
  head: () => ({ meta: [{ title: "Account Limits — Slice Bank" }, { name: "description", content: "Account Limits in the Slice Bank test environment." }, { property: "og:title", content: "Account Limits — Slice Bank" }, { property: "og:description", content: "Account Limits in the Slice Bank test environment." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: TransferLimit,
});

const initial = [
  { key: "IMPS", sub: "Instant Transfer (24x7)", icon: Zap, limit: 2000000, used: 120000 },
  { key: "NEFT", sub: "Standard Bank Transfer", icon: Landmark, limit: 1500000, used: 250000 },
  { key: "RTGS", sub: "High Value Transfer", icon: Clock, limit: 1500000, used: 0 },
];

const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);

function TransferLimit() {
  const [rows, setRows] = useState(initial);
  const total = rows.reduce((s, r) => s + r.limit, 0);

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold">Account Limits</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">View and manage your daily transfer limits</p>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-9 space-y-5">
          <div className="bg-accent/30 border border-accent rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-card grid place-items-center shadow-sm">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary">Total Daily Transfer Limit (All Modes)</h3>
              <p className="text-xs text-muted-foreground mt-1">This is the maximum amount you can transfer per day across all modes.</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">₹{fmt(total)}</div>
              <div className="text-xs text-muted-foreground">Total Limit Per Day</div>
            </div>
            <button className="px-4 py-2 rounded-lg border border-primary text-primary text-sm font-semibold hover:bg-accent">Manage Overall Limit</button>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <h3 className="font-bold">Transfer Mode Limits</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-5">Set custom limits for each transfer mode. The total of all limits cannot exceed ₹50,00,000 per day.</p>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left font-medium pb-3">Transfer Mode</th>
                  <th className="text-left font-medium pb-3">Daily Limit (₹)</th>
                  <th className="text-left font-medium pb-3">Used Today (₹)</th>
                  <th className="text-left font-medium pb-3">Available (₹)</th>
                  <th className="text-right font-medium pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.key} className="border-b border-border/60 last:border-0">
                    <td className="py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent text-primary grid place-items-center"><r.icon className="w-4 h-4" /></div>
                        <div>
                          <div className="font-semibold">{r.key}</div>
                          <div className="text-xs text-muted-foreground">{r.sub}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5">
                      <div className="flex items-center gap-2">
                        <input value={fmt(r.limit)}
                          onChange={(e) => {
                            const v = Number(e.target.value.replace(/[^0-9]/g, "")) || 0;
                            setRows((p) => p.map((x, idx) => (idx === i ? { ...x, limit: v } : x)));
                          }}
                          className="w-32 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
                        <button className="p-1.5 hover:bg-secondary rounded-md"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      </div>
                    </td>
                    <td className="py-5">{fmt(r.used)}</td>
                    <td className="py-5">{fmt(r.limit - r.used)}</td>
                    <td className="py-5 text-right"><button className="text-sm font-semibold text-primary hover:underline">Adjust Limit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-5 p-4 rounded-xl bg-accent/40">
              <div className="text-sm font-semibold text-primary">Total Daily Limit (All Modes)</div>
              <div className="text-lg font-bold text-primary mt-1">₹{fmt(total)}</div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <h3 className="font-bold mb-4">Additional Limit Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { i: TrendingUp, t: "Increase Limit Request", s: "Request a higher limit for your account" },
                { i: Timer, t: "Temporary Limit Increase", s: "Increase limit for a limited period" },
                { i: Sliders, t: "Limit Reset Time", s: "Limits are reset every day at 12:00 AM" },
                { i: CalendarClock, t: "Holiday / Non-Banking Days", s: "IMPS available 24x7. NEFT/RTGS not available on holidays." },
              ].map((x) => (
                <button key={x.t} className="flex items-center gap-3 p-4 border border-border rounded-xl text-left hover:border-primary/40 hover:bg-secondary/40 transition">
                  <div className="w-10 h-10 rounded-full bg-accent text-primary grid place-items-center"><x.i className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{x.t}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{x.s}</div>
                  </div>
                  <span className="text-muted-foreground">›</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-accent/30 border border-accent rounded-xl p-4 flex items-center gap-3">
            <Info className="w-5 h-5 text-primary shrink-0" />
            <div>
              <div className="text-sm font-semibold text-primary">Important Note</div>
              <p className="text-xs text-muted-foreground mt-0.5">For your security, all limit changes are subject to verification. In case of suspicious activity, limits may be reduced temporarily.</p>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-5">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <h3 className="font-bold mb-3">Helpful Information</h3>
            <ul className="space-y-4">
              {[
                { i: Info, t: "Total limit is the maximum you can transfer per day across all modes." },
                { i: ShieldCheck, t: "Used amount includes all successful transfers done today." },
                { i: Sliders, t: "You can adjust individual limits as per your requirements." },
                { i: Clock, t: "Changes will be effective immediately." },
              ].map((x, i) => (
                <li key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent text-primary grid place-items-center shrink-0"><x.i className="w-3.5 h-3.5" /></div>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1.5">{x.t}</p>
                </li>
              ))}
            </ul>
            <button className="mt-4 text-xs font-semibold text-primary hover:underline">Know More →</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
