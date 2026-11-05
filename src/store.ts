import { useSyncExternalStore } from "react";
import { getSupabase } from "./lib/supabase";

export type Product = {
  id: string; sku: string; name: string; cat: string; price: number; was: number;
  tag: string; badge: string; img: string; gallery?: string[]; emblem?: string; onion?: boolean; description?: string;
  sizes: Record<string, number>; sold: number; threshold: number; active: boolean; drop: boolean; claimed: number;
};
export type Status = "Placed" | "Printing" | "Packed" | "Shipped" | "Delivered" | "Returned";
export const FLOW: Status[] = ["Placed", "Printing", "Packed", "Shipped", "Delivered"];
export type OrderItem = { name: string; size: string; qty: number; price: number };
export type Order = {
  id: string; customer: string; phone: string; city: string; address: string; items: OrderItem[];
  amount: number; pay: "UPI" | "Card"; status: Status; createdAt: number; note: string; promo?: string; track?: string; deliveredAt?: number;
};
export type Promo = { id: string; code: string; desc: string; type: "flat" | "percent"; value: number; used: number; cap: number; on: boolean };
export type Zone = { id: string; name: string; days: string; fee: number; freeAbove: number };
export type Look = { id: string; img: string; label: string; title: string; shape: "tall" | "wide" };
export type Settings = { freeShip: number; shipFee: number };
export type Activity = { t: number; m: string; k: "order" | "alert" | "ship" | "edit" };
export type RStatus = "Requested" | "Approved" | "Pickup scheduled" | "Picked up" | "Received" | "Resolved" | "Rejected";
export const RFLOW: RStatus[] = ["Requested", "Approved", "Pickup scheduled", "Picked up", "Received", "Resolved"];
export const RETURN_DAYS = 7;
export const rLabel = (s: RStatus, type: "Return" | "Exchange") => (s === "Resolved" ? (type === "Return" ? "Refunded" : "Replacement shipped") : s);
export const RNOTES: Record<RStatus, string> = {
  Requested: "Request received, our team is reviewing it",
  Approved: "Approved. A pickup will be scheduled",
  "Pickup scheduled": "Courier pickup booked from your address",
  "Picked up": "Courier has collected the piece",
  Received: "Piece reached our New Delhi studio and passed inspection",
  Resolved: "Closed",
  Rejected: "Request could not be accepted",
};
export type ReturnReq = {
  id: string; orderId: string; track: string; customer: string; phone: string; address: string;
  type: "Return" | "Exchange"; item: OrderItem; newSize?: string; reason: string; comment: string;
  status: RStatus; createdAt: number; history: { t: number; s: RStatus; note?: string }[];
  courier: string; refund: number; note: string;
};
export type DB = {
  returns?: ReturnReq[];
  products: Product[];
  orders: Order[];
  promos: Promo[];
  zones: Zone[];
  looks: Look[];
  settings: Settings;
  activity: Activity[];
  counter: number;
  storefront?: StorefrontConfig;
};

export type HeroCard = {
  productId?: string;
  productName: string;
  tag?: string;
  title?: string;
  subtitle?: string;
  heading?: string;
  sticker?: string;
  price?: number;
  badge: string;
  img: string;
  customImg?: string;
  badgeNote?: string;
};

export type CategoryThumb = {
  cat: string;
  n: string;
  t: string[];
  img: string;
};

export type DropThumb = {
  id: string;
  name: string;
  title: string;
  status: string;
  img: string;
};

export type AboutPoster = {
  img: string;
  tag: string;
  heading?: string;
  quote: string;
  subtext: string;
};

export type StorefrontConfig = {
  hero1: HeroCard;
  hero2: HeroCard;
  categories: CategoryThumb[];
  pastDrops: DropThumb[];
  aboutPoster: AboutPoster;
};

export const DEFAULT_STOREFRONT: StorefrontConfig = {
  hero1: {
    productName: "THE GUARDIAN",
    tag: "HERO ARCHIVE // DROP 04",
    title: "The Guardian",
    subtitle: "Series 004 // Hero spec",
    heading: "Series 004 // Hero spec",
    sticker: "Staff pick",
    price: 1499,
    badge: "Staff pick",
    img: "/products/36.jpg",
    badgeNote: "ORIGINAL ARCHIVE",
  },
  hero2: {
    productName: "DISCIPLINE",
    tag: "DARK VINTAGE WASH",
    title: "The Discipline",
    subtitle: "Series 004 // Hero spec",
    heading: "Series 004 // Hero spec",
    sticker: "Hot right now",
    price: 1499,
    badge: "Hot right now",
    img: "/products/14.jpg",
    badgeNote: "100% Sri Lankan cotton\nMade in India",
  },
  categories: [
    { n: "01 // HEAVY DROP", t: ["T-", "SHIRTS"], img: "/products/01.jpg", cat: "tees" },
    { n: "02 // HEAVY TERRY", t: ["HOODIES"], img: "ce1cd.png", cat: "hoodies" },
    { n: "03 // SNAPBACKS & 5-PANELS", t: ["CAPS"], img: "37da8.png", cat: "caps" },
    { n: "04 // RAW MERCH", t: ["TOTES"], img: "237a4.png", cat: "acc" },
  ],
  pastDrops: [
    { id: "drop-03", name: "Drop 03", title: "Temple Run", status: "SOLD OUT IN 41 MIN", img: "f1497.png" },
    { id: "drop-02", name: "Drop 02", title: "Hoarding", status: "SOLD OUT IN 3 HRS", img: "9bdff.png" },
    { id: "drop-01", name: "Drop 01", title: "Zero", status: "SOLD OUT IN 1 DAY", img: "83098.png" },
  ],
  aboutPoster: {
    img: "de740.png",
    tag: "Madras archive // Dispatch 004",
    quote: '"We wear our roots like armor."',
    subtext: "No fast fashion. No plastic blends. Pure heavy Sri Lankan cotton, made in India.",
  },
};

