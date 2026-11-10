import { ScrollView } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { addDays, flatWeeks, monthOf, MONTHS, phaseColor, studied, todayISO, weekStart, type DayLog, type Roadmap } from "@trailmark/core";
import { useTheme } from "../theme";

export function Heatmap({ roadmap, logs }: { roadmap: Roadmap; logs: Record<string, DayLog> }) {
  const th = useTheme();
  const weeks = flatWeeks(roadmap);
  const cell = 12, gap = 3, step = cell + gap, left = 30, top = 18, t = todayISO();
  const W = left + weeks.length * step, H = top + 7 * step + 10;
  let last = -1;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel="Study hours by day">
      <Svg width={W} height={H}>
        {["Mon", "Wed", "Fri", "Sun"].map((d, i) => <SvgText key={d} x={0} y={top + i * 2 * step + 10} fontSize={10} fill={th.muted}>{d}</SvgText>)}
        {weeks.map((w, wi) => {
          const ws = weekStart(roadmap, wi), x = left + wi * step, m = monthOf(addDays(ws, 3));
          const showLabel = m !== last;
          last = m;
          const col = phaseColor(roadmap, w.phase);
          return [
            showLabel && <SvgText key={`l${wi}`} x={x} y={11} fontSize={10} fill={th.muted}>{MONTHS[m]}</SvgText>,
            ...Array.from({ length: 7 }, (_, d) => {
              const iso = addDays(ws, d), l = logs[iso], h = l?.hours ?? 0;
              const op = h >= 4 ? 1 : h >= 2.5 ? 0.8 : h >= 1.5 ? 0.55 : h > 0 || studied(l) ? 0.3 : 0;
              return <Rect key={`${wi}-${d}`} x={x} y={top + d * step} width={cell} height={cell} rx={3}
                fill={op ? col : th.track} fillOpacity={op || 1} opacity={iso > t ? 0.55 : 1}
                stroke={iso === t ? th.ink : undefined} strokeWidth={iso === t ? 1.5 : 0} />;
            }),
            <Rect key={`b${wi}`} x={x} y={top + 7 * step + 3} width={step} height={4} fill={col} />,
          ];
        })}
      </Svg>
    </ScrollView>
  );
}
