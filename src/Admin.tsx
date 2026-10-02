import { useEffect, useMemo, useState } from "react";
import OnionLogo from "./components/OnionLogo";

const mono = "font-mono uppercase";
const disp = "font-display uppercase";
const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

type Status = "Placed" | "Printing" | "Packed" | "Shipped" | "Delivered" | "Returned";
const FLOW: Status[] = ["Placed", "Printing", "Packed", "Shipped", "Delivered"];
type Order = { id: string; customer: string; city: string; item: string; amount: number; pay: "COD" | "UPI" | "Card"; status: Status; mins: number };

const CUSTOMERS = ["Arjun K.", "Meenakshi R.", "Karthik S.", "Divya P.", "Vignesh M.", "Priya N.", "Surya T.", "Anitha L.", "Rahul B.", "Harini V.", "Dinesh C.", "Lakshmi G."];
const CITIES = ["Chennai", "Coimbatore", "Madurai", "Bengaluru", "Mumbai", "Hyderabad", "Delhi", "Pune", "Kochi"];
const ITEMS: [string, number][] = [
  ["Thalaivar Tribute Oversized Tee", 1499],
  ["Onion Monogram Hoodie", 2999],
  ["Madras Noir Acid Wash Tee", 1699],
  ["Kollywood Retro Club Tee", 1599],
  ["Streetwear 5-Panel Cap", 999],
  ["Canvas Onion Tote Bag", 799],
];

function seedOrders(): Order[] {
  const r = rng(42);
  const statuses: Status[] = ["Placed", "Placed", "Printing", "Printing", "Packed", "Shipped", "Shipped", "Delivered", "Delivered", "Delivered", "Returned"];
  return Array.from({ length: 24 }, (_, i) => {
    const [item, amount] = ITEMS[Math.floor(r() * ITEMS.length)];
    const qty = 1 + Math.floor(r() * 2);
    return {
      id: `VNK-${2480 - i}`,
      customer: CUSTOMERS[Math.floor(r() * CUSTOMERS.length)],
      city: CITIES[Math.floor(r() * CITIES.length)],
      item: qty > 1 ? `${item} ×${qty}` : item,
      amount: amount * qty,
      pay: (["COD", "UPI", "Card"] as const)[Math.floor(r() * 3)],
      status: statuses[Math.floor(r() * statuses.length)],
      mins: 4 + i * 37,
    };
  });
}

type Product = { sku: string; name: string; cat: string; sizes: Record<string, number>; sold: number; threshold: number };
const seedProducts = (): Product[] => [
  { sku: "TEE-004", name: "Thalaivar Tribute Oversized Tee", cat: "Tees", sizes: { S: 22, M: 41, L: 38, XL: 14, XXL: 5 }, sold: 312, threshold: 12 },
  { sku: "HOD-001", name: "Onion Monogram Hoodie (Charcoal)", cat: "Hoodies", sizes: { S: 6, M: 9, L: 11, XL: 3, XXL: 0 }, sold: 188, threshold: 8 },
  { sku: "TEE-007", name: "Madras Noir Acid Wash Tee", cat: "Tees", sizes: { S: 18, M: 26, L: 20, XL: 9, XXL: 7 }, sold: 241, threshold: 12 },
  { sku: "TEE-009", name: "Kollywood Retro Club Tee", cat: "Tees", sizes: { S: 30, M: 44, L: 36, XL: 21, XXL: 12 }, sold: 167, threshold: 12 },
  { sku: "CAP-002", name: "Streetwear 5-Panel Cap", cat: "Caps", sizes: { S: 0, M: 0, L: 0, XL: 0, XXL: 0, OS: 64 } as Record<string, number>, sold: 402, threshold: 20 },
  { sku: "TOT-003", name: "Heavyweight Canvas Onion Tote", cat: "Accessories", sizes: { OS: 15 } as Record<string, number>, sold: 276, threshold: 20 },
];
const visibleSizes = (p: Product) => Object.entries(p.sizes).filter(([s]) => (p.cat === "Caps" || p.cat === "Accessories" ? s === "OS" : s !== "OS"));
const stockOf = (p: Product) => Object.values(p.sizes).reduce((a, b) => a + b, 0);

