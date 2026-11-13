import { createServerFn } from "@tanstack/react-start";
import { validateHoldAmount } from "./banking";

export const saveAccountHold = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string; accountNumber: string; amount: string }) => {
    if (typeof data?.password !== "string" || typeof data?.accountNumber !== "string") throw new Error("Invalid request.");
    return { ...data, amount: validateHoldAmount(data.amount) };
  })
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PASSWORD || process.env.ADMIN_EDITOR_PASSWORD;
    if (!expected) throw new Error("Hold saving is locked: configure a secure Admin Panel password first.");
    const digest = (text: string) => crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    const [actualHash, expectedHash] = await Promise.all([digest(data.password), digest(expected)]);
    const actual = new Uint8Array(actualHash), wanted = new Uint8Array(expectedHash);
    let mismatch = 0;
    for (let i = 0; i < actual.length; i++) mismatch |= actual[i] ^ wanted[i];
    if (mismatch !== 0) throw new Error("Unauthorized administrator request.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error } = await supabaseAdmin.from("app_profile")
      .update({ hold_amount: data.amount }).eq("id", "primary").eq("account_number", data.accountNumber)
      .select("hold_amount").maybeSingle();
    if (error) { console.error("[account-hold] update failed", { code: error.code }); throw new Error("Hold Amount could not be saved."); }
    if (!profile) throw new Error("Account not found; no settings were changed.");
    return { holdAmount: Number(profile.hold_amount) };
  });