import { useSyncExternalStore } from "react";

export type Product = {
  id: string; sku: string; name: string; cat: string; price: number; was: number;
  tag: string; badge: string; img: string; emblem?: string; onion?: boolean; description?: string;
  sizes: Record<string, number>; sold: number; threshold: number; active: boolean; drop: boolean; claimed: number;
};
export type Status = "Placed" | "Printing" | "Packed" | "Shipped" | "Delivered" | "Returned";
export const FLOW: Status[] = ["Placed", "Printing", "Packed", "Shipped", "Delivered"];
export type OrderItem = { name: string; size: string; qty: number; price: number };
export type Order = {
  id: string; customer: string; phone: string; city: string; address: string; items: OrderItem[];
  amount: number; pay: "COD" | "UPI" | "Card"; status: Status; createdAt: number; note: string; promo?: string;
};
export type Promo = { id: string; code: string; desc: string; type: "flat" | "percent"; value: number; used: number; cap: number; on: boolean };
export type Zone = { id: string; name: string; days: string; fee: number; freeAbove: number };
export type Look = { id: string; img: string; label: string; title: string; shape: "tall" | "wide" };
export type Settings = { freeShip: number; shipFee: number; codFee: number };
export type Activity = { t: number; m: string; k: "order" | "alert" | "ship" | "edit" };
export type DB = { products: Product[]; orders: Order[]; promos: Promo[]; zones: Zone[]; looks: Look[]; settings: Settings; activity: Activity[]; counter: number };

