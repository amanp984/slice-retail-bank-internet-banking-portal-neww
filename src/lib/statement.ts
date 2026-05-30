import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Txn } from "@/integrations/supabase/client";
import { formatDescription } from "./formatTxn";
import { CUSTOMER } from "./customer";

const fmtRupee = (n: number) =>
  "Rs " +
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Math.round(Math.abs(n))
  );
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
  const marginX = 48;

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
  const closingBalance = Number(
    sorted[sorted.length - 1]?.balance_after_transaction ?? 0
  );
  const openingBalance = closingBalance - (totalCredits - totalDebits);

  const drawChrome = () => {
    // Logo: "slice" wordmark + "BUSINESS" subtitle
    doc.setTextColor(232, 0, 130);
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(26);
    doc.text("slice", marginX, 62);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("BUSINESS", marginX, 76);

    // Right side: period
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(period, pageW - marginX, 62, { align: "right" });

    // Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "Need help? Contact our support team at help@slice.bank",
      marginX,
      pageH - 26
    );
  };

  drawChrome();

  // ---------- Customer header section ----------
  let y = 130;
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(CUSTOMER.businessName.toUpperCase(), marginX, y);
  y += 24;

  // Two equal columns: left and right, each with [label, value]
  const leftRows: Array<[string, string]> = [
    ["Account holder", CUSTOMER.holderName],
    ["Customer ID", CUSTOMER.customerId],
    ["Phone", CUSTOMER.phone],
    ["Email", CUSTOMER.email],
    ["Nominee", CUSTOMER.nominee],
    ["Address", CUSTOMER.address],
    ["Account Opening Date", CUSTOMER.openingDate],
  ];
  const rightRows: Array<[string, string]> = [
    ["Account", `${CUSTOMER.accountType} ACCOUNT`],
    ["A/C number", CUSTOMER.accountNumber],
    ["IFSC", CUSTOMER.ifsc],
    ["MICR", CUSTOMER.micr],
    ["PAN", CUSTOMER.pan],
    ["Aadhaar", CUSTOMER.aadhaarMasked],
    ["Branch", CUSTOMER.branch],
  ];

  const contentW = pageW - marginX * 2;
  const colGap = 24;
  const colW = (contentW - colGap) / 2;
  const labelW = 100;
  const valueW = colW - labelW - 8;

  const renderCol = (
    rows: Array<[string, string]>,
    startX: number,
    startY: number
  ) => {
    let cy = startY;
    rows.forEach(([label, value]) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(130, 130, 130);
      doc.text(label, startX, cy);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(25, 25, 25);
      const wrapped = doc.splitTextToSize(value || "-", valueW);
      doc.text(wrapped, startX + labelW, cy);

      const lines = Array.isArray(wrapped) ? wrapped.length : 1;
      cy += Math.max(20, lines * 14 + 6);
    });
    return cy;
  };

  const leftEndY = renderCol(leftRows, marginX, y);
  const rightEndY = renderCol(rightRows, marginX + colW + colGap, y);
  y = Math.max(leftEndY, rightEndY) + 24;

  // ---------- Summary row ----------
  const summaryCols: Array<{
    label: string;
    value: string;
    sym?: string;
    valueColor?: [number, number, number];
  }> = [
    { label: "Opening balance", value: fmtRupee(openingBalance) },
    { label: "Total credits", value: fmtRupee(totalCredits), sym: "+" },
    {
      label: "Redeemed coin value",
      value: fmtRupee(0),
      sym: "+",
      valueColor: [22, 163, 74],
    },
    { label: "Total debits", value: fmtRupee(totalDebits), sym: "-" },
    { label: "Closing balance", value: fmtRupee(closingBalance), sym: "=" },
  ];
  const sumColW = contentW / summaryCols.length;
  summaryCols.forEach((c, i) => {
    const cx = marginX + sumColW * i;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(140, 140, 140);
    doc.text(c.label, cx, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    const vc = c.valueColor ?? [20, 20, 20];
    doc.setTextColor(vc[0], vc[1], vc[2]);
    doc.text(c.value, cx, y + 24);
    if (c.sym && i > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(16);
      doc.setTextColor(170, 170, 170);
      doc.text(c.sym, cx - 10, y + 18, { align: "center" });
    }
  });
  y += 60;

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

  // Table widths: Date 10% / Description 40% / Ref 22% / Amount 14% / Balance 14%
  const tableW = contentW;
  const dateW = tableW * 0.1;
  const descW = tableW * 0.4;
  const refW = tableW * 0.22;
  const amtW = tableW * 0.14;
  const balW = tableW * 0.14;

  autoTable(doc, {
    startY: y,
    head: [["DATE", "DETAILS", "REF NO.", "AMOUNT", "BALANCE"]],
    body,
    theme: "plain",
    styles: {
      fontSize: 10,
      cellPadding: { top: 16, bottom: 16, left: 6, right: 6 },
      textColor: [25, 25, 25],
      valign: "top",
      lineHeight: 1.5,
      overflow: "linebreak",
    },
    headStyles: {
      fontStyle: "bold",
      textColor: [120, 120, 120],
      fontSize: 9,
      lineWidth: 0,
      fillColor: [255, 255, 255],
      cellPadding: { top: 6, bottom: 12, left: 6, right: 6 },
    },
    bodyStyles: {
      lineWidth: 0,
      fillColor: [255, 255, 255],
    },
    didDrawCell: (data) => {
      if (data.column.index === 0) {
        const { doc: d, cell, table } = data;
        d.setDrawColor(data.section === "head" ? 210 : 235);
        d.setLineWidth(0.5);
        const yLine = cell.y + cell.height;
        d.line(
          table.settings.margin.left,
          yLine,
          pageW - table.settings.margin.right,
          yLine
        );
      }
    },
    columnStyles: {
      0: { cellWidth: dateW, halign: "left" },
      1: { cellWidth: descW, halign: "left" },
      2: { cellWidth: refW, halign: "left" },
      3: { cellWidth: amtW, halign: "right" },
      4: { cellWidth: balW, halign: "right" },
    },
    margin: { left: marginX, right: marginX, top: 100, bottom: 60 },
    didDrawPage: () => {
      drawChrome();
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY ?? y;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  if (finalY < pageH - 70) {
    doc.text(
      `Generated on ${fmtShortDate(new Date().toISOString())}`,
      marginX,
      finalY + 24
    );
  }

  // Add page X/Y on every page
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const total = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(160, 160, 160);
    doc.text(`${i}/${total}`, pageW - marginX, 78, { align: "right" });
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
