// Demo/Test transaction description generator.
// Builds a detailed, mode-specific structured description from the admin's
// essential inputs. Nothing here is an official bank record — every output is
// marked DEMO/TEST and contains only the values the admin entered (no
// invented bank codes, IFSCs or UPI IDs).

export type DemoTxnInput = {
  type?: string | null; // credit | debit
  mode?: string | null; // UPI | IMPS | NEFT | RTGS | REFUND
  sender_name?: string | null; // beneficiary / sender name
  amount?: string | number | null;
  external_id?: string | null; // UTR / reference
  created_at?: string | null;
  upi_id?: string | null;
  beneficiary_account?: string | null;
  beneficiary_ifsc?: string | null;
};

export const maskAccount = (acc?: string | null) => {
  const s = String(acc ?? "").replace(/\s+/g, "");
  if (!s) return "";
  if (s.length <= 4) return `XXXX${s}`;
  return `${"X".repeat(Math.max(4, s.length - 4))}${s.slice(-4)}`;
};

const clean = (v?: string | number | null) =>
  String(v ?? "").replace(/\s+/g, " ").trim();

const upper = (v?: string | number | null) => clean(v).toUpperCase();

const compact = (v?: string | number | null) => upper(v).replace(/[^A-Z0-9]/g, "");

const formatAmount = (amount?: string | number | null) => {
  const n = Number(amount);
  if (!Number.isFinite(n) || !amount) return "";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

// Extracts the bank/handle part of a UPI ID (the part after "@").
// Only uses the handle the admin actually entered — nothing is invented.
const upiHandle = (vpa?: string | null) => {
  const s = clean(vpa);
  const at = s.indexOf("@");
  return at >= 0 ? s.slice(at + 1).toUpperCase() : "";
};

const CHANNEL: Record<string, string> = {
  UPI: "UPI P2P TRANSFER VIA NPCI UNIFIED PAYMENTS INTERFACE",
  IMPS: "IMPS P2A IMMEDIATE PAYMENT SERVICE VIA NPCI (AVAILABLE 24X7)",
  NEFT: "NEFT BATCH SETTLEMENT VIA RBI NATIONAL ELECTRONIC FUNDS TRANSFER",
  RTGS: "RTGS REAL-TIME GROSS SETTLEMENT VIA RBI (HIGH VALUE TRANSFER)",
  REFUND: "REFUND / REVERSAL PROCESSED BY ORIGINATING PARTY",
};

export function generateDemoDescription(input: DemoTxnInput): string {
  const isDebit = (input.type || "").toLowerCase() === "debit";
  const type = isDebit ? "DEBIT" : "CREDIT";
  const mode = upper(input.mode);
  const name = compact(input.sender_name) || "DEMOPARTY";
  const amt = formatAmount(input.amount);
  const ref = compact(input.external_id);
  const when = formatDate(input.created_at);

  const parts: string[] = [];

  if (mode === "REFUND") {
    // DEMO-REFUND-[REF]-[NAME]-...
    parts.push("DEMO", "REFUND", ref || "DEMOREF", name);
    if (amt) parts.push(`AMT-INR${compact(amt)}`);
    if (input.beneficiary_account) parts.push(`ORIG-AC-${maskAccount(input.beneficiary_account)}`);
    parts.push("REFUND-REVERSAL-PROCESSED-BY-ORIGINATING-PARTY");
    if (when) parts.push(`ON-${compact(when)}`);
  } else if (mode === "UPI") {
    // DEMO-UPI-[CREDIT/DEBIT]-[UTR]-[NAME]-[HANDLE]-[UPI ID]-[CHANNEL]
    parts.push("DEMO", "UPI", type);
    parts.push(ref || "DEMOREF");
    parts.push(name);
    const handle = upiHandle(input.upi_id);
    if (handle) parts.push(handle);
    if (clean(input.upi_id)) parts.push(`VPA-${compact(input.upi_id)}`);
    if (amt) parts.push(`AMT-INR${compact(amt)}`);
    parts.push(compact(CHANNEL.UPI));
    if (when) parts.push(`ON-${compact(when)}`);
  } else if (mode === "IMPS" || mode === "NEFT" || mode === "RTGS") {
    // DEMO-[MODE]-[CREDIT/DEBIT]-[UTR]-[NAME]-[MASKED AC]-[IFSC]-[AMT]-[CHANNEL]
    parts.push("DEMO", mode, type);
    parts.push(ref || "DEMOREF");
    parts.push(name);
    if (input.beneficiary_account) parts.push(`AC-${maskAccount(input.beneficiary_account)}`);
    if (clean(input.beneficiary_ifsc)) parts.push(`IFSC-${compact(input.beneficiary_ifsc)}`);
    if (amt) parts.push(`AMT-INR${compact(amt)}`);
    parts.push(compact(CHANNEL[mode]));
    if (when) parts.push(`ON-${compact(when)}`);
  } else {
    // Fallback for unknown / unset modes — still clearly DEMO.
    parts.push("DEMO", mode || "TRANSFER", type);
    parts.push(ref || "DEMOREF");
    parts.push(name);
    if (amt) parts.push(`AMT-INR${compact(amt)}`);
    parts.push(type === "CREDIT" ? "FUNDS-CREDITED-TO-ACCOUNT" : "FUNDS-DEBITED-FROM-ACCOUNT");
    if (when) parts.push(`ON-${compact(when)}`);
  }

  return (
    parts.filter(Boolean).join("-") +
    " | NOTE: SIMULATED DEMO/TEST ENTRY — NOT AN OFFICIAL BANK-GENERATED RECORD."
  );
}
