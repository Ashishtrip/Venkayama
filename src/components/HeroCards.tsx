// HeroCards.tsx
// Requires: Tailwind CSS v4, fonts Anton (font-display), Space Mono (font-mono)

export type Product = {
  id: string
  name: string
  price: number
  img: string
  stock?: string
}
export type HeroCard = { kicker: string badge: string img?: string }

const mono = "font-mono uppercase"
const disp = "font-display uppercase"
const inr = (n: number) => "₹" + n.toLocaleString("en-IN")
const toSrc = (s?: string) =>
  !s ? "" : /^(https?:|data:|\/)/.test(s) ? s : `/assets/${s}`

const Arrow = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="square"
  >
    <path d="M4 12h16M14 6l6 6-6 6" />
  </svg>
)

export default function HeroCards({
  items,
}: {
  items: { card: HeroCard product: Product href: string }[]
}) {
  if (!items.length) return null
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:col-span-8">
      {items.map(({ card, product: p, href }, i) => (
        <a
          key={p.id}
          href={href}
          aria-label={`${p.name}, ${
            p.price > 0 ? inr(p.price) : "coming soon"
          }`}
          className={`group relative block border-2 border-black bg-black text-white shadow-[8px_8px_0_0_#000] transition duration-300 hover:-translate-y-1 hover:rotate-0 hover:shadow-[12px_12px_0_0_#000] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-black ${
            i % 2 === 0 ? "-rotate-1" : "rotate-1 sm:mt-10"
          }`}
        >
          {/* Image panel: native 461:343 ratio, no crop, no filter */}
          <div className="relative aspect-[461/343] overflow-hidden bg-[#f8eadf]">
            <img
              src={toSrc(card.img || p.img)}
              alt={p.name}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              className="size-full object-contain transition duration-500 group-hover:scale-[1.04]"
            />
            <span
              className={`${mono} absolute left-3 top-3 -rotate-3 bg-black px-3 py-1.5 text-[10px] font-bold tracking-[0.12em] text-white shadow-[3px_3px_0_0_#fff]`}
            >
              {card.badge || "Featured"}
            </span>
            <span
              className={`${mono} absolute bottom-3 right-3 rotate-2 border-2 border-black bg-white px-2 py-1 text-[9px] font-bold tracking-[0.12em] text-black`}
            >
              Front + Back
            </span>
          </div>

          {/* Caption bar */}
          <div className="flex items-end justify-between gap-4 p-5">
            <div className="min-w-0">
              <p
                className={`${mono} mb-2 text-[10px] tracking-[0.2em] text-white/60`}
              >
                {card.kicker}
              </p>
              <h2
                className={`${disp} truncate text-4xl leading-none md:text-5xl`}
              >
                {p.name}
              </h2>
              <p className={`${mono} mt-2 text-xs font-bold`}>
                {p.price > 0 ? inr(p.price) : "COMING SOON"}
                {p.stock && (
                  <span className="ml-2 font-normal text-white/50">
                    {p.stock}
                  </span>
                )}
              </p>
            </div>
            <span
              className="grid size-14 shrink-0 place-items-center rounded-full bg-white text-black transition group-hover:translate-x-1 group-hover:-rotate-12"
              aria-hidden="true"
            >
              <Arrow />
            </span>
          </div>
        </a>
      ))}
    </div>
  )
}
