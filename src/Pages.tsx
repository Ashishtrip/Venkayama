import { useState } from "react";
import Cooking from "./components/Cooking";
import { actions, exchangeOnly, FLOW, getDB, imgSrc, itemsText, returnEligibility, RFLOW, rLabel, RNOTES, useDB, type Order, type ReturnReq, type RStatus } from "./store";

const mono = "font-mono uppercase";
const disp = "font-display uppercase";
const A = (f: string) => `/assets/${f}`;
const go = (p: string) => `#${p}`;

function Head({ kicker, title, note }: { kicker: string; title: string; note?: string }) {
  return (
    <section className="border-b border-black/10 bg-gradient-to-b from-neutral-100/70 to-white px-6 pb-12 pt-[150px]">
      <div className="mx-auto max-w-[1500px]">
        <p className={`${mono} mb-3 text-[10px] tracking-[0.25em] text-neutral-500`}>{kicker}</p>
        <h1 className={`${disp} text-[clamp(3.5rem,10vw,9rem)] leading-[0.88]`}>{title}</h1>
        {note && <p className={`${mono} mt-5 max-w-xl text-[11px] tracking-[0.15em] text-neutral-600`}>{note}</p>}
      </div>
    </section>
  );
}

const Block = ({ children, tone = "white" }: { children: React.ReactNode; tone?: "white" | "grey" | "black" }) => (
  <section className={`px-6 py-16 ${tone === "grey" ? "bg-neutral-50" : tone === "black" ? "bg-black text-white" : ""}`}>
    <div className="mx-auto max-w-[1500px]">{children}</div>
  </section>
);

const Help = () => (
  <Block tone="black">
    <div className="flex flex-wrap items-center justify-between gap-6">
      <h2 className={`${disp} text-4xl leading-none md:text-6xl`}>Still stuck? Talk to us</h2>
      <a href="mailto:care@venkayam.in" className={`${mono} bg-white px-6 py-3.5 text-[11px] font-bold tracking-[0.15em] text-black`}>care@venkayam.in</a>
    </div>
  </Block>
);

