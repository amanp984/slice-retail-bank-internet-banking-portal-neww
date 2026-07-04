-- Prevent duplicate transactions by UTR / Ref No.
-- Run this in the Supabase SQL editor of the LIVE project.
begin;

-- Normalize any existing external_id values so the unique index can be built.
update public.transactions
set external_id = upper(btrim(external_id))
where external_id is not null
  and external_id <> upper(btrim(external_id));

-- Optional: collapse pre-existing duplicates (keeps the oldest row).
delete from public.transactions t
using public.transactions t2
where t.external_id is not null
  and t.external_id = t2.external_id
  and t.created_at > t2.created_at;

-- Case-insensitive unique index on external_id (NULLs allowed).
create unique index if not exists transactions_external_id_key
  on public.transactions (upper(btrim(external_id)))
  where external_id is not null;

commit;
