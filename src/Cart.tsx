import OnionLogo from "./components/OnionLogo";
import { actions, discountFor, getDB, imgSrc, useDB } from "./store";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const mono = "font-mono uppercase";
const disp = "font-display uppercase";
const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export type CartLine = { key: string; name: string; img: string; size: string; price: number; qty: number };
type Ctx = {
  lines: CartLine[];
  count: number;
  add: (l: Omit<CartLine, "key" | "qty">, buyNow?: boolean) => void;
  open: () => void;
};
const CartCtx = createContext<Ctx>({ lines: [], count: 0, add: () => {}, open: () => {} });
export const useCart = () => useContext(CartCtx);

type View = "cart" | "checkout";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [view, setView] = useState<View>("cart");
  const [pay, setPay] = useState<"UPI" | "Card">("UPI");
  const [orderId, setOrderId] = useState("");
  const [trackCode, setTrackCode] = useState("");
  const [stage, setStage] = useState<null | "loading" | "done">(null);
  const [progress, setProgress] = useState(0);
  const [paid, setPaid] = useState(0);
  const settings = useDB((d) => d.settings);
  const FREE_SHIP = settings.freeShip;
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState("");
  const [codeMsg, setCodeMsg] = useState("");

  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const count = lines.reduce((a, l) => a + l.qty, 0);
  const disc = applied ? discountFor(applied, subtotal) : { amount: 0 };
  const after = subtotal - disc.amount;
  const shipping = subtotal === 0 || after >= FREE_SHIP ? 0 : settings.shipFee;
  const total = after + shipping;

  const ctx = useMemo<Ctx>(
    () => ({
      lines,
      count,
      open: () => { setView("cart"); setOpen(true); },
      add: (l, buyNow) => {
        const key = `${l.name}|${l.size}`;
        setLines((ls) => (ls.some((x) => x.key === key) ? ls.map((x) => (x.key === key ? { ...x, qty: x.qty + 1 } : x)) : [...ls, { ...l, key, qty: 1 }]));
        setView(buyNow ? "checkout" : "cart");
        setOpen(true);
      },
    }),
    [lines, count]
  );

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [isOpen]);

  const setQty = (key: string, d: number) =>
    setLines((ls) =>
      ls.flatMap((l) => {
        if (l.key !== key) return [l];
        const stock = getDB().products.find((p) => p.name === l.name)?.sizes[l.size] ?? 99;
        const qty = Math.min(l.qty + d, stock);
        return qty <= 0 ? [] : [{ ...l, qty }];
      })
    );
  const applyCode = () => {
    const res = discountFor(code, subtotal);
    if (res.error) { setCodeMsg(res.error); setApplied(""); return; }
    setApplied(res.promo!.code);
    setCodeMsg(`${res.promo!.code} applied, saving ${inr(res.amount)}`);
  };

  const [paying, setPaying] = useState(false);
  const [payErr, setPayErr] = useState("");

  const finish = (f: FormData) => {
    const order = actions.placeOrder({
      customer: String(f.get("name")), phone: String(f.get("phone")), address: String(f.get("address")),
      city: String(f.get("city")), pay, amount: total, promo: applied || undefined,
      items: lines.map((l) => ({ name: l.name, size: l.size, qty: l.qty, price: l.price })),
    });
    setOrderId(order.id); setTrackCode(order.track ?? "");
    setPaid(total);
    setApplied(""); setCode(""); setCodeMsg("");
    setLines([]);
    setOpen(false);
    setProgress(0);
    setStage("loading");
  };

  const api = (path: string, body: unknown) =>
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ec741b02/razorpay/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
      body: JSON.stringify(body),
    }).then(async (r) => {
      const t = await r.text();
      try { return JSON.parse(t); } catch { throw new Error(`Payment server unavailable (${r.status}). Make sure the server function is deployed.`); }
    });

  const loadRzp = () =>
    new Promise<boolean>((res) => {
      if ((window as any).Razorpay) return res(true);
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => res(true);
      s.onerror = () => res(false);
      document.body.appendChild(s);
    });

  const place = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paying) return;
    const f = new FormData(e.currentTarget as HTMLFormElement);
    setPayErr(""); setPaying(true);
    try {
      if (!(await loadRzp())) throw new Error("Could not load payment window. Check your connection.");
      const o = await api("order", { amount: total, receipt: `VNK-${Date.now()}` });
      if (o.error || !o.orderId) throw new Error(o.error || "Could not start payment");
      const rzp = new (window as any).Razorpay({
        key: o.keyId, order_id: o.orderId, amount: o.amount, currency: o.currency,
        name: "Venkayam India", description: "Streetwear order", theme: { color: "#000000" },
        prefill: { name: String(f.get("name")), contact: String(f.get("phone")) },
        config: { display: { preferences: { show_default_blocks: true }, sequence: [pay === "UPI" ? "block.upi" : "block.card"] } },
        handler: async (r: any) => {
          try {
            const v = await api("verify", r);
            if (!v.verified) throw new Error("Payment could not be verified. If money was deducted, contact us with ID " + r.razorpay_payment_id);
            finish(f);
          } catch (err) {
            setPayErr((err as Error).message);
          } finally {
            setPaying(false);
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.on("payment.failed", (r: any) => { setPayErr(r?.error?.description || "Payment failed. Try again."); setPaying(false); });
      rzp.open();
    } catch (err) {
      setPayErr((err as Error).message);
      setPaying(false);
    }
  };

  useEffect(() => {
    if (stage !== "loading") return;
    const id = window.setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 1 + Math.random() * 4);
        if (next >= 100) {
          clearInterval(id);
          window.setTimeout(() => setStage("done"), 450);
        }
        return next;
      });
    }, 70);
    return () => clearInterval(id);
  }, [stage]);

  useEffect(() => {
    if (stage) document.body.style.overflow = "hidden";
    else if (!isOpen) document.body.style.overflow = "";
  }, [stage, isOpen]);

  return (
    <CartCtx.Provider value={ctx}>
      {children}
      <div className={`fixed inset-0 z-[100] transition ${isOpen ? "" : "pointer-events-none"}`} aria-hidden={!isOpen}>
        <div onClick={() => setOpen(false)} className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`} />
        <aside className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
          <header className="flex items-center justify-between border-b-2 border-black px-6 py-4">
            <h2 className={`${disp} text-3xl leading-none`}>{view === "checkout" ? "Checkout" : `Bag [${count}]`}</h2>
            <button onClick={() => setOpen(false)} aria-label="Close" className={`${mono} text-xs font-bold tracking-widest`}>Close ✕</button>
          </header>

          {view === "cart" ? (
            <>
              <div className="flex-1 overflow-y-auto p-6">
                {lines.length === 0 ? (
                  <p className={`${mono} py-20 text-center text-[11px] tracking-wider text-neutral-500`}>Your bag is empty.</p>
                ) : (
                  <>
                    <div className="mb-6">
                      <p className={`${mono} mb-1 text-[10px] font-bold tracking-wider`}>{subtotal >= FREE_SHIP ? "Free shipping unlocked" : `${inr(FREE_SHIP - subtotal)} away from free shipping`}</p>
                      <div className="h-1.5 bg-neutral-200"><div className="h-full bg-black transition-all" style={{ width: `${Math.min(100, (subtotal / FREE_SHIP) * 100)}%` }} /></div>
                    </div>
                    <ul className="divide-y divide-black/10">
                      {lines.map((l) => (
                        <li key={l.key} className="flex gap-4 py-4">
                          <img src={imgSrc(l.img)} alt="" className="h-24 w-20 shrink-0 bg-neutral-200 object-cover grayscale" />
                          <div className="flex min-w-0 flex-1 flex-col">
                            <p className="text-[13px] font-extrabold uppercase leading-snug">{l.name}</p>
                            <p className={`${mono} mt-1 text-[10px] tracking-wider text-neutral-500`}>Size {l.size}</p>
                            <div className="mt-auto flex items-center justify-between">
                              <div className="flex items-center border border-black">
                                <button onClick={() => setQty(l.key, -1)} aria-label="Decrease" className="size-7 hover:bg-neutral-200">−</button>
                                <span className={`${mono} w-7 text-center text-[11px] font-bold`}>{l.qty}</span>
                                <button onClick={() => setQty(l.key, 1)} aria-label="Increase" className="size-7 hover:bg-neutral-200">+</button>
                              </div>
                              <span className={`${mono} text-[12px] font-bold`}>{inr(l.price * l.qty)}</span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              {lines.length > 0 && (
                <footer className="space-y-3 border-t-2 border-black p-6">
                  <div className={`${mono} flex justify-between text-[11px] font-bold tracking-wider`}><span>Subtotal</span><span>{inr(subtotal)}</span></div>
                  <div className="flex gap-2">
                    <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="PROMO CODE" aria-label="Promo code" className={`${mono} min-w-0 flex-1 border border-black px-3 py-2 text-[10px] tracking-widest outline-none`} />
                    <button type="button" onClick={applyCode} className={`${mono} border border-black px-4 text-[10px] font-bold tracking-wider hover:bg-black hover:text-white`}>Apply</button>
                  </div>
                  {codeMsg && <p className={`${mono} text-[10px] tracking-wider ${applied ? "text-emerald-700" : "text-red-700"}`}>{codeMsg}</p>}
                  {disc.amount > 0 && <div className={`${mono} flex justify-between text-[10px] tracking-wider text-emerald-700`}><span>Discount</span><span>−{inr(disc.amount)}</span></div>}
                  <div className={`${mono} flex justify-between text-[10px] tracking-wider text-neutral-500`}><span>Shipping</span><span>{shipping ? inr(shipping) : "Free"}</span></div>
                  <button onClick={() => setView("checkout")} className={`${mono} w-full bg-black py-4 text-[11px] font-bold tracking-[0.15em] text-white transition hover:bg-neutral-800`}>Checkout • {inr(total)}</button>
                </footer>
              )}
            </>
          ) : (
            <form onSubmit={place} className="flex flex-1 flex-col overflow-y-auto">
              <div className="flex-1 space-y-4 p-6">
                <button type="button" onClick={() => setView("cart")} className={`${mono} text-[10px] font-bold tracking-wider underline`}>← Back to bag</button>
                {[["name", "Full name", "text"], ["phone", "Phone", "tel"], ["address", "Delivery address", "text"], ["city", "City", "text"], ["pin", "PIN code", "text"]].map(([n, l, t]) => (
                  <label key={n} className="block">
                    <span className={`${mono} text-[10px] font-bold tracking-wider`}>{l}</span>
                    <input required name={n} type={t} className="mt-1 w-full border border-black px-3 py-3 text-sm outline-none focus:bg-neutral-100" />
                  </label>
                ))}
                <fieldset>
                  <legend className={`${mono} mb-2 text-[10px] font-bold tracking-wider`}>Payment</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {(["UPI", "Card"] as const).map((p) => (
                      <button type="button" key={p} onClick={() => setPay(p)} aria-pressed={pay === p} className={`${mono} border border-black py-3 text-[11px] font-bold tracking-wider ${pay === p ? "bg-black text-white" : "hover:bg-neutral-200"}`}>{p}</button>
                    ))}
                  </div>
                </fieldset>
                <div className="border-t border-black/10 pt-4">
                  {lines.map((l) => (
                    <p key={l.key} className="flex justify-between text-[13px]"><span className="truncate pr-3">{l.name} ({l.size}) ×{l.qty}</span><span className={`${mono} font-bold`}>{inr(l.price * l.qty)}</span></p>
                  ))}
                  {disc.amount > 0 && <p className="flex justify-between text-[13px] text-emerald-700"><span>Promo {applied}</span><span className={`${mono} font-bold`}>−{inr(disc.amount)}</span></p>}
                </div>
              </div>
              <footer className="border-t-2 border-black p-6">
                {payErr && <p role="alert" className={`${mono} mb-3 border border-red-600 p-2 text-[10px] font-bold tracking-wider text-red-600`}>{payErr}</p>}
                <button disabled={paying} className={`${mono} w-full bg-black py-4 text-[11px] font-bold tracking-[0.15em] text-white transition hover:bg-neutral-800 disabled:opacity-50`}>{paying ? "Opening payment…" : `Pay ${inr(total)}`}</button>
              </footer>
            </form>
          )}
        </aside>
      </div>
      {stage && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white px-6 text-center text-black" role="status" aria-live="polite">
          <span>
            {stage === "loading" ? (
              <OnionLogo className="h-40" />
            ) : (
              <OnionLogo className="h-40 md:h-52" />
            )}
          </span>
          {stage === "loading" ? (
            <div className="mt-10 w-full max-w-xs">
              <p className={`${mono} mb-3 flex justify-between text-[11px] font-bold tracking-[0.2em]`}><span>Placing your order</span><span className="tabular-nums">{Math.floor(progress)}%</span></p>
              <div className="h-1.5 bg-black/15"><div className="h-full bg-black" style={{ width: `${progress}%` }} /></div>
            </div>
          ) : (
            <div className="mt-10 animate-[fadeUp_.8s_cubic-bezier(.22,1,.36,1)_both]">
              <h2 className={`${disp} text-[clamp(3.5rem,12vw,8rem)] leading-[0.9]`}>Order placed</h2>
              <p className={`${mono} mt-4 text-[11px] tracking-[0.2em] text-black/60`}>Ref {orderId} • {inr(paid)} • Dispatch from Chennai in 24h</p>
              {trackCode && <p className={`${mono} mt-3 text-[11px] font-bold tracking-[0.2em]`}>Tracking code <span className="select-all border-2 border-black px-2 py-1">{trackCode}</span></p>}
              <button onClick={() => setStage(null)} className={`${mono} mt-8 bg-black px-8 py-4 text-[11px] font-bold tracking-[0.15em] text-white transition hover:bg-neutral-800`}>Keep shopping</button>
            </div>
          )}
        </div>
      )}
    </CartCtx.Provider>
  );
}
