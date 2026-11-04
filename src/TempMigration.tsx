/* =====================================================================================
   TEMP-MIGRATION: one-shot sync of this browser's old store data -> Supabase.
   Run once in the Arc profile that holds the old data (same origin as before), then DELETE:
     1. this file (src/TempMigration.tsx)
     2. the `import TempMigration` line and the `<TempMigration />` line in src/Admin.tsx
   Nothing else depends on it. Admin-only: RLS rejects every write from non-admins.
   ===================================================================================== */
import { useEffect, useState } from "react";
import { getSupabase } from "./lib/supabase";
import { getDB, LEGACY_STORAGE_KEY, refresh, rowMappers as M, saveMedia, seed, type DB, type Product } from "./store";

const sb = getSupabase();
const mono = "font-mono uppercase";

const readLegacy = (): DB | null => {
  try { const raw = localStorage.getItem(LEGACY_STORAGE_KEY); return raw ? (JSON.parse(raw) as DB) : null; } catch { return null; }
};
const readIdb = (key: string): Promise<Blob | undefined> =>
  new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(undefined);
    const r = indexedDB.open("venkayam-media", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("img");
    r.onerror = () => resolve(undefined);
    r.onsuccess = () => {
      const g = r.result.transaction("img", "readonly").objectStore("img").get(key);
      g.onsuccess = () => { r.result.close(); resolve(g.result as Blob | undefined); };
      g.onerror = () => { r.result.close(); resolve(undefined); };
    };
  });

// Cast to the Postgres column types (price/stock are int, never strings or floats).
const int = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));
const clean = (p: Product): Product => ({ ...p, price: int(p.price), was: int(p.was), sold: int(p.sold), claimed: int(p.claimed), threshold: int(p.threshold), sizes: Object.fromEntries(Object.entries(p.sizes ?? {}).map(([k, v]) => [k, int(v)])) });

async function runSync(log: (m: string) => void): Promise<void> {
  const legacy = readLegacy();
  const d: DB = legacy ?? seed(); // fallback: built-in 36 sample tees when this profile has no local data
  log(legacy ? "Source: this browser's localStorage" : "Source: built-in 36 sample tees (no local data in this profile)");

  const moved = new Map<string, string>();
  const up = async (v: string) => {
    if (!v || !(v.startsWith("idb:") || v.startsWith("data:"))) return v;
    if (!moved.has(v)) {
      const blob = v.startsWith("idb:") ? await readIdb(v) : await (await fetch(v)).blob();
      if (!blob) { log(`  photo missing in IndexedDB: ${v}`); moved.set(v, "/products/01.jpg"); } else moved.set(v, await saveMedia(blob));
    }
    return moved.get(v)!;
  };
  const must = async (what: string, q: PromiseLike<{ error: { message: string } | null }>) => {
    const { error } = await q; if (error) throw new Error(`${what}: ${error.message}`); log(`OK ${what}`);
  };

  const have = new Set(getDB().products.map((p) => p.name));
  const products: Product[] = [];
  for (const p of d.products.filter((x) => !have.has(x.name)).map(clean)) products.push({ ...p, img: await up(p.img), gallery: p.gallery ? await Promise.all(p.gallery.map(up)) : undefined });
  if (products.length) await must(`products (${products.length})`, sb.from("products").upsert(products.map(M.toProduct), { onConflict: "id" }));
  else log("products: all already in Supabase, skipped");

  if (legacy) {
    const looks = await Promise.all(d.looks.map(async (l) => ({ ...l, img: await up(l.img) })));
    if (looks.length) await must(`looks (${looks.length})`, sb.from("looks").upsert(looks.map(M.toLook), { onConflict: "id" }));
    if (d.promos.length) await must(`promos (${d.promos.length})`, sb.from("promos").upsert(d.promos.map((p) => M.toPromo({ ...p, value: int(p.value), used: int(p.used), cap: int(p.cap) })), { onConflict: "code" }));
    if (d.orders.length) await must(`orders (${d.orders.length})`, sb.from("orders").upsert(d.orders.map((o) => M.toOrder({ ...o, amount: int(o.amount) })), { onConflict: "id" }));
    if ((d.returns ?? []).length) await must(`returns (${d.returns!.length})`, sb.from("returns").upsert(d.returns!.map((r) => M.toReturn({ ...r, refund: int(r.refund) })), { onConflict: "id" }));
    await must("settings", sb.from("settings").update({ free_ship: int(d.settings.freeShip), ship_fee: int(d.settings.shipFee) }).eq("id", 1));
  }
  await refresh();
  log("DONE. Verify in Supabase Table Editor, then delete this tool.");
}

export default function TempMigration() {
  const [found, setFound] = useState<DB | null | undefined>(undefined);
  const [lines, setLines] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setFound(readLegacy()); }, []);
  const log = (m: string) => setLines((l) => [...l, m]);
  const go = async () => {
    if (busy || !window.confirm("Upload to Supabase now? Existing products are kept; nothing is deleted.")) return;
    setBusy(true); setLines([]);
    try { await runSync(log); } catch (e) { log(`FAILED ${(e as Error).message}`); }
    setBusy(false);
  };
  return (
    <section aria-label="Temporary data migration" className="mb-6 border-2 border-dashed border-amber-500 bg-amber-50 p-5">
      <p className={`${mono} text-[10px] font-bold tracking-[0.2em] text-amber-700`}>Temporary tool // delete after success</p>
      <p className="mt-2 text-sm">
        {found === undefined ? "Checking this browser…" : found
          ? `Local data found: ${found.products.length} products, ${found.orders.length} orders, ${found.promos.length} promos, ${(found.returns ?? []).length} returns.`
          : "No local data in this browser profile. The built-in 36 sample tees will be uploaded instead."}
      </p>
      <button onClick={go} disabled={busy || found === undefined} className={`${mono} mt-3 bg-black px-4 py-2.5 text-[10px] font-bold tracking-[0.15em] text-white disabled:opacity-50`}>{busy ? "Syncing…" : "Sync to Supabase"}</button>
      {lines.length > 0 && <pre className="mt-3 max-h-48 overflow-auto bg-black p-3 text-[11px] leading-5 text-green-400">{lines.join("\n")}</pre>}
    </section>
  );
}
