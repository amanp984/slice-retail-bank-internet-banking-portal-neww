// Centralized customer profiles used by statement generation and UI.
// Multiple users can sign in; the active profile is resolved per render
// from sessionStorage (set by LoginPage on successful authentication).

export type CustomerProfile = {
  username: string;
  password: string;
  businessName: string;
  holderName: string;
  customerId: string;
  accountNumber: string;
  accountType: string;
  ifsc: string;
  micr: string;
  phone: string;
  email: string;
  pan: string;
  aadhaarMasked: string;
  nominee: string;
  address: string;
  branch: string;
  openingDate: string;
  udyam: string;
};

export const PROFILES: Record<string, CustomerProfile> = {
  "643873148437": {
    username: "643873148437",
    password: "Yasmin@2026",
    businessName: "YASMIN TRADERS",
    holderName: "YASMIN TRADERS",
    customerId: "643873148437",
    accountNumber: "43128761437806",
    accountType: "CURRENT",
    ifsc: "NESF0000333",
    micr: "6421876458",
    phone: "+91 76XXXXXX58",
    email: "jairamtraders8208@gmail.com",
    pan: "-",
    aadhaarMasked: "-",
    nominee: "-",
    address:
      "Girnar Tower, Shantivan, Sector 34, Rajasthan - 62",
    branch:
      "Slice Bank, Rajasthan - Corporate Branch, Tower A, Girnar, Rajasthan, Rajasthan - 62",
    openingDate: "16 May '26",
    udyam: "-",
  },
};

// Empty placeholder used before the user signs in. We intentionally do NOT
// fall back to any real profile here — falling back would leak the previous
// customer's data during refresh / pre-redirect render.
const EMPTY_PROFILE: CustomerProfile = {
  username: "", password: "", businessName: "", holderName: "",
  customerId: "", accountNumber: "", accountType: "", ifsc: "", micr: "",
  phone: "", email: "", pan: "", aadhaarMasked: "", nominee: "",
  address: "", branch: "", openingDate: "", udyam: "",
};

export function getActiveCustomer(): CustomerProfile {
  let id: string | null = null;
  try {
    if (typeof sessionStorage !== "undefined") {
      id = sessionStorage.getItem("slice_customer_id");
    }
  } catch {}
  if (!id) return EMPTY_PROFILE;
  return PROFILES[id] ?? EMPTY_PROFILE;
}

// Backwards-compatible proxy: reading CUSTOMER.<field> resolves to whichever
// profile is currently signed in. Existing call sites continue to work.
export const CUSTOMER = new Proxy({} as CustomerProfile, {
  get(_t, prop: string) {
    const c = getActiveCustomer();
    return (c as any)[prop];
  },
  ownKeys() {
    return Reflect.ownKeys(getActiveCustomer());
  },
  getOwnPropertyDescriptor(_t, prop: string) {
    return Object.getOwnPropertyDescriptor(getActiveCustomer(), prop);
  },
}) as CustomerProfile;
