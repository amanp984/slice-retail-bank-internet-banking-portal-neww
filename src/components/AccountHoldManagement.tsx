import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/hooks/useTransactions";
import { useCustomer, loadProfile } from "@/lib/customer";
import { accountBalances, validateHoldAmount } from "@/lib/banking";
import { formatINR } from "@/lib/supabase-helpers";
import { getAdminPassword } from "@/lib/admin-api";
import { saveAccountHold } from "@/lib/hold.functions";

export function AccountHoldManagement() {
  const customer = useCustomer();
  const { balance, loading, error } = useTransactions(1);
  const saveHold = useServerFn(saveAccountHold);
  const [amount, setAmount] = useState("0.00");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const balances = accountBalances(balance, customer.holdAmount);

  useEffect(() => {
    setAmount(customer.holdAmount.toFixed(2));
  }, [customer.holdAmount]);

  async function save(reset: boolean) {
    setMessage(null);
    setBusy(true);
    try {
      const value = reset ? "0.00" : amount;
      validateHoldAmount(value);
      const result = await saveHold({ data: {
        password: getAdminPassword(), accountNumber: customer.accountNumber, amount: value,
      } });
      await loadProfile();
      setAmount(result.holdAmount.toFixed(2));
      setMessage({ ok: true, text: reset ? "Hold Amount reset to ₹0.00. Ledger balance is unchanged." : "Hold Amount saved. Available balance updated; ledger balance is unchanged." });
    } catch (failure) {
      setMessage({ ok: false, text: failure instanceof Error ? failure.message : "Hold Amount could not be saved." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="hold-management-title" className="mt-5 border-t border-border pt-4 space-y-3">
      <h3 id="hold-management-title" className="font-semibold text-sm">Account Balance &amp; Hold Management</h3>
      <p className="text-xs text-muted-foreground">Simulation / Test Environment — Not an official bank record</p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {[
          ["Account Holder", customer.holderName],
          ["Masked Account Number", `•••• ${customer.accountNumber.slice(-4)}`],
          ["Ledger Balance", loading ? "Loading…" : error ? "Unavailable" : formatINR(balances.ledgerBalance)],
          ["Current Hold Amount", formatINR(balances.holdAmount)],
          ["Available Balance", loading ? "Loading…" : error ? "Unavailable" : formatINR(balances.availableBalance)],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-medium break-words">{value}</dd>
          </div>
        ))}
      </dl>
      <div>
        <label htmlFor="hold-amount" className="text-xs text-muted-foreground">Hold Amount (₹)</label>
        <input id="hold-amount" type="text" inputMode="decimal" disabled={busy} value={amount}
          aria-invalid={message?.ok === false} aria-describedby={message ? "hold-message" : undefined}
          onChange={(event) => setAmount(event.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy || loading || Boolean(error)} onClick={() => save(false)}>{busy ? "Saving…" : "Save Changes"}</Button>
        <Button variant="outline" disabled={busy || loading || Boolean(error)} onClick={() => save(true)}>Reset Hold Amount</Button>
      </div>
      {message && <p id="hold-message" role={message.ok ? "status" : "alert"} className={`text-sm ${message.ok ? "text-primary" : "text-destructive"}`}>{message.text}</p>}
    </section>
  );
}