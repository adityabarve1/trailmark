import { useState, type CSSProperties } from "react";
import { useTracker } from "../lib/tracker";
import { addDays, DOWS, nice, todayISO } from "@trailmark/core";
import { phaseColor, weekIndexOf, weekStart } from "@trailmark/core";
import { fmtH, sumRange } from "@trailmark/core";

const COLOURS = [["g", "Green"], ["a", "Amber"], ["r", "Red"]] as const;

export function Review() {
  const { roadmap, weeks, logs, reviews, practice, setReview } = useTracker();
  const [w, setW] = useState<number | null>(null);
  if (!roadmap || !weeks.length) return null;
  const week = w ?? Math.max(0, Math.min(weeks.length - 1, weekIndexOf(roadmap, todayISO())));
  const row = weeks[week], a = weekStart(roadmap, week), b = addDays(a, 6), s = sumRange(logs, a, b);
  const rv = reviews[week + 1] ?? {};
  const inLog = practice.filter((x) => x.solved_on >= a && x.solved_on <= b).length;

  return (
    <div className="page" style={{ "--c": phaseColor(roadmap, row.phase) } as CSSProperties}>
      <h1>Weekly review</h1>
      <div className="card">
        <div className="week-dots" role="group" aria-label="Pick a week">
          {weeks.map((_, i) => {
            const c = reviews[i + 1]?.colour;
            return <button key={i} className={`wd ${c ? "wd-" + c : ""} ${i === week ? "is-sel" : ""}`} onClick={() => setW(i)} aria-label={`Week ${i + 1}`} title={`Week ${i + 1}`} />;
          })}
        </div>
      </div>
      <section className="card">
        <p className="eyebrow-soft">Week {week + 1} · {row.month}</p>
        <h2>{nice(a)} to {nice(b)}</h2>
        <dl className="stat-row">
          <div><dt>Hours</dt><dd>{fmtH(s.hours)}<small> / {roadmap.weeklyHoursTarget}</small></dd></div>
          <div><dt>{roadmap.practiceTrack.name}</dt><dd>{s.practice}</dd></div>
          <div><dt>Days studied</dt><dd>{s.days}/7</dd></div>
          <div><dt>In log</dt><dd>{inLog}</dd></div>
        </dl>
        <div className="inset small">
          <p><b>{roadmap.practiceTrack.name}:</b> {row.practice}</p>
          {row.days.map((d, i) => <p key={i}><b>{DOWS[i]}:</b> {d}</p>)}
          <p><b>Weekend:</b> {row.weekend}</p>
        </div>
        <h3>How did the week go?</h3>
        <div className="seg" role="group" aria-label="Week colour">
          {COLOURS.map(([k, n]) => <button key={k} aria-pressed={rv.colour === k} onClick={() => setReview(week + 1, { colour: k })}><span className={`dot dot-${k}`} />{n}</button>)}
        </div>
        <div className="two-col">
          <div className="field"><label htmlFor="rt">Topics finished / pending</label><textarea id="rt" value={rv.topics ?? ""} onChange={(e) => setReview(week + 1, { topics: e.target.value })} /></div>
          <div className="field"><label htmlFor="rp">Project progress</label><textarea id="rp" value={rv.project ?? ""} onChange={(e) => setReview(week + 1, { project: e.target.value })} /></div>
        </div>
        <div className="field"><label htmlFor="rc">One thing to change next week</label><input id="rc" value={rv.change ?? ""} onChange={(e) => setReview(week + 1, { change: e.target.value })} /></div>
      </section>
    </div>
  );
}
