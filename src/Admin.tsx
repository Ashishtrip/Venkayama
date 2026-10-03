import { useEffect, useMemo, useState } from "react";
import OnionLogo from "./components/OnionLogo";
import {
  actions, CATS, catLabel, compressImage, FLOW, IMAGES, imgSrc, itemsText, sizeKeys, totalStock, useDB,
  type Look, type Order, type OrderItem, type Product, type Promo, type Status, type Zone,
} from "./store";

const mono = "font-mono uppercase";
const disp = "font-display uppercase";
const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const ago = (t: number) => {
  const m = Math.max(0, Math.round((Date.now() - t) / 60000));
  return m < 1 ? "just now" : m < 60 ? `${m}m` : m < 1440 ? `${Math.floor(m / 60)}h` : `${Math.floor(m / 1440)}d`;
};

const statusStyle: Record<Status, string> = {
  Placed: "bg-neutral-200 text-black",
  Printing: "bg-white text-black border border-black",
  Packed: "bg-neutral-700 text-white",
  Shipped: "bg-black text-white",
  Delivered: "bg-emerald-700 text-white",
  Returned: "bg-red-700 text-white",
};

const inputCls = "w-full border border-black bg-white px-3 py-2.5 text-sm outline-none focus:bg-neutral-100";
const btnDark = `${mono} bg-black px-4 py-2.5 text-[10px] font-bold tracking-[0.15em] text-white transition hover:bg-neutral-700`;
const btnLine = `${mono} border border-black px-3 py-1.5 text-[9px] font-bold tracking-wider transition hover:bg-black hover:text-white`;
const btnDanger = `${mono} border border-red-700 px-3 py-1.5 text-[9px] font-bold tracking-wider text-red-700 transition hover:bg-red-700 hover:text-white`;

function Spark({ data, className = "" }: { data: number[]; className?: string }) {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * 100},${28 - ((d - min) / (max - min || 1)) * 24}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={`h-8 w-full ${className}`}>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Panel({ title, kicker, right, children, className = "" }: { title: string; kicker?: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`border border-black/15 bg-white ${className}`}>
      <header className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-black px-5 py-3">
        <div>
          {kicker && <p className={`${mono} text-[9px] tracking-[0.2em] text-neutral-500`}>{kicker}</p>}
          <h2 className={`${disp} text-2xl leading-none`}>{title}</h2>
        </div>
        {right}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 md:p-10" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label={title}>
      <div className={`w-full bg-white ${wide ? "max-w-3xl" : "max-w-lg"}`}>
        <header className="flex items-center justify-between border-b-2 border-black px-5 py-3">
          <h2 className={`${disp} text-2xl leading-none`}>{title}</h2>
          <button onClick={onClose} className={`${mono} text-[10px] font-bold tracking-widest`}>Close ✕</button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className={`${mono} mb-1 block text-[9px] font-bold tracking-[0.15em] text-neutral-600`}>{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-neutral-500">{hint}</span>}
    </label>
  );
}

const Num = ({ value, onChange, min = 0 }: { value: number; onChange: (n: number) => void; min?: number }) => (
  <input type="number" min={min} value={Number.isFinite(value) ? value : 0} onChange={(e) => onChange(Number(e.target.value))} className={inputCls} />
);

function FormActions({ onCancel, label, error }: { onCancel: () => void; label: string; error?: string }) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-black/10 pt-4">
      <button className={btnDark}>{label}</button>
      <button type="button" onClick={onCancel} className={`${mono} border border-black px-4 py-2.5 text-[10px] font-bold tracking-[0.15em] hover:bg-neutral-200`}>Cancel</button>
      {error && <p role="alert" className={`${mono} text-[10px] tracking-wider text-red-700`}>{error}</p>}
    </div>
  );
}

function ImagePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [err, setErr] = useState("");
  const upload = async (f?: File) => {
    if (!f) return;
    try { onChange(await compressImage(f)); setErr(""); } catch { setErr("That file is not an image."); }
  };
  return (
    <div>
      <div className="flex gap-3">
        <div className="h-28 w-24 shrink-0 bg-neutral-200">{value && <img src={imgSrc(value)} alt="Selected" className="size-full object-cover grayscale" />}</div>
        <div className="min-w-0 flex-1 space-y-2">
          <input value={value.startsWith("data:") ? "Uploaded image" : value} readOnly={value.startsWith("data:")} onChange={(e) => onChange(e.target.value)} placeholder="Image URL or filename" className={inputCls} />
          <label className={`${btnLine} inline-block cursor-pointer`}>
            Upload image
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
          </label>
          {err && <p className={`${mono} text-[10px] text-red-700`}>{err}</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {IMAGES.map((i) => (
          <button type="button" key={i} onClick={() => onChange(i)} aria-label={`Use ${i}`} aria-pressed={value === i} className={`h-14 w-11 overflow-hidden border-2 ${value === i ? "border-black" : "border-transparent"}`}>
            <img src={imgSrc(i)} alt="" className="size-full object-cover grayscale" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Products ---------------- */
const blankProduct = (): Product => ({
  id: actions.newId("p"), sku: "", name: "", cat: "tees", price: 0, was: 0, tag: "", badge: "", img: IMAGES[0], description: "",
  sizes: Object.fromEntries(sizeKeys("tees").map((k) => [k, 10])), sold: 0, threshold: 10, active: true, drop: false, claimed: 0,
});

function ProductForm({ initial, isNew, onClose }: { initial: Product; isNew: boolean; onClose: () => void }) {
  const [p, setP] = useState(initial);
  const [err, setErr] = useState("");
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }));
  const setCat = (cat: string) => setP((x) => ({ ...x, cat, sizes: Object.fromEntries(sizeKeys(cat).map((k) => [k, x.sizes[k] ?? 10])) }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!p.name.trim() || !p.sku.trim()) return setErr("Name and SKU are required.");
    if (p.price <= 0) return setErr("Price must be above zero.");
    actions.save("products", { ...p, name: p.name.trim().toUpperCase(), sku: p.sku.trim().toUpperCase() }, p.name.trim() || "Product");
    onClose();
  };
  return (
    <Modal title={isNew ? "New product" : "Edit product"} onClose={onClose} wide>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2"><Field label="Name"><input value={p.name} onChange={(e) => set("name", e.target.value)} className={inputCls} /></Field></div>
        <Field label="SKU"><input value={p.sku} onChange={(e) => set("sku", e.target.value)} className={inputCls} placeholder="TEE-010" /></Field>
        <Field label="Category">
          <select value={p.cat} onChange={(e) => setCat(e.target.value)} className={inputCls}>{CATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </Field>
        <Field label="Price (₹)"><Num value={p.price} onChange={(n) => set("price", n)} /></Field>
        <Field label="Original price (₹)" hint="Shown struck through. Leave 0 for no discount."><Num value={p.was} onChange={(n) => set("was", n)} /></Field>
        <Field label="Spec tag"><input value={p.tag} onChange={(e) => set("tag", e.target.value)} className={inputCls} placeholder="280 GSM" /></Field>
        <Field label="Badge"><input value={p.badge} onChange={(e) => set("badge", e.target.value)} className={inputCls} placeholder="EDITION: DROP 04" /></Field>
        <div className="md:col-span-2"><Field label="Description" hint="Optional. Overrides the category description on the product page."><textarea rows={3} value={p.description ?? ""} onChange={(e) => set("description", e.target.value)} className={inputCls} /></Field></div>
        <div className="md:col-span-2"><Field label="Image"><ImagePicker value={p.img} onChange={(v) => set("img", v)} /></Field></div>
        <div className="md:col-span-2">
          <p className={`${mono} mb-2 text-[9px] font-bold tracking-[0.15em] text-neutral-600`}>Stock by size</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {Object.keys(p.sizes).map((s) => (
              <Field key={s} label={s}><Num value={p.sizes[s]} onChange={(n) => set("sizes", { ...p.sizes, [s]: Math.max(0, n) })} /></Field>
            ))}
          </div>
        </div>
        <Field label="Low-stock alert at"><Num value={p.threshold} onChange={(n) => set("threshold", n)} /></Field>
        <Field label="Units sold"><Num value={p.sold} onChange={(n) => set("sold", n)} /></Field>
        <label className="flex items-center gap-3 border border-black/15 p-3"><input type="checkbox" checked={p.active} onChange={(e) => set("active", e.target.checked)} className="size-4 accent-black" /><span className={`${mono} text-[10px] font-bold tracking-wider`}>Listed in shop</span></label>
        <label className="flex items-center gap-3 border border-black/15 p-3"><input type="checkbox" checked={p.drop} onChange={(e) => set("drop", e.target.checked)} className="size-4 accent-black" /><span className={`${mono} text-[10px] font-bold tracking-wider`}>In featured drop</span></label>
        {p.drop && <Field label="Drop claimed (of 150)"><Num value={p.claimed} onChange={(n) => set("claimed", n)} /></Field>}
        <div className="md:col-span-2"><FormActions onCancel={onClose} label={isNew ? "Create product" : "Save changes"} error={err} /></div>
      </form>
    </Modal>
  );
}

/* ---------------- Orders ---------------- */
type Draft = Omit<Order, "id" | "createdAt"> & { id?: string; createdAt?: number };

function OrderForm({ initial, onClose }: { initial?: Order; onClose: () => void }) {
  const products = useDB((d) => d.products);
  const [o, setO] = useState<Draft>(
    initial ?? { customer: "", phone: "", city: "", address: "", items: [], amount: 0, pay: "COD", status: "Placed", note: "" }
  );
  const [err, setErr] = useState("");
  const total = (items: OrderItem[]) => items.reduce((a, i) => a + i.price * i.qty, 0);
  const setItems = (items: OrderItem[]) => setO((x) => ({ ...x, items, amount: total(items) }));
  const patch = (i: number, v: Partial<OrderItem>) => setItems(o.items.map((it, k) => (k === i ? { ...it, ...v } : it)));
  const pick = (i: number, name: string) => {
    const p = products.find((x) => x.name === name);
    if (p) patch(i, { name, price: p.price, size: Object.keys(p.sizes)[0] });
  };
  const addItem = () => {
    const p = products[0];
    if (p) setItems([...o.items, { name: p.name, size: Object.keys(p.sizes)[0], qty: 1, price: p.price }]);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!o.customer.trim()) return setErr("Customer name is required.");
    if (o.items.length === 0) return setErr("Add at least one item.");
    if (initial) actions.save("orders", { ...o, id: initial.id, createdAt: initial.createdAt! } as Order, initial.id);
    else actions.placeOrder({ customer: o.customer, phone: o.phone, city: o.city, address: o.address, items: o.items, amount: o.amount, pay: o.pay }, o.status);
    onClose();
  };
  return (
    <Modal title={initial ? `Edit ${initial.id}` : "New order"} onClose={onClose} wide>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <Field label="Customer"><input value={o.customer} onChange={(e) => setO({ ...o, customer: e.target.value })} className={inputCls} /></Field>
        <Field label="Phone"><input value={o.phone} onChange={(e) => setO({ ...o, phone: e.target.value })} inputMode="tel" className={inputCls} /></Field>
        <Field label="City"><input value={o.city} onChange={(e) => setO({ ...o, city: e.target.value })} className={inputCls} /></Field>
        <Field label="Address"><input value={o.address} onChange={(e) => setO({ ...o, address: e.target.value })} className={inputCls} /></Field>
        <Field label="Payment">
          <select value={o.pay} onChange={(e) => setO({ ...o, pay: e.target.value as Order["pay"] })} className={inputCls}>{["COD", "UPI", "Card"].map((x) => <option key={x}>{x}</option>)}</select>
        </Field>
        <Field label="Status">
          <select value={o.status} onChange={(e) => setO({ ...o, status: e.target.value as Status })} className={inputCls}>{[...FLOW, "Returned"].map((x) => <option key={x}>{x}</option>)}</select>
        </Field>
        <div className="md:col-span-2">
          <div className="mb-2 flex items-center justify-between"><p className={`${mono} text-[9px] font-bold tracking-[0.15em] text-neutral-600`}>Items</p><button type="button" onClick={addItem} className={btnLine}>+ Add item</button></div>
          <div className="space-y-2">
            {o.items.map((it, i) => {
              const p = products.find((x) => x.name === it.name);
              const sizes = p ? Object.keys(p.sizes) : [it.size];
              return (
                <div key={i} className="grid grid-cols-[1fr_90px_70px_auto] items-center gap-2">
                  <select aria-label="Product" value={it.name} onChange={(e) => pick(i, e.target.value)} className={inputCls}>
                    {!p && <option>{it.name}</option>}
                    {products.map((x) => <option key={x.id} value={x.name}>{x.name}</option>)}
                  </select>
                  <select aria-label="Size" value={it.size} onChange={(e) => patch(i, { size: e.target.value })} className={inputCls}>{sizes.map((s) => <option key={s}>{s}</option>)}</select>
                  <input aria-label="Quantity" type="number" min={1} value={it.qty} onChange={(e) => patch(i, { qty: Math.max(1, Number(e.target.value)) })} className={inputCls} />
                  <button type="button" aria-label="Remove item" onClick={() => setItems(o.items.filter((_, k) => k !== i))} className={btnDanger}>✕</button>
                </div>
              );
            })}
            {o.items.length === 0 && <p className={`${mono} border border-dashed border-black/25 p-4 text-center text-[10px] text-neutral-500`}>No items yet</p>}
          </div>
        </div>
        <Field label="Order total (₹)" hint="Calculated from items. Edit to include shipping or discounts."><Num value={o.amount} onChange={(n) => setO({ ...o, amount: n })} /></Field>
        <Field label="Internal note"><textarea rows={2} value={o.note} onChange={(e) => setO({ ...o, note: e.target.value })} className={inputCls} /></Field>
        <div className="md:col-span-2"><FormActions onCancel={onClose} label={initial ? "Save changes" : "Create order"} error={err} /></div>
      </form>
    </Modal>
  );
}

/* ---------------- Promo / Zone / Look forms ---------------- */
function PromoForm({ initial, onClose }: { initial?: Promo; onClose: () => void }) {
  const [c, setC] = useState<Promo>(initial ?? { id: actions.newId("c"), code: "", desc: "", type: "percent", value: 10, used: 0, cap: 100, on: true });
  const [err, setErr] = useState("");
  const codes = useDB((d) => d.promos);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = c.code.trim().toUpperCase().replace(/\s+/g, "");
    if (!code) return setErr("Code is required.");
    if (codes.some((x) => x.code === code && x.id !== c.id)) return setErr("That code already exists.");
    if (c.value <= 0 || (c.type === "percent" && c.value > 100)) return setErr("Enter a valid discount value.");
    actions.save("promos", { ...c, code }, code);
    onClose();
  };
  return (
    <Modal title={initial ? "Edit promo" : "New promo"} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Code"><input value={c.code} onChange={(e) => setC({ ...c, code: e.target.value })} className={`${inputCls} uppercase`} /></Field>
        <Field label="Type"><select value={c.type} onChange={(e) => setC({ ...c, type: e.target.value as Promo["type"] })} className={inputCls}><option value="percent">Percent off</option><option value="flat">Flat ₹ off</option></select></Field>
        <div className="sm:col-span-2"><Field label="Description"><input value={c.desc} onChange={(e) => setC({ ...c, desc: e.target.value })} className={inputCls} /></Field></div>
        <Field label={c.type === "percent" ? "Discount (%)" : "Discount (₹)"}><Num value={c.value} onChange={(n) => setC({ ...c, value: n })} /></Field>
        <Field label="Redemption cap"><Num value={c.cap} onChange={(n) => setC({ ...c, cap: n })} /></Field>
        <Field label="Times used"><Num value={c.used} onChange={(n) => setC({ ...c, used: n })} /></Field>
        <label className="flex items-center gap-3 self-end border border-black/15 p-3"><input type="checkbox" checked={c.on} onChange={(e) => setC({ ...c, on: e.target.checked })} className="size-4 accent-black" /><span className={`${mono} text-[10px] font-bold tracking-wider`}>Live</span></label>
        <div className="sm:col-span-2"><FormActions onCancel={onClose} label={initial ? "Save changes" : "Create promo"} error={err} /></div>
      </form>
    </Modal>
  );
}

function ZoneForm({ initial, onClose }: { initial?: Zone; onClose: () => void }) {
  const [z, setZ] = useState<Zone>(initial ?? { id: actions.newId("z"), name: "", days: "", fee: 79, freeAbove: 999 });
  const [err, setErr] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!z.name.trim()) return setErr("Zone name is required.");
    actions.save("zones", z, "Shipping zone");
    onClose();
  };
  return (
    <Modal title={initial ? "Edit zone" : "New zone"} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Zone"><input value={z.name} onChange={(e) => setZ({ ...z, name: e.target.value })} className={inputCls} /></Field></div>
        <Field label="Delivery time"><input value={z.days} onChange={(e) => setZ({ ...z, days: e.target.value })} placeholder="3-5 days" className={inputCls} /></Field>
        <Field label="Fee (₹)"><Num value={z.fee} onChange={(n) => setZ({ ...z, fee: n })} /></Field>
        <Field label="Free above (₹)"><Num value={z.freeAbove} onChange={(n) => setZ({ ...z, freeAbove: n })} /></Field>
        <div className="sm:col-span-2"><FormActions onCancel={onClose} label={initial ? "Save changes" : "Create zone"} error={err} /></div>
      </form>
    </Modal>
  );
}