const STOREFRONT_KEY = "venkayam-storefront-v2";
export function loadStorefront(): StorefrontConfig {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STOREFRONT_KEY) : null;
    if (raw) return { ...DEFAULT_STOREFRONT, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_STOREFRONT;
}

export function saveStorefront(cfg: StorefrontConfig) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STOREFRONT_KEY, JSON.stringify(cfg));
    }
  } catch {}
}

export const CATS: [string, string][] = [["tees", "Tees"], ["hoodies", "Hoodies"], ["caps", "Caps"], ["acc", "Accessories"]];
export const catLabel = (c: string) => CATS.find(([k]) => k === c)?.[1] ?? c;
export const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export const sizeOrder = (a: string, b: string) => {
  const iA = STANDARD_SIZES.indexOf(a as any);
  const iB = STANDARD_SIZES.indexOf(b as any);
  if (iA !== -1 && iB !== -1) return iA - iB;
  if (iA !== -1) return -1;
  if (iB !== -1) return 1;
  return a.localeCompare(b);
};
export const sortSizes = <T extends [string, ...any[]] | string>(list: T[]): T[] =>
  [...list].sort((a, b) => {
    const keyA = typeof a === "string" ? a : a[0];
    const keyB = typeof b === "string" ? b : b[0];
    return sizeOrder(keyA, keyB);
  });
export const sizeKeys = (cat: string) =>
  cat === "caps" || cat === "acc" ? ["One size"] : ["XS", "S", "M", "L", "XL", "XXL"];
