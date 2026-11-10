import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import Svg, { Path } from "react-native-svg";
import { PHASE_COLORS, flatWeeks, type Roadmap } from "@trailmark/core";
import { useTheme, font, radius } from "../theme";
import { Button } from "./ui";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const GUTTER = 60, NODE = 44, NODE_TOP = 6, PER_PHASE = 800;

interface Geo { d: string; len: number; xs: number[]; ys: number[]; input: number[]; nodeFrac: number[]; height: number }

/** Sample the winding trail through each station's node as a polyline we can measure exactly. */
function buildGeo(centers: number[], height: number): Geo {
  const x0 = GUTTER / 2;
  const xs: number[] = [x0], ys: number[] = [centers[0]], cum: number[] = [0], nodeCum: number[] = [0];
  for (let i = 1; i < centers.length; i++) {
    const a = centers[i - 1], b = centers[i], swing = i % 2 ? 24 : -24, k = (b - a) * 0.35;
    for (let step = 1; step <= 24; step++) {
      const t = step / 24, u = 1 - t;
      const x = u * u * u * x0 + 3 * u * u * t * (x0 + swing) + 3 * u * t * t * (x0 + swing) + t * t * t * x0;
      const y = u * u * u * a + 3 * u * u * t * (a + k) + 3 * u * t * t * (b - k) + t * t * t * b;
      const dl = Math.hypot(x - xs[xs.length - 1], y - ys[ys.length - 1]);
      if (dl < 0.01) continue;
      xs.push(x); ys.push(y); cum.push(cum[cum.length - 1] + dl);
    }
    nodeCum.push(cum[cum.length - 1]);
  }
  const len = Math.max(1, cum[cum.length - 1]);
  const d = xs.map((x, i) => `${i ? "L" : "M"}${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
  return { d, len, xs, ys, input: cum.map((c) => c / len), nodeFrac: nodeCum.map((c) => c / len), height };
}

export function RoadmapReveal({ roadmap, onStart, busy }: { roadmap: Roadmap; onStart?: () => void; busy?: boolean }) {
  const t = useTheme();
  const n = roadmap.phases.length;
  const weeks = useMemo(() => flatWeeks(roadmap), [roadmap]);
  const subs = roadmap.modules.reduce((a, m) => a + m.topics.reduce((b, tp) => b + tp.subs.length, 0), 0);

  const [centers, setCenters] = useState<number[]>(Array(n).fill(-1));
  const [height, setHeight] = useState(0);
  const [done, setDone] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const appear = useRef(roadmap.phases.map(() => new Animated.Value(0))).current;
  const dominoes = useRef(weeks.map(() => new Animated.Value(0))).current;
  const fired = useRef<boolean[]>([]);
  const started = useRef(false);

  const geo = useMemo(() => (height > 0 && centers.every((c) => c >= 0) && n > 1 ? buildGeo(centers, height) : null), [centers, height, n]);

  useEffect(() => {
    if (started.current || (n > 1 && !geo)) return;
    started.current = true;
    const pop = (i: number) => Animated.spring(appear[i], { toValue: 1, friction: 7, tension: 90, useNativeDriver: false }).start();
    const finish = () => {
      setDone(true);
      Animated.stagger(14, dominoes.map((v) => Animated.spring(v, { toValue: 1, friction: 6, useNativeDriver: false }))).start();
    };
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce || !geo) {
        appear.forEach((v) => v.setValue(1)); progress.setValue(1); dominoes.forEach((v) => v.setValue(1)); setDone(true);
        return;
      }
      const id = progress.addListener(({ value }) => {
        geo.nodeFrac.forEach((f, i) => { if (!fired.current[i] && value >= f - 0.002) { fired.current[i] = true; pop(i); } });
      });
      pop(0); fired.current[0] = true;
      Animated.timing(progress, { toValue: 1, duration: PER_PHASE * (n - 1), easing: Easing.linear, useNativeDriver: false })
        .start(() => { progress.removeListener(id); finish(); });
    });
  }, [geo, n, appear, dominoes, progress]);

  const onStation = (i: number) => (e: LayoutChangeEvent) => {
    const y = e.nativeEvent.layout.y + NODE_TOP + NODE / 2;
    setCenters((c) => (c[i] === y ? c : c.map((v, j) => (j === i ? y : v))));
  };

  return (
    <View style={{ gap: 18 }}>
      <View style={{ alignItems: "center", gap: 6, paddingTop: 8 }}>
        <Text style={{ color: t.accent, fontWeight: "700" }}>Your route is ready</Text>
        <Text style={{ color: t.ink, fontSize: 28, lineHeight: 32, textAlign: "center", ...font.display }}>{roadmap.title}</Text>
        {roadmap.owner.goal && <Text style={{ color: t.muted, textAlign: "center" }}>{roadmap.owner.goal}</Text>}
      </View>

      <View onLayout={(e) => setHeight(e.nativeEvent.layout.height)} style={{ position: "relative" }}>
        {geo && (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { width: GUTTER }]}>
            <Svg width={GUTTER} height={geo.height}>
              <Path d={geo.d} stroke={t.track} strokeWidth={4} strokeDasharray="2 9" strokeLinecap="round" fill="none" />
              <AnimatedPath d={geo.d} stroke={t.ink} strokeWidth={4} strokeLinecap="round" fill="none"
                strokeDasharray={`${geo.len} ${geo.len}`} strokeDashoffset={progress.interpolate({ inputRange: [0, 1], outputRange: [geo.len, 0] })} />
            </Svg>
            {!done && (
              <Animated.View style={[s.walker, { backgroundColor: t.walker, shadowColor: t.walker, transform: [
                { translateX: progress.interpolate({ inputRange: geo.input, outputRange: geo.xs.map((x) => x - 7) }) },
                { translateY: progress.interpolate({ inputRange: geo.input, outputRange: geo.ys.map((y) => y - 7) }) },
              ] }]} />
            )}
          </View>
        )}
        {roadmap.phases.map((p, i) => {
          const c = PHASE_COLORS[i % PHASE_COLORS.length];
          const a = appear[i];
          const mods = roadmap.modules.filter((m) => m.phase === p.key);
          return (
            <View key={p.key} onLayout={onStation(i)} style={{ flexDirection: "row", marginBottom: 26 }}>
              <View style={{ width: GUTTER, alignItems: "center", paddingTop: NODE_TOP }}>
                <Animated.View style={[s.node, {
                  borderColor: a.interpolate({ inputRange: [0, 1], outputRange: [t.line, c] }),
                  backgroundColor: a.interpolate({ inputRange: [0, 1], outputRange: [t.surface, c] }),
                  transform: [{ scale: a.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.8, 1.15, 1] }) }],
                }]}>
                  <Animated.Text style={{ color: "#fff", fontWeight: "800", opacity: a }}>{i + 1}</Animated.Text>
                </Animated.View>
              </View>
              <Animated.View style={[s.body, { backgroundColor: t.surface, borderColor: t.line, borderTopColor: c, opacity: a,
                transform: [{ translateX: a.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }] }]}>
                <Text style={{ color: c, fontWeight: "700", fontSize: 13 }}>{p.months}</Text>
                <Text style={{ color: t.ink, fontSize: 18, fontWeight: "700" }}>{p.name}</Text>
                {!!p.line && <Text style={{ color: t.muted }}>{p.line}</Text>}
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  {mods.map((m) => (
                    <View key={m.code} style={[s.chip, { backgroundColor: c + "1F" }]}>
                      <Text style={{ color: t.ink, fontSize: 12 }}><Text style={{ color: c, fontWeight: "700" }}>{m.code}</Text> {m.title}</Text>
                    </View>
                  ))}
                </View>
                {roadmap.gates[i] && <Text style={{ color: t.ink, fontSize: 13, marginTop: 6 }}><Text style={{ color: c }}>⚑</Text> {roadmap.gates[i]}</Text>}
              </Animated.View>
            </View>
          );
        })}
      </View>

      <View style={{ alignItems: "center", gap: 16 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, justifyContent: "center" }} accessibilityLabel={`${weeks.length} weeks`}>
          {weeks.map((w, i) => {
            const v = dominoes[i];
            const c = PHASE_COLORS[Math.max(0, roadmap.phases.findIndex((p) => p.key === w.phase)) % PHASE_COLORS.length];
            return <Animated.View key={i} style={{ width: 11, height: 17, borderRadius: 3, backgroundColor: c, opacity: v,
              transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }, { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ["-30deg", "0deg"] }) }] }} />;
          })}
        </View>
        <View style={{ flexDirection: "row", gap: 22, flexWrap: "wrap", justifyContent: "center" }}>
          {[["Weeks", weeks.length], ["Modules", roadmap.modules.length], ["Subtopics", subs], ["Projects", roadmap.projects.length]].map(([k, v]) => (
            <View key={k as string} style={{ alignItems: "center" }}>
              <Text style={{ color: t.muted, fontSize: 12 }}>{k}</Text>
              <Text style={{ color: t.ink, fontSize: 26, ...font.display }}>{v}</Text>
            </View>
          ))}
        </View>
        {onStart && <Button title="Start my plan" kind="primary" onPress={onStart} busy={busy} style={{ minWidth: 200 }} />}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  node: { width: NODE, height: NODE, borderRadius: NODE / 2, borderWidth: 3, alignItems: "center", justifyContent: "center", zIndex: 2 },
  body: { flex: 1, borderWidth: StyleSheet.hairlineWidth, borderTopWidth: 4, borderRadius: radius.m, padding: 14, gap: 3 },
  chip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  walker: { position: "absolute", left: 0, top: 0, width: 14, height: 14, borderRadius: 7, shadowOpacity: 0.8, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
});