function LookForm({ initial, onClose }: { initial?: Look; onClose: () => void }) {
  const count = useDB((d) => d.looks.length);
  const [l, setL] = useState<Look>(initial ?? { id: actions.newId("l"), img: IMAGES[0], label: `Look ${String(count + 1).padStart(2, "0")}`, title: "", shape: "tall" });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    actions.save("looks", l, "Look");
    onClose();
  };
  return (
    <Modal title={initial ? "Edit look" : "New look"} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Label"><input value={l.label} onChange={(e) => setL({ ...l, label: e.target.value })} className={inputCls} /></Field>
        <Field label="Shape"><select value={l.shape} onChange={(e) => setL({ ...l, shape: e.target.value as Look["shape"] })} className={inputCls}><option value="tall">Tall (3:4)</option><option value="wide">Wide (4:3)</option></select></Field>
        <div className="sm:col-span-2"><Field label="Caption"><input value={l.title} onChange={(e) => setL({ ...l, title: e.target.value })} className={inputCls} /></Field></div>
        <div className="sm:col-span-2"><Field label="Image"><ImagePicker value={l.img} onChange={(v) => setL({ ...l, img: v })} /></Field></div>
        <div className="sm:col-span-2"><FormActions onCancel={onClose} label={initial ? "Save changes" : "Add look"} /></div>
      </form>
    </Modal>
  );
}

