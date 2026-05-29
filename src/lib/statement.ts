import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Txn } from "@/integrations/supabase/client";
import { formatDescription } from "./formatTxn";
import { CUSTOMER } from "./customer";

const fmtRupee = (n: number) =>
  "Rs " + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(Math.abs(n)));
const fmtRupeeSigned = (n: number, type: "credit" | "debit") =>
  (type === "debit" ? "-" : "") + fmtRupee(n);
const fmtShortDate = (iso: string) => {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleString("en-IN", { month: "short" });
  const yr = String(d.getFullYear()).slice(-2);
  return `${day} ${mon} '${yr}`;
};

export function todayFileStamp(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-IN", { month: "short" });
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function downloadStatementPdf(txns: Txn[], _balance: number) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 40;

  // Sort chronologically (oldest -> newest) so running balance grows.
  const sorted = [...txns].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Derive period & totals
  const firstDate = sorted[0]?.created_at ?? new Date().toISOString();
  const lastDate = sorted[sorted.length - 1]?.created_at ?? new Date().toISOString();
  const period = `${fmtShortDate(firstDate)} - ${fmtShortDate(lastDate)}`;

  const totalCredits = sorted
    .filter((t) => t.type === "credit")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalDebits = sorted
    .filter((t) => t.type === "debit")
    .reduce((s, t) => s + Number(t.amount), 0);
  // Opening balance = closing balance of newest txn - net change (approx)
  const closingBalance = Number(
    sorted[sorted.length - 1]?.balance_after_transaction ?? 0
  );
  const openingBalance = closingBalance - (totalCredits - totalDebits);

  // Renders the slice-style header + footer on every page.
  const drawChrome = () => {
    // Logo: "slice" wordmark + "BUSINESS" subtitle (image-free, brand pink)
    doc.setTextColor(232, 0, 130); // slice pink
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(22);
    doc.text("slice", marginX, 56);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("BUSINESS", marginX, 70);

    // Right side: period + page number
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(period, pageW - marginX, 56, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150);
    doc.setFontSize(9);
    // Page number is filled later via doc.putTotalPages-style replacement
    // We'll write it post-hoc; placeholder here.

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      "Need help? Contact our support team at help@slice.bank.in or +91-8048329999",
      marginX,
      pageH - 24
    );
    doc.text("slice small finance bank", pageW - marginX, pageH - 24, { align: "right" });
  };

  drawChrome();

  // ---------- Customer header section ----------
  let y = 110;
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(CUSTOMER.businessName.toUpperCase(), marginX, y);
  y += 18;

  const detailRows: Array<[string, string, string, string]> = [
    ["Account holder", CUSTOMER.holderName, "Account", CUSTOMER.accountType],
    ["Customer ID", CUSTOMER.customerId, "A/C number", CUSTOMER.accountNumber],
    ["Phone", CUSTOMER.phone, "IFSC", CUSTOMER.ifsc],
    ["Email", CUSTOMER.email, "MICR", CUSTOMER.micr],
    ["Nominee", CUSTOMER.nominee, "PAN", CUSTOMER.pan],
    ["Address", CUSTOMER.address, "Branch", CUSTOMER.branch],
    ["Account Opening Date", CUSTOMER.openingDate, "Aadhaar", CUSTOMER.aadhaarMasked],
  ];

  autoTable(doc, {
    startY: y,
    body: detailRows,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: { top: 4, bottom: 4, left: 0, right: 6 }, valign: "top", textColor: [20, 20, 20] },
    columnStyles: {
      0: { cellWidth: 110, fontStyle: "normal", textColor: [110, 110, 110] },
      1: { cellWidth: 170 },
      2: { cellWidth: 70, fontStyle: "normal", textColor: [110, 110, 110] },
      3: { cellWidth: "auto" },
    },
    margin: { left: marginX, right: marginX },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 28;

  // ---------- Summary row ----------
  const summaryCols: Array<{ label: string; value: string; sym?: string; valueColor?: [number, number, number] }> = [
    { label: "Opening balance", value: fmtRupee(openingBalance) },
    { label: "Total credits", value: fmtRupee(totalCredits), sym: "+" },
    { label: "Redeemed coin value", value: fmtRupee(0), sym: "+", valueColor: [22, 163, 74] },
    { label: "Total debits", value: fmtRupee(totalDebits), sym: "-" },
    { label: "Closing balance", value: fmtRupee(closingBalance), sym: "=" },
  ];
  const colW = (pageW - marginX * 2) / summaryCols.length;
  summaryCols.forEach((c, i) => {
    const cx = marginX + colW * i;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(120);
    doc.text(c.label, cx, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    const vc = c.valueColor ?? [20, 20, 20];
    doc.setTextColor(vc[0], vc[1], vc[2]);
    doc.text(c.value, cx, y + 22);
    if (c.sym && i > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(160);
      doc.text(c.sym, cx - 8, y + 16, { align: "center" });
    }
  });
  y += 50;

  // ---------- Transactions table ----------
  let running = openingBalance;
  const body = sorted.map((t) => {
    const amt = Number(t.amount);
    running += t.type === "credit" ? amt : -amt;
    return [
      fmtShortDate(t.created_at),
      formatDescription(t),
      String(t.id).slice(0, 18),
      fmtRupeeSigned(amt, t.type),
      fmtRupee(running),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["Date", "Description", "Transaction ID", "Amount", "Balance"]],
    body,
    theme: "plain",
    styles: { fontSize: 8.5, cellPadding: 6, textColor: [20, 20, 20], valign: "top" },
    headStyles: {
      fontStyle: "normal",
      textColor: [140, 140, 140],
      fontSize: 8,
      lineWidth: 0,
      fillColor: [255, 255, 255],
    },
    bodyStyles: {
      lineWidth: 0,
      fillColor: [255, 255, 255],
    },
    didDrawCell: (data) => {
      // bottom border per row
      if (data.column.index === 0) {
        const { doc: d, cell, row, table } = data;
        d.setDrawColor(data.section === "head" ? 220 : 235);
        d.setLineWidth(0.4);
        const yLine = cell.y + cell.height;
        d.line(table.settings.margin.left, yLine, pageW - table.settings.margin.right, yLine);
        void row;
      }
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 230 },
      2: { cellWidth: 110 },
      3: { cellWidth: 70, halign: "right" },
      4: { cellWidth: 60, halign: "right" },
    },
    margin: { left: marginX, right: marginX, top: 90, bottom: 50 },
    didDrawPage: () => {
      // Re-draw header/footer on each new page
      drawChrome();
    },
  });

  // Generated-on stamp (above footer on last page)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY ?? y;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120);
  if (finalY < pageH - 60) {
    doc.text(`Generated on ${fmtShortDate(new Date().toISOString())}`, marginX, finalY + 20);
  }

  // Add page X/Y on every page
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const total = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`${i}/${total}`, pageW - marginX, 72, { align: "right" });
  }

  doc.save(`statement-${todayFileStamp()}.pdf`);
}

export function downloadStatementCsv(txns: Txn[]) {
  const header = ["Date", "Description", "Type", "Amount", "Balance"];
  const rows = txns.map((t) => [
    fmtShortDate(t.created_at),
    formatDescription(t).replace(/"/g, '""'),
    t.type,
    (t.type === "debit" ? "-" : "+") + fmtRupee(t.amount),
    fmtRupee(t.balance_after_transaction),
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