export const IMAGES = ["f1497.png", "2e222.png", "9bdff.png", "79b1c.png", "83098.png", "62447.png", "99450.png", "ce1cd.png", "37da8.png", "237a4.png"];
export const imgSrc = (i: string) => (/^(https?:|data:|\/)/.test(i) ? i : `/assets/${i}`);
// Built-in artwork is shown in black and white; uploaded photos and catalogue shots keep their colour.
export const isMono = (i: string) => !/^(data:|idb:|https?:|\/products\/)/.test(i);
export const totalStock = (p: Product) => Object.values(p.sizes).reduce((a, b) => a + b, 0);
export const offLabel = (p: Product) => (p.was > p.price ? `${Math.round(((p.was - p.price) / p.was) * 100)}% OFF` : "");
export const stockLabel = (p: Product) => {
  const t = totalStock(p);
  if (p.price === 0) return "COMING SOON";
  return t === 0 ? "SOLD OUT" : t <= 30 ? `LIMITED [${t} PCS]` : "IN STOCK";
};
export const newTrackCode = (taken: string[] = []) => {
  let c = "";
  do { c = Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase(); } while (taken.includes(c));
  return c;
};
export const returnEligibility = (o: Order, item: OrderItem, returns: ReturnReq[] = []): string => {
  if (o.status !== "Delivered") return o.status === "Returned" ? "This order was already returned." : "Returns open once the order is delivered.";
  const days = (Date.now() - (o.deliveredAt ?? o.createdAt)) / 864e5;
  if (days > RETURN_DAYS) return `The ${RETURN_DAYS} day window has closed.`;
  if (returns.some((r) => r.orderId === o.id && r.item.name === item.name && r.item.size === item.size && r.status !== "Rejected")) return "A request is already open for this piece.";
  return "";
};
export const exchangeOnly = (item: OrderItem): boolean => {
  const p = getDB().products.find((x) => x.name === item.name);
  return !!p && (p.drop || p.was > p.price);
};
export const NO_RETURNS: ReturnReq[] = [];
export const STUDIO = {
  city: "New Delhi",
  lines: ["Nearby Khan Dairy, Block 21", "Mayur Vihar Phase I, Kalyan Puri", "New Delhi, Delhi 110091"],
  plusCode: "J886+9PX",
};
export const studioOneLine = `${STUDIO.lines.join(", ")} (${STUDIO.plusCode})`;
export const itemsText = (o: Order) => o.items.map((i) => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ""} (${i.size})`).join(", ");

const uid = (p: string) => p + Math.random().toString(36).slice(2, 9);

function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

const mk = (sku: string, name: string, cat: string, price: number, was: number, tag: string, badge: string, img: string, sizes: Record<string, number>, sold: number, threshold: number, claimed: number, extra: Partial<Product> = {}): Product =>
  ({ id: uid("p"), sku, name, cat, price, was, tag, badge, img, sizes, sold, threshold, active: true, drop: true, claimed, ...extra });

export function seed(): DB {
  const products: Product[] = [
    mk("GEN-001", "FREAK MODE", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/01.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Playful streetwear energy with a bold character graphic. Made for the ones who keep their own vibe.", drop: true }),
    mk("GEN-002", "LOWKEY DRIP", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/02.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Minimal effort, maximum drip. A clean vintage-wash look for everyday Gen-Z street style.", drop: true }),
    mk("GEN-003", "SPIDEY STATE", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/03.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Your Spidey mood, upgraded. A bold graphic tee built for superhero fans and streetwear fits.", drop: true }),
    mk("GEN-004", "MUTANT ENERGY", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/04.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Raw mutant energy with a powerful graphic aesthetic. Stand out without trying too hard.", drop: true }),
    mk("GEN-005", "SUPERHUMAN", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/05.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Hero energy, clean graphic. A statement piece for anyone who likes their style bold and iconic.", drop: false }),
    mk("GEN-006", "DARK SIGNAL", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/06.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Dark, mysterious and graphic-heavy. Built for late-night fits and a strong streetwear mood.", drop: false }),
    mk("GEN-007", "SPIDERVERSE", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/07.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Enter the web era. A statement Spider-inspired design made to bring comic energy into everyday fits.", drop: false }),
    mk("GEN-008", "NO LIMITS", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/08.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "No Limits, just your vibe. A bold statement tee for independent minds who do things their own way.", drop: false }),
    mk("GEN-009", "WEIRD FLEX", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/09.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Weird is the flex. Colorful oversized typography for anyone who proudly owns their individuality.", drop: false }),
    mk("GEN-010", "RISK TAKER", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/10.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Take the chance. A dice-inspired statement tee with a fearless, risk-taking attitude.", drop: false }),
    mk("GEN-011", "ALIENATED", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/11.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Out-of-this-world energy. A futuristic alien graphic for a playful, unconventional streetwear look.", drop: false }),
    mk("GEN-012", "AURA MODE", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/12.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Turn your aura on. Fiery graphic energy designed to make a simple fit feel instantly louder.", drop: false }),
    mk("GEN-013", "CEO ENERGY", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/13.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "CEO Energy only. A confident statement graphic for creators, dreamers and future bosses.", drop: false }),
    mk("GEN-014", "DISCIPLINE", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/14.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Discipline over everything. A dark Batman-inspired statement piece built around focus and mindset.", drop: false }),
    mk("GEN-015", "FUNK MODE", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/15.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Funk Mode activated. Bright, playful typography with an easy-going Gen-Z attitude.", drop: false }),
    mk("GEN-016", "VEL VIBE", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/16.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Desi energy with a modern streetwear edge. A bold Muruga-inspired graphic with cultural character.", drop: false }),
    mk("GEN-017", "KALI ENERGY", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/17.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Raw folk energy. A striking traditional-mask inspired graphic designed to make your fit unforgettable.", drop: false }),
    mk("GEN-018", "DARK KNIGHT", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/18.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Dark Knight energy in a clean vintage wash. Minimal from the front, powerful graphic presence.", drop: false }),
    mk("GEN-019", "WEB MODE", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/19.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Web Mode on. A Spider-inspired front-and-back design made for statement streetwear fits.", drop: false }),
    mk("GEN-020", "BAT SIGNAL", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/20.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Classic bat energy, modern wash. A minimal emblem tee that works with almost any casual fit.", drop: false }),
    mk("GEN-021", "ROLL THE DICE", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/21.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Life is a roll of the dice. A playful graphic tee for risk-takers and spontaneous vibes.", drop: false }),
    mk("GEN-022", "HERO MODE", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/22.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Hero Mode activated. A clean comic-inspired face graphic for a simple but standout look.", drop: false }),
    mk("GEN-023", "DUALITY", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/23.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Two sides, one vibe. A split graphic design with a cinematic, collage-inspired aesthetic.", drop: false }),
    mk("GEN-024", "DUDE ERA", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/24.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Dude Era unlocked. A bold retro badge for relaxed fits, college days and everyday streetwear.", drop: false }),
    mk("GEN-025", "FUNK RELOADED", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/25.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Funk Reloaded. A louder red-wash version of the playful Oh Funk statement graphic.", drop: false }),
    mk("GEN-026", "BAT ATTACK", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/26.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Bat Attack. A dramatic Batman-inspired graphic built to give your outfit a darker edge.", drop: false }),
    mk("GEN-027", "SAVAGE KNIGHT", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/27.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Savage Knight energy. A roaring Batman-inspired graphic for bold, aggressive streetwear styling.", drop: false }),
    mk("GEN-028", "DUDE DRIP", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/28.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Dude Drip. A purple-and-yellow retro badge that keeps the look fun, simple and confident.", drop: false }),
    mk("GEN-029", "VENOMOUS", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/29.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Venomous attitude. A dramatic creature graphic for a darker, more rebellious streetwear vibe.", drop: false }),
    mk("GEN-030", "SHARK MODE", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/30.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Shark Mode. Playful chaos meets streetwear with a bold cartoon shark graphic.", drop: false }),
    mk("GEN-031", "PARIS NIGHTS", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/31.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Paris Nights. Vintage city energy with iconic Paris-inspired typography and skyline artwork.", drop: false }),
    mk("GEN-032", "INTROVERT ERA", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/32.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Introvert Era. For the ones who enjoy their own space and still know how to style it.", drop: false }),
    mk("GEN-033", "VENKAYAM CORE", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/33.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Venkayam Core. A signature graphic concept with bold stacked typography and a distinctive identity.", drop: false }),
    mk("GEN-034", "EARTH TONE", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/34.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Earth Tone. A clean brown vintage-wash essential for understated, relaxed everyday fits.", drop: false }),
    mk("GEN-035", "POWER MODE", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/35.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "Power Mode. Gym mindset meets streetwear with a bold workout statement graphic.", drop: false }),
    mk("GEN-036", "THE GUARDIAN", "tees", 0, 0, "VINTAGE WASH", "GEN-Z COLLECTION", "/products/36.jpg", { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }, 0, 8, 0, { description: "The Guardian. A dramatic traditional-mask inspired back graphic with strong visual presence.", drop: false }),
  ];
  const r = rng(42);
  const names = ["Arjun K.", "Meenakshi R.", "Karthik S.", "Divya P.", "Vignesh M.", "Priya N.", "Surya T.", "Anitha L.", "Rahul B.", "Harini V.", "Dinesh C.", "Lakshmi G."];
  const cities = ["Chennai", "Coimbatore", "Madurai", "Bengaluru", "Mumbai", "Hyderabad", "Delhi", "Pune", "Kochi"];
  const sts: Status[] = ["Placed", "Placed", "Printing", "Printing", "Packed", "Shipped", "Shipped", "Delivered", "Delivered", "Delivered", "Returned"];
  const now = Date.now();
  const orders: Order[] = Array.from({ length: 0 }, (_, i) => {
    const p = products[Math.floor(r() * products.length)];
    const sk = Object.keys(p.sizes);
    const qty = 1 + Math.floor(r() * 2);
    const ci = Math.floor(r() * names.length);
    return {
      id: `VNK-${2480 - i}`, customer: names[ci], phone: `98765${String(10000 + ci * 731 + i).slice(-5)}`, city: cities[Math.floor(r() * cities.length)], address: "Sample address, street 12",
      items: [{ name: p.name, size: sk[Math.floor(r() * sk.length)], qty, price: p.price }], amount: p.price * qty,
      pay: (["UPI", "Card"] as const)[Math.floor(r() * 2)], status: sts[Math.floor(r() * sts.length)],
      createdAt: now - (i * 31 + 2) * 36e5, note: "",
    };
  });
  return {
    products, orders, counter: 1, returns: [],
    promos: [],
    zones: [
      { id: uid("z"), name: "Delhi NCR", days: "1-2 days", fee: 49, freeAbove: 999 },
      { id: uid("z"), name: "Tamil Nadu, Kerala, Karnataka", days: "2-4 days", fee: 79, freeAbove: 999 },
      { id: uid("z"), name: "Maharashtra, Telangana, Haryana", days: "3-5 days", fee: 79, freeAbove: 999 },
      { id: uid("z"), name: "Rest of India", days: "5-8 days", fee: 99, freeAbove: 999 },
      { id: uid("z"), name: "North-East & J&K", days: "7-10 days", fee: 149, freeAbove: 1999 },
    ],
    looks: [],
    settings: { freeShip: 999, shipFee: 79 },
    activity: [],
  };
}

/* =====================================================================================
   Supabase-backed store. Public visitors load products/zones/looks/settings (RLS: read only).
   Signed-in admins also load orders, returns, promos and activity (RLS: admin only).
   Customers never read orders directly: they use the SECURITY DEFINER RPCs (place_order, track_order, ...).
   ===================================================================================== */
const sb = getSupabase();
const LEGACY_KEY = "venkayam-db-v4";

let db: DB = { products: [], orders: [], promos: [], zones: [], looks: [], returns: [], settings: { freeShip: 999, shipFee: 79 }, activity: [], counter: 1, storefront: loadStorefront() };
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const commit = (next: DB) => { db = next; emit(); };
const subscribe = (f: () => void) => { subs.add(f); return () => void subs.delete(f); };
export const useDB = <T,>(sel: (d: DB) => T): T => useSyncExternalStore(subscribe, () => sel(db));
export const getDB = () => db;

type Sync = { ready: boolean; error: string; admin: boolean };
let sync: Sync = { ready: false, error: "", admin: false };
const setSync = (p: Partial<Sync>) => { sync = { ...sync, ...p }; emit(); };
export const useSync = () => useSyncExternalStore(subscribe, () => sync);

/* ---------- Row mapping ---------- */
type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const ms = (v: unknown) => (v ? new Date(v as string).getTime() : undefined);
const iso = (v?: number) => (v ? new Date(v).toISOString() : null);
const fromProduct = (r: Row): Product => {
  const rawSizes: Record<string, number> = r.sizes ?? {};
  const expected = sizeKeys(r.cat);
  const sizes: Record<string, number> = {};
  for (const k of expected) {
    sizes[k] = rawSizes[k] !== undefined ? Number(rawSizes[k]) : (rawSizes["XL"] !== undefined ? Number(rawSizes["XL"]) : 10);
  }
  for (const k of sortSizes(Object.keys(rawSizes))) {
    if (!(k in sizes)) sizes[k] = Number(rawSizes[k]);
  }
  return { id: r.id, sku: r.sku, name: r.name, cat: r.cat, price: r.price, was: r.was, tag: r.tag, badge: r.badge, img: r.img, gallery: r.gallery ?? undefined, emblem: r.emblem ?? undefined, onion: r.onion ?? undefined, description: r.description ?? undefined, sizes, sold: r.sold, threshold: r.threshold, active: r.active, drop: r.is_drop, claimed: r.claimed };
};
const toProduct = (p: Product): Row => ({ id: p.id, sku: p.sku, name: p.name, cat: p.cat, price: p.price, was: p.was, tag: p.tag, badge: p.badge, img: p.img, gallery: p.gallery ?? null, emblem: p.emblem ?? null, onion: p.onion ?? null, description: p.description ?? null, sizes: p.sizes, sold: p.sold, threshold: p.threshold, active: p.active, is_drop: p.drop, claimed: p.claimed });
const fromOrder = (r: Row): Order => ({ id: r.id, customer: r.customer, phone: r.phone, city: r.city, address: r.address, items: r.items, amount: r.amount, pay: r.pay, status: r.status, createdAt: ms(r.created_at)!, note: r.note, promo: r.promo ?? undefined, track: r.track, deliveredAt: ms(r.delivered_at) });
const toOrder = (o: Order): Row => ({ id: o.id, customer: o.customer, phone: o.phone, city: o.city, address: o.address, items: o.items, amount: o.amount, pay: o.pay, status: o.status, created_at: iso(o.createdAt), note: o.note, promo: o.promo ?? null, track: o.track || newTrackCode(), delivered_at: iso(o.deliveredAt) });
const fromPromo = (r: Row): Promo => ({ id: r.id, code: r.code, desc: r.descr, type: r.type, value: r.value, used: r.used, cap: r.cap, on: r.active });
const toPromo = (p: Promo): Row => ({ id: p.id, code: p.code, descr: p.desc, type: p.type, value: p.value, used: p.used, cap: p.cap, active: p.on });
const fromZone = (r: Row): Zone => ({ id: r.id, name: r.name, days: r.days, fee: r.fee, freeAbove: r.free_above });
const toZone = (z: Zone): Row => ({ id: z.id, name: z.name, days: z.days, fee: z.fee, free_above: z.freeAbove });
const fromLook = (r: Row): Look => ({ id: r.id, img: r.img, label: r.label, title: r.title, shape: r.shape });
const toLook = (l: Look): Row => ({ ...l });
const fromReturn = (r: Row): ReturnReq => ({ id: r.id, orderId: r.order_id, track: r.track, customer: r.customer, phone: r.phone, address: r.address, type: r.type, item: r.item, newSize: r.new_size ?? undefined, reason: r.reason, comment: r.comment, status: r.status, createdAt: ms(r.created_at)!, history: r.history ?? [], courier: r.courier, refund: r.refund, note: r.note });
const toReturn = (r: ReturnReq): Row => ({ id: r.id, order_id: r.orderId, track: r.track, customer: r.customer, phone: r.phone, address: r.address, type: r.type, item: r.item, new_size: r.newSize ?? null, reason: r.reason, comment: r.comment, status: r.status, created_at: iso(r.createdAt), history: r.history, courier: r.courier, refund: r.refund, note: r.note });
const TABLE_MAP = { products: ["products", toProduct], orders: ["orders", toOrder], promos: ["promos", toPromo], zones: ["zones", toZone], looks: ["looks", toLook] } as const;

/* ---------- Loading ---------- */
const check = <T,>(r: { data: T | null; error: { message: string } | null }): T => { if (r.error) throw new Error(r.error.message); return (r.data ?? []) as T; };
let loading: Promise<void> | null = null;

async function loadPublic() {
  const [p, z, l, s] = await Promise.all([
    sb.from("products").select("*").order("sort"),
    sb.from("zones").select("*").order("sort"),
    sb.from("looks").select("*").order("sort"),
    sb.from("settings").select("*").eq("id", 1).maybeSingle(),
  ]);
  const settings = s.data ? { freeShip: s.data.free_ship, shipFee: s.data.ship_fee } : db.settings;
  commit({
    ...db,
    products: check<Row[]>(p).map(fromProduct),
    zones: check<Row[]>(z).map(fromZone),
    looks: check<Row[]>(l).map(fromLook),
    settings,
  });
}
async function loadAdminData() {
  const [o, r, c, a] = await Promise.all([
    sb.from("orders").select("*").order("created_at", { ascending: false }), sb.from("returns").select("*").order("created_at", { ascending: false }),
    sb.from("promos").select("*").order("code"), sb.from("activity").select("*").order("id", { ascending: false }).limit(30),
  ]);
  const orders = check<Row[]>(o).map(fromOrder);
  commit({
    ...db, orders, returns: check<Row[]>(r).map(fromReturn), promos: check<Row[]>(c).map(fromPromo),
    activity: check<Row[]>(a).map((x) => ({ t: Number(x.t), m: x.m, k: x.k })),
    counter: orders.reduce((m, x) => Math.max(m, Number(x.id.slice(4)) || 0), 1000) + 1,
  });
}
/** Reloads everything the current session may see. Concurrent calls share one request. */
export function refresh(): Promise<void> {
  if (!loading) {
    loading = (async () => {
      try {
        await loadPublic();
        if (sync.admin) await loadAdminData();
        setSync({ ready: true, error: "" });
      } catch (e) { setSync({ ready: true, error: (e as Error).message || "Could not reach the store database" }); }
    })().finally(() => { loading = null; });
  }
  return loading;
}
/** Called by the admin screen once the signed-in admin is confirmed. */
export async function loadAdmin() { sync = { ...sync, admin: true }; await refresh(); }

export async function initStore(): Promise<void> {
  sb.auth.onAuthStateChange((ev) => {
    if (ev === "SIGNED_OUT") { sync = { ...sync, admin: false }; commit({ ...db, orders: [], returns: [], promos: [], activity: [] }); refresh(); }
  });
  const first = refresh();
  if (typeof window !== "undefined") {
    window.addEventListener("focus", () => void refresh());
    window.setInterval(() => { if (!document.hidden) void refresh(); }, sync.admin ? 30000 : 60000);
  }
  await first;
}

/* ---------- Writes ---------- */
const errText = (m: string) => {
  const t = m.match(/(EMPTY_CART|BAD_QUANTITY|BAD_PROMO|BAD_CUSTOMER|ORDER_NOT_FOUND|NOT_DELIVERED|WINDOW_CLOSED|ITEM_NOT_IN_ORDER|ALREADY_REQUESTED|SIZE_UNAVAILABLE|BAD_TYPE|FORBIDDEN|UNAVAILABLE: .+|OUT_OF_STOCK: .+)/)?.[1] ?? m;
  if (t.startsWith("OUT_OF_STOCK")) return `Sorry, ${t.slice(14)} just sold out. Update your cart.`;
  if (t.startsWith("UNAVAILABLE")) return `${t.slice(13)} is no longer available.`;
  return ({ EMPTY_CART: "Your cart is empty.", BAD_QUANTITY: "Invalid quantity.", BAD_PROMO: "That promo code is no longer valid.", BAD_CUSTOMER: "Enter the customer name.", ORDER_NOT_FOUND: "No order found for that tracking code and phone number.", NOT_DELIVERED: "Returns open once the order is delivered.", WINDOW_CLOSED: `The ${RETURN_DAYS} day window has closed.`, ITEM_NOT_IN_ORDER: "That piece is not in the order.", ALREADY_REQUESTED: "A request is already open for this piece.", SIZE_UNAVAILABLE: "That size is not available.", BAD_TYPE: "Invalid request type.", FORBIDDEN: "You are not allowed to do that." } as Record<string, string>)[t] ?? t;
};
let lastAlert = 0;
const exec = (what: string, p: PromiseLike<{ error: { message: string } | null }>) =>
  Promise.resolve(p).then(({ error }) => {
    if (!error) return;
    console.error(what, error.message);
    if (Date.now() - lastAlert > 3000) { lastAlert = Date.now(); window.alert(`Could not save (${what}): ${errText(error.message)}. The latest data has been reloaded.`); }
    void refresh();
  });
const logRow = (m: string, k: Activity["k"]) => { const t = Date.now(); void exec("activity", sb.from("activity").insert({ t, m, k })); return { t, m, k } as Activity; };
const withLog = (d: DB, m: string, k: Activity["k"]): DB => ({ ...d, activity: [logRow(m, k), ...d.activity].slice(0, 30) });
const rpc = async <T,>(fn: string, args: Record<string, unknown>): Promise<T> => {
  const { data, error } = await sb.rpc(fn, args);
  if (error) throw new Error(errText(error.message));
  return data as T;
};

type Coll = keyof typeof TABLE_MAP;
export type Quote = { items: OrderItem[]; subtotal: number; discount: number; shipping: number; total: number };
export type PromoInfo = { code: string; type: "flat" | "percent"; value: number };

export const actions = {
  newId: uid,
  save<K extends Coll>(key: K, item: DB[K][number], label?: string) {
    const list = db[key] as { id: string }[];
    const exists = list.some((x) => x.id === item.id);
    const [table, map] = TABLE_MAP[key] as unknown as [string, (i: unknown) => Row];
    commit(withLog({ ...db, [key]: exists ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list] } as DB, `${label ?? key} ${exists ? "updated" : "created"}`, "edit"));
    void exec(`${label ?? key}`, sb.from(table).upsert(map(item), { onConflict: "id" }));
  },
  patchProduct(id: string, patch: Partial<Pick<Product, "active">>) {
    commit({ ...db, products: db.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
    void exec("product", sb.from("products").update(patch).eq("id", id));
  },
  remove(key: Coll, id: string, label?: string) {
    commit(withLog({ ...db, [key]: (db[key] as { id: string }[]).filter((x) => x.id !== id) } as DB, `${label ?? key} deleted`, "edit"));
    void exec(`delete ${label ?? key}`, sb.from(TABLE_MAP[key][0]).delete().eq("id", id));
  },
  setStatus(id: string, status: Status) {
    const deliveredAt = status === "Delivered" ? Date.now() : db.orders.find((o) => o.id === id)?.deliveredAt;
    commit(withLog({ ...db, orders: db.orders.map((o) => (o.id === id ? { ...o, status, deliveredAt } : o)) }, `${id} → ${status}`, "ship"));
    void exec("order status", sb.from("orders").update({ status, delivered_at: iso(deliveredAt) }).eq("id", id));
  },
  setSettings(s: Settings) {
    commit(withLog({ ...db, settings: s }, "Shipping settings updated", "edit"));
    void exec("settings", sb.from("settings").update({ free_ship: s.freeShip, ship_fee: s.shipFee }).eq("id", 1));
  },
  updateStorefront(patch: Partial<StorefrontConfig>) {
    const next = { ...(db.storefront ?? DEFAULT_STOREFRONT), ...patch };
    saveStorefront(next);
    commit(withLog({ ...db, storefront: next }, "Storefront visuals updated", "edit"));
  },
  setStock(id: string, size: string, qty: number) {
    const v = Math.max(0, qty);
    commit({ ...db, products: db.products.map((p) => (p.id === id ? { ...p, sizes: { ...p.sizes, [size]: v } } : p)) });
    void exec("stock", sb.rpc("stock_change", { p_id: id, p_size: size, p_value: v, p_relative: false }));
  },
  nextOrderId() { return `VNK-${db.counter}`; },
  /** Server recomputes prices, shipping, discount and stock. Admins may also set status and a custom amount. */
  async placeOrder(o: Omit<Order, "id" | "createdAt" | "status" | "note"> & { paymentId?: string }, status: Status = "Placed"): Promise<Order> {
    const row = await rpc<Row>("place_order", { p: { customer: o.customer, phone: o.phone, city: o.city, address: o.address, pay: o.pay, promo: o.promo ?? null, status, amount: o.amount, payment_id: o.paymentId ?? null, items: o.items.map(({ name, size, qty }) => ({ name, size, qty })) } });
    const order = fromOrder(row);
    if (sync.admin) commit({ ...db, orders: [order, ...db.orders], counter: db.counter + 1 });
    void refresh();
    return order;
  },
  async requestReturn(r: { code: string; phone: string; item: OrderItem; type: "Return" | "Exchange"; newSize?: string; reason: string; comment: string }): Promise<ReturnReq> {
    const row = await rpc<Row>("request_return", { p_code: r.code, p_phone: r.phone, p_item_name: r.item.name, p_item_size: r.item.size, p_type: r.type, p_new_size: r.newSize ?? null, p_reason: r.reason, p_comment: r.comment });
    return fromReturn(row);
  },
  updateReturn(id: string, patch: Partial<Pick<ReturnReq, "courier" | "refund" | "note">>) {
    commit({ ...db, returns: db.returns!.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
    void exec("return", sb.from("returns").update(patch).eq("id", id));
  },
  setReturnStatus(id: string, status: RStatus, note?: string) {
    const r = (db.returns ?? []).find((x) => x.id === id);
    if (!r || r.status === status) return;
    const wasReserved = r.type === "Exchange" && !["Requested", "Rejected"].includes(r.status);
    const willReserve = r.type === "Exchange" && status !== "Requested" && status !== "Rejected";
    const wasRestocked = r.status === "Received" || r.status === "Resolved";
    const willRestock = status === "Received" || status === "Resolved";
    const prod = db.products.find((p) => p.name === r.item.name);
    const deltas: [string, number][] = [];
    if (r.newSize && willReserve && !wasReserved) deltas.push([r.newSize, -r.item.qty]);
    if (r.newSize && wasReserved && !willReserve) deltas.push([r.newSize, r.item.qty]);
    if (willRestock && !wasRestocked) deltas.push([r.item.size, r.item.qty]);
    let products = db.products;
    if (prod) {
      products = db.products.map((p) => {
        if (p.id !== prod.id) return p;
        const sizes = { ...p.sizes };
        deltas.forEach(([s, d]) => { sizes[s] = Math.max(0, (sizes[s] ?? 0) + d); });
        return { ...p, sizes };
      });
      deltas.forEach(([s, d]) => void exec("stock", sb.rpc("stock_change", { p_id: prod.id, p_size: s, p_value: d, p_relative: true })));
    }
    const history = [...r.history, { t: Date.now(), s: status, note }];
    const returns = db.returns!.map((x) => (x.id === id ? { ...x, status, history } : x));
    void exec("return status", sb.from("returns").update({ status, history }).eq("id", id));
    let orders = db.orders;
    if (status === "Resolved" && r.type === "Return") {
      const o = db.orders.find((x) => x.id === r.orderId);
      if (o && o.items.length === 1 && o.items[0].qty === r.item.qty) {
        orders = db.orders.map((x) => (x.id === o.id ? { ...x, status: "Returned" as Status } : x));
        void exec("order", sb.from("orders").update({ status: "Returned" }).eq("id", o.id));
      }
    }
    commit(withLog({ ...db, returns, orders, products }, `${r.id} → ${rLabel(status, r.type)}`, "ship"));
  },
  removeReturn(id: string) {
    commit(withLog({ ...db, returns: (db.returns ?? []).filter((x) => x.id !== id) }, `${id} deleted`, "edit"));
    void exec("delete return", sb.from("returns").delete().eq("id", id));
  },
};

/* ---------- Customer-facing server calls ---------- */
export const quoteOrder = (items: { name: string; size: string; qty: number }[], promo?: string) =>
  rpc<Quote>("quote_order", { p: { items, promo: promo ?? null } });
export const checkPromo = (code: string) => rpc<Partial<PromoInfo> & { error?: string }>("check_promo", { p_code: code, p_subtotal: 0 });
export const promoAmount = (p: Pick<PromoInfo, "type" | "value">, subtotal: number) => (p.type === "flat" ? Math.min(p.value, subtotal) : Math.round((subtotal * p.value) / 100));
export async function trackOrder(code: string, phone: string): Promise<{ order: Order; returns: ReturnReq[] } | null> {
  const r = await rpc<{ order: Row; returns: Row[] } | null>("track_order", { p_code: code, p_phone: phone });
  return r ? { order: fromOrder(r.order), returns: r.returns.map(fromReturn) } : null;
}
export async function getReturn(id: string, phone: string): Promise<ReturnReq | null> {
  const r = await rpc<Row | null>("get_return", { p_id: id, p_phone: phone });
  return r ? fromReturn(r) : null;
}

/* ---------- Media: Supabase Storage (public bucket "media", admin-only writes) ---------- */
export const saveMedia = async (blob: Blob): Promise<string> => {
  const ext = blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
  const path = `uploads/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from("media").upload(path, blob, { contentType: blob.type || "image/jpeg", cacheControl: "31536000" });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return sb.storage.from("media").getPublicUrl(path).data.publicUrl;
};

export const compressImage = (file: File, max = 1600): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const s = Math.min(1, max / Math.max(im.width, im.height));
      const c = document.createElement("canvas");
      c.width = Math.round(im.width * s);
      c.height = Math.round(im.height * s);
      const ctx = c.getContext("2d")!;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(async (blob) => {
        if (!blob) return reject(new Error("Could not encode image"));
        try { resolve(await saveMedia(blob)); } catch (e) { reject(e); }
      }, "image/webp", 0.9);
    };
    im.onerror = () => reject(new Error("Not an image"));
    im.src = url;
  });

/** Row mappers + legacy key, exposed for the temporary migration tool only. Safe to keep. */
export const rowMappers = { toProduct, toLook, toPromo, toOrder, toReturn };
export const LEGACY_STORAGE_KEY = LEGACY_KEY;
