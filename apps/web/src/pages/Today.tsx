import { useState, type CSSProperties } from "react";
import { useTracker } from "../lib/tracker";
import { addDays, canEditLog, dayOfMonth, diffDays, DOWS, mondayIndex, nice, todayISO } from "@trailmark/core";
import { dayPlan, phaseColor, weekIndexOf, weekStart } from "@trailmark/core";
import { fmtH, streak, studied } from "@trailmark/core";
import { Check, Ring } from "../components/ui";
import { Link } from "../lib/router";

export function Today() {
  const { roadmap, weeks, logs, setLog } = useTracker();
  const t = todayISO();
  const [day, setDay] = useState(t);
  if (!roadmap) return null;

  const p = dayPlan(roadmap, weeks, day);
  const l = logs[day] ?? {};
  const editable = canEditLog(day, t);
  const color = p.row ? phaseColor(roadmap, p.row.phase) : "var(--accent)";
  const slotsDone = roadmap.schedule.slots.filter((s) => l.slots?.[s.id]).length;
  const dayPct = roadmap.schedule.slots.length ? Math.round((slotsDone * 100) / roadmap.schedule.slots.length) : 0;
  const s = streak(logs);

  const wi = weekIndexOf(roadmap, day);
  const ws = wi < 0 || wi >= weeks.length ? addDays(day, -mondayIndex(day)) : weekStart(roadmap, wi);
  const y1 = addDays(t, -1), y2 = addDays(t, -2);
  const started = diffDays(roadmap.startDate, y1) >= 0;
  const warn = started && !studied(logs[y1]) && diffDays(roadmap.startDate, y2) >= 0 && !studied(logs[y2])
    ? "Two days missed in a row. Get back today, even with one short slot."
    : started && !studied(logs[y1]) ? "You missed yesterday. That’s fine — just don’t miss twice. You can still log yesterday today." : "";

  return (
    <div className="page" style={{ "--c": color } as CSSProperties}>
      {warn && <p className="banner">{warn}</p>}

      <section className="today-hero">
        <div>
          <p className="eyebrow-soft">{p.row ? `Week ${(p.w ?? 0) + 1} of ${weeks.length}` : p.before ? `${p.daysUntil} days to go` : "Plan complete"}</p>
          <h1>{day === t ? "Today" : nice(day)}</h1>
          <p className="muted">{p.row ? p.row.month : p.before ? `Week 1 starts ${nice(roadmap.startDate)}` : "Review your progress and plan what’s next."}</p>
        </div>
        <Ring pct={dayPct} color={color}><b>{slotsDone}/{roadmap.schedule.slots.length}</b><span>slots</span></Ring>
      </section>

      <div className="week-strip" role="group" aria-label="Choose a day">
        {Array.from({ length: 7 }, (_, i) => {
          const d = addDays(ws, i), lg = logs[d];
          return (
            <button key={d} className={`${d === day ? "is-sel" : ""} ${studied(lg) ? "is-hit" : ""} ${d === t ? "is-today" : ""}`} onClick={() => setDay(d)} aria-pressed={d === day}>
              <span>{DOWS[i]}</span><b>{dayOfMonth(d)}</b><small>{lg?.hours ? `${fmtH(lg.hours)} h` : "·"}</small>
            </button>
          );
        })}
      </div>
      <div className="row between">
        <div className="row"><button className="btn btn-sm" onClick={() => setDay(addDays(day, -7))}>‹ Week</button><button className="btn btn-sm" onClick={() => setDay(addDays(day, 7))}>Week ›</button>{day !== t && <button className="btn btn-sm" onClick={() => setDay(t)}>Today</button>}</div>
        <p className="muted small">Streak <b className="ink">{s}</b> {s === 1 ? "day" : "days"}</p>
      </div>

      <section className="card plan-card">
        {p.before && <><h2>Before your plan starts</h2><p className="muted">Week 1: {weeks[0]?.days.join("; ")}.</p></>}
        {p.after && <h2>All {weeks.length} weeks are done</h2>}
        {p.row && (
          <>
            {p.buffer && <span className="tag tag-amber">Buffer week</span>}
            <ul className="timeline">
              {roadmap.schedule.slots.map((slot) => (
                <li key={slot.id}>
                  <time>{slot.time || "—"}</time>
                  <div>
                    <p className="tl-label">{slot.label} · {slot.minutes} min</p>
                    <p className="tl-what">{(p.dow ?? 0) >= 5 ? p.weekend : slot.kind === "practice" ? `${roadmap.practiceTrack.name}: ${p.practice}` : p.topic}</p>
                    {slot.note && <p className="muted small">{slot.note}</p>}
                  </div>
                </li>
              ))}
            </ul>
            {(p.dow ?? 0) >= 5 && roadmap.schedule.weekend && <p className="muted small">{roadmap.schedule.weekend}</p>}
            {(p.dow ?? 0) === 6 && <p className="small"><Link to="/app/review">Do this week’s review</Link></p>}
          </>
        )}
      </section>

      <section className="card">
        <div className="row between"><h2>Log {day === t ? "today" : nice(day)}</h2>
          {!editable && <span className="tag">Locked</span>}</div>
        {!editable && <p className="muted small">You can log today and yesterday. Older days are locked so your record stays honest.</p>}
        <fieldset disabled={!editable} className="log-grid">
          <div>
            {roadmap.schedule.slots.map((slot) => (
              <Check key={slot.id} checked={!!l.slots?.[slot.id]} onChange={() => setLog(day, { slots: { ...(l.slots ?? {}), [slot.id]: !l.slots?.[slot.id] } })}>{slot.label} done</Check>
            ))}
            {roadmap.schedule.habits.map((h) => (
              <Check key={h} checked={!!l.habits?.[h]} onChange={() => setLog(day, { habits: { ...(l.habits ?? {}), [h]: !l.habits?.[h] } })}>{h}</Check>
            ))}
          </div>
          <div className="row top">
            <div className="field grow"><label htmlFor="hrs">Hours studied</label>
              <input id="hrs" type="number" inputMode="decimal" min={0} max={16} step={0.25} value={l.hours ?? ""} placeholder="0"
                onChange={(e) => setLog(day, { hours: e.target.value === "" ? undefined : Math.max(0, +e.target.value) })} /></div>
            <div className="field grow"><label htmlFor="prc">{roadmap.practiceTrack.name} {roadmap.practiceTrack.unit}</label>
              <input id="prc" type="number" inputMode="numeric" min={0} max={50} value={l.practice ?? ""} placeholder="0"
                onChange={(e) => setLog(day, { practice: e.target.value === "" ? undefined : Math.max(0, Math.round(+e.target.value)) })} /></div>
          </div>
          <div className="field"><label htmlFor="dn">Done</label><textarea id="dn" value={l.done ?? ""} onChange={(e) => setLog(day, { done: e.target.value })} placeholder="What you finished" /></div>
          <div className="field"><label htmlFor="st">Stuck on</label><textarea id="st" value={l.stuck ?? ""} onChange={(e) => setLog(day, { stuck: e.target.value })} placeholder="What blocked you" /></div>
          <div className="field full"><label htmlFor="tm">Tomorrow</label><input id="tm" value={l.tomorrow ?? ""} onChange={(e) => setLog(day, { tomorrow: e.target.value })} placeholder="First thing to do tomorrow" /></div>
        </fieldset>
      </section>
    </div>
  );
}
