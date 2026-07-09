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
  "64287341876": {
    username: "64287341876",
    password: "Jairam@1992",
    businessName: "JAIRAM TRADERS",
    holderName: "JAIRAM TRADERS",
    customerId: "64287341876",
    accountNumber: "43781143782145",
    accountType: "CURRENT",
    ifsc: "NESF0000333",
    micr: "642876428647",
    phone: "+91 63XXXXXX67",
    email: "jairamtraders8208@gmail.com",
    pan: "-",
    aadhaarMasked: "-",
    nominee: "-",
    address:
      "Shiv Krupsha Building, Hanuman Nagar Road, Badagaon Block, Mumbai - 400098",
    branch:
      "Slice Bank, Mumbai - Corporate Branch, Tower A, BKC, Mumbai, Maharashtra - 400051",
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