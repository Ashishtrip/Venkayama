import React, { useState, useEffect, useMemo } from "react";
import OnionLogo from "./components/OnionLogo";
import {
  useUserProfile,
  type UserAddress,
  type SavedPaymentMethod,
  type SavedCardMethod,
  type SavedUpiMethod,
  type UserOrderRecord,
} from "./lib/userProfile";
import {
  useDB,
  imgSrc,
  isMono,
  stockLabel,
  offLabel,
  sortSizes,
  type Product,
} from "./store";
import { useCart } from "./Cart";
import { getSupabase } from "./lib/supabase";

const mono = "font-mono uppercase";
const disp = "font-display uppercase";
const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const slug = (p: { name: string }) =>
  p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

type ProfileTab = "details" | "orders" | "addresses" | "payments" | "wishlist";

export default function Profile() {
  const {
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
    toggleWishlist,
    wishlistCount,
  } = useUserProfile();

  const products = useDB((d) => d.products);
  const { add: addToCart } = useCart();

  // Tab navigation support via hash / state
  const [tab, setTab] = useState<ProfileTab>("details");

  useEffect(() => {
    const raw = window.location.hash.replace(/^#\/profile\/?/, "");
    if (
      raw === "orders" ||
      raw === "addresses" ||
      raw === "payments" ||
      raw === "wishlist" ||
      raw === "details"
    ) {
      setTab(raw);
    }
  }, []);

  const switchTab = (t: ProfileTab) => {
    setTab(t);
    window.location.hash = `#/profile/${t}`;
  };

  // Profile Details Form State
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [detailsSaved, setDetailsSaved] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);

  useEffect(() => {
    setFullName(profile.fullName);
    setEmail(profile.email || sessionUser?.email || "");
    setPhone(profile.phone);
  }, [profile, sessionUser]);

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDetails(true);
    await updateDetails({ fullName, email, phone });
    setSavingDetails(false);
    setDetailsSaved(true);
    setTimeout(() => setDetailsSaved(false), 3000);
  };

  // Address Modal / Form State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrForm, setAddrForm] = useState({
    label: "Home",
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "Tamil Nadu",
    pin: "",
    isDefault: false,
  });

  const openNewAddress = () => {
    setEditingAddressId(null);
    setAddrForm({
      label: "Home",
      name: profile.fullName || "",
      phone: profile.phone || "",
      address: "",
      city: "",
      state: "Tamil Nadu",
      pin: "",
      isDefault: profile.addresses.length === 0,
    });
    setShowAddressModal(true);
  };

  const openEditAddress = (a: UserAddress) => {
    setEditingAddressId(a.id);
    setAddrForm({
      label: a.label,
      name: a.name,
      phone: a.phone,
      address: a.address,
      city: a.city,
      state: a.state,
      pin: a.pin,
      isDefault: a.isDefault,
    });
    setShowAddressModal(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddressId) {
      updateAddress(editingAddressId, addrForm);
    } else {
      addAddress(addrForm);
    }
    setShowAddressModal(false);
  };

  // Payment Method Modal / Form State
  const [showPaymentModal, setShowPaymentModal] = useState<"card" | "upi" | null>(null);
  const [cardForm, setCardForm] = useState({
    brand: "Visa" as "Visa" | "Mastercard" | "RuPay" | "Amex",
    last4: "",
    holderName: "",
    expMonth: "01",
    expYear: "26",
    isDefault: false,
  });
  const [upiForm, setUpiForm] = useState({
    vpa: "",
    app: "Google Pay",
    isDefault: false,
  });

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardForm.last4.length !== 4 || isNaN(Number(cardForm.last4))) {
      alert("Please provide the 4 digits of the card.");
      return;
    }
    addPaymentMethod({
      type: "card",
      brand: cardForm.brand,
      last4: cardForm.last4,
      holderName: cardForm.holderName.toUpperCase().trim() || "CARDHOLDER",
      expMonth: cardForm.expMonth,
      expYear: cardForm.expYear,
      isDefault: cardForm.isDefault,
    });
    setShowPaymentModal(null);
  };

  const handleSaveUpi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiForm.vpa.includes("@")) {
      alert("Please provide a valid UPI handle (e.g. yourname@okhdfcbank).");
      return;
    }
    addPaymentMethod({
      type: "upi",
      vpa: upiForm.vpa.trim().toLowerCase(),
      app: upiForm.app,
      isDefault: upiForm.isDefault,
    });
    setShowPaymentModal(null);
  };

  // Wishlist Products Resolution
  const wishlistedProducts = useMemo(() => {
    return products.filter(
      (p) => profile.wishlist.includes(p.id) || profile.wishlist.includes(p.sku) || profile.wishlist.includes(p.name)
    );
  }, [products, profile.wishlist]);

  // Wishlist size selection & add to bag helper
  const [wishlistSizes, setWishlistSizes] = useState<Record<string, string>>({});
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  const handleWishlistAddToCart = (p: Product) => {
    const availableSizes = sortSizes(
      Object.entries(p.sizes).map(([k, n]): [string, boolean] => [k, n > 0])
    );
    const chosenSize = wishlistSizes[p.id] || (availableSizes.length > 0 ? availableSizes[0][0] : "L");
    addToCart({
      name: p.name,
      img: p.img,
      size: chosenSize,
      price: p.price,
    });
    setAddedNotice(p.name);
    setTimeout(() => setAddedNotice(null), 2500);
  };

  const statusStyle: Record<string, string> = {
    Placed: "bg-amber-100 text-amber-900 border-amber-400",
    Printing: "bg-sky-100 text-sky-900 border-sky-400",
    Packed: "bg-indigo-100 text-indigo-900 border-indigo-400",
    Shipped: "bg-purple-100 text-purple-900 border-purple-400",
    Delivered: "bg-emerald-100 text-emerald-900 border-emerald-400",
    Returned: "bg-neutral-200 text-neutral-800 border-neutral-400",
  };

  const userInitial = (profile.fullName || sessionUser?.name || sessionUser?.email || "V")[0].toUpperCase();

  return (
    <div className="min-h-screen bg-white pt-[100px] pb-24">
      {/* Header Banner */}
      <section className="border-b-2 border-black bg-neutral-100 px-6 py-12">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-start gap-5">
              <div className="grid size-20 shrink-0 place-items-center border-2 border-black bg-black text-4xl font-black text-white shadow-[4px_4px_0_0_#000]">
                {userInitial}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`${mono} bg-black px-2.5 py-1 text-[9px] font-bold tracking-[0.2em] text-white`}>
                    Archive Member
                  </span>
                  {sessionUser ? (
                    <span className={`${mono} border border-emerald-700 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold tracking-wider text-emerald-800`}>
                      ✓ Synced with Cloud
                    </span>
                  ) : (
                    <span className={`${mono} border border-neutral-400 bg-white px-2 py-0.5 text-[9px] font-bold tracking-wider text-neutral-600`}>
                      Guest Session
                    </span>
                  )}
                </div>
                <h1 className={`${disp} mt-2 text-4xl leading-none md:text-6xl`}>
                  {profile.fullName || sessionUser?.name || "Account Profile"}
                </h1>
                <p className={`${mono} mt-2 text-[11px] tracking-wider text-neutral-600`}>
                  {profile.email || sessionUser?.email || "Local member profile"}
                  {profile.phone && ` • +91 ${profile.phone}`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {sessionUser ? (
                <button
                  onClick={() => getSupabase().auth.signOut()}
                  className={`${mono} border border-black bg-white px-4 py-2.5 text-[10px] font-bold tracking-widest transition hover:bg-black hover:text-white`}
                >
                  Sign out →
                </button>
              ) : (
                <a
                  href="#/login"
                  className={`${mono} bg-black px-4 py-2.5 text-[10px] font-bold tracking-widest text-white transition hover:bg-neutral-800`}
                >
                  Log in to sync account →
                </a>
              )}
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="mt-8 grid grid-cols-2 gap-px bg-black/15 sm:grid-cols-4">
            <div className="bg-white p-4">
              <p className={`${mono} text-[9px] tracking-[0.2em] text-neutral-500`}>Orders recorded</p>
              <p className={`${disp} mt-1 text-3xl leading-none`}>{profile.orders.length}</p>
            </div>
            <div className="bg-white p-4">
              <p className={`${mono} text-[9px] tracking-[0.2em] text-neutral-500`}>Saved addresses</p>
              <p className={`${disp} mt-1 text-3xl leading-none`}>{profile.addresses.length}</p>
            </div>
            <div className="bg-white p-4">
              <p className={`${mono} text-[9px] tracking-[0.2em] text-neutral-500`}>Saved payment aliases</p>
              <p className={`${disp} mt-1 text-3xl leading-none`}>{profile.paymentMethods.length}</p>
            </div>
            <div className="bg-white p-4">
              <p className={`${mono} text-[9px] tracking-[0.2em] text-neutral-500`}>Wishlist pieces</p>
              <p className={`${disp} mt-1 text-3xl leading-none`}>{wishlistCount}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <section className="sticky top-[60px] z-40 border-b-2 border-black bg-white">
        <div className="mx-auto flex max-w-[1500px] overflow-x-auto px-6">
          {(
            [
              ["details", "01 // Profile details"],
              ["orders", `02 // My orders [${profile.orders.length}]`],
              ["addresses", `03 // Saved addresses [${profile.addresses.length}]`],
              ["payments", `04 // Payment methods [${profile.paymentMethods.length}]`],
              ["wishlist", `05 // Wishlist [${wishlistCount}]`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={`${mono} shrink-0 border-b-2 px-5 py-4 text-[11px] font-bold tracking-[0.12em] transition ${
                tab === key
                  ? "border-black bg-black text-white"
                  : "border-transparent text-neutral-600 hover:border-black/30 hover:text-black"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Main Tab Content */}
      <div className="mx-auto max-w-[1500px] px-6 py-12">
        {/* ==================== TAB 1: DETAILS ==================== */}
        {tab === "details" && (
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="mb-6 border-b border-black pb-3">
                <p className={`${mono} text-[10px] tracking-[0.2em] text-neutral-500`}>Account credentials</p>
                <h2 className={`${disp} text-4xl leading-none`}>Edit personal details</h2>
              </div>

              <form onSubmit={handleSaveDetails} className="space-y-5">
                <label className="block">
                  <span className={`${mono} text-[10px] font-bold tracking-wider`}>Full name</span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full name"
                    className="mt-1 w-full border border-black bg-white px-4 py-3 text-sm font-medium outline-none focus:bg-neutral-50"
                  />
                </label>

                <label className="block">
                  <span className={`${mono} text-[10px] font-bold tracking-wider`}>Email address</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="mt-1 w-full border border-black bg-white px-4 py-3 text-sm font-medium outline-none focus:bg-neutral-50"
                  />
                  <span className={`${mono} mt-1 block text-[9px] text-neutral-500`}>
                    Used for order receipts, shipping notifications, and drop access.
                  </span>
                </label>

                <label className="block">
                  <span className={`${mono} text-[10px] font-bold tracking-wider`}>Mobile contact number</span>
                  <div className="mt-1 flex border border-black bg-white">
                    <span className={`${mono} flex items-center bg-neutral-100 px-3 text-xs font-bold`}>+91</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className="min-w-0 flex-1 px-4 py-3 text-sm font-medium outline-none"
                    />
                  </div>
                  <span className={`${mono} mt-1 block text-[9px] text-neutral-500`}>
                    10-digit Indian mobile number for courier SMS dispatch updates.
                  </span>
                </label>

                <div className="flex items-center gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={savingDetails}
                    className={`${mono} bg-black px-6 py-4 text-[11px] font-bold tracking-[0.15em] text-white transition hover:bg-neutral-800 disabled:opacity-50`}
                  >
                    {savingDetails ? "Saving changes…" : "Save details"}
                  </button>
                  {detailsSaved && (
                    <span className={`${mono} text-[11px] font-bold tracking-wider text-emerald-700`}>
                      ✓ Profile details updated
                    </span>
                  )}
                </div>
              </form>
            </div>

            {/* Privacy Standards & Compliance Card */}
            <div className="space-y-6">
              <div className="border-2 border-black bg-neutral-50 p-6 shadow-[6px_6px_0_0_#000]">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center bg-black text-xs font-bold text-white">🔒</span>
                  <h3 className={`${mono} text-xs font-bold tracking-widest`}>
                    Privacy &amp; Industry Standards
                  </h3>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-neutral-700">
                  Venkayam adheres to the <b>Digital Personal Data Protection Act (DPDP 2023)</b> and international privacy benchmarks.
                </p>
                <ul className="mt-4 space-y-2.5 text-xs text-neutral-600">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-black">•</span>
                    <span><b>Zero Data Resale:</b> Your personal details are never rented, sold, or shared with external ad brokers.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-black">•</span>
                    <span><b>Strict Fulfillment Segregation:</b> Admin staff only see essential logistics data (name, contact phone, delivery city/address) needed to print shipping labels.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-black">•</span>
                    <span><b>Client-side Privacy:</b> Your wishlist preferences and saved payment aliases stay private to your session.</span>
                  </li>
                </ul>
              </div>

              <div className="border border-black/20 p-5">
                <p className={`${mono} text-[10px] tracking-widest text-neutral-500`}>Need account support?</p>
                <p className="mt-1 text-sm font-bold">Have questions or want your data erased?</p>
                <p className="mt-1 text-xs text-neutral-600">
                  Reach out directly to the studio team at <a href="mailto:care@venkayam.in" className="underline font-bold">care@venkayam.in</a>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: MY ORDERS ==================== */}
        {tab === "orders" && (
          <div>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-black pb-3">
              <div>
                <p className={`${mono} text-[10px] tracking-[0.2em] text-neutral-500`}>Order tracking &amp; history</p>
                <h2 className={`${disp} text-4xl leading-none`}>My orders</h2>
              </div>
              <p className={`${mono} text-[11px] tracking-wider text-neutral-500`}>
                {profile.orders.length} order{profile.orders.length === 1 ? "" : "s"} on file
              </p>
            </div>

            {profile.orders.length === 0 ? (
              <div className="border-2 border-dashed border-black/30 p-16 text-center">
                <p className={`${disp} text-3xl`}>No orders on file yet</p>
                <p className={`${mono} mt-2 text-[11px] tracking-wider text-neutral-500`}>
                  You haven&apos;t placed any orders in this session yet. Explore the archive to secure your first piece.
                </p>
                <div className="mt-6">
                  <a
                    href="#/shop"
                    className={`${mono} inline-block bg-black px-6 py-3.5 text-[11px] font-bold tracking-[0.15em] text-white hover:bg-neutral-800`}
                  >
                    Explore archive pieces →
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {profile.orders.map((o) => (
                  <div
                    key={o.id}
                    className="border-2 border-black bg-white shadow-[6px_6px_0_0_#000] transition duration-200"
                  >
                    {/* Order Card Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-black bg-neutral-100 px-6 py-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <div>
                          <span className={`${mono} text-[9px] tracking-[0.2em] text-neutral-500`}>Order reference</span>
                          <p className={`${disp} text-2xl leading-none`}>{o.id}</p>
                        </div>
                        <div className="border-l border-black/20 pl-4">
                          <span className={`${mono} text-[9px] tracking-[0.2em] text-neutral-500`}>Date placed</span>
                          <p className={`${mono} text-xs font-bold`}>
                            {new Date(o.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`${mono} border px-3 py-1 text-[10px] font-bold tracking-wider ${
                            statusStyle[o.status] || "bg-neutral-100 text-black border-black"
                          }`}
                        >
                          {o.status}
                        </span>
                        {o.track && (
                          <a
                            href={`#/track?code=${o.track}`}
                            className={`${mono} border border-black bg-white px-3 py-1 text-[10px] font-bold tracking-wider hover:bg-black hover:text-white`}
                          >
                            Track →
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Order Items & Info */}
                    <div className="grid gap-6 p-6 md:grid-cols-[1.5fr_1fr]">
                      <div>
                        <p className={`${mono} mb-3 text-[10px] font-bold tracking-wider text-neutral-500`}>
                          Items in package
                        </p>
                        <div className="divide-y divide-black/10 border-t border-b border-black/10">
                          {o.items.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between py-3">
                              <div>
                                <p className="font-extrabold uppercase text-sm leading-snug">{it.name}</p>
                                <p className={`${mono} text-[10px] tracking-wider text-neutral-500`}>
                                  Size {it.size} • Qty {it.qty}
                                </p>
                              </div>
                              <p className={`${mono} text-xs font-bold`}>
                                {inr(it.price * it.qty)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-black/10 pt-4 md:border-t-0 md:border-l md:border-black/10 md:pl-6 md:pt-0">
                        <p className={`${mono} mb-2 text-[10px] font-bold tracking-wider text-neutral-500`}>
                          Fulfillment details
                        </p>
                        <div className="space-y-1 text-xs">
                          <p className="font-bold">{o.customer}</p>
                          <p className="text-neutral-600">{o.address}</p>
                          <p className="text-neutral-600">{o.city}</p>
                          <p className={`${mono} pt-1 text-[10px] text-neutral-500`}>Contact: +91 {o.phone}</p>
                          <p className={`${mono} pt-1 text-[10px] text-neutral-500`}>Payment: {o.pay}</p>
                        </div>

                        <div className="mt-4 border-t border-black/15 pt-3">
                          <div className="flex justify-between items-baseline">
                            <span className={`${mono} text-[10px] font-bold tracking-wider`}>Total paid</span>
                            <span className={`${disp} text-2xl`}>{inr(o.amount)}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <a
                            href="#/returns"
                            className={`${mono} text-[10px] font-bold tracking-wider underline text-neutral-600 hover:text-black`}
                          >
                            Return or exchange →
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: SAVED ADDRESSES ==================== */}
        {tab === "addresses" && (
          <div>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-black pb-3">
              <div>
                <p className={`${mono} text-[10px] tracking-[0.2em] text-neutral-500`}>Shipping destinations</p>
                <h2 className={`${disp} text-4xl leading-none`}>Saved addresses</h2>
              </div>
              <button
                onClick={openNewAddress}
                className={`${mono} bg-black px-4 py-2.5 text-[11px] font-bold tracking-widest text-white hover:bg-neutral-800`}
              >
                + Add new address
              </button>
            </div>

            {profile.addresses.length === 0 ? (
              <div className="border-2 border-dashed border-black/30 p-12 text-center">
                <p className={`${disp} text-2xl`}>No addresses saved</p>
                <p className={`${mono} mt-1 text-[11px] text-neutral-500`}>
                  Add your primary delivery address for 1-tap checkout.
                </p>
                <button
                  onClick={openNewAddress}
                  className={`${mono} mt-4 bg-black px-5 py-3 text-[10px] font-bold tracking-widest text-white`}
                >
                  + Add address
                </button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {profile.addresses.map((a) => (
                  <div
                    key={a.id}
                    className={`relative flex flex-col justify-between border-2 border-black p-5 ${
                      a.isDefault ? "bg-white shadow-[6px_6px_0_0_#000]" : "bg-neutral-50"
                    }`}
                  >
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <span className={`${mono} bg-black px-2 py-0.5 text-[9px] font-bold tracking-wider text-white`}>
                          {a.label}
                        </span>
                        {a.isDefault && (
                          <span className={`${mono} border border-black bg-white px-2 py-0.5 text-[9px] font-bold tracking-wider`}>
                            ★ Default shipping
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold uppercase text-base">{a.name}</h3>
                      <p className={`${mono} mt-0.5 text-[10px] text-neutral-500`}>+91 {a.phone}</p>
                      <p className="mt-3 text-xs leading-relaxed text-neutral-700">{a.address}</p>
                      <p className="text-xs font-semibold text-neutral-900">
                        {a.city}, {a.state} - {a.pin}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-black/15 pt-3">
                      {!a.isDefault && (
                        <button
                          onClick={() => setDefaultAddress(a.id)}
                          className={`${mono} border border-black px-2.5 py-1 text-[9px] font-bold tracking-wider hover:bg-black hover:text-white`}
                        >
                          Set as default
                        </button>
                      )}
                      <button
                        onClick={() => openEditAddress(a)}
                        className={`${mono} border border-black px-2.5 py-1 text-[9px] font-bold tracking-wider hover:bg-black hover:text-white`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteAddress(a.id)}
                        className={`${mono} text-[9px] font-bold tracking-wider text-red-700 underline hover:text-red-900`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 4: PAYMENT METHODS ==================== */}
        {tab === "payments" && (
          <div className="space-y-10">
            <div>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-black pb-3">
                <div>
                  <p className={`${mono} text-[10px] tracking-[0.2em] text-neutral-500`}>1-Tap checkout preferences</p>
                  <h2 className={`${disp} text-4xl leading-none`}>Payment methods</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPaymentModal("upi")}
                    className={`${mono} border border-black bg-white px-3 py-2 text-[10px] font-bold tracking-wider hover:bg-black hover:text-white`}
                  >
                    + Add UPI ID
                  </button>
                  <button
                    onClick={() => setShowPaymentModal("card")}
                    className={`${mono} bg-black px-3 py-2 text-[10px] font-bold tracking-wider text-white hover:bg-neutral-800`}
                  >
                    + Add card alias
                  </button>
                </div>
              </div>

              {/* Security & PCI-DSS Compliance Banner */}
              <div className="mb-8 border-2 border-black bg-neutral-100 p-5">
                <div className="flex items-center gap-2">
                  <span className="font-bold">🛡️</span>
                  <h3 className={`${mono} text-xs font-bold tracking-widest`}>
                    PCI-DSS Level 1 &amp; RBI Tokenization Compliance
                  </h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-neutral-700">
                  Venkayam strictly adheres to the <b>Reserve Bank of India (RBI) Tokenization Mandates</b> and <b>Payment Card Industry Data Security Standards (PCI-DSS)</b>.
                  We <b>NEVER</b> store raw 16-digit card numbers (PANs) or Card Verification Values (CVV) on our servers.
                  Only secure, tokenized network aliases and last-4 digits are retained on your device for checkout recognition.
                </p>
              </div>

              {/* UPI Methods Section */}
              <div className="mb-8">
                <h3 className={`${mono} mb-4 text-xs font-bold tracking-wider text-neutral-500`}>
                  Saved UPI VPAs [{profile.paymentMethods.filter((m) => m.type === "upi").length}]
                </h3>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {profile.paymentMethods
                    .filter((m): m is SavedUpiMethod => m.type === "upi")
                    .map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col justify-between border-2 border-black p-5 ${
                          m.isDefault ? "bg-white shadow-[6px_6px_0_0_#000]" : "bg-neutral-50"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className={`${mono} bg-black px-2 py-0.5 text-[9px] font-bold text-white`}>
                              {m.app || "UPI"}
                            </span>
                            {m.isDefault && (
                              <span className={`${mono} border border-black bg-white px-2 py-0.5 text-[9px] font-bold`}>
                                ★ Default
                              </span>
                            )}
                          </div>
                          <p className={`${mono} mt-4 text-sm font-bold tracking-wider text-black`}>{m.vpa}</p>
                          <p className={`${mono} mt-1 text-[9px] text-neutral-500`}>Encrypted Virtual Payment Address</p>
                        </div>

                        <div className="mt-5 flex items-center justify-between border-t border-black/15 pt-3">
                          {!m.isDefault ? (
                            <button
                              onClick={() => setDefaultPaymentMethod(m.id)}
                              className={`${mono} text-[9px] font-bold tracking-wider underline hover:text-black`}
                            >
                              Set default
                            </button>
                          ) : (
                            <span />
                          )}
                          <button
                            onClick={() => deletePaymentMethod(m.id)}
                            className={`${mono} text-[9px] font-bold tracking-wider text-red-700 underline`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Card Tokenized Aliases Section */}
              <div>
                <h3 className={`${mono} mb-4 text-xs font-bold tracking-wider text-neutral-500`}>
                  Saved Card Aliases [{profile.paymentMethods.filter((m) => m.type === "card").length}]
                </h3>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {profile.paymentMethods
                    .filter((m): m is SavedCardMethod => m.type === "card")
                    .map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col justify-between border-2 border-black p-5 ${
                          m.isDefault ? "bg-black text-white shadow-[6px_6px_0_0_#000]" : "bg-neutral-50 text-black"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span
                              className={`${mono} px-2 py-0.5 text-[9px] font-bold tracking-wider ${
                                m.isDefault ? "bg-white text-black" : "bg-black text-white"
                              }`}
                            >
                              {m.brand}
                            </span>
                            {m.isDefault && (
                              <span className={`${mono} border border-white px-2 py-0.5 text-[9px] font-bold text-white`}>
                                ★ Default
                              </span>
                            )}
                          </div>

                          <p className={`${mono} mt-6 text-lg font-bold tracking-widest`}>
                            •••• •••• •••• {m.last4}
                          </p>
                          <div className="mt-4 flex justify-between text-[10px]">
                            <div>
                              <p className={`${mono} text-[8px] opacity-60`}>Cardholder</p>
                              <p className="font-bold uppercase">{m.holderName}</p>
                            </div>
                            <div>
                              <p className={`${mono} text-[8px] opacity-60`}>Expires</p>
                              <p className={`${mono} font-bold`}>
                                {m.expMonth}/{m.expYear}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`mt-6 flex items-center justify-between border-t pt-3 ${
                            m.isDefault ? "border-white/20" : "border-black/15"
                          }`}
                        >
                          {!m.isDefault ? (
                            <button
                              onClick={() => setDefaultPaymentMethod(m.id)}
                              className={`${mono} text-[9px] font-bold tracking-wider underline hover:text-black`}
                            >
                              Set default
                            </button>
                          ) : (
                            <span />
                          )}
                          <button
                            onClick={() => deletePaymentMethod(m.id)}
                            className={`${mono} text-[9px] font-bold tracking-wider text-red-500 underline hover:text-red-700`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 5: WISHLIST ==================== */}
        {tab === "wishlist" && (
          <div>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-black pb-3">
              <div>
                <p className={`${mono} text-[10px] tracking-[0.2em] text-neutral-500`}>Bookmarked pieces</p>
                <h2 className={`${disp} text-4xl leading-none`}>My wishlist</h2>
              </div>
              <p className={`${mono} text-[11px] tracking-wider text-neutral-500`}>
                {wishlistedProducts.length} piece{wishlistedProducts.length === 1 ? "" : "s"} saved
              </p>
            </div>

            {addedNotice && (
              <div className={`${mono} mb-6 border-2 border-black bg-black p-3 text-center text-xs font-bold text-white`}>
                ✓ &quot;{addedNotice}&quot; added to your bag
              </div>
            )}

            {wishlistedProducts.length === 0 ? (
              <div className="border-2 border-dashed border-black/30 p-16 text-center">
                <p className={`${disp} text-3xl`}>Your wishlist is empty</p>
                <p className={`${mono} mt-2 text-[11px] tracking-wider text-neutral-500`}>
                  Bookmark high-demand pieces from the archive to monitor sizes and restock alerts.
                </p>
                <div className="mt-6">
                  <a
                    href="#/shop"
                    className={`${mono} inline-block bg-black px-6 py-3.5 text-[11px] font-bold tracking-[0.15em] text-white hover:bg-neutral-800`}
                  >
                    Browse archive →
                  </a>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {wishlistedProducts.map((p) => {
                  const sizes = sortSizes(
                    Object.entries(p.sizes).map(([k, n]): [string, boolean] => [k, n > 0])
                  );
                  const selectedSize = wishlistSizes[p.id] || (sizes.length > 0 ? sizes[0][0] : "L");

                  return (
                    <article
                      key={p.id}
                      className="group flex flex-col border-2 border-black bg-white shadow-[6px_6px_0_0_#000] transition duration-200"
                    >
                      {/* Image Frame */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-[#f8eadf]">
                        <img
                          src={imgSrc(p.img)}
                          alt={p.name}
                          className="size-full object-contain transition duration-500 group-hover:scale-105"
                        />
                        <span className={`${mono} absolute left-3 top-3 bg-black px-2 py-1 text-[9px] font-bold text-white`}>
                          {p.badge || "Archive"}
                        </span>
                        <button
                          onClick={() => toggleWishlist(p.id)}
                          aria-label={`Remove ${p.name} from wishlist`}
                          className={`${mono} absolute right-3 top-3 border border-black bg-white px-2 py-1 text-[9px] font-bold tracking-wider hover:bg-black hover:text-white`}
                        >
                          ✕ Remove
                        </button>
                      </div>

                      {/* Content */}
                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`${disp} text-2xl leading-none`}>
                            <a href={`#/product/${slug(p)}`} className="hover:underline">
                              {p.name}
                            </a>
                          </h3>
                        </div>

                        <div className="mt-2 flex items-center gap-3">
                          <span className={`${mono} text-sm font-bold`}>{inr(p.price)}</span>
                          <span className={`${mono} text-[10px] text-neutral-500`}>{stockLabel(p)}</span>
                        </div>

                        {/* Size Picker for fast Cart Add */}
                        <div className="mt-4">
                          <p className={`${mono} mb-1.5 text-[9px] font-bold text-neutral-500`}>Select size</p>
                          <div className="flex flex-wrap gap-1.5">
                            {sizes.map(([s, ok]) => (
                              <button
                                key={s}
                                type="button"
                                disabled={!ok}
                                onClick={() =>
                                  setWishlistSizes((prev) => ({ ...prev, [p.id]: s }))
                                }
                                className={`${mono} min-w-8 border px-2 py-1 text-[9px] font-bold transition ${
                                  !ok
                                    ? "cursor-not-allowed border-black/15 text-neutral-300 line-through"
                                    : selectedSize === s
                                    ? "border-black bg-black text-white"
                                    : "border-black bg-white hover:bg-neutral-200"
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="mt-auto pt-5">
                          <button
                            onClick={() => handleWishlistAddToCart(p)}
                            className={`${mono} w-full border-2 border-black bg-black py-3 text-[10px] font-bold tracking-[0.15em] text-white transition hover:bg-neutral-800`}
                          >
                            Add to bag • {selectedSize}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg border-2 border-black bg-white p-6 shadow-[8px_8px_0_0_#000]">
            <div className="mb-5 flex items-center justify-between border-b-2 border-black pb-3">
              <h3 className={`${disp} text-2xl`}>
                {editingAddressId ? "Edit address" : "New address"}
              </h3>
              <button
                onClick={() => setShowAddressModal(false)}
                className={`${mono} text-xs font-bold`}
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={`${mono} text-[9px] font-bold`}>Label</span>
                  <select
                    value={addrForm.label}
                    onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
                    className="mt-1 w-full border border-black p-2 text-xs font-bold"
                  >
                    <option value="Home">Home</option>
                    <option value="Studio">Studio</option>
                    <option value="Work">Work / Office</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label className="block">
                  <span className={`${mono} text-[9px] font-bold`}>Recipient name</span>
                  <input
                    required
                    value={addrForm.name}
                    onChange={(e) => setAddrForm({ ...addrForm, name: e.target.value })}
                    className="mt-1 w-full border border-black p-2 text-xs"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={`${mono} text-[9px] font-bold`}>Phone number</span>
                  <input
                    required
                    value={addrForm.phone}
                    onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                    className="mt-1 w-full border border-black p-2 text-xs"
                  />
                </label>
                <label className="block">
                  <span className={`${mono} text-[9px] font-bold`}>PIN code</span>
                  <input
                    required
                    value={addrForm.pin}
                    onChange={(e) => setAddrForm({ ...addrForm, pin: e.target.value })}
                    className="mt-1 w-full border border-black p-2 text-xs"
                  />
                </label>
              </div>

              <label className="block">
                <span className={`${mono} text-[9px] font-bold`}>Street address / Flat</span>
                <input
                  required
                  value={addrForm.address}
                  onChange={(e) => setAddrForm({ ...addrForm, address: e.target.value })}
                  className="mt-1 w-full border border-black p-2 text-xs"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={`${mono} text-[9px] font-bold`}>City</span>
                  <input
                    required
                    value={addrForm.city}
                    onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                    className="mt-1 w-full border border-black p-2 text-xs"
                  />
                </label>
                <label className="block">
                  <span className={`${mono} text-[9px] font-bold`}>State</span>
                  <input
                    required
                    value={addrForm.state}
                    onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                    className="mt-1 w-full border border-black p-2 text-xs"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  checked={addrForm.isDefault}
                  onChange={(e) => setAddrForm({ ...addrForm, isDefault: e.target.checked })}
                  className="size-4 accent-black"
                />
                <span className={`${mono} text-[10px] font-bold`}>Set as default shipping address</span>
              </label>

              <div className="flex justify-end gap-3 border-t border-black/15 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className={`${mono} border border-black px-4 py-2 text-[10px] font-bold hover:bg-neutral-100`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${mono} bg-black px-5 py-2 text-[10px] font-bold text-white hover:bg-neutral-800`}
                >
                  Save address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modals */}
      {showPaymentModal === "upi" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md border-2 border-black bg-white p-6 shadow-[8px_8px_0_0_#000]">
            <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
              <h3 className={`${disp} text-2xl`}>Add UPI ID</h3>
              <button
                onClick={() => setShowPaymentModal(null)}
                className={`${mono} text-xs font-bold`}
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSaveUpi} className="space-y-4">
              <label className="block">
                <span className={`${mono} text-[9px] font-bold`}>UPI VPA handle</span>
                <input
                  required
                  placeholder="username@bank"
                  value={upiForm.vpa}
                  onChange={(e) => setUpiForm({ ...upiForm, vpa: e.target.value })}
                  className="mt-1 w-full border border-black p-2 text-xs"
                />
              </label>

              <label className="block">
                <span className={`${mono} text-[9px] font-bold`}>Preferred app</span>
                <select
                  value={upiForm.app}
                  onChange={(e) => setUpiForm({ ...upiForm, app: e.target.value })}
                  className="mt-1 w-full border border-black p-2 text-xs font-bold"
                >
                  <option value="Google Pay">Google Pay</option>
                  <option value="PhonePe">PhonePe</option>
                  <option value="Paytm">Paytm</option>
                  <option value="BHIM">BHIM</option>
                  <option value="UPI">Other UPI</option>
                </select>
              </label>

              <label className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={upiForm.isDefault}
                  onChange={(e) => setUpiForm({ ...upiForm, isDefault: e.target.checked })}
                  className="size-4 accent-black"
                />
                <span className={`${mono} text-[10px] font-bold`}>Set as default UPI</span>
              </label>

              <div className="flex justify-end gap-3 border-t border-black/15 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(null)}
                  className={`${mono} border border-black px-4 py-2 text-[10px] font-bold`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${mono} bg-black px-5 py-2 text-[10px] font-bold text-white`}
                >
                  Save UPI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal === "card" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md border-2 border-black bg-white p-6 shadow-[8px_8px_0_0_#000]">
            <div className="mb-4 flex items-center justify-between border-b-2 border-black pb-3">
              <h3 className={`${disp} text-2xl`}>Add Card Alias</h3>
              <button
                onClick={() => setShowPaymentModal(null)}
                className={`${mono} text-xs font-bold`}
              >
                ✕ Close
              </button>
            </div>

            <p className={`${mono} mb-4 text-[9px] leading-relaxed text-neutral-600`}>
              🛡️ PCI-DSS Notice: For maximum privacy, we strictly store only the cardholder name and last-4 digits for UI recognition. Never enter your full card number or CVV.
            </p>

            <form onSubmit={handleSaveCard} className="space-y-4">
              <label className="block">
                <span className={`${mono} text-[9px] font-bold`}>Name on card</span>
                <input
                  required
                  placeholder="Full name as printed on card"
                  value={cardForm.holderName}
                  onChange={(e) => setCardForm({ ...cardForm, holderName: e.target.value })}
                  className="mt-1 w-full border border-black p-2 text-xs uppercase"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={`${mono} text-[9px] font-bold`}>Card network</span>
                  <select
                    value={cardForm.brand}
                    onChange={(e) =>
                      setCardForm({
                        ...cardForm,
                        brand: e.target.value as "Visa" | "Mastercard" | "RuPay" | "Amex",
                      })
                    }
                    className="mt-1 w-full border border-black p-2 text-xs font-bold"
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="RuPay">RuPay</option>
                    <option value="Amex">American Express</option>
                  </select>
                </label>

                <label className="block">
                  <span className={`${mono} text-[9px] font-bold`}>Last 4 digits</span>
                  <input
                    required
                    maxLength={4}
                    placeholder="4 digits"
                    value={cardForm.last4}
                    onChange={(e) => setCardForm({ ...cardForm, last4: e.target.value.replace(/\D/g, "") })}
                    className="mt-1 w-full border border-black p-2 text-xs font-mono"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={`${mono} text-[9px] font-bold`}>Expiry month</span>
                  <select
                    value={cardForm.expMonth}
                    onChange={(e) => setCardForm({ ...cardForm, expMonth: e.target.value })}
                    className="mt-1 w-full border border-black p-2 text-xs"
                  >
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={`${mono} text-[9px] font-bold`}>Expiry year</span>
                  <select
                    value={cardForm.expYear}
                    onChange={(e) => setCardForm({ ...cardForm, expYear: e.target.value })}
                    className="mt-1 w-full border border-black p-2 text-xs"
                  >
                    {["25", "26", "27", "28", "29", "30", "31", "32"].map((y) => (
                      <option key={y} value={y}>
                        20{y}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={cardForm.isDefault}
                  onChange={(e) => setCardForm({ ...cardForm, isDefault: e.target.checked })}
                  className="size-4 accent-black"
                />
                <span className={`${mono} text-[10px] font-bold`}>Set as default card</span>
              </label>

              <div className="flex justify-end gap-3 border-t border-black/15 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(null)}
                  className={`${mono} border border-black px-4 py-2 text-[10px] font-bold`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${mono} bg-black px-5 py-2 text-[10px] font-bold text-white`}
                >
                  Save card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

