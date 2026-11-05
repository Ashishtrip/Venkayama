import { useEffect, useState } from "react";
import {
  actions,
  compressImage,
  DEFAULT_STOREFRONT,
  imgSrc,
  useDB,
  type AboutPoster,
  type CategoryThumb,
  type DropThumb,
  type HeroCard,
  type StorefrontConfig,
} from "../store";

const mono = "font-mono uppercase";
const disp = "font-display uppercase";

function SitePanel({
  title,
  kicker,
  right,
  children,
}: {
  title: string;
  kicker?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-black/15 bg-white">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-black px-6 py-4">
        <div>
          <h2 className={`${disp} text-2xl tracking-wide leading-none`}>{title}</h2>
          {kicker && <p className="mt-1 text-xs text-neutral-600">{kicker}</p>}
        </div>
        {right}
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}

export default function SiteTab() {
  const storefront = useDB((d) => d.storefront ?? DEFAULT_STOREFRONT);
  const products = useDB((d) => d.products);
  const [cfg, setCfg] = useState<StorefrontConfig>(storefront);
  const [savedSection, setSavedSection] = useState<string | null>(null);

  useEffect(() => {
    setCfg(storefront);
  }, [storefront]);

  const save = (sectionName: string) => {
    actions.updateStorefront(cfg);
    setSavedSection(sectionName);
    window.setTimeout(() => setSavedSection(null), 2000);
  };

  const patchHero1 = (v: Partial<HeroCard>) => setCfg((c) => ({ ...c, hero1: { ...c.hero1, ...v } }));
  const patchHero2 = (v: Partial<HeroCard>) => setCfg((c) => ({ ...c, hero2: { ...c.hero2, ...v } }));

  const pickProduct = (heroNum: 1 | 2, prodName: string) => {
    const p = products.find((x) => x.name === prodName);
    if (!p) return;
    const patch: Partial<HeroCard> = {
      productName: p.name,
      title: p.name,
      price: p.price || 1499,
      img: p.img,
    };
    if (heroNum === 1) patchHero1(patch);
    else patchHero2(patch);
  };

  const patchCategory = (idx: number, v: Partial<CategoryThumb>) =>
    setCfg((c) => ({
      ...c,
      categories: c.categories.map((cat, i) => (i === idx ? { ...cat, ...v } : cat)),
    }));

  const patchDrop = (idx: number, v: Partial<DropThumb>) =>
    setCfg((c) => ({
      ...c,
      pastDrops: c.pastDrops.map((d, i) => (i === idx ? { ...d, ...v } : d)),
    }));

  const removeDrop = (idx: number) =>
    setCfg((c) => ({
      ...c,
      pastDrops: c.pastDrops.filter((_, i) => i !== idx),
    }));

  const addDrop = () => {
    if (cfg.pastDrops.length >= 6) return;
    const nextIdx = cfg.pastDrops.length + 1;
    const newDrop: DropThumb = {
      id: `drop-${String(nextIdx).padStart(2, "0")}`,
      name: `Drop ${String(nextIdx).padStart(2, "0")}`,
      title: "New Drop Title",
      status: "COMING SOON",
      img: "f1497.png",
    };
    setCfg((c) => ({
      ...c,
      pastDrops: [...c.pastDrops, newDrop],
    }));
  };

  const patchAbout = (v: Partial<AboutPoster>) =>
    setCfg((c) => ({ ...c, aboutPoster: { ...c.aboutPoster, ...v } }));

  const handleUpload = async (onDone: (url: string) => void, file?: File) => {
    if (!file) return;
    try {
      const url = await compressImage(file);
      onDone(url);
    } catch (e) {
      alert((e as Error).message || "Image upload failed");
    }
  };

  const SaveButton = ({ section }: { section: string }) => (
    <button
      type="button"
      onClick={() => save(section)}
      className={`${mono} bg-[#8e8e8e] hover:bg-black text-white px-5 py-2 text-[10px] font-bold tracking-wider transition`}
    >
      {savedSection === section ? "SAVED ✓" : "SAVE"}
    </button>
  );

  const displayHero1Img = cfg.hero1.customImg || cfg.hero1.img;
  const displayHero2Img = cfg.hero2.customImg || cfg.hero2.img;

  return (
    <div className="space-y-8">
      {/* 1. HOME HERO CARDS */}
      <SitePanel
        title="Home hero cards"
        kicker="Two products shown large on the home page. Photos display in full colour at their natural shape. Add your own image for a sharper or custom look."
        right={<SaveButton section="hero" />}
      >
        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1 */}
          <div className="border border-black/15 bg-white p-5 space-y-4">
            <p className={`${mono} text-[10px] font-bold tracking-widest text-neutral-600`}>CARD 1</p>
            <div>
              <label className={`${mono} text-[9px] font-bold tracking-wider text-neutral-600 block mb-1`}>PRODUCT</label>
              <select
                value={cfg.hero1.productName}
                onChange={(e) => pickProduct(1, e.target.value)}
                className="w-full border border-black bg-white px-3 py-2 text-xs font-mono font-bold uppercase outline-none focus:bg-neutral-50"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`${mono} text-[9px] font-bold tracking-wider text-neutral-600 block mb-1`}>STICKER</label>
                <input
                  value={cfg.hero1.sticker ?? cfg.hero1.badge ?? "Staff pick"}
                  onChange={(e) => patchHero1({ sticker: e.target.value, badge: e.target.value })}
                  className="w-full border border-black bg-white px-3 py-2 text-xs font-mono outline-none focus:bg-neutral-50"
                />
              </div>
              <div>
                <label className={`${mono} text-[9px] font-bold tracking-wider text-neutral-600 block mb-1`}>SMALL HEADING</label>
                <input
                  value={cfg.hero1.heading ?? cfg.hero1.subtitle ?? "Series 004 // Hero spec"}
                  onChange={(e) => patchHero1({ heading: e.target.value, subtitle: e.target.value })}
                  className="w-full border border-black bg-white px-3 py-2 text-xs font-mono outline-none focus:bg-neutral-50"
                />
              </div>
            </div>

            <div>
              <label className={`${mono} text-[9px] font-bold tracking-wider text-neutral-600 block mb-1`}>CUSTOM IMAGE (OPTIONAL)</label>
              <div className="flex items-start gap-3">
                <div className="size-20 shrink-0 bg-neutral-200 border border-neutral-300 overflow-hidden flex items-center justify-center">
                  {displayHero1Img ? (
                    <img src={imgSrc(displayHero1Img)} alt="" className="size-full object-contain" />
                  ) : (
                    <span className={`${mono} text-[8px] text-neutral-400`}>Empty</span>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    value={cfg.hero1.customImg ?? ""}
                    onChange={(e) => patchHero1({ customImg: e.target.value })}
                    placeholder="Image URL or filename"
                    className="w-full border border-black bg-white px-3 py-2 text-xs font-mono outline-none focus:bg-neutral-50"
                  />
                  <label className={`${mono} inline-block border border-black bg-white px-3 py-1.5 text-[9px] font-bold tracking-wider cursor-pointer hover:bg-black hover:text-white transition`}>
                    Upload image
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => handleUpload((url) => patchHero1({ customImg: url }), e.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex gap-1.5 overflow-x-auto py-1">
                  {products.slice(0, 16).map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => patchHero1({ customImg: p.img })}
                      title={p.name}
                      className={`size-10 shrink-0 overflow-hidden border ${cfg.hero1.customImg === p.img ? "border-black ring-2 ring-black" : "border-neutral-300 opacity-80 hover:opacity-100"}`}
                    >
                      <img src={imgSrc(p.img)} alt={p.name} className="size-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <p className={`${mono} text-[9px] text-neutral-500 mt-2`}>Leave empty to use the product&apos;s own photo.</p>
              <p className={`${mono} text-[9px] text-neutral-500`}>Title and price come from the product, so they stay in sync with the shop.</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="border border-black/15 bg-white p-5 space-y-4">
            <p className={`${mono} text-[10px] font-bold tracking-widest text-neutral-600`}>CARD 2</p>
            <div>
              <label className={`${mono} text-[9px] font-bold tracking-wider text-neutral-600 block mb-1`}>PRODUCT</label>
              <select
                value={cfg.hero2.productName}
                onChange={(e) => pickProduct(2, e.target.value)}
                className="w-full border border-black bg-white px-3 py-2 text-xs font-mono font-bold uppercase outline-none focus:bg-neutral-50"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`${mono} text-[9px] font-bold tracking-wider text-neutral-600 block mb-1`}>STICKER</label>
                <input
                  value={cfg.hero2.sticker ?? cfg.hero2.badge ?? "Hot right now"}
                  onChange={(e) => patchHero2({ sticker: e.target.value, badge: e.target.value })}
                  className="w-full border border-black bg-white px-3 py-2 text-xs font-mono outline-none focus:bg-neutral-50"
                />
              </div>
              <div>
                <label className={`${mono} text-[9px] font-bold tracking-wider text-neutral-600 block mb-1`}>SMALL HEADING</label>
                <input
                  value={cfg.hero2.heading ?? cfg.hero2.subtitle ?? "Series 004 // Hero spec"}
                  onChange={(e) => patchHero2({ heading: e.target.value, subtitle: e.target.value })}
                  className="w-full border border-black bg-white px-3 py-2 text-xs font-mono outline-none focus:bg-neutral-50"
                />
              </div>
            </div>

            <div>
              <label className={`${mono} text-[9px] font-bold tracking-wider text-neutral-600 block mb-1`}>CUSTOM IMAGE (OPTIONAL)</label>
              <div className="flex items-start gap-3">
                <div className="size-20 shrink-0 bg-neutral-200 border border-neutral-300 overflow-hidden flex items-center justify-center">
                  {displayHero2Img ? (
                    <img src={imgSrc(displayHero2Img)} alt="" className="size-full object-contain" />
                  ) : (
                    <span className={`${mono} text-[8px] text-neutral-400`}>Empty</span>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    value={cfg.hero2.customImg ?? ""}
                    onChange={(e) => patchHero2({ customImg: e.target.value })}
                    placeholder="Image URL or filename"
                    className="w-full border border-black bg-white px-3 py-2 text-xs font-mono outline-none focus:bg-neutral-50"
                  />
                  <label className={`${mono} inline-block border border-black bg-white px-3 py-1.5 text-[9px] font-bold tracking-wider cursor-pointer hover:bg-black hover:text-white transition`}>
                    Upload image
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => handleUpload((url) => patchHero2({ customImg: url }), e.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex gap-1.5 overflow-x-auto py-1">
                  {products.slice(0, 16).map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => patchHero2({ customImg: p.img })}
                      title={p.name}
                      className={`size-10 shrink-0 overflow-hidden border ${cfg.hero2.customImg === p.img ? "border-black ring-2 ring-black" : "border-neutral-300 opacity-80 hover:opacity-100"}`}
                    >
                      <img src={imgSrc(p.img)} alt={p.name} className="size-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <p className={`${mono} text-[9px] text-neutral-500 mt-2`}>Leave empty to use the product&apos;s own photo.</p>
              <p className={`${mono} text-[9px] text-neutral-500`}>Title and price come from the product, so they stay in sync with the shop.</p>
            </div>
          </div>
        </div>
      </SitePanel>

      {/* 2. CATEGORY THUMBNAILS */}
      <SitePanel
        title="Category thumbnails"
        kicker="Tiles under Core departments on the home page. Built-in art shows black and white, uploaded photos keep their colour."
        right={<SaveButton section="categories" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cfg.categories.map((cat, idx) => {
            const labels = ["Tees", "Hoodies", "Caps", "Totes / accessories"];
            const catLabel = labels[idx] || cat.cat;
            return (
              <div key={cat.cat} className="border border-black/15 bg-white p-4 space-y-3">
                <span className={`${mono} text-[10px] font-bold tracking-widest text-neutral-700 block`}>
                  {catLabel}
                </span>
                <div className="flex items-start gap-3">
                  <div className="size-16 shrink-0 bg-neutral-100 border border-neutral-300 overflow-hidden flex items-center justify-center">
                    {cat.img ? (
                      <img src={imgSrc(cat.img)} alt={catLabel} className="size-full object-cover" />
                    ) : (
                      <span className={`${mono} text-[8px] text-neutral-400`}>Empty</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <input
                      value={cat.img}
                      onChange={(e) => patchCategory(idx, { img: e.target.value })}
                      placeholder="Image name / URL"
                      className="w-full border border-black bg-white px-2.5 py-1.5 text-xs font-mono outline-none"
                    />
                    <label className={`${mono} inline-block border border-black bg-white px-2.5 py-1 text-[9px] font-bold tracking-wider cursor-pointer hover:bg-black hover:text-white transition`}>
                      Upload image
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => handleUpload((url) => patchCategory(idx, { img: url }), e.target.files?.[0])}
                      />
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SitePanel>

      {/* 3. PAST DROPS */}
      <SitePanel
        title="Past drops"
        kicker="Thumbnails on the Drops page (up to 6)."
        right={<SaveButton section="drops" />}
      >
        <div className="space-y-4">
          {cfg.pastDrops.map((drop, idx) => (
            <div key={drop.id || idx} className="border border-black/15 bg-white p-4">
              <div className="grid gap-4 md:grid-cols-4 items-end">
                <div>
                  <label className={`${mono} text-[9px] font-bold tracking-wider text-neutral-600 block mb-1`}>LABEL</label>
                  <input
                    value={drop.name}
                    onChange={(e) => patchDrop(idx, { name: e.target.value })}
                    placeholder="Drop 03"
                    className="w-full border border-black bg-white px-3 py-2 text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className={`${mono} text-[9px] font-bold tracking-wider text-neutral-600 block mb-1`}>TITLE</label>
                  <input
                    value={drop.title}
                    onChange={(e) => patchDrop(idx, { title: e.target.value })}
                    placeholder="Temple Run"
                    className="w-full border border-black bg-white px-3 py-2 text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className={`${mono} text-[9px] font-bold tracking-wider text-neutral-600 block mb-1`}>STATUS LINE</label>
                  <input
                    value={drop.status}
                    onChange={(e) => patchDrop(idx, { status: e.target.value })}
                    placeholder="SOLD OUT IN 41 MIN"
                    className="w-full border border-black bg-white px-3 py-2 text-xs font-mono outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeDrop(idx)}
                    className={`${mono} border border-red-700 px-3 py-1.5 text-[9px] font-bold tracking-wider text-red-700 transition hover:bg-red-700 hover:text-white`}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="size-14 shrink-0 bg-neutral-100 border border-neutral-300 overflow-hidden flex items-center justify-center">
                  {drop.img ? (
                    <img src={imgSrc(drop.img)} alt={drop.title} className="size-full object-cover" />
                  ) : (
                    <span className={`${mono} text-[8px] text-neutral-400`}>Empty</span>
                  )}
                </div>
                <div className="flex-1 flex flex-wrap items-center gap-2">
                  <input
                    value={drop.img}
                    onChange={(e) => patchDrop(idx, { img: e.target.value })}
                    placeholder="Image name or URL"
                    className="min-w-0 max-w-sm flex-1 border border-black bg-white px-3 py-1.5 text-xs font-mono outline-none"
                  />
                  <label className={`${mono} border border-black bg-white px-3 py-1.5 text-[9px] font-bold tracking-wider cursor-pointer hover:bg-black hover:text-white transition`}>
                    Upload image
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => handleUpload((url) => patchDrop(idx, { img: url }), e.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>
            </div>
          ))}

          {cfg.pastDrops.length < 6 && (
            <button
              type="button"
              onClick={addDrop}
              className={`${mono} border border-dashed border-black/40 bg-white hover:bg-neutral-100 w-full py-3 text-[11px] font-bold tracking-wider`}
            >
              + Add past drop
            </button>
          )}
        </div>
      </SitePanel>

      {/* 4. ARCHIVE POSTER */}
      <SitePanel
        title="Archive poster"
        kicker="Large poster beside the manifesto on the Home and About pages."
        right={<SaveButton section="poster" />}
      >
        <div className="grid gap-6 md:grid-cols-2 items-start">
          <div className="space-y-4">
            <div>
              <label className={`${mono} text-[9px] font-bold tracking-wider text-neutral-600 block mb-1`}>POSTER IMAGE</label>
              <div className="flex items-start gap-3">
                <div className="size-24 shrink-0 bg-neutral-100 border border-neutral-300 overflow-hidden flex items-center justify-center">
                  {cfg.aboutPoster.img ? (
                    <img src={imgSrc(cfg.aboutPoster.img)} alt="" className="size-full object-cover" />
                  ) : (
                    <span className={`${mono} text-[8px] text-neutral-400`}>Empty</span>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    value={cfg.aboutPoster.img}
                    onChange={(e) => patchAbout({ img: e.target.value })}
                    placeholder="Image URL or filename"
                    className="w-full border border-black bg-white px-3 py-2 text-xs font-mono outline-none focus:bg-neutral-50"
                  />
                  <label className={`${mono} inline-block border border-black bg-white px-3 py-1.5 text-[9px] font-bold tracking-wider cursor-pointer hover:bg-black hover:text-white transition`}>
                    Upload image
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => handleUpload((url) => patchAbout({ img: url }), e.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className={`${mono} text-[9px] font-bold tracking-wider text-neutral-600 block mb-1`}>TOP LABEL</label>
              <input
                value={cfg.aboutPoster.tag}
                onChange={(e) => patchAbout({ tag: e.target.value })}
                placeholder="Madras archive // Dispatch 004"
                className="w-full border border-black bg-white px-3 py-2 text-xs font-mono outline-none focus:bg-neutral-50"
              />
            </div>

            <div>
              <label className={`${mono} text-[9px] font-bold tracking-wider text-neutral-600 block mb-1`}>SMALL HEADING</label>
              <input
                value={cfg.aboutPoster.heading ?? "Manifesto excerpt"}
                onChange={(e) => patchAbout({ heading: e.target.value })}
                placeholder="Manifesto excerpt"
                className="w-full border border-black bg-white px-3 py-2 text-xs font-mono outline-none focus:bg-neutral-50"
              />
            </div>

            <div>
              <label className={`${mono} text-[9px] font-bold tracking-wider text-neutral-600 block mb-1`}>HEADLINE QUOTE</label>
              <input
                value={cfg.aboutPoster.quote}
                onChange={(e) => patchAbout({ quote: e.target.value })}
                placeholder='"We wear our roots like armor."'
                className="w-full border border-black bg-white px-3 py-2 text-xs font-mono outline-none focus:bg-neutral-50"
              />
            </div>

            <div>
              <label className={`${mono} text-[9px] font-bold tracking-wider text-neutral-600 block mb-1`}>CAPTION</label>
              <textarea
                rows={3}
                value={cfg.aboutPoster.subtext}
                onChange={(e) => patchAbout({ subtext: e.target.value })}
                placeholder="No fast fashion. No plastic blends. Pure heavy Sri Lankan cotton, made in India."
                className="w-full border border-black bg-white px-3 py-2 text-xs outline-none focus:bg-neutral-50"
              />
            </div>
          </div>

          <div>
            <p className={`${mono} text-[9px] font-bold tracking-wider text-neutral-500 mb-2`}>PREVIEW</p>
            <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900 text-white shadow-xl">
              <img
                src={imgSrc(cfg.aboutPoster.img)}
                alt="Poster Preview"
                className="absolute inset-0 size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <span className={`${mono} absolute left-4 top-4 bg-white px-3 py-1.5 text-[9px] font-bold text-black`}>
                {cfg.aboutPoster.tag}
              </span>
              <div className="absolute inset-x-6 bottom-6">
                <p className={`${mono} mb-2 text-[10px] tracking-wider text-white/70`}>
                  {cfg.aboutPoster.heading || "Manifesto excerpt"}
                </p>
                <p className={`${disp} text-3xl leading-tight`}>{cfg.aboutPoster.quote}</p>
                <p className={`${mono} mt-2 text-[10px] text-white/80`}>{cfg.aboutPoster.subtext}</p>
              </div>
            </div>
          </div>
        </div>
      </SitePanel>
    </div>
  );
}

