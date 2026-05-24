import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ChevronLeft, ChevronRight, Search, Download } from "lucide-react";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTransactions } from "@/hooks/useTransactions";
import { formatDescription } from "@/lib/formatTxn";
import { downloadStatementPdf } from "@/lib/statement";

export const Route = createFileRoute("/transactions")({
  head: () => ({ meta: [{ title: "Transaction History — Slice Bank" }] }),
  component: TransactionsPage,
});

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(Math.abs(n));
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
};

function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const pageSize = 10;
  const { txns, balance, loading } = useTransactions(200);

  const filtered = useMemo(
    () =>
      txns.filter((t) => {
        const s = q.toLowerCase();
        const desc = formatDescription(t).toLowerCase();
        return (
          desc.includes(s) ||
          (t.sender_name ?? "").toLowerCase().includes(s) ||
          t.type.includes(s)
        );
      }),
    [q, txns]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const slice = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <DashboardLayout showGreeting={false}>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <p className="text-sm text-muted-foreground mt-1">View all your past transactions</p>
        </div>
        <button
          onClick={() => downloadStatementPdf(filtered, balance)}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm border border-border rounded-lg hover:bg-secondary font-medium"
        >
          <Download className="w-4 h-4" /> Download
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-5 mt-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Search transactions"
              className="pl-9 pr-3 py-2 text-sm border border-border rounded-lg w-64 focus:outline-none focus:border-primary"
            />
          </div>
          <span className="text-xs text-muted-foreground">{filtered.length} transactions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left font-medium py-3 pr-4 whitespace-nowrap">Date</th>
                <th className="text-left font-medium py-3 pr-6">Description</th>
                <th className="text-left font-medium py-3 pr-6 whitespace-nowrap">Type</th>
                <th className="text-right font-medium py-3 pr-6 whitespace-nowrap">Amount (₹)</th>
                <th className="text-right font-medium py-3 pr-6 whitespace-nowrap">Balance (₹)</th>
                <th className="text-right font-medium py-3 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {slice.map((t) => (
                  <motion.tr
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-secondary/30"
                  >
                    <td className="py-4 pr-4 text-foreground whitespace-nowrap align-top border-b border-border/60">{fmtDate(t.created_at)}</td>
                    <td className="py-4 pr-6 text-foreground leading-relaxed align-top border-b border-border/60">{formatDescription(t)}</td>
                    <td className="py-4 pr-6 text-muted-foreground align-top border-b border-border/60">{t.type === "credit" ? "Credit" : "Debit"}</td>
                    <td className="py-4 pr-6 text-right font-medium text-foreground tabular-nums whitespace-nowrap align-top border-b border-border/60">
                      {t.type === "debit" ? "-" : "+"}{fmt(t.amount)}
                    </td>
                    <td className="py-4 pr-6 text-right text-foreground tabular-nums whitespace-nowrap align-top border-b border-border/60">{fmt(t.balance_after_transaction)}</td>
                    <td className="py-4 text-right align-top border-b border-border/60">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-green-100 text-green-700">Success</span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {!loading && slice.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No transactions found</td></tr>
              )}
              {loading && slice.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Loading…</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-md border border-border grid place-items-center hover:bg-secondary disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-md text-sm font-semibold ${
                  page === n ? "bg-primary text-primary-foreground" : "border border-border hover:bg-secondary"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-md border border-border grid place-items-center hover:bg-secondary disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
