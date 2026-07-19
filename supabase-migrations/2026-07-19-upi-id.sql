-- Adds a nullable upi_id column for UPI beneficiary VPAs.
-- Safe to run repeatedly.
alter table public.transactions
  add column if not exists upi_id text;

create index if not exists transactions_upi_id_idx
  on public.transactions (upi_id);