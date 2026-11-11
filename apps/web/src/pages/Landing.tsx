import { useState } from "react";
import { Link } from "../lib/router";
import { Logo } from "../components/Logo";
import { PLANS, inr } from "../lib/plans";

const STEPS = [
  { n: "1", title: "Tell it your reality", body: "Share your goal, your working hours and your deadline. The plan is built around the time you actually have." },
  { n: "2", title: "Get a day-by-day roadmap", body: "An AI of your choice drafts weeks, topics and projects. You review it, edit it and make it yours." },
  { n: "3", title: "Track it every day", body: "Tick off tasks, log your hours and watch your streak and progress grow. Weekly reviews keep you honest." },
];

const FEATURES = [
  { title: "Built for your schedule", body: "Plans respect work hours, weekends and buffer days instead of pretending you have all day." },
  { title: "Your key, your data", body: "AI keys stay on your device and are never stored on our servers. Your data is private to you through database-level security." },
  { title: "Daily tracker", body: "Today view, progress rings, a year heatmap and streaks that show consistency at a glance." },
  { title: "Practice with revision", body: "Log problems or exercises and get 7 and 30 day revisit dates automatically." },
  { title: "Weekly reviews", body: "A short check-in each week to see what worked and what to change." },
  { title: "Web and mobile", body: "Use it in the browser or on Android and iOS. Everything stays in sync." },
];

const FAQ = [
  { q: "Do I need an AI subscription?", a: "You bring your own API key from a provider such as Anthropic, OpenAI or Gemini, and pay that provider directly for what you use. You can also paste in a roadmap you made elsewhere." },
  { q: "Where is my data stored?", a: "In a private database, protected so that only your account can read or change your rows. We never store your AI keys." },
  { q: "Can I delete my account?", a: "Yes. Settings has a delete account option that removes your data." },
  { q: "When do paid plans start?", a: "Billing opens soon. Until then everything is available while we are in early access." },
];

export function Landing() {
  const [yearly, setYearly] = useState(false);
  return (
    <div className="lp">
      <header className="lp-nav">
        <Link to="/" className="lp-brand"><Logo size={30} /><span>Trailmark</span></Link>
        <nav aria-label="Main">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="row">
          <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
        </div>
      </header>

      <main>
        <section className="lp-hero">
          <span className="tag tag-green">Early access</span>
          <h1>A study roadmap that fits your real life, and a tracker that keeps you on it.</h1>
          <p className="lead">Tell Trailmark your goal and your free hours. Get a week-by-week plan, then check in every day and see your progress build.</p>
          <div className="row lp-cta">
            <Link to="/register" className="btn btn-accent btn-lg">Start free</Link>
            <a href="#how" className="btn btn-outline btn-lg">See how it works</a>
          </div>
          <p className="muted small">No card needed. Works on web, Android and iOS.</p>
          <div className="lp-heat" aria-hidden="true">
            {Array.from({ length: 26 * 7 }, (_, i) => <i key={i} style={{ "--d": `${(i % 26) * 40 + Math.floor(i / 26) * 25}ms`, "--o": ((i * 37) % 10) / 10 } as React.CSSProperties} />)}
          </div>
        </section>

        <section id="how" className="lp-sec">
          <h2>How it works</h2>
          <div className="lp-grid3">
            {STEPS.map((s) => (
              <div key={s.n} className="lp-card">
                <span className="lp-num">{s.n}</span>
                <h3>{s.title}</h3>
                <p className="muted">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="lp-sec">
          <h2>Everything in one place</h2>
          <div className="lp-grid3">
            {FEATURES.map((f) => (
              <div key={f.title} className="lp-card">
                <h3>{f.title}</h3>
                <p className="muted">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="lp-sec">
          <h2 className="center">Simple pricing</h2>
          <p className="muted center">Start free. Upgrade when you need more.</p>
          <div className="lp-toggle" role="group" aria-label="Billing period">
            <button type="button" className={!yearly ? "on" : ""} aria-pressed={!yearly} onClick={() => setYearly(false)}>Monthly</button>
            <button type="button" className={yearly ? "on" : ""} aria-pressed={yearly} onClick={() => setYearly(true)}>Yearly <em>save 16%</em></button>
          </div>
          <div className="lp-plans">
            {PLANS.map((p) => {
              const price = yearly ? p.yearly : p.monthly;
              return (
                <div key={p.id} className={`lp-card lp-plan${p.highlight ? " hi" : ""}`}>
                  {p.highlight && <span className="tag tag-green lp-pop">Most popular</span>}
                  <h3>{p.name}</h3>
                  <p className="muted">{p.tagline}</p>
                  <p className="lp-price"><strong>{price === 0 ? "Free" : inr(price)}</strong>{price > 0 && <span className="muted"> / {yearly ? "year" : "month"}</span>}</p>
                  <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
                  <Link to="/register" className={`btn ${p.highlight ? "btn-accent" : "btn-primary"}`}>{p.cta}</Link>
                  {p.id === "pro" && <p className="muted small center">Billing opens soon. Everything is unlocked during early access.</p>}
                </div>
              );
            })}
          </div>
        </section>

        <section id="faq" className="lp-sec lp-faq">
          <h2>Questions</h2>
          {FAQ.map((f) => (
            <details key={f.q}><summary>{f.q}</summary><p className="muted">{f.a}</p></details>
          ))}
        </section>

        <section className="lp-sec lp-final">
          <h2>Ready to start your trail?</h2>
          <Link to="/register" className="btn btn-accent btn-lg">Create your free account</Link>
        </section>
      </main>

      <footer className="lp-foot">
        <span>© {new Date().getFullYear()} Trailmark</span>
        <span className="row"><a href="/privacy.html">Privacy</a><Link to="/login">Sign in</Link></span>
      </footer>
    </div>
  );
}
