import type { CSSProperties } from "react";
import { useTracker } from "../lib/tracker";
import { addDays } from "@trailmark/core";
import { phaseColor, weekStart, PHASE_COLORS } from "@trailmark/core";
import { fmtH, moduleStats, streak, sumRange, syllabusStats, totals } from "@trailmark/core";
import { Bar, Check, Ring } from "../components/ui";
import { Heatmap } from "../components/Heatmap";
import { Link } from "../lib/router";

export function Progress() {
  const { roadmap, weeks, logs, progress, toggle } = useTracker();
  if (!roadmap) return null;
  const tt = totals(logs);
  const syl = syllabusStats(roadmap.modules, progress);
  const hoursGoal = roadmap.weeklyHoursTarget * weeks.length;
  const practiceGoal = roadmap.practiceTrack.target;

  return (
    <div className="page">
      <div className="row between"><h1>Progress</h1><Link to="/app/review" className="btn btn-sm">Weekly review</Link></div>
      <section className="rings">
        <Ring pct={hoursGoal ? (tt.hours * 100) / hoursGoal : 0} color={PHASE_COLORS[0]}><b>{fmtH(tt.hours)}</b><span>of {hoursGoal} h</span></Ring>
        <Ring pct={practiceGoal ? (tt.practice * 100) / practiceGoal : 0} color={PHASE_COLORS[3]}><b>{tt.practice}</b><span>of {practiceGoal} {roadmap.practiceTrack.unit}</span></Ring>
        <Ring pct={syl.pct} color={PHASE_COLORS[1]}><b>{syl.pct}%</b><span>syllabus</span></Ring>
        <Ring pct={Math.min(100, streak(logs) * 100 / 30)} color={PHASE_COLORS[2]}><b>{streak(logs)}</b><span>day streak</span></Ring>
      </section>

      <section className="card">
        <h2>Your year</h2>
        <p className="muted small">Each square is a day; darker means more hours. The coloured line underneath shows the phase.</p>
        <Heatmap roadmap={roadmap} logs={logs} />
        <div className="legend">{roadmap.phases.map((p) => <span key={p.key} style={{ "--c": phaseColor(roadmap, p.key) } as CSSProperties}><i />{p.name}</span>)}</div>
      </section>

      <div className="two-col">
        <section className="card">
          <h2>Gates</h2>
          <p className="muted small">Don’t move to the next phase until its gate is ticked.</p>
          {roadmap.gates.map((g, i) => (
            <div key={i} style={{ "--c": PHASE_COLORS[i % PHASE_COLORS.length] } as CSSProperties}>
              <Check checked={!!progress.gates["g" + i]} onChange={() => toggle("gates", "g" + i)}>Gate {i + 1}: {g}</Check>
            </div>
          ))}
        </section>
        <section className="card">
          <h2>Modules</h2>
          {roadmap.modules.map((m) => {
            const s = moduleStats(m, progress);
            return (
              <div key={m.code} className="mod-line">
                <div className="row between small"><span><b style={{ color: phaseColor(roadmap, m.phase) }}>{m.code}</b> {m.title}</span><span className="muted">{s.c}/{s.t}</span></div>
                <Bar pct={s.pct} color={phaseColor(roadmap, m.phase)} />
              </div>
            );
          })}
        </section>
      </div>

      {roadmap.targets.length > 0 && (
        <section className="card">
          <h2>Monthly targets</h2>
          <div className="scroll-x">
            <table>
              <thead><tr><th>Month</th><th>Hours</th><th>{roadmap.practiceTrack.name}</th><th>Done when</th></tr></thead>
              <tbody>
                {roadmap.targets.map((m, mi) => {
                  const idxs = weeks.filter((w) => w.mi === mi).map((w) => w.index);
                  const s = idxs.length ? sumRange(logs, weekStart(roadmap, idxs[0]), addDays(weekStart(roadmap, idxs[idxs.length - 1]), 6)) : { hours: 0, practice: 0 };
                  const col = roadmap.weeks[mi] ? phaseColor(roadmap, roadmap.weeks[mi].phase) : undefined;
                  return (
                    <tr key={mi}>
                      <td><b>{m.month}</b></td>
                      <td className="min-w"><span className="small">{fmtH(s.hours)} / {m.hours} h</span><Bar pct={m.hours ? (s.hours * 100) / m.hours : 0} color={col} /></td>
                      <td>{s.practice} / {m.practice}</td>
                      <td><Check checked={!!progress.months["m" + mi]} onChange={() => toggle("months", "m" + mi)}>{m.done}</Check></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
