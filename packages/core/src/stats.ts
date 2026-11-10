import type { DayLog, ProgressDoc } from "./types";
import type { Module } from "./schema";
import { addDays, todayISO } from "./dates";

export const studied = (l?: DayLog) => !!l && (Object.values(l.slots ?? {}).some(Boolean) || (l.hours ?? 0) > 0 || (l.practice ?? 0) > 0);
export const fmtH = (h: number) => String(Math.round(h * 10) / 10);

export function totals(logs: Record<string, DayLog>) {
  let hours = 0, practice = 0, days = 0;
  for (const l of Object.values(logs)) { hours += l.hours ?? 0; practice += l.practice ?? 0; if (studied(l)) days++; }
  return { hours, practice, days };
}
export function sumRange(logs: Record<string, DayLog>, a: string, b: string) {
  let hours = 0, practice = 0, days = 0;
  for (const [k, l] of Object.entries(logs)) if (k >= a && k <= b) { hours += l.hours ?? 0; practice += l.practice ?? 0; if (studied(l)) days++; }
  return { hours, practice, days };
}
export function streak(logs: Record<string, DayLog>) {
  let n = 0, d = todayISO();
  if (!studied(logs[d])) d = addDays(d, -1);
  while (studied(logs[d])) { n++; d = addDays(d, -1); }
  return n;
}
export function moduleStats(m: Module, p: ProgressDoc) {
  let t = 0, c = 0;
  m.topics.forEach((tp, ti) => tp.subs.forEach((_, si) => { t++; if (p.checks[`${m.code}.${ti}.${si}`]) c++; }));
  return { t, c, pct: t ? Math.round((c * 100) / t) : 0 };
}
export function syllabusStats(mods: Module[], p: ProgressDoc) {
  const s = mods.reduce((a, m) => { const x = moduleStats(m, p); a.t += x.t; a.c += x.c; return a; }, { t: 0, c: 0 });
  return { ...s, pct: s.t ? Math.round((s.c * 100) / s.t) : 0 };
}
