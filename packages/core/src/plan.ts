import type { Roadmap, WeekRow } from "./schema";
import { addDays, diffDays } from "./dates";

export interface FlatWeek extends WeekRow { month: string; phase: string; mi: number; index: number }
export interface DayPlan {
  before?: boolean; after?: boolean; daysUntil?: number;
  w?: number; dow?: number; row?: FlatWeek; topic?: string; practice?: string; weekend?: string; buffer?: boolean;
}

export const PHASE_COLORS = ["#2563EB", "#059669", "#EA580C", "#7C3AED", "#DB2777", "#0D9488", "#CA8A04"];

export function flatWeeks(r: Roadmap): FlatWeek[] {
  const out: FlatWeek[] = [];
  r.weeks.forEach((m, mi) => m.rows.forEach((row) => out.push({ ...row, month: m.title, phase: m.phase, mi, index: out.length })));
  return out;
}
export function phaseIndex(r: Roadmap, key: string): number {
  return Math.max(0, r.phases.findIndex((p) => p.key === key));
}
export const phaseColor = (r: Roadmap, key: string) => PHASE_COLORS[phaseIndex(r, key) % PHASE_COLORS.length];

export function weekIndexOf(r: Roadmap, iso: string): number {
  const d = diffDays(r.startDate, iso);
  return d < 0 ? -1 : Math.floor(d / 7);
}
export const weekStart = (r: Roadmap, i: number) => addDays(r.startDate, i * 7);

export function dayPlan(r: Roadmap, weeks: FlatWeek[], iso: string): DayPlan {
  const idx = diffDays(r.startDate, iso);
  if (idx < 0) return { before: true, daysUntil: -idx };
  const w = Math.floor(idx / 7), dow = idx % 7;
  if (w >= weeks.length) return { after: true };
  const row = weeks[w];
  const p: DayPlan = { w, dow, row, buffer: /buffer|catch up/i.test(row.days.join(" ") + " " + row.practice) };
  if (dow <= 4) { p.practice = row.practice; p.topic = row.days[dow]; }
  else p.weekend = row.weekend;
  return p;
}

export function moduleSubKeys(r: Roadmap): Map<string, string[]> {
  const m = new Map<string, string[]>();
  r.modules.forEach((mod) => {
    const keys: string[] = [];
    mod.topics.forEach((t, ti) => t.subs.forEach((_, si) => keys.push(`${mod.code}.${ti}.${si}`)));
    m.set(mod.code, keys);
  });
  return m;
}