const statusStyle: Record<Status, string> = {
  Placed: "bg-neutral-200 text-black",
  Printing: "bg-white text-black border border-black",
  Packed: "bg-neutral-700 text-white",
  Shipped: "bg-black text-white",
  Delivered: "bg-emerald-700 text-white",
  Returned: "bg-red-700 text-white",
};

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
      <header className="flex items-end justify-between gap-3 border-b-2 border-black px-5 py-3">
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

const TABS = ["Overview", "Orders", "Inventory", "Drops & Promos"] as const;
type Tab = (typeof TABS)[number];

export default function Admin({ onSignOut, userEmail }: { onSignOut?: () => void; userEmail?: string }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const [orders, setOrders] = useState<Order[]>(seedOrders);
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [range, setRange] = useState<"7D" | "30D" | "12M">("7D");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Status | "All">("All");
  const [promos, setPromos] = useState([
    { code: "VENKAYAM10", desc: "₹100 off first archive piece", used: 412, cap: 600, on: true },
    { code: "DROP04EARLY", desc: "Early access · 10% off", used: 138, cap: 150, on: true },
    { code: "TIRUPPUR15", desc: "Bulk · 15% off 3+ tees", used: 57, cap: 200, on: false },
  ]);
  const [feed, setFeed] = useState<{ t: string; m: string; k: "order" | "alert" | "ship" }[]>([
    { t: "just now", m: "VNK-2480 placed · ₹2,999 · UPI · Chennai", k: "order" },
    { t: "3 min", m: "Hoodie XXL sold out", k: "alert" },
    { t: "11 min", m: "VNK-2471 handed to courier · Tiruppur hub", k: "ship" },
  ]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let n = 2481;
    const id = window.setInterval(() => {
      const r = Math.random();
      const [item, amount] = ITEMS[Math.floor(r * ITEMS.length)];
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      const pay = (["COD", "UPI", "Card"] as const)[Math.floor(Math.random() * 3)];
      const o: Order = { id: `VNK-${n++}`, customer: CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)], city, item, amount, pay, status: "Placed", mins: 0 };
      setOrders((os) => [o, ...os]);
      setFeed((f) => [{ t: "just now", m: `${o.id} placed · ${inr(amount)} · ${pay} · ${city}`, k: "order" as const }, ...f].slice(0, 9));
    }, 9000);
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    return () => { clearInterval(id); clearInterval(clock); };
  }, []);

  const advance = (id: string) => {
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    const i = FLOW.indexOf(o.status);
    if (i < 0 || i === FLOW.length - 1) return;
    const next = FLOW[i + 1];
    setOrders((os) => os.map((x) => (x.id === id ? { ...x, status: next } : x)));
    setFeed((f) => [{ t: "just now", m: `${id} → ${next}`, k: "ship" as const }, ...f].slice(0, 9));
  };
  const markReturn = (id: string) => setOrders((os) => os.map((o) => (o.id === id ? { ...o, status: "Returned" } : o)));
  const restock = (sku: string, size: string, n = 10) =>
    setProducts((ps) => ps.map((p) => (p.sku === sku ? { ...p, sizes: { ...p.sizes, [size]: p.sizes[size] + n } } : p)));

  const chart = useMemo(() => {
    const r = rng(range === "7D" ? 7 : range === "30D" ? 30 : 12);
    const n = range === "7D" ? 7 : range === "30D" ? 30 : 12;
    const labels = range === "12M" ? ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"] : Array.from({ length: n }, (_, i) => (range === "7D" ? ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"][i] : String(i + 1)));
    const base = range === "12M" ? 520000 : 62000;
    return labels.map((l, i) => ({ l, v: Math.round(base * (0.55 + r() * 0.7 + (i / n) * 0.45)) }));
  }, [range]);
  const chartMax = Math.max(...chart.map((c) => c.v));
  const chartTotal = chart.reduce((a, c) => a + c.v, 0);

  const live = orders.filter((o) => o.status !== "Returned");
  const revenueToday = live.slice(0, 14).reduce((a, o) => a + o.amount, 0);
  const lowStock = products.flatMap((p) => visibleSizes(p).filter(([, v]) => v <= p.threshold).map(([s, v]) => ({ p, s, v })));
  const returns = orders.filter((o) => o.status === "Returned").length;
  const pipeline = [...FLOW, "Returned" as Status].map((s) => ({ s, n: orders.filter((o) => o.status === s).length }));
  const pipeMax = Math.max(...pipeline.map((p) => p.n), 1);
  const codShare = Math.round((orders.filter((o) => o.pay === "COD").length / orders.length) * 100);

  const kpis = [
    { l: "Revenue (24h)", v: inr(revenueToday), d: "+18.4%", up: true, s: [12, 18, 15, 22, 21, 29, 34, 31, 40] },
    { l: "Orders", v: String(orders.length), d: "+9.2%", up: true, s: [8, 11, 9, 14, 13, 17, 16, 21, 24] },
    { l: "Avg order value", v: inr(live.reduce((a, o) => a + o.amount, 0) / (live.length || 1)), d: "+3.1%", up: true, s: [20, 19, 22, 21, 23, 22, 24, 25, 24] },
    { l: "Conversion", v: "3.82%", d: "-0.4%", up: false, s: [4.2, 4.1, 4.0, 4.1, 3.9, 3.95, 3.85, 3.9, 3.82] },
    { l: "Return rate", v: `${((returns / orders.length) * 100).toFixed(1)}%`, d: "-1.2%", up: true, s: [9, 8, 8.5, 7, 6.8, 6.2, 6.5, 5.9, 5.5] },
    { l: "Low-stock SKUs", v: String(lowStock.length), d: lowStock.length > 4 ? "Action" : "Watch", up: lowStock.length <= 4, s: [2, 2, 3, 3, 4, 5, 4, 6, lowStock.length] },
  ];

  const shown = orders.filter((o) => (filter === "All" || o.status === filter) && (q === "" || `${o.id} ${o.customer} ${o.city} ${o.item}`.toLowerCase().includes(q.toLowerCase())));

  const health = [
    ["Payment gateway", "Operational", "ok", "142ms"],
    ["Courier API", "Operational", "ok", "311ms"],
    ["Inventory sync", lowStock.length > 4 ? "Degraded" : "Operational", lowStock.length > 4 ? "warn" : "ok", "Tiruppur WH"],
    ["Print queue", `${orders.filter((o) => o.status === "Printing").length} jobs`, "ok", "Plastisol line 2"],
    ["Storefront uptime", "99.98%", "ok", "30 days"],
  ];

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
              {t === "Inventory" && lowStock.length > 0 && <span className="ml-auto bg-red-600 px-1.5 text-[9px] text-white">{lowStock.length}</span>}
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
            <p className={`${mono} flex items-center gap-2 text-[10px] tracking-[0.2em] text-neutral-500`}><span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-600 opacity-70" /><span className="relative inline-flex size-2 rounded-full bg-emerald-600" /></span>Live monitoring</p>
            <h1 className={`${disp} text-5xl leading-none md:text-6xl`}>{tab}</h1>
          </div>
          <p className={`${mono} text-[10px] tracking-[0.15em] text-neutral-500`}>Venkayam India // Admin v1.0</p>
        </div>

        {tab === "Overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              {kpis.map((k) => (
                <div key={k.l} className="border border-black/15 bg-white p-4">
                  <p className={`${mono} text-[9px] tracking-[0.15em] text-neutral-500`}>{k.l}</p>
                  <p className={`${disp} mt-1 text-3xl leading-none`}>{k.v}</p>
                  <Spark data={k.s} className={`mt-3 ${k.up ? "text-emerald-700" : "text-red-700"}`} />
                  <p className={`${mono} text-[10px] font-bold ${k.up ? "text-emerald-700" : "text-red-700"}`}>{k.d}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
              <Panel title="Revenue" kicker={`${range} total ${inr(chartTotal)}`} right={
                <div className="flex">{(["7D", "30D", "12M"] as const).map((r) => <button key={r} onClick={() => setRange(r)} className={`${mono} border border-black px-3 py-1 text-[10px] font-bold ${range === r ? "bg-black text-white" : "bg-white hover:bg-neutral-200"}`}>{r}</button>)}</div>
              }>
                <div className="flex h-56 items-end gap-1.5">
                  {chart.map((c, i) => (
                    <div key={`${range}-${i}`} className="group relative flex h-full flex-1 flex-col justify-end">
                      <div className="w-full bg-black transition-all duration-700 group-hover:bg-neutral-500" style={{ height: `${(c.v / chartMax) * 100}%` }} />
                      <span className={`${mono} pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap bg-black px-2 py-1 text-[9px] text-white group-hover:block`}>{inr(c.v)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-1.5">{chart.map((c, i) => <span key={i} className={`${mono} flex-1 text-center text-[8px] text-neutral-500`}>{range === "30D" && i % 3 ? "" : c.l}</span>)}</div>
              </Panel>

              <Panel title="Fulfilment pipeline" kicker="All open orders">
                <div className="space-y-3">
                  {pipeline.map(({ s, n }) => (
                    <div key={s}>
                      <div className={`${mono} mb-1 flex justify-between text-[10px] font-bold tracking-wider`}><span>{s}</span><span>{n}</span></div>
                      <div className="h-3 bg-neutral-200"><div className={`h-full transition-all duration-700 ${s === "Returned" ? "bg-red-700" : "bg-black"}`} style={{ width: `${(n / pipeMax) * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
                <p className={`${mono} mt-4 border-t border-black/10 pt-3 text-[10px] tracking-wider text-neutral-500`}>COD share {codShare}% · RTO watch on COD</p>
              </Panel>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <Panel title="Live activity" kicker="Realtime feed">
                <ul className="space-y-3">
                  {feed.map((f, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className={`mt-1.5 size-2 shrink-0 ${f.k === "alert" ? "bg-red-600" : f.k === "ship" ? "bg-neutral-500" : "bg-black"}`} />
                      <span className="flex-1">{f.m}</span>
                      <span className={`${mono} shrink-0 text-[9px] text-neutral-400`}>{f.t}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel title="Best sellers" kicker="Units sold">
                <ol className="space-y-3">
                  {[...products].sort((a, b) => b.sold - a.sold).map((p, i) => (
                    <li key={p.sku} className="flex items-center gap-3">
                      <span className={`${disp} w-6 text-2xl`}>{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold uppercase">{p.name}</p>
                        <div className="mt-1 h-1.5 bg-neutral-200"><div className="h-full bg-black" style={{ width: `${(p.sold / 402) * 100}%` }} /></div>
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
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="SEARCH ORDER, NAME, CITY" className={`${mono} w-48 border border-black px-3 py-2 text-[10px] tracking-widest outline-none placeholder:text-neutral-400 focus:bg-neutral-100 md:w-64`} />
          }>
            <div className="mb-4 flex flex-wrap gap-2">
              {(["All", ...FLOW, "Returned"] as const).map((s) => (
                <button key={s} onClick={() => setFilter(s)} className={`${mono} border border-black px-3 py-1.5 text-[10px] font-bold tracking-wider ${filter === s ? "bg-black text-white" : "hover:bg-neutral-200"}`}>{s}</button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className={`${mono} border-b border-black text-[9px] tracking-[0.15em] text-neutral-500`}>
                    {["Order", "Customer", "Item", "Amount", "Pay", "Status", "Age", ""].map((h) => <th key={h} className="px-2 py-2 font-bold">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((o) => (
                    <tr key={o.id} className="border-b border-black/10 hover:bg-neutral-50">
                      <td className={`${mono} px-2 py-3 text-[11px] font-bold`}>{o.id}</td>
                      <td className="px-2 py-3"><p className="font-bold">{o.customer}</p><p className={`${mono} text-[9px] text-neutral-500`}>{o.city}</p></td>
                      <td className="px-2 py-3 text-[13px]">{o.item}</td>
                      <td className={`${mono} px-2 py-3 text-[12px] font-bold`}>{inr(o.amount)}</td>
                      <td className={`${mono} px-2 py-3 text-[10px]`}>{o.pay}</td>
                      <td className="px-2 py-3"><span className={`${mono} inline-block px-2 py-1 text-[9px] font-bold tracking-wider ${statusStyle[o.status]}`}>{o.status}</span></td>
                      <td className={`${mono} px-2 py-3 text-[10px] text-neutral-500`}>{o.mins < 60 ? `${o.mins}m` : `${Math.floor(o.mins / 60)}h`}</td>
                      <td className="whitespace-nowrap px-2 py-3 text-right">
                        {FLOW.indexOf(o.status) >= 0 && o.status !== "Delivered" && <button onClick={() => advance(o.id)} className={`${mono} bg-black px-3 py-1.5 text-[9px] font-bold tracking-wider text-white hover:bg-neutral-700`}>→ {FLOW[FLOW.indexOf(o.status) + 1]}</button>}
                        {o.status === "Delivered" && <button onClick={() => markReturn(o.id)} className={`${mono} border border-black px-3 py-1.5 text-[9px] font-bold tracking-wider hover:bg-neutral-200`}>Log return</button>}
                      </td>
                    </tr>
                  ))}
                  {shown.length === 0 && <tr><td colSpan={8} className={`${mono} py-10 text-center text-[11px] text-neutral-500`}>No orders match.</td></tr>}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {tab === "Inventory" && (
          <div className="space-y-5">
            {lowStock.length > 0 && (
              <div className="border-2 border-red-700 bg-red-50 p-4">
                <p className={`${mono} text-[11px] font-bold tracking-[0.15em] text-red-700`}>{lowStock.length} stock alerts</p>
                <p className="mt-1 text-sm">{lowStock.slice(0, 6).map(({ p, s, v }) => `${p.name} (${s}: ${v})`).join(" · ")}</p>
              </div>
            )}
            <Panel title="Stock by size" kicker="Tiruppur warehouse">
              <div className="space-y-6">
                {products.map((p) => (
                  <div key={p.sku} className="border-b border-black/10 pb-6 last:border-0 last:pb-0">
                    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-[15px] font-extrabold uppercase">{p.name} <span className={`${mono} ml-2 text-[10px] font-normal text-neutral-500`}>{p.sku}</span></h3>
                      <span className={`${mono} text-[10px] font-bold tracking-wider`}>{stockOf(p)} units · {p.sold} sold</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                      {visibleSizes(p).map(([s, v]) => {
                        const low = v <= p.threshold;
                        return (
                          <div key={s} className={`border p-3 ${v === 0 ? "border-red-700 bg-red-50" : low ? "border-amber-500 bg-amber-50" : "border-black/15"}`}>
                            <div className={`${mono} flex justify-between text-[10px] font-bold`}><span>{s}</span><span>{v}</span></div>
                            <div className="my-2 h-1.5 bg-neutral-200"><div className={`h-full ${v === 0 ? "bg-red-700" : low ? "bg-amber-500" : "bg-black"}`} style={{ width: `${Math.min(100, (v / (p.threshold * 3)) * 100)}%` }} /></div>
                            <button onClick={() => restock(p.sku, s)} className={`${mono} w-full border border-black py-1 text-[9px] font-bold tracking-wider hover:bg-black hover:text-white`}>+10 restock</button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}

        {tab === "Drops & Promos" && (
          <div className="grid gap-5 xl:grid-cols-2">
            <Panel title="Drop 04 tracker" kicker="Limit: 150 pcs / design">
              <div className="space-y-5">
                {products.slice(0, 4).map((p, i) => {
                  const sold = [138, 112, 97, 74][i];
                  return (
                    <div key={p.sku}>
                      <div className={`${mono} mb-1 flex justify-between text-[10px] font-bold tracking-wider`}><span className="truncate pr-3">{p.name}</span><span>{sold}/150</span></div>
                      <div className="h-4 bg-neutral-200"><div className={`h-full ${sold > 130 ? "bg-red-700" : "bg-black"}`} style={{ width: `${(sold / 150) * 100}%` }} /></div>
                      {sold > 130 && <p className={`${mono} mt-1 text-[9px] text-red-700`}>Near sell-out — close the drop</p>}
                    </div>
                  );
                })}
              </div>
            </Panel>
            <Panel title="Promo codes" kicker="Redemptions">
              <ul className="space-y-4">
                {promos.map((c) => (
                  <li key={c.code} className="border border-black/15 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div><p className={`${disp} text-xl leading-none`}>{c.code}</p><p className="mt-1 text-sm text-neutral-600">{c.desc}</p></div>
                      <button onClick={() => setPromos((ps) => ps.map((x) => (x.code === c.code ? { ...x, on: !x.on } : x)))} aria-pressed={c.on} className={`${mono} min-w-16 px-3 py-1.5 text-[10px] font-bold tracking-wider ${c.on ? "bg-black text-white" : "border border-black"}`}>{c.on ? "Live" : "Paused"}</button>
                    </div>
                    <div className="mt-3 h-2 bg-neutral-200"><div className="h-full bg-black" style={{ width: `${(c.used / c.cap) * 100}%` }} /></div>
                    <p className={`${mono} mt-1 text-[10px] text-neutral-500`}>{c.used} / {c.cap} used</p>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        )}
      </main>
    </div>
  );
}
