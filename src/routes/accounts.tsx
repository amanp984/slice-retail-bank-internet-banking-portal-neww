import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { RestrictionModal } from "@/components/RestrictionModal";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Landmark, FileText, Download, Users, Gauge, ShieldCheck, Headphones,
  Info, ChevronRight, ArrowRight,
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";

const fmtINR = (n: number) =>
  "₹" + new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(Math.abs(n));

export const Route = createFileRoute("/accounts")({
  head: () => ({
    meta: [
      { title: "Accounts — Slice Bank" },
      { name: "description", content: "View and manage all your Slice Bank accounts." },
    ],
  }),
  component: AccountsPage,
});

type TabKey = "current" | "savings" | "od" | "loan";

const tabs: { key: TabKey; label: string; restricted?: "fd" | "loan" | "invest" }[] = [
  { key: "current", label: "Current Account" },
  { key: "savings", label: "Savings Account" },
  { key: "od", label: "OD Account" },
  { key: "loan", label: "Loan Account", restricted: "loan" },
];

const accountData = {
  current: {
    name: "Slice Current Account",
    subtitle: "Your primary business account",
    mask: "033311501061643",
    badge: "Primary Account",
    balance: "₹0.00",
    holder: "Mr Hariram Choudhary",
    number: "033311501061643",
    ifsc: "NESF0000333",
    type: "Current Account",
    branch: "Mumbai Corporate Branch",
    status: "Active",
    open: "25 December 2025",
  },
  savings: {
    name: "Slice Savings Account",
    subtitle: "Your everyday savings account",
    mask: "XXXX XXXX XXXX 2341",
    badge: "Linked Account",
    balance: "₹0.00",
    holder: "Mr Hariram Choudhary",
    number: "XXXX XXXX XXXX 2341",
    ifsc: "NESF0000333",
    type: "Savings Account",
    branch: "Mumbai Corporate Branch",
    status: "Active",
    open: "25 December 2025",
  },
  od: {
    name: "Slice Overdraft Account",
    subtitle: "Flexible overdraft facility",
    mask: "XXXX XXXX XXXX 9087",
    badge: "OD Facility",
    balance: "₹0.00",
    holder: "Mr Hariram Choudhary",
    number: "XXXX XXXX XXXX 9087",
    ifsc: "NESF0000333",
    type: "Overdraft Account",
    branch: "Mumbai Corporate Branch",
    status: "Active",
    open: "25 December 2025",
  },
};

const quickActions: { icon: any; label: string; to?: string }[] = [
  { icon: FileText, label: "View Account Statement" },
  { icon: Download, label: "Download Statement" },
  { icon: Users, label: "Manage Beneficiaries", to: "/transfers/managebeneficiaries" },
  { icon: Gauge, label: "Account Limits", to: "/transfers/transferlimit" },
];

