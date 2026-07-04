-- Run this once in your Supabase SQL editor.
-- For an existing table with BIGINT money columns, also run
-- supabase-migrations/2026-07-04-money-numeric.sql to convert them safely.

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  amount numeric(14, 2) not null check (amount >= 0),
  type text not null check (type in ('credit', 'debit')),
  sender_name text,
  description text,
  balance_after_transaction numeric(14, 2) not null,
  account_reference text not null,
  external_id text unique
);

create index if not exists transactions_account_created_idx
  on public.transactions (account_reference, created_at desc);

alter table public.transactions enable row level security;

-- Public read for dashboard demo. Tighten as needed.
drop policy if exists "txns read" on public.transactions;
create policy "txns read" on public.transactions
  for select using (true);

-- Inserts are performed only by the server webhook using the service role key,
-- which bypasses RLS. No insert policy is granted to anon.

alter publication supabase_realtime add table public.transactions;
