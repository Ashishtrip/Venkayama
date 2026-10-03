import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import OnionLogo from "./components/OnionLogo";
import { getSupabase } from "./lib/supabase";

const mono = "font-mono uppercase";
const disp = "font-display uppercase";
const inputCls = "mt-1 w-full border border-black bg-white px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-black";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}

export const displayName = (s: Session) => String(s.user.user_metadata?.full_name ?? s.user.email?.split("@")[0] ?? "Account");

type Mode = "login" | "signup" | "forgot";

export default function AuthPage({ initial }: { initial: "login" | "signup" }) {
  const [mode, setMode] = useState<Mode>(initial);
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const session = useSession();

  useEffect(() => { setMode(initial); setErr(""); setInfo(""); }, [initial]);
  useEffect(() => { if (session) window.location.hash = "#/"; }, [session]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const switchTo = (m: Mode) => { setMode(m); setErr(""); setInfo(""); if (m !== "forgot") window.location.hash = `#/${m}`; };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setInfo("");
    const email = f.email.trim();
    if (mode === "signup") {
      if (!f.name.trim()) return setErr("Enter your name.");
      if (f.password.length < 8) return setErr("Password must be at least 8 characters.");
      if (f.password !== f.confirm) return setErr("Passwords do not match.");
    }
    setBusy("email");
    const sb = getSupabase();
    try {
      if (mode === "login") {
        const { error } = await sb.auth.signInWithPassword({ email, password: f.password });
        if (error) setErr(error.message);
      } else if (mode === "signup") {
        const { data, error } = await sb.auth.signUp({
          email, password: f.password,
          options: { data: { full_name: f.name.trim() }, emailRedirectTo: `${window.location.origin}${window.location.pathname}#/` },
        });
        if (error) setErr(error.message);
        else if (!data.session) setInfo("Account created. Check your inbox to confirm your email, then log in.");
      } else {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}${window.location.pathname}#/login` });
        if (error) setErr(error.message);
        else setInfo("If that email has an account, a reset link is on its way.");
      }
    } finally {
      setBusy(null);
    }
  };

  const oauth = async (provider: "google" | "apple") => {
    setBusy(provider); setErr("");
    const { error } = await getSupabase().auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}${window.location.pathname}#/` } });
    if (error) { setErr(/not enabled|unsupported provider/i.test(error.message) ? `${provider === "google" ? "Google" : "Apple"} sign-in is not switched on for this store yet. Use email and password for now.` : error.message); setBusy(null); }
  };

  const title = mode === "login" ? "Welcome back" : mode === "signup" ? "Join the archive" : "Reset password";
  const sub = mode === "login" ? "Log in to track orders and check out faster." : mode === "signup" ? "Early drop access, order history and faster checkout." : "We will email you a link to set a new one.";

  return (
    <section className="grid min-h-screen pt-[96px] lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-black p-12 text-white lg:flex">
        <div className="absolute -right-24 top-1/2 -translate-y-1/2 opacity-[0.07]"><OnionLogo className="h-[620px] invert" /></div>
        <p className={`${mono} relative text-[10px] tracking-[0.25em] text-white/60`}>Venkayam India // Members</p>
        <div className="relative">
          <span className="inline-block"><OnionLogo className="h-40 invert" /></span>
          <h2 className={`${disp} mt-8 text-[clamp(3rem,6vw,6rem)] leading-[0.88]`}>Wear the<br />archive</h2>
          <ul className={`${mono} mt-8 space-y-2 text-[11px] tracking-[0.15em] text-white/70`}>
            {["Early access to every drop", "Track orders in one place", "One-tap checkout"].map((t) => <li key={t} className="flex gap-3"><span>+</span>{t}</li>)}
          </ul>
        </div>
        <p className={`${mono} relative text-[10px] tracking-[0.2em] text-white/40`}>Est. 2024 · Chennai</p>
      </div>

      <div className="flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-md">
          {mode !== "forgot" && (
            <div className="mb-8 grid grid-cols-2 border border-black" role="tablist">
              {(["login", "signup"] as const).map((m) => (
                <button key={m} role="tab" aria-selected={mode === m} onClick={() => switchTo(m)} className={`${mono} py-3 text-[11px] font-bold tracking-[0.15em] transition ${mode === m ? "bg-black text-white" : "hover:bg-neutral-200"}`}>{m === "login" ? "Log in" : "Sign up"}</button>
              ))}
            </div>
          )}
          <h1 className={`${disp} text-5xl leading-none`}>{title}</h1>
          <p className="mt-3 text-sm text-neutral-600">{sub}</p>

          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            {mode === "signup" && (
              <label className="block"><span className={`${mono} text-[10px] font-bold tracking-[0.15em]`}>Full name</span>
                <input value={f.name} onChange={set("name")} autoComplete="name" className={inputCls} /></label>
            )}
            <label className="block"><span className={`${mono} text-[10px] font-bold tracking-[0.15em]`}>Email</span>
              <input type="email" required value={f.email} onChange={set("email")} autoComplete="email" className={inputCls} /></label>
            {mode !== "forgot" && (
              <label className="block"><span className={`${mono} flex justify-between text-[10px] font-bold tracking-[0.15em]`}>Password
                <button type="button" onClick={() => setShow(!show)} className="underline">{show ? "Hide" : "Show"}</button></span>
                <input type={show ? "text" : "password"} required value={f.password} onChange={set("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} className={inputCls} /></label>
            )}
            {mode === "signup" && (
              <label className="block"><span className={`${mono} text-[10px] font-bold tracking-[0.15em]`}>Confirm password</span>
                <input type={show ? "text" : "password"} required value={f.confirm} onChange={set("confirm")} autoComplete="new-password" className={inputCls} /></label>
            )}
            {mode === "login" && <button type="button" onClick={() => switchTo("forgot")} className={`${mono} text-[10px] font-bold tracking-wider underline`}>Forgot password?</button>}
            {err && <p role="alert" className={`${mono} border border-red-700 bg-red-50 p-3 text-[10px] tracking-wider text-red-700`}>{err}</p>}
            {info && <p role="status" className={`${mono} border border-emerald-700 bg-emerald-50 p-3 text-[10px] tracking-wider text-emerald-800`}>{info}</p>}
            <button disabled={busy !== null} className={`${mono} w-full bg-black py-4 text-[11px] font-bold tracking-[0.15em] text-white transition hover:bg-neutral-800 disabled:opacity-60`}>
              {busy === "email" ? "Please wait" : mode === "login" ? "Log in" : mode === "signup" ? "Create account" : "Send reset link"}
            </button>
          </form>

          {mode === "forgot" ? (
            <button onClick={() => switchTo("login")} className={`${mono} mt-6 text-[10px] font-bold tracking-wider underline`}>← Back to log in</button>
          ) : (
            <>
              <div className={`${mono} my-6 flex items-center gap-4 text-[10px] tracking-[0.2em] text-neutral-400`}><span className="h-px flex-1 bg-black/15" />or<span className="h-px flex-1 bg-black/15" /></div>
              <div className="grid grid-cols-2 gap-3">
                {(["google", "apple"] as const).map((p) => (
                  <button key={p} type="button" disabled={busy !== null} onClick={() => oauth(p)} className={`${mono} border border-black py-3.5 text-[11px] font-bold tracking-[0.12em] transition hover:bg-black hover:text-white disabled:opacity-60`}>{busy === p ? "Redirecting" : p}</button>
                ))}
              </div>
              <p className={`${mono} mt-8 text-center text-[10px] tracking-wider text-neutral-500`}>
                {mode === "login" ? "New here? " : "Already a member? "}
                <button onClick={() => switchTo(mode === "login" ? "signup" : "login")} className="font-bold text-black underline">{mode === "login" ? "Create an account" : "Log in"}</button>
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
