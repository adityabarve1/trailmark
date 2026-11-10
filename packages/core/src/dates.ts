export const DAY = 864e5;
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const DOWS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar date as YYYY-MM-DD. */
export function todayISO(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
export const toUTC = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
export function fromUTC(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
export const addDays = (iso: string, n: number) => fromUTC(toUTC(iso) + n * DAY);
export const diffDays = (a: string, b: string) => Math.round((toUTC(b) - toUTC(a)) / DAY);
export const mondayIndex = (iso: string) => (new Date(toUTC(iso)).getUTCDay() + 6) % 7;
export const dayOfMonth = (iso: string) => new Date(toUTC(iso)).getUTCDate();
export const monthOf = (iso: string) => new Date(toUTC(iso)).getUTCMonth();
export function nice(iso: string): string {
  const d = new Date(toUTC(iso));
  return `${DOWS[mondayIndex(iso)]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** Logs can be created or edited for today and yesterday only (1-day buffer). Enforced again in the database. */
export function canEditLog(day: string, today = todayISO()): boolean {
  const d = diffDays(day, today);
  return d === 0 || d === 1;
}
