import { Text, View } from "react-native";
import { Link } from "expo-router";
import { addDays, fmtH, moduleStats, PHASE_COLORS, phaseColor, streak, sumRange, syllabusStats, totals, weekStart } from "@trailmark/core";
import { useTracker } from "../../src/lib/tracker";
import { Bar, Card, Check, H1, H2, Ring, Row, Screen, T } from "../../src/components/ui";
import { Heatmap } from "../../src/components/Heatmap";
import { useTheme } from "../../src/theme";

export default function Progress() {
  const th = useTheme();
  const { roadmap, weeks, logs, progress, toggle } = useTracker();
  if (!roadmap) return null;
  const tt = totals(logs), syl = syllabusStats(roadmap.modules, progress), st = streak(logs);
  const hoursGoal = roadmap.weeklyHoursTarget * weeks.length, pGoal = roadmap.practiceTrack.target;
  return (
    <Screen>
      <Row between><H1>Progress</H1><Link href="/review"><Text style={{ color: th.accent, fontWeight: "600" }}>Weekly review →</Text></Link></Row>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-around", rowGap: 14 }}>
        <Ring pct={hoursGoal ? (tt.hours * 100) / hoursGoal : 0} color={PHASE_COLORS[0]} value={fmtH(tt.hours)} label={`of ${hoursGoal} h`} />
        <Ring pct={pGoal ? (tt.practice * 100) / pGoal : 0} color={PHASE_COLORS[3]} value={String(tt.practice)} label={`of ${pGoal} ${roadmap.practiceTrack.unit}`} />
        <Ring pct={syl.pct} color={PHASE_COLORS[1]} value={`${syl.pct}%`} label="syllabus" />
        <Ring pct={Math.min(100, (st * 100) / 30)} color={PHASE_COLORS[2]} value={String(st)} label="day streak" />
      </View>
      <Card>
        <H2>Your year</H2>
        <T muted small>Each square is a day; darker means more hours. Swipe sideways to see the whole plan.</T>
        <Heatmap roadmap={roadmap} logs={logs} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
          {roadmap.phases.map((p) => (
            <View key={p.key} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: phaseColor(roadmap, p.key) }} />
              <T muted small>{p.name}</T>
            </View>
          ))}
        </View>
      </Card>
      <Card>
        <H2>Gates</H2>
        <T muted small>Don’t move to the next phase until its gate is ticked.</T>
        {roadmap.gates.map((g, i) => <Check key={i} color={PHASE_COLORS[i % PHASE_COLORS.length]} checked={!!progress.gates["g" + i]} onToggle={() => toggle("gates", "g" + i)} label={`Gate ${i + 1}: ${g}`} />)}
      </Card>
      <Card>
        <H2>Modules</H2>
        {roadmap.modules.map((m) => {
          const s = moduleStats(m, progress), c = phaseColor(roadmap, m.phase);
          return (
            <View key={m.code} style={{ gap: 4, marginBottom: 6 }}>
              <Row between style={{ flexWrap: "nowrap" }}>
                <Text style={{ color: th.ink, flex: 1 }} numberOfLines={1}><Text style={{ color: c, fontWeight: "700" }}>{m.code}</Text> {m.title}</Text>
                <T muted small>{`${s.c}/${s.t}`}</T>
              </Row>
              <Bar pct={s.pct} color={c} />
            </View>
          );
        })}
      </Card>
      {roadmap.targets.length > 0 && (
        <Card>
          <H2>Monthly targets</H2>
          {roadmap.targets.map((m, mi) => {
            const idxs = weeks.filter((w) => w.mi === mi).map((w) => w.index);
            const s = idxs.length ? sumRange(logs, weekStart(roadmap, idxs[0]), addDays(weekStart(roadmap, idxs[idxs.length - 1]), 6)) : { hours: 0, practice: 0 };
            const c = roadmap.weeks[mi] ? phaseColor(roadmap, roadmap.weeks[mi].phase) : undefined;
            return (
              <View key={mi} style={{ borderTopWidth: 1, borderTopColor: th.line, paddingTop: 10, gap: 4 }}>
                <Row between><T bold>{m.month}</T><T muted small>{`${fmtH(s.hours)} / ${m.hours} h · ${s.practice} / ${m.practice} ${roadmap.practiceTrack.name}`}</T></Row>
                <Bar pct={m.hours ? (s.hours * 100) / m.hours : 0} color={c} />
                <Check checked={!!progress.months["m" + mi]} color={c} onToggle={() => toggle("months", "m" + mi)} label={m.done} />
              </View>
            );
          })}
        </Card>
      )}
    </Screen>
  );
}