/* ---------- Lookbook ---------- */
export function Lookbook() {
  const looks = useDB((d) => d.looks);
  return (
    <>
      <Head kicker="Season 01 // Shot on North Chennai streets" title="Lookbook 2026" note="Eight looks. Hoardings, tea stalls, rain-slick asphalt and the people who wear it all." />
      <Block>
        {!looks.length && <Cooking />}
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {looks.map(({ id, img, label: n, title: t, shape }) => (
            <figure key={id} className="group mb-5 break-inside-avoid">
              <div className={`relative overflow-hidden bg-neutral-200 ${shape === "tall" ? "aspect-[3/4]" : "aspect-[4/3]"}`}>
                <img src={imgSrc(img)} alt={`${n}: ${t}`} className="absolute inset-0 size-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0" />
              </div>
              <figcaption className={`${mono} mt-3 flex justify-between text-[10px] tracking-[0.15em]`}>
                <span className="font-bold">{n}</span><span className="text-neutral-500">{t}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Block>
      <Block tone="black">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className={`${disp} text-[clamp(2.5rem,7vw,6rem)] leading-[0.9]`}>Wear what you<br />just saw</h2>
          <a href={go("/shop")} className={`${mono} bg-white px-6 py-3.5 text-[11px] font-bold tracking-[0.15em] text-black`}>Shop the archive</a>
        </div>
      </Block>
    </>
  );
}

/* ---------- Track order ---------- */
const STEPS: string[] = FLOW;
const NOTES = ["Order confirmed", "Graphics being screen-printed", "Packed at Chennai studio", "With courier, on the way", "Delivered to your door"];

export function TrackOrder() {
  const [id, setId] = useState("");
  const [phone, setPhone] = useState("");
  const [res, setRes] = useState<null | Order | "bad" | "none">(null);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = id.trim().toUpperCase();
    if (!/^(VNK-\d{3,6}|[0-9A-F]{10})$/.test(clean) || phone.replace(/\D/g, "").length < 10) { setRes("bad"); return; }
    const o = getDB().orders.find((x) => x.id === clean || x.track === clean);
    const digits = (v: string) => v.replace(/\D/g, "").slice(-10);
    setRes(o && (!o.phone || digits(o.phone) === digits(phone)) ? o : "none");
  };
  const field = "w-full border border-black bg-white px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-black";
  return (
    <>
      <Head kicker="Assistance // Shipment status" title="Track order" note="Enter the tracking code from your confirmation." />
      <Block>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
          <form onSubmit={submit} className="space-y-4 self-start border-2 border-black p-6">
            <label className="block"><span className={`${mono} mb-2 block text-[10px] font-bold tracking-[0.15em]`}>Order reference</span>
              <input value={id} onChange={(e) => setId(e.target.value)} placeholder="Tracking code, e.g. 3FA91C07BE" className={field} /></label>
            <label className="block"><span className={`${mono} mb-2 block text-[10px] font-bold tracking-[0.15em]`}>Phone used at checkout</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="98765 43210" className={field} /></label>
            <button className={`${mono} w-full bg-black py-4 text-[11px] font-bold tracking-[0.15em] text-white transition hover:bg-neutral-800`}>Track</button>
            {res === "bad" && <p role="alert" className={`${mono} text-[10px] tracking-[0.1em] text-red-700`}>Check the tracking code (10 hex characters) and a 10 digit phone number.</p>}
            {res === "none" && <p role="alert" className={`${mono} text-[10px] tracking-[0.1em] text-red-700`}>No order found for that reference and phone number.</p>}
          </form>
          <div>
            {res && res !== "bad" && res !== "none" ? (() => {
              const step = FLOW.indexOf(res.status);
              return (
              <div>
                <p className={`${mono} text-[10px] tracking-[0.2em] text-neutral-500`}>Reference</p>
                <h2 className={`${disp} text-5xl leading-none`}>{res.id}</h2>
                <p className={`${mono} mt-3 inline-block bg-black px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] text-white`}>{res.status}</p>
                <p className="mt-4 text-sm text-neutral-700">{itemsText(res)}</p>
                <p className={`${mono} mt-1 text-[10px] tracking-[0.15em] text-neutral-500`}>Placed {new Date(res.createdAt).toLocaleString("en-IN")}</p>
                {res.status === "Returned" ? <p className={`${mono} mt-8 border-2 border-black p-4 text-[11px] tracking-[0.15em]`}>This order was returned. Refunds take 3-5 working days.</p> : (
                <ol className="mt-8 border-l-2 border-black/15">
                  {STEPS.map((s, i) => (
                    <li key={s} className="relative pb-7 pl-8">
                      <span className={`absolute -left-[9px] top-0.5 size-4 border-2 border-black ${i <= step ? "bg-black" : "bg-white"}`} />
                      <p className={`${mono} text-xs font-bold tracking-[0.15em] ${i > step ? "text-neutral-400" : ""}`}>{s}</p>
                      <p className={`text-sm ${i > step ? "text-neutral-300" : "text-neutral-600"}`}>{NOTES[i]}</p>
                    </li>
                  ))}
                </ol>)}
                {(getDB().returns ?? []).filter((r) => r.orderId === res.id).map((r) => <div key={r.id} className="mt-8 border-2 border-black p-5"><ReturnTimeline r={r} /></div>)}
              </div>
              );
            })() : (
              <div className="flex h-full min-h-60 items-center justify-center border border-dashed border-black/25 p-10 text-center">
                <p className={`${mono} text-[11px] tracking-[0.2em] text-neutral-500`}>Your shipment timeline appears here</p>
              </div>
            )}
          </div>
        </div>
      </Block>
      <Help />
    </>
  );
}

/* ---------- Shipping ---------- */
export function Shipping() {
  const zones = useDB((d) => d.zones);
  const st = useDB((d) => d.settings);
  return (
    <>
      <Head kicker="Assistance // Domestic only" title="Domestic shipping" note="Pan-India delivery from our Chennai studio. International shipping is not available yet." />
      <Block>
        <div className="mb-14 grid gap-px bg-black/10 sm:grid-cols-3">
          {[["24h", "Dispatch time", "Orders placed before 4 PM leave the studio the same working day."], [`₹${st.freeShip.toLocaleString("en-IN")}`, "Free shipping", "Cart value above this ships free to most of India."], ["UPI", "Secure payment", "Pay by UPI or card at checkout. Cash on delivery is not offered."]].map(([n, t, d]) => (
            <div key={t} className="bg-white p-6"><p className={`${disp} text-6xl leading-none`}>{n}</p><p className={`${mono} mt-3 text-[11px] font-bold tracking-[0.15em]`}>{t}</p><p className="mt-2 text-sm text-neutral-600">{d}</p></div>
          ))}
        </div>
        <div className="overflow-x-auto border border-black/15">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead><tr className={`${mono} border-b-2 border-black text-[10px] tracking-[0.15em]`}>{["Zone", "Delivery", "Shipping fee", "Free shipping"].map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr></thead>
            <tbody>{zones.map((z) => <tr key={z.id} className="border-b border-black/10 last:border-0"><td className="px-5 py-4 font-bold">{z.name}</td><td className="px-5 py-4">{z.days}</td><td className="px-5 py-4">₹{z.fee}</td><td className="px-5 py-4">Free over ₹{z.freeAbove.toLocaleString("en-IN")}</td></tr>)}</tbody>
          </table>
        </div>
        <p className={`${mono} mt-4 text-[10px] tracking-[0.15em] text-neutral-500`}>Delivery windows are estimates from dispatch and exclude Sundays, public holidays and monsoon delays.</p>
        <div className="mt-6"><a href={go("/track")} className={`${mono} inline-block bg-black px-6 py-3.5 text-[11px] font-bold tracking-[0.15em] text-white`}>Track an order</a></div>
      </Block>
      <Help />
    </>
  );
}

/* ---------- Returns ---------- */
const digits10 = (v: string) => v.replace(/\D/g, "").slice(-10);
const fieldCls = "w-full border border-black bg-white px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-black";
const REASONS = ["Size does not fit", "Received wrong piece", "Print or fabric defect", "Damaged in transit", "Not as expected", "Changed my mind"];

export function ReturnTimeline({ r }: { r: ReturnReq }) {
  const rejected = r.status === "Rejected";
  const step = RFLOW.indexOf(r.status);
  const at = (s: RStatus) => r.history.find((h) => h.s === s);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h3 className={`${disp} text-4xl leading-none`}>{r.id}</h3>
        <span className={`${mono} px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] text-white ${rejected ? "bg-red-700" : "bg-black"}`}>{rLabel(r.status, r.type)}</span>
      </div>
      <p className={`${mono} mt-3 text-[10px] tracking-[0.15em] text-neutral-500`}>{r.type} · Order {r.orderId} · {new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
      <p className="mt-2 text-sm text-neutral-700">{r.item.name} ({r.item.size}){r.type === "Exchange" && r.newSize ? ` → size ${r.newSize}` : ""}{r.item.qty > 1 ? ` ×${r.item.qty}` : ""}</p>
      {r.courier && <p className={`${mono} mt-2 text-[10px] tracking-[0.15em]`}>Courier ref {r.courier}</p>}
      {rejected ? (
        <p className={`${mono} mt-6 border-2 border-red-700 p-4 text-[11px] tracking-[0.12em] text-red-700`}>{at("Rejected")?.note || "This request could not be accepted."} Write to care@venkayam.in for help.</p>
      ) : (
        <ol className="mt-6 border-l-2 border-black/15">
          {RFLOW.map((s, i) => (
            <li key={s} className="relative pb-6 pl-8">
              <span className={`absolute -left-[9px] top-0.5 size-4 border-2 border-black ${i <= step ? "bg-black" : "bg-white"}`} />
              <p className={`${mono} text-xs font-bold tracking-[0.15em] ${i > step ? "text-neutral-400" : ""}`}>{rLabel(s, r.type)}</p>
              <p className={`text-sm ${i > step ? "text-neutral-300" : "text-neutral-600"}`}>
                {s === "Resolved" ? (r.type === "Return" ? "Refund sent to the original payment method in 3-5 days" : "New size dispatched from the studio") : RNOTES[s]}
                {at(s) && <span className={`${mono} ml-2 text-[10px] text-neutral-500`}>{new Date(at(s)!.t).toLocaleDateString("en-IN")}</span>}
              </p>
              {at(s)?.note && <p className="mt-0.5 text-xs text-neutral-500">{at(s)!.note}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function StartRequest() {
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [err, setErr] = useState("");
  const [idx, setIdx] = useState(0);
  const [type, setType] = useState<"Return" | "Exchange">("Exchange");
  const [newSize, setNewSize] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState<ReturnReq | null>(null);
  const products = useDB((d) => d.products);
  useDB((d) => d.returns);

  const lookup = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    const o = getDB().orders.find((x) => x.track === clean || x.id === clean);
    if (!o || phone.replace(/\D/g, "").length < 10 || (o.phone && digits10(o.phone) !== digits10(phone))) { setErr("No order found for that tracking code and phone number."); return; }
    setErr(""); setOrder(o); setIdx(0); setNewSize("");
  };
  const item = order?.items[idx];
  const block = order && item ? returnEligibility(order, item) : "";
  const xOnly = item ? exchangeOnly(item) : false;
  const effType = xOnly ? "Exchange" : type;
  const prod = item ? products.find((p) => p.name === item.name) : undefined;
  const sizeOpts = prod ? Object.entries(prod.sizes).filter(([s, n]) => s !== item?.size && n >= (item?.qty ?? 1)) : [];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !item || block) return;
    if (effType === "Exchange" && !newSize) { setErr("Choose the size you want instead."); return; }
    setErr("");
    setDone(actions.requestReturn({ order, item, type: effType, newSize, reason, comment: comment.trim() }));
  };
  const reset = () => { setDone(null); setOrder(null); setCode(""); setPhone(""); setComment(""); setNewSize(""); };

  if (done) return (
    <div className="self-start border-2 border-black p-8" role="status">
      <p className={`${mono} text-[10px] tracking-[0.2em] text-neutral-500`}>{done.type} request received</p>
      <h2 className={`${disp} mt-1 text-5xl leading-none`}>{done.id}</h2>
      <p className="mt-3 text-sm text-neutral-700">Save this ID. We review within one working day and then schedule a pickup. Follow progress under Check status.</p>
      <button onClick={reset} className={`${mono} mt-6 border border-black px-5 py-3 text-[11px] font-bold tracking-[0.15em] hover:bg-black hover:text-white`}>New request</button>
    </div>
  );
  if (!order) return (
    <form onSubmit={lookup} className="space-y-4 self-start border-2 border-black p-6">
      <input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="Tracking code, e.g. 3FA91C07BE" aria-label="Tracking code" className={fieldCls} />
      <input required value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="Phone used at checkout" aria-label="Phone" className={fieldCls} />
      <button className={`${mono} w-full bg-black py-4 text-[11px] font-bold tracking-[0.15em] text-white hover:bg-neutral-800`}>Find my order</button>
      {err && <p role="alert" className={`${mono} text-[10px] tracking-[0.1em] text-red-700`}>{err}</p>}
    </form>
  );
  return (
    <form onSubmit={submit} className="space-y-4 self-start border-2 border-black p-6">
      <div className="flex items-center justify-between"><p className={`${mono} text-[10px] font-bold tracking-[0.15em]`}>Order {order.id}</p><button type="button" onClick={() => setOrder(null)} className={`${mono} text-[10px] underline`}>Change</button></div>
      <fieldset className="space-y-2"><legend className={`${mono} mb-2 text-[10px] font-bold tracking-[0.15em]`}>Which piece</legend>
        {order.items.map((it, i) => {
          const b = returnEligibility(order, it);
          return (
            <label key={i} className={`flex cursor-pointer items-start gap-3 border p-3 text-sm ${idx === i ? "border-black bg-neutral-100" : "border-black/20"}`}>
              <input type="radio" name="piece" checked={idx === i} onChange={() => { setIdx(i); setNewSize(""); }} className="mt-1 accent-black" />
              <span><b>{it.name}</b> ({it.size}) ×{it.qty}{b && <span className={`${mono} mt-1 block text-[10px] tracking-[0.1em] text-red-700`}>{b}</span>}</span>
            </label>
          );
        })}
      </fieldset>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Request type">
        {(["Exchange", "Return"] as const).map((t) => (
          <button type="button" key={t} role="radio" aria-checked={effType === t} disabled={t === "Return" && xOnly} onClick={() => setType(t)} className={`${mono} border border-black py-3 text-[11px] font-bold tracking-wider disabled:cursor-not-allowed disabled:opacity-30 ${effType === t ? "bg-black text-white" : "hover:bg-neutral-200"}`}>{t}</button>
        ))}
      </div>
      {xOnly && <p className={`${mono} text-[10px] tracking-[0.1em] text-neutral-500`}>Drop and sale pieces are exchange-only.</p>}
      {effType === "Exchange" && (
        sizeOpts.length ? (
          <select value={newSize} onChange={(e) => setNewSize(e.target.value)} aria-label="New size" className={fieldCls}>
            <option value="">New size</option>
            {sizeOpts.map(([s]) => <option key={s} value={s}>{s}</option>)}
          </select>
        ) : <p className={`${mono} text-[10px] tracking-[0.1em] text-red-700`}>No other size is in stock for this piece. Choose Return instead{xOnly ? " is unavailable, write to care@venkayam.in" : ""}.</p>
      )}
      <select value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason" className={fieldCls}>{REASONS.map((r) => <option key={r}>{r}</option>)}</select>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Anything we should know (optional)" className={fieldCls} />
      <button disabled={!!block || (effType === "Exchange" && !sizeOpts.length)} className={`${mono} w-full bg-black py-4 text-[11px] font-bold tracking-[0.15em] text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40`}>Submit {effType.toLowerCase()} request</button>
      {(block || err) && <p role="alert" className={`${mono} text-[10px] tracking-[0.1em] text-red-700`}>{block || err}</p>}
    </form>
  );
}

function ReturnStatus() {
  const [id, setId] = useState("");
  const [phone, setPhone] = useState("");
  const [res, setRes] = useState<null | ReturnReq | "none">(null);
  const rs = useDB((d) => d.returns ?? []);
  const live = res && res !== "none" ? rs.find((x) => x.id === res.id) ?? res : res;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = rs.find((x) => x.id === id.trim().toUpperCase());
    setRes(r && (!r.phone || digits10(r.phone) === digits10(phone)) ? r : "none");
  };
  return (
    <div className="space-y-6 self-start">
      <form onSubmit={submit} className="space-y-4 border-2 border-black p-6">
        <input required value={id} onChange={(e) => setId(e.target.value)} placeholder="Request ID, e.g. RET-1001" aria-label="Request ID" className={fieldCls} />
        <input required value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="Phone used at checkout" aria-label="Phone" className={fieldCls} />
        <button className={`${mono} w-full bg-black py-4 text-[11px] font-bold tracking-[0.15em] text-white hover:bg-neutral-800`}>Check status</button>
        {res === "none" && <p role="alert" className={`${mono} text-[10px] tracking-[0.1em] text-red-700`}>No request found for that ID and phone number.</p>}
      </form>
      {live && live !== "none" && <div className="border-2 border-black p-6"><ReturnTimeline r={live} /></div>}
    </div>
  );
}

export function Returns() {
  const [tab, setTab] = useState<"start" | "status">("start");
  return (
    <>
      <Head kicker="Assistance // 7 day window" title="Returns & exchange" note="Unworn, unwashed, tags on. Start a request below and we send a pickup." />
      <Block>
        <div className="grid gap-px bg-black/10 md:grid-cols-4">
          {[["01", "Request", "Share your tracking code and the piece."], ["02", "Pickup", "Courier collects within 2 working days."], ["03", "Inspection", "We check the piece at the studio."], ["04", "Resolved", "New size ships or refund lands in 3-5 days."]].map(([n, t, d]) => (
            <div key={n} className="bg-white p-6"><span className={`${disp} text-4xl`}>{n}</span><h3 className={`${mono} mt-2 text-xs font-bold tracking-[0.15em]`}>{t}</h3><p className="mt-2 text-sm text-neutral-600">{d}</p></div>
          ))}
        </div>
        <div className="mt-14 grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className={`${disp} mb-5 text-4xl leading-none`}>The rules</h2>
            <ul className="space-y-3 text-sm leading-relaxed text-neutral-700">
              {["Return or exchange within 7 days of delivery.", "First size exchange is free. Further ones cost ₹79 shipping.", "Refunds go to the original payment method.", "Drop pieces and customised items are exchange-only.", "Sale items can be exchanged, not refunded.", "Worn, washed or altered pieces cannot be accepted."].map((t) => <li key={t} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 bg-black" />{t}</li>)}
            </ul>
          </div>
          <div>
            <div className="mb-4 grid grid-cols-2 gap-2" role="tablist">
              {([["start", "Start a request"], ["status", "Check status"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`${mono} border border-black py-3 text-[11px] font-bold tracking-wider ${tab === k ? "bg-black text-white" : "hover:bg-neutral-200"}`}>{l}</button>)}
            </div>
            {tab === "start" ? <StartRequest /> : <ReturnStatus />}
          </div>
        </div>
      </Block>
      <Help />
    </>
  );
}

/* ---------- Size matrix ---------- */
const CHARTS: Record<string, { cols: string[]; rows: [string, ...number[]][]; note: string }> = {
  "Oversized tees": { cols: ["Chest", "Length", "Shoulder", "Sleeve"], note: "Boxy, dropped shoulder. Size down one for a regular fit.", rows: [["S", 112, 70, 51, 22], ["M", 116, 72, 53, 23], ["L", 120, 74, 55, 24], ["XL", 124, 76, 57, 25], ["XXL", 128, 78, 59, 26]] },
  Hoodies: { cols: ["Chest", "Length", "Shoulder", "Sleeve"], note: "Relaxed and slightly cropped. Size up for a longer drape.", rows: [["S", 114, 66, 52, 60], ["M", 118, 68, 54, 61], ["L", 122, 70, 56, 62], ["XL", 126, 72, 58, 63]] },
  Caps: { cols: ["Circumference"], note: "One size, adjustable brass buckle.", rows: [["One size", 62]] },
};

export function SizeMatrix() {
  const [tab, setTab] = useState("Oversized tees");
  const [inch, setInch] = useState(false);
  const c = CHARTS[tab];
  const v = (n: number) => (inch ? (n / 2.54).toFixed(1) : String(n));
  return (
    <>
      <Head kicker="Assistance // Garment measurements" title="Size matrix" note="Measured flat across the garment, shown for the full body. Allow 1-2 cm tolerance." />
      <Block>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2" role="tablist">
            {Object.keys(CHARTS).map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`${mono} border border-black px-4 py-2.5 text-[11px] font-bold tracking-wider ${tab === t ? "bg-black text-white" : "hover:bg-neutral-200"}`}>{t}</button>)}
          </div>
          <div className="flex border border-black" role="group" aria-label="Units">
            {[["cm", false], ["in", true]].map(([l, val]) => <button key={String(l)} aria-pressed={inch === val} onClick={() => setInch(val as boolean)} className={`${mono} px-4 py-2.5 text-[11px] font-bold ${inch === val ? "bg-black text-white" : "hover:bg-neutral-200"}`}>{l}</button>)}
          </div>
        </div>
        <div className="overflow-x-auto border border-black/15">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead><tr className={`${mono} border-b-2 border-black text-[10px] tracking-[0.15em]`}><th className="px-5 py-3">Size</th>{c.cols.map((h) => <th key={h} className="px-5 py-3">{h} ({inch ? "in" : "cm"})</th>)}</tr></thead>
            <tbody>{c.rows.map(([s, ...vals]) => <tr key={s} className="border-b border-black/10 last:border-0"><td className={`${disp} px-5 py-4 text-xl`}>{s}</td>{vals.map((n, i) => <td key={i} className={`${mono} px-5 py-4 tabular-nums`}>{v(n)}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <p className={`${mono} mt-4 text-[10px] tracking-[0.15em] text-neutral-500`}>{c.note}</p>
      </Block>
      <Block tone="grey">
        <h2 className={`${disp} mb-8 text-4xl leading-none md:text-5xl`}>How to measure</h2>
        <div className="grid gap-px bg-black/10 md:grid-cols-4">
          {[["Chest", "Lay the piece flat and measure edge to edge under the arms, then double it."], ["Length", "From the highest point of the shoulder seam straight down to the hem."], ["Shoulder", "Across the back from one shoulder seam to the other."], ["Sleeve", "From the shoulder seam to the end of the cuff."]].map(([t, d]) => (
            <div key={t} className="bg-white p-6"><h3 className={`${mono} text-xs font-bold tracking-[0.15em]`}>{t}</h3><p className="mt-2 text-sm text-neutral-600">{d}</p></div>
          ))}
        </div>
        <p className="mt-8 text-sm text-neutral-700">Between sizes? Our model is 5&prime;10&Prime; and wears a Medium tee and a Large hoodie. Need an exchange? <a href={go("/returns")} className="font-bold underline">Start one here</a>.</p>
      </Block>
      <Help />
    </>
  );
}
