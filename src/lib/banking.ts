import { endOfMonth, endOfYear, startOfMonth, startOfYear, subMonths, subYears, format, parseISO, isValid, addDays } from "date-fns";
import type { Txn } from "./supabase-helpers";

export function validateHoldAmount(value: unknown): number {
  const text = String(value ?? "").trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) throw new Error("Hold Amount must be non-negative with at most two decimal places.");
  const amount = Number(text);
  if (!Number.isFinite(amount) || amount > 999999999999.99) throw new Error("Hold Amount is too large.");
  return amount;
}

export function accountBalances(ledgerBalance: number, holdAmount = 0) {
  return { ledgerBalance, holdAmount, availableBalance: (Math.round(ledgerBalance * 100) - Math.round(holdAmount * 100)) / 100 };
}

export const statementPresets = ["This Month", "Previous Month", "Last 3 Months", "Last 6 Months", "This Year", "Previous Year", "Custom Date Range"] as const;
export type StatementPreset = typeof statementPresets[number];
export type StatementRange = { start: string; end: string };

export function presetRange(preset: StatementPreset, now = new Date()): StatementRange {
  let start = startOfMonth(now), end = endOfMonth(now);
  if (preset === "Previous Month") { start = startOfMonth(subMonths(now, 1)); end = endOfMonth(start); }
  if (preset === "Last 3 Months") { start = startOfMonth(subMonths(now, 2)); end = now; }
  if (preset === "Last 6 Months") { start = startOfMonth(subMonths(now, 5)); end = now; }
  if (preset === "This Year") { start = startOfYear(now); end = endOfYear(now); }
  if (preset === "Previous Year") { start = startOfYear(subYears(now, 1)); end = endOfYear(start); }
  return { start: format(start, "yyyy-MM-dd"), end: format(end, "yyyy-MM-dd") };
}

export function rangeBounds(range: StatementRange) {
  const start = parseISO(range.start), end = parseISO(range.end);
  if (!isValid(start) || !isValid(end)) throw new Error("Select a valid Start Date and End Date.");
  if (end < start) throw new Error("End Date cannot be earlier than Start Date.");
  return { start: start.toISOString(), endExclusive: addDays(end, 1).toISOString() };
}

export function filterStatementRows(rows: Txn[], account: string, range: StatementRange) {
  const bounds = rangeBounds(range);
  return rows.filter((row) => row.account_reference === account && row.created_at >= bounds.start && row.created_at < bounds.endExclusive);
}