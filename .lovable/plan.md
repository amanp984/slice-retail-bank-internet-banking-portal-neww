# Move the banking app onto Lovable Cloud

Nothing is deleted or disconnected in this step. Below is the full audit plus the exact plan, for your approval before anything changes.

## 1. What the app uses today (old external database)

The app is currently hard-wired to the old external project `grnuuhoxpnezzmfovrxx`, in three places:
- `vite.config.ts` — pins the browser bundle's database URL and key to the old project (this overrides `.env`).
- `src/lib/supabase-helpers.ts` — a startup guard that *errors* unless the app points at the old project.
- `api/sms.ts` and `src/routes/api/sms.ts` — the SMS webhook writes to the old project.

Meanwhile `.env` already points at Lovable Cloud (`usjynnxdtmghgznfcrjf`), which is why the two disagree.

### Tables in use
Only one table: `public.transactions`
- `id` (uuid, primary key), `created_at` (timestamp)
- `amount` numeric(14,2), `type` ('credit' | 'debit')
- `sender_name`, `description`
- `balance_after_transaction` numeric(14,2)
- `account_reference`, `external_id` (unique, the UTR — powers duplicate blocking)
- `upi_id`
- Index on (`account_reference`, `created_at` desc) and on `upi_id`
- Row-level security on, public read allowed, inserts only by the webhook's privileged key
- Added to the realtime publication so the dashboard live-updates

### Everything else
- **Login / authentication** — not database-backed at all. Username and password are hardcoded in `src/lib/customer.ts` and checked in the browser; the signed-in flag lives in the browser session. No accounts exist in any database.
- **Profile / customer data** — hardcoded in `src/lib/customer.ts` (holder name, account number, IFSC, MICR, phone, branch, etc.).
- **Running balances** — computed by the SMS webhook: it reads the newest row for the account and adds or subtracts the new amount. Ordering is newest-first by `created_at`.
- **Transactions list & dashboard** — `src/hooks/useTransactions.ts`: one read, a live subscription, plus an 8-second refresh as a safety net.
- **Statements / PDF / CSV / Excel** — `src/lib/statement.ts` formats whatever rows the app already loaded; no separate database access.
- **Storage** — none used. Nothing to migrate.
- **Admin Panel** — not present in the project right now. The earlier admin editor files (admin API, admin editor screen, database-backed profile) are gone, so the current app has no admin authentication, no profile editing, no transaction editing and no balance recalculation to migrate. I will rebuild that as part of this work if you want it (see step 5).

## 2. What I'll create in Lovable Cloud

- `public.transactions` — identical columns, types, checks, unique UTR index and lookup indexes, read access for the app, writes reserved for the server, and realtime switched on.
- `public.app_profile` — one row holding the customer/profile details currently hardcoded (login username, login password, holder/business name, customer id, account number, account type & status, KYC status, IFSC, MICR, phone, email, PAN, masked Aadhaar, nominee, addresses, branch, opening date, Udyam). Readable by the app, writable only by the server.

## 3. Data that needs copying

- Every existing `transactions` row from the old project, copied as-is (same ids, timestamps, amounts, balances, UTRs) so history and balances are unchanged.
- The current hardcoded profile becomes the single `app_profile` row.
- The old project is left untouched and still connected until you confirm the new one is correct.

## 4. Files that will change

- `vite.config.ts` — stop pinning the old project.
- `src/lib/supabase-helpers.ts` — guard now expects Lovable Cloud.
- `api/sms.ts`, `src/routes/api/sms.ts` — webhook writes to Lovable Cloud (same parsing, same duplicate blocking, same balance maths).
- `src/lib/customer.ts` — reads profile from the database with the current values as fallback.
- New: admin screen, admin server endpoint, small profile-sync helper (only if you want the admin panel rebuilt).
- No UI or styling changes anywhere.

## 5. Admin Panel rebuild (needs your yes/no)

If you want it back, exactly as before: hidden trigger (10 taps on "Profile Overview" within 5 seconds), password checked on the server only, tabs for profile fields and transaction fields, saves straight to the database, running balances recalculated after edits, other open pages update live.

## 6. What cannot be carried over exactly

- **Login stays as-is.** It's a demo username/password check, not real accounts. Moving it to real accounts would change how you sign in, so I'll keep the current behaviour and just source the credentials from the database.
- **The SMS webhook secret and admin password** are hosting environment settings, not data — they must be re-entered in your hosting environment.
- **Live-copying the old rows** requires read access to the old project from this environment. If the old key isn't reachable here, I'll give you a one-paste export/import script instead.

## 7. Order of work

1. Create the new tables and access rules.
2. Copy the transaction rows and the profile row.
3. Point the app at Lovable Cloud.
4. Verify: dashboard totals, transaction list, live updates, statement/PDF/CSV/Excel, SMS webhook, admin panel.
5. Only after you confirm, remove the old connection.

Nothing above runs until you approve.
