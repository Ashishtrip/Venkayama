import { useEffect, useState } from "react";
import OnionLogo from "./components/OnionLogo";

const A = (f: string) => `/assets/${f}`;
const mono = "font-mono uppercase";
const disp = "font-display uppercase";

const nav = ["Home", "Shop", "Collections", "Drops", "About"];

const trust = [
  [A("c7929.svg"), "FREE SHIPPING", "ON ORDERS ABOVE ₹999"],
  [A("3d926.svg"), "EASY RETURNS", "7 DAYS RETURN POLICY"],
  [A("6221c.svg"), "280+ GSM COTTON", "HEAVYWEIGHT & PRE-SHRUNK"],
  [A("b5863.svg"), "COD AVAILABLE", "PAY AT DOORSTEP PAN-INDIA"],
];

const depts = [
  { n: "01 // HEAVY DROP", t: ["T-", "SHIRTS"], img: "99450.png" },
  { n: "02 // 450 GSM", t: ["HOODIES"], img: "ce1cd.png" },
  { n: "03 // SNAPBACKS & 5-PANELS", t: ["CAPS"], img: "37da8.png" },
  { n: "04 // RAW MERCH", t: ["TOTES"], img: "237a4.png" },
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

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

function Arrow({ invert = false }: { invert?: boolean }) {
  return <img src={A("65ae0.svg")} alt="" className={`size-3 ${invert ? "invert" : ""}`} />;
}

function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur">
      <div className={`${mono} flex h-7 items-center justify-center bg-black px-4 text-[10px] tracking-[0.12em] text-white`}>
        Free shipping on orders over ₹999 • Cash on delivery available
      </div>
      <div className="mx-auto flex h-[60px] max-w-[1500px] items-center justify-between px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <OnionLogo className="h-9" sway={false} />
          <span className={`${disp} text-xl leading-[0.85] tracking-wide`}>
            Venkayam<br /><span className="text-[11px] tracking-[0.3em]">India</span>
          </span>
        </a>
        <nav className={`${mono} hidden gap-9 text-[11px] font-bold tracking-[0.12em] md:flex`}>
          {nav.map((n, i) => (
            <a key={n} href={`#${n.toLowerCase()}`} className={`relative py-1 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:bg-black after:transition-transform ${i === 0 ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100"}`}>
              {n}
            </a>
          ))}
        </nav>
        <button className={`${mono} border border-black px-3 py-1.5 text-[11px] font-bold tracking-widest transition hover:bg-black hover:text-white`}>
          Bag [02]
        </button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="home" className="relative overflow-hidden border-b border-black/10 bg-gradient-to-b from-neutral-100/70 via-white to-white px-6 pb-12 pt-[130px]">
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
            <a href="#shop" className={`${mono} flex items-center gap-3 bg-black px-6 py-3.5 text-[11px] font-bold tracking-[0.15em] text-white transition hover:gap-5`}>Shop collection <Arrow invert /></a>
            <a href="#drops" className={`${mono} border border-black px-6 py-3.5 text-[11px] font-bold tracking-[0.15em] transition hover:bg-black hover:text-white`}>Explore drops</a>
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
    <section id="collections" className="px-6 py-20">
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
            <a key={d.n} href="#shop" className="group relative block aspect-[3/4] overflow-hidden bg-black text-white">
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

function Featured() {
  const [tab, setTab] = useState("all");
  const list = products.filter((p) => tab === "all" || p.cat === tab);
  return (
    <section id="shop" className="border-t border-black/10 bg-neutral-50 px-6 py-20">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className={`${disp} flex items-start gap-2 text-5xl leading-none md:text-6xl`}>Featured collection <span className={`${mono} bg-black px-1.5 py-0.5 text-[10px] tracking-widest text-white`}>New</span></h2>
            <p className={`${mono} mt-3 text-[10px] tracking-[0.2em] text-neutral-500`}>Inspired by our culture. Made for today.</p>
          </div>
          <a href="#shop" className={`${mono} flex items-center gap-2 border-b border-black text-[10px] font-bold tracking-[0.15em]`}>View all archive <Arrow /></a>
        </div>
        <div className="mb-8 flex flex-wrap gap-2">
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`${mono} border border-black px-4 py-2 text-[10px] font-bold tracking-[0.12em] transition ${tab === k ? "bg-black text-white" : "bg-white hover:bg-neutral-200"}`}>{l}</button>
          ))}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <article key={p.name} className="group border border-black/10 bg-white">
              <div className="relative aspect-[4/5] overflow-hidden bg-neutral-200">
                <img src={A(p.img)} alt={p.name} className="absolute inset-0 size-full object-cover grayscale transition duration-700 group-hover:scale-105" />
                {p.emblem && <img src={A(p.emblem)} alt="" className="absolute left-1/2 top-[48%] w-1/4 -translate-x-1/2 -translate-y-1/2 mix-blend-multiply" />}
                <span className={`${mono} absolute left-3 top-3 bg-white px-2 py-1 text-[9px] font-bold tracking-[0.1em]`}>{p.tag}</span>
                <span className={`${mono} absolute bottom-3 left-3 bg-black px-2 py-1 text-[9px] font-bold tracking-[0.1em] text-white`}>{p.badge}</span>
              </div>
              <div className="p-5">
                <div className={`${mono} mb-2 flex justify-between text-[9px] tracking-[0.12em] text-neutral-500`}><span>{p.badge}</span><span className="font-bold text-black">{p.stock}</span></div>
                <h3 className="text-[15px] font-extrabold uppercase leading-snug">{p.name}</h3>
                <div className="mt-3 flex items-center gap-3">
                  <span className={`${mono} text-base font-bold`}>{inr(p.price)}</span>
                  <span className={`${mono} text-xs text-neutral-400 line-through`}>{inr(p.was)}</span>
                  <span className={`${mono} ml-auto bg-neutral-100 px-2 py-1 text-[9px] font-bold tracking-wider`}>{p.off}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Manifesto() {
  const [copied, setCopied] = useState(false);
  return (
    <section id="about" className="px-6 py-24">
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
    ["Navigation", ["Shop all archive", "Latest drops", "Lookbook 2024", "Manifesto"]],
    ["Assistance", ["Track order", "Domestic shipping", "Returns & exchanges", "Size matrix"]],
  ];
  return (
    <footer id="drops" className="bg-black text-white">
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
            <ul className="space-y-3 text-sm">{l.map((i) => <li key={i}><a href="#top" className="uppercase tracking-wide transition hover:underline">{i}</a></li>)}</ul>
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
        <span>[VENKAYAM//ARCHIVE-2024]</span>
      </div>
    </footer>
  );
}

function useScrollReveal() {
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
  }, []);
}

export default function App() {
  useScrollReveal();
  return (
    <div id="top">
      <Header />
      <main>
        <Hero />
        <Trust />
        <Departments />
        <Featured />
        <Manifesto />
      </main>
      <Footer />
    </div>
  );
}
