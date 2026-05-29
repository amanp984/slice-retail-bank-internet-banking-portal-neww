import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Txn } from "@/integrations/supabase/client";
import { formatDescription } from "./formatTxn";
import { SLICE_LOGO_B64 } from "@/assets/sliceLogoB64";

// Brand palette
const PRIMARY: [number, number, number] = [177, 38, 216]; // #B126D8
const SECONDARY: [number, number, number] = [201, 75, 255]; // #C94BFF
const ACCENT: [number, number, number] = [230, 180, 255]; // #E6B4FF
const INK: [number, number, number] = [30, 20, 40];
const MUTED: [number, number, number] = [110, 110, 120];

// Account holder profile shown on every statement
const ACCOUNT_PROFILE = {
  name: "ANJAN",
  accountNumber: "XXXXXXXX3842",
  customerId: "356687013845",
  accountType: "Savings Account",
  ifsc: "SLCB0000123",
  branch: "Mumbai — Corporate Branch, BKC",
  mobile: "+91 XXXXX XX842",
  email: "anjan@slice.bank.in",
  address:
    "Sodawala Nagar, Complex No. 3,\nSector 44, Borivali (West),\nMumbai, Maharashtra — 400092",
};

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
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;

  // ---------- Compute summary ----------
  const sorted = [...txns].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const totalCredits = sorted
    .filter((t) => t.type === "credit")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalDebits = sorted
    .filter((t) => t.type === "debit")
    .reduce((s, t) => s + Number(t.amount), 0);
  const closingBalance = Number(
    sorted[sorted.length - 1]?.balance_after_transaction ?? balance
  );
  const openingBalance = sorted.length
    ? Number(sorted[0].balance_after_transaction) +
      (sorted[0].type === "debit" ? Number(sorted[0].amount) : -Number(sorted[0].amount))
    : balance;
  const periodFrom = sorted.length ? fmtDate(sorted[0].created_at) : fmtDate(new Date().toISOString());
  const periodTo = sorted.length
    ? fmtDate(sorted[sorted.length - 1].created_at)
    : fmtDate(new Date().toISOString());
  const generatedOn = new Date().toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  // ---------- HEADER ----------
  // Gradient-ish band
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageW, 90, "F");
  doc.setFillColor(...SECONDARY);
  doc.rect(0, 84, pageW, 6, "F");

  // Logo
  try {
    doc.addImage(SLICE_LOGO_B64, "PNG", margin, 22, 70, 46);
  } catch {
    /* ignore */
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Account Statement", pageW - margin, 40, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Slice Small Finance Bank Ltd.", pageW - margin, 56, { align: "right" });
  doc.setFontSize(9);
  doc.text(`Period: ${periodFrom} — ${periodTo}`, pageW - margin, 70, { align: "right" });

  // ---------- ACCOUNT DETAILS ----------
  let y = 108;
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("ACCOUNT DETAILS", margin, y);
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.8);
  doc.line(margin, y + 4, pageW - margin, y + 4);

  y += 14;
  const rows: Array<[string, string, string, string]> = [
    ["Customer Name", ACCOUNT_PROFILE.name, "Account Number", ACCOUNT_PROFILE.accountNumber],
    ["Customer ID", ACCOUNT_PROFILE.customerId, "Account Type", ACCOUNT_PROFILE.accountType],
    ["IFSC Code", ACCOUNT_PROFILE.ifsc, "Branch", ACCOUNT_PROFILE.branch],
    ["Mobile", ACCOUNT_PROFILE.mobile, "Email", ACCOUNT_PROFILE.email],
    ["Statement Period", `${periodFrom} — ${periodTo}`, "Generated On", generatedOn],
  ];
  autoTable(doc, {
    startY: y,
    body: rows,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 3, textColor: INK },
    columnStyles: {
      0: { fontStyle: "bold", textColor: MUTED, cellWidth: 110 },
      1: { cellWidth: 160 },
      2: { fontStyle: "bold", textColor: MUTED, cellWidth: 110 },
      3: { cellWidth: "auto" },
    },
    margin: { left: margin, right: margin },
  });
  // Address line
  let afterY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("Communication Address", margin, afterY + 10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...INK);
  doc.text(ACCOUNT_PROFILE.address, margin + 110, afterY + 10);
  afterY += 10 + ACCOUNT_PROFILE.address.split("\n").length * 11;

  // ---------- ACCOUNT SUMMARY ----------
  const summaryY = afterY + 14;
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("ACCOUNT SUMMARY", margin, summaryY);
  doc.setDrawColor(...ACCENT);
  doc.line(margin, summaryY + 4, pageW - margin, summaryY + 4);

  const cards = [
    { label: "Opening Balance", value: `₹ ${fmtAmt(openingBalance)}` },
    { label: "Total Credits", value: `₹ ${fmtAmt(totalCredits)}` },
    { label: "Total Debits", value: `₹ ${fmtAmt(totalDebits)}` },
    { label: "Closing Balance", value: `₹ ${fmtAmt(closingBalance)}` },
    { label: "Transactions", value: String(sorted.length) },
  ];
  const cardsY = summaryY + 12;
  const gap = 8;
  const cardW = (pageW - margin * 2 - gap * (cards.length - 1)) / cards.length;
  const cardH = 46;
  cards.forEach((c, i) => {
    const x = margin + i * (cardW + gap);
    doc.setFillColor(250, 240, 255);
    doc.setDrawColor(...ACCENT);
    doc.roundedRect(x, cardsY, cardW, cardH, 6, 6, "FD");
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(c.label.toUpperCase(), x + 8, cardsY + 14);
    doc.setTextColor(...PRIMARY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(c.value, x + 8, cardsY + 32);
  });

  // ---------- TRANSACTIONS TABLE ----------
  const txnY = cardsY + cardH + 18;
  doc.setTextColor(...PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TRANSACTION DETAILS", margin, txnY);
  doc.setDrawColor(...ACCENT);
  doc.line(margin, txnY + 4, pageW - margin, txnY + 4);

  autoTable(doc, {
    startY: txnY + 10,
    head: [["Date", "Description", "Reference No.", "Debit (₹)", "Credit (₹)", "Balance (₹)"]],
    body: sorted.map((t) => [
      fmtDate(t.created_at),
      formatDescription(t),
      t.id.slice(0, 12).toUpperCase(),
      t.type === "debit" ? fmtAmt(t.amount) : "—",
      t.type === "credit" ? fmtAmt(t.amount) : "—",
      fmtAmt(t.balance_after_transaction),
    ]),
    styles: { fontSize: 8.5, cellPadding: 5, textColor: INK, lineColor: [235, 220, 245], lineWidth: 0.3 },
    headStyles: {
      fillColor: PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "left",
    },
    alternateRowStyles: { fillColor: [252, 245, 255] },
    columnStyles: {
      0: { cellWidth: 60 },
      2: { cellWidth: 80 },
      3: { halign: "right", cellWidth: 60, textColor: [180, 30, 30] },
      4: { halign: "right", cellWidth: 60, textColor: [20, 120, 60] },
      5: { halign: "right", cellWidth: 70, fontStyle: "bold" },
    },
    margin: { left: margin, right: margin, bottom: 60 },
  });

  // ---------- FOOTER on every page ----------
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    const fy = pageH - 42;
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.6);
    doc.line(margin, fy, pageW - margin, fy);
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    doc.text(
      "This is a system-generated statement and does not require a signature.",
      margin,
      fy + 12
    );
    doc.text(
      "Customer Support: 1800 572 9999  •  support@slice.bank.in  •  www.slice.bank.in",
      margin,
      fy + 24
    );
    doc.text(
      `© ${new Date().getFullYear()} Slice Small Finance Bank Ltd. All rights reserved.`,
      margin,
      fy + 34
    );
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY);
    doc.text(`Page ${p} of ${total}`, pageW - margin, fy + 24, { align: "right" });
  }

  doc.save(`Slice-Bank-Statement-${todayFileStamp()}.pdf`);
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
