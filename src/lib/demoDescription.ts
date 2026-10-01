// Transaction description generator for the simulation environment.
// Only entered values appear in descriptions; the test notice belongs in the UI.

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

export function generateDemoDescription(input: DemoTxnInput): string {
  const isDebit = (input.type || "").toLowerCase() === "debit";
  const type = isDebit ? "Debit" : "Credit";
  const mode = clean(input.mode).toUpperCase();
  const name = clean(input.sender_name);
  const ref = clean(input.external_id);
  const parts: string[] = [mode || "Transfer", type, ref, name];

  if (mode === "UPI") {
    const upi = clean(input.upi_id);
    if (upi) parts.push(upi);
    parts.push(isDebit ? "Sent using UPI" : "Received via UPI");
  } else if (mode === "IMPS" || mode === "NEFT" || mode === "RTGS") {
    const masked = maskAccount(input.beneficiary_account);
    if (masked) parts.push(`A/C ${masked}`);
    const ifsc = clean(input.beneficiary_ifsc).toUpperCase();
    if (ifsc) parts.push(ifsc);
    parts.push(isDebit ? `Sent via ${mode}` : `Received via ${mode}`);
  } else if (mode === "REFUND") {
    const masked = maskAccount(input.beneficiary_account);
    if (masked) parts.push(`ORIG A/C ${masked}`);
    parts.push(isDebit ? "Refund sent" : "Refund received");
  } else {
    parts.push(isDebit ? "Sent" : "Received");
  }

  return parts.filter(Boolean).join("-");
}
