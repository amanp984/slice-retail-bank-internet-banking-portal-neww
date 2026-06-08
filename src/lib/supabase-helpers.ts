export type Txn = {
  id: string;
  created_at: string;
  amount: number;
  type: "credit" | "debit";
  sender_name: string | null;
  description: string | null;
  balance_after_transaction: number;
  account_reference: string | null;
};

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
