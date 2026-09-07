// Client helper for the admin endpoint. The password is only kept for the
// current browser tab and is verified server-side on every call.

const PW_KEY = "slice_admin_pw";

export function setAdminPassword(pw: string) {
  try {
    sessionStorage.setItem(PW_KEY, pw);
  } catch {}
}

export function getAdminPassword(): string {
  try {
    return sessionStorage.getItem(PW_KEY) ?? "";
  } catch {
    return "";
  }
}

export function clearAdminPassword() {
  try {
    sessionStorage.removeItem(PW_KEY);
  } catch {}
}

async function call(payload: Record<string, unknown>) {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: getAdminPassword(), ...payload }),
  });
  let body: any = {};
  try {
    body = await res.json();
  } catch {}
  if (!res.ok || !body?.ok) {
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return body;
}

export async function verifyAdmin(pw: string) {
  setAdminPassword(pw);
  try {
    await call({ action: "verify" });
    return true;
  } catch (e) {
    clearAdminPassword();
    throw e;
  }
}

export const saveProfileRow = (profile: Record<string, unknown>) =>
  call({ action: "save_profile", profile });

export const saveTransactionRow = (id: string, transaction: Record<string, unknown>) =>
  call({ action: "save_transaction", id, transaction });
