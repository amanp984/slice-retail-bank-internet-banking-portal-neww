import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured, type Txn } from "@/integrations/supabase/client";

type State = {
  txns: Txn[];
  balance: number;
  loading: boolean;
  error: string | null;
  configured: boolean;
};

export function useTransactions(limit = 50) {
  const [state, setState] = useState<State>({
    txns: [],
    balance: 0,
    loading: true,
    error: null,
    configured: isSupabaseConfigured,
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    let mounted = true;

    const sortNewestFirst = (rows: Txn[]) =>
      [...rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const load = async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!mounted) return;
      if (error) {
        // eslint-disable-next-line no-console
        console.error("[useTransactions] load error:", error);
        setState((s) => ({ ...s, loading: false, error: error.message }));
        return;
      }
      const txns = sortNewestFirst((data ?? []) as Txn[]);
      setState({
        txns,
        balance: Number(txns[0]?.balance_after_transaction ?? 0),
        loading: false,
        error: null,
        configured: true,
      });
    };

    load();

    const channel = supabase
      .channel(`public:transactions:${limit}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        (payload) => {
          if (!mounted) return;
          setState((s) => {
            if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as Partial<Txn>).id;
              const next = s.txns.filter((txn) => txn.id !== deletedId);
              return { ...s, txns: next, balance: Number(next[0]?.balance_after_transaction ?? s.balance) };
            }

            const t = payload.new as Txn;
            const merged = s.txns.some((txn) => txn.id === t.id)
              ? s.txns.map((txn) => (txn.id === t.id ? t : txn))
              : [t, ...s.txns];
            const next = sortNewestFirst(merged).slice(0, limit);
            return { ...s, txns: next, balance: Number(next[0]?.balance_after_transaction ?? s.balance) };
          });
        }
      )
      .subscribe((status) => {
        // eslint-disable-next-line no-console
        console.log("[useTransactions] realtime status:", status);
      });

    // Safety-net polling in case realtime is not enabled on the table.
    const poll = setInterval(load, 8000);

    return () => {
      mounted = false;
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return state;
}
