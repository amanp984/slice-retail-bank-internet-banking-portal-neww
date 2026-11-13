import { describe, expect, it } from "vitest";
import { accountBalances, validateHoldAmount, rangeBounds, presetRange, filterStatementRows } from "./banking";
import type { Txn } from "./supabase-helpers";

describe("hold amounts", () => {
  it("defaults to zero", () => expect(accountBalances(10)).toEqual({ ledgerBalance: 10, holdAmount: 0, availableBalance: 10 }));
  it("subtracts a two rupee hold without changing ledger", () => expect(accountBalances(10, 2)).toEqual({ ledgerBalance: 10, holdAmount: 2, availableBalance: 8 }));
  it("subtracts 150 from 2150", () => expect(accountBalances(2150, 150).availableBalance).toBe(2000));
  it("restores availability after reset", () => expect(accountBalances(2150, 0).availableBalance).toBe(2150));
  it("does not clamp negative balances", () => expect(accountBalances(10, 12).availableBalance).toBe(-2));
  it("supports two decimal places", () => expect(validateHoldAmount("2.15")).toBe(2.15));
  it("rejects excess decimal places", () => expect(() => validateHoldAmount("2.001")).toThrow());
  it("rejects negative holds", () => expect(() => validateHoldAmount("-2")).toThrow());
  it("rejects non-finite holds", () => expect(() => validateHoldAmount("Infinity")).toThrow());
});

describe("statement ranges", () => {
  it("rejects an end before the start", () => expect(() => rangeBounds({ start: "2024-02-02", end: "2024-02-01" })).toThrow());
  it("includes the whole end day and excludes other accounts", () => {
    const rows = [
      { id: "start", account_reference: "a", created_at: new Date(2023, 0, 1).toISOString() },
      { id: "end", account_reference: "a", created_at: new Date(2023, 0, 31, 23, 59).toISOString() },
      { id: "next", account_reference: "a", created_at: new Date(2023, 1, 1).toISOString() },
      { id: "other", account_reference: "b", created_at: new Date(2023, 0, 1).toISOString() },
    ] as Txn[];
    expect(filterStatementRows(rows, "a", { start: "2023-01-01", end: "2023-01-31" }).map((r) => r.id)).toEqual(["start", "end"]);
  });
  it("returns no placeholder rows for empty dates", () => expect(filterStatementRows([], "a", { start: "2030-01-01", end: "2031-01-01" })).toEqual([]));
  it("supports previous-year history", () => expect(presetRange("Previous Year", new Date(2026, 10, 13))).toEqual({ start: "2025-01-01", end: "2025-12-31" }));
  it("handles previous-month year boundaries", () => expect(presetRange("Previous Month", new Date(2026, 0, 13))).toEqual({ start: "2025-12-01", end: "2025-12-31" }));
  it("covers three calendar months", () => expect(presetRange("Last 3 Months", new Date(2026, 10, 13))).toEqual({ start: "2026-09-01", end: "2026-11-13" }));
  it("covers six calendar months", () => expect(presetRange("Last 6 Months", new Date(2026, 10, 13))).toEqual({ start: "2026-06-01", end: "2026-11-13" }));
});