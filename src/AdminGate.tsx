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
  const [busy, setBusy] = useState<"google" | "apple" | "email" | null>(null);
  const [error, setError] = useState("");
  const [em, setEm] = useState("");
  const [pw, setPw] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = getSupabase().auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = async (provider: "google" | "apple") => {
    setBusy(provider);
    setError("");
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}${window.location.pathname}#/admin` },
    });
    if (error) {
      setError(/not enabled|unsupported provider/i.test(error.message) ? `${provider === "google" ? "Google" : "Apple"} sign-in is not enabled in Supabase yet.` : error.message);
      setBusy(null);
    }
  };

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
  const allowed = !!session && (ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email));

  if (allowed) return <Admin onSignOut={() => getSupabase().auth.signOut()} userEmail={email} />;

  return (
    <div className="grid min-h-screen bg-black text-white lg:grid-cols-2">
      <div className="hidden flex-col justify-between border-r border-white/15 p-10 lg:flex">
        <p className={`${mono} text-[10px] tracking-[0.25em] text-white/50`}>Venkayam India // Control room</p>
        <div className="flex justify-center"><span className="rounded bg-white p-6"><OnionLogo className="h-72" /></span></div>
        <p className={`${mono} text-[10px] tracking-[0.2em] text-white/40`}>Batch: CHN-DROP-04 • Restricted access</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <span className="mb-6 inline-block rounded bg-white p-2 lg:hidden"><OnionLogo className="h-14" sway={false} /></span>
          <p className={`${mono} mb-3 text-[10px] tracking-[0.25em] text-white/50`}>Staff only</p>
          <h1 className={`${disp} text-6xl leading-[0.9]`}>Sign in to the control room</h1>
          <form onSubmit={(ev) => { ev.preventDefault(); emailAuth(false); }} className="mt-10 space-y-3">
            <input type="email" value={em} onChange={(x) => setEm(x.target.value)} placeholder="ADMIN EMAIL" autoComplete="email" aria-label="Admin email" className={`${mono} w-full border border-white/40 bg-transparent px-4 py-3.5 text-[12px] tracking-wider text-white outline-none placeholder:text-white/40 focus:border-white`} />
            <input type="password" value={pw} onChange={(x) => setPw(x.target.value)} placeholder="PASSWORD" autoComplete="current-password" aria-label="Password" className={`${mono} w-full border border-white/40 bg-transparent px-4 py-3.5 text-[12px] tracking-wider text-white outline-none placeholder:text-white/40 focus:border-white`} />
            <button disabled={!!busy} className={`${mono} w-full bg-white px-5 py-4 text-[12px] font-bold tracking-[0.15em] text-black transition hover:bg-neutral-200 disabled:opacity-60`}>{busy === "email" ? "Please wait…" : "Sign in"}</button>
            <button type="button" disabled={!!busy} onClick={() => emailAuth(true)} className={`${mono} text-[10px] tracking-wider text-white/60 underline hover:text-white`}>First time? Create admin account</button>
          </form>
          <div className={`${mono} my-6 flex items-center gap-4 text-[10px] tracking-[0.2em] text-white/30`}><span className="h-px flex-1 bg-white/20" />or<span className="h-px flex-1 bg-white/20" /></div>
          <div className="space-y-3">
            <button onClick={() => signIn("google")} disabled={!!busy} className={`${mono} flex w-full items-center justify-center gap-3 bg-white px-5 py-4 text-[12px] font-bold tracking-[0.15em] text-black transition hover:bg-neutral-200 disabled:opacity-60`}>
              <svg viewBox="0 0 24 24" className="size-4"><path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.8h3.5c2.1-1.9 3.3-4.7 3.3-8.2z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.8c-1 .7-2.2 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.9A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.7 14c-.2-.7-.4-1.3-.4-2s.1-1.4.4-2V7.1H2.1a11 11 0 0 0 0 9.8L5.7 14z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.1 7.1L5.7 10c.9-2.6 3.4-4.6 6.3-4.6z"/></svg>
              {busy === "google" ? "Redirecting…" : "Continue with Google"}
            </button>
            <button onClick={() => signIn("apple")} disabled={!!busy} className={`${mono} flex w-full items-center justify-center gap-3 border border-white px-5 py-4 text-[12px] font-bold tracking-[0.15em] transition hover:bg-white hover:text-black disabled:opacity-60`}>
              <svg viewBox="0 0 24 24" className="size-4 fill-current"><path d="M16.4 12.6c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9s-2-.9-3.3-.9C6 6.8 4.4 7.800 3.600 9.300c-1.700 3-.4 7.400 1.200 9.800.8 1.200 1.800 2.500 3.100 2.500 1.200 0 1.700-.8 3.200-.8s1.900.8 3.200.8c1.300 0 2.200-1.200 3-2.400.9-1.400 1.300-2.700 1.300-2.800-.1 0-2.600-1-2.600-3.800zM14 5c.7-.8 1.100-1.900 1-3-1 0-2.100.7-2.800 1.500-.6.700-1.200 1.800-1 2.900 1.100.1 2.100-.6 2.800-1.400z"/></svg>
              {busy === "apple" ? "Redirecting…" : "Continue with Apple"}
            </button>
          </div>
          {session && !allowed && (
            <p className={`${mono} mt-5 border border-red-500 p-3 text-[10px] leading-5 tracking-wider text-red-400`}>
              {email} is not authorised. <button className="underline" onClick={() => getSupabase().auth.signOut()}>Sign out</button>
            </p>
          )}
          {note && <p className={`${mono} mt-5 text-[10px] leading-5 tracking-wider text-emerald-400`}>{note}</p>}
          {error && <p className={`${mono} mt-5 text-[10px] leading-5 tracking-wider text-red-400`}>{error}</p>}
          <a href="#/" className={`${mono} mt-10 inline-block text-[10px] tracking-[0.15em] text-white/50 hover:text-white`}>← Back to storefront</a>
        </div>
      </div>
    </div>
  );
}
