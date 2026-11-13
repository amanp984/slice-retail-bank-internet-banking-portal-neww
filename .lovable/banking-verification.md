# Date-range statements and account holds

## Changes
- Added `hold_amount` to the existing `app_profile` table, default zero, with non-negative/two-decimal validation. No transaction records or existing profile fields were modified.
- Added shared `banking.ts` balance/range helpers, `hold.functions.ts` secure hold saving, and `useAccountBalances.ts`.
- Added shared `StatementDateRange.tsx` and `AccountStatement.tsx` for calendar presets, account-scoped paginated reads, online views, PDF and CSV.
- Updated Dashboard, Accounts, History, Admin Editor, customer mapping, and PDF/CSV statement presentation.
- Completed content-route metadata required by project instructions. Added Vitest and sixteen focused behavior tests.
- Corrected server/initial-client profile rendering to avoid hydration errors.
- The reported numeric assignment is absent from the current `utils.ts`; no unrelated utility workaround was introduced.

## Verified
- Sixteen tests pass, covering the requested 10 minus 2 and 2150 minus 150 examples, zero/reset, negative availability, invalid precision, year boundaries, ranges and empty results.
- Signed in through the existing login form, selected Last 3 Months, and read five real ledger rows online; downloaded PDF and CSV contain the same five saved references and ledger closing balance of 2150.
- Calendar permits older-year selection; Previous Year shows the empty-period message and disables exports.
- Accounts shows the same filtered rows; the separate OD account shows no primary-account transactions.
- Actual downloaded PDF text/bounds checked: sample/demo notice, all saved references, fixed table columns and page margins retained. No screenshots or visual assets generated.
- Final signed-in browser check reports no page errors; automatic compilation reports build OK.

## Limitations
- Admin secret form was declined. Hold writes deliberately fail closed until ADMIN_PASSWORD is configured; persistence/reset through authorized UI requests cannot be verified yet.
- The current profile account number differs from the historical ledger reference. Preserved the existing primary-ledger mapping used by the admin flow rather than rewriting records or hiding existing balances. Future multi-account storage requires explicit account mappings rather than extending this single-primary convention.
- No Excel export exists in this project; existing PDF, CSV and online exports were preserved.