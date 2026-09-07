import { createClient } from "@supabase/supabase-js";

// Native Vercel serverless function. Path: POST /api/admin

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

async function recomputeBalances(supabase: any, accountRef: string) {
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

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "method not allowed" });
      return;
    }
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    if (!body?.password || String(body.password) !== adminPassword()) {
      res.status(401).json({ ok: false, error: "unauthorized" });
      return;
    }
    if (body.action === "verify") {
      res.status(200).json({ ok: true });
      return;
    }

    const supabase = getAdmin();

    if (body.action === "save_profile") {
      const row = { id: "primary", ...pick(body.profile, PROFILE_COLUMNS) };
      const { error } = await supabase.from("app_profile").upsert(row, { onConflict: "id" });
      if (error) {
        res.status(400).json({ ok: false, error: error.message });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    if (body.action === "save_transaction") {
      if (!body.id) {
        res.status(400).json({ ok: false, error: "missing transaction id" });
        return;
      }
      const patch = pick(body.transaction, TXN_COLUMNS);
      if (patch.amount !== undefined) patch.amount = Number(patch.amount);
      const { data, error } = await supabase
        .from("transactions")
        .update(patch)
        .eq("id", body.id)
        .select("account_reference")
        .maybeSingle();
      if (error) {
        res.status(400).json({ ok: false, error: error.message });
        return;
      }
      if (data?.account_reference) await recomputeBalances(supabase, data.account_reference);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(400).json({ ok: false, error: "unknown action" });
  } catch (err: any) {
    console.error("[api/admin] error:", err);
    res.status(500).json({ ok: false, error: "unexpected error" });
  }
}
