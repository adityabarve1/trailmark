import { useState, type FormEvent } from "react";
import { useTracker } from "../lib/tracker";
import { diffDays, nice, todayISO } from "@trailmark/core";
import type { PracticeItem } from "@trailmark/core";
import { Empty } from "../components/ui";

const due = (it: PracticeItem, t = todayISO()) => (!it.r7 && diffDays(it.solved_on, t) >= 7 ? 7 : !it.r30 && diffDays(it.solved_on, t) >= 30 ? 30 : 0);
const STATUS = { g: "Green: solved alone", a: "Amber: needed a hint", r: "Red: read the solution" } as const;

export function Practice() {
  const { roadmap, practice, addPractice, updatePractice, removePractice } = useTracker();
  const [name, setName] = useState("");
  const [pattern, setPattern] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [status, setStatus] = useState<"g" | "a" | "r">("a");
  const [date, setDate] = useState(todayISO());
  const [filter, setFilter] = useState<"all" | "g" | "a" | "r">("all");
  const [msg, setMsg] = useState("");
  if (!roadmap) return null;
  const pt = roadmap.practiceTrack;
  const pat = pattern || pt.patterns[0];
  const dueList = practice.filter((x) => due(x));
  const shown = practice.filter((x) => filter === "all" || x.status === filter);
  const counts: Record<string, number> = {};
  practice.forEach((x) => (counts[x.pattern] = (counts[x.pattern] ?? 0) + 1));

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setMsg("Type a name first."); return; }
    try {
      await addPractice({ name: name.trim(), pattern: pat, difficulty, status, solved_on: date });
      setMsg(`Added “${name.trim()}”. It comes back for a re-solve in 7 days.`); setName("");
    } catch (x) { setMsg((x as Error).message); }
  }

  const Row = ({ it }: { it: PracticeItem }) => {
    const d = due(it);
    return (
      <li className="p-item">
        <div><span className={`dot dot-${it.status}`} aria-label={STATUS[it.status]} /> <b>{it.name}</b>
          <p className="muted small">{it.pattern}, {it.difficulty}, {nice(it.solved_on)}{it.r7 ? ", re-solved at 7 days" : ""}{it.r30 ? ", at 30 days" : ""}</p></div>
        <div className="row">
          {d > 0 && <button className="btn btn-sm btn-accent" onClick={() => updatePractice(it.id, d === 7 ? { r7: todayISO() } : { r30: todayISO() })}>Re-solved ({d}-day)</button>}
          <button className="btn btn-sm" onClick={() => updatePractice(it.id, { status: ({ r: "a", a: "g", g: "r" } as const)[it.status] })}>Confidence</button>
          <button className="btn btn-sm btn-ghost" onClick={() => { if (confirm(`Delete “${it.name}”?`)) void removePractice(it.id); }}>Delete</button>
        </div>
      </li>
    );
  };

  return (
    <div className="page">
      <h1>{pt.name} log</h1>
      <form className="card form-grid" onSubmit={add}>
        <div className="field span2"><label htmlFor="pn">Name</label><input id="pn" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Two Sum" /></div>
        <div className="field"><label htmlFor="pp">Pattern</label><select id="pp" value={pat} onChange={(e) => setPattern(e.target.value)}>{pt.patterns.map((p) => <option key={p}>{p}</option>)}</select></div>
        <div className="field"><label htmlFor="pd">Difficulty</label><select id="pd" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
        <div className="field"><label htmlFor="ps">How did it go?</label><select id="ps" value={status} onChange={(e) => setStatus(e.target.value as "g" | "a" | "r")}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div className="field"><label htmlFor="pdt">Date</label><input id="pdt" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="span2 row"><button className="btn btn-primary">Add</button><p className="muted small" role="status">{msg}</p></div>
      </form>

      <section className="card">
        <h2>Due for re-solving ({dueList.length})</h2>
        {dueList.length ? <ul className="p-list">{dueList.map((it) => <Row key={it.id} it={it} />)}</ul>
          : <p className="muted">Nothing due. Items come back here 7 and 30 days after you log them.</p>}
      </section>

      <section className="card">
        <div className="row between wrap"><h2>All ({practice.length})</h2>
          <div className="seg" role="group" aria-label="Filter">{(["all", "g", "a", "r"] as const).map((f) => <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>{f === "all" ? "All" : f === "g" ? "Green" : f === "a" ? "Amber" : "Red"}</button>)}</div></div>
        {shown.length ? <ul className="p-list">{shown.map((it) => <Row key={it.id} it={it} />)}</ul> : <Empty title="Nothing logged yet">Add your first one above.</Empty>}
      </section>

      <section className="card">
        <h2>By pattern</h2>
        <table><tbody>{pt.patterns.map((p) => <tr key={p}><td>{p}</td><td className="num">{counts[p] ?? 0}</td></tr>)}</tbody></table>
      </section>
    </div>
  );
}
