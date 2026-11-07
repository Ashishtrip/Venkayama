import { useEffect, useState, useSyncExternalStore } from "react";
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
  wishlist: string[]; // array of product IDs or SKUs
  createdDate?: number;
};

export type WishlistTarget = string | { id?: string; sku?: string; name?: string };

const PROFILE_EVENT = "venkayam_profile_updated";

const uid = (prefix = "id") =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const getStorageKey = (email?: string, userId?: string) => {
  if (userId) return `venkayam_user_profile_${userId}`;
  if (email) return `venkayam_user_profile_${email.toLowerCase().trim()}`;
  return "venkayam_user_profile_guest";
};

const DEFAULT_PROFILE: UserProfile = {
  fullName: "",
  email: "",
  phone: "",
  addresses: [],
  paymentMethods: [],
  orders: [],
  wishlist: [],
  createdDate: Date.now(),
};

export function loadProfile(email?: string, userId?: string): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const key = getStorageKey(email, userId);
    let raw = localStorage.getItem(key);
    // Fall back to guest storage if user key not yet written
    if (!raw && (userId || email)) {
      raw = localStorage.getItem("venkayam_user_profile_guest");
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      // Strip any legacy placeholder/dummy test records previously stored in browser
      const addresses = (parsed.addresses || []).filter(
        (a: UserAddress) => a.id !== "addr_default_1"
      );
      const paymentMethods = (parsed.paymentMethods || []).filter(
        (p: SavedPaymentMethod) => p.id !== "pm_upi_1" && p.id !== "pm_card_1"
      );
      const orders = (parsed.orders || []).filter(
        (o: UserOrderRecord) => o.id !== "VNK-1004" && o.id !== "VNK-1001"
      );

      let wishlist: string[] = Array.isArray(parsed.wishlist) ? parsed.wishlist : [];
      if (
        wishlist.length === 3 &&
        wishlist.includes("GEN-036") &&
        wishlist.includes("GEN-014") &&
        wishlist.includes("GEN-016") &&
        !parsed.fullName
      ) {
        wishlist = [];
      }

      return {
        ...DEFAULT_PROFILE,
        ...parsed,
        fullName: parsed.fullName === "Ashish Tripathi" ? "" : (parsed.fullName || ""),
        phone: parsed.phone === "9876543210" ? "" : (parsed.phone || ""),
        addresses,
        paymentMethods,
        orders,
        wishlist,
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
    // Also mirror to guest key for persistent continuity
    if (key !== "venkayam_user_profile_guest") {
      localStorage.setItem("venkayam_user_profile_guest", JSON.stringify(profile));
    }
  } catch {}
}

/* =====================================================================================
   Reactive Singleton Store
   Ensures Header, all ProductCards, ProductPage, and Profile always share the exact same
   in-memory wishlist and profile state without stale closures or overwrites.
   ===================================================================================== */
let currentProfile: UserProfile = DEFAULT_PROFILE;
let currentSessionUser: { id?: string; email?: string; name?: string } | null = null;
let storeInitialized = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((l) => l());
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PROFILE_EVENT));
  }
}

function commitProfile(next: UserProfile, syncToStorage = true) {
  currentProfile = next;
  if (syncToStorage) {
    saveProfile(next, next.email || currentSessionUser?.email, currentSessionUser?.id);
  }
  notifyListeners();
}

function initProfileStore() {
  if (storeInitialized || typeof window === "undefined") return;
  storeInitialized = true;

  // Load from local storage initially
  currentProfile = loadProfile();

  const sb = getSupabase();
  sb.auth.getSession().then(({ data }) => {
    const u = data.session?.user;
    if (u) {
      currentSessionUser = {
        id: u.id,
        email: u.email,
        name: String(u.user_metadata?.full_name || u.email?.split("@")[0] || ""),
      };
      const loaded = loadProfile(u.email, u.id);
      if (!loaded.fullName && u.user_metadata?.full_name) {
        loaded.fullName = String(u.user_metadata.full_name);
      }
      if (!loaded.email && u.email) {
        loaded.email = u.email;
      }
      // If guest had wishlist items, merge them
      if (currentProfile.wishlist.length > 0) {
        const mergedWishlist = Array.from(new Set([...loaded.wishlist, ...currentProfile.wishlist]));
        loaded.wishlist = mergedWishlist;
      }
      commitProfile(loaded, true);
    } else {
      currentSessionUser = null;
      commitProfile(loadProfile(), false);
    }
  });

  sb.auth.onAuthStateChange((_e, s) => {
    const u = s?.user;
    if (u) {
      currentSessionUser = {
        id: u.id,
        email: u.email,
        name: String(u.user_metadata?.full_name || u.email?.split("@")[0] || ""),
      };
      const loaded = loadProfile(u.email, u.id);
      commitProfile(loaded, false);
    } else {
      currentSessionUser = null;
      commitProfile(loadProfile(), false);
    }
  });

  window.addEventListener("storage", (e) => {
    if (e.key && e.key.startsWith("venkayam_user_profile_")) {
      const fresh = loadProfile(currentSessionUser?.email, currentSessionUser?.id);
      currentProfile = fresh;
      listeners.forEach((l) => l());
    }
  });
}

function extractIdentifiers(target: WishlistTarget): string[] {
  if (!target) return [];
  if (typeof target === "string") {
    return [target.trim()].filter(Boolean);
  }
  return [target.sku, target.id, target.name]
    .map((s) => (s ? String(s).trim() : ""))
    .filter(Boolean);
}