export const CATS: [string, string][] = [["tees", "Tees"], ["hoodies", "Hoodies"], ["caps", "Caps"], ["acc", "Accessories"]];
export const catLabel = (c: string) => CATS.find(([k]) => k === c)?.[1] ?? c;
export const sizeKeys = (cat: string) => (cat === "caps" || cat === "acc" ? ["One size"] : ["S", "M", "L", "XL", "XXL"]);
export const IMAGES = ["f1497.png", "2e222.png", "9bdff.png", "79b1c.png", "83098.png", "62447.png", "99450.png", "ce1cd.png", "37da8.png", "237a4.png"];
export const imgSrc = (i: string) => (/^(https?:|data:|\/)/.test(i) ? i : `/assets/${i}`);
export const totalStock = (p: Product) => Object.values(p.sizes).reduce((a, b) => a + b, 0);
export const offLabel = (p: Product) => (p.was > p.price ? `${Math.round(((p.was - p.price) / p.was) * 100)}% OFF` : "");
export const stockLabel = (p: Product) => {
  const t = totalStock(p);
  return t === 0 ? "SOLD OUT" : t <= 30 ? `LIMITED [${t} PCS]` : "IN STOCK";
};
export const itemsText = (o: Order) => o.items.map((i) => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ""} (${i.size})`).join(", ");

const uid = (p: string) => p + Math.random().toString(36).slice(2, 9);

function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

const mk = (sku: string, name: string, cat: string, price: number, was: number, tag: string, badge: string, img: string, sizes: Record<string, number>, sold: number, threshold: number, claimed: number, extra: Partial<Product> = {}): Product =>
  ({ id: uid("p"), sku, name, cat, price, was, tag, badge, img, sizes, sold, threshold, active: true, drop: true, claimed, ...extra });

function seed(): DB {
  const products: Product[] = [
    mk("TEE-004", "THALAIVAR TRIBUTE 280 GSM OVERSIZED TEE", "tees", 1499, 2299, "280 GSM", "EDITION: DROP 04", "f1497.png", { S: 22, M: 41, L: 38, XL: 14, XXL: 5 }, 312, 12, 138),
    mk("HOD-001", "VENKAYAM ONION MONOGRAM HOODIE (CHARCOAL)", "hoodies", 2999, 3999, "450 GSM TERRY", "FLAGSHIP PIECE", "2e222.png", { S: 6, M: 9, L: 11, XL: 3, XXL: 0 }, 188, 8, 112, { onion: true }),
    mk("TEE-007", "MADRAS NOIR ACID WASH GRAPHIC TEE", "tees", 1699, 2499, "ACID WASH 260 GSM", "VINTAGE WASH", "9bdff.png", { S: 18, M: 26, L: 20, XL: 9, XXL: 7 }, 241, 12, 97),
    mk("TEE-009", "KOLLYWOOD RETRO CLUB TEE", "tees", 1599, 2199, "OFF-WHITE HEAVY", "COLLAB EDITION", "79b1c.png", { S: 30, M: 44, L: 36, XL: 21, XXL: 12 }, 167, 12, 74),
    mk("CAP-002", "VENKAYAM STREETWEAR 5-PANEL CAP", "caps", 999, 1499, "COTTON CANVAS", "HEADWEAR SPEC", "83098.png", { "One size": 64 }, 402, 20, 120),
    mk("TOT-003", "HEAVYWEIGHT CANVAS ONION TOTE BAG", "acc", 799, 1199, "16 OZ DUCK CANVAS", "DAILY CARRY", "62447.png", { "One size": 15 }, 276, 20, 88, { emblem: "f6362.png" }),
  ];
  const r = rng(42);
  const names = ["Arjun K.", "Meenakshi R.", "Karthik S.", "Divya P.", "Vignesh M.", "Priya N.", "Surya T.", "Anitha L.", "Rahul B.", "Harini V.", "Dinesh C.", "Lakshmi G."];
  const cities = ["Chennai", "Coimbatore", "Madurai", "Bengaluru", "Mumbai", "Hyderabad", "Delhi", "Pune", "Kochi"];
  const sts: Status[] = ["Placed", "Placed", "Printing", "Printing", "Packed", "Shipped", "Shipped", "Delivered", "Delivered", "Delivered", "Returned"];
  const now = Date.now();
  const orders: Order[] = Array.from({ length: 24 }, (_, i) => {
    const p = products[Math.floor(r() * products.length)];
    const sk = Object.keys(p.sizes);
    const qty = 1 + Math.floor(r() * 2);
    const ci = Math.floor(r() * names.length);
    return {
      id: `VNK-${2480 - i}`, customer: names[ci], phone: `98765${String(10000 + ci * 731 + i).slice(-5)}`, city: cities[Math.floor(r() * cities.length)], address: "Sample address, street 12",
      items: [{ name: p.name, size: sk[Math.floor(r() * sk.length)], qty, price: p.price }], amount: p.price * qty,
      pay: (["COD", "UPI", "Card"] as const)[Math.floor(r() * 3)], status: sts[Math.floor(r() * sts.length)],
      createdAt: now - (i * 31 + 2) * 36e5, note: "",
    };
  });
  return {
    products, orders, counter: 2481,
    promos: [
      { id: uid("c"), code: "VENKAYAM10", desc: "₹100 off first archive piece", type: "flat", value: 100, used: 412, cap: 600, on: true },
      { id: uid("c"), code: "DROP04EARLY", desc: "Early access, 10% off", type: "percent", value: 10, used: 138, cap: 150, on: true },
      { id: uid("c"), code: "TIRUPPUR15", desc: "Bulk, 15% off", type: "percent", value: 15, used: 57, cap: 200, on: false },
    ],
    zones: [
      { id: uid("z"), name: "Chennai metro", days: "1-2 days", fee: 49, freeAbove: 999 },
      { id: uid("z"), name: "Tamil Nadu, Kerala, Karnataka", days: "2-4 days", fee: 79, freeAbove: 999 },
      { id: uid("z"), name: "Maharashtra, Telangana, Delhi NCR", days: "3-5 days", fee: 79, freeAbove: 999 },
      { id: uid("z"), name: "Rest of India", days: "5-8 days", fee: 99, freeAbove: 999 },
      { id: uid("z"), name: "North-East & J&K", days: "7-10 days", fee: 149, freeAbove: 1999 },
    ],
    looks: [
      ["99450.png", "Look 01", "Tee, Night shift", "tall"], ["ce1cd.png", "Look 02", "Charcoal heavy hoodie", "wide"], ["f1497.png", "Look 03", "Thalaivar tribute", "tall"], ["37da8.png", "Look 04", "Five-panel, Royapettah", "tall"],
      ["9bdff.png", "Look 05", "Madras noir wash", "wide"], ["79b1c.png", "Look 06", "Retro club", "tall"], ["237a4.png", "Look 07", "Canvas carry", "tall"], ["2e222.png", "Look 08", "Monogram, close", "wide"],
    ].map(([img, label, title, shape]) => ({ id: uid("l"), img, label, title, shape: shape as Look["shape"] })),
    settings: { freeShip: 999, shipFee: 79, codFee: 40 },
    activity: [{ t: now, m: "Store data initialised", k: "edit" }],
  };
}

const KEY = "venkayam-db-v1";
const load = (): DB => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DB;
  } catch { /* fall through to seed */ }
  return seed();
};

let db: DB = load();
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const commit = (next: DB) => {
  db = next;
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* storage full or blocked */ }
  emit();
};
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY && e.newValue) {
      try { db = JSON.parse(e.newValue); emit(); } catch { /* ignore */ }
    }
  });
}

const subscribe = (f: () => void) => { subs.add(f); return () => void subs.delete(f); };
export const useDB = <T,>(sel: (d: DB) => T): T => useSyncExternalStore(subscribe, () => sel(db));
export const getDB = () => db;

type Coll = "products" | "orders" | "promos" | "zones" | "looks";
const withLog = (d: DB, m: string, k: Activity["k"]): DB => ({ ...d, activity: [{ t: Date.now(), m, k }, ...d.activity].slice(0, 30) });

export const actions = {
  newId: uid,
  save<K extends Coll>(key: K, item: DB[K][number], label?: string) {
    const list = db[key] as { id: string }[];
    const exists = list.some((x) => x.id === item.id);
    const next = exists ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list];
    commit(withLog({ ...db, [key]: next } as DB, `${label ?? key} ${exists ? "updated" : "created"}`, "edit"));
  },
  remove(key: Coll, id: string, label?: string) {
    commit(withLog({ ...db, [key]: (db[key] as { id: string }[]).filter((x) => x.id !== id) } as DB, `${label ?? key} deleted`, "edit"));
  },
  setStatus(id: string, status: Status) {
    commit(withLog({ ...db, orders: db.orders.map((o) => (o.id === id ? { ...o, status } : o)) }, `${id} → ${status}`, "ship"));
  },
  setSettings(s: Settings) {
    commit(withLog({ ...db, settings: s }, "Shipping settings updated", "edit"));
  },
  setStock(id: string, size: string, qty: number) {
    commit({ ...db, products: db.products.map((p) => (p.id === id ? { ...p, sizes: { ...p.sizes, [size]: Math.max(0, qty) } } : p)) });
  },
  nextOrderId() {
    return `VNK-${db.counter}`;
  },
  placeOrder(o: Omit<Order, "id" | "createdAt" | "status" | "note">, status: Status = "Placed"): Order {
    const order: Order = { ...o, id: `VNK-${db.counter}`, createdAt: Date.now(), status, note: "" };
    const products = db.products.map((p) => {
      const lines = o.items.filter((i) => i.name === p.name);
      if (!lines.length) return p;
      const sizes = { ...p.sizes };
      let sold = p.sold, claimed = p.claimed;
      lines.forEach((l) => { sizes[l.size] = Math.max(0, (sizes[l.size] ?? 0) - l.qty); sold += l.qty; claimed += l.qty; });
      return { ...p, sizes, sold, claimed };
    });
    const promos = o.promo ? db.promos.map((c) => (c.code === o.promo ? { ...c, used: c.used + 1 } : c)) : db.promos;
    let next: DB = withLog({ ...db, products, promos, orders: [order, ...db.orders], counter: db.counter + 1 }, `${order.id} placed, ₹${o.amount.toLocaleString("en-IN")}, ${o.pay}, ${o.city || "n/a"}`, "order");
    products.forEach((p) => {
      const before = db.products.find((x) => x.id === p.id)!;
      if (totalStock(p) === 0 && totalStock(before) > 0) next = withLog(next, `${p.name} sold out`, "alert");
    });
    commit(next);
    return order;
  },
  reset() {
    commit(seed());
  },
};

export function discountFor(code: string, subtotal: number): { promo?: Promo; amount: number; error?: string } {
  const c = db.promos.find((p) => p.code === code.trim().toUpperCase());
  if (!c) return { amount: 0, error: "Code not recognised" };
  if (!c.on) return { amount: 0, error: "Code is paused" };
  if (c.used >= c.cap) return { amount: 0, error: "Code fully redeemed" };
  const amount = c.type === "flat" ? Math.min(c.value, subtotal) : Math.round((subtotal * c.value) / 100);
  return { promo: c, amount };
}

export const compressImage = (file: File, max = 900): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const s = Math.min(1, max / Math.max(im.width, im.height));
      const c = document.createElement("canvas");
      c.width = Math.round(im.width * s);
      c.height = Math.round(im.height * s);
      c.getContext("2d")!.drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.8));
    };
    im.onerror = () => reject(new Error("Not an image"));
    im.src = url;
  });
