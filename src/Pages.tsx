import { useState } from "react";

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
const looks = [
  ["99450.png", "Look 01", "Tee, Night shift", "tall"],
  ["ce1cd.png", "Look 02", "Charcoal heavy hoodie", "wide"],
  ["f1497.png", "Look 03", "Thalaivar tribute", "tall"],
  ["37da8.png", "Look 04", "Five-panel, Royapettah", "tall"],
  ["9bdff.png", "Look 05", "Madras noir wash", "wide"],
  ["79b1c.png", "Look 06", "Retro club", "tall"],
  ["237a4.png", "Look 07", "Canvas carry", "tall"],
  ["2e222.png", "Look 08", "Monogram, close", "wide"],
] as const;

export function Lookbook() {
  return (
    <>
      <Head kicker="Season 01 // Shot on North Chennai streets" title="Lookbook 2026" note="Eight looks. Hoardings, tea stalls, rain-slick asphalt and the people who wear it all." />
      <Block>
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {looks.map(([img, n, t, shape]) => (
            <figure key={n} className="group mb-5 break-inside-avoid">
              <div className={`relative overflow-hidden bg-neutral-200 ${shape === "tall" ? "aspect-[3/4]" : "aspect-[4/3]"}`}>
                <img src={A(img)} alt={`${n}: ${t}`} className="absolute inset-0 size-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0" />
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
const STEPS = ["Placed", "Printing", "Packed", "Shipped", "Delivered"];
const NOTES = ["Order confirmed", "Graphics being screen-printed", "Packed at Chennai studio", "With courier, on the way", "Delivered to your door"];

export function TrackOrder() {
  const [id, setId] = useState("");
  const [phone, setPhone] = useState("");
  const [res, setRes] = useState<null | { id: string; step: number } | "bad">(null);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = id.trim().toUpperCase();
    if (!/^VNK-\d{3,6}$/.test(clean) || phone.replace(/\D/g, "").length < 10) { setRes("bad"); return; }
    const n = clean.split("-")[1].split("").reduce((a, c) => a + Number(c), 0);
    setRes({ id: clean, step: n % 5 });
  };
  const field = "w-full border border-black bg-white px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-black";
  return (
    <>
      <Head kicker="Assistance // Shipment status" title="Track order" note="Enter the reference from your confirmation, for example VNK-2480." />
      <Block>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
          <form onSubmit={submit} className="space-y-4 self-start border-2 border-black p-6">
            <label className="block"><span className={`${mono} mb-2 block text-[10px] font-bold tracking-[0.15em]`}>Order reference</span>
              <input value={id} onChange={(e) => setId(e.target.value)} placeholder="VNK-2480" className={field} /></label>
            <label className="block"><span className={`${mono} mb-2 block text-[10px] font-bold tracking-[0.15em]`}>Phone used at checkout</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="98765 43210" className={field} /></label>
            <button className={`${mono} w-full bg-black py-4 text-[11px] font-bold tracking-[0.15em] text-white transition hover:bg-neutral-800`}>Track</button>
            {res === "bad" && <p role="alert" className={`${mono} text-[10px] tracking-[0.1em] text-red-700`}>Check the reference (VNK-####) and a 10 digit phone number.</p>}
          </form>
          <div>
            {res && res !== "bad" ? (
              <div>
                <p className={`${mono} text-[10px] tracking-[0.2em] text-neutral-500`}>Reference</p>
                <h2 className={`${disp} text-5xl leading-none`}>{res.id}</h2>
                <p className={`${mono} mt-3 inline-block bg-black px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] text-white`}>{STEPS[res.step]}</p>
                <ol className="mt-8 border-l-2 border-black/15">
                  {STEPS.map((s, i) => (
                    <li key={s} className="relative pb-7 pl-8">
                      <span className={`absolute -left-[9px] top-0.5 size-4 border-2 border-black ${i <= res.step ? "bg-black" : "bg-white"}`} />
                      <p className={`${mono} text-xs font-bold tracking-[0.15em] ${i > res.step ? "text-neutral-400" : ""}`}>{s}</p>
                      <p className={`text-sm ${i > res.step ? "text-neutral-300" : "text-neutral-600"}`}>{NOTES[i]}</p>
                    </li>
                  ))}
                </ol>
                <p className={`${mono} text-[10px] tracking-[0.15em] text-neutral-500`}>Demo tracking. Live courier updates arrive once orders are connected to a backend.</p>
              </div>
            ) : (
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
const zones = [
  ["Chennai metro", "1-2 days", "₹49", "Free over ₹999"],
  ["Tamil Nadu, Kerala, Karnataka", "2-4 days", "₹79", "Free over ₹999"],
  ["Maharashtra, Telangana, Delhi NCR", "3-5 days", "₹79", "Free over ₹999"],
  ["Rest of India", "5-8 days", "₹99", "Free over ₹999"],
  ["North-East & J&K", "7-10 days", "₹149", "Free over ₹1,999"],
];

export function Shipping() {
  return (
    <>
      <Head kicker="Assistance // Domestic only" title="Domestic shipping" note="Pan-India delivery from our Chennai studio. International shipping is not available yet." />
      <Block>
        <div className="mb-14 grid gap-px bg-black/10 sm:grid-cols-3">
          {[["24h", "Dispatch time", "Orders placed before 4 PM leave the studio the same working day."], ["₹999", "Free shipping", "Cart value above this ships free to most of India."], ["COD", "Cash on delivery", "Available pan-India with a ₹40 handling fee."]].map(([n, t, d]) => (
            <div key={t} className="bg-white p-6"><p className={`${disp} text-6xl leading-none`}>{n}</p><p className={`${mono} mt-3 text-[11px] font-bold tracking-[0.15em]`}>{t}</p><p className="mt-2 text-sm text-neutral-600">{d}</p></div>
          ))}
        </div>
        <div className="overflow-x-auto border border-black/15">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead><tr className={`${mono} border-b-2 border-black text-[10px] tracking-[0.15em]`}>{["Zone", "Delivery", "Shipping fee", "Free shipping"].map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr></thead>
            <tbody>{zones.map((z) => <tr key={z[0]} className="border-b border-black/10 last:border-0">{z.map((c, i) => <td key={i} className={`px-5 py-4 ${i === 0 ? "font-bold" : ""}`}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <p className={`${mono} mt-4 text-[10px] tracking-[0.15em] text-neutral-500`}>Delivery windows are estimates from dispatch and exclude Sundays, public holidays and monsoon delays. Rates shown are sample values.</p>
        <div className="mt-6"><a href={go("/track")} className={`${mono} inline-block bg-black px-6 py-3.5 text-[11px] font-bold tracking-[0.15em] text-white`}>Track an order</a></div>
      </Block>
      <Help />
    </>
  );
}

/* ---------- Returns ---------- */
export function Returns() {
  const [sent, setSent] = useState(false);
  const [type, setType] = useState("Exchange");
  const field = "w-full border border-black bg-white px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-black";
  return (
    <>
      <Head kicker="Assistance // 7 day window" title="Returns & exchange" note="Unworn, unwashed, tags on. Start a request below and we send a pickup." />
      <Block>
        <div className="grid gap-px bg-black/10 md:grid-cols-4">
          {[["01", "Request", "Share your order reference and the piece."], ["02", "Pickup", "Courier collects within 2 working days."], ["03", "Inspection", "We check the piece at the studio."], ["04", "Resolved", "New size ships or refund lands in 3-5 days."]].map(([n, t, d]) => (
            <div key={n} className="bg-white p-6"><span className={`${disp} text-4xl`}>{n}</span><h3 className={`${mono} mt-2 text-xs font-bold tracking-[0.15em]`}>{t}</h3><p className="mt-2 text-sm text-neutral-600">{d}</p></div>
          ))}
        </div>
        <div className="mt-14 grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className={`${disp} mb-5 text-4xl leading-none`}>The rules</h2>
            <ul className="space-y-3 text-sm leading-relaxed text-neutral-700">
              {["Return or exchange within 7 days of delivery.", "First size exchange is free. Further ones cost ₹79 shipping.", "Refunds go to the original payment method. COD refunds go to UPI or bank.", "Drop pieces and customised items are exchange-only.", "Sale items can be exchanged, not refunded.", "Worn, washed or altered pieces cannot be accepted."].map((t) => <li key={t} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 bg-black" />{t}</li>)}
            </ul>
          </div>
          {sent ? (
            <div className="self-start border-2 border-black p-8" role="status">
              <h2 className={`${disp} text-4xl leading-none`}>Request received</h2>
              <p className="mt-3 text-sm text-neutral-700">We will email you a pickup slot within one working day. Demo only: nothing is stored yet.</p>
              <button onClick={() => setSent(false)} className={`${mono} mt-6 border border-black px-5 py-3 text-[11px] font-bold tracking-[0.15em] hover:bg-black hover:text-white`}>New request</button>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4 self-start border-2 border-black p-6">
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Request type">
                {["Exchange", "Return"].map((t) => <button type="button" key={t} role="radio" aria-checked={type === t} onClick={() => setType(t)} className={`${mono} border border-black py-3 text-[11px] font-bold tracking-wider ${type === t ? "bg-black text-white" : "hover:bg-neutral-200"}`}>{t}</button>)}
              </div>
              <input required placeholder="Order reference (VNK-2480)" className={field} />
              <input required type="email" placeholder="Email" className={field} />
              <textarea required rows={3} placeholder={type === "Exchange" ? "Which size do you need instead?" : "Reason for return"} className={field} />
              <button className={`${mono} w-full bg-black py-4 text-[11px] font-bold tracking-[0.15em] text-white hover:bg-neutral-800`}>Submit {type.toLowerCase()} request</button>
            </form>
          )}
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
