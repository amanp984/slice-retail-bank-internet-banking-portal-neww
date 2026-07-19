export type ParsedSms = {
  amount: number;
  type: "credit" | "debit";
  sender_name: string | null;
  description: string;
  mode?: "UPI" | "IMPS" | "NEFT" | "RTGS" | null;
  reference?: string | null;
  account?: string | null;
  upi_id?: string | null;
  fallback?: boolean;
};

// Flexible currency amount: Rs / INR / ₹ followed by number (with commas + optional decimals)
const AMOUNT_RE = /(?:rs\.?|inr|₹)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i;
const CREDIT_RE = /\b(credited|credit|received|deposited|recd|receiv?ed|\bcr\b)\b/i;
const DEBIT_RE = /\b(debited|debit|withdrawn|paid|spent|sent|purchase|txn|transferred|\bdr\b)\b/i;
const MODE_RE = /\b(UPI|IMPS|NEFT|RTGS)\b/i;
const REF_RE = /(?:ref(?:erence)?\s*(?:no\.?|id|#)?|utr(?:\s*no\.?)?|txn\s*id)\s*[:\-.]?\s*([A-Za-z0-9]{6,})/i;
const ACCOUNT_RE = /\ba\/?c(?:\s*(?:no\.?|number|#))?\s*[:\-]?\s*((?:[xX*]+)?\d{3,})\b/i;
// UPI VPA: user@handle. Supports digits, letters, dots, hyphens, underscores in the user part.
const UPI_ID_RE = /\b([a-zA-Z0-9][a-zA-Z0-9._-]{1,63})@([a-zA-Z][a-zA-Z0-9.-]{1,63})\b/;
// Party name: allow dots, spaces, apostrophes, hyphens, ampersands, initials, trailing period
const PARTY_FROM_RE = /\b(?:from|by)\s+((?:[A-Za-z][A-Za-z.'&\- ]{0,60}?))\s*(?=\.?\s*(?:ref|utr|on|via|through|using|a\/?c|account|dt|avl|bal|\d{1,2}[-/])|[.,(\n]|$)/i;
const PARTY_TO_RE = /\bto\s+((?:[A-Za-z][A-Za-z.'&\- ]{0,60}?))\s*(?=\.?\s*(?:ref|utr|on|via|through|using|a\/?c|account|dt|avl|bal|\d{1,2}[-/])|[.,(\n]|$)/i;

// Reject junk / non-transactional messages
const REJECT_RE = /\b(otp|one\s*time\s*password|verification\s*code|do\s*not\s*share|cashback|offer|discount|loan|emi\s*offer|pre[-\s]*approved|kyc|recharge|coupon|reward\s*points?|apply\s*now|congratulations|welcome|thank\s*you\s*for|activated|will\s*expire|balance\s*enquiry|min\s*bal|new\s*plan)\b/i;

export function parseSms(raw: string): ParsedSms | null {
  if (!raw || typeof raw !== "string") return null;
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return null;

  // Reject promotional / OTP / non-transactional messages outright
  if (REJECT_RE.test(text)) return null;

  const amtMatch = text.match(AMOUNT_RE);
  if (!amtMatch) return null;
  const amount = Number(amtMatch[1].replace(/,/g, ""));
  if (!isFinite(amount) || amount <= 0) return null;

  const isCredit = CREDIT_RE.test(text);
  const isDebit = DEBIT_RE.test(text);
  if (!isCredit && !isDebit) return null;
  const type: "credit" | "debit" = isCredit && !isDebit ? "credit" : isDebit && !isCredit ? "debit" : isCredit ? "credit" : "debit";

  const modeMatch = text.match(MODE_RE);
  const refMatch = text.match(REF_RE);
  const acctMatch = text.match(ACCOUNT_RE);

  // Require all four to accept
  if (!modeMatch || !refMatch || !acctMatch) return null;

  const partyMatch = type === "credit"
    ? text.match(PARTY_FROM_RE)
    : (text.match(PARTY_TO_RE) || text.match(PARTY_FROM_RE));

  const sender_name = partyMatch
    ? partyMatch[1].replace(/\s+/g, " ").replace(/\s*\.\s*$/, "").trim() || null
    : null;

  const mode = modeMatch[1].toUpperCase() as ParsedSms["mode"];
  let upi_id: string | null = null;
  if (mode === "UPI") {
    const upiMatch = text.match(UPI_ID_RE);
    if (upiMatch) upi_id = `${upiMatch[1]}@${upiMatch[2]}`.toLowerCase();
  }

  return {
    amount,
    type,
    sender_name,
    description: text.slice(0, 240),
    mode,
    reference: refMatch[1].trim(),
    account: acctMatch[1].toUpperCase(),
    upi_id,
    fallback: false,
  };
}
