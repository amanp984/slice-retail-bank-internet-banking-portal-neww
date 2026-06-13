import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Landmark, Zap, Clock, ChevronDown, Plus, User, Users, History,
  BarChart3, Download, Info,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTransactions } from "@/hooks/useTransactions";
import { CUSTOMER } from "@/lib/customer";

const fmtINR = (n: number) =>
  "₹" + new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(Math.abs(n));

const maskAcct = (n: string) => {
  if (!n) return "";
  const last4 = n.slice(-4);
  return `XXXX XXXX ${last4}`;
};

export const Route = createFileRoute("/transfers/")({
  head: () => ({
    meta: [
      { title: "Payment Transfer — Slice Bank" },
      { name: "description", content: "Transfer money securely via IMPS, NEFT or RTGS with Slice Bank." },
    ],
  }),
  component: TransfersPage,
});

const modes = [
  { key: "IMPS", icon: Zap, sub: "Instant Transfer (24x7)" },
  { key: "NEFT", icon: Landmark, sub: "Standard Transfer" },
  { key: "RTGS", icon: Clock, sub: "High Value Transfer" },
];

const savedBeneficiaries = [
  { initials: "RA", name: "Rahul Sharma", bank: "HDFC Bank", acct: "XXXX XXXX 3842" },
  { initials: "NT", name: "Neha Tripathi", bank: "SBI Bank", acct: "XXXX XXXX 1122" },
  { initials: "VB", name: "Vijay Builders Pvt Ltd", bank: "Axis Bank", acct: "XXXX XXXX 3456" },
  { initials: "SA", name: "Sunita Agarwal", bank: "ICICI Bank", acct: "XXXX XXXX 8901" },
];

function TransfersPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("IMPS");
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [beneficiary, setBeneficiary] = useState<typeof savedBeneficiaries[number] | null>(null);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const { balance } = useTransactions(50);

  useEffect(() => {
    if (!dropOpen) return;
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => document.removeEventListener("mousedown", h);
  }, [dropOpen]);

  const onReview = () => {
    if (!beneficiary) return toast.error("Please select a beneficiary");
    if (!amount) return toast.error("Please enter an amount");
    navigate({
      to: "/transfers/verify",
      search: { name: beneficiary.name, bank: beneficiary.bank, acct: beneficiary.acct, amount, mode, remarks },
    });
  };


  return (
    <DashboardLayout showGreeting={false}>
      <h1 className="text-2xl font-bold">Payment Transfer</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">Transfer money securely to another account</p>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-8 space-y-5">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
            {/* From Account */}
            <div>
              <label className="text-sm font-semibold text-foreground">From Account</label>
              <div className="mt-2 flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/40 transition cursor-pointer">
                <div className="w-11 h-11 rounded-full bg-accent text-primary grid place-items-center">
                  <Landmark className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">Current Account</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{maskAcct(CUSTOMER.accountNumber)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Available Balance</div>
                  <div className="font-semibold">{fmtINR(balance)}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {/* Beneficiary */}
            <div>
              <label className="text-sm font-semibold text-foreground">Select Beneficiary</label>
              <div className="mt-2 grid grid-cols-[1fr_auto] gap-3">
                <div className="relative" ref={dropRef}>
                  <button
                    type="button"
                    onClick={() => setDropOpen((o) => !o)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border hover:border-primary/40 transition text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-accent text-primary grid place-items-center font-semibold text-xs">
                      {beneficiary ? beneficiary.initials : <User className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{beneficiary ? beneficiary.name : "Select Beneficiary"}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {beneficiary ? `${beneficiary.bank} • ${beneficiary.acct}` : "Choose a saved beneficiary"}
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition ${dropOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {dropOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl border border-border shadow-xl z-30 overflow-hidden"
                      >
                        <div className="max-h-72 overflow-y-auto py-1">
                          {savedBeneficiaries.map((b) => (
                            <button
                              key={b.name}
                              onClick={() => { setBeneficiary(b); setDropOpen(false); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-secondary/60 transition"
                            >
                              <div className="w-9 h-9 rounded-full bg-accent text-primary grid place-items-center font-semibold text-xs">{b.initials}</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-foreground truncate">{b.name}</div>
                                <div className="text-xs text-muted-foreground truncate">{b.bank} • {b.acct}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Link to="/transfers/managebeneficiaries"
                  className="px-4 rounded-xl border border-primary text-primary text-sm font-semibold hover:bg-accent transition flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add Beneficiary
                </Link>
              </div>
            </div>


            {/* Amount */}
            <div>
              <label className="text-sm font-semibold text-foreground">Amount (₹)</label>
              <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="Enter Amount"
                className="mt-2 w-full p-3.5 rounded-xl border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                <span>Min: ₹1.00 &nbsp;&nbsp; Max: ₹1,00,000.00</span>
                <span>Transaction Limit: ₹1,00,000.00</span>
              </div>
            </div>

            {/* Payment Mode */}
            <div>
              <label className="text-sm font-semibold text-foreground">Payment Mode</label>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                {modes.map((m) => {
                  const active = mode === m.key;
                  return (
                    <motion.button key={m.key} whileHover={{ y: -2 }} onClick={() => setMode(m.key)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition text-left
                        ${active ? "border-primary bg-accent/40" : "border-border hover:border-primary/30"}`}>
                      <div className={`w-5 h-5 rounded-full border-2 grid place-items-center
                        ${active ? "border-primary" : "border-border"}`}>
                        {active && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-accent text-primary grid place-items-center">
                        <m.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{m.key}</div>
                        <div className="text-xs text-muted-foreground">{m.sub}</div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="text-sm font-semibold text-foreground">Transaction Remarks (Optional)</label>
              <input value={remarks} onChange={(e) => setRemarks(e.target.value.slice(0, 40))}
                placeholder="Enter transaction remarks"
                className="mt-2 w-full p-3.5 rounded-xl border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                <span>Max 40 characters</span>
                <span>{remarks.length}/40</span>
              </div>
            </div>

            <div className="flex justify-end">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onReview}
                className="px-7 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:shadow-lg transition">
                Review & Confirm
              </motion.button>
            </div>
          </div>

          <div className="bg-accent/40 border border-accent rounded-xl p-4 flex items-center gap-3">
            <Info className="w-5 h-5 text-primary shrink-0" />
            <p className="text-xs text-foreground">Ensure all details are correct before proceeding with the payment transfer.</p>
          </div>
          <p className="text-xs text-muted-foreground text-center">Slice Bank Internet Banking is safe, secure and easy to use. Do not share your password, OTP or card details with anyone.</p>
        </div>

        {/* Right column */}
        <div className="col-span-12 lg:col-span-4 space-y-5">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <h3 className="font-bold mb-2">Quick Actions</h3>
            <ul className="divide-y divide-border">
              {[
                { i: Users, l: "Manage Beneficiaries", to: "/transfers/managebeneficiaries" },
                { i: History, l: "Transaction History", to: "/transactions" },
                { i: BarChart3, l: "Transfer Limits", to: "/transfers/transferlimit" },
                { i: Download, l: "Download Statement", to: "/transfers" },
              ].map(({ i: I, l, to }) => (
                <li key={l}>
                  <Link to={to} className="flex items-center justify-between py-3 text-sm hover:text-primary transition">
                    <span className="flex items-center gap-3"><I className="w-4 h-4 text-primary" /> {l}</span>
                    <span className="text-muted-foreground">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-accent/30 border border-accent rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-primary" />
              <h3 className="font-bold">Important Note</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">Ensure all transfer details are verified before processing the transaction.</p>
            <button className="mt-3 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">Know More →</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
