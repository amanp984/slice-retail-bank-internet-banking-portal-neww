import { createClient } from "@supabase/supabase-js";

const LIVE_SUPABASE_PROJECT_ID = "grnuuhoxpnezzmfovrxx";
const LIVE_SUPABASE_URL = `https://${LIVE_SUPABASE_PROJECT_ID}.supabase.co`;

// Native Vercel serverless function (Node runtime).
// Path: POST /api/sms

type AnyRecord = Record<string, any>;

const AMOUNT_RE = /(?:rs\.?|inr|₹)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i;
const CREDIT_RE = /\b(credited|credit|received|deposited|recd|receiv?ed|\bcr\b)\b/i;
const DEBIT_RE = /\b(debited|debit|withdrawn|paid|spent|sent|purchase|txn|transferred|\bdr\b)\b/i;
const MODE_RE = /\b(UPI|IMPS|NEFT|RTGS)\b/i;
const REF_RE = /(?:ref(?:erence)?\s*(?:no\.?|id|#)?|utr(?:\s*no\.?)?|txn\s*id)\s*[:\-.]?\s*([A-Za-z0-9]{6,})/i;
const ACCOUNT_RE = /\ba\/?c(?:\s*(?:no\.?|number|#))?\s*[:\-]?\s*((?:[xX*]+)?\d{3,})\b/i;
const PARTY_FROM_RE = /\b(?:from|by)\s+((?:[A-Za-z][A-Za-z.'&\- ]{0,60}?))\s*(?=\.?\s*(?:ref|utr|on|via|through|using|a\/?c|account|dt|avl|bal|\d{1,2}[-/])|[.,(\n]|$)/i;
const PARTY_TO_RE = /\bto\s+((?:[A-Za-z][A-Za-z.'&\- ]{0,60}?))\s*(?=\.?\s*(?:ref|utr|on|via|through|using|a\/?c|account|dt|avl|bal|\d{1,2}[-/])|[.,(\n]|$)/i;
const REJECT_RE = /\b(otp|one\s*time\s*password|verification\s*code|do\s*not\s*share|cashback|offer|discount|loan|emi\s*offer|pre[-\s]*approved|kyc|recharge|coupon|reward\s*points?|apply\s*now|congratulations|welcome|thank\s*you\s*for|activated|will\s*expire|balance\s*enquiry|min\s*bal|new\s*plan)\b/i;

function parseSms(raw: string) {
  const text = (raw || "").replace(/\s+/g, " ").trim();
  if (!text) return null;
  if (REJECT_RE.test(text)) return null;
  const amtMatch = text.match(AMOUNT_RE);
  if (!amtMatch) return null;
  const amount = Number(amtMatch[1].replace(/,/g, ""));
  if (!isFinite(amount) || amount <= 0) return null;
  const isCredit = CREDIT_RE.test(text);
  const isDebit = DEBIT_RE.test(text);
  if (!isCredit && !isDebit) return null;
  const type: "credit" | "debit" = isCredit && !isDebit ? "credit" : isDebit && !isCredit ? "debit" : isCredit ? "credit" : "debit";
  const mode = text.match(MODE_RE);
  const ref = text.match(REF_RE);
  const acct = text.match(ACCOUNT_RE);
  if (!mode || !ref || !acct) return null;
  const partyMatch = type === "credit" ? text.match(PARTY_FROM_RE) : (text.match(PARTY_TO_RE) || text.match(PARTY_FROM_RE));
  const sender_name = partyMatch
    ? partyMatch[1].replace(/\s+/g, " ").replace(/\s*\.\s*$/, "").trim() || null
    : null;
  return {
    amount,
    type,
    sender_name,
    description: text.slice(0, 240),
    fallback: false,
  };
}

function getAdmin() {
  const url = LIVE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!key) throw new Error("Missing Supabase key in Vercel env");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function readBody(req: any): Promise<AnyRecord> {
  if (req.body && typeof req.body === "object") return req.body as AnyRecord;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return { message: req.body };
    }
  }
  // Stream fallback
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
}

export default async function handler(req: any, res: any) {
  try {
    console.log("[api/sms] received", { method: req.method, url: req.url });

    if (req.method === "GET") {
      res.status(200).json({ ok: true, hint: "POST sms here" });
      return;
    }
    if (req.method !== "POST") {
      res.status(200).json({ ok: true, inserted: false, error: "method not allowed" });
      return;
    }

    const expected = process.env.SMS_WEBHOOK_SECRET;
    if (!expected) {
      console.error("[api/sms] SMS_WEBHOOK_SECRET not configured — refusing request");
      res.status(401).json({ ok: false, error: "unauthorized" });
      return;
    }
    const got = req.headers["x-webhook-secret"] as string | undefined;
    if (got !== expected) {
      console.warn("[api/sms] unauthorized");
      res.status(401).json({ ok: false, error: "unauthorized" });
      return;
    }

    const body = await readBody(req);
    console.log("[api/sms] body:", body);

    const raw: string =
      body.message || body.text || body.sms || body.body || body.content || "";
    const sender: string | null = body.sender || body.from || body.address || null;
    const externalId: string | undefined = body.id || body.external_id || body.messageId;
    const accountRef: string =
      body.account_reference ||
      process.env.DEFAULT_ACCOUNT_REFERENCE ||
      "033311501068990";

    if (!raw || typeof raw !== "string" || !raw.trim()) {
      console.warn("[api/sms] empty message");
      res.status(200).json({ ok: true, inserted: false, skipped: "empty message" });
      return;
    }

    const parsed = parseSms(raw);
    if (!parsed) {
      console.warn("[api/sms] rejected non-transactional message");
      res.status(200).json({ ok: true, inserted: false, skipped: "not a transaction sms" });
      return;
    }
    if (!parsed.sender_name && sender) parsed.sender_name = sender;
    console.log("[api/sms] parsed:", parsed);

    let supabase;
    try {
      supabase = getAdmin();
    } catch (e: any) {
      console.error("[api/sms] supabase client error:", e?.message);
      res.status(200).json({ ok: true, inserted: false, error: "db client unavailable" });
      return;
    }

    // Dedupe
    if (externalId) {
      try {
        const { data: dup } = await supabase
          .from("transactions")
          .select("id")
          .eq("external_id", externalId)
          .maybeSingle();
        if (dup) {
          console.log("[api/sms] duplicate:", dup.id);
          res.status(200).json({ ok: true, inserted: false, deduped: true, id: dup.id });
          return;
        }
      } catch (e) {
        console.error("[api/sms] dedupe error:", e);
      }
    }

    // Latest balance
    let previousBalance = 0;
    try {
      const { data: last } = await supabase
        .from("transactions")
        .select("balance_after_transaction")
        .eq("account_reference", accountRef)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      previousBalance = Number(last?.balance_after_transaction ?? 0);
    } catch (e) {
      console.error("[api/sms] balance lookup error:", e);
    }

    const delta = parsed.type === "credit" ? parsed.amount : -parsed.amount;
    const balance_after_transaction = Number((previousBalance + delta).toFixed(2));

    const insert = {
      amount: parsed.amount,
      type: parsed.type,
      sender_name: parsed.sender_name,
      description: parsed.description,
      balance_after_transaction,
      account_reference: accountRef,
      external_id: externalId ?? null,
    };

    const { data, error } = await supabase
      .from("transactions")
      .insert(insert)
      .select("*")
      .single();

    if (error) {
      console.error("[api/sms] insert error:", error);
      res.status(200).json({ ok: true, inserted: false, error: "insert failed" });
      return;
    }

    console.log("[api/sms] inserted:", data?.id);
    res.status(200).json({ ok: true, inserted: true, fallback: !!parsed.fallback, transaction: data });
  } catch (err: any) {
    console.error("[api/sms] unexpected error:", err);
    res.status(200).json({ ok: true, inserted: false, error: "unexpected error" });
  }
}