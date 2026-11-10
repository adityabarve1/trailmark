import type { Roadmap } from "@trailmark/core";

/** The roadmap being previewed before it's saved. Kept in sessionStorage so a refresh doesn't lose it. */
const K = "trailmark:draft";
export function setDraft(r: Roadmap | null) {
  try { if (r) sessionStorage.setItem(K, JSON.stringify(r)); else sessionStorage.removeItem(K); } catch { /* storage unavailable */ }
}
export function getDraft(): Roadmap | null {
  try { const v = sessionStorage.getItem(K); return v ? (JSON.parse(v) as Roadmap) : null; } catch { return null; }
}
