-- Run once in your LIVE Supabase project (grnuuhoxpnezzmfovrxx) SQL editor.
-- Safely converts BIGINT/INT money columns to NUMERIC(14,2) without data loss.
-- Existing integer values (e.g. 1200) become 1200.00; future inserts accept 13.87 as-is.

begin;

-- 1. Drop the >= 0 CHECK if it exists so ALTER TYPE doesn't fight it.
alter table public.transactions drop constraint if exists transactions_amount_check;

-- 2. Convert monetary columns to NUMERIC(14,2). USING cast preserves data.
alter table public.transactions
  alter column amount type numeric(14,2) using amount::numeric(14,2),
  alter column balance_after_transaction type numeric(14,2) using balance_after_transaction::numeric(14,2);

-- 3. Re-add non-negative check on amount (balance may be negative for overdrafts).
alter table public.transactions
  add constraint transactions_amount_check check (amount >= 0);

-- 4. Optional: any other monetary columns that may have been added later.
do $$
declare
  col record;
begin
  for col in
    select column_name
    from information_schema.columns
    where table_schema='public' and table_name='transactions'
      and column_name in ('available_balance','opening_balance','closing_balance','total_credits','total_debits')
      and data_type in ('bigint','integer','smallint')
  loop
    execute format(
      'alter table public.transactions alter column %I type numeric(14,2) using %I::numeric(14,2)',
      col.column_name, col.column_name
    );
  end loop;
end$$;

commit;

-- Verify:
-- select column_name, data_type, numeric_precision, numeric_scale
-- from information_schema.columns
-- where table_schema='public' and table_name='transactions';