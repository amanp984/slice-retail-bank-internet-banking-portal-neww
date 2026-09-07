import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

function adminPassword() {
  return (
    process.env.ADMIN_PASSWORD ||
    process.env.ADMIN_EDITOR_PASSWORD ||
    "USER1947"
  );
}

function getAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing database configuration");
  return createClient(url, key, { auth: { persistSession: false } });
}

const PROFILE_COLUMNS = [
  "login_username", "login_password", "business_name", "holder_name", "customer_id",
  "account_number", "account_type", "account_status", "kyc_status", "ifsc", "micr",
  "phone", "email", "pan", "aadhaar_masked", "nominee", "address",
  "permanent_address", "bank_address", "branch_name", "branch_address",
  "opening_date", "udyam",
];

const TXN_COLUMNS = [
  "amount", "type", "mode", "sender_name", "beneficiary_account", "beneficiary_ifsc",
  "upi_id", "external_id", "description", "created_at",
];

const pick = (src: any, cols: string[]) => {
  const out: Record<string, unknown> = {};
  for (const c of cols) if (src && src[c] !== undefined) out[c] = src[c];
  return out;
};

// Preserves the existing running-balance rule: order ascending by created_at
// per account, running = previous + (credit ? amount : -amount).
export async function recomputeBalances(supabase: any, accountRef: string) {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, amount, type, balance_after_transaction, created_at")
    .eq("account_reference", accountRef)
    .order("created_at", { ascending: true });
  if (error || !data) return;
  let running = 0;
  for (const row of data as any[]) {
    const amt = Number(row.amount) || 0;
    running = Number((running + (row.type === "credit" ? amt : -amt)).toFixed(2));
    if (Number(row.balance_after_transaction) !== running) {
      await supabase
        .from("transactions")
        .update({ balance_after_transaction: running })
        .eq("id", row.id);
    }
  }
}

async function handle(request: Request) {
  if (request.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid body" }, 400);
  }

  if (!body?.password || String(body.password) !== adminPassword()) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  if (body.action === "verify") return json({ ok: true });

  let supabase: any;
  try {
    supabase = getAdmin();
  } catch (e: any) {
    return json({ ok: false, error: "database unavailable" }, 500);
  }

  if (body.action === "save_profile") {
    const row = { id: "primary", ...pick(body.profile, PROFILE_COLUMNS) };
    const { error } = await supabase.from("app_profile").upsert(row, { onConflict: "id" });
    if (error) return json({ ok: false, error: error.message }, 400);
    return json({ ok: true });
  }

  if (body.action === "save_transaction") {
    const id = body.id;
    if (!id) return json({ ok: false, error: "missing transaction id" }, 400);
    const patch = pick(body.transaction, TXN_COLUMNS);
    if (patch.amount !== undefined) patch.amount = Number(patch.amount);
    const { data, error } = await supabase
      .from("transactions")
      .update(patch)
      .eq("id", id)
      .select("account_reference")
      .maybeSingle();
    if (error) return json({ ok: false, error: error.message }, 400);
    if (data?.account_reference) await recomputeBalances(supabase, data.account_reference);
    return json({ ok: true });
  }

  return json({ ok: false, error: "unknown action" }, 400);
}

export const Route = createFileRoute("/api/admin")({
  server: { handlers: { POST: ({ request }) => handle(request) } },
});
