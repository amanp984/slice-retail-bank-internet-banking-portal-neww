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
  const marginX = 48;
  const marginTop = 100; // Increased from implicit 130 for logo/header spacing
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
  let y = marginTop; // Use marginTop constant instead of hardcoded 130
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(CUSTOMER.businessName.toUpperCase(), marginX, y);
  y += 30; // Increased from 24 to provide better spacing after business name

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
  const colGap = 36; // Increased from 24 to 36 for better column separation
  const colW = (contentW - colGap) / 2;
  const labelW = 120; // Increased from 100 to accommodate longer labels like "Account Opening Date"
  const valueW = colW - labelW - 12; // Increased padding from 8 to 12

  const renderCol = (
    rows: Array<[string, string]>,
    startX: number,
    startY: number
  ) => {
    let cy = startY;
    const rowHeights: number[] = [];

    // First pass: calculate all row heights to ensure proper spacing
    rows.forEach(([label, value]) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      const wrapped = doc.splitTextToSize(value || "-", valueW);
      const lines = Array.isArray(wrapped) ? wrapped.length : 1;
      // Increased minimum row height from 20 to 24, and line spacing multiplier from 14 to 16
      const rowHeight = Math.max(24, lines * 16 + 8);
      rowHeights.push(rowHeight);
    });

    // Second pass: render with calculated heights
    rows.forEach(([label, value], idx) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(130, 130, 130);
      doc.text(label, startX, cy);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(25, 25, 25);
      const wrapped = doc.splitTextToSize(value || "-", valueW);
      doc.text(wrapped, startX + labelW, cy);

      cy += rowHeights[idx];
    });
    return cy;
  };

  const leftEndY = renderCol(leftRows, marginX, y);
  const rightEndY = renderCol(rightRows, marginX + colW + colGap, y);
  y = Math.max(leftEndY, rightEndY) + 36; // Increased spacing from 24 to 36 before summary

  // ---------- Summary row ----------
  // 5 equal, centered columns (grid-like). Label centered above value,
  // every value sharing one baseline. Sign is suffixed to the amount so
  // nothing is drawn in the inter-column gutters.
  const summaryCols: Array<{
    label: string;
    value: string;
    valueColor?: [number, number, number];
  }> = [
    { label: "Opening balance", value: fmtRupee(openingBalance) },
    { label: "Total credits", value: `${fmtRupee(totalCredits)}+` },
    {
      label: "Redeemed coin value",
      value: `${fmtRupee(0)}-`,
      valueColor: [24, 169, 87],
    },
    { label: "Total debits", value: `${fmtRupee(totalDebits)}-` },
    { label: "Closing balance", value: fmtRupee(closingBalance) },
  ];

  const sumColW = contentW / summaryCols.length;
  const sumGutter = 20;                       // equal gap between columns
  const sumInnerW = sumColW - sumGutter;      // usable width per cell
  const labelBaselineY = y;
  const summaryBaselineY = y + 24;            // identical top offset for all values

  summaryCols.forEach((c, i) => {
    const cx = marginX + sumColW * i + sumColW / 2; // centre of the cell

    // Label — uniform size/colour, centered, single line where possible
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(138, 138, 138);
    const labelLines = doc.splitTextToSize(c.label, sumInnerW);
    doc.text(labelLines, cx, labelBaselineY, { align: "center" });

    // Value — same font, same baseline, centered in the cell
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const vc = c.valueColor ?? [20, 20, 20];
    doc.setTextColor(vc[0], vc[1], vc[2]);
    doc.text(c.value, cx, summaryBaselineY, { align: "center" });
  });
  y += 62;

  // ---------- Transactions table ----------
  let running = openingBalance;
  const body = sorted.map((t) => {
    const amt = Number(t.amount);
    running += t.type === "credit" ? amt : -amt;
    return [
      fmtShortDate(t.created_at),
      sanitize(formatDescription(t)),
      sanitize(String(t.id).slice(0, 18)),
      fmtRupeeSigned(amt, t.type),
      fmtRupee(running),
    ];
  });

  // Table widths: give Amount + Balance enough room so values like
  // -₹19,999.78 and ₹143,000.00 never wrap or overlap the ref column.
  const tableW = contentW;
  const dateW = tableW * 0.11;
  const descW = tableW * 0.32;
  const refW = tableW * 0.17;
  const amtW = tableW * 0.18;
  const balW = tableW * 0.22;

  autoTable(doc, {
    startY: y,
    head: [["DATE", "DETAILS", "REF NO.", "AMOUNT", "BALANCE"]],
    body,
    theme: "plain",
    styles: {
      fontSize: 10,
      cellPadding: { top: 12, bottom: 12, left: 8, right: 8 }, // Increased horizontal padding from 6 to 8
      textColor: [25, 25, 25],
      valign: "middle", // Changed from "top" to "middle" for vertical centering
      overflow: "linebreak",
      minCellHeight: 28, // Added minimum cell height to prevent overlap
    },
    headStyles: {
      fontStyle: "bold",
      textColor: [120, 120, 120],
      fontSize: 9,
      lineWidth: 0,
      fillColor: [255, 255, 255],
      cellPadding: { top: 8, bottom: 14, left: 8, right: 8 }, // Increased padding and adjusted from 6 to 8
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
      1: { cellWidth: descW, halign: "left" },
      2: { cellWidth: refW, halign: "left" },
      3: { cellWidth: amtW, halign: "right" },
      4: { cellWidth: balW, halign: "right" },
    },
    margin: { left: marginX, right: marginX, top: 100, bottom: marginBottom },
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
  const header = ["Date", "Description", "Type", "Amount", "Balance"];
  const rows = txns.map((t) => [
    fmtShortDate(t.created_at),
    formatDescription(t).replace(/"/g, '""'),
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