/* ---------------- Admin ---------------- */
const TABS = ["Overview", "Orders", "Products", "Customers", "Promos", "Shipping", "Lookbook"] as const;
type Tab = (typeof TABS)[number];

type Dlg =
  | { k: "product"; v: Product; isNew: boolean }
  | { k: "order"; v?: Order }
  | { k: "promo"; v?: Promo }
  | { k: "zone"; v?: Zone }
  | { k: "look"; v?: Look }
  | { k: "confirm"; msg: string; run: () => void }
  | null;

export default function Admin({ onSignOut, userEmail }: { onSignOut?: () => void; userEmail?: string }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const orders = useDB((d) => d.orders);
  const products = useDB((d) => d.products);
  const promos = useDB((d) => d.promos);
  const zones = useDB((d) => d.zones);
  const looks = useDB((d) => d.looks);
  const settings = useDB((d) => d.settings);
  const activity = useDB((d) => d.activity);
  const [dlg, setDlg] = useState<Dlg>(null);
  const [range, setRange] = useState<"7D" | "30D" | "12M">("7D");
  const [q, setQ] = useState("");
  const [pq, setPq] = useState("");
  const [cq, setCq] = useState("");
  const [filter, setFilter] = useState<Status | "All">("All");
  const [now, setNow] = useState(() => new Date());
  const [sset, setSset] = useState(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);
  useEffect(() => setSset(settings), [settings]);

  const close = () => setDlg(null);
  const ask = (msg: string, run: () => void) => setDlg({ k: "confirm", msg, run });

  const live = useMemo(() => orders.filter((o) => o.status !== "Returned"), [orders]);
  const lowStock = useMemo(
    () => products.filter((p) => p.active).flatMap((p) => Object.entries(p.sizes).filter(([, v]) => v <= p.threshold).map(([s, v]) => ({ p, s, v }))),
    [products]
  );

  const series = useMemo(() => {
    const day = 864e5;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const sum = (from: number, to: number) => live.filter((o) => o.createdAt >= from && o.createdAt < to).reduce((a, o) => a + o.amount, 0);
    const daily = (n: number) => Array.from({ length: n }, (_, k) => {
      const start = today.getTime() - (n - 1 - k) * day;
      return { l: new Date(start).toLocaleDateString("en-IN", n <= 7 ? { weekday: "short" } : { day: "numeric" }), v: sum(start, start + day) };
    });
    const monthly = Array.from({ length: 12 }, (_, k) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (11 - k), 1);
      const e = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      return { l: d.toLocaleDateString("en-IN", { month: "short" }), v: sum(d.getTime(), e.getTime()) };
    });
    return { chart: range === "7D" ? daily(7) : range === "30D" ? daily(30) : monthly, spark: daily(9).map((x) => x.v) };
  }, [live, range]);
  const chartMax = Math.max(...series.chart.map((c) => c.v), 1);
  const chartTotal = series.chart.reduce((a, c) => a + c.v, 0);

  const returns = orders.filter((o) => o.status === "Returned").length;
  const open = orders.filter((o) => ["Placed", "Printing", "Packed"].includes(o.status)).length;
  const pipeline = [...FLOW, "Returned" as Status].map((s) => ({ s, n: orders.filter((o) => o.status === s).length }));
  const pipeMax = Math.max(...pipeline.map((p) => p.n), 1);
  const codShare = orders.length ? Math.round((orders.filter((o) => o.pay === "COD").length / orders.length) * 100) : 0;
  const topSold = Math.max(...products.map((p) => p.sold), 1);

  const kpis = [
    { l: `Revenue (${range})`, v: inr(chartTotal), s: series.spark, up: true },
    { l: "Orders", v: String(orders.length), s: null, up: true },
    { l: "Avg order value", v: inr(live.reduce((a, o) => a + o.amount, 0) / (live.length || 1)), s: null, up: true },
    { l: "Open orders", v: String(open), s: null, up: open < 10 },
    { l: "Return rate", v: `${orders.length ? ((returns / orders.length) * 100).toFixed(1) : "0.0"}%`, s: null, up: returns / (orders.length || 1) < 0.1 },
    { l: "Low-stock sizes", v: String(lowStock.length), s: null, up: lowStock.length <= 4 },
  ];

  const shown = orders.filter((o) => (filter === "All" || o.status === filter) && (q === "" || `${o.id} ${o.customer} ${o.city} ${o.phone} ${itemsText(o)}`.toLowerCase().includes(q.toLowerCase())));
  const pshown = products.filter((p) => `${p.name} ${p.sku} ${p.cat}`.toLowerCase().includes(pq.toLowerCase()));

  const customers = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; city: string; n: number; spent: number; last: number }>();
    orders.forEach((o) => {
      const key = (o.phone || o.customer).toLowerCase();
      const c = map.get(key) ?? { name: o.customer, phone: o.phone, city: o.city, n: 0, spent: 0, last: 0 };
      c.n += 1;
      if (o.status !== "Returned") c.spent += o.amount;
      if (o.createdAt >= c.last) { c.last = o.createdAt; c.city = o.city || c.city; }
      map.set(key, c);
    });
    return [...map.values()].sort((a, b) => b.spent - a.spent);
  }, [orders]);
  const cshown = customers.filter((c) => `${c.name} ${c.phone} ${c.city}`.toLowerCase().includes(cq.toLowerCase()));

  const health = [
    ["Storefront", "Operational", "ok", `${products.filter((p) => p.active).length} products live`],
    ["Order intake", "Operational", "ok", `${orders.length} orders on record`],
    ["Inventory", lowStock.length > 4 ? "Degraded" : "Operational", lowStock.length > 4 ? "warn" : "ok", `${lowStock.length} low-stock sizes`],
    ["Print queue", `${orders.filter((o) => o.status === "Printing").length} jobs`, "ok", "Plastisol line 2"],
  ];

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    actions.setSettings(sset);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const nextStatus = (o: Order) => {
    const i = FLOW.indexOf(o.status);
    return i >= 0 && i < FLOW.length - 1 ? FLOW[i + 1] : null;
  };

  return (
    <div className="min-h-screen bg-neutral-100 lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="bg-black text-white lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center justify-between gap-3 p-5 lg:block">
          <a href="#/" className="flex items-end gap-3">
            <span className="rounded bg-white p-1.5"><OnionLogo className="h-12" sway={false} /></span>
            <span className={`${disp} text-2xl leading-[0.9]`}>Venkayam<br /><span className="text-xs tracking-[0.3em]">Control room</span></span>
          </a>
          <p className={`${mono} mt-6 hidden text-[10px] leading-5 tracking-[0.15em] text-white/50 lg:block`}>
            Batch: CHN-DROP-04<br />IST {now.toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata" })}
          </p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(t)} className={`${mono} flex shrink-0 items-center gap-3 px-3 py-3 text-left text-[11px] font-bold tracking-[0.15em] transition ${tab === t ? "bg-white text-black" : "text-white/70 hover:bg-white/10"}`}>
              <span className="text-[9px] opacity-60">0{i + 1}</span>{t}
              {t === "Products" && lowStock.length > 0 && <span className="ml-auto bg-red-600 px-1.5 text-[9px] text-white">{lowStock.length}</span>}
              {t === "Orders" && <span className="ml-auto text-[9px] opacity-60">{orders.filter((o) => o.status === "Placed").length} new</span>}
            </button>
          ))}
        </nav>
        <div className="mx-6 mb-6 hidden border-t border-white/20 pt-4 lg:absolute lg:bottom-0 lg:left-0 lg:block lg:w-[200px]">
          {userEmail && <p className={`${mono} mb-2 truncate text-[9px] tracking-wider text-white/50`}>{userEmail}</p>}
          {onSignOut && <button onClick={onSignOut} className={`${mono} mb-3 block text-[10px] font-bold tracking-[0.15em] text-white/80 hover:text-white`}>Sign out →</button>}
          <a href="#/" className={`${mono} text-[10px] tracking-[0.15em] text-white/60 hover:text-white`}>← Back to storefront</a>
        </div>
      </aside>

      <main className="min-w-0 p-5 md:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b-2 border-black pb-4">
          <div>
            <p className={`${mono} flex items-center gap-2 text-[10px] tracking-[0.2em] text-neutral-500`}><span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-600 opacity-70" /><span className="relative inline-flex size-2 rounded-full bg-emerald-600" /></span>Live, synced with storefront</p>
            <h1 className={`${disp} text-5xl leading-none md:text-6xl`}>{tab}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {tab === "Orders" && <button onClick={() => setDlg({ k: "order" })} className={btnDark}>+ New order</button>}
            {tab === "Products" && <button onClick={() => setDlg({ k: "product", v: blankProduct(), isNew: true })} className={btnDark}>+ New product</button>}
            {tab === "Promos" && <button onClick={() => setDlg({ k: "promo" })} className={btnDark}>+ New promo</button>}
            {tab === "Shipping" && <button onClick={() => setDlg({ k: "zone" })} className={btnDark}>+ New zone</button>}
            {tab === "Lookbook" && <button onClick={() => setDlg({ k: "look" })} className={btnDark}>+ New look</button>}
            {tab === "Overview" && <button onClick={() => ask("Reset all products, orders, promos and settings to the sample data? This cannot be undone.", () => actions.reset())} className={`${mono} border border-black px-4 py-2.5 text-[10px] font-bold tracking-[0.15em] hover:bg-black hover:text-white`}>Reset demo data</button>}
          </div>
        </div>

        {tab === "Overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              {kpis.map((k) => (
                <div key={k.l} className="border border-black/15 bg-white p-4">
                  <p className={`${mono} text-[9px] tracking-[0.15em] text-neutral-500`}>{k.l}</p>
                  <p className={`${disp} mt-1 text-3xl leading-none`}>{k.v}</p>
                  {k.s ? <Spark data={k.s} className="mt-3 text-emerald-700" /> : <span className={`mt-3 block h-8 border-b ${k.up ? "border-emerald-700/40" : "border-red-700/60"}`} />}
                  <p className={`${mono} text-[10px] font-bold ${k.up ? "text-emerald-700" : "text-red-700"}`}>{k.up ? "Healthy" : "Needs attention"}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
              <Panel title="Revenue" kicker={`${range} total ${inr(chartTotal)}`} right={
                <div className="flex">{(["7D", "30D", "12M"] as const).map((r) => <button key={r} onClick={() => setRange(r)} className={`${mono} border border-black px-3 py-1 text-[10px] font-bold ${range === r ? "bg-black text-white" : "bg-white hover:bg-neutral-200"}`}>{r}</button>)}</div>
              }>
                <div className="flex h-56 items-end gap-1.5">
                  {series.chart.map((c, i) => (
                    <div key={`${range}-${i}`} className="group relative flex h-full flex-1 flex-col justify-end">
                      <div className="w-full bg-black transition-all duration-700 group-hover:bg-neutral-500" style={{ height: `${Math.max(c.v ? 2 : 0, (c.v / chartMax) * 100)}%` }} />
                      <span className={`${mono} pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap bg-black px-2 py-1 text-[9px] text-white group-hover:block`}>{c.l}: {inr(c.v)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-1.5">{series.chart.map((c, i) => <span key={i} className={`${mono} flex-1 text-center text-[8px] text-neutral-500`}>{range === "30D" && i % 3 ? "" : c.l}</span>)}</div>
              </Panel>

              <Panel title="Fulfilment pipeline" kicker="All orders">
                <div className="space-y-3">
                  {pipeline.map(({ s, n }) => (
                    <button key={s} onClick={() => { setFilter(s); setTab("Orders"); }} className="block w-full text-left">
                      <div className={`${mono} mb-1 flex justify-between text-[10px] font-bold tracking-wider`}><span>{s}</span><span>{n}</span></div>
                      <div className="h-3 bg-neutral-200"><div className={`h-full transition-all duration-700 ${s === "Returned" ? "bg-red-700" : "bg-black"}`} style={{ width: `${(n / pipeMax) * 100}%` }} /></div>
                    </button>
                  ))}
                </div>
                <p className={`${mono} mt-4 border-t border-black/10 pt-3 text-[10px] tracking-wider text-neutral-500`}>COD share {codShare}% · RTO watch on COD</p>
              </Panel>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <Panel title="Live activity" kicker="Latest changes">
                <ul className="space-y-3">
                  {activity.slice(0, 9).map((f, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className={`mt-1.5 size-2 shrink-0 ${f.k === "alert" ? "bg-red-600" : f.k === "ship" ? "bg-neutral-500" : f.k === "edit" ? "bg-neutral-300" : "bg-black"}`} />
                      <span className="flex-1">{f.m}</span>
                      <span className={`${mono} shrink-0 text-[9px] text-neutral-400`}>{ago(f.t)}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel title="Best sellers" kicker="Units sold">
                <ol className="space-y-3">
                  {[...products].sort((a, b) => b.sold - a.sold).slice(0, 6).map((p, i) => (
                    <li key={p.id} className="flex items-center gap-3">
                      <span className={`${disp} w-6 text-2xl`}>{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold uppercase">{p.name}</p>
                        <div className="mt-1 h-1.5 bg-neutral-200"><div className="h-full bg-black" style={{ width: `${(p.sold / topSold) * 100}%` }} /></div>
                      </div>
                      <span className={`${mono} text-[11px] font-bold`}>{p.sold}</span>
                    </li>
                  ))}
                </ol>
              </Panel>
              <Panel title="System health" kicker="Services">
                <ul className="divide-y divide-black/10">
                  {health.map(([n, s, st, m]) => (
                    <li key={n} className="flex items-center gap-3 py-2.5">
                      <span className={`size-2.5 rounded-full ${st === "ok" ? "bg-emerald-600" : "bg-amber-500"}`} />
                      <div className="flex-1"><p className="text-[13px] font-bold uppercase">{n}</p><p className={`${mono} text-[9px] text-neutral-500`}>{m}</p></div>
                      <span className={`${mono} text-[10px] font-bold ${st === "ok" ? "text-emerald-700" : "text-amber-600"}`}>{s}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
        )}

        {tab === "Orders" && (
          <Panel title="Order desk" kicker={`${shown.length} of ${orders.length} orders`} right={
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="SEARCH ORDER, NAME, CITY" aria-label="Search orders" className={`${mono} w-48 border border-black px-3 py-2 text-[10px] tracking-widest outline-none placeholder:text-neutral-400 focus:bg-neutral-100 md:w-64`} />
          }>
            <div className="mb-4 flex flex-wrap gap-2">
              {(["All", ...FLOW, "Returned"] as const).map((s) => (
                <button key={s} onClick={() => setFilter(s)} className={`${mono} border border-black px-3 py-1.5 text-[10px] font-bold tracking-wider ${filter === s ? "bg-black text-white" : "hover:bg-neutral-200"}`}>{s}</button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead>
                  <tr className={`${mono} border-b border-black text-[9px] tracking-[0.15em] text-neutral-500`}>
                    {["Order", "Customer", "Items", "Amount", "Pay", "Status", "Age", ""].map((h) => <th key={h} className="px-2 py-2 font-bold">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((o) => {
                    const nx = nextStatus(o);
                    return (
                      <tr key={o.id} className="border-b border-black/10 hover:bg-neutral-50">
                        <td className={`${mono} px-2 py-3 text-[11px] font-bold`}>{o.id}</td>
                        <td className="px-2 py-3"><p className="font-bold">{o.customer}</p><p className={`${mono} text-[9px] text-neutral-500`}>{[o.city, o.phone].filter(Boolean).join(" · ")}</p></td>
                        <td className="max-w-[260px] px-2 py-3 text-[13px]">{itemsText(o)}</td>
                        <td className={`${mono} px-2 py-3 text-[12px] font-bold`}>{inr(o.amount)}</td>
                        <td className={`${mono} px-2 py-3 text-[10px]`}>{o.pay}</td>
                        <td className="px-2 py-3">
                          <select value={o.status} onChange={(e) => actions.setStatus(o.id, e.target.value as Status)} aria-label={`Status of ${o.id}`} className={`${mono} cursor-pointer px-2 py-1 text-[9px] font-bold tracking-wider ${statusStyle[o.status]}`}>
                            {[...FLOW, "Returned"].map((s) => <option key={s} value={s} className="bg-white text-black">{s}</option>)}
                          </select>
                        </td>
                        <td className={`${mono} px-2 py-3 text-[10px] text-neutral-500`}>{ago(o.createdAt)}</td>
                        <td className="whitespace-nowrap px-2 py-3 text-right">
                          <span className="inline-flex gap-1.5">
                            {nx && <button onClick={() => actions.setStatus(o.id, nx)} className={`${mono} bg-black px-3 py-1.5 text-[9px] font-bold tracking-wider text-white hover:bg-neutral-700`}>→ {nx}</button>}
                            <button onClick={() => setDlg({ k: "order", v: o })} className={btnLine}>Edit</button>
                            <button onClick={() => ask(`Delete order ${o.id}? This cannot be undone.`, () => actions.remove("orders", o.id, o.id))} className={btnDanger}>Delete</button>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {shown.length === 0 && <tr><td colSpan={8} className={`${mono} py-10 text-center text-[11px] text-neutral-500`}>No orders match.</td></tr>}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {tab === "Products" && (
          <div className="space-y-5">
            {lowStock.length > 0 && (
              <div className="border-2 border-red-700 bg-red-50 p-4">
                <p className={`${mono} text-[11px] font-bold tracking-[0.15em] text-red-700`}>{lowStock.length} stock alerts</p>
                <p className="mt-1 text-sm">{lowStock.slice(0, 6).map(({ p, s, v }) => `${p.name} (${s}: ${v})`).join(" · ")}</p>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <input value={pq} onChange={(e) => setPq(e.target.value)} placeholder="SEARCH PRODUCT, SKU" aria-label="Search products" className={`${mono} w-64 border border-black bg-white px-3 py-2 text-[10px] tracking-widest outline-none placeholder:text-neutral-400`} />
              <p className={`${mono} text-[10px] tracking-wider text-neutral-500`}>{pshown.length} of {products.length} products</p>
            </div>
            <div className="space-y-4">
              {pshown.map((p) => (
                <article key={p.id} className={`border border-black/15 bg-white p-4 ${p.active ? "" : "opacity-60"}`}>
                  <div className="flex flex-wrap gap-4">
                    <img src={imgSrc(p.img)} alt="" className="h-28 w-24 shrink-0 bg-neutral-200 object-cover grayscale" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-[15px] font-extrabold uppercase leading-snug">{p.name}</h3>
                          <p className={`${mono} mt-1 text-[10px] tracking-wider text-neutral-500`}>{p.sku} · {catLabel(p.cat)} · {inr(p.price)}{p.was > p.price ? ` (was ${inr(p.was)})` : ""} · {totalStock(p)} units · {p.sold} sold</p>
                          <p className="mt-2 flex gap-2">
                            {!p.active && <span className={`${mono} bg-neutral-200 px-2 py-0.5 text-[9px] font-bold`}>Hidden</span>}
                            {p.drop && <span className={`${mono} bg-black px-2 py-0.5 text-[9px] font-bold text-white`}>In drop</span>}
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => actions.save("products", { ...p, active: !p.active }, p.name)} className={btnLine}>{p.active ? "Hide" : "List"}</button>
                          <button onClick={() => setDlg({ k: "product", v: p, isNew: false })} className={btnLine}>Edit</button>
                          <button onClick={() => ask(`Delete "${p.name}"? It disappears from the shop immediately.`, () => actions.remove("products", p.id, p.name))} className={btnDanger}>Delete</button>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {Object.entries(p.sizes).map(([s, v]) => {
                          const low = v <= p.threshold;
                          return (
                            <div key={s} className={`border p-2 ${v === 0 ? "border-red-700 bg-red-50" : low ? "border-amber-500 bg-amber-50" : "border-black/15"}`}>
                              <label className={`${mono} flex items-center justify-between text-[10px] font-bold`}>
                                <span>{s}</span>
                                <input type="number" min={0} value={v} onChange={(e) => actions.setStock(p.id, s, Number(e.target.value))} aria-label={`${p.name} ${s} stock`} className="w-14 border border-black/30 bg-white px-1 py-0.5 text-right text-xs outline-none focus:border-black" />
                              </label>
                              <button onClick={() => actions.setStock(p.id, s, v + 10)} className={`${mono} mt-2 w-full border border-black py-1 text-[9px] font-bold tracking-wider hover:bg-black hover:text-white`}>+10 restock</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
              {pshown.length === 0 && <p className={`${mono} border border-dashed border-black/25 bg-white p-10 text-center text-[11px] text-neutral-500`}>No products found.</p>}
            </div>
          </div>
        )}

        {tab === "Customers" && (
          <Panel title="Customer book" kicker={`${customers.length} customers, built from orders`} right={
            <input value={cq} onChange={(e) => setCq(e.target.value)} placeholder="SEARCH NAME, PHONE" aria-label="Search customers" className={`${mono} w-48 border border-black px-3 py-2 text-[10px] tracking-widest outline-none placeholder:text-neutral-400 md:w-64`} />
          }>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead><tr className={`${mono} border-b border-black text-[9px] tracking-[0.15em] text-neutral-500`}>{["Customer", "Phone", "City", "Orders", "Lifetime spend", "Last order"].map((h) => <th key={h} className="px-2 py-2 font-bold">{h}</th>)}</tr></thead>
                <tbody>
                  {cshown.map((c) => (
                    <tr key={c.name + c.phone} className="border-b border-black/10 hover:bg-neutral-50">
                      <td className="px-2 py-3 font-bold">{c.name}</td>
                      <td className={`${mono} px-2 py-3 text-[11px]`}>{c.phone || "n/a"}</td>
                      <td className="px-2 py-3">{c.city || "n/a"}</td>
                      <td className={`${mono} px-2 py-3 text-[11px] font-bold`}>{c.n}</td>
                      <td className={`${mono} px-2 py-3 text-[12px] font-bold`}>{inr(c.spent)}</td>
                      <td className={`${mono} px-2 py-3 text-[10px] text-neutral-500`}>{ago(c.last)}</td>
                    </tr>
                  ))}
                  {cshown.length === 0 && <tr><td colSpan={6} className={`${mono} py-10 text-center text-[11px] text-neutral-500`}>No customers yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {tab === "Promos" && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {promos.map((c) => (
              <div key={c.id} className="border border-black/15 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className={`${disp} text-2xl leading-none`}>{c.code}</p><p className="mt-1 text-sm text-neutral-600">{c.desc || "No description"}</p><p className={`${mono} mt-2 text-[10px] font-bold tracking-wider`}>{c.type === "percent" ? `${c.value}% off` : `${inr(c.value)} off`}</p></div>
                  <button onClick={() => actions.save("promos", { ...c, on: !c.on }, c.code)} aria-pressed={c.on} className={`${mono} min-w-16 px-3 py-1.5 text-[10px] font-bold tracking-wider ${c.on ? "bg-black text-white" : "border border-black"}`}>{c.on ? "Live" : "Paused"}</button>
                </div>
                <div className="mt-4 h-2 bg-neutral-200"><div className={`h-full ${c.used >= c.cap ? "bg-red-700" : "bg-black"}`} style={{ width: `${Math.min(100, (c.used / (c.cap || 1)) * 100)}%` }} /></div>
                <p className={`${mono} mt-1 text-[10px] text-neutral-500`}>{c.used} / {c.cap} used</p>
                <div className="mt-4 flex gap-1.5">
                  <button onClick={() => setDlg({ k: "promo", v: c })} className={btnLine}>Edit</button>
                  <button onClick={() => ask(`Delete promo ${c.code}?`, () => actions.remove("promos", c.id, c.code))} className={btnDanger}>Delete</button>
                </div>
              </div>
            ))}
            {promos.length === 0 && <p className={`${mono} border border-dashed border-black/25 bg-white p-10 text-center text-[11px] text-neutral-500 md:col-span-2`}>No promo codes. Create one.</p>}
          </div>
        )}

        {tab === "Shipping" && (
          <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
            <Panel title="Delivery zones" kicker="Shown on the shipping page">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead><tr className={`${mono} border-b border-black text-[9px] tracking-[0.15em] text-neutral-500`}>{["Zone", "Delivery", "Fee", "Free above", ""].map((h) => <th key={h} className="px-2 py-2 font-bold">{h}</th>)}</tr></thead>
                  <tbody>
                    {zones.map((z) => (
                      <tr key={z.id} className="border-b border-black/10">
                        <td className="px-2 py-3 font-bold">{z.name}</td>
                        <td className="px-2 py-3">{z.days}</td>
                        <td className={`${mono} px-2 py-3 text-[11px] font-bold`}>{inr(z.fee)}</td>
                        <td className={`${mono} px-2 py-3 text-[11px]`}>{inr(z.freeAbove)}</td>
                        <td className="whitespace-nowrap px-2 py-3 text-right"><span className="inline-flex gap-1.5"><button onClick={() => setDlg({ k: "zone", v: z })} className={btnLine}>Edit</button><button onClick={() => ask(`Delete zone "${z.name}"?`, () => actions.remove("zones", z.id, "Shipping zone"))} className={btnDanger}>Delete</button></span></td>
                      </tr>
                    ))}
                    {zones.length === 0 && <tr><td colSpan={5} className={`${mono} py-8 text-center text-[11px] text-neutral-500`}>No zones.</td></tr>}
                  </tbody>
                </table>
              </div>
            </Panel>
            <Panel title="Checkout rules" kicker="Applied in the cart">
              <form onSubmit={saveSettings} className="space-y-4">
                <Field label="Free shipping above (₹)"><Num value={sset.freeShip} onChange={(n) => setSset({ ...sset, freeShip: n })} /></Field>
                <Field label="Standard shipping fee (₹)"><Num value={sset.shipFee} onChange={(n) => setSset({ ...sset, shipFee: n })} /></Field>
                <Field label="Cash on delivery fee (₹)"><Num value={sset.codFee} onChange={(n) => setSset({ ...sset, codFee: n })} /></Field>
                <div className="flex items-center gap-3"><button className={btnDark}>Save rules</button>{saved && <span className={`${mono} text-[10px] text-emerald-700`}>Saved</span>}</div>
              </form>
            </Panel>
          </div>
        )}

        {tab === "Lookbook" && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {looks.map((l) => (
              <figure key={l.id} className="border border-black/15 bg-white p-3">
                <div className={`overflow-hidden bg-neutral-200 ${l.shape === "tall" ? "aspect-[3/4]" : "aspect-[4/3]"}`}><img src={imgSrc(l.img)} alt={l.title} className="size-full object-cover grayscale" /></div>
                <figcaption className="mt-2">
                  <p className={`${mono} text-[10px] font-bold tracking-wider`}>{l.label}</p>
                  <p className="text-sm text-neutral-600">{l.title || "Untitled"}</p>
                  <div className="mt-2 flex gap-1.5"><button onClick={() => setDlg({ k: "look", v: l })} className={btnLine}>Edit</button><button onClick={() => ask(`Delete ${l.label}?`, () => actions.remove("looks", l.id, "Look"))} className={btnDanger}>Delete</button></div>
                </figcaption>
              </figure>
            ))}
            {looks.length === 0 && <p className={`${mono} col-span-full border border-dashed border-black/25 bg-white p-10 text-center text-[11px] text-neutral-500`}>No looks. Add one.</p>}
          </div>
        )}
      </main>

      {dlg?.k === "product" && <ProductForm initial={dlg.v} isNew={dlg.isNew} onClose={close} />}
      {dlg?.k === "order" && <OrderForm initial={dlg.v} onClose={close} />}
      {dlg?.k === "promo" && <PromoForm initial={dlg.v} onClose={close} />}
      {dlg?.k === "zone" && <ZoneForm initial={dlg.v} onClose={close} />}
      {dlg?.k === "look" && <LookForm initial={dlg.v} onClose={close} />}
      {dlg?.k === "confirm" && (
        <Modal title="Are you sure?" onClose={close}>
          <p className="text-sm text-neutral-700">{dlg.msg}</p>
          <div className="mt-6 flex gap-3">
            <button onClick={() => { dlg.run(); close(); }} className={`${mono} bg-red-700 px-4 py-2.5 text-[10px] font-bold tracking-[0.15em] text-white hover:bg-red-800`}>Confirm</button>
            <button onClick={close} className={`${mono} border border-black px-4 py-2.5 text-[10px] font-bold tracking-[0.15em] hover:bg-neutral-200`}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
