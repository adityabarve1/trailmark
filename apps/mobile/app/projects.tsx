import { Text } from "react-native";
import { phaseColor } from "@trailmark/core";
import { useTracker } from "../src/lib/tracker";
import { Bar, Card, Check, H2, Row, Screen, T, Tag } from "../src/components/ui";
import { font, useTheme } from "../src/theme";

export default function Projects() {
  const th = useTheme();
  const { roadmap, progress, toggle } = useTracker();
  if (!roadmap) return null;
  const P = progress.proj;
  return (
    <Screen edges={["bottom"]}>
      {!roadmap.projects.length && <T muted>No projects in this roadmap.</T>}
      {roadmap.projects.map((p, i) => {
        const keys = [...p.features.map((_, j) => `p${i}.f${j}`), ...p.milestones.map((_, j) => `p${i}.m${j}`), ...roadmap.projectChecklist.map((_, j) => `p${i}.r${j}`)];
        const pct = keys.length ? Math.round((keys.filter((k) => P[k]).length * 100) / keys.length) : 0;
        const c = phaseColor(roadmap, p.phase);
        return (
          <Card key={i} accent={c}>
            <Row between><Tag text={`Project ${i + 1} · ${p.when}`} color={c} /><Text style={{ color: th.ink, fontSize: 20, ...font.display }}>{`${pct}%`}</Text></Row>
            <H2>{p.name}</H2>
            <T muted small>{p.stack}</T>
            <Bar pct={pct} color={c} />
            <T bold>Features</T>
            {p.features.map((f, j) => <Check key={j} color={c} checked={!!P[`p${i}.f${j}`]} onToggle={() => toggle("proj", `p${i}.f${j}`)} label={f} />)}
            <T bold>Milestones</T>
            {p.milestones.map((f, j) => <Check key={j} color={c} checked={!!P[`p${i}.m${j}`]} onToggle={() => toggle("proj", `p${i}.m${j}`)} label={f} />)}
            {roadmap.projectChecklist.length > 0 && <T bold>Checklist</T>}
            {roadmap.projectChecklist.map((f, j) => <Check key={j} color={c} checked={!!P[`p${i}.r${j}`]} onToggle={() => toggle("proj", `p${i}.r${j}`)} label={f} />)}
          </Card>
        );
      })}
      {roadmap.extras.length > 0 && <Card><H2>Extras</H2>{roadmap.extras.map((x, i) => <Check key={i} checked={!!P["x" + i]} onToggle={() => toggle("proj", "x" + i)} label={x} />)}</Card>}
      {roadmap.jobHunt.length > 0 && <Card><H2>Job hunt</H2>{roadmap.jobHunt.map((x, i) => <Check key={i} checked={!!P["a" + i]} onToggle={() => toggle("proj", "a" + i)} label={x} />)}</Card>}
    </Screen>
  );
}
