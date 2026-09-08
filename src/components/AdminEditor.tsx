import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { verifyAdmin, saveProfileRow, saveTransactionRow } from "@/lib/admin-api";
import { getProfileRecord, profileToRow, loadProfile } from "@/lib/customer";

type Props = { open: boolean; onClose: () => void };

const PROFILE_FIELDS: { key: string; label: string }[] = [
  { key: "login_username", label: "Login Username" },
  { key: "login_password", label: "Login Password" },
  { key: "holder_name", label: "Account Holder Name" },
  { key: "business_name", label: "Business Name" },
  { key: "account_number", label: "Account Number" },
  { key: "customer_id", label: "Customer ID" },
  { key: "phone", label: "Phone Number" },
  { key: "email", label: "Email" },
  { key: "ifsc", label: "IFSC" },
  { key: "micr", label: "MICR" },
  { key: "account_type", label: "Account Type" },
  { key: "account_status", label: "Account Status" },
  { key: "kyc_status", label: "KYC Status" },
  { key: "branch_name", label: "Branch Name" },
  { key: "branch_address", label: "Branch Address" },
  { key: "bank_address", label: "Bank Address" },
  { key: "address", label: "Address" },
  { key: "permanent_address", label: "Permanent Address" },
  { key: "pan", label: "PAN" },
  { key: "aadhaar_masked", label: "Aadhaar (masked)" },
  { key: "nominee", label: "Nominee" },
  { key: "opening_date", label: "Opening Date" },
  { key: "udyam", label: "Udyam" },
];

type TxnField = { key: string; label: string; type?: string; options?: string[]; modes?: string[] };

const TXN_FIELDS: TxnField[] = [
  { key: "type", label: "Credit / Debit", options: ["credit", "debit"] },
  { key: "mode", label: "Payment Mode", options: ["UPI", "IMPS", "NEFT", "RTGS"] },
  { key: "sender_name", label: "Beneficiary / Sender Name" },
  { key: "amount", label: "Amount", type: "number" },
  { key: "external_id", label: "Reference / UTR" },
  { key: "created_at", label: "Transaction Date/Time (ISO)" },
  { key: "upi_id", label: "UPI ID (VPA)", modes: ["UPI"] },
  { key: "beneficiary_account", label: "Beneficiary Account", modes: ["IMPS", "NEFT", "RTGS"] },
  { key: "beneficiary_ifsc", label: "Beneficiary IFSC", modes: ["IMPS", "NEFT", "RTGS"] },
];

const input =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

export function AdminEditor({ open, onClose }: Props) {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [tab, setTab] = useState<"profile" | "txn">("profile");
  const [profile, setProfile] = useState<Record<string, any>>({});
  const [txns, setTxns] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [txn, setTxn] = useState<Record<string, any>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setAuthed(false);
      setPw("");
      setMsg(null);
    }
  }, [open]);

  useEffect(() => {
    if (!authed) return;
    setProfile(profileToRow(getProfileRecord()) as any);
    (supabase as any)
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }: any) => setTxns(data ?? []));
  }, [authed]);

  if (!open) return null;

  const doVerify = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await verifyAdmin(pw);
      setAuthed(true);
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || "Incorrect password" });
    } finally {
      setBusy(false);
    }
  };

  const doSaveProfile = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await saveProfileRow(profile);
      await loadProfile();
      setMsg({ ok: true, text: "Profile saved. Changes are live." });
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || "Save failed" });
    } finally {
      setBusy(false);
    }
  };

  const doSaveTxn = async () => {
    if (!selected) return;
    setBusy(true);
    setMsg(null);
    try {
      await saveTransactionRow(selected, txn);
      setMsg({ ok: true, text: "Transaction saved and balances recalculated." });
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || "Save failed" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4">
      <div className="bg-card w-full max-w-3xl max-h-[85vh] overflow-auto rounded-2xl border border-border p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Admin Editor</h2>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">Close</button>
        </div>

        {!authed ? (
          <div className="space-y-3">
            <label className="text-sm">Admin password</label>
            <input type="password" className={input} value={pw} onChange={(e) => setPw(e.target.value)} />
            <button disabled={busy} onClick={doVerify} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              {busy ? "Checking…" : "Continue"}
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              {(["profile", "txn"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-md px-3 py-1.5 text-sm ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
                >
                  {t === "profile" ? "Profile / Basic Details" : "Transaction Data"}
                </button>
              ))}
            </div>

            {tab === "profile" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PROFILE_FIELDS.map((f) => (
                  <div key={f.key}>
                    <label className="text-xs text-muted-foreground">{f.label}</label>
                    <input
                      className={input}
                      value={profile[f.key] ?? ""}
                      onChange={(e) => setProfile({ ...profile, [f.key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Select transaction</label>
                  <select
                    className={input}
                    value={selected}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelected(id);
                      const row = txns.find((t) => t.id === id) ?? {};
                      setTxn({ ...row });
                    }}
                  >
                    <option value="">—</option>
                    {txns.map((t) => (
                      <option key={t.id} value={t.id}>
                        {new Date(t.created_at).toLocaleString()} · {t.type} · {t.amount} · {t.sender_name ?? ""}
                      </option>
                    ))}
                  </select>
                </div>
                {selected && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {TXN_FIELDS.filter(
                        (f) => !f.modes || f.modes.includes(String(txn.mode ?? "").toUpperCase()),
                      ).map((f) => (
                        <div key={f.key}>
                          <label className="text-xs text-muted-foreground">{f.label}</label>
                          {f.options ? (
                            <select
                              className={input}
                              value={txn[f.key] ?? ""}
                              onChange={(e) => setTxn({ ...txn, [f.key]: e.target.value })}
                            >
                              <option value="">—</option>
                              {f.options.map((o) => (
                                <option key={o} value={o}>
                                  {o.toUpperCase()}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              className={input}
                              type={f.type ?? "text"}
                              value={txn[f.key] ?? ""}
                              onChange={(e) => setTxn({ ...txn, [f.key]: e.target.value })}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg border border-border bg-secondary/40 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Live generated description preview (DEMO/TEST)
                      </p>
                      <p className="text-xs leading-relaxed break-words font-mono">
                        {generateDemoDescription(txn as any)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {msg && (
              <p className={`mt-4 text-sm ${msg.ok ? "text-primary" : "text-destructive"}`}>{msg.text}</p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                disabled={busy}
                onClick={tab === "profile" ? doSaveProfile : doSaveTxn}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                {busy ? "Saving…" : "Save"}
              </button>
              <button onClick={onClose} className="rounded-md bg-secondary px-4 py-2 text-sm">Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
