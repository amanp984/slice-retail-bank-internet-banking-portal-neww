import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Txn } from "@/lib/supabase-helpers";
import { formatDescription } from "./formatTxn";
import { CUSTOMER } from "./customer";

// Shared PDF money formatter. Built-in jsPDF Helvetica does NOT include the
// ₹ glyph (U+20B9) — using it produces the "1 2 , 0 0 8 . 0 0" letter-spacing
// artifact and stray characters like ¹. We render "Rs " as plain ASCII, which
// the built-in font handles with normal kerning. Indian comma grouping is
// preserved via en-IN locale.
export const formatCurrencyINR = (n: number): string => {
  const v = Number(n) || 0;
  const abs = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(v));
  return `${v < 0 ? "-" : ""}Rs ${abs}`;
};

const fmtRupee = (n: number) => formatCurrencyINR(n);
const fmtRupeeSigned = (n: number, type: "credit" | "debit") =>
  formatCurrencyINR(type === "debit" ? -Math.abs(Number(n) || 0) : Math.abs(Number(n) || 0));

// Strip any non-ASCII glyphs (e.g. ₹) from strings passed into jsPDF, so a
// stray ₹ inside a transaction description cannot re-introduce the broken
// letter-spacing artifact next to numbers.
const sanitize = (s: string): string =>
  (s || "").replace(/₹/g, "Rs ").replace(/[^\x20-\x7E]/g, "");
