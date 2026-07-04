import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { parseSms } from "@/lib/parseSms";

const LIVE_SUPABASE_PROJECT_ID = "grnuuhoxpnezzmfovrxx";
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
  if (!key) throw new Error("Missing Supabase key in Vercel environment variables");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function handle(request: Request) {
  console.log("[sms] request received", { method: request.method, url: request.url });

  // Optional shared-secret auth for the webhook
  const expected = process.env.SMS_WEBHOOK_SECRET;
  if (!expected) {
    console.error("[sms] SMS_WEBHOOK_SECRET not configured — refusing request");
    return json({ ok: false, error: "unauthorized" }, 401);
  }
  const got = request.headers.get("x-webhook-secret");
  if (got !== expected) {
    console.warn("[sms] unauthorized webhook request");
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
    return json({ ok: true, inserted: false, error: "invalid body" });
  }

  console.log("[sms] incoming body:", body);

  const raw: string =
    body.message || body.text || body.sms || body.body || body.content || "";
  const sender: string | null =
    body.sender || body.from || body.address || null;
  const externalId: string | undefined = body.id || body.external_id || body.messageId;
  const accountRef: string =
    body.account_reference ||
    process.env.DEFAULT_ACCOUNT_REFERENCE ||
    "033311501068990";

  if (!raw || typeof raw !== "string" || !raw.trim()) {
    console.warn("[sms] empty body, ignoring but returning 200");
    return json({ ok: true, inserted: false, skipped: "empty message" });
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
    return json({ ok: true, inserted: false, skipped: "not a transaction sms" });
  }
  if (!parsed.sender_name && sender) parsed.sender_name = sender;
  if (parsed.account) {
    // If SMS carries its own account reference, prefer it over the default
  }
  console.log("[sms] parsed:", parsed);

  let supabase;
  try {
    supabase = getAdmin();
  } catch (error) {
    console.error("[sms] Supabase client setup error:", error);
    return json({ ok: true, inserted: false, error: "database client unavailable" });
  }

  // Dedupe
  if (externalId) {
    try {
      const { data: dup, error } = await withTimeout(
        "sms dedupe lookup",
        supabase
          .from("transactions")
          .select("id")
          .eq("external_id", externalId)
          .maybeSingle(),
      );
      if (error) console.error("[sms] dedupe lookup error:", error);
      if (dup) {
        console.log("[sms] duplicate ignored:", dup.id);
        return json({ ok: true, inserted: false, deduped: true, id: dup.id });
      }
    } catch (error) {
      console.error("[sms] dedupe lookup failed:", error);
    }
  }

  // Get latest balance for account
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
    sender_name: parsed.sender_name,
    description: parsed.description,
    balance_after_transaction,
    account_reference: accountRef,
    external_id: externalId ?? null,
  };

  try {
    const { data, error } = await withTimeout(
      "sms transaction insert",
      supabase
        .from("transactions")
        .insert(insert)
        .select("*")
        .single(),
    );

    if (error) {
      console.error("[sms] Supabase insert error:", error);
      return json({ ok: true, inserted: false, error: "insert failed" });
    }

    console.log("[sms] Supabase insert result:", { id: data?.id, fallback: parsed.fallback });
    return json({ ok: true, inserted: true, fallback: !!parsed.fallback, transaction: data });
  } catch (error) {
    console.error("[sms] Supabase insert failed:", error);
    return json({ ok: true, inserted: false, error: "insert failed" });
  }
}

async function safeHandle(request: Request) {
  try {
    return await handle(request);
  } catch (error) {
    console.error("[sms] unexpected webhook failure:", error);
    return json({ ok: true, inserted: false, error: "unexpected webhook failure" });
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
