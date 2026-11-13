import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { StatementDateRange } from "./StatementDateRange";
import { presetRange, rangeBounds, type StatementRange } from "@/lib/banking";
import { formatINR, formatSignedTransactionINR, type Txn } from "@/lib/supabase-helpers";
import { formatDescription } from "@/lib/formatTxn";
import { downloadStatementCsv, downloadStatementPdf } from "@/lib/statement";
import { useAccountBalances } from "@/hooks/useAccountBalances";

export function AccountStatement({ accountNumber, ledgerReference = accountNumber, ledgerBalance, initialView = false }: { accountNumber: string; ledgerReference?: string; ledgerBalance: number; initialView?: boolean }) {
  const [range, setRange] = useState<StatementRange>(() => presetRange("This Month"));
  const [rows, setRows] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState(initialView);
  const balances = useAccountBalances(ledgerBalance, accountNumber);
  useEffect(() => { setView(initialView); }, [initialView]);
  useEffect(() => {
    let cancelled = false, generation = 0;
    const load = async () => {
      const current = ++generation;
      setLoading(true); setError(""); setRows([]);
      try {
        const bounds = rangeBounds(range);
        const collected: Txn[] = [];
        for (let offset = 0; ; offset += 1000) {
          const { data, error: failure } = await supabase.from("transactions").select("*").eq("account_reference", ledgerReference)
            .gte("created_at", bounds.start).lt("created_at", bounds.endExclusive).order("created_at", { ascending: true }).order("id").range(offset, offset + 999);
          if (failure) throw new Error("Statement transactions could not be loaded.");
          collected.push(...(data ?? []) as Txn[]);
          if (!data || data.length < 1000) break;
        }
        if (!cancelled && current === generation) setRows(collected);
      } catch (failure) { if (!cancelled && current === generation) setError(failure instanceof Error ? failure.message : "Statement could not be loaded."); }
      finally { if (!cancelled && current === generation) setLoading(false); }
    };
    void load();
    const channel = supabase.channel(`statement:${accountNumber}:${range.start}:${range.end}`).on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => void load()).subscribe();
    const interval = setInterval(() => void load(), 8000);
    return () => { cancelled = true; clearInterval(interval); void supabase.removeChannel(channel); };
  }, [accountNumber, ledgerReference, range.start, range.end]);
  const disabled = loading || !!error || rows.length === 0;
  return <div className="space-y-4" id="account-statement">
    <p className="text-xs text-muted-foreground">Account {accountNumber}</p>
    <StatementDateRange value={range} onChange={setRange} />
    <dl className="grid grid-cols-1 gap-1 text-xs">
      <div className="flex justify-between gap-3"><dt>Ledger Balance</dt><dd>{formatINR(balances.ledgerBalance)}</dd></div>
      <div className="flex justify-between gap-3"><dt>Hold Amount</dt><dd>{formatINR(balances.holdAmount)}</dd></div>
      <div className="flex justify-between gap-3"><dt>Available Balance</dt><dd>{formatINR(balances.availableBalance)}</dd></div>
    </dl>
    {loading ? <p className="text-xs text-muted-foreground">Loading…</p> : error ? <p role="alert" className="text-xs text-destructive">{error}</p> : <p className="text-xs text-muted-foreground">{rows.length ? `${rows.length} transactions` : "No transactions found for this period"}</p>}
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" disabled={disabled} onClick={() => setView(!view)}>View Statement</Button>
      <Button variant="outline" size="sm" disabled={disabled} onClick={() => downloadStatementPdf(rows, ledgerBalance, { range, accountNumber, holdAmount: balances.holdAmount })}>Download PDF</Button>
      <Button variant="outline" size="sm" disabled={disabled} onClick={() => downloadStatementCsv(rows)}>Download CSV</Button>
    </div>
    {view && <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Simulation / Test Environment — Not an official bank record</p>
      <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr>{["Date", "Description", "Reference", "Amount", "Ledger Balance"].map((heading) => <th key={heading} className="text-left p-2 whitespace-nowrap">{heading}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-border"><td className="p-2 whitespace-nowrap">{new Date(row.created_at).toLocaleDateString("en-IN")}</td><td className="p-2 min-w-40 break-words">{formatDescription(row)}</td><td className="p-2 break-all">{row.external_id || "—"}</td><td className="p-2 whitespace-nowrap">{formatSignedTransactionINR(row.amount, row.type)}</td><td className="p-2 whitespace-nowrap">{formatINR(row.balance_after_transaction)}</td></tr>)}</tbody>
      </table></div>
    </div>}
  </div>;
}