import OnionLogo from "./components/OnionLogo"
import {
  actions,
  checkPromo,
  getDB,
  imgSrc,
  isMono,
  promoAmount,
  quoteOrder,
  useDB,
  type PromoInfo,
} from "./store"
import { projectId, publicAnonKey } from "../utils/supabase/info"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useSession } from "./Auth"
import { useUserProfile, type UserAddress, type UserOrderRecord } from "./lib/userProfile"
import { downloadGSTInvoice } from "./lib/invoiceGenerator"

const mono = "font-mono uppercase"
const disp = "font-display uppercase"
const inr = (n: number) => "₹" + n.toLocaleString("en-IN")

export type CartLine = {
  key: string
  name: string
  img: string
  size: string
  price: number
  qty: number
}
type Ctx = {
  lines: CartLine[]
  count: number
  add: (l: Omit<CartLine, "key" | "qty">, buyNow?: boolean) => void
  open: () => void
}
const CartCtx = createContext<Ctx>({
  lines: [],
  count: 0,
  add: () => {},
  open: () => {},
})
export const useCart = () => useContext(CartCtx)

type View = "cart" | "checkout"

const CART_STORAGE_KEY = "venkayam_cart_v1"

function loadSavedCart(): CartLine[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}
  return []
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(loadSavedCart)

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines))
    } catch {}
  }, [lines])
  const [isOpen, setOpen] = useState(false)
  const [view, setView] = useState<View>("cart")
  const [pay, setPay] = useState<"UPI" | "Card">("UPI")
  const [orderId, setOrderId] = useState("")
  const [trackCode, setTrackCode] = useState("")
  const [completedOrder, setCompletedOrder] = useState<UserOrderRecord | null>(null)
  const [stage, setStage] = useState<null | "loading" | "done">(null)
  const [progress, setProgress] = useState(0)
  const [paid, setPaid] = useState(0)
  const settings = useDB((d) => d.settings)
  const FREE_SHIP = settings.freeShip
  const [code, setCode] = useState("")
  const [applied, setApplied] = useState("")
  const [promo, setPromo] = useState<PromoInfo | null>(null)
  const [codeMsg, setCodeMsg] = useState("")
  const session = useSession()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const { profile, recordOrder } = useUserProfile()

  const defaultAddr = useMemo(
    () => profile.addresses.find((a) => a.isDefault) || profile.addresses[0],
    [profile.addresses],
  )
  const [shippingFields, setShippingFields] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    pin: "",
  })

  useEffect(() => {
    if (defaultAddr) {
      setShippingFields({
        name: defaultAddr.name || profile.fullName || "",
        phone: defaultAddr.phone || profile.phone || "",
        address: defaultAddr.address || "",
        city: defaultAddr.city || "",
        pin: defaultAddr.pin || "",
      })
    } else {
      setShippingFields((prev) => ({
        ...prev,
        name: prev.name || profile.fullName || "",
        phone: prev.phone || profile.phone || "",
      }))
    }
  }, [defaultAddr, profile.fullName, profile.phone])

  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0)
  const count = lines.reduce((a, l) => a + l.qty, 0)
  const disc = { amount: promo ? promoAmount(promo, subtotal) : 0 }
  const after = subtotal - disc.amount
  const shipping = subtotal === 0 || after >= FREE_SHIP ? 0 : settings.shipFee
  const total = after + shipping

  const ctx = useMemo<Ctx>(
    () => ({
      lines,
      count,
      open: () => {
        setView("cart")
        setOpen(true)
      },
      add: (l, buyNow) => {
        if (!session) {
          setShowLoginPrompt(true)
          return
        }
        const key = `${l.name}|${l.size}`
        setLines((ls) =>
          ls.some((x) => x.key === key)
            ? ls.map((x) => (x.key === key ? { ...x, qty: x.qty + 1 } : x))
            : [...ls, { ...l, key, qty: 1 }],
        )
        setView(buyNow ? "checkout" : "cart")
        setOpen(true)
      },
    }),
    [lines, count, session],
  )

  useEffect(() => {
    if (session) setShowLoginPrompt(false)
  }, [session])

  useEffect(() => {
    document.body.style.overflow = isOpen || showLoginPrompt ? "hidden" : ""
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        setShowLoginPrompt(false)
      }
    }
    window.addEventListener("keydown", esc)
    return () => window.removeEventListener("keydown", esc)
  }, [isOpen, showLoginPrompt])

  const [checkingCode, setCheckingCode] = useState(false)

  const setQty = (key: string, d: number) =>
    setLines((ls) =>
      ls.flatMap((l) => {
        if (l.key !== key) return [l]
        const stock =
          getDB().products.find((p) => p.name === l.name)?.sizes[l.size] ?? 99
        const qty = Math.min(l.qty + d, stock)
        return qty <= 0 ? [] : [{ ...l, qty }]
      }),
    )

  const applyCode = async () => {
    const clean = code.trim().toUpperCase()
    if (!clean) {
      setCodeMsg("Enter a promo code")
      return
    }
    setCheckingCode(true)
    try {
      const res = await checkPromo(clean)
      if (res.error || !res.code) {
        setCodeMsg(res.error ?? "Code not recognised")
        setApplied("")
        setPromo(null)
        return
      }
      const info = res as PromoInfo
      setApplied(info.code)
      setPromo(info)
      setCode(info.code)
      setCodeMsg(
        `${info.code} applied, saving ${inr(promoAmount(info, subtotal))}`,
      )
    } catch {
      setCodeMsg("Could not check the code. Try again.")
    } finally {
      setCheckingCode(false)
    }
  }

  const removePromo = () => {
    setApplied("")
    setPromo(null)
    setCode("")
    setCodeMsg("")
  }

  const [paying, setPaying] = useState(false)
  const [payErr, setPayErr] = useState("")

  const finish = async (f: FormData, paymentId: string) => {
    const customer = String(f.get("name"))
    const phone = String(f.get("phone"))
    const address = String(f.get("address"))
    const city = String(f.get("city"))
    const orderItems = lines.map((l) => ({
      name: l.name,
      size: l.size,
      qty: l.qty,
      price: l.price,
    }))

    const order = await actions.placeOrder({
      customer,
      phone,
      address,
      city,
      pay,
      amount: total,
      promo: applied || undefined,
      paymentId,
      items: orderItems,
    })

    // Record into user profile order history
    const placedRecord: UserOrderRecord = {
      id: order.id,
      track: order.track ?? "",
      createdAt: Date.now(),
      customer,
      phone,
      city,
      address,
      pay,
      status: "Placed",
      amount: total,
      items: orderItems,
    }
    recordOrder(placedRecord)
    setCompletedOrder(placedRecord)

    setOrderId(order.id)
    setTrackCode(order.track ?? "")
    setPaid(total)
    setApplied("")
    setPromo(null)
    setCode("")
    setCodeMsg("")
    setLines([])
    setOpen(false)
    setProgress(0)
    setStage("loading")
  }

  const api = (path: string, body: unknown) =>
    fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ec741b02/razorpay/${path}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(body),
      },
    ).then(async (r) => {
      const t = await r.text()
      try {
        return JSON.parse(t)
      } catch {
        throw new Error(
          `Payment server unavailable (${r.status}). Make sure the server function is deployed.`,
        )
      }
    })

  const loadRzp = () =>
    new Promise<boolean>((res) => {
      if ((window as any).Razorpay) return res(true)
      const s = document.createElement("script")
      s.src = "https://checkout.razorpay.com/v1/checkout.js"
      s.onload = () => res(true)
      s.onerror = () => res(false)
      document.body.appendChild(s)
    })

  const place = async (e: React.FormEvent) => {
    e.preventDefault()
    if (paying) return
    const f = new FormData(e.currentTarget as HTMLFormElement)
    setPayErr("")
    setPaying(true)
    try {
      if (!(await loadRzp()))
        throw new Error("Could not load payment window. Check your connection.")
      // The database is the source of truth for price, stock, discount and shipping.
      const q = await quoteOrder(
        lines.map((l) => ({ name: l.name, size: l.size, qty: l.qty })),
        applied || undefined,
      )
      if (q.total !== total)
        throw new Error(
          `Prices or shipping changed. The total is now ${inr(q.total)}. Review your cart and try again.`,
        )
      const o = await api("order", {
        amount: q.total,
        receipt: `VNK-${Date.now()}`,
      })
      if (o.error || !o.orderId)
        throw new Error(o.error || "Could not start payment")
      const rzp = new (window as any).Razorpay({
        key: o.keyId,
        order_id: o.orderId,
        amount: o.amount,
        currency: o.currency,
        name: "Venkayam India",
        description: "Streetwear order",
        theme: { color: "#000000" },
        prefill: {
          name: String(f.get("name")),
          contact: String(f.get("phone")),
        },
        config: {
          display: {
            preferences: { show_default_blocks: true },
            sequence: [pay === "UPI" ? "block.upi" : "block.card"],
          },
        },
        handler: async (r: any) => {
          try {
            const v = await api("verify", r)
            if (!v.verified)
              throw new Error(
                "Payment could not be verified. If money was deducted, contact us with ID " +
                  r.razorpay_payment_id,
              )
            await finish(f, r.razorpay_payment_id).catch((e: Error) => {
              throw new Error(
                `Payment received but the order could not be saved (${e.message}). Contact us with payment ID ${r.razorpay_payment_id}.`,
              )
            })
          } catch (err) {
            setPayErr((err as Error).message)
          } finally {
            setPaying(false)
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      })
      rzp.on("payment.failed", (r: any) => {
        setPayErr(r?.error?.description || "Payment failed. Try again.")
        setPaying(false)
      })
      rzp.open()
    } catch (err) {
      setPayErr((err as Error).message)
      setPaying(false)
    }
  }

  useEffect(() => {
    if (stage !== "loading") return
    const id = window.setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 1 + Math.random() * 4)
        if (next >= 100) {
          clearInterval(id)
          window.setTimeout(() => setStage("done"), 450)
        }
        return next
      })
    }, 70)
    return () => clearInterval(id)
  }, [stage])

  useEffect(() => {
    if (stage) document.body.style.overflow = "hidden"
    else if (!isOpen) document.body.style.overflow = ""
  }, [stage, isOpen])

  return (
    <CartCtx.Provider value={ctx}>
      {children}
      <div
        className={`fixed inset-0 z-[100] transition ${
          isOpen ? "" : "pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <header className="flex items-center justify-between border-b-2 border-black px-6 py-4">
            <h2 className={`${disp} text-3xl leading-none`}>
              {view === "checkout" ? "Checkout" : `Bag [${count}]`}
            </h2>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className={`${mono} text-xs font-bold tracking-widest`}
            >
              Close ✕
            </button>
          </header>

          {view === "cart" ? (
            <>
              <div className="flex-1 overflow-y-auto p-6">
                {lines.length === 0 ? (
                  <p
                    className={`${mono} py-20 text-center text-[11px] tracking-wider text-neutral-500`}
                  >
                    Your bag is empty.
                  </p>
                ) : (
                  <>
                    <div className="mb-6">
                      <p
                        className={`${mono} mb-1 text-[10px] font-bold tracking-wider`}
                      >
                        {subtotal >= FREE_SHIP
                          ? "Free shipping unlocked"
                          : `${inr(FREE_SHIP - subtotal)} away from free shipping`}
                      </p>
                      <div className="h-1.5 bg-neutral-200">
                        <div
                          className="h-full bg-black transition-all"
                          style={{
                            width: `${Math.min(100, (subtotal / FREE_SHIP) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <ul className="divide-y divide-black/10">
                      {lines.map((l) => (
                        <li key={l.key} className="flex gap-4 py-4">
                          <img
                            src={imgSrc(l.img)}
                            alt=""
                            className={`h-24 w-20 shrink-0 bg-neutral-200 object-cover ${
                              isMono(l.img) ? "grayscale" : ""
                            }`}
                          />
                          <div className="flex min-w-0 flex-1 flex-col">
                            <p className="text-[13px] font-extrabold uppercase leading-snug">
                              {l.name}
                            </p>
                            <p
                              className={`${mono} mt-1 text-[10px] tracking-wider text-neutral-500`}
                            >
                              Size {l.size}
                            </p>
                            <div className="mt-auto flex items-center justify-between">
                              <div className="flex items-center border border-black">
                                <button
                                  onClick={() => setQty(l.key, -1)}
                                  aria-label="Decrease"
                                  className="size-7 hover:bg-neutral-200"
                                >
                                  −
                                </button>
                                <span
                                  className={`${mono} w-7 text-center text-[11px] font-bold`}
                                >
                                  {l.qty}
                                </span>
                                <button
                                  onClick={() => setQty(l.key, 1)}
                                  aria-label="Increase"
                                  className="size-7 hover:bg-neutral-200"
                                >
                                  +
                                </button>
                              </div>
                              <span className={`${mono} text-[12px] font-bold`}>
                                {inr(l.price * l.qty)}
                              </span>
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
                  <div
                    className={`${mono} flex justify-between text-[11px] font-bold tracking-wider`}
                  >
                    <span>Subtotal</span>
                    <span>{inr(subtotal)}</span>
                  </div>
                  {applied ? (
                    <div className="flex items-center justify-between border border-black bg-neutral-50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`${mono} text-[10px] font-bold tracking-wider text-emerald-700`}
                        >
                          ✓ {applied}
                        </span>
                        {disc.amount > 0 && (
                          <span
                            className={`${mono} text-[10px] text-neutral-500`}
                          >
                            −{inr(disc.amount)}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={removePromo}
                        className={`${mono} text-[10px] font-bold tracking-wider text-neutral-500 hover:text-black underline`}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value.toUpperCase())
                          if (codeMsg) setCodeMsg("")
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            applyCode()
                          }
                        }}
                        placeholder="PROMO CODE"
                        aria-label="Promo code"
                        className={`${mono} min-w-0 flex-1 border border-black px-3 py-2 text-[10px] tracking-widest outline-none`}
                      />
                      <button
                        type="button"
                        disabled={checkingCode}
                        onClick={applyCode}
                        className={`${mono} border border-black px-4 text-[10px] font-bold tracking-wider hover:bg-black hover:text-white disabled:opacity-50`}
                      >
                        {checkingCode ? "Checking…" : "Apply"}
                      </button>
                    </div>
                  )}
                  {codeMsg && (
                    <p
                      className={`${mono} text-[10px] tracking-wider ${
                        applied ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      {codeMsg}
                    </p>
                  )}
                  {disc.amount > 0 && (
                    <div
                      className={`${mono} flex justify-between text-[10px] tracking-wider text-emerald-700`}
                    >
                      <span>Discount</span>
                      <span>−{inr(disc.amount)}</span>
                    </div>
                  )}
                  <div
                    className={`${mono} flex justify-between text-[10px] tracking-wider text-neutral-500`}
                  >
                    <span>Shipping</span>
                    <span>{shipping ? inr(shipping) : "Free"}</span>
                  </div>
                  <button
                    onClick={() => setView("checkout")}
                    className={`${mono} w-full bg-black py-4 text-[11px] font-bold tracking-[0.15em] text-white transition hover:bg-neutral-800`}
                  >
                    Checkout • {inr(total)}
                  </button>
                </footer>
              )}
            </>
          ) : (
            <form
              onSubmit={place}
              className="flex flex-1 flex-col overflow-y-auto"
            >
              <div className="flex-1 space-y-4 p-6">
                <button
                  type="button"
                  onClick={() => setView("cart")}
                  className={`${mono} text-[10px] font-bold tracking-wider underline`}
                >
                  ← Back to bag
                </button>

                {profile.addresses.length > 0 && (
                  <div className="border border-black bg-neutral-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={`${mono} text-[9px] font-bold tracking-wider text-neutral-600`}
                      >
                        Saved shipping addresses
                      </span>
                      <a
                        href="#/profile/addresses"
                        onClick={() => setOpen(false)}
                        className={`${mono} text-[9px] underline text-neutral-700`}
                      >
                        Manage
                      </a>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.addresses.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setShippingFields({
                              name: a.name,
                              phone: a.phone,
                              address: a.address,
                              city: a.city,
                              pin: a.pin,
                            })
                          }}
                          className={`${mono} border px-2.5 py-1 text-[9px] font-bold transition ${
                            shippingFields.address === a.address
                              ? "border-black bg-black text-white"
                              : "border-black/30 bg-white hover:border-black"
                          }`}
                        >
                          {a.label} ({a.city})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {[
                  { n: "name", l: "Full name", t: "text", val: shippingFields.name, setVal: (v: string) => setShippingFields((s) => ({ ...s, name: v })) },
                  { n: "phone", l: "Phone", t: "tel", val: shippingFields.phone, setVal: (v: string) => setShippingFields((s) => ({ ...s, phone: v })) },
                  { n: "address", l: "Delivery address", t: "text", val: shippingFields.address, setVal: (v: string) => setShippingFields((s) => ({ ...s, address: v })) },
                  { n: "city", l: "City", t: "text", val: shippingFields.city, setVal: (v: string) => setShippingFields((s) => ({ ...s, city: v })) },
                  { n: "pin", l: "PIN code", t: "text", val: shippingFields.pin, setVal: (v: string) => setShippingFields((s) => ({ ...s, pin: v })) },
                ].map(({ n, l, t, val, setVal }) => (
                  <label key={n} className="block">
                    <span className={`${mono} text-[10px] font-bold tracking-wider`}>{l}</span>
                    <input
                      required
                      name={n}
                      type={t}
                      value={val}
                      onChange={(e) => setVal(e.target.value)}
                      className="mt-1 w-full border border-black px-3 py-3 text-sm outline-none focus:bg-neutral-100"
                    />
                  </label>
                ))}
                <fieldset>
                  <legend
                    className={`${mono} mb-2 text-[10px] font-bold tracking-wider`}
                  >
                    Payment
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    {(["UPI", "Card"] as const).map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setPay(p)}
                        aria-pressed={pay === p}
                        className={`${mono} border border-black py-3 text-[11px] font-bold tracking-wider ${
                          pay === p
                            ? "bg-black text-white"
                            : "hover:bg-neutral-200"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* Promo Code claim in Checkout */}
                <div className="border-t border-black/10 pt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className={`${mono} text-[10px] font-bold tracking-wider`}
                    >
                      Promo code
                    </span>
                    {applied && (
                      <button
                        type="button"
                        onClick={removePromo}
                        className={`${mono} text-[9px] font-bold tracking-wider text-neutral-500 hover:text-black underline`}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {applied ? (
                    <div className="flex items-center justify-between border-2 border-emerald-700 bg-emerald-50/50 p-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-emerald-700">
                            ✓
                          </span>
                          <span
                            className={`${mono} text-[11px] font-bold tracking-wider text-emerald-800`}
                          >
                            {applied}
                          </span>
                        </div>
                        <p
                          className={`${mono} mt-0.5 text-[9px] tracking-wide text-emerald-700`}
                        >
                          {promo?.type === "percent"
                            ? `${promo.value}% OFF`
                            : `${inr(promo?.value ?? 0)} OFF`}{" "}
                          • Saving {inr(disc.amount)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removePromo}
                        aria-label="Remove promo code"
                        className={`${mono} border border-emerald-700 px-2.5 py-1 text-[10px] font-bold tracking-wider text-emerald-800 transition hover:bg-emerald-700 hover:text-white`}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <input
                          value={code}
                          onChange={(e) => {
                            setCode(e.target.value.toUpperCase())
                            if (codeMsg) setCodeMsg("")
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              applyCode()
                            }
                          }}
                          placeholder="ENTER PROMO CODE"
                          aria-label="Claim promo code"
                          className={`${mono} min-w-0 flex-1 border border-black px-3 py-2.5 text-[11px] tracking-widest outline-none focus:bg-neutral-50`}
                        />
                        <button
                          type="button"
                          disabled={checkingCode || !code.trim()}
                          onClick={applyCode}
                          className={`${mono} border border-black bg-black px-4 py-2.5 text-[10px] font-bold tracking-wider text-white transition hover:bg-neutral-800 disabled:opacity-40`}
                        >
                          {checkingCode ? "Checking…" : "Claim"}
                        </button>
                      </div>
                      {codeMsg && (
                        <p
                          className={`${mono} mt-1.5 text-[10px] tracking-wider ${
                            applied ? "text-emerald-700" : "text-red-700"
                          }`}
                        >
                          {codeMsg}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Order breakdown */}
                <div className="space-y-2 border-t border-black/10 pt-4">
                  <p
                    className={`${mono} mb-2 text-[10px] font-bold tracking-wider text-neutral-500`}
                  >
                    Order summary
                  </p>
                  {lines.map((l) => (
                    <p key={l.key} className="flex justify-between text-[13px]">
                      <span className="truncate pr-3">
                        {l.name} ({l.size}) ×{l.qty}
                      </span>
                      <span className={`${mono} font-bold`}>
                        {inr(l.price * l.qty)}
                      </span>
                    </p>
                  ))}
                  <div
                    className={`${mono} flex justify-between pt-1 text-[11px] text-neutral-600`}
                  >
                    <span>Subtotal</span>
                    <span>{inr(subtotal)}</span>
                  </div>
                  {disc.amount > 0 && (
                    <p
                      className={`${mono} flex justify-between text-[11px] font-bold text-emerald-700`}
                    >
                      <span>Promo ({applied})</span>
                      <span>−{inr(disc.amount)}</span>
                    </p>
                  )}
                  <div
                    className={`${mono} flex justify-between text-[11px] text-neutral-600`}
                  >
                    <span>Shipping</span>
                    <span>{shipping ? inr(shipping) : "Free"}</span>
                  </div>
                  <div
                    className={`${mono} flex justify-between border-t border-black/10 pt-2 text-[12px] font-bold`}
                  >
                    <span>Total</span>
                    <span>{inr(total)}</span>
                  </div>
                </div>
              </div>
              <footer className="border-t-2 border-black p-6">
                {payErr && (
                  <p
                    role="alert"
                    className={`${mono} mb-3 border border-red-600 p-2 text-[10px] font-bold tracking-wider text-red-600`}
                  >
                    {payErr}
                  </p>
                )}
                <button
                  disabled={paying}
                  className={`${mono} w-full bg-black py-4 text-[11px] font-bold tracking-[0.15em] text-white transition hover:bg-neutral-800 disabled:opacity-50`}
                >
                  {paying ? "Opening payment…" : `Pay ${inr(total)}`}
                </button>
              </footer>
            </form>
          )}
        </aside>
      </div>
      {stage && (
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white px-6 text-center text-black"
          role="status"
          aria-live="polite"
        >
          <span>
            {stage === "loading" ? (
              <OnionLogo className="h-40" />
            ) : (
              <OnionLogo className="h-40 md:h-52" />
            )}
          </span>
          {stage === "loading" ? (
            <div className="mt-10 w-full max-w-xs">
              <p
                className={`${mono} mb-3 flex justify-between text-[11px] font-bold tracking-[0.2em]`}
              >
                <span>Placing your order</span>
                <span className="tabular-nums">{Math.floor(progress)}%</span>
              </p>
              <div className="h-1.5 bg-black/15">
                <div
                  className="h-full bg-black"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="mt-10 animate-[fadeUp_.8s_cubic-bezier(.22,1,.36,1)_both]">
              <h2
                className={`${disp} text-[clamp(3.5rem,12vw,8rem)] leading-[0.9]`}
              >
                Order placed
              </h2>
              <p
                className={`${mono} mt-4 text-[11px] tracking-[0.2em] text-black/60`}
              >
                Ref {orderId} • {inr(paid)} • Dispatch from New Delhi in 24h
              </p>
              {trackCode && (
                <p
                  className={`${mono} mt-3 text-[11px] font-bold tracking-[0.2em]`}
                >
                  Tracking code{" "}
                  <span className="select-all border-2 border-black px-2 py-1">
                    {trackCode}
                  </span>
                </p>
              )}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {completedOrder && (
                  <button
                    type="button"
                    onClick={() => downloadGSTInvoice(completedOrder)}
                    className={`${mono} flex items-center gap-2 border-2 border-black bg-white px-6 py-4 text-[11px] font-bold tracking-[0.15em] text-black shadow-[4px_4px_0_0_#000] transition hover:bg-neutral-100`}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download GST Invoice
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setStage(null)
                    setCompletedOrder(null)
                  }}
                  className={`${mono} bg-black px-8 py-4 text-[11px] font-bold tracking-[0.15em] text-white transition hover:bg-neutral-800`}
                >
                  Keep shopping
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {showLoginPrompt && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-6"
          onClick={() => setShowLoginPrompt(false)}
        >
          <div
            className="w-full max-w-sm bg-white p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center">
              <OnionLogo className="h-16" />
            </div>
            <h2 className={`${disp} mt-5 text-center text-3xl leading-none`}>
              Login required
            </h2>
            <p className="mt-3 text-center text-sm text-neutral-600">
              You need to log in or create an account before you can add items
              to your bag and place orders.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <a
                href="#/login"
                onClick={() => setShowLoginPrompt(false)}
                className={`${mono} bg-black py-3.5 text-center text-[11px] font-bold tracking-[0.15em] text-white transition hover:bg-neutral-800`}
              >
                Log in
              </a>
              <a
                href="#/signup"
                onClick={() => setShowLoginPrompt(false)}
                className={`${mono} border border-black py-3.5 text-center text-[11px] font-bold tracking-[0.15em] transition hover:bg-neutral-200`}
              >
                Sign up
              </a>
            </div>
            <button
              onClick={() => setShowLoginPrompt(false)}
              className={`${mono} mt-4 w-full py-2 text-[10px] tracking-wider text-neutral-500 hover:text-black`}
            >
              Continue browsing
            </button>
          </div>
        </div>
      )}
    </CartCtx.Provider>
  )
}

export default CartProvider
