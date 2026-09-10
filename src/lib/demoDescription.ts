// Demo/Test transaction description generator.
// Builds a structured, mode-specific DEMO description from only the fields
// the admin enters. Nothing here is an official bank record — every output is
// clearly marked DEMO/TEST and no real banking identifiers are invented.

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

const CHANNEL: Record<string, string> = {
  UPI: "UPI P2P TRANSFER VIA NPCI UNIFIED PAYMENTS INTERFACE",
  IMPS: "IMPS P2A IMMEDIATE PAYMENT SERVICE VIA NPCI (AVAILABLE 24X7)",
  NEFT: "NEFT BATCH SETTLEMENT VIA RBI NATIONAL ELECTRONIC FUNDS TRANSFER",
  RTGS: "RTGS REAL-TIME GROSS SETTLEMENT VIA RBI (HIGH VALUE TRANSFER)",
  REFUND: "REFUND / REVERSAL PROCESSED BY ORIGINATING PARTY",
};

const suffix =
  " | DEMO/TEST ENTRY — NOT AN OFFICIAL BANK-GENERATED RECORD.";

export function generateDemoDescription(input: DemoTxnInput): string {
  const isDebit = (input.type || "").toLowerCase() === "debit";
  const type = isDebit ? "DEBIT" : "CREDIT";
  const mode = upper(input.mode);
  const name = compact(input.sender_name) || "DEMOPARTY";
  const ref = compact(input.external_id);

  const parts: string[] = ["DEMO"];

  if (mode === "UPI") {
    // DEMO-UPI-[DEBIT/CREDIT]-[REFERENCE]-[PARTY NAME]-[UPI ID]-[PAYMENT CHANNEL]
    parts.push("UPI", type);
    if (ref) parts.push(ref);
    parts.push(name);
    const upi = clean(input.upi_id);
    if (upi) parts.push(upi);
    parts.push(CHANNEL.UPI);
  } else if (mode === "IMPS" || mode === "NEFT" || mode === "RTGS") {
    // DEMO-[MODE]-[DEBIT/CREDIT]-[REFERENCE]-[PARTY NAME]-A/C [MASKED ACCOUNT]-[IFSC]-[TRANSFER CHANNEL]
    parts.push(mode, type);
    if (ref) parts.push(ref);
    parts.push(name);
    const masked = maskAccount(input.beneficiary_account);
    if (masked) parts.push(`A/C ${masked}`);
    const ifsc = compact(input.beneficiary_ifsc);
    if (ifsc) parts.push(ifsc);
    parts.push(CHANNEL[mode]);
  } else if (mode === "REFUND") {
    // DEMO-REFUND-[REFERENCE]-[PARTY NAME]-[REFUND CHANNEL]
    parts.push("REFUND");
    if (ref) parts.push(ref);
    parts.push(name);
    const masked = maskAccount(input.beneficiary_account);
    if (masked) parts.push(`ORIG A/C ${masked}`);
    parts.push(CHANNEL.REFUND);
  } else {
    // Fallback for unknown / unset modes — still clearly DEMO.
    parts.push(mode || "TRANSFER", type);
    if (ref) parts.push(ref);
    parts.push(name);
    parts.push(type === "CREDIT" ? "FUNDS-CREDITED-TO-ACCOUNT" : "FUNDS-DEBITED-FROM-ACCOUNT");
  }

  return parts.filter(Boolean).join("-") + suffix;
}
