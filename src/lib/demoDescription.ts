// Demo/Test transaction description generator.
// Builds a detailed, mode-specific narrative from the admin's inputs.
// Nothing here is an official bank record — every output is marked DEMO/TEST.

export type DemoTxnInput = {
  type?: string | null; // credit | debit
  mode?: string | null; // UPI | IMPS | NEFT | RTGS
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

const CHANNEL: Record<string, string> = {
  UPI: "UPI P2P PUSH VIA NPCI UNIFIED PAYMENTS INTERFACE",
  IMPS: "IMPS P2A VIA NPCI IMMEDIATE PAYMENT SERVICE (24x7)",
  NEFT: "NEFT BATCH SETTLEMENT VIA RBI NATIONAL ELECTRONIC FUNDS TRANSFER",
  RTGS: "RTGS REAL-TIME GROSS SETTLEMENT VIA RBI (HIGH VALUE)",
  REFUND: "REFUND REVERSAL PROCESSED BY MERCHANT / ACQUIRING BANK",
};

export function generateDemoDescription(input: DemoTxnInput): string {
  const type = (input.type || "").toLowerCase() === "debit" ? "DEBIT" : "CREDIT";
  const mode = (input.mode || "").toUpperCase();
  const party = (input.sender_name || "UNKNOWN PARTY").toUpperCase().replace(/\s+/g, " ").trim();
  const amt = formatAmount(input.amount);
  const ref = (input.external_id || "").toUpperCase().trim();
  const when = formatDate(input.created_at);
  const partyRole = type === "CREDIT" ? "REMITTER" : "BENEFICIARY";

  const parts: string[] = [];
  parts.push(`[DEMO/TEST] ${type}/${mode || "TRANSFER"}/${party}`);

  const seg: string[] = [];
  if (amt) seg.push(`AMT INR ${amt}`);
  seg.push(`${partyRole} ${party}`);

  if (mode === "UPI") {
    if (input.upi_id) seg.push(`VPA ${String(input.upi_id).trim()}`);
    seg.push("HANDLE UPI");
  } else if (mode === "IMPS" || mode === "NEFT" || mode === "RTGS") {
    if (input.beneficiary_account) seg.push(`A/C ${maskAccount(input.beneficiary_account)}`);
    if (input.beneficiary_ifsc) seg.push(`IFSC ${String(input.beneficiary_ifsc).toUpperCase().trim()}`);
  }

  if (ref) seg.push(`${mode === "UPI" ? "REF" : "UTR"} ${ref}`);
  if (when) seg.push(`ON ${when}`);
  if (mode && CHANNEL[mode]) seg.push(`CHANNEL ${CHANNEL[mode]}`);
  seg.push(type === "CREDIT" ? "FUNDS CREDITED TO ACCOUNT" : "FUNDS DEBITED FROM ACCOUNT");

  parts.push(seg.join(" | "));
  parts.push("NOTE: SIMULATED DEMO ENTRY FOR TESTING — NOT AN OFFICIAL BANK-GENERATED RECORD.");

  return parts.join(" | ");
}
