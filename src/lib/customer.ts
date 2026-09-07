// Single source of truth for the customer/profile data.
// The record lives in the database (table `app_profile`, row id `primary`).
// A bootstrap copy of the current values is used only until the first load
// resolves, so the UI never renders blank.

import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CustomerProfile = {
  username: string;
  password: string;
  businessName: string;
  holderName: string;
  customerId: string;
  accountNumber: string;
  accountType: string;
  accountStatus: string;
  kycStatus: string;
  ifsc: string;
  micr: string;
  phone: string;
  email: string;
  pan: string;
  aadhaarMasked: string;
  nominee: string;
  address: string;
  permanentAddress: string;
  bankAddress: string;
  branchName: string;
  branchAddress: string;
  branch: string;
  openingDate: string;
  udyam: string;
};

const BOOTSTRAP: CustomerProfile = {
  username: "3466788764",
  password: "Annirudh@18926",
  businessName: "ANJAN PRAJAPATI",
  holderName: "ANJAN PRAJAPATI",
  customerId: "3466788764",
  accountNumber: "437811648731",
  accountType: "CURRENT",
  accountStatus: "ACTIVE",
  kycStatus: "VERIFIED",
  ifsc: "NESF0000405",
  micr: "-",
  phone: "6488731789",
  email: "-",
  pan: "-",
  aadhaarMasked: "-",
  nominee: "-",
  address: "-",
  permanentAddress: "-",
  bankAddress: "-",
  branchName: "-",
  branchAddress: "-",
  branch: "-",
  openingDate: "16 May '26",
  udyam: "-",
};

const EMPTY_PROFILE: CustomerProfile = Object.fromEntries(
  Object.keys(BOOTSTRAP).map((k) => [k, ""])
) as unknown as CustomerProfile;

export type ProfileRow = Record<string, string | null>;

export function rowToProfile(row: ProfileRow): CustomerProfile {
  const s = (v: unknown, fallback = "-") =>
    v === null || v === undefined || v === "" ? fallback : String(v);
  return {
    username: s(row.login_username, ""),
    password: s(row.login_password, ""),
    businessName: s(row.business_name),
    holderName: s(row.holder_name),
    customerId: s(row.customer_id),
    accountNumber: s(row.account_number),
    accountType: s(row.account_type),
    accountStatus: s(row.account_status),
    kycStatus: s(row.kyc_status),
    ifsc: s(row.ifsc),
    micr: s(row.micr),
    phone: s(row.phone),
    email: s(row.email),
    pan: s(row.pan),
    aadhaarMasked: s(row.aadhaar_masked),
    nominee: s(row.nominee),
    address: s(row.address),
    permanentAddress: s(row.permanent_address),
    bankAddress: s(row.bank_address),
    branchName: s(row.branch_name),
    branchAddress: s(row.branch_address),
    branch: s(row.branch_name),
    openingDate: s(row.opening_date),
    udyam: s(row.udyam),
  };
}

export function profileToRow(p: CustomerProfile): ProfileRow {
  return {
    id: "primary",
    login_username: p.username,
    login_password: p.password,
    business_name: p.businessName,
    holder_name: p.holderName,
    customer_id: p.customerId,
    account_number: p.accountNumber,
    account_type: p.accountType,
    account_status: p.accountStatus,
    kyc_status: p.kycStatus,
    ifsc: p.ifsc,
    micr: p.micr,
    phone: p.phone,
    email: p.email,
    pan: p.pan,
    aadhaar_masked: p.aadhaarMasked,
    nominee: p.nominee,
    address: p.address,
    permanent_address: p.permanentAddress,
    bank_address: p.bankAddress,
    branch_name: p.branchName,
    branch_address: p.branchAddress,
    opening_date: p.openingDate,
    udyam: p.udyam,
  };
}

let stored: CustomerProfile = BOOTSTRAP;
let loaded = false;
let version = 0;
const listeners = new Set<() => void>();

const emit = () => {
  version += 1;
  listeners.forEach((l) => l());
};

export function getProfileRecord(): CustomerProfile {
  return stored;
}

export function isProfileLoaded() {
  return loaded;
}

export async function loadProfile(): Promise<CustomerProfile> {
  try {
    const { data, error } = await (supabase as any)
      .from("app_profile")
      .select("*")
      .eq("id", "primary")
      .maybeSingle();
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[customer] profile load error:", error);
      return stored;
    }
    if (data) {
      stored = rowToProfile(data as ProfileRow);
      loaded = true;
      emit();
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[customer] profile load failed:", e);
  }
  return stored;
}

let syncStarted = false;

export function startProfileSync() {
  if (syncStarted || typeof window === "undefined") return;
  syncStarted = true;
  loadProfile();
  try {
    supabase
      .channel("public:app_profile")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_profile" },
        () => loadProfile()
      )
      .subscribe();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[customer] realtime subscribe failed:", e);
  }
  // Safety net in case realtime is unavailable.
  setInterval(loadProfile, 15000);
}

function isSignedIn() {
  try {
    return typeof sessionStorage !== "undefined" && sessionStorage.getItem("slice_auth") === "1";
  } catch {
    return false;
  }
}

export function getActiveCustomer(): CustomerProfile {
  return isSignedIn() ? stored : EMPTY_PROFILE;
}

export function useCustomer(): CustomerProfile {
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version,
    () => 0
  );
  return getActiveCustomer();
}

export async function verifyLogin(
  username: string,
  password: string
): Promise<CustomerProfile | null> {
  const profile = await loadProfile();
  if (
    profile.username &&
    username.trim() === profile.username &&
    password === profile.password
  ) {
    return profile;
  }
  return null;
}

// Backwards-compatible proxy for non-React call sites.
export const CUSTOMER = new Proxy({} as CustomerProfile, {
  get(_t, prop: string) {
    return (getActiveCustomer() as any)[prop];
  },
  ownKeys() {
    return Reflect.ownKeys(getActiveCustomer());
  },
  getOwnPropertyDescriptor(_t, prop: string) {
    return Object.getOwnPropertyDescriptor(getActiveCustomer(), prop);
  },
}) as CustomerProfile;
