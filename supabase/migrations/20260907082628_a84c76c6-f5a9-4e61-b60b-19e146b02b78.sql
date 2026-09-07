CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  amount numeric(14,2) NOT NULL CHECK (amount >= 0),
  type text NOT NULL CHECK (type IN ('credit','debit')),
  sender_name text,
  description text,
  balance_after_transaction numeric(14,2) NOT NULL,
  account_reference text NOT NULL,
  external_id text,
  upi_id text,
  mode text,
  beneficiary_account text,
  beneficiary_ifsc text
);

GRANT SELECT ON public.transactions TO anon;
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "txns read" ON public.transactions FOR SELECT USING (true);

CREATE INDEX transactions_account_created_idx ON public.transactions (account_reference, created_at DESC);
CREATE UNIQUE INDEX transactions_external_id_unique_idx ON public.transactions (upper(external_id)) WHERE external_id IS NOT NULL;
CREATE INDEX transactions_upi_id_idx ON public.transactions (upi_id);

CREATE TABLE public.app_profile (
  id text PRIMARY KEY DEFAULT 'primary',
  login_username text NOT NULL,
  login_password text NOT NULL,
  business_name text,
  holder_name text,
  customer_id text,
  account_number text,
  account_type text,
  account_status text,
  kyc_status text,
  ifsc text,
  micr text,
  phone text,
  email text,
  pan text,
  aadhaar_masked text,
  nominee text,
  address text,
  permanent_address text,
  bank_address text,
  branch_name text,
  branch_address text,
  opening_date text,
  udyam text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_profile TO anon;
GRANT SELECT ON public.app_profile TO authenticated;
GRANT ALL ON public.app_profile TO service_role;

ALTER TABLE public.app_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile read" ON public.app_profile FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_app_profile_updated_at
BEFORE UPDATE ON public.app_profile
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.app_profile (
  id, login_username, login_password, business_name, holder_name, customer_id,
  account_number, account_type, account_status, kyc_status, ifsc, micr, phone,
  email, pan, aadhaar_masked, nominee, address, permanent_address, bank_address,
  branch_name, branch_address, opening_date, udyam
) VALUES (
  'primary', '3466788764', 'Annirudh@18926', 'ANJAN PRAJAPATI', 'ANJAN PRAJAPATI',
  '3466788764', '437811648731', 'CURRENT', 'ACTIVE', 'VERIFIED', 'NESF0000405', '-',
  '6488731789', '-', '-', '-', '-', '-', '-', '-', '-', '-', '16 May ''26', '-'
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_profile;