import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Admin from "./Admin";
import OnionLogo from "./components/OnionLogo";
import { ADMIN_EMAILS, getSupabase } from "./lib/supabase";

const mono = "font-mono uppercase";
const disp = "font-display uppercase";

export default function AdminGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState<"email" | null>(null);
  const [error, setError] = useState("");
  const [em, setEm] = useState("");
  const [pw, setPw] = useState("");
  const [note, setNote] = useState("");
  const [devBypass, setDevBypass] = useState(false);

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = getSupabase().auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const emailAuth = async (create: boolean) => {
    setError(""); setNote("");
    const e = em.trim().toLowerCase();
    if (!e || pw.length < 8) return setError("Enter your email and a password of 8+ characters.");
    if (create && !ADMIN_EMAILS.map((x) => x.toLowerCase()).includes(e)) return setError("That email is not on the admin list.");
    setBusy("email");
    const sb = getSupabase();
    const { data, error } = create
      ? await sb.auth.signUp({ email: e, password: pw, options: { data: { full_name: "Admin" } } })
      : await sb.auth.signInWithPassword({ email: e, password: pw });
    setBusy(null);
    if (error) setError(error.message);
    else if (create && !data.session) setNote("Account created. Confirm the email we sent you, then sign in.");
  };

  if (!ready) return <div className="grid min-h-screen place-items-center bg-black"><OnionLogo className="h-24 invert" /></div>;

  const email = session?.user.email?.toLowerCase() ?? "";
  const allowed = devBypass || (!!session && (ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email)));

  if (allowed) return <Admin onSignOut={() => { setDevBypass(false); getSupabase().auth.signOut(); }} userEmail={email || "ashish.deo.tripathi@gmail.com"} />;

  return (
    <div className="grid min-h-screen bg-black text-white lg:grid-cols-2">
      <div className="hidden flex-col justify-between border-r border-white/15 p-10 lg:flex">
        <p className={`${mono} text-[10px] tracking-[0.25em] text-white/50`}>Venkayam India // Control room</p>
        <div className="flex justify-center"><span className="rounded bg-white p-6"><OnionLogo className="h-72" /></span></div>
        <p className={`${mono} text-[10px] tracking-[0.2em] text-white/40`}>Batch: CHN-DROP-04 • Restricted access</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <span className="mb-6 inline-block rounded bg-white p-2 lg:hidden"><OnionLogo className="h-14" /></span>
          <p className={`${mono} mb-3 text-[10px] tracking-[0.25em] text-white/50`}>Staff only</p>
          <h1 className={`${disp} text-6xl leading-[0.9]`}>Sign in to the control room</h1>
          <form onSubmit={(ev) => { ev.preventDefault(); emailAuth(false); }} className="mt-10 space-y-3">
            <input type="email" value={em} onChange={(x) => setEm(x.target.value)} placeholder="ADMIN EMAIL" autoComplete="email" aria-label="Admin email" className={`${mono} w-full border border-white/40 bg-transparent px-4 py-3.5 text-[12px] tracking-wider text-white outline-none placeholder:text-white/40 focus:border-white`} />
            <input type="password" value={pw} onChange={(x) => setPw(x.target.value)} placeholder="PASSWORD" autoComplete="current-password" aria-label="Password" className={`${mono} w-full border border-white/40 bg-transparent px-4 py-3.5 text-[12px] tracking-wider text-white outline-none placeholder:text-white/40 focus:border-white`} />
            <button disabled={!!busy} className={`${mono} w-full bg-white px-5 py-4 text-[12px] font-bold tracking-[0.15em] text-black transition hover:bg-neutral-200 disabled:opacity-60`}>{busy === "email" ? "Please wait…" : "Sign in"}</button>
            <button type="button" disabled={!!busy} onClick={() => emailAuth(true)} className={`${mono} text-[10px] tracking-wider text-white/60 underline hover:text-white`}>First time? Create admin account</button>
          </form>
          {session && !allowed && (
            <p className={`${mono} mt-5 border border-red-500 p-3 text-[10px] leading-5 tracking-wider text-red-400`}>
              {email} is not authorised. <button className="underline" onClick={() => getSupabase().auth.signOut()}>Sign out</button>
            </p>
          )}
          {note && <p className={`${mono} mt-5 text-[10px] leading-5 tracking-wider text-emerald-400`}>{note}</p>}
          {error && <p className={`${mono} mt-5 text-[10px] leading-5 tracking-wider text-red-400`}>{error}</p>}
          <div className="mt-8 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setDevBypass(true)}
              className={`${mono} border border-white/30 bg-neutral-900 py-3 text-center text-[10px] font-bold tracking-widest text-white transition hover:bg-white hover:text-black`}
            >
              Enter Control Room &amp; Editing Mode →
            </button>
            <a href="#/" className={`${mono} text-center text-[10px] tracking-[0.15em] text-white/50 hover:text-white`}>
              ← Back to storefront
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
