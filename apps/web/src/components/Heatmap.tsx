import type { CSSProperties } from "react";
import type { DayLog } from "@trailmark/core";
import type { Roadmap } from "@trailmark/core";
import { addDays, monthOf, MONTHS, nice, todayISO } from "@trailmark/core";
import { flatWeeks, phaseColor, weekStart } from "@trailmark/core";
import { fmtH, studied } from "@trailmark/core";

export function Heatmap({ roadmap, logs }: { roadmap: Roadmap; logs: Record<string, DayLog> }) {
  const weeks = flatWeeks(roadmap);
  const cell = 11, gap = 3, step = cell + gap, left = 30, top = 20;
  const t = todayISO();
  let last = -1;
  const W = left + weeks.length * step;
  return (
    <div className="scroll-x">
      <svg className="heatmap" viewBox={`0 0 ${W} ${top + 7 * step + 12}`} style={{ minWidth: Math.min(W, 720) }} role="img" aria-label="Study hours by day">
        {["Mon", "Wed", "Fri", "Sun"].map((d, i) => (
          <text key={d} x={0} y={top + i * 2 * step + 9} className="hm-label">{d}</text>
        ))}
        {weeks.map((w, wi) => {
          const ws = weekStart(roadmap, wi), x = left + wi * step, m = monthOf(addDays(ws, 3));
          const label = m !== last ? <text x={x} y={11} className="hm-label">{MONTHS[m]}</text> : null;
          last = m;
          const col = phaseColor(roadmap, w.phase);
          return (
            <g key={wi}>
              {label}
              {Array.from({ length: 7 }, (_, d) => {
                const iso = addDays(ws, d), l = logs[iso], h = l?.hours ?? 0;
                const op = h >= 4 ? 1 : h >= 2.5 ? 0.8 : h >= 1.5 ? 0.55 : h > 0 || studied(l) ? 0.3 : 0;
                return (
                  <rect key={d} x={x} y={top + d * step} width={cell} height={cell} rx={2.5}
                    className={`hm-cell ${iso === t ? "is-today" : ""} ${iso > t ? "is-future" : ""}`}
                    style={{ fill: op ? col : undefined, fillOpacity: op || undefined, "--i": wi } as CSSProperties}>
                    <title>{`${nice(iso)}: ${h ? fmtH(h) + " h" : "no log"}`}</title>
                  </rect>
                );
              })}
              <rect x={x} y={top + 7 * step + 3} width={step} height={4} style={{ fill: col }} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
