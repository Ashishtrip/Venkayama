import { useEffect, useState } from "react";
import OnionLogo from "./components/OnionLogo";
import AdminGate from "./AdminGate";
import { Lookbook, TrackOrder, Shipping, Returns, SizeMatrix } from "./Pages";
import { CartProvider, useCart } from "./Cart";

const A = (f: string) => `/assets/${f}`;
const mono = "font-mono uppercase";
const disp = "font-display uppercase";

const nav = [["Home", "/"], ["Shop", "/shop"], ["Drops", "/drops"], ["About", "/about"]] as const;

const go = (path: string) => `#${path}`;

const trust = [
  [A("c7929.svg"), "FREE SHIPPING", "ON ORDERS ABOVE ₹999"],
  [A("3d926.svg"), "EASY RETURNS", "7 DAYS RETURN POLICY"],
  [A("6221c.svg"), "280+ GSM COTTON", "HEAVYWEIGHT & PRE-SHRUNK"],
  [A("b5863.svg"), "COD AVAILABLE", "PAY AT DOORSTEP PAN-INDIA"],
];

const depts = [
  { n: "01 // HEAVY DROP", t: ["T-", "SHIRTS"], img: "99450.png", cat: "tees" },
  { n: "02 // 450 GSM", t: ["HOODIES"], img: "ce1cd.png", cat: "hoodies" },
  { n: "03 // SNAPBACKS & 5-PANELS", t: ["CAPS"], img: "37da8.png", cat: "caps" },
  { n: "04 // RAW MERCH", t: ["TOTES"], img: "237a4.png", cat: "acc" },
];

const products = [
  { img: "f1497.png", tag: "280 GSM", badge: "EDITION: DROP 04", stock: "IN STOCK", name: "THALAIVAR TRIBUTE 280 GSM OVERSIZED TEE", price: 1499, was: 2299, off: "35% OFF", cat: "tees" },
  { img: "2e222.png", tag: "450 GSM TERRY", badge: "FLAGSHIP PIECE", stock: "LIMITED [40 PCS]", name: "VENKAYAM ONION MONOGRAM HOODIE (CHARCOAL)", price: 2999, was: 3999, off: "SAVE ₹1,000", cat: "hoodies", onion: true },
  { img: "9bdff.png", tag: "ACID WASH 260 GSM", badge: "VINTAGE WASH", stock: "FEW REMAINING", name: "MADRAS NOIR ACID WASH GRAPHIC TEE", price: 1699, was: 2499, off: "32% OFF", cat: "tees" },
  { img: "79b1c.png", tag: "OFF-WHITE HEAVY", badge: "COLLAB EDITION", stock: "IN STOCK", name: "KOLLYWOOD RETRO CLUB TEE", price: 1599, was: 2199, off: "SAVE ₹600", cat: "tees" },
  { img: "83098.png", tag: "COTTON CANVAS", badge: "HEADWEAR SPEC", stock: "POPULAR", name: "VENKAYAM STREETWEAR 5-PANEL CAP", price: 999, was: 1499, off: "33% OFF", cat: "caps" },
  { img: "62447.png", tag: "16 OZ DUCK CANVAS", badge: "DAILY CARRY", stock: "IN STOCK", name: "HEAVYWEIGHT CANVAS ONION TOTE BAG", price: 799, was: 1199, off: "SAVE ₹400", cat: "acc", emblem: "f6362.png" },
];

const tabs = [
  ["all", "ALL ARCHIVE [06]"],
  ["tees", "OVERSIZED TEES"],
  ["hoodies", "HEAVY HOODIES"],
  ["caps", "HEADWEAR"],
  ["acc", "ACCESSORIES"],
];

const slug = (p: { name: string }) => p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const href = (p: { name: string }) => go(`/product/${slug(p)}`);

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

function Arrow({ invert = false }: { invert?: boolean }) {
  return <img src={A("65ae0.svg")} alt="" className={`size-3 ${invert ? "invert" : ""}`} />;
}

