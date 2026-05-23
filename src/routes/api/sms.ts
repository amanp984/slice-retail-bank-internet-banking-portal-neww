import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { parseSms } from "@/lib/parseSms";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

function getAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function handle(request: Request) {
  // Optional shared-secret auth for the webhook
  const expected = process.env.SMS_WEBHOOK_SECRET;
  if (expected) {
    const got =
      request.headers.get("x-webhook-secret") ||
      new URL(request.url).searchParams.get("secret");
    if (got !== expected) return json({ error: "unauthorized" }, 401);
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
  } catch {
    return json({ error: "invalid body" }, 400);
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
    "033311501069501";

  if (!raw || typeof raw !== "string" || !raw.trim()) {
    console.warn("[sms] empty body, ignoring but returning 200");
    return json({ ok: true, skipped: "empty message" });
  }

  let parsed = parseSms(raw);
  if (!parsed) {
    parsed = {
      amount: 0,
      type: "debit",
      sender_name: sender,
      description: raw.slice(0, 240) || "Unparsed SMS",
      fallback: true,
    };
  }
  if (!parsed.sender_name && sender) parsed.sender_name = sender;
  console.log("[sms] parsed:", parsed);

  const supabase = getAdmin();

  // Dedupe
  if (externalId) {
    const { data: dup } = await supabase
      .from("transactions")
      .select("id")
      .eq("external_id", externalId)
      .maybeSingle();
    if (dup) return json({ ok: true, deduped: true, id: dup.id });
  }

  // Get latest balance for account
  const { data: last } = await supabase
    .from("transactions")
    .select("balance_after_transaction")
    .eq("account_reference", accountRef)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const prev = Number(last?.balance_after_transaction ?? 0);
  const delta = parsed.type === "credit" ? parsed.amount : -parsed.amount;
  const balance_after_transaction = Number((prev + delta).toFixed(2));

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
    console.error("[sms] supabase insert error:", error);
    return json({ ok: true, inserted: false, error: error.message });
  }
  console.log("[sms] inserted:", data?.id, "fallback:", parsed.fallback);
  return json({ ok: true, inserted: true, fallback: !!parsed.fallback, transaction: data });
}

export const Route = createFileRoute("/api/sms")({
  server: {
    handlers: {
      POST: ({ request }) => handle(request),
      GET: () => json({ ok: true, hint: "POST sms here" }),
    },
  },
});
