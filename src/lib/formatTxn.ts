import type { Txn } from "@/lib/supabase-helpers";

const MODES = ["UPI", "IMPS", "NEFT", "RTGS"] as const;
export type PaymentMode = (typeof MODES)[number] | null;

export function detectMode(text: string | null | undefined): PaymentMode {
  if (!text) return null;
  const t = text.toUpperCase();
  for (const m of MODES) if (new RegExp(`\\b${m}\\b`).test(t)) return m;
  return null;
}

const UTR_RE = /(?:ref(?:erence)?\s*(?:id|no\.?|#)?|utr(?:\s*no\.?)?|txn(?:\s*id)?)\s*[:\-]?\s*([A-Z0-9]{6,})/i;
const PAREN_REF_RE = /\(\s*(?:ref(?:erence)?\s*(?:id|no\.?|#)?|utr)\s*[:\-]?\s*([A-Z0-9]{6,})\s*\)/i;

export function extractUtr(text: string | null | undefined): string | null {
  if (!text) return null;
  const m = text.match(PAREN_REF_RE) || text.match(UTR_RE);
  return m ? m[1] : null;
}

const VPA_RE = /\b([a-zA-Z0-9.\-_]{2,})@([a-zA-Z][a-zA-Z0-9.\-_]{1,})\b/;
const ACCOUNT_RE = /\b(?:a\/?c|acct|account)(?:\s*(?:no\.?|number|#))?\s*[:\-]?\s*((?:[xX*]+)?\d{3,})\b/i;

export function extractVpa(text: string | null | undefined): string | null {
  if (!text) return null;
  const m = text.match(VPA_RE);
  if (!m) return null;
  const vpa = `${m[1]}@${m[2]}`;
  // avoid matching emails like help@slice.bank
  if (/\.(com|in|org|net|co|bank|io)$/i.test(vpa) && !/^[a-z0-9.\-_]+@(ok|ybl|axl|paytm|apl|upi|ibl|sbi|hdfc|icici|axis|kotak|fbl|sliceupi)/i.test(vpa)) {
    return null;
  }
  return vpa;
}

export function extractAccount(text: string | null | undefined): string | null {
  if (!text) return null;
  const m = text.match(ACCOUNT_RE);
  return m ? m[1].toUpperCase() : null;
}

// Pull a clean party name from the SMS body, stripping titles, account masks, dates.
export function extractParty(text: string, type: "credit" | "debit"): string | null {
  if (!text) return null;
  const t = text.replace(/\s+/g, " ").trim();
  // common patterns
  const patterns = type === "debit"
    ? [
        /\bto\s+(?:mr\.?|ms\.?|mrs\.?|m\/s\.?)?\s*([A-Za-z][A-Za-z .'&-]{2,60}?)(?=\s+(?:on|via|through|using|ref|utr|a\/c|account|dt|\d{1,2}[-/])|[.,(]|$)/i,
      ]
    : [
        /\bfrom\s+(?:mr\.?|ms\.?|mrs\.?|m\/s\.?)?\s*([A-Za-z][A-Za-z .'&-]{2,60}?)(?=\s+(?:on|via|through|using|ref|utr|a\/c|account|dt|\d{1,2}[-/])|[.,(]|$)/i,
        /\bby\s+(?:mr\.?|ms\.?|mrs\.?|m\/s\.?)?\s*([A-Za-z][A-Za-z .'&-]{2,60}?)(?=\s+(?:on|via|through|using|ref|utr|a\/c|account|dt|\d{1,2}[-/])|[.,(]|$)/i,
      ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m) {
      const name = m[1].trim().replace(/\s+/g, " ");
      if (name.length > 1) return name;
    }
  }
  return null;
}

export function formatDescription(txn: Pick<Txn, "type" | "description" | "sender_name">): string {
  // Always use the description stored with the transaction, including legacy rows.
  return txn.description ?? "";
}
