import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Txn } from "@/integrations/supabase/client";
import { formatDescription } from "./formatTxn";

const fmtAmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(Math.abs(n));
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

export function todayFileStamp(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-IN", { month: "short" });
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function downloadStatementPdf(txns: Txn[], balance: number) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Slice Bank — Account Statement", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 14, 25);
  doc.text(`Available Balance: INR ${fmtAmt(balance)}`, 14, 31);

  autoTable(doc, {
    startY: 38,
    head: [["Date", "Description", "Type", "Amount (INR)", "Balance (INR)"]],
    body: txns.map((t) => [
      fmtDate(t.created_at),
      formatDescription(t),
      t.type === "credit" ? "Credit" : "Debit",
      `${t.type === "debit" ? "-" : "+"}${fmtAmt(t.amount)}`,
      fmtAmt(t.balance_after_transaction),
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [220, 38, 38] },
  });

  doc.save(`statement-${todayFileStamp()}.pdf`);
}

export function downloadStatementCsv(txns: Txn[]) {
  const header = ["Date", "Description", "Type", "Amount", "Balance"];
  const rows = txns.map((t) => [
    fmtDate(t.created_at),
    formatDescription(t).replace(/"/g, '""'),
    t.type,
    (t.type === "debit" ? "-" : "+") + fmtAmt(t.amount),
    fmtAmt(t.balance_after_transaction),
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((c) => `"${String(c)}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `statement-${todayFileStamp()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
