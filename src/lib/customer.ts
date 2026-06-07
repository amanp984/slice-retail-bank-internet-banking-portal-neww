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
  "356642873168": {
    username: "356642873168",
    password: "Bhai@1985",
    businessName: "Dharmendra",
    holderName: "Dharmendra",
    customerId: "356642873168",
    accountNumber: "033323342867251",
    accountType: "CURRENT",
    ifsc: "NESF0000333",
    micr: "6642873394",
    phone: "+91 98XXXXXX42",
    email: "Dharm9826615@gmail.com",
    pan: "GOXXXXXX77B",
    aadhaarMasked: "XXXX XXXX 3842",
    nominee: "-",
    address:
      "Sodawala Nagar complex number 3, sector 44, Borivli (West), Mumbai, Maharashtra, INDIA, 400092",
    branch:
      "Slice Bank, Mumbai - Corporate Branch, Tower A, BKC, Mumbai, Maharashtra - 400051",
    openingDate: "16 May '26",
    udyam: "UDYAM-MH-17-0237772",
  },
  "356862214352": {
    username: "356862214352",
    password: "Teleco@2022",
    businessName: "Soni Teleco",
    holderName: "Soni Teleco",
    customerId: "356862214352",
    accountNumber: "033311642250313",
    accountType: "CURRENT",
    ifsc: "NESF0000333",
    micr: "6642250313",
    phone: "+91 98XXXXXX52",
    email: "soni.teleco@gmail.com",
    pan: "SOXXXXXX22T",
    aadhaarMasked: "XXXX XXXX 4352",
    nominee: "-",
    address:
      "Shop No. 12, Market Road, Mumbai, Maharashtra, INDIA, 400001",
    branch:
      "Slice Bank, Mumbai - Corporate Branch, Tower A, BKC, Mumbai, Maharashtra - 400051",
    openingDate: "02 Jun '22",
    udyam: "UDYAM-MH-17-0237773",
  },
};

export const DEFAULT_CUSTOMER_ID = "356642873168";

export function getActiveCustomer(): CustomerProfile {
  let id: string | null = null;
  try {
    if (typeof sessionStorage !== "undefined") {
      id = sessionStorage.getItem("slice_customer_id");
    }
  } catch {}
  return PROFILES[id ?? ""] ?? PROFILES[DEFAULT_CUSTOMER_ID];
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