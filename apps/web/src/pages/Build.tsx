import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { Link, useRouter } from "../lib/router";
import { buildRoadmapPrompt } from "@trailmark/core";
import { hasCompleteDocument, parseRoadmapText } from "@trailmark/core";
import { getDraft, setDraft } from "../lib/roadmap/draft";
import { chat, PROVIDERS, providerInfo, type ChatMessage, type ProviderId } from "@trailmark/core";
import { loadKey } from "../lib/ai/keyVault";
import { api } from "../lib/api";
import { todayISO } from "@trailmark/core";
import { RoadmapReveal } from "../components/RoadmapReveal";
import { Logo } from "../components/Logo";

function BuildLayout({ children, title, sub }: { children: ReactNode; title: string; sub?: string }) {
  return (
    <div className="build">
      <header className="build-top"><Link to="/start" className="brand"><Logo /><span>Trailmark</span></Link></header>
      <div className="build-body">
        <h1>{title}</h1>
        {sub && <p className="muted lead">{sub}</p>}
        {children}
      </div>
    </div>
  );
}

export function Start() {
  const { profile, signOut } = useAuth();
  return (
    <BuildLayout title={`Let’s plan your route${profile?.display_name ? ", " + profile.display_name.split(" ")[0] : ""}`}
      sub="Your roadmap holds the syllabus, the week-by-week plan and your daily timetable. Pick how you want to create it.">
      <div className="choice-grid">
        <Link to="/build/chat" className="choice">
          <span className="choice-art art-chat" aria-hidden="true"><i /><i /><i /></span>
          <h2>Build it in the app</h2>
          <p>Chat with an AI mentor using your own API key from Claude, ChatGPT, Gemini, OpenRouter or Groq. Your key stays on this device.</p>
          <span className="choice-cta">Start the interview</span>
        </Link>
        <Link to="/build/import" className="choice">
          <span className="choice-art art-paste" aria-hidden="true"><i /><i /></span>
          <h2>No API key? Use any chatbot</h2>
          <p>Copy our prompt into Claude, ChatGPT or Gemini, answer its questions, then paste the reply back here. No key, no cost to you.</p>
          <span className="choice-cta">Copy the prompt</span>
        </Link>
      </div>
      <p className="muted small center"><button className="link" onClick={() => signOut()}>Sign out</button></p>
    </BuildLayout>
  );
}

const CHAT_KEY = "trailmark:chat";

export function BuildChat() {
  const { user } = useAuth();
  const { go } = useRouter();
  const [provider, setProvider] = useState<ProviderId>("anthropic");
  const [model, setModel] = useState(providerInfo("anthropic").defaultModel);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try { return JSON.parse(sessionStorage.getItem(CHAT_KEY) ?? "[]") as ChatMessage[]; } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [docErr, setDocErr] = useState<string[]>([]);
  const abort = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { if (user) loadKey(user.id, provider).then((k) => setHasKey(!!k)); }, [user, provider]);
  useEffect(() => { try { sessionStorage.setItem(CHAT_KEY, JSON.stringify(messages)); } catch { /* ignore */ } end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages]);

  const system = buildRoadmapPrompt({ todayISO: todayISO() });

  async function send(text: string, base = messages) {
    if (!user) return;
    const key = await loadKey(user.id, provider);
    if (!key) { setHasKey(false); return; }
    setErr(""); setBusy(true);
    let convo: ChatMessage[] = [...base, { role: "user", content: text }];
    setMessages(convo);
    abort.current = new AbortController();
    try {
      // Long roadmaps can exceed one reply: keep asking to continue until the end marker arrives.
      let collected = "";
      for (let round = 0; round < 6; round++) {
        const res = await chat(provider, key, model, system, convo, abort.current.signal);
        collected += res.text;
        convo = [...convo, { role: "assistant", content: res.text }];
        setMessages(convo);
        const opened = collected.includes("<<<ROADMAP_V1");
        if (!opened || hasCompleteDocument(collected) || (!res.truncated && !/type continue/i.test(res.text))) break;
        convo = [...convo, { role: "user", content: "continue" }];
        setMessages(convo);
      }
      if (hasCompleteDocument(collected)) tryOpen(convo);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function tryOpen(convo = messages) {
    const all = convo.filter((m) => m.role === "assistant").map((m) => m.content).join("");
    const res = parseRoadmapText(all.slice(all.indexOf("<<<ROADMAP_V1") === -1 ? 0 : all.indexOf("<<<ROADMAP_V1")));
    if (res.ok) { setDraft(res.roadmap); go("/build/preview"); }
    else setDocErr(res.errors);
  }

  const docReady = messages.some((m) => m.role === "assistant" && m.content.includes("<<<ROADMAP_V1"));
  const info = providerInfo(provider);

  return (
    <BuildLayout title="Build your roadmap" sub="The mentor will interview you first: who you are, what you want to learn, and your real schedule. Then it writes your plan.">
      <div className="chat-config card">
        <div className="field"><label htmlFor="prov">AI provider</label>
          <select id="prov" value={provider} onChange={(e) => { const p = e.target.value as ProviderId; setProvider(p); setModel(providerInfo(p).defaultModel); }}>
            {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select></div>
        <div className="field"><label htmlFor="mdl">Model</label>
          <input id="mdl" list="mdl-list" value={model} onChange={(e) => setModel(e.target.value)} />
          <datalist id="mdl-list">{info.models.map((m) => <option key={m} value={m} />)}</datalist></div>
        {hasKey === false && (
          <p className="alert">No {info.name} key on this device. <Link to="/app/settings">Add it in Settings → AI keys</Link>, or <Link to="/build/import">use the copy-paste route</Link>.</p>
        )}
      </div>

      <div className="chat card" aria-live="polite">
        {!messages.length && (
          <div className="chat-empty">
            <p>Say hello to start. You can also mention anything up front, like “I work 9 to 6 and want to learn Go and Kubernetes in 6 months”.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.role === "assistant" && m.content.includes("<<<ROADMAP_V1")
              ? <p className="doc-chip">Roadmap document ({Math.round(m.content.length / 1000)} KB)</p>
              : m.content.split("\n").map((line, j) => <p key={j}>{line}</p>)}
          </div>
        ))}
        {busy && <div className="bubble assistant typing" aria-label="Writing"><i /><i /><i /></div>}
        <div ref={end} />
      </div>

      {err && <p className="alert" role="alert">{err}</p>}
      {docErr.length > 0 && <div className="alert"><p>The roadmap document has problems:</p><ul>{docErr.map((e) => <li key={e}>{e}</li>)}</ul>
        <button className="btn btn-sm" onClick={() => { setDocErr([]); void send(`Your roadmap document failed validation: ${docErr.join(" ")} Please output the corrected full document between the markers.`); }}>Ask the mentor to fix it</button></div>}

      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); if (input.trim() && !busy) { const t = input.trim(); setInput(""); void send(t); } }}>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={messages.length ? "Your answer…" : "Hi! I want to plan my learning."}
          rows={2} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement).requestSubmit(); } }} aria-label="Message" />
        <div className="row">
          {busy ? <button type="button" className="btn" onClick={() => abort.current?.abort()}>Stop</button>
                : <button className="btn btn-primary" disabled={!input.trim() || hasKey === false}>Send</button>}
          {docReady && !busy && <button type="button" className="btn btn-accent" onClick={() => tryOpen()}>Preview my roadmap</button>}
          {messages.length > 0 && !busy && <button type="button" className="btn btn-ghost" onClick={() => { if (confirm("Start the interview over?")) setMessages([]); }}>Start over</button>}
        </div>
      </form>
    </BuildLayout>
  );
}

export function BuildImport() {
  const { go } = useRouter();
  const [copied, setCopied] = useState(false);
  const [notes, setNotes] = useState("");
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const prompt = buildRoadmapPrompt({ todayISO: todayISO(), learnerNotes: notes.trim() || undefined });

  async function copy() {
    try { await navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(() => setCopied(false), 2500); }
    catch { setErrors(["Couldn’t copy automatically. Select the prompt text below and copy it."]); }
  }
  function check(raw = text) {
    const res = parseRoadmapText(raw);
    if (res.ok) { setDraft(res.roadmap); go("/build/preview"); } else setErrors(res.errors);
  }

  return (
    <BuildLayout title="Use any chatbot" sub="Works with Claude, ChatGPT, Gemini or any assistant. No API key needed.">
      <ol className="steps">
        <li>
          <h2>Copy the prompt</h2>
          <div className="field"><label htmlFor="notes">Optional: anything to tell the mentor up front</label>
            <input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. I want to learn Python, FastAPI and LangGraph in 4 months" /></div>
          <div className="row"><button className="btn btn-primary" onClick={copy}>{copied ? "Copied" : "Copy prompt"}</button>
            <a className="btn btn-outline" href="https://claude.ai/new" target="_blank" rel="noreferrer">Open Claude</a>
            <a className="btn btn-outline" href="https://chatgpt.com/" target="_blank" rel="noreferrer">Open ChatGPT</a>
            <a className="btn btn-outline" href="https://gemini.google.com/app" target="_blank" rel="noreferrer">Open Gemini</a></div>
          <details className="prompt-peek"><summary>Show the prompt</summary><pre>{prompt}</pre></details>
        </li>
        <li>
          <h2>Answer its questions</h2>
          <p className="muted">It asks about you, the technologies you want, and your schedule, then shows a summary. Confirm it, and it writes your roadmap document. If the reply stops halfway, type “continue”.</p>
        </li>
        <li>
          <h2>Paste the reply here</h2>
          <textarea className="paste" value={text} onChange={(e) => { setText(e.target.value); setErrors([]); }} rows={8}
            placeholder={"Paste everything from <<<ROADMAP_V1 to ROADMAP_V1>>>. If it came in several parts, paste them all, in order."} aria-label="Roadmap document" />
          <div className="row">
            <button className="btn btn-primary" disabled={!text.trim()} onClick={() => check()}>Check and preview</button>
            <label className="btn btn-outline">Upload a file<input type="file" accept=".json,.txt,.md" hidden onChange={async (e) => {
              const f = e.target.files?.[0]; if (!f) return; const t = await f.text(); setText(t); check(t); e.target.value = "";
            }} /></label>
          </div>
          {errors.length > 0 && <div className="alert" role="alert"><p>That didn’t work:</p><ul>{errors.map((e) => <li key={e}>{e}</li>)}</ul>
            <p className="small">Tip: ask the chatbot “Fix these errors and output the full document again between the markers”, followed by the list above.</p></div>}
        </li>
      </ol>
    </BuildLayout>
  );
}

export function BuildPreview() {
  const { user, refreshProfile } = useAuth();
  const { go } = useRouter();
  const draft = getDraft();
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  if (!draft) return <BuildLayout title="Nothing to preview"><Link to="/start" className="btn btn-primary">Create a roadmap</Link></BuildLayout>;
  return (
    <div className="build">
      <RoadmapReveal roadmap={draft} onDone={async () => {
        if (!user || saving) return;
        setSaving(true);
        try {
          await api.createRoadmap(user.id, draft);
          setDraft(null);
          sessionStorage.removeItem(CHAT_KEY);
          await refreshProfile();
          go("/app", true);
        } catch (e) { setErr((e as Error).message); setSaving(false); }
      }} />
      {err && <p className="alert center">{err}</p>}
      <p className="center small"><Link to="/start">Not right? Build it again</Link></p>
    </div>
  );
}