function Header({ path }: { path: string }) {
  const { count, open } = useCart();
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur">
      <div className={`${mono} flex h-7 items-center justify-center bg-black px-4 text-[10px] tracking-[0.12em] text-white`}>
        Free shipping on orders over ₹999 • Cash on delivery available
      </div>
      <div className="mx-auto flex h-[60px] max-w-[1500px] items-center justify-between px-6">
        <a href={go("/")} className="flex items-center gap-2.5">
          <OnionLogo className="h-9" sway={false} />
          <span className={`${disp} text-xl leading-[0.85] tracking-wide`}>
            Venkayam<br /><span className="text-[11px] tracking-[0.3em]">India</span>
          </span>
        </a>
        <nav className={`${mono} hidden gap-9 text-[11px] font-bold tracking-[0.12em] md:flex`}>
          {nav.map(([n, to]) => (
            <a key={n} href={go(to)} className={`relative py-1 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:bg-black after:transition-transform ${path === to ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100"}`}>
              {n}
            </a>
          ))}
        </nav>
        <button onClick={open} className={`${mono} border border-black px-3 py-1.5 text-[11px] font-bold tracking-widest transition hover:bg-black hover:text-white`}>
          Bag [{String(count).padStart(2, "0")}]
        </button>
      </div>
      <nav className={`${mono} flex justify-around border-t border-black/10 py-2 text-[10px] font-bold tracking-[0.12em] md:hidden`}>
        {nav.map(([n, to]) => <a key={n} href={go(to)} className={path === to ? "underline underline-offset-4" : ""}>{n}</a>)}
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-black/10 bg-gradient-to-b from-neutral-100/70 via-white to-white px-6 pb-12 pt-[130px] md:pt-[130px]">
      <div className="mx-auto grid max-w-[1500px] items-center gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="mb-6 flex items-end gap-5">
            <OnionLogo className="h-[150px] md:h-[190px]" />
            <div className={`${mono} border border-black/20 bg-white px-3 py-2 text-[9px] font-bold leading-4 tracking-[0.12em]`}>
              Original Chennai<br />Merch<br />[Archive No. 2024]
            </div>
          </div>
          <h1 className={`${disp} text-[72px] leading-[0.88] tracking-tight md:text-[104px]`}>
            Venkayam<br />
            <span className="flex items-baseline gap-3">India <span className={`${mono} border border-black px-2 py-1 text-[11px] tracking-widest`}>வெங்காயம்</span></span>
          </h1>
          <p className={`${mono} mt-5 text-[12px] font-bold tracking-[0.15em]`}>Desi roots • Kollywood soul • Street wear attitude</p>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-neutral-700">
            Forged in the visceral heat of North Chennai cinema hoardings, painted tea-stall typography, and unyielding 280-450 GSM combed cotton.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={go("/shop")} className={`${mono} flex items-center gap-3 bg-black px-6 py-3.5 text-[11px] font-bold tracking-[0.15em] text-white transition hover:gap-5`}>Shop collection <Arrow invert /></a>
            <a href={go("/drops")} className={`${mono} border border-black px-6 py-3.5 text-[11px] font-bold tracking-[0.15em] transition hover:bg-black hover:text-white`}>Explore drops</a>
          </div>
          <p className={`${mono} mt-6 text-[10px] tracking-[0.15em] text-neutral-500`}>Batch: CHN-DROP-04 • Limit: 150 pcs / design</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1.25fr_1fr] lg:col-span-8">
          <article className="relative h-[480px] overflow-hidden border border-black/10 bg-neutral-200 shadow-xl lg:h-[620px]">
            <img src={A("5b6d9.png")} alt="Model in a Tamil Noir oversized tee" className="absolute inset-0 size-full object-cover grayscale" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
            <span className={`${mono} absolute left-4 top-4 border border-black/10 bg-white/95 px-3 py-1.5 text-[9px] font-bold tracking-[0.1em]`}>Heavyweight 280 GSM Oversoul</span>
            <div className="absolute inset-x-6 bottom-6 flex items-end justify-between text-white">
              <div>
                <p className={`${mono} mb-2 text-[10px] tracking-[0.2em] text-white/70`}>Series 004 // Hero spec</p>
                <h2 className={`${disp} text-4xl leading-none md:text-5xl`}>Tamil Noir Oversized<br />Tee</h2>
                <p className={`${mono} mt-2 text-xs font-bold`}>INR ₹1,499</p>
              </div>
              <span className="grid size-16 place-items-center rounded-full border border-white/60 text-center font-display text-[11px] leading-tight">FAST<br />DISPATCH</span>
            </div>
          </article>
          <article className="relative hidden h-[620px] overflow-hidden border border-black/10 bg-neutral-200 shadow-xl sm:block">
            <img src={A("fe650.png")} alt="Kali Temple hoodie" className="absolute inset-0 size-full object-cover grayscale" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <span className={`${mono} absolute left-4 top-4 bg-black px-3 py-1.5 text-[9px] font-bold tracking-[0.1em] text-white`}>Off-white archive</span>
            <div className="absolute inset-x-5 bottom-5 text-white">
              <h3 className={`${disp} text-2xl leading-none`}>Kali Temple Hoodie</h3>
              <p className={`${mono} mt-2 text-xs font-bold`}>₹2,999</p>
            </div>
            <div className="absolute right-4 top-14 flex size-24 items-center justify-center rounded-full bg-white/95 p-3 text-center shadow-lg">
              <span className={`${mono} text-[7px] font-bold leading-tight tracking-wider`}>Official seal of authenticity<br />100% combed Tiruppur heavy cotton</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function Trust() {
  return (
    <section className="border-b border-black/10 bg-neutral-100 px-6 py-5">
      <div className="mx-auto grid max-w-[1500px] gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {trust.map(([icon, t, s]) => (
          <div key={t} className="flex items-start gap-3">
            <img src={icon} alt="" className="mt-0.5 h-[19px] w-[26px]" />
            <div>
              <p className={`${mono} text-[11px] font-bold tracking-[0.05em]`}>{t}</p>
              <p className={`${mono} text-[9px] tracking-[0.1em] text-neutral-500`}>{s}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Departments() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b-2 border-black pb-4">
          <div>
            <p className={`${mono} mb-2 text-[10px] tracking-[0.25em] text-neutral-500`}>Archive taxonomy</p>
            <h2 className={`${disp} text-5xl leading-none md:text-6xl`}>Core departments</h2>
          </div>
          <p className={`${mono} text-[10px] tracking-[0.15em] text-neutral-500`}>Engineered for southern tropics • Drop zero four</p>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {depts.map((d) => (
            <a key={d.n} href={go(`/shop/${d.cat}`)} className="group relative block aspect-[3/4] overflow-hidden bg-black text-white">
              <img src={A(d.img)} alt={d.t.join("")} className="absolute inset-0 size-full object-cover grayscale transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
              <span className={`${mono} absolute left-4 top-4 text-[9px] tracking-[0.15em] text-white/80`}>{d.n}</span>
              <div className="absolute inset-x-4 bottom-4">
                <h3 className={`${disp} text-[clamp(2.5rem,6vw,5rem)] leading-[0.85]`}>{d.t.map((l) => <span key={l} className="block">{l}</span>)}</h3>
                <p className={`${mono} mt-3 flex items-center gap-2 text-[10px] font-bold tracking-[0.15em] transition-all group-hover:gap-4`}>Explore <Arrow invert /></p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

const sizesFor = (cat: string): [string, boolean][] =>
  cat === "caps" || cat === "acc"
    ? [["One size", true]]
    : [["S", true], ["M", true], ["L", true], ["XL", true], ["XXL", cat !== "hoodies"]];

function ProductCard({ p }: { p: (typeof products)[number] }) {
  const { add } = useCart();
  const sizes = sizesFor(p.cat);
  const [size, setSize] = useState(sizes.length === 1 ? sizes[0][0] : "");
  const [warn, setWarn] = useState(false);
  const act = (buyNow: boolean) => {
    if (!size) { setWarn(true); return; }
    add({ name: p.name, img: p.img, size, price: p.price }, buyNow);
  };
  return (
    <article className="group flex flex-col border border-black/10 bg-white">
      <a href={href(p)} aria-label={`View ${p.name}`} className="relative block aspect-[4/5] overflow-hidden bg-neutral-200">
        <img src={A(p.img)} alt={p.name} className="absolute inset-0 size-full object-cover grayscale transition duration-700 group-hover:scale-105" />
        {p.emblem && <img src={A(p.emblem)} alt="" className="absolute left-1/2 top-[48%] w-1/4 -translate-x-1/2 -translate-y-1/2 mix-blend-multiply" />}
        <span className={`${mono} absolute left-3 top-3 bg-white px-2 py-1 text-[9px] font-bold tracking-[0.1em]`}>{p.tag}</span>
        <span className={`${mono} absolute bottom-3 left-3 bg-black px-2 py-1 text-[9px] font-bold tracking-[0.1em] text-white`}>{p.badge}</span>
        <span className={`${mono} absolute bottom-3 right-3 bg-white px-2 py-1 text-[9px] font-bold tracking-[0.1em] opacity-0 transition group-hover:opacity-100`}>View →</span>
      </a>
      <div className="flex flex-1 flex-col p-5">
        <div className={`${mono} mb-2 flex justify-between text-[9px] tracking-[0.12em] text-neutral-500`}><span>{p.badge}</span><span className="font-bold text-black">{p.stock}</span></div>
        <h3 className="text-[15px] font-extrabold uppercase leading-snug"><a href={href(p)} className="hover:underline">{p.name}</a></h3>
        <div className="mt-3 flex items-center gap-3">
          <span className={`${mono} text-base font-bold`}>{inr(p.price)}</span>
          <span className={`${mono} text-xs text-neutral-400 line-through`}>{inr(p.was)}</span>
          <span className={`${mono} ml-auto bg-neutral-100 px-2 py-1 text-[9px] font-bold tracking-wider`}>{p.off}</span>
        </div>
        <div className="mt-4">
          <p className={`${mono} mb-2 flex justify-between text-[9px] font-bold tracking-[0.15em] ${warn && !size ? "text-red-700" : "text-neutral-500"}`}>
            <span>{warn && !size ? "Select a size" : "Size"}</span>{size && <span className="text-black">{size}</span>}
          </p>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Size">
            {sizes.map(([s, ok]) => (
              <button key={s} type="button" role="radio" aria-checked={size === s} disabled={!ok} onClick={() => { setSize(s); setWarn(false); }}
                className={`${mono} min-w-10 border px-3 py-2 text-[10px] font-bold tracking-wider transition ${!ok ? "cursor-not-allowed border-black/15 text-neutral-300 line-through" : size === s ? "border-black bg-black text-white" : "border-black hover:bg-neutral-200"}`}>{s}</button>
            ))}
          </div>
        </div>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
          <button onClick={() => act(false)} className={`${mono} border border-black py-3 text-[10px] font-bold tracking-[0.12em] transition hover:bg-black hover:text-white`}>Add to cart</button>
          <button onClick={() => act(true)} className={`${mono} bg-black py-3 text-[10px] font-bold tracking-[0.12em] text-white transition hover:bg-neutral-700`}>Buy now</button>
        </div>
      </div>
    </article>
  );
}

const details: Record<string, { blurb: string; specs: [string, string][]; fit: string }> = {
  tees: { blurb: "Cut boxy and dropped at the shoulder, pre-shrunk and garment-washed so the fit holds after the first wash. Screen-printed in Chennai with plastisol ink that cracks beautifully with age.", fit: "Oversized. Take your usual size for the intended drape, size down for a regular fit.", specs: [["Fabric", "100% combed cotton, 260-280 GSM"], ["Print", "Plastisol screen print"], ["Finish", "Pre-shrunk, enzyme washed"], ["Made in", "Tiruppur, India"]] },
  hoodies: { blurb: "A 450 GSM brushed-back terry hoodie with a double-layered hood, ribbed cuffs and the onion monogram embroidered at the chest. Heavy enough to stand on its own.", fit: "Relaxed with a slightly cropped body. Size up for a longer, oversized look.", specs: [["Fabric", "100% cotton terry, 450 GSM"], ["Branding", "Embroidered monogram"], ["Hood", "Double layered, flat drawcord"], ["Made in", "Tiruppur, India"]] },
  caps: { blurb: "A structured five-panel cap in washed cotton canvas with a tonal embroidered onion, curved brim and a brass-buckle adjustable strap.", fit: "One size. The strap fits head circumference of 54 to 62 cm.", specs: [["Fabric", "Washed cotton canvas"], ["Crown", "Structured, 5-panel"], ["Closure", "Adjustable brass buckle"], ["Made in", "Tiruppur, India"]] },
  acc: { blurb: "A 16 oz duck canvas tote with reinforced stitching and a screen-printed onion emblem. Carries a laptop and a week of groceries without complaint.", fit: "One size. 38 cm wide, 40 cm tall, 12 cm gusset, 28 cm handle drop.", specs: [["Fabric", "16 oz duck canvas"], ["Capacity", "Approx. 18 litres"], ["Handles", "Double-stitched cotton webbing"], ["Made in", "Tiruppur, India"]] },
};

function ProductPage({ id }: { id: string }) {
  const p = products.find((x) => slug(x) === id);
  const { add } = useCart();
  const [size, setSize] = useState("");
  const [warn, setWarn] = useState(false);
  const [qty, setQty] = useState(1);
  const [open, setOpen] = useState(0);
  useEffect(() => { setSize(""); setWarn(false); setQty(1); }, [id]);
  if (!p) {
    return (
      <section className="px-6 pb-24 pt-[170px]"><div className="mx-auto max-w-[1500px]">
        <h1 className={`${disp} text-6xl`}>Piece not found</h1>
        <div className="mt-8"><Cta to="/shop" label="Back to shop" /></div>
      </div></section>
    );
  }
  const d = details[p.cat];
  const sizes = sizesFor(p.cat);
  const one = sizes.length === 1;
  const chosen = one ? sizes[0][0] : size;
  const act = (buyNow: boolean) => {
    if (!chosen) { setWarn(true); return; }
    for (let i = 0; i < qty; i++) add({ name: p.name, img: p.img, size: chosen, price: p.price }, buyNow && i === qty - 1);
  };
  const more = [...products.filter((x) => x.cat === p.cat && x !== p), ...products.filter((x) => x.cat !== p.cat)].slice(0, 3);
  const acc: [string, string][] = [
    ["Details", d.blurb],
    ["Fit & sizing", d.fit],
    ["Shipping & returns", "Free shipping above ₹999, otherwise ₹79. Dispatched from Chennai within 24 hours. COD available pan-India. 7-day easy returns on unworn pieces."],
  ];
  return (
    <>
      <section className="px-6 pb-16 pt-[130px]">
        <div className="mx-auto max-w-[1500px]">
          <nav className={`${mono} mb-6 flex flex-wrap gap-2 text-[10px] tracking-[0.2em] text-neutral-500`}>
            <a href={go("/shop")} className="hover:text-black">Shop</a><span>/</span>
            <a href={go(`/shop/${p.cat}`)} className="hover:text-black">{tabs.find(([k]) => k === p.cat)?.[1]}</a><span>/</span>
            <span className="text-black">{p.tag}</span>
          </nav>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div className="relative aspect-[4/5] overflow-hidden bg-neutral-200 lg:sticky lg:top-28 lg:self-start">
              <img src={A(p.img)} alt={p.name} className="absolute inset-0 size-full object-cover grayscale" />
              {p.emblem && <img src={A(p.emblem)} alt="" className="absolute left-1/2 top-[48%] w-1/4 -translate-x-1/2 -translate-y-1/2 mix-blend-multiply" />}
              <span className={`${mono} absolute left-4 top-4 bg-white px-3 py-1.5 text-[10px] font-bold tracking-[0.1em]`}>{p.tag}</span>
              <span className={`${mono} absolute bottom-4 left-4 bg-black px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] text-white`}>{p.badge}</span>
            </div>
            <div>
              <p className={`${mono} mb-3 flex justify-between text-[10px] tracking-[0.2em] text-neutral-500`}><span>{p.badge}</span><span className="font-bold text-black">{p.stock}</span></p>
              <h1 className={`${disp} text-[clamp(2.2rem,4.5vw,4.2rem)] leading-[0.95]`}>{p.name}</h1>
              <div className="mt-5 flex items-center gap-4">
                <span className={`${mono} text-2xl font-bold`}>{inr(p.price)}</span>
                <span className={`${mono} text-sm text-neutral-400 line-through`}>{inr(p.was)}</span>
                <span className={`${mono} bg-neutral-100 px-2.5 py-1 text-[10px] font-bold tracking-wider`}>{p.off}</span>
              </div>
              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-neutral-700">{d.blurb}</p>

              <div className="mt-8">
                <p className={`${mono} mb-3 flex justify-between text-[10px] font-bold tracking-[0.15em] ${warn && !chosen ? "text-red-700" : "text-neutral-500"}`}>
                  <span>{warn && !chosen ? "Select a size" : "Size"}</span>{chosen && <span className="text-black">{chosen}</span>}
                </p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
                  {sizes.map(([s, ok]) => (
                    <button key={s} type="button" role="radio" aria-checked={chosen === s} disabled={!ok} onClick={() => { setSize(s); setWarn(false); }}
                      className={`${mono} min-w-14 border px-4 py-3 text-[11px] font-bold tracking-wider transition ${!ok ? "cursor-not-allowed border-black/15 text-neutral-300 line-through" : chosen === s ? "border-black bg-black text-white" : "border-black hover:bg-neutral-200"}`}>{s}</button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <div className="flex items-center border border-black">
                  <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} className="size-12 text-lg hover:bg-neutral-200">−</button>
                  <span className={`${mono} w-10 text-center text-sm font-bold tabular-nums`}>{qty}</span>
                  <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(9, q + 1))} className="size-12 text-lg hover:bg-neutral-200">+</button>
                </div>
                <p className={`${mono} text-[10px] tracking-[0.15em] text-neutral-500`}>Total {inr(p.price * qty)}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button onClick={() => act(false)} className={`${mono} border border-black py-4 text-[11px] font-bold tracking-[0.15em] transition hover:bg-black hover:text-white`}>Add to cart</button>
                <button onClick={() => act(true)} className={`${mono} bg-black py-4 text-[11px] font-bold tracking-[0.15em] text-white transition hover:bg-neutral-700`}>Buy now</button>
              </div>

              <div className="mt-10 border-t-2 border-black">
                {acc.map(([t, body], i) => (
                  <div key={t} className="border-b border-black/15">
                    <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)} className={`${mono} flex w-full items-center justify-between py-4 text-left text-[11px] font-bold tracking-[0.15em]`}>
                      {t}<span className="text-lg leading-none">{open === i ? "−" : "+"}</span>
                    </button>
                    {open === i && <p className="pb-5 text-sm leading-relaxed text-neutral-700">{body}</p>}
                  </div>
                ))}
              </div>
              <dl className="mt-8 grid grid-cols-2 gap-px bg-black/10">
                {d.specs.map(([k, v]) => (
                  <div key={k} className="bg-white p-4">
                    <dt className={`${mono} text-[9px] tracking-[0.2em] text-neutral-500`}>{k}</dt>
                    <dd className="mt-1 text-sm font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-black/10 bg-neutral-50 px-6 py-20">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className={`${mono} mb-2 text-[10px] tracking-[0.25em] text-neutral-500`}>Picked from the archive</p>
              <h2 className={`${disp} text-[clamp(2.5rem,6vw,5rem)] leading-[0.9]`}>Recommended for you</h2>
            </div>
            <a href={go("/shop")} className={`${mono} hidden text-[11px] font-bold tracking-[0.15em] underline underline-offset-4 sm:block`}>View all</a>
          </div>
          <ProductGrid items={more} />
        </div>
      </section>
    </>
  );
}

function ProductGrid({ items }: { items: typeof products }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => <ProductCard key={p.name} p={p} />)}
    </div>
  );
}

function Manifesto() {
  const [copied, setCopied] = useState(false);
  return (
    <section className="px-6 py-24">
      <div className="mx-auto grid max-w-[1500px] items-center gap-12 lg:grid-cols-2">
        <div className="relative h-[520px] overflow-hidden bg-neutral-900 text-white">
          <img src={A("de740.png")} alt="Riders under Chennai hoardings" className="absolute inset-0 size-full object-cover grayscale" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
          <span className={`${mono} absolute left-4 top-4 bg-white px-3 py-1.5 text-[9px] font-bold tracking-[0.1em] text-black`}>Madras archive // Dispatch 004</span>
          <div className="absolute inset-x-6 bottom-6">
            <p className={`${mono} mb-2 text-[10px] tracking-[0.2em] text-white/70`}>Manifesto excerpt</p>
            <p className={`${disp} text-3xl leading-tight md:text-4xl`}>"We wear our roots like armor."</p>
            <p className={`${mono} mt-2 text-[10px] tracking-wider text-white/80`}>No fast fashion. No plastic blends. Pure heavy combed Tiruppur threads.</p>
          </div>
        </div>
        <div>
          <p className={`${mono} mb-4 text-[10px] tracking-[0.25em] text-neutral-500`}>Origin manifesto</p>
          <h2 className={`${disp} text-[clamp(3rem,7vw,6rem)] leading-[0.95]`}>More than fashion — it's an attitude.</h2>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-neutral-700">
            VENKAYAM was born on the asphalt corridors of Chennai. Rejecting sanitized Western streetwear imitations, we synthesize the raw, dramatic weight of Tamil mass culture, Tamil cinema hoardings, and hand-cut stencil fonts with cutting-edge utilitarian tailoring.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[["01", "Pre-shrunk yarn", "Engineered to preserve oversized box silhouettes wash after wash."], ["02", "Raster screenprints", "Industrial plastisol inks calibrated for lifetime endurance."]].map(([n, t, d]) => (
              <div key={n} className="border border-black/15 p-5">
                <span className={`${disp} text-3xl`}>{n}</span>
                <h3 className={`${mono} mt-2 text-xs font-bold tracking-wider`}>{t}</h3>
                <p className="mt-2 text-sm text-neutral-600">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-2 border-black p-5">
            <div>
              <p className={`${mono} text-[9px] tracking-[0.2em] text-neutral-500`}>Exclusive first-order privilege</p>
              <p className={`${disp} mt-1 text-2xl`}>Claim ₹100 off first archive piece</p>
            </div>
            <button onClick={() => { navigator.clipboard?.writeText("VENKAYAM10"); setCopied(true); setTimeout(() => setCopied(false), 1800); }} className={`${mono} flex items-center gap-3 bg-black px-4 py-3 text-[11px] font-bold tracking-widest text-white`}>
              VENKAYAM10 <span className="border-l border-white/40 pl-3">{copied ? "COPIED" : "COPY"}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols: [string, string[]][] = [
    ["Navigation", ["Shop all archive|/shop", "Latest drops|/drops", "Lookbook 2026|/lookbook", "Manifesto|/about"]],
    ["Assistance", ["Track order|/track", "Domestic shipping|/shipping", "Returns & exchanges|/returns", "Size matrix|/sizes"]],
  ];
  return (
    <footer className="bg-black text-white">
      <div className="overflow-hidden border-b border-white/15 py-3">
        <div className={`${mono} marquee flex w-max gap-8 whitespace-nowrap text-[10px] tracking-[0.2em]`}>
          {[0, 1].map((k) => (
            <span key={k} className="flex gap-8">
              {["Free shipping on orders over ₹999", "Cash on delivery available", "100% heavyweight combed cotton", "Raw Chennai streetwear luxury"].map((t) => <span key={t}>{t} •</span>)}
            </span>
          ))}
        </div>
      </div>
      <div className="mx-auto grid max-w-[1500px] gap-12 px-6 py-16 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.5fr]">
        <div>
          <div className="flex items-end gap-4">
            <span className="rounded bg-white p-2"><OnionLogo className="h-20" /></span>
            <h2 className={`${disp} text-3xl leading-[0.9]`}>Venkayam<br />India</h2>
          </div>
          <p className={`${mono} mt-5 text-[10px] tracking-[0.15em] text-white/60`}>Tamil avant-garde streetwear archive // Est. 2024</p>
          <p className="mt-3 max-w-sm text-sm text-white/70">Uncompromising luxury engineered from the raw visual grammar of North Chennai cinema hoardings, stencil grit, and heavyweight textile architecture.</p>
          <p className={`${mono} mt-5 text-[10px] leading-5 tracking-wider text-white/50`}>Spec: 450GSM French terry • Drop zero four live<br />Location: Chennai 600001 • Worldwide courier</p>
        </div>
        {cols.map(([h, l]) => (
          <div key={h}>
            <h3 className={`${mono} mb-5 text-[11px] font-bold tracking-[0.2em] text-white/50`}>{h}</h3>
            <ul className="space-y-3 text-sm">{l.map((i) => <li key={i}><a href={go(i.split("|")[1])} className="uppercase tracking-wide transition hover:underline">{i.split("|")[0]}</a></li>)}</ul>
          </div>
        ))}
        <div>
          <h3 className={`${mono} mb-5 text-[11px] font-bold tracking-[0.2em] text-white/50`}>Dispatch intel</h3>
          <p className="mb-4 text-sm text-white/70">Subscribe for confidential release drop codes and private warehouse access.</p>
          <form onSubmit={(e) => e.preventDefault()} className="flex border border-white/40">
            <input type="email" required placeholder="ENTER EMAIL IDENTIFIER" className={`${mono} min-w-0 flex-1 bg-transparent px-3 py-3 text-[10px] tracking-widest outline-none placeholder:text-white/40`} />
            <button className={`${mono} bg-white px-5 text-[11px] font-bold tracking-widest text-black`}>Join</button>
          </form>
          <p className={`${mono} mt-3 text-[9px] tracking-wider text-white/40`}>Zero spam. Strictly curated dispatches only.</p>
        </div>
      </div>
      <div className={`${mono} flex flex-wrap justify-between gap-3 border-t border-white/15 px-6 py-5 text-[9px] tracking-[0.15em] text-white/50`}>
        <span>© 2024 Venkayam India Clothing Corp. All rights reserved.</span>
        <span>Culture: Chennai • Manufacture: Tiruppur • Curation: Global</span>
        <a href="#/admin" className="hover:text-white">[VENKAYAM//ARCHIVE-2024] • Admin</a>
      </div>
    </footer>
  );
}

function useScrollReveal(path: string) {
  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("main section > div > *, main article, footer > div > *")
    );
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.05 }
    );
    targets.forEach((el) => {
      const idx = Array.from(el.parentElement?.children ?? []).indexOf(el);
      el.style.setProperty("--reveal-delay", `${Math.min(idx, 4) * 100}ms`);
      el.classList.add("reveal");
      io.observe(el);
    });
    const failsafe = window.setTimeout(() => targets.forEach((el) => el.classList.add("is-visible")), 6000);
    return () => {
      io.disconnect();
      window.clearTimeout(failsafe);
    };
  }, [path]);
}

function PageHead({ kicker, title, note }: { kicker: string; title: string; note?: string }) {
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

function Cta({ to, label, invert = false }: { to: string; label: string; invert?: boolean }) {
  return (
    <a href={go(to)} className={`${mono} inline-flex items-center gap-3 px-6 py-3.5 text-[11px] font-bold tracking-[0.15em] transition hover:gap-5 ${invert ? "bg-white text-black" : "bg-black text-white"}`}>
      {label} <Arrow invert={!invert} />
    </a>
  );
}

function Home() {
  return (
    <>
      <Hero />
      <Trust />
      <Departments />
      <section className="border-t border-black/10 bg-neutral-50 px-6 py-20">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className={`${mono} mb-2 text-[10px] tracking-[0.25em] text-neutral-500`}>Drop 04 // Live now</p>
              <h2 className={`${disp} text-5xl leading-none md:text-6xl`}>Featured pieces</h2>
            </div>
            <Cta to="/drops" label="See the drop" />
          </div>
          <ProductGrid items={products.slice(0, 3)} />
        </div>
      </section>
      <section className="bg-black px-6 py-20 text-white">
        <div className="mx-auto grid max-w-[1500px] items-center gap-8 lg:grid-cols-2">
          <h2 className={`${disp} text-[clamp(3rem,7vw,6rem)] leading-[0.95]`}>We wear our roots like armor.</h2>
          <div>
            <p className="max-w-lg text-[15px] leading-relaxed text-white/70">Born on the asphalt corridors of Chennai. Heavy combed Tiruppur cotton, stencil grit, and the raw weight of Tamil cinema hoardings.</p>
            <div className="mt-6"><Cta to="/about" label="Read our story" invert /></div>
          </div>
        </div>
      </section>
    </>
  );
}

const SORTS = [["featured", "Featured"], ["low", "Price: low to high"], ["high", "Price: high to low"], ["off", "Biggest saving"]] as const;

function Shop({ cat }: { cat: string }) {
  const [sort, setSort] = useState<(typeof SORTS)[number][0]>("featured");
  const [q, setQ] = useState("");
  const list = products
    .filter((p) => (cat === "all" || p.cat === cat) && p.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : sort === "off" ? b.was - b.price - (a.was - a.price) : 0));
  return (
    <>
      <PageHead kicker="Archive // All departments" title="The full collection" note="Every piece in the Venkayam archive — heavyweight, pre-shrunk, made in Tiruppur." />
      <section className="px-6 py-14">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-8 flex flex-wrap items-center gap-3">
            {tabs.map(([k, l]) => (
              <a key={k} href={go(k === "all" ? "/shop" : `/shop/${k}`)} className={`${mono} border border-black px-4 py-2 text-[10px] font-bold tracking-[0.12em] transition ${cat === k ? "bg-black text-white" : "bg-white hover:bg-neutral-200"}`}>{l}</a>
            ))}
            <div className="ml-auto flex flex-wrap gap-3">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="SEARCH" className={`${mono} w-40 border border-black px-3 py-2 text-[10px] tracking-widest outline-none placeholder:text-neutral-400`} />
              <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={`${mono} border border-black bg-white px-3 py-2 text-[10px] font-bold tracking-wider`}>
                {SORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
          </div>
          <p className={`${mono} mb-4 text-[10px] tracking-[0.2em] text-neutral-500`}>{list.length} pieces</p>
          {list.length ? <ProductGrid items={list} /> : <p className={`${mono} py-20 text-center text-[11px] text-neutral-500`}>Nothing matches your search.</p>}
        </div>
      </section>
    </>
  );
}

function useCountdown(target: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const d = Math.max(0, target - now);
  return [Math.floor(d / 864e5), Math.floor(d / 36e5) % 24, Math.floor(d / 6e4) % 60, Math.floor(d / 1e3) % 60];
}

const DROP_END = Date.now() + 6 * 864e5 + 5 * 36e5;
const SOLD = [138, 112, 97, 74, 120, 88];

function Drops() {
  const [d, h, m, sec] = useCountdown(DROP_END);
  const past = [["Drop 03", "Temple Run", "SOLD OUT IN 41 MIN", "f1497.png"], ["Drop 02", "Hoarding", "SOLD OUT IN 3 HRS", "9bdff.png"], ["Drop 01", "Zero", "SOLD OUT IN 1 DAY", "83098.png"]];
  return (
    <>
      <PageHead kicker="Drop 04 // Batch CHN-DROP-04" title="Featured collection" note="Inspired by our culture. Made for today. 150 pieces per design — when they're gone, they're archived." />
      <section className="bg-black px-6 py-8 text-white">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-6">
          <p className={`${mono} text-[11px] font-bold tracking-[0.2em]`}>Drop closes in</p>
          <div className="flex gap-3">
            {[[d, "Days"], [h, "Hrs"], [m, "Min"], [sec, "Sec"]].map(([v, l]) => (
              <div key={l as string} className="min-w-[72px] border border-white/30 px-3 py-2 text-center">
                <p className={`${disp} text-4xl leading-none tabular-nums`}>{String(v).padStart(2, "0")}</p>
                <p className={`${mono} mt-1 text-[8px] tracking-[0.2em] text-white/60`}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-neutral-50 px-6 py-16">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p, i) => (
              <div key={p.name}>
                <ProductCard p={p} />
                <div className="mt-2 border border-black/10 bg-white px-4 py-3">
                  <div className={`${mono} mb-1 flex justify-between text-[9px] font-bold tracking-wider`}><span>Claimed</span><span>{SOLD[i]}/150</span></div>
                  <div className="h-2 bg-neutral-200"><div className={`h-full ${SOLD[i] > 130 ? "bg-red-700" : "bg-black"}`} style={{ width: `${(SOLD[i] / 150) * 100}%` }} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="px-6 py-20">
        <div className="mx-auto max-w-[1500px]">
          <h2 className={`${disp} mb-8 border-b-2 border-black pb-4 text-5xl leading-none md:text-6xl`}>Past drops</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {past.map(([n, t, s, img]) => (
              <div key={n} className="relative aspect-[4/3] overflow-hidden bg-black text-white">
                <img src={A(img)} alt="" className="absolute inset-0 size-full object-cover opacity-60 grayscale" />
                <div className="absolute inset-x-5 bottom-5">
                  <p className={`${mono} text-[10px] tracking-[0.2em] text-white/70`}>{n}</p>
                  <p className={`${disp} text-3xl`}>{t}</p>
                  <p className={`${mono} mt-1 text-[9px] tracking-wider text-red-400`}>{s}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function About() {
  const facts = [["2024", "Founded in Chennai"], ["280–450", "GSM combed cotton"], ["150", "Pieces per design"], ["100%", "Made in Tiruppur"]];
  const steps = [["01", "Sketch", "Hand-cut stencils and hoarding-inspired lettering drawn in North Chennai."], ["02", "Knit & pre-shrink", "Combed Tiruppur yarn, pre-shrunk so oversized fits stay oversized."], ["03", "Screenprint", "Plastisol inks cured for lifetime endurance, one colour at a time."], ["04", "Dispatch", "Packed in Chennai and shipped pan-India, COD available."]];
  const faqs = [["How does sizing run?", "Oversized, boxy cuts. Take your usual size for the intended fit, or size down one for a closer look."], ["What is your return policy?", "7 days from delivery for unworn pieces with tags. Drop pieces marked final sale are excluded."], ["Do you ship worldwide?", "Pan-India with free shipping above ₹999, and worldwide courier from Chennai."], ["Is cash on delivery available?", "Yes, across India. A small verification call may precede dispatch."]];
  const [open, setOpen] = useState(0);
  return (
    <>
      <PageHead kicker="Origin manifesto" title="About Venkayam" note="Tamil avant-garde streetwear archive // Est. 2024" />
      <section className="border-b border-black/10 px-6 py-12">
        <div className="mx-auto grid max-w-[1500px] grid-cols-2 gap-6 lg:grid-cols-4">
          {facts.map(([v, l]) => (
            <div key={l} className="border-l-2 border-black pl-4">
              <p className={`${disp} text-5xl leading-none`}>{v}</p>
              <p className={`${mono} mt-2 text-[10px] tracking-[0.15em] text-neutral-500`}>{l}</p>
            </div>
          ))}
        </div>
      </section>
      <Manifesto />
      <section className="bg-neutral-50 px-6 py-20">
        <div className="mx-auto max-w-[1500px]">
          <h2 className={`${disp} mb-8 border-b-2 border-black pb-4 text-5xl leading-none md:text-6xl`}>How it&apos;s made</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map(([n, t, d]) => (
              <div key={n} className="border border-black/15 bg-white p-6">
                <span className={`${disp} text-4xl`}>{n}</span>
                <h3 className={`${mono} mt-3 text-xs font-bold tracking-wider`}>{t}</h3>
                <p className="mt-2 text-sm text-neutral-600">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-[1500px] gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className={`${disp} text-5xl leading-none md:text-6xl`}>Shipping, returns &amp; sizing</h2>
            <p className="mt-4 text-neutral-600">Straight answers before you order.</p>
          </div>
          <div className="border-t border-black">
            {faqs.map(([q, a], i) => (
              <div key={q} className="border-b border-black/20">
                <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className={`${mono} flex w-full items-center justify-between py-5 text-left text-[12px] font-bold tracking-wider`}>
                  {q}<span className="text-xl">{open === i ? "−" : "+"}</span>
                </button>
                {open === i && <p className="pb-5 text-sm leading-relaxed text-neutral-600">{a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function parseRoute() {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [, page = "", sub = ""] = raw.split("/");
  return { page, sub };
}

export default function App() {
  const [route, setRoute] = useState(parseRoute);
  useEffect(() => {
    const on = () => {
      setRoute(parseRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const { page, sub } = route;
  const path = page ? `/${page}` : "/";
  useScrollReveal(page === "admin" ? "" : path + sub);
  if (page === "admin") return <AdminGate />;
  return (
    <CartProvider>
      <Header path={page === "product" ? "/shop" : path} />
      <main key={path + sub}>
        {page === "shop" ? <Shop cat={tabs.some(([k]) => k === sub) ? sub : "all"} /> : page === "lookbook" ? <Lookbook /> : page === "track" ? <TrackOrder /> : page === "shipping" ? <Shipping /> : page === "returns" ? <Returns /> : page === "sizes" ? <SizeMatrix /> : page === "product" ? <ProductPage id={sub} /> : page === "drops" ? <Drops /> : page === "about" ? <About /> : <Home />}
      </main>
      <Footer />
    </CartProvider>
  );
}
