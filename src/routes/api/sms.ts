import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";
import { parseSms } from "@/lib/parseSms";
import { recomputeBalances } from "@/routes/api/admin";

const LIVE_SUPABASE_PROJECT_ID = "usjynnxdtmghgznfcrjf";
const LIVE_SUPABASE_URL = `https://${LIVE_SUPABASE_PROJECT_ID}.supabase.co`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const SMS_TIMEOUT_MS = 8_000;

async function withTimeout<T>(label: string, promiseLike: PromiseLike<T>, ms = SMS_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const promise = Promise.resolve(promiseLike);
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function getAdmin() {
  const url = LIVE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!key) throw new Error("Missing database key in environment");
  return createClient(url, key, { auth: { persistSession: false } });
}

// Timing-safe comparison so request timing never leaks the secret.
function secretMatches(expected: string, got: string | null): boolean {
  if (!got) return false;
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(got, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// The forwarder may send epoch seconds, epoch milliseconds, or an ISO string.
// Returns an ISO string only when the value is a sane timestamp (2020..now+1d).
function normalizeTimestamp(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  let d: Date;
  const asString = typeof v === "string" ? v.trim() : "";
  if (typeof v === "number" || /^\d+$/.test(asString)) {
    const n = Number(asString || v);
    const ms = n >= 1e15 ? n / 1000 : n >= 1e11 ? n : n * 1000;
    d = new Date(ms);
  } else {
    d = new Date(asString);
  }
  if (Number.isNaN(d.getTime())) return null;
  const t = d.getTime();
  const now = Date.now();
  if (t < new Date("2020-01-01").getTime() || t > now + 24 * 60 * 60 * 1000) return null;
  return d.toISOString();
}

async function handle(request: Request) {
  console.log("[sms] request received", { method: request.method });

  // Shared-secret auth for the webhook. The value lives only in server env
  // (SMS_WEBHOOK_SECRET); it is never logged or returned.
  const expected = process.env.SMS_WEBHOOK_SECRET;
  if (!expected) {
    console.error("[sms] SMS_WEBHOOK_SECRET not configured — refusing request");
    return json({ ok: false, error: "webhook not configured" }, 401);
  }
  if (!secretMatches(expected, request.headers.get("x-webhook-secret"))) {
    console.warn("[sms] unauthorized webhook request (secret mismatch)");
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  let body: any = {};
  const ct = request.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) body = await request.json();
    else if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
      const fd = await request.formData();
      body = Object.fromEntries(fd.entries());
    } else {
      const txt = await request.text();
      try {
        body = JSON.parse(txt);
      } catch {
        body = { message: txt };
      }
    }
  } catch (error) {
    console.error("[sms] request body parse error:", error);
    return json({ ok: false, error: "invalid body" }, 400);
  }

  const raw: string =
    body.message || body.text || body.sms || body.body || body.content || "";
  const sender: string | null = body.sender || body.from || body.address || null;
  const bodyExternalId: string | undefined =
    body.id || body.external_id || body.messageId || body.utr || body.ref || body.reference;
  const createdAt = normalizeTimestamp(body.timestamp ?? body.date ?? body.time);

  if (!raw || typeof raw !== "string" || !raw.trim()) {
    console.warn("[sms] empty message");
    return json({ ok: false, inserted: false, skipped: "empty message" }, 202);
  }

  let parsed;
  try {
    parsed = parseSms(raw);
  } catch (error) {
    console.error("[sms] parseSms error:", error);
    parsed = null;
  }
  if (!parsed) {
    console.warn("[sms] rejected non-transactional or unparseable message");
    return json({ ok: false, inserted: false, skipped: "not a transaction sms" }, 202);
  }
  if (!parsed.sender_name && sender) parsed.sender_name = sender;
  // Masked account suffix (e.g. XX8572) is informational only — never used as
  // the ledger account and never stored.
  console.log("[sms] parsed:", {
    amount: parsed.amount,
    type: parsed.type,
    mode: parsed.mode ?? null,
    sender_name: parsed.sender_name,
    reference: parsed.reference ?? null,
    account_suffix: parsed.account ?? null,
    upi_id: parsed.upi_id ?? null,
    created_at: createdAt,
  });

  // Normalize the transaction reference for dedupe (trim + uppercase).
  // Prefer webhook body id, otherwise fall back to the UTR/Ref parsed from the SMS.
  const externalId: string | null = (() => {
    const r = bodyExternalId ?? parsed.reference ?? null;
    if (!r) return null;
    const norm = String(r).trim().toUpperCase();
    return norm.length ? norm : null;
  })();

  let supabase;
  try {
    supabase = getAdmin();
  } catch (error) {
    console.error("[sms] database client setup error:", error);
    return json({ ok: false, inserted: false, error: "database client unavailable" }, 500);
  }

  // Dedupe by reference / id (case-insensitive, trimmed). The unique index on
  // external_id is the final safety net.
  if (externalId) {
    try {
      const { data: dup, error } = await withTimeout(
        "sms dedupe lookup",
        supabase
          .from("transactions")
          .select("id, external_id")
          .ilike("external_id", externalId)
          .maybeSingle(),
      );
      if (error) console.error("[sms] dedupe lookup error:", error);
      if (dup) {
        console.log(`[sms] duplicate transaction skipped: ${externalId}`);
        return json({ ok: true, inserted: false, deduped: true, id: dup.id }, 200);
      }
    } catch (error) {
      console.error("[sms] dedupe lookup failed:", error);
    }
  }

  // Resolve the ledger account: explicit override, else the latest existing
  // transaction's account, else the profile account number.
  let accountRef: string | null = body.account_reference || null;
  if (!accountRef) {
    try {
      const { data: last } = await withTimeout(
        "sms account lookup",
        supabase.from("transactions").select("account_reference").limit(1).maybeSingle(),
      );
      accountRef = last?.account_reference ?? null;
    } catch (error) {
      console.error("[sms] account lookup failed:", error);
    }
  }
  if (!accountRef) {
    try {
      const { data: prof } = await withTimeout(
        "sms profile lookup",
        supabase.from("app_profile").select("account_number").eq("id", "primary").maybeSingle(),
      );
      accountRef = prof?.account_number ?? null;
    } catch (error) {
      console.error("[sms] profile lookup failed:", error);
    }
  }
  if (!accountRef) {
    console.error("[sms] no account reference available — cannot insert");
    return json({ ok: false, inserted: false, error: "no account reference available" }, 500);
  }

  // Balance estimate from the newest row for this account. The authoritative
  // running balance is recomputed after insert (same logic as the Admin Editor).
  let previousBalance = 0;
  try {
    const { data: last, error } = await withTimeout(
      "sms balance lookup",
      supabase
        .from("transactions")
        .select("balance_after_transaction")
        .eq("account_reference", accountRef)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    );
    if (error) console.error("[sms] balance lookup error:", error);
    previousBalance = Number(last?.balance_after_transaction ?? 0);
  } catch (error) {
    console.error("[sms] balance lookup failed:", error);
  }

  const delta = parsed.type === "credit" ? parsed.amount : -parsed.amount;
  const balance_after_transaction = Number((previousBalance + delta).toFixed(2));

  const insert = {
    amount: parsed.amount,
    type: parsed.type,
    mode: parsed.mode ?? null,
    sender_name: parsed.sender_name,
    description: parsed.description,
    balance_after_transaction,
    account_reference: accountRef,
    external_id: externalId,
    upi_id: parsed.upi_id ?? null,
    ...(createdAt ? { created_at: createdAt } : {}),
  };

  try {
    const { data, error } = await withTimeout(
      "sms transaction insert",
      supabase.from("transactions").insert(insert).select("*").single(),
    );

    if (error) {
      // 23505 = unique_violation → duplicate reference; 200 so the forwarder
      // does not retry forever.
      if ((error as any).code === "23505") {
        console.log(`[sms] duplicate transaction skipped: ${externalId}`);
        return json({ ok: true, inserted: false, deduped: true }, 200);
      }
      console.error("[sms] insert error:", error);
      return json({ ok: false, inserted: false, error: "insert failed" }, 500);
    }

    // Recompute the running balance for the whole account chain so backdated
    // entries keep the ledger consistent (same rule as the Admin Editor).
    try {
      await withTimeout("sms balance recompute", recomputeBalances(supabase, accountRef));
    } catch (error) {
      console.error("[sms] balance recompute failed:", error);
    }

    console.log("[sms] inserted transaction:", data?.id);
    return json(
      {
        ok: true,
        inserted: true,
        id: data?.id,
        amount: parsed.amount,
        type: parsed.type,
        mode: parsed.mode ?? null,
        reference: externalId,
        account_suffix: parsed.account ?? null, // informational only
        timestamp_used: createdAt ?? null,
        balance_after_transaction: data?.balance_after_transaction ?? balance_after_transaction,
      },
      201,
    );
  } catch (error) {
    console.error("[sms] insert failed:", error);
    return json({ ok: false, inserted: false, error: "insert failed" }, 500);
  }
}

async function safeHandle(request: Request) {
  try {
    return await handle(request);
  } catch (error) {
    console.error("[sms] unexpected webhook failure:", error);
    return json({ ok: false, inserted: false, error: "unexpected webhook failure" }, 500);
  }
}

export const Route = createFileRoute("/api/sms")({
  server: {
    handlers: {
      POST: ({ request }) => safeHandle(request),
      GET: () => json({ ok: true, hint: "POST sms here" }),
    },
  },
});
