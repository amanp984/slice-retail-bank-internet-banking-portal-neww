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

export const LIVE_SUPABASE_PROJECT_ID = "grnuuhoxpnezzmfovrxx";
export const LIVE_SUPABASE_URL = `https://${LIVE_SUPABASE_PROJECT_ID}.supabase.co`;
export const LIVE_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXAiOiJncm51dWhveHBuZXp6bWZvdnJ4eCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc5MjU1MDMwLCJleHAiOjIwOTQ4MzEwMzB9.kFisDt3vaZPfYwDi5MLhykMwIiWcaYytdbKxB1Tb9P4".replace('"c3ViIjoiZ3Judi', '"aXNzIjoiZ3Judi');

export function validateLiveSupabaseProject(context = "startup") {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const urlMatchesProject = typeof url === "string" && url.includes(LIVE_SUPABASE_PROJECT_ID);

  if (projectId !== LIVE_SUPABASE_PROJECT_ID || !urlMatchesProject) {
    // eslint-disable-next-line no-console
    console.error(
      `[Supabase Guard] ${context}: frontend is not using the live Supabase project. Expected ${LIVE_SUPABASE_PROJECT_ID}.`,
      { projectId, url }
    );
    return false;
  }

  return true;
}

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export const formatINR = (value: number) => {
  const amount = Number(value) || 0;
  const sign = amount < 0 ? "-" : "";
  return `${sign}₹${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))}`;
};

export const formatSignedTransactionINR = (amount: number, type: "credit" | "debit") =>
  formatINR(type === "debit" ? -Math.abs(Number(amount) || 0) : Math.abs(Number(amount) || 0));
