/**
 * roadmap.v1 — the document format every roadmap in the app uses.
 * The AI builder and the copy-paste prompt both produce this shape, and
 * every screen reads from it. Keep this file, prompt.ts and docs/ROADMAP_FORMAT.md in sync.
 */

export interface Slot {
  id: string;
  label: string;
  time: string; // "05:40"
  minutes: number;
  kind: "practice" | "topic" | "other";
  note?: string;
}

export interface Schedule {
  slots: Slot[];
  habits: string[];
  fridayRule?: string;
  weekend?: string;
  dayPlan: { time: string; what: string }[];
}

export interface Phase { key: string; name: string; months: string; line: string }
export interface Topic { title: string; subs: string[] }
export interface Module {
  code: string; title: string; phase: string; when: string; goal: string;
  topics: Topic[]; practice: string[]; done: string[];
}
export interface WeekRow { label: string; practice: string; days: string[]; weekend: string }
export interface MonthBlock { title: string; phase: string; rows: WeekRow[] }
export interface Target { month: string; hours: number; practice: number; done: string }
export interface Project {
  name: string; when: string; phase: string; stack: string; features: string[]; milestones: string[];
}
export interface PracticeTrack { name: string; unit: string; target: number; patterns: string[] }

export interface Roadmap {
  schema: "roadmap.v1";
  title: string;
  owner: { name: string; headline?: string; goal?: string };
  startDate: string; // a Monday, YYYY-MM-DD
  weeklyHoursTarget: number;
  schedule: Schedule;
  phases: Phase[];
  gates: string[];
  modules: Module[];
  practiceTrack: PracticeTrack;
  weeks: MonthBlock[];
  targets: Target[];
  projects: Project[];
  projectChecklist: string[];
  extras: string[];
  jobHunt: string[];
}

export type ValidationResult =
  | { ok: true; roadmap: Roadmap; warnings: string[] }
  | { ok: false; errors: string[] };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : fallback);
const num = (v: unknown, fallback: number): number => {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
};
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean) : []);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Monday on or before the given ISO date. */
function toMonday(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return "";
  const back = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - back);
  return d.toISOString().slice(0, 10);
}

/** Validate and normalise anything that claims to be a roadmap.v1 document. */
export function validateRoadmap(input: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!isObj(input)) return { ok: false, errors: ["The document is not a JSON object."] };
  if (input.schema !== "roadmap.v1") warnings.push('Missing "schema": "roadmap.v1" — treated as roadmap.v1.');

  const phases: Phase[] = arr(input.phases).filter(isObj).map((p, i) => ({
    key: str(p.key, `P${i + 1}`), name: str(p.name, `Phase ${i + 1}`), months: str(p.months), line: str(p.line),
  }));
  if (!phases.length) errors.push("Add at least one phase in \"phases\".");
  const phaseKeys = new Set(phases.map((p) => p.key));
  const fixPhase = (k: unknown) => { const s = str(k); return phaseKeys.has(s) ? s : phases[0]?.key ?? "P1"; };

  const modules: Module[] = arr(input.modules).filter(isObj).map((m, i) => ({
    code: str(m.code, `M${i + 1}`), title: str(m.title, `Module ${i + 1}`), phase: fixPhase(m.phase),
    when: str(m.when), goal: str(m.goal),
    topics: arr(m.topics).filter(isObj).map((t) => ({ title: str(t.title), subs: strArr(t.subs) })).filter((t) => t.title && t.subs.length),
    practice: strArr(m.practice), done: strArr(m.done),
  }));
  if (!modules.length) errors.push("Add at least one module in \"modules\".");
  modules.forEach((m) => { if (!m.topics.length) errors.push(`Module ${m.code} has no topics with subtopics.`); });

  const weeks: MonthBlock[] = arr(input.weeks).filter(isObj).map((b, i) => ({
    title: str(b.title, `Month ${i + 1}`), phase: fixPhase(b.phase),
    rows: arr(b.rows).filter(isObj).map((r, j) => {
      const days = strArr(r.days).slice(0, 5);
      while (days.length < 5) days.push(days.length === 4 ? "Revision of this week’s notes" : "Catch up");
      return { label: str(r.label, `W${j + 1}`), practice: str(r.practice), days, weekend: str(r.weekend) };
    }),
  })).filter((b) => b.rows.length);
  const weekCount = weeks.reduce((n, b) => n + b.rows.length, 0);
  if (!weekCount) errors.push("Add at least one week in \"weeks[].rows\".");
  if (weekCount > 104) errors.push(`The plan has ${weekCount} weeks; the maximum is 104.`);

  let startDate = toMonday(str(input.startDate));
  if (!startDate) { errors.push("\"startDate\" must be a date like 2027-01-04."); startDate = "2027-01-04"; }
  else if (startDate !== str(input.startDate)) warnings.push(`Start date moved to the Monday ${startDate}.`);

  const sch = isObj(input.schedule) ? input.schedule : {};
  const slots: Slot[] = arr(sch.slots).filter(isObj).map((s, i) => ({
    id: str(s.id, String.fromCharCode(65 + i)), label: str(s.label, `Slot ${String.fromCharCode(65 + i)}`),
    time: str(s.time), minutes: num(s.minutes, 60),
    kind: s.kind === "practice" || s.kind === "topic" ? s.kind : "other", note: str(s.note) || undefined,
  }));
  if (!slots.length) {
    slots.push({ id: "A", label: "Practice", time: "", minutes: 45, kind: "practice" });
    slots.push({ id: "B", label: "Main topic", time: "", minutes: 90, kind: "topic" });
    warnings.push("No study slots given — added a practice slot and a topic slot.");
  }

  const pt = isObj(input.practiceTrack) ? input.practiceTrack : {};
  const ownerIn = isObj(input.owner) ? input.owner : {};

  if (errors.length) return { ok: false, errors };

  const roadmap: Roadmap = {
    schema: "roadmap.v1",
    title: str(input.title, "My roadmap"),
    owner: { name: str(ownerIn.name, "You"), headline: str(ownerIn.headline) || undefined, goal: str(ownerIn.goal) || undefined },
    startDate,
    weeklyHoursTarget: num(input.weeklyHoursTarget, 15),
    schedule: {
      slots, habits: strArr(sch.habits).slice(0, 6), fridayRule: str(sch.fridayRule) || undefined, weekend: str(sch.weekend) || undefined,
      dayPlan: arr(sch.dayPlan).filter(isObj).map((d) => ({ time: str(d.time), what: str(d.what) })).filter((d) => d.what),
    },
    phases, gates: strArr(input.gates), modules,
    practiceTrack: { name: str(pt.name, "Practice"), unit: str(pt.unit, "problems"), target: num(pt.target, weekCount * 7), patterns: strArr(pt.patterns) },
    weeks,
    targets: arr(input.targets).filter(isObj).map((t) => ({ month: str(t.month), hours: num(t.hours, 0), practice: num(t.practice, 0), done: str(t.done) })).filter((t) => t.month),
    projects: arr(input.projects).filter(isObj).map((p) => ({
      name: str(p.name), when: str(p.when), phase: fixPhase(p.phase), stack: str(p.stack), features: strArr(p.features), milestones: strArr(p.milestones),
    })).filter((p) => p.name),
    projectChecklist: strArr(input.projectChecklist),
    extras: strArr(input.extras),
    jobHunt: strArr(input.jobHunt),
  };
  if (!roadmap.practiceTrack.patterns.length) roadmap.practiceTrack.patterns = ["General"];
  return { ok: true, roadmap, warnings };
}
