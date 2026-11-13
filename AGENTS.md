Display saved transaction descriptions without reconstructing them; the stored text is authoritative across the app and exports.
Keep simulation disclaimers at the view or document level, not in generated transaction descriptions; this separates context from data.
Represent sample/test status with a dedicated transaction field and display it separately from saved descriptions, so transaction data remains authoritative and clearly labeled as simulated.
Use src/lib/banking.ts as the sole ledger/hold and statement-range helper; holds subtract from saved ledger balances without modifying transactions.
Use AccountStatement for account-scoped, paginated date-range reads and the same online/PDF/CSV records to avoid divergent filters.
Authorize hold writes only with a configured server-only admin secret and server validation; public profile writes remain denied.
Preserve the existing primary-account ledger reference resolved from its latest transaction, matching the existing admin flow; statement headings and hold writes use the profile account number without rewriting legacy transactions.
Render session-dependent profile fields only after hydration, using the same empty server and initial client snapshot to prevent profile text mismatch.
Keep hold management in AccountHoldManagement inside the existing authorized AdminEditor; use the persisted profile and latest saved ledger balance without creating placeholder accounts or transactions.