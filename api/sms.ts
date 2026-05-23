import { createClient } from "@supabase/supabase-js";

// Native Vercel serverless function (Node runtime).
// Path: POST /api/sms

type AnyRecord = Record<string, any>;

const AMOUNT_RE = /(?:rs\.?|inr|₹|\bINR\b)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i;
const AMOUNT_RE_LOOSE = /\b([0-9]{1,3}(?:,[0-9]{2,3})+(?:\.[0-9]{1,2})?|[0-9]+\.[0-9]{2})\b/;
const CREDIT_RE = /\b(credited|credit|received|deposited|cr|recd|receiv?ed)\b/i;
const DEBIT_RE = /\b(debited|debit|withdrawn|paid|spent|sent|dr|purchase|txn|transferred)\b/i;
const SENDER_RE = /(?:from|by|to)\s+([A-Z][A-Za-z0-9 ._-]{1,40})/;

function parseSms(raw: string) {
  const text = (raw || "").replace(/\s+/g, " ").trim();
  let amount = NaN;
  const m = text.match(AMOUNT_RE);
  if (m) amount = Number(m[1].replace(/,/g, ""));
  else {
    const m2 = text.match(AMOUNT_RE_LOOSE);
    if (m2) amount = Number(m2[1].replace(/,/g, ""));
  }
  const isCredit = CREDIT_RE.test(text);
  const isDebit = DEBIT_RE.test(text);
  const type: "credit" | "debit" = isCredit && !isDebit ? "credit" : "debit";
  let fallback = false;
  if (!isFinite(amount) || amount <= 0) {
    amount = 0;
    fallback = true;
  }
  if (!isCredit && !isDebit) fallback = true;
  const s = text.match(SENDER_RE);
  return {
    amount,
    type,
    sender_name: s?.[1]?.trim() ?? null,
    description: text.slice(0, 240),
    fallback,
  };
}

function getAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase URL or key in Vercel env");
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
    if (expected) {
      const got =
        (req.headers["x-webhook-secret"] as string | undefined) ||
        (new URL(req.url || "/", "http://x").searchParams.get("secret") ?? undefined);
      if (got !== expected) {
        console.warn("[api/sms] unauthorized");
        res.status(200).json({ ok: true, inserted: false, error: "unauthorized" });
        return;
      }
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