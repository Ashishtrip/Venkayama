import { useEffect, useState } from "react";
import { getSupabase } from "./supabase";
import type { Status } from "../store";

export type UserAddress = {
  id: string;
  label: string; // e.g. "Home", "Work", "Studio"
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  isDefault: boolean;
};

// COMPLIANCE WITH INDUSTRY STANDARDS (PCI-DSS & RBI Tokenization):
// NEVER store primary account numbers (PAN), CVVs, or card magnetic/chip data.
// Only store tokenized aliases, card networks, and last-4 digits for UI recognition.
export type SavedCardMethod = {
  id: string;
  type: "card";
  brand: "Visa" | "Mastercard" | "RuPay" | "Amex";
  last4: string; // e.g. "4242"
  holderName: string;
  expMonth: string;
  expYear: string;
  isDefault: boolean;
};

export type SavedUpiMethod = {
  id: string;
  type: "upi";
  vpa: string; // e.g., "user@okhdfcbank"
  app?: string; // e.g., "Google Pay", "PhonePe", "Paytm"
  isDefault: boolean;
};

export type SavedPaymentMethod = SavedCardMethod | SavedUpiMethod;

export type UserOrderRecord = {
  id: string;
  track: string;
  createdAt: number;
  customer: string;
  phone: string;
  city: string;
  address: string;
  pay: "UPI" | "Card";
  status: Status;
  amount: number;
  items: { name: string; size: string; qty: number; price: number }[];
  deliveredAt?: number;
};

export type UserProfile = {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  city?: string;
  addresses: UserAddress[];
  paymentMethods: SavedPaymentMethod[];
  orders: UserOrderRecord[];
  wishlist: string[]; // array of product IDs
  createdDate?: number;
};

const PROFILE_EVENT = "venkayam_profile_updated";

const uid = (prefix = "id") => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const getStorageKey = (email?: string, userId?: string) => {
  if (userId) return `venkayam_user_profile_${userId}`;
  if (email) return `venkayam_user_profile_${email.toLowerCase().trim()}`;
  return "venkayam_user_profile_guest";
};

const DEFAULT_PROFILE: UserProfile = {
  fullName: "",
  email: "",
  phone: "",
  addresses: [
    {
      id: "addr_default_1",
      label: "Studio / Primary",
      name: "Ashish Tripathi",
      phone: "9876543210",
      address: "14/B, Khader Nawaz Khan Road, Nungambakkam",
      city: "Chennai",
      state: "Tamil Nadu",
      pin: "600006",
      isDefault: true,
    },
  ],
  paymentMethods: [
    {
      id: "pm_upi_1",
      type: "upi",
      vpa: "ashish@okhdfcbank",
      app: "Google Pay",
      isDefault: true,
    },
    {
      id: "pm_card_1",
      type: "card",
      brand: "Visa",
      last4: "4242",
      holderName: "ASHISH TRIPATHI",
      expMonth: "08",
      expYear: "28",
      isDefault: false,
    },
  ],
  orders: [
    {
      id: "VNK-1004",
      track: "7A9F32BC10",
      createdAt: Date.now() - 2 * 864e5,
      customer: "Ashish Tripathi",
      phone: "9876543210",
      city: "Chennai",
      address: "14/B, Khader Nawaz Khan Road, Nungambakkam",
      pay: "UPI",
      status: "Printing",
      amount: 1499,
      items: [{ name: "THE GUARDIAN", size: "L", qty: 1, price: 1499 }],
    },
    {
      id: "VNK-1001",
      track: "4C8D21EA90",
      createdAt: Date.now() - 14 * 864e5,
      customer: "Ashish Tripathi",
      phone: "9876543210",
      city: "Chennai",
      address: "14/B, Khader Nawaz Khan Road, Nungambakkam",
      pay: "Card",
      status: "Delivered",
      amount: 1499,
      items: [{ name: "DISCIPLINE", size: "XL", qty: 1, price: 1499 }],
      deliveredAt: Date.now() - 10 * 864e5,
    },
  ],
  wishlist: ["GEN-036", "GEN-014", "GEN-016"],
  createdDate: Date.now() - 30 * 864e5,
};

export function loadProfile(email?: string, userId?: string): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const key = getStorageKey(email, userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PROFILE,
        ...parsed,
        email: email || parsed.email || "",
      };
    }
  } catch {}
  return { ...DEFAULT_PROFILE, email: email || "" };
}