function AccountsPage() {
  const [active, setActive] = useState<TabKey>("current");
  const [modal, setModal] = useState<null | "fd" | "loan" | "invest">(null);
  const [toast, setToast] = useState<string | null>(null);
  const { balance } = useTransactions(50);

  const baseData = accountData[active === "loan" || active === "savings" ? "current" : active];
  const data = active === "current" ? { ...baseData, balance: fmtINR(balance) } : baseData;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  return (
    <DashboardLayout showGreeting={false}>
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Accounts</h1>
        <p className="text-sm text-muted-foreground mt-1">View and manage all your bank accounts</p>

        {/* Tabs */}
        <div className="mt-6 bg-card rounded-xl border border-border px-2 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-8 overflow-x-auto">
            {tabs.map((t) => {
              const isActive = active === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    if (t.restricted) setModal(t.restricted);
                    else setActive(t.key);
                  }}
                  className={`relative py-4 px-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                  {isActive && (
                    <motion.span
                      layoutId="tab-underline"
                      className="absolute left-0 right-0 -bottom-px h-[3px] bg-primary rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mt-6">
          {/* Main account card */}
          <AnimatePresence mode="wait">
            {active === "savings" ? (
              <motion.div
                key="savings-empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="bg-card rounded-2xl border border-border shadow-sm p-10 text-center"
              >
                <div className="mx-auto w-14 h-14 rounded-full bg-accent grid place-items-center mb-4">
                  <Info className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-foreground">No Savings Account Linked</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
                  There are currently no savings accounts linked to your customer profile.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="bg-card rounded-2xl border border-border shadow-sm p-7"
              >
                <div>
                  <h2 className="text-lg font-bold text-foreground">{data.type === "Overdraft Account" ? "OD Account" : "Current Account"}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{data.subtitle}</p>
                </div>

                <div className="mt-6 flex items-start justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-accent grid place-items-center shrink-0">
                      <Landmark className="w-7 h-7 text-primary" strokeWidth={1.75} />
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{data.name}</div>
                      <div className="text-sm text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
                        <span>{data.mask}</span>
                        <span className="text-[11px] font-semibold text-primary bg-accent px-2 py-0.5 rounded">
                          {data.badge}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-muted-foreground">Available Balance</div>
                    <div className="text-2xl font-bold text-foreground mt-1">{data.balance}</div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3 bg-accent/60 text-foreground/80 text-sm rounded-lg px-4 py-3">
                  <Info className="w-4 h-4 text-primary shrink-0" />
                  You have no transactions in this account yet.
                </div>

                <div className="mt-6 divide-y divide-border">
                  {[
                    ["Account Holder Name", data.holder],
                    ["Account Number", data.number],
                    ["IFSC Code", data.ifsc],
                    ["Account Type", data.type],
                    ["Branch", data.branch],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between py-3.5 text-sm">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="text-foreground font-medium">{v}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-3.5 text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      {data.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3.5 text-sm">
                    <span className="text-muted-foreground">Open Date</span>
                    <span className="text-foreground font-medium">{data.open}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>


          {/* Right side */}
          <div className="space-y-5">
            <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
              <div className="font-bold text-foreground mb-2">Quick Actions</div>
              <div className="divide-y divide-border">
                {quickActions.map(({ icon: Icon, label, to }) => {
                  const inner = (
                    <span className="w-full flex items-center justify-between py-3 text-sm group transition hover:translate-x-0.5">
                      <span className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-accent grid place-items-center">
                          <Icon className="w-4 h-4 text-primary" />
                        </span>
                        <span className="text-foreground font-medium">{label}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition" />
                    </span>
                  );
                  return to ? (
                    <Link key={label} to={to} className="block">{inner}</Link>
                  ) : (
                    <button key={label} onClick={() => showToast(`${label} — feature unavailable in demo`)} className="w-full text-left">{inner}</button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-border p-5 bg-accent/50 relative overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="pr-2">
                  <div className="font-bold text-primary">Account Overview</div>
                  <p className="text-xs text-foreground/70 mt-2 leading-relaxed">
                    Manage your account efficiently and securely with Slice Bank.
                  </p>
                  <button
                    onClick={() => showToast("Opening overview…")}
                    className="mt-3 text-sm font-semibold text-primary inline-flex items-center gap-1.5 hover:gap-2.5 transition-all"
                  >
                    Learn More <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-12 h-12 rounded-full bg-white grid place-items-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="pr-2">
                  <div className="font-bold text-foreground">Need Help?</div>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Our support team is here to assist you with your account.
                  </p>
                  <button
                    onClick={() => showToast("Connecting to support…")}
                    className="mt-3 text-sm font-semibold text-primary inline-flex items-center gap-1.5 hover:gap-2.5 transition-all"
                  >
                    Contact Support <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent grid place-items-center shrink-0">
                  <Headphones className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Slice Bank Internet Banking is safe, secure and easy to use. Do not share your password, OTP or card details with anyone.
        </p>
      </div>

      <RestrictionModal kind={modal} onClose={() => setModal(null)} />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 bg-foreground text-background text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