const fmtShortDate = (iso: string) => {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleString("en-IN", { month: "short" });
  const yr = String(d.getFullYear()).slice(-2);
  return `${day} ${mon} ${yr}`; // Changed from backtick year to single line format
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
  const marginX = 56;
  const marginTop = 132;
  const marginBottom = 60;

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
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(105, 105, 105);
    doc.text("Simulation / Test Environment - Not an official bank record", marginX, 96);

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
  let y = marginTop;
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  const nameLines = doc.splitTextToSize(sanitize(CUSTOMER.holderName.toUpperCase()), pageW - marginX * 2);
  doc.text(nameLines, marginX, y, { lineHeightFactor: 1.2 });
  y += nameLines.length * 24 + 12;

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
  const labelW = 106;
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
      const labelLines = doc.splitTextToSize(label, labelW - 8);
      doc.text(labelLines, startX, cy, { lineHeightFactor: 1.35 });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(25, 25, 25);
      const valueLines = doc.splitTextToSize(sanitize(value || "-"), valueW);
      doc.text(valueLines, startX + labelW, cy, { lineHeightFactor: 1.3 });

      cy += Math.max(24, labelLines.length * 15, valueLines.length * 16) + 6;
    });
    return cy;
  };

  const leftEndY = renderCol(leftRows, marginX, y);
  const rightEndY = renderCol(rightRows, marginX + colW + colGap, y);
  y = Math.max(leftEndY, rightEndY) + 32;

  // Very long profile values should not squeeze the summary into the footer.
  if (y > pageH - 175) {
    doc.addPage();
    drawChrome();
    y = marginTop;
  }

  // ---------- Summary row ----------
  // 5 equal, centered columns (grid: repeat(5, 1fr)). Labels share one
  // baseline, values share one baseline, no per-column offsets.
  const summaryCols: Array<{
    label: string;
    value: string;
    valueColor?: [number, number, number];
  }> = [
    { label: "Opening balance", value: `${fmtRupee(openingBalance)}+` },
    { label: "Total credits", value: `${fmtRupee(totalCredits)}+` },
    {
      label: "Redeemed coin value",
      value: `${fmtRupee(0)}-`,
      valueColor: [30, 155, 71],
    },
    { label: "Total debits", value: `${fmtRupee(totalDebits)}-` },
    { label: "Closing balance", value: fmtRupee(closingBalance) },
  ];

  const sumColW = contentW / summaryCols.length; // identical 1fr columns
  const sumInnerW = sumColW;                     // horizontal gap 0
  const LABEL_SIZE = 8.25;                       // 11px
  // 24px target, shrunk uniformly (never per-column) if the longest amount
  // would not fit a 1fr cell, so every value keeps one identical type size.
  doc.setFont("helvetica", "bold");
  let VALUE_SIZE = 18;
  const widestValue = summaryCols.reduce(
    (w, c) => Math.max(w, doc.getStringUnitWidth(c.value)),
    0
  );
  const maxValueW = sumColW - 8;
  if (widestValue * VALUE_SIZE > maxValueW) {
    VALUE_SIZE = Math.floor((maxValueW / widestValue) * 10) / 10;
  }
  const LABEL_LINE = 10;                         // label line height
  const LABEL_ROWS = 1;                          // reserved label height (equal for all)
  const labelBaselineY = y + LABEL_LINE;
  // gap between label block and amount = 8px (6pt); value baseline is uniform
  const summaryBaselineY =
    labelBaselineY + (LABEL_ROWS - 1) * LABEL_LINE + 6 + VALUE_SIZE;

  summaryCols.forEach((c, i) => {
    const cx = marginX + sumColW * i + sumColW / 2; // centre of the cell

    // Label — 11px / 500 / #8B8B8B, centered, single shared baseline
    doc.setFont("helvetica", "normal");
    doc.setFontSize(LABEL_SIZE);
    doc.setTextColor(139, 139, 139);
    doc.text(c.label, cx, labelBaselineY, {
      align: "center",
      maxWidth: sumInnerW,
    });

    // Amount — 24px / 700 / line-height 1, same baseline for every column
    doc.setFont("helvetica", "bold");
    doc.setFontSize(VALUE_SIZE);
    doc.setCharSpace(0);
    const vc = c.valueColor ?? [17, 17, 17];
    doc.setTextColor(vc[0], vc[1], vc[2]);
    doc.text(c.value, cx, summaryBaselineY, { align: "center" });
  });
  y = summaryBaselineY + 42; // extra whitespace separating summary from table

  // ---------- Transactions table ----------
  let running = openingBalance;
  const body = sorted.map((t) => {
    const amt = Number(t.amount);
    running += t.type === "credit" ? amt : -amt;
    return [
      fmtShortDate(t.created_at),
      sanitize(formatDescription(t)),
      t.external_id || "-",
      fmtRupeeSigned(amt, t.type),
      fmtRupee(running),
    ];
  });

  // Table widths: give Amount + Balance enough room so values like
  // -₹19,999.78 and ₹143,000.00 never wrap or overlap the ref column.
  const tableW = contentW;
  const dateW = tableW * 0.12;
  const descW = tableW * 0.35;
  const refW = tableW * 0.20;
  const amtW = tableW * 0.16;
  const balW = tableW * 0.17;

  autoTable(doc, {
    startY: y,
    head: [["DATE", "DETAILS", "REF NO.", "AMOUNT", "BALANCE"]],
    body,
    theme: "plain",
    tableWidth: tableW,
    styles: {
      font: "helvetica",
      fontStyle: "normal",
      fontSize: 9.5,
      cellPadding: { top: 14, bottom: 14, left: 6, right: 6 },
      textColor: [40, 40, 40],
      valign: "middle",
      overflow: "linebreak",
      minCellHeight: 34,
    },
    headStyles: {
      fontStyle: "bold",
      textColor: [150, 150, 150],
      fontSize: 8,
      lineWidth: 0,
      fillColor: [255, 255, 255],
      cellPadding: { top: 8, bottom: 16, left: 6, right: 6 },
      valign: "middle",
    },
    bodyStyles: {
      lineWidth: 0,
      fillColor: [255, 255, 255],
      valign: "middle",
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
      1: { cellWidth: descW, halign: "left", cellPadding: { top: 14, bottom: 14, left: 6, right: 10 } },
      2: { cellWidth: refW, halign: "left", cellPadding: { top: 14, bottom: 14, left: 8, right: 8 } },
      3: {
        cellWidth: amtW,
        halign: "right",
        fontStyle: "bold",
        cellPadding: { top: 14, bottom: 14, left: 5, right: 5 },
      },
      4: {
        cellWidth: balW,
        halign: "right",
        fontStyle: "bold",
        cellPadding: { top: 14, bottom: 14, left: 5, right: 0 },
      },
    },
    margin: { left: marginX, right: marginX, top: marginTop, bottom: marginBottom },
    didDrawPage: () => {
      drawChrome();
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY ?? y;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  if (finalY < pageH - marginBottom) {
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
  const header = ["Date", "Description", "Reference", "Type", "Amount", "Balance"];
  const rows = txns.map((t) => [
    fmtShortDate(t.created_at),
    formatDescription(t).replace(/"/g, '""'),
    (t.external_id || "").replace(/"/g, '""'),
    t.type,
    fmtRupeeSigned(t.amount, t.type),
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
