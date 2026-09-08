import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { verifyAdmin, saveProfileRow, saveTransactionRow, createTransactionRow } from "@/lib/admin-api";
import { getProfileRecord, profileToRow, loadProfile } from "@/lib/customer";
import { generateDemoDescription } from "@/lib/demoDescription";

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
  const [adding, setAdding] = useState(false);
  const [newMode, setNewMode] = useState<string>("");
  const [newTxn, setNewTxn] = useState<Record<string, any>>({});
  const [liveNow, setLiveNow] = useState(true);

  // Keep the date/time pinned to "now" while the real-time toggle is on.
  useEffect(() => {
    if (!adding || !liveNow) return;
    const tick = () => setNewTxn((t) => ({ ...t, created_at: new Date().toISOString() }));
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [adding, liveNow, newMode]);

  const refreshTxns = async (selectId?: string) => {
    const { data } = await (supabase as any)
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    const rows = data ?? [];
    setTxns(rows);
    if (selectId) {
      const row = rows.find((r: any) => r.id === selectId);
      if (row) {
        setSelected(selectId);
        setTxn({ ...row });
      }
    }
  };

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
      await saveTransactionRow(selected, {
        ...txn,
        description: generateDemoDescription(txn as any),
      });
      setMsg({ ok: true, text: "Transaction saved and balances recalculated." });
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || "Save failed" });
    } finally {
      setBusy(false);
    }
  };

  const startAdd = () => {
    setAdding(true);
    setNewMode("");
    setLiveNow(true);
    setNewTxn({ type: "credit", created_at: new Date().toISOString() });
    setMsg(null);
  };

  const doCreateTxn = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const payload = {
        ...newTxn,
        mode: newMode === "Refund" ? "REFUND" : newMode,
        description: generateDemoDescription({ ...newTxn, mode: newMode } as any),
      };
      const res: any = await createTransactionRow(payload);
      await refreshTxns(res?.id);
      setTab("txn");
      setAdding(false);
      setMsg({ ok: true, text: "New transaction created and balances recalculated." });
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || "Could not create transaction" });
    } finally {
      setBusy(false);
    }
  };

  const addFields = (mode: string): TxnField[] => {
    const base: TxnField[] = [
      { key: "type", label: "Credit / Debit", options: ["credit", "debit"] },
      { key: "sender_name", label: "Beneficiary / Sender Name" },
      { key: "amount", label: "Amount", type: "number" },
      { key: "external_id", label: "UTR / Reference" },
    ];
    if (mode === "UPI") base.push({ key: "upi_id", label: "UPI ID (VPA)" });
    if (["IMPS", "NEFT", "RTGS"].includes(mode)) {
      base.push({ key: "beneficiary_account", label: "Beneficiary Account" });
      base.push({ key: "beneficiary_ifsc", label: "Beneficiary IFSC" });
    }
    if (mode === "Refund") base.push({ key: "beneficiary_account", label: "Original Account (optional)" });
    return base;
  };

  const toLocalInput = (iso?: string) => {
    const d = iso ? new Date(iso) : new Date();
    if (Number.isNaN(d.getTime())) return "";
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
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
              <button
                onClick={startAdd}
                className="rounded-md border border-primary px-3 py-1.5 text-sm font-medium text-primary"
              >
                + Add Transaction
              </button>
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

      {authed && adding && (
        <div className="fixed inset-0 z-[60] bg-black/60 grid place-items-center p-4">
          <div className="bg-card w-full max-w-2xl max-h-[85vh] overflow-auto rounded-2xl border border-border p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add Transaction (DEMO/TEST)</h2>
              <button onClick={() => setAdding(false)} className="text-sm text-muted-foreground hover:text-foreground">
                Close
              </button>
            </div>

            {!newMode ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Choose the transaction type</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {["UPI", "IMPS", "NEFT", "RTGS", "Refund"].map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setNewMode(m);
                        setNewTxn((t) => ({ ...t, mode: m, type: m === "Refund" ? "credit" : t.type ?? "credit" }));
                      }}
                      className="rounded-xl border border-border bg-secondary/40 px-4 py-6 text-sm font-semibold hover:border-primary"
                    >
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{newMode.toUpperCase()} transaction</p>
                  <button onClick={() => setNewMode("")} className="text-xs text-muted-foreground hover:text-foreground">
                    Change type
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {addFields(newMode).map((f) => (
                    <div key={f.key}>
                      <label className="text-xs text-muted-foreground">{f.label}</label>
                      {f.options ? (
                        <select
                          className={input}
                          value={newTxn[f.key] ?? ""}
                          onChange={(e) => setNewTxn({ ...newTxn, [f.key]: e.target.value })}
                        >
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
                          value={newTxn[f.key] ?? ""}
                          onChange={(e) => setNewTxn({ ...newTxn, [f.key]: e.target.value })}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-border p-3 space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={liveNow} onChange={(e) => setLiveNow(e.target.checked)} />
                    Today / Real-time (uses the current date and time until saved)
                  </label>
                  <div>
                    <label className="text-xs text-muted-foreground">Transaction Date/Time</label>
                    <input
                      className={input}
                      type="datetime-local"
                      disabled={liveNow}
                      value={toLocalInput(newTxn.created_at)}
                      onChange={(e) =>
                        setNewTxn({ ...newTxn, created_at: new Date(e.target.value).toISOString() })
                      }
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Live generated description preview (DEMO/TEST)
                  </p>
                  <p className="text-xs leading-relaxed break-words font-mono">
                    {generateDemoDescription({ ...newTxn, mode: newMode } as any)}
                  </p>
                </div>

                {msg && !msg.ok && <p className="text-sm text-destructive">{msg.text}</p>}

                <div className="flex gap-2 pt-1">
                  <button
                    disabled={busy}
                    onClick={doCreateTxn}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  >
                    {busy ? "Saving…" : "Save transaction"}
                  </button>
                  <button onClick={() => setAdding(false)} className="rounded-md bg-secondary px-4 py-2 text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
