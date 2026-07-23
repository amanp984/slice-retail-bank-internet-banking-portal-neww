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
  "642877614378": {
    username: "642877614378",
    password: "Hari@2286",
    businessName: "HK ENTERPRISES",
    holderName: "HK ENTERPRISES",
    customerId: "642877614378",
    accountNumber: "34887143728164",
    accountType: "CURRENT",
    ifsc: "NESF0000333",
    micr: "7811781346",
    phone: "+91 74XXXXXX80",
    email: "hkenterprises8908@gmail.com",
    pan: "-",
    aadhaarMasked: "-",
    nominee: "-",
    address:
      "Hanuman Nagar Road, Badagaon, Koramangala",
    branch:
      "Charkop, Kandivali GK Road, Flat No. 7, Bahawalpur",
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
