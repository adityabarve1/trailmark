import type { CSSProperties } from "react";
import { useTracker } from "../lib/tracker";
import { phaseColor } from "@trailmark/core";
import { Bar, Check, Empty } from "../components/ui";

export function Projects() {
  const { roadmap, progress, toggle } = useTracker();
  if (!roadmap) return null;
  const P = progress.proj;
  return (
    <div className="page">
      <h1>Projects</h1>
      {!roadmap.projects.length && <Empty title="No projects in this roadmap" />}
      {roadmap.projects.map((p, i) => {
        const keys = [...p.features.map((_, j) => `p${i}.f${j}`), ...p.milestones.map((_, j) => `p${i}.m${j}`), ...roadmap.projectChecklist.map((_, j) => `p${i}.r${j}`)];
        const pct = keys.length ? Math.round((keys.filter((k) => P[k]).length * 100) / keys.length) : 0;
        const color = phaseColor(roadmap, p.phase);
        return (
          <section key={i} className="card project" style={{ "--c": color } as CSSProperties}>
            <div className="row between"><span className="tag tag-c">Project {i + 1} · {p.when}</span><b className="big-num">{pct}%</b></div>
            <h2>{p.name}</h2>
            <p className="muted small">{p.stack}</p>
            <Bar pct={pct} color={color} />
            <div className="two-col">
              <div><h3>Features</h3>{p.features.map((f, j) => <Check key={j} checked={!!P[`p${i}.f${j}`]} onChange={() => toggle("proj", `p${i}.f${j}`)}>{f}</Check>)}</div>
              <div>
                <h3>Milestones</h3>{p.milestones.map((f, j) => <Check key={j} checked={!!P[`p${i}.m${j}`]} onChange={() => toggle("proj", `p${i}.m${j}`)}>{f}</Check>)}
                {roadmap.projectChecklist.length > 0 && <><h3>Checklist</h3>{roadmap.projectChecklist.map((f, j) => <Check key={j} checked={!!P[`p${i}.r${j}`]} onChange={() => toggle("proj", `p${i}.r${j}`)}>{f}</Check>)}</>}
              </div>
            </div>
          </section>
        );
      })}
      {(roadmap.extras.length > 0 || roadmap.jobHunt.length > 0) && (
        <div className="two-col">
          {roadmap.extras.length > 0 && <section className="card"><h2>Extras</h2>{roadmap.extras.map((x, i) => <Check key={i} checked={!!P["x" + i]} onChange={() => toggle("proj", "x" + i)}>{x}</Check>)}</section>}
          {roadmap.jobHunt.length > 0 && <section className="card"><h2>Job hunt</h2>{roadmap.jobHunt.map((x, i) => <Check key={i} checked={!!P["a" + i]} onChange={() => toggle("proj", "a" + i)}>{x}</Check>)}</section>}
        </div>
      )}
    </div>
  );
}
