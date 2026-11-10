import { useState } from "react";
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from "react-native";
import { moduleStats, phaseColor, todayISO, weekIndexOf } from "@trailmark/core";
import { useTracker } from "../../src/lib/tracker";
import { Bar, Button, Check, H1, Input, Row, Screen, T } from "../../src/components/ui";
import { font, radius, useTheme } from "../../src/theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) UIManager.setLayoutAnimationEnabledExperimental(true);

export default function Syllabus() {
  const th = useTheme();
  const { roadmap, weeks, progress, toggle } = useTracker();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState("");
  if (!roadmap) return null;
  const w = weekIndexOf(roadmap, todayISO());
  const cur = w >= 0 && w < weeks.length ? weeks[w].phase : roadmap.phases[0]?.key;
  const firstOpen = roadmap.modules.find((m) => m.phase === cur && moduleStats(m, progress).pct < 100)?.code;
  const needle = q.trim().toLowerCase();
  const flip = (code: string, now: boolean) => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setOpen((o) => ({ ...o, [code]: !now })); };

  return (
    <Screen>
      <H1>Syllabus</H1>
      <T muted small>Tick a subtopic only when you can explain it out loud without notes.</T>
      <Input value={q} onChangeText={setQ} placeholder="Search subtopics" autoCorrect={false} accessibilityLabel="Search subtopics" />
      <Row>
        <Button small title="Open all" onPress={() => setOpen(Object.fromEntries(roadmap.modules.map((m) => [m.code, true])))} />
        <Button small title="Close all" onPress={() => setOpen(Object.fromEntries(roadmap.modules.map((m) => [m.code, false])))} />
      </Row>
      {roadmap.modules.map((m) => {
        const s = moduleStats(m, progress), c = phaseColor(roadmap, m.phase);
        const topics = m.topics.map((tp, ti) => ({ tp, ti, subs: tp.subs.map((sub, si) => ({ sub, si })).filter(({ sub }) => !needle || sub.toLowerCase().includes(needle) || tp.title.toLowerCase().includes(needle)) })).filter((x) => x.subs.length);
        if (needle && !topics.length) return null;
        const isOpen = needle ? true : open[m.code] ?? m.code === firstOpen;
        return (
          <View key={m.code} style={{ backgroundColor: th.surface, borderRadius: radius.m, borderWidth: 1, borderColor: th.line, borderLeftWidth: 5, borderLeftColor: c, overflow: "hidden" }}>
            <Pressable onPress={() => !needle && flip(m.code, isOpen)} accessibilityRole="button" accessibilityState={{ expanded: isOpen }} style={{ padding: 14, gap: 8 }}>
              <Row style={{ flexWrap: "nowrap" }}>
                <Text style={{ color: c, fontSize: 19, minWidth: 46, ...font.display }}>{m.code}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: th.ink, fontWeight: "700" }}>{m.title}</Text>
                  <T muted small>{m.when}</T>
                </View>
                <Text style={{ color: s.pct === 100 ? th.good : th.ink, fontSize: 17, ...font.display }}>{`${s.pct}%`}</Text>
              </Row>
              <Bar pct={s.pct} color={c} />
            </Pressable>
            {isOpen && (
              <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
                {!!m.goal && !needle && <T muted small>{m.goal}</T>}
                {topics.map(({ tp, ti, subs }) => (
                  <View key={ti} style={{ borderTopWidth: 1, borderTopColor: th.line, paddingTop: 10, marginTop: 10 }}>
                    <Text style={{ color: th.ink, fontWeight: "600", marginBottom: 2 }}><Text style={{ color: c }}>{`${m.code.slice(1)}.${ti + 1}  `}</Text>{tp.title}</Text>
                    {subs.map(({ sub, si }) => {
                      const k = `${m.code}.${ti}.${si}`;
                      return <Check key={k} color={c} checked={!!progress.checks[k]} onToggle={() => toggle("checks", k)} label={sub} />;
                    })}
                  </View>
                ))}
                {!needle && m.practice.length > 0 && (
                  <View style={{ backgroundColor: th.surface2, borderRadius: radius.s, padding: 12, marginTop: 12 }}>
                    <Text style={{ color: th.ink, fontWeight: "600" }}>Hands-on practice</Text>
                    {m.practice.map((x, i) => <Check key={i} color={c} checked={!!progress.checks[`${m.code}.p${i}`]} onToggle={() => toggle("checks", `${m.code}.p${i}`)} label={x} />)}
                  </View>
                )}
                {!needle && m.done.length > 0 && (
                  <View style={{ backgroundColor: th.surface2, borderRadius: radius.s, padding: 12, marginTop: 10 }}>
                    <Text style={{ color: th.ink, fontWeight: "600" }}>You’re done when you can…</Text>
                    {m.done.map((x, i) => <Check key={i} color={c} checked={!!progress.checks[`${m.code}.d${i}`]} onToggle={() => toggle("checks", `${m.code}.d${i}`)} label={x} />)}
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}
    </Screen>
  );
}
