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
  "32538876234": {
    username: "32538876234",
    password: "Baby@1985",
    businessName: "AMAN",
    holderName: "AMAN",
    customerId: "32538876234",
    accountNumber: "64738290938572",
    accountType: "CURRENT",
    ifsc: "NESF0000333",
    micr: "6473829057",
    phone: "+91 98XXXXXX42",
    email: "aman@example.com",
    pan: "AMXXXXXX34B",
    aadhaarMasked: "XXXX XXXX 8234",
    nominee: "-",
    address:
      "Sodawala Nagar complex number 3, sector 44, Borivli (West), Mumbai, Maharashtra, INDIA, 400092",
    branch:
      "Slice Bank, Mumbai - Corporate Branch, Tower A, BKC, Mumbai, Maharashtra - 400051",
    openingDate: "16 May '26",
    udyam: "UDYAM-MH-17-0237772",
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