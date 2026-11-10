import { useState, type CSSProperties } from "react";
import { useTracker } from "../lib/tracker";
import { todayISO } from "@trailmark/core";
import { phaseColor, weekIndexOf } from "@trailmark/core";
import { moduleStats } from "@trailmark/core";
import { Bar, Check } from "../components/ui";

export function Syllabus() {
  const { roadmap, weeks, progress, toggle } = useTracker();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState("");
  if (!roadmap) return null;
  const w = weekIndexOf(roadmap, todayISO());
  const cur = w >= 0 && w < weeks.length ? weeks[w].phase : roadmap.phases[0]?.key;
  const firstOpen = roadmap.modules.find((m) => m.phase === cur && moduleStats(m, progress).pct < 100)?.code;
  const needle = q.trim().toLowerCase();

  return (
    <div className="page">
      <div className="row between wrap">
        <h1>Syllabus</h1>
        <div className="row">
          <input className="search" type="search" placeholder="Search subtopics" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search subtopics" />
          <button className="btn btn-sm" onClick={() => setOpen(Object.fromEntries(roadmap.modules.map((m) => [m.code, true])))}>Open all</button>
          <button className="btn btn-sm" onClick={() => setOpen(Object.fromEntries(roadmap.modules.map((m) => [m.code, false])))}>Close all</button>
        </div>
      </div>
      <p className="muted small">Tick a subtopic only when you can explain it out loud without notes.</p>

      {roadmap.modules.map((m) => {
        const s = moduleStats(m, progress);
        const color = phaseColor(roadmap, m.phase);
        const topics = m.topics.map((t, ti) => ({ t, ti, subs: t.subs.map((sub, si) => ({ sub, si })).filter(({ sub }) => !needle || sub.toLowerCase().includes(needle) || t.title.toLowerCase().includes(needle)) })).filter((x) => x.subs.length);
        if (needle && !topics.length) return null;
        const isOpen = needle ? true : open[m.code] ?? m.code === firstOpen;
        return (
          <details key={m.code} className={`module ${s.pct === 100 ? "is-complete" : ""}`} open={isOpen} style={{ "--c": color } as CSSProperties}
            onToggle={(e) => { if (!needle) { const o = (e.currentTarget as HTMLDetailsElement).open; setOpen((x) => (x[m.code] === o ? x : { ...x, [m.code]: o })); } }}>
            <summary>
              <span className="mod-code">{m.code}</span>
              <span className="mod-title"><b>{m.title}</b><small>{m.when}</small></span>
              <span className="mod-pct">{s.pct}%</span>
              <span className="mod-bar"><Bar pct={s.pct} color={color} /></span>
            </summary>
            <div className="module-body">
              {m.goal && <p className="muted">{m.goal}</p>}
              {topics.map(({ t, ti, subs }) => (
                <div key={ti} className="topic">
                  <h3><span>{m.code.slice(1)}.{ti + 1}</span>{t.title}</h3>
                  <div className="sub-grid">
                    {subs.map(({ sub, si }) => {
                      const k = `${m.code}.${ti}.${si}`;
                      return <Check key={k} checked={!!progress.checks[k]} onChange={() => toggle("checks", k)}>{sub}</Check>;
                    })}
                  </div>
                </div>
              ))}
              {!needle && m.practice.length > 0 && <div className="inset"><h3>Hands-on practice</h3>{m.practice.map((x, i) => <Check key={i} checked={!!progress.checks[`${m.code}.p${i}`]} onChange={() => toggle("checks", `${m.code}.p${i}`)}>{x}</Check>)}</div>}
              {!needle && m.done.length > 0 && <div className="inset"><h3>You’re done when you can…</h3>{m.done.map((x, i) => <Check key={i} checked={!!progress.checks[`${m.code}.d${i}`]} onChange={() => toggle("checks", `${m.code}.d${i}`)}>{x}</Check>)}</div>}
            </div>
          </details>
        );
      })}
    </div>
  );
}
