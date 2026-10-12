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
export const sizeKeys = (cat: string) => (cat === "caps" || cat === "acc" ? ["One size"] : cat === "tees" ? ["XS", "S", "M", "L", "XL"] : ["S", "M", "L", "XL", "XXL"]);
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
    mk("HOD-001", "VENKAYAM ONION MONOGRAM HOODIE (CHARCOAL)", "hoodies", 2999, 3999, "450 GSM TERRY", "FLAGSHIP PIECE", "2e222.png", { S: 6, M: 9, L: 11, XL: 3, XXL: 0 }, 188, 8, 112, { onion: true }),
    mk("CAP-002", "VENKAYAM STREETWEAR 5-PANEL CAP", "caps", 999, 1499, "COTTON CANVAS", "HEADWEAR SPEC", "83098.png", { "One size": 64 }, 402, 20, 120),
    mk("TOT-003", "HEAVYWEIGHT CANVAS ONION TOTE BAG", "acc", 799, 1199, "16 OZ DUCK CANVAS", "DAILY CARRY", "62447.png", { "One size": 15 }, 276, 20, 88, { emblem: "f6362.png" }),
    mk("GEN-001", "FREAK MODE", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/01.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 37, 8, 13, { description: "Playful streetwear energy with a bold character graphic. Made for the ones who keep their own vibe.", drop: true }),
    mk("GEN-002", "LOWKEY DRIP", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/02.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 74, 8, 26, { description: "Minimal effort, maximum drip. A clean vintage-wash look for everyday Gen-Z street style.", drop: true }),
    mk("GEN-003", "SPIDEY STATE", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/03.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 21, 8, 39, { description: "Your Spidey mood, upgraded. A bold graphic tee built for superhero fans and streetwear fits.", drop: true }),
    mk("GEN-004", "MUTANT ENERGY", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/04.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 58, 8, 12, { description: "Raw mutant energy with a powerful graphic aesthetic. Stand out without trying too hard.", drop: true }),
    mk("GEN-005", "SUPERHUMAN", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/05.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 5, 8, 25, { description: "Hero energy, clean graphic. A statement piece for anyone who likes their style bold and iconic.", drop: false }),
    mk("GEN-006", "DARK SIGNAL", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/06.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 42, 8, 38, { description: "Dark, mysterious and graphic-heavy. Built for late-night fits and a strong streetwear mood.", drop: false }),
    mk("GEN-007", "SPIDERVERSE", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/07.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 79, 8, 11, { description: "Enter the web era. A statement Spider-inspired design made to bring comic energy into everyday fits.", drop: false }),
    mk("GEN-008", "NO LIMITS", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/08.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 26, 8, 24, { description: "No Limits, just your vibe. A bold statement tee for independent minds who do things their own way.", drop: false }),
    mk("GEN-009", "WEIRD FLEX", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/09.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 63, 8, 37, { description: "Weird is the flex. Colorful oversized typography for anyone who proudly owns their individuality.", drop: false }),
    mk("GEN-010", "RISK TAKER", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/10.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 10, 8, 10, { description: "Take the chance. A dice-inspired statement tee with a fearless, risk-taking attitude.", drop: false }),
    mk("GEN-011", "ALIENATED", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/11.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 47, 8, 23, { description: "Out-of-this-world energy. A futuristic alien graphic for a playful, unconventional streetwear look.", drop: false }),
    mk("GEN-012", "AURA MODE", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/12.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 84, 8, 36, { description: "Turn your aura on. Fiery graphic energy designed to make a simple fit feel instantly louder.", drop: false }),
    mk("GEN-013", "CEO ENERGY", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/13.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 31, 8, 9, { description: "CEO Energy only. A confident statement graphic for creators, dreamers and future bosses.", drop: false }),
    mk("GEN-014", "DISCIPLINE", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/14.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 68, 8, 22, { description: "Discipline over everything. A dark Batman-inspired statement piece built around focus and mindset.", drop: false }),
    mk("GEN-015", "FUNK MODE", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/15.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 15, 8, 35, { description: "Funk Mode activated. Bright, playful typography with an easy-going Gen-Z attitude.", drop: false }),
    mk("GEN-016", "VEL VIBE", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/16.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 52, 8, 8, { description: "Desi energy with a modern streetwear edge. A bold Muruga-inspired graphic with cultural character.", drop: false }),
    mk("GEN-017", "KALI ENERGY", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/17.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 89, 8, 21, { description: "Raw folk energy. A striking traditional-mask inspired graphic designed to make your fit unforgettable.", drop: false }),
    mk("GEN-018", "DARK KNIGHT", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/18.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 36, 8, 34, { description: "Dark Knight energy in a clean vintage wash. Minimal from the front, powerful graphic presence.", drop: false }),
    mk("GEN-019", "WEB MODE", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/19.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 73, 8, 7, { description: "Web Mode on. A Spider-inspired front-and-back design made for statement streetwear fits.", drop: false }),
    mk("GEN-020", "BAT SIGNAL", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/20.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 20, 8, 20, { description: "Classic bat energy, modern wash. A minimal emblem tee that works with almost any casual fit.", drop: false }),
    mk("GEN-021", "ROLL THE DICE", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/21.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 57, 8, 33, { description: "Life is a roll of the dice. A playful graphic tee for risk-takers and spontaneous vibes.", drop: false }),
    mk("GEN-022", "HERO MODE", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/22.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 4, 8, 6, { description: "Hero Mode activated. A clean comic-inspired face graphic for a simple but standout look.", drop: false }),
    mk("GEN-023", "DUALITY", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/23.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 41, 8, 19, { description: "Two sides, one vibe. A split graphic design with a cinematic, collage-inspired aesthetic.", drop: false }),
    mk("GEN-024", "DUDE ERA", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/24.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 78, 8, 32, { description: "Dude Era unlocked. A bold retro badge for relaxed fits, college days and everyday streetwear.", drop: false }),
    mk("GEN-025", "FUNK RELOADED", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/25.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 25, 8, 5, { description: "Funk Reloaded. A louder red-wash version of the playful Oh Funk statement graphic.", drop: false }),
    mk("GEN-026", "BAT ATTACK", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/26.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 62, 8, 18, { description: "Bat Attack. A dramatic Batman-inspired graphic built to give your outfit a darker edge.", drop: false }),
    mk("GEN-027", "SAVAGE KNIGHT", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/27.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 9, 8, 31, { description: "Savage Knight energy. A roaring Batman-inspired graphic for bold, aggressive streetwear styling.", drop: false }),
    mk("GEN-028", "DUDE DRIP", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/28.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 46, 8, 4, { description: "Dude Drip. A purple-and-yellow retro badge that keeps the look fun, simple and confident.", drop: false }),
    mk("GEN-029", "VENOMOUS", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/29.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 83, 8, 17, { description: "Venomous attitude. A dramatic creature graphic for a darker, more rebellious streetwear vibe.", drop: false }),
    mk("GEN-030", "SHARK MODE", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/30.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 30, 8, 30, { description: "Shark Mode. Playful chaos meets streetwear with a bold cartoon shark graphic.", drop: false }),
    mk("GEN-031", "PARIS NIGHTS", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/31.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 67, 8, 3, { description: "Paris Nights. Vintage city energy with iconic Paris-inspired typography and skyline artwork.", drop: false }),
    mk("GEN-032", "INTROVERT ERA", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/32.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 14, 8, 16, { description: "Introvert Era. For the ones who enjoy their own space and still know how to style it.", drop: false }),
    mk("GEN-033", "VENKAYAM CORE", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/33.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 51, 8, 29, { description: "Venkayam Core. A signature graphic concept with bold stacked typography and a distinctive identity.", drop: false }),
    mk("GEN-034", "EARTH TONE", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/34.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 88, 8, 2, { description: "Earth Tone. A clean brown vintage-wash essential for understated, relaxed everyday fits.", drop: false }),
    mk("GEN-035", "POWER MODE", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/35.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 35, 8, 15, { description: "Power Mode. Gym mindset meets streetwear with a bold workout statement graphic.", drop: false }),
    mk("GEN-036", "THE GUARDIAN", "tees", 1299, 1799, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/36.jpg", { XS: 12, S: 20, M: 26, L: 22, XL: 14 }, 72, 8, 28, { description: "The Guardian. A dramatic traditional-mask inspired back graphic with strong visual presence.", drop: false }),
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

const KEY = "venkayam-db-v2";
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
