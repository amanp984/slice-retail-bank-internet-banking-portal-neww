# Date-range statements and account holds

- Replace the two-month statement dropdown with start/end calendars and all seven requested presets. Use the same account-and-date-filtered records for online views, PDF, and CSV, including older years and empty periods.
- Add persistent hold settings to the existing account profile record, editable only through a securely validated administrator operation. Preserve transactions, profile details, and current sign-in behavior.
- Show ledger balance, hold amount, and available balance consistently across Dashboard, Accounts, History, and statement views. Preserve negative available balances.
- Keep exported statements explicitly identified as sample/demo documents without altering saved descriptions.
- Test the requested hold examples, persistence/reset, invalid values, date ranges, and actual downloaded exports. Check automatic compilation diagnostics.

## Technical details
- `src/lib/banking.ts` does not currently exist; add it as the sole shared ledger/hold helper, using the existing saved running balances rather than recalculating transactions.
- Add a default-zero hold column to `app_profile`; keep direct customer writes denied. New hold writes require a server-only configured admin secret with no hardcoded fallback.
- Add a shared statement date-range component and paginated account-scoped reads so transaction history is not truncated by existing 50/200-row limits.
- The reported `utils.ts` assignment is absent from the current six-line file; verify compilation instead of adding an unrelated workaround.