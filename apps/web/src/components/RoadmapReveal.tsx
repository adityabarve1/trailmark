import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { Roadmap } from "@trailmark/core";
import { PHASE_COLORS, flatWeeks } from "@trailmark/core";

/**
 * The signature moment: a trail draws itself down the screen, a walker travels along it,
 * and each phase "station" lights up as the walker arrives, with its modules and gate.
 * Ends with the plan's weeks dropping into place. Respects prefers-reduced-motion.
 */
export function RoadmapReveal({ roadmap, onDone }: { roadmap: Roadmap; onDone?(): void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const nodes = useRef<(HTMLSpanElement | null)[]>([]);
  const [geo, setGeo] = useState<{ d: string; h: number; len: number } | null>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const n = roadmap.phases.length;
  const per = 750; // ms of trail per phase
  const total = Math.max(1, n - 1) * per;
  const weeks = flatWeeks(roadmap);
  const subs = roadmap.modules.reduce((a, m) => a + m.topics.reduce((b, t) => b + t.subs.length, 0), 0);

  useLayoutEffect(() => {
    const measure = () => {
      const box = wrap.current?.getBoundingClientRect();
      if (!box) return;
      const pts = nodes.current.filter(Boolean).map((el) => {
        const r = el!.getBoundingClientRect();
        return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 };
      });
      if (!pts.length) return;
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i], my = (a.y + b.y) / 2, swing = i % 2 ? 34 : -34;
        d += ` C ${a.x + swing} ${my - (b.y - a.y) * 0.15}, ${b.x + swing} ${my + (b.y - a.y) * 0.15}, ${b.x} ${b.y}`;
      }
      setGeo({ d, h: box.height, len: 0 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrap.current) ro.observe(wrap.current);
    return () => ro.disconnect();
  }, [n]);

  useLayoutEffect(() => {
    if (geo && pathRef.current && geo.len === 0) setGeo({ ...geo, len: pathRef.current.getTotalLength() });
  }, [geo]);

  const ready = !!geo && geo.len > 0;
  // Play once: later re-measures (rotation, resize) update the path without replaying the sequence.
  const [started, setStarted] = useState(false);
  useEffect(() => { if (ready && !started) setStarted(true); }, [ready, started]);

  return (
    <div className={`reveal ${started ? "is-playing" : ""}`} style={{ "--total": `${total}ms` } as CSSProperties}>
      <header className="reveal-head">
        <p className="reveal-kicker">Your route is ready</p>
        <h1>{roadmap.title}</h1>
        <p className="muted">{roadmap.owner.goal ?? `${weeks.length} weeks, starting ${roadmap.startDate}`}</p>
      </header>

      <div className="reveal-trail" ref={wrap}>
        {geo && (
          <svg className="trail-svg" width="100%" height={geo.h} aria-hidden="true">
            <path d={geo.d} className="trail-ghost" />
            <path ref={pathRef} d={geo.d} className="trail-line" style={{ "--len": geo.len } as CSSProperties} />
            {started && (
              <circle r="7" className="trail-walker">
                <animateMotion dur={`${total}ms`} fill="freeze" path={geo.d} keyPoints="0;1" keyTimes="0;1" calcMode="linear" />
              </circle>
            )}
          </svg>
        )}
        {roadmap.phases.map((p, i) => {
          const color = PHASE_COLORS[i % PHASE_COLORS.length];
          const mods = roadmap.modules.filter((m) => m.phase === p.key);
          const delay = n > 1 ? (i / (n - 1)) * total : 0;
          return (
            <section key={p.key} className="station" style={{ "--c": color, "--d": `${delay}ms` } as CSSProperties}>
              <span className="station-node" ref={(el) => { nodes.current[i] = el; }}><b>{i + 1}</b></span>
              <div className="station-body">
                <p className="station-when">{p.months}</p>
                <h2>{p.name}</h2>
                <p className="station-line">{p.line}</p>
                <ul className="chips">
                  {mods.map((m, j) => (
                    <li key={m.code} style={{ "--j": j } as CSSProperties}><b>{m.code}</b> {m.title}</li>
                  ))}
                </ul>
                {roadmap.gates[i] && <p className="gate"><span aria-hidden="true">⚑</span> {roadmap.gates[i]}</p>}
              </div>
            </section>
          );
        })}
      </div>

      <div className="reveal-weeks" style={{ "--d": `${total + 200}ms` } as CSSProperties}>
        <div className="week-dominoes" aria-label={`${weeks.length} weeks`}>
          {weeks.map((w, i) => (
            <i key={i} style={{ "--i": i, "--c": PHASE_COLORS[Math.max(0, roadmap.phases.findIndex((p) => p.key === w.phase)) % PHASE_COLORS.length] } as CSSProperties} />
          ))}
        </div>
        <dl className="reveal-stats">
          <div><dt>Weeks</dt><dd>{weeks.length}</dd></div>
          <div><dt>Modules</dt><dd>{roadmap.modules.length}</dd></div>
          <div><dt>Subtopics</dt><dd>{subs}</dd></div>
          <div><dt>Projects</dt><dd>{roadmap.projects.length}</dd></div>
        </dl>
        {onDone && <button className="btn btn-primary btn-lg" onClick={onDone}>Start my plan</button>}
      </div>
    </div>
  );
}