export function saveProfile(profile: UserProfile, email?: string, userId?: string) {
  if (typeof window === "undefined") return;
  try {
    const key = getStorageKey(email || profile.email, userId || profile.id);
    localStorage.setItem(key, JSON.stringify(profile));
    window.dispatchEvent(new Event(PROFILE_EVENT));
  } catch {}
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [sessionUser, setSessionUser] = useState<{ id?: string; email?: string; name?: string } | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (u) {
        setSessionUser({
          id: u.id,
          email: u.email,
          name: String(u.user_metadata?.full_name || u.email?.split("@")[0] || ""),
        });
        const current = loadProfile(u.email, u.id);
        if (!current.fullName && u.user_metadata?.full_name) {
          current.fullName = String(u.user_metadata.full_name);
        }
        if (!current.email && u.email) {
          current.email = u.email;
        }
        setProfile(current);
      } else {
        setSessionUser(null);
        setProfile(loadProfile());
      }
    });

    const { data } = sb.auth.onAuthStateChange((_e, s) => {
      const u = s?.user;
      if (u) {
        setSessionUser({
          id: u.id,
          email: u.email,
          name: String(u.user_metadata?.full_name || u.email?.split("@")[0] || ""),
        });
        const current = loadProfile(u.email, u.id);
        setProfile(current);
      } else {
        setSessionUser(null);
        setProfile(loadProfile());
      }
    });

    const onUpdate = () => {
      setProfile((prev) => loadProfile(prev.email, prev.id));
    };

    window.addEventListener(PROFILE_EVENT, onUpdate);
    return () => {
      data.subscription.unsubscribe();
      window.removeEventListener(PROFILE_EVENT, onUpdate);
    };
  }, []);

  const updateDetails = async (data: Partial<{ fullName: string; phone: string; email?: string }>) => {
    const next: UserProfile = {
      ...profile,
      fullName: data.fullName ?? profile.fullName,
      phone: data.phone ?? profile.phone,
      email: data.email ?? profile.email,
    };
    setProfile(next);
    saveProfile(next, next.email, sessionUser?.id);

    // Sync with Supabase Auth user_metadata
    try {
      const sb = getSupabase();
      if (sessionUser?.id) {
        await sb.auth.updateUser({
          data: {
            full_name: next.fullName,
            phone: next.phone,
          },
        });
      }
    } catch {}
  };

  const addAddress = (addr: Omit<UserAddress, "id">) => {
    const newId = uid("addr");
    let nextAddresses = [...profile.addresses];
    if (addr.isDefault || nextAddresses.length === 0) {
      nextAddresses = nextAddresses.map((a) => ({ ...a, isDefault: false }));
    }
    const newAddress: UserAddress = {
      ...addr,
      id: newId,
      isDefault: addr.isDefault || nextAddresses.length === 0,
    };
    const next: UserProfile = {
      ...profile,
      addresses: [...nextAddresses, newAddress],
    };
    setProfile(next);
    saveProfile(next, next.email, sessionUser?.id);
  };

  const updateAddress = (id: string, addr: Partial<UserAddress>) => {
    let nextAddresses = profile.addresses.map((a) => (a.id === id ? { ...a, ...addr } : a));
    if (addr.isDefault) {
      nextAddresses = nextAddresses.map((a) => ({ ...a, isDefault: a.id === id }));
    }
    const next: UserProfile = {
      ...profile,
      addresses: nextAddresses,
    };
    setProfile(next);
    saveProfile(next, next.email, sessionUser?.id);
  };

  const deleteAddress = (id: string) => {
    let nextAddresses = profile.addresses.filter((a) => a.id !== id);
    if (nextAddresses.length > 0 && !nextAddresses.some((a) => a.isDefault)) {
      nextAddresses[0].isDefault = true;
    }
    const next: UserProfile = {
      ...profile,
      addresses: nextAddresses,
    };
    setProfile(next);
    saveProfile(next, next.email, sessionUser?.id);
  };

  const setDefaultAddress = (id: string) => {
    const nextAddresses = profile.addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    const next: UserProfile = {
      ...profile,
      addresses: nextAddresses,
    };
    setProfile(next);
    saveProfile(next, next.email, sessionUser?.id);
  };

  const addPaymentMethod = (pm: Omit<SavedPaymentMethod, "id">) => {
    const newId = uid("pm");
    let nextPms = [...profile.paymentMethods];
    if (pm.isDefault || nextPms.length === 0) {
      nextPms = nextPms.map((p) => ({ ...p, isDefault: false }));
    }
    const newMethod: SavedPaymentMethod = {
      ...pm,
      id: newId,
      isDefault: pm.isDefault || nextPms.length === 0,
    } as SavedPaymentMethod;

    const next: UserProfile = {
      ...profile,
      paymentMethods: [...nextPms, newMethod],
    };
    setProfile(next);
    saveProfile(next, next.email, sessionUser?.id);
  };

  const deletePaymentMethod = (id: string) => {
    let nextPms = profile.paymentMethods.filter((p) => p.id !== id);
    if (nextPms.length > 0 && !nextPms.some((p) => p.isDefault)) {
      nextPms[0].isDefault = true;
    }
    const next: UserProfile = {
      ...profile,
      paymentMethods: nextPms,
    };
    setProfile(next);
    saveProfile(next, next.email, sessionUser?.id);
  };

  const setDefaultPaymentMethod = (id: string) => {
    const nextPms = profile.paymentMethods.map((p) => ({ ...p, isDefault: p.id === id }));
    const next: UserProfile = {
      ...profile,
      paymentMethods: nextPms,
    };
    setProfile(next);
    saveProfile(next, next.email, sessionUser?.id);
  };

  const recordOrder = (order: UserOrderRecord) => {
    const nextOrders = [order, ...profile.orders.filter((o) => o.id !== order.id)];
    const next: UserProfile = {
      ...profile,
      orders: nextOrders,
    };
    setProfile(next);
    saveProfile(next, next.email, sessionUser?.id);
  };

  const toggleWishlist = (productIdentifier: string) => {
    const exists = profile.wishlist.includes(productIdentifier);
    const nextWishlist = exists
      ? profile.wishlist.filter((id) => id !== productIdentifier)
      : [...profile.wishlist, productIdentifier];

    const next: UserProfile = {
      ...profile,
      wishlist: nextWishlist,
    };
    setProfile(next);
    saveProfile(next, next.email, sessionUser?.id);
  };

  const isWishlisted = (productIdentifier: string) => {
    return profile.wishlist.includes(productIdentifier);
  };

  return {
    profile,
    sessionUser,
    updateDetails,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    addPaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    recordOrder,
    toggleWishlist,
    isWishlisted,
    wishlistCount: profile.wishlist.length,
  };
}

