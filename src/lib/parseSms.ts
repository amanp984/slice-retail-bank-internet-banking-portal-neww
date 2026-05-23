export type ParsedSms = {
  amount: number;
  type: "credit" | "debit";
  sender_name: string | null;
  description: string;
  fallback?: boolean;
};

const AMOUNT_RE = /(?:rs\.?|inr|₹|\bINR\b)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i;
const AMOUNT_RE_LOOSE = /\b([0-9]{1,3}(?:,[0-9]{2,3})+(?:\.[0-9]{1,2})?|[0-9]+\.[0-9]{2})\b/;
const CREDIT_RE = /\b(credited|credit|received|deposited|cr|recd|receiv?ed)\b/i;
const DEBIT_RE = /\b(debited|debit|withdrawn|paid|spent|sent|dr|purchase|txn|transferred)\b/i;
const SENDER_RE = /(?:from|by|to)\s+([A-Z][A-Za-z0-9 ._-]{1,40})/;

export function parseSms(raw: string): ParsedSms | null {
  if (!raw || typeof raw !== "string") return null;
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return null;

  let amount = NaN;
  const m = text.match(AMOUNT_RE);
  if (m) {
    amount = Number(m[1].replace(/,/g, ""));
  } else {
    const m2 = text.match(AMOUNT_RE_LOOSE);
    if (m2) amount = Number(m2[1].replace(/,/g, ""));
  }

  const isCredit = CREDIT_RE.test(text);
  const isDebit = DEBIT_RE.test(text);

  let type: "credit" | "debit";
  if (isCredit && !isDebit) type = "credit";
  else if (isDebit && !isCredit) type = "debit";
  else if (isCredit) type = "credit";
  else if (isDebit) type = "debit";
  else type = "debit"; // safe default fallback

  let fallback = false;
  if (!isFinite(amount) || amount <= 0) {
    amount = 0;
    fallback = true;
  }
  if (!isCredit && !isDebit) fallback = true;

  const s = text.match(SENDER_RE);
  const sender_name = s?.[1]?.trim() ?? null;

  return {
    amount,
    type,
    sender_name,
    description: text.slice(0, 240),
    fallback,
  };
}
