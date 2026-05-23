import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShieldCheck, CheckCircle2, AlertTriangle, Zap, FileCheck2, Shield, Smartphone, Home, CreditCard, Droplet, Flame } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/payments/$category")({
  head: ({ params }) => ({ meta: [{ title: `Pay ${params.category} — Slice Bank` }] }),
  component: PaymentForm,
});

type Field = { name: string; label: string; type?: "text" | "number" | "select"; placeholder?: string; options?: string[]; required?: boolean; pattern?: RegExp; help?: string };
type Config = { title: string; subtitle: string; icon: any; biller: string; fields: Field[] };

const CONFIGS: Record<string, Config> = {
  electricity: {
    title: "Electricity Bill Payment", subtitle: "Pay your electricity bill securely",
    icon: Zap, biller: "Electricity Board",
    fields: [
      { name: "consumer", label: "Consumer Number", required: true, placeholder: "Enter 10-12 digit consumer number", pattern: /^\d{8,14}$/ },
      { name: "state", label: "State", type: "select", required: true, options: ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Gujarat", "West Bengal"] },
      { name: "board", label: "Board / Provider", type: "select", required: true, options: ["TATA Power", "Adani Electricity", "BSES Rajdhani", "MSEB", "BESCOM", "TNEB"] },
      { name: "amount", label: "Amount (₹)", type: "number", required: true, placeholder: "Enter amount" },
    ],
  },
  gst: {
    title: "GST Payment", subtitle: "Pay your Goods & Services Tax",
    icon: FileCheck2, biller: "Goods & Services Tax",
    fields: [
      { name: "gstin", label: "GSTIN", required: true, placeholder: "15-character GSTIN", pattern: /^[0-9A-Z]{15}$/ },
      { name: "business", label: "Business Name", required: true },
      { name: "period", label: "Tax Period", type: "select", required: true, options: ["April 2026", "March 2026", "February 2026", "January 2026"] },
      { name: "amount", label: "Amount (₹)", type: "number", required: true },
    ],
  },
  insurance: {
    title: "Life Insurance Premium", subtitle: "Renew your life insurance policy",
    icon: Shield, biller: "Insurance Provider",
    fields: [
      { name: "policy", label: "Policy Number", required: true, placeholder: "Enter policy number" },
      { name: "provider", label: "Insurance Provider", type: "select", required: true, options: ["LIC India", "HDFC Life", "ICICI Prudential", "Max Life", "SBI Life", "Tata AIA"] },
      { name: "customer", label: "Customer Name", required: true },
      { name: "amount", label: "Premium Amount (₹)", type: "number", required: true },
    ],
  },
  mobile: {
    title: "Mobile Bill / Recharge", subtitle: "Recharge or pay your postpaid bill",
    icon: Smartphone, biller: "Mobile Operator",
    fields: [
      { name: "mobile", label: "Mobile Number", required: true, placeholder: "10-digit mobile", pattern: /^[6-9]\d{9}$/ },
      { name: "operator", label: "Operator", type: "select", required: true, options: ["Airtel", "Jio", "Vi (Vodafone Idea)", "BSNL", "MTNL"] },
      { name: "circle", label: "Circle", type: "select", required: true, options: ["Mumbai", "Delhi", "Karnataka", "Tamil Nadu", "Maharashtra", "UP East", "UP West"] },
      { name: "amount", label: "Amount (₹)", type: "number", required: true },
    ],
  },
  "home-loan": {
    title: "Home Loan EMI Payment", subtitle: "Pay your home loan EMI on time",
    icon: Home, biller: "Home Loan",
    fields: [
      { name: "loan", label: "Loan Account Number", required: true, placeholder: "Enter loan account number" },
      { name: "lender", label: "Lender", type: "select", required: true, options: ["SBI Home Loans", "HDFC Ltd", "ICICI Home Finance", "LIC HFL", "Axis Bank"] },
      { name: "amount", label: "EMI Amount (₹)", type: "number", required: true },
    ],
  },
  "credit-card": {
    title: "Credit Card Payment", subtitle: "Pay your credit card bill",
    icon: CreditCard, biller: "Credit Card",
    fields: [
      { name: "card", label: "Card Number", required: true, placeholder: "16-digit card number", pattern: /^\d{16}$/ },
      { name: "bank", label: "Bank Name", type: "select", required: true, options: ["HDFC Bank", "ICICI Bank", "SBI Card", "Axis Bank", "Kotak Bank", "American Express"] },
      { name: "amount", label: "Amount (₹)", type: "number", required: true },
    ],
  },
  water: {
    title: "Water Bill Payment", subtitle: "Pay your municipal water bill",
    icon: Droplet, biller: "Water Utility",
    fields: [
      { name: "consumer", label: "Consumer ID", required: true, placeholder: "Enter consumer ID" },
      { name: "area", label: "Area / Provider", type: "select", required: true, options: ["BMC Mumbai", "DJB Delhi", "BWSSB Bengaluru", "CMWSSB Chennai", "PMC Pune"] },
      { name: "amount", label: "Amount (₹)", type: "number", required: true },
    ],
  },
  gas: {
    title: "Gas Bill Payment", subtitle: "Pay your piped gas connection bill",
    icon: Flame, biller: "Gas Provider",
    fields: [
      { name: "consumer", label: "Consumer Number", required: true, placeholder: "Enter consumer number" },
      { name: "provider", label: "Gas Provider", type: "select", required: true, options: ["Indraprastha Gas (IGL)", "Mahanagar Gas (MGL)", "Adani Gas", "Gujarat Gas", "GAIL Gas"] },
      { name: "amount", label: "Amount (₹)", type: "number", required: true },
    ],
  },
};

function PaymentForm() {
  const { category } = Route.useParams();
  const nav = useNavigate();
  const cfg = CONFIGS[category];
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stage, setStage] = useState<"form" | "review" | "processing" | "success" | "failure">("form");

  const Icon = cfg?.icon;

  const txnId = useMemo(() => "PAYN" + Math.floor(Math.random() * 9e9 + 1e9), [stage]);

  if (!cfg) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold">Payment category not found</h1>
          <Link to="/payments" className="mt-4 inline-block text-primary font-semibold">← Back to Payments</Link>
        </div>
      </DashboardLayout>
    );
  }

  const validate = () => {
    const e: Record<string, string> = {};
    cfg.fields.forEach((f) => {
      const v = (values[f.name] || "").trim();
      if (f.required && !v) e[f.name] = `${f.label} is required`;
      else if (v && f.pattern && !f.pattern.test(v)) e[f.name] = `Invalid ${f.label}`;
      if (f.type === "number" && v && Number(v) <= 0) e[f.name] = "Enter a valid amount";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onReview = () => { if (validate()) setStage("review"); };
  const onConfirm = () => {
    setStage("processing");
    setTimeout(() => setStage(Math.random() > 0.05 ? "success" : "failure"), 1500);
  };

  return (
    <DashboardLayout>
      <Link to="/payments" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Payments
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground grid place-items-center">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{cfg.title}</h1>
          <p className="text-sm text-muted-foreground">{cfg.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-8 bg-card rounded-2xl border border-border shadow-sm p-7">
          {stage === "form" && (
            <>
              <h2 className="font-bold mb-4">Enter Payment Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {cfg.fields.map((f) => (
                  <div key={f.name} className={f.name === "amount" ? "md:col-span-2" : ""}>
                    <label className="text-xs font-semibold text-foreground">{f.label}{f.required && <span className="text-destructive ml-0.5">*</span>}</label>
                    {f.type === "select" ? (
                      <select value={values[f.name] || ""} onChange={(e) => setValues((p) => ({ ...p, [f.name]: e.target.value }))}
                        className={`mt-1.5 w-full px-3 py-2.5 rounded-lg border bg-white text-sm focus:outline-none focus:border-primary ${errors[f.name] ? "border-destructive" : "border-border"}`}>
                        <option value="">Select {f.label}</option>
                        {f.options!.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={f.type || "text"} value={values[f.name] || ""} placeholder={f.placeholder}
                        onChange={(e) => setValues((p) => ({ ...p, [f.name]: e.target.value }))}
                        className={`mt-1.5 w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-primary ${errors[f.name] ? "border-destructive" : "border-border"}`} />
                    )}
                    {errors[f.name] && <p className="text-[11px] text-destructive mt-1">{errors[f.name]}</p>}
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-accent/40 border border-accent flex gap-3 items-start">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">All payments are secured via 256-bit encryption. You'll be asked to confirm before debit.</p>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Link to="/payments" className="px-5 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-secondary">Cancel</Link>
                <button onClick={onReview} className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition active:scale-[0.98]">Review & Confirm →</button>
              </div>
            </>
          )}

          {stage === "review" && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="font-bold mb-4">Review Payment</h2>
              <div className="divide-y divide-border rounded-xl border border-border">
                {cfg.fields.map((f) => (
                  <div key={f.name} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-muted-foreground">{f.label}</span>
                    <span className="font-semibold text-foreground">{f.name === "amount" ? `₹${Number(values[f.name] || 0).toLocaleString("en-IN")}` : values[f.name]}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-3 text-sm bg-accent/30">
                  <span className="font-bold text-primary">Total Payable</span>
                  <span className="font-bold text-primary text-lg">₹{Number(values.amount || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setStage("form")} className="px-5 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-secondary">Edit</button>
                <button onClick={onConfirm} className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 active:scale-[0.98]">Confirm & Pay</button>
              </div>
            </motion.div>
          )}

          {stage === "processing" && (
            <div className="text-center py-16">
              <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-4 font-semibold">Processing your payment…</p>
              <p className="text-xs text-muted-foreground mt-1">Please do not refresh or close this window.</p>
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-5">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <h3 className="font-bold mb-3">Pay from</h3>
            <div className="rounded-xl border border-border p-3">
              <div className="text-xs text-muted-foreground">Current Account</div>
              <div className="font-semibold mt-0.5">​033311501068990</div>
              <div className="text-xs text-muted-foreground mt-2">Available Balance</div>
              <div className="font-bold text-primary">₹1,25,680.50</div>
            </div>
          </div>
          <div className="bg-accent/40 border border-accent rounded-2xl p-5">
            <h3 className="font-bold text-primary">Payment Tips</h3>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1.5 leading-relaxed">
              <li>• Double-check biller details before confirming</li>
              <li>• Payments cannot be reversed once processed</li>
              <li>• Keep transaction reference for your records</li>
            </ul>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {(stage === "success" || stage === "failure") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm grid place-items-center px-4">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 8 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-card rounded-2xl shadow-2xl border border-border max-w-md w-full p-7 text-center">
              {stage === "success" ? (
                <>
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 grid place-items-center mb-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold">Payment Successful</h3>
                  <p className="text-sm text-muted-foreground mt-1">₹{Number(values.amount || 0).toLocaleString("en-IN")} paid to {cfg.biller}</p>
                  <div className="mt-4 text-xs text-muted-foreground">Transaction ID: <span className="font-semibold text-foreground">{txnId}</span></div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 grid place-items-center mb-3">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="text-lg font-bold">Payment Failed</h3>
                  <p className="text-sm text-muted-foreground mt-1">We couldn't process this payment. No amount has been debited.</p>
                </>
              )}
              <div className="mt-6 flex gap-3 justify-center">
                <button onClick={() => nav({ to: "/payments" })} className="px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-secondary">Back to Payments</button>
                <button onClick={() => { setStage("form"); }} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110">{stage === "success" ? "Make Another" : "Try Again"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
