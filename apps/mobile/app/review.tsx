import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { addDays, DOWS, fmtH, nice, phaseColor, sumRange, todayISO, weekIndexOf, weekStart } from "@trailmark/core";
import { useTracker } from "../src/lib/tracker";
import { Card, H2, Input, Row, Seg, Screen, T } from "../src/components/ui";
import { radius, useTheme } from "../src/theme";

export default function Review() {
  const th = useTheme();
  const { roadmap, weeks, logs, reviews, practice, setReview } = useTracker();
  const [w, setW] = useState<number | null>(null);
  if (!roadmap || !weeks.length) return null;
  const week = w ?? Math.max(0, Math.min(weeks.length - 1, weekIndexOf(roadmap, todayISO())));
  const row = weeks[week], a = weekStart(roadmap, week), b = addDays(a, 6), s = sumRange(logs, a, b);
  const rv = reviews[week + 1] ?? {};
  const c = phaseColor(roadmap, row.phase);
  const col = (k?: string) => (k === "g" ? th.good : k === "a" ? th.amber : k === "r" ? th.red : th.track);
  const inLog = practice.filter((x) => x.solved_on >= a && x.solved_on <= b).length;
  return (
    <Screen edges={["bottom"]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5, paddingVertical: 4 }}>
        {weeks.map((_, i) => (
          <Pressable key={i} onPress={() => setW(i)} accessibilityLabel={`Week ${i + 1}`} accessibilityState={{ selected: i === week }}
            style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: col(reviews[i + 1]?.colour), borderWidth: i === week ? 2 : 0, borderColor: th.ink }} />
        ))}
      </ScrollView>
      <Card accent={c}>
        <T small style={{ color: c, fontWeight: "700" }}>{`Week ${week + 1} · ${row.month}`}</T>
        <H2>{`${nice(a)} to ${nice(b)}`}</H2>
        <Row between>
          {[["Hours", `${fmtH(s.hours)}/${roadmap.weeklyHoursTarget}`], [roadmap.practiceTrack.name, String(s.practice)], ["Days", `${s.days}/7`], ["In log", String(inLog)]].map(([k, v]) => (
            <View key={k} style={{ minWidth: "22%" }}><T muted small>{k}</T><T bold style={{ fontSize: 22 }}>{v}</T></View>
          ))}
        </Row>
        <View style={{ backgroundColor: th.surface2, borderRadius: radius.s, padding: 12, gap: 3 }}>
          <T small><T small bold>{`${roadmap.practiceTrack.name}: `}</T>{row.practice}</T>
          {row.days.map((d, i) => <T key={i} small><T small bold>{`${DOWS[i]}: `}</T>{d}</T>)}
          <T small><T small bold>Weekend: </T>{row.weekend}</T>
        </View>
        <T bold>How did the week go?</T>
        <Seg value={rv.colour} onChange={(k) => setReview(week + 1, { colour: k })} options={[["g", "Green", th.good], ["a", "Amber", th.amber], ["r", "Red", th.red]]} />
        <Input label="Topics finished / pending" multiline value={rv.topics ?? ""} onChangeText={(v) => setReview(week + 1, { topics: v })} />
        <Input label="Project progress" multiline value={rv.project ?? ""} onChangeText={(v) => setReview(week + 1, { project: v })} />
        <Input label="One thing to change next week" value={rv.change ?? ""} onChangeText={(v) => setReview(week + 1, { change: v })} />
      </Card>
    </Screen>
  );
}