export function useUserProfile() {
  if (!storeInitialized && typeof window !== "undefined") {
    initProfileStore();
  }

  const profile = useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
    () => currentProfile,
    () => DEFAULT_PROFILE
  );

  const [sessionUser, setSessionUser] = useState<{ id?: string; email?: string; name?: string } | null>(
    currentSessionUser
  );

  useEffect(() => {
    setSessionUser(currentSessionUser);
    const sb = getSupabase();
    const { data } = sb.auth.onAuthStateChange((_e, s) => {
      const u = s?.user;
      if (u) {
        const sess = {
          id: u.id,
          email: u.email,
          name: String(u.user_metadata?.full_name || u.email?.split("@")[0] || ""),
        };
        currentSessionUser = sess;
        setSessionUser(sess);
      } else {
        currentSessionUser = null;
        setSessionUser(null);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const updateDetails = async (data: Partial<{ fullName: string; phone: string; email?: string }>) => {
    const next: UserProfile = {
      ...currentProfile,
      fullName: data.fullName ?? currentProfile.fullName,
      phone: data.phone ?? currentProfile.phone,
      email: data.email ?? currentProfile.email,
    };
    commitProfile(next, true);

    // Sync with Supabase Auth user_metadata
    try {
      const sb = getSupabase();
      if (currentSessionUser?.id) {
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
    let nextAddresses = [...currentProfile.addresses];
    if (addr.isDefault || nextAddresses.length === 0) {
      nextAddresses = nextAddresses.map((a) => ({ ...a, isDefault: false }));
    }
    const newAddress: UserAddress = {
      ...addr,
      id: newId,
      isDefault: addr.isDefault || nextAddresses.length === 0,
    };
    const next: UserProfile = {
      ...currentProfile,
      addresses: [...nextAddresses, newAddress],
    };
    commitProfile(next, true);
  };

  const updateAddress = (id: string, addr: Partial<UserAddress>) => {
    let nextAddresses = currentProfile.addresses.map((a) => (a.id === id ? { ...a, ...addr } : a));
    if (addr.isDefault) {
      nextAddresses = nextAddresses.map((a) => ({ ...a, isDefault: a.id === id }));
    }
    const next: UserProfile = {
      ...currentProfile,
      addresses: nextAddresses,
    };
    commitProfile(next, true);
  };

  const deleteAddress = (id: string) => {
    let nextAddresses = currentProfile.addresses.filter((a) => a.id !== id);
    if (nextAddresses.length > 0 && !nextAddresses.some((a) => a.isDefault)) {
      nextAddresses[0].isDefault = true;
    }
    const next: UserProfile = {
      ...currentProfile,
      addresses: nextAddresses,
    };
    commitProfile(next, true);
  };

  const setDefaultAddress = (id: string) => {
    const nextAddresses = currentProfile.addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    const next: UserProfile = {
      ...currentProfile,
      addresses: nextAddresses,
    };
    commitProfile(next, true);
  };

  const addPaymentMethod = (pm: Omit<SavedPaymentMethod, "id">) => {
    const newId = uid("pm");
    let nextPms = [...currentProfile.paymentMethods];
    if (pm.isDefault || nextPms.length === 0) {
      nextPms = nextPms.map((p) => ({ ...p, isDefault: false }));
    }
    const newMethod: SavedPaymentMethod = {
      ...pm,
      id: newId,
      isDefault: pm.isDefault || nextPms.length === 0,
    } as SavedPaymentMethod;

    const next: UserProfile = {
      ...currentProfile,
      paymentMethods: [...nextPms, newMethod],
    };
    commitProfile(next, true);
  };

  const deletePaymentMethod = (id: string) => {
    let nextPms = currentProfile.paymentMethods.filter((p) => p.id !== id);
    if (nextPms.length > 0 && !nextPms.some((p) => p.isDefault)) {
      nextPms[0].isDefault = true;
    }
    const next: UserProfile = {
      ...currentProfile,
      paymentMethods: nextPms,
    };
    commitProfile(next, true);
  };

  const setDefaultPaymentMethod = (id: string) => {
    const nextPms = currentProfile.paymentMethods.map((p) => ({ ...p, isDefault: p.id === id }));
    const next: UserProfile = {
      ...currentProfile,
      paymentMethods: nextPms,
    };
    commitProfile(next, true);
  };

  const recordOrder = (order: UserOrderRecord) => {
    const nextOrders = [order, ...currentProfile.orders.filter((o) => o.id !== order.id)];
    const next: UserProfile = {
      ...currentProfile,
      orders: nextOrders,
    };
    commitProfile(next, true);
  };

  const isWishlisted = (target: WishlistTarget): boolean => {
    const ids = extractIdentifiers(target);
    if (!ids.length) return false;
    return currentProfile.wishlist.some((w) => ids.includes(w));
  };

  const toggleWishlist = (target: WishlistTarget) => {
    const ids = extractIdentifiers(target);
    if (!ids.length) return;

    const exists = currentProfile.wishlist.some((w) => ids.includes(w));
    let nextWishlist: string[];

    if (exists) {
      // Remove all matching identifiers for this piece
      nextWishlist = currentProfile.wishlist.filter((w) => !ids.includes(w));
    } else {
      // Add primary identifier (prefer SKU e.g. "GEN-001", otherwise id, otherwise name)
      const primary =
        typeof target === "string"
          ? target
          : (target.sku || target.id || target.name || "");
      if (primary && !currentProfile.wishlist.includes(primary)) {
        nextWishlist = [...currentProfile.wishlist, primary];
      } else {
        nextWishlist = currentProfile.wishlist;
      }
    }

    const next: UserProfile = {
      ...currentProfile,
      wishlist: nextWishlist,
    };
    commitProfile(next, true);
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
