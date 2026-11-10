import { useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { Link, useRouter } from "../lib/router";
import { oauthProviders, configured } from "../lib/supabase";
import { Logo } from "../components/Logo";

function AuthLayout({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  // Backdrop: a field of day-cells that light up in a slow diagonal wave, like a year of logged days.
  const cells = Array.from({ length: 22 * 12 }, (_, i) => i);
  return (
    <div className="auth">
      <div className="auth-field" aria-hidden="true">
        {cells.map((i) => <i key={i} style={{ "--x": i % 22, "--y": Math.floor(i / 22) } as CSSProperties} />)}
      </div>
      <div className="auth-card">
        <div className="auth-brand"><Logo size={36} /><span>Trailmark</span></div>
        <h1>{title}</h1>
        <p className="muted">{sub}</p>
        {!configured && <p className="alert">Supabase isn’t configured. Copy .env.example to .env and add your project URL and anon key.</p>}
        {children}
      </div>
    </div>
  );
}

function OAuthButtons() {
  const { signInWithProvider } = useAuth();
  const [err, setErr] = useState("");
  if (!oauthProviders.length) return null;
  return (
    <>
      <div className="divider"><span>or</span></div>
      <div className="stack">
        {oauthProviders.map((p) => (
          <button key={p} type="button" className="btn btn-outline" onClick={() => signInWithProvider(p).catch((e) => setErr(e.message))}>
            Continue with {p === "google" ? "Google" : "GitHub"}
          </button>
        ))}
      </div>
      {err && <p className="alert">{err}</p>}
    </>
  );
}

export function Login() {
  const { signIn } = useAuth();
  const { go } = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try { await signIn(email.trim(), password); go("/app", true); }
    catch (x) { setErr((x as Error).message); }
    finally { setBusy(false); }
  }
  return (
    <AuthLayout title="Welcome back" sub="Sign in to pick up where you left off.">
      <form onSubmit={submit} className="stack">
        <div className="field"><label htmlFor="em">Email</label><input id="em" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label htmlFor="pw">Password</label><input id="pw" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {err && <p className="alert" role="alert">{err}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
      <OAuthButtons />
      <p className="auth-links"><Link to="/reset">Forgot password?</Link> <span>New here? <Link to="/register">Create an account</Link></span></p>
    </AuthLayout>
  );
}

export function Register() {
  const { signUp } = useAuth();
  const { go } = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setErr("Use at least 8 characters for your password."); return; }
    setErr(""); setBusy(true);
    try {
      const { needsConfirmation } = await signUp(email.trim(), password, name.trim());
      if (needsConfirmation) setSent(true); else go("/start", true);
    } catch (x) { setErr((x as Error).message); }
    finally { setBusy(false); }
  }
  if (sent) return (
    <AuthLayout title="Check your inbox" sub={`We sent a confirmation link to ${email}. Open it, then sign in.`}>
      <Link to="/login" className="btn btn-primary">Go to sign in</Link>
    </AuthLayout>
  );
  return (
    <AuthLayout title="Create your account" sub="Build a roadmap that fits your real schedule, then track it every day.">
      <form onSubmit={submit} className="stack">
        <div className="field"><label htmlFor="nm">Your name</label><input id="nm" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="field"><label htmlFor="em">Email</label><input id="em" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label htmlFor="pw">Password</label><input id="pw" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="hint">At least 8 characters.</p></div>
        {err && <p className="alert" role="alert">{err}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
      </form>
      <OAuthButtons />
      <p className="auth-links"><span>Already have an account? <Link to="/login">Sign in</Link></span></p>
    </AuthLayout>
  );
}

export function Reset() {
  const { sendReset, setNewPassword, session } = useAuth();
  const { go } = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  // Arriving from the email link signs the user in with a recovery session.
  if (session) {
    return (
      <AuthLayout title="Set a new password" sub="Choose a password you haven’t used here before.">
        <form className="stack" onSubmit={async (e) => {
          e.preventDefault();
          try { await setNewPassword(password); go("/app", true); } catch (x) { setErr((x as Error).message); }
        }}>
          <div className="field"><label htmlFor="np">New password</label><input id="np" type="password" minLength={8} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          {err && <p className="alert">{err}</p>}
          <button className="btn btn-primary">Save new password</button>
        </form>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout title="Reset your password" sub="We’ll email you a link to set a new one.">
      <form className="stack" onSubmit={async (e) => {
        e.preventDefault(); setErr("");
        try { await sendReset(email.trim()); setMsg(`Reset link sent to ${email}.`); } catch (x) { setErr((x as Error).message); }
      }}>
        <div className="field"><label htmlFor="em">Email</label><input id="em" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        {msg && <p className="ok">{msg}</p>}
        {err && <p className="alert">{err}</p>}
        <button className="btn btn-primary">Send reset link</button>
      </form>
      <p className="auth-links"><Link to="/login">Back to sign in</Link></p>
    </AuthLayout>
  );
}
