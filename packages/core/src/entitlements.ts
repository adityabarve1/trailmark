import type { Roadmap } from "./schema";
import type { Profile } from "./types";

/** Master switch. Keep false until billing (Razorpay) launches; then set true and apply supabase/pending/0003_enforce_free_limit.sql. */
export const ENFORCE_PLANS = false;

/** Free plan: a roadmap can span at most 30 days, which is 4 week rows. Keep in sync with supabase/migrations/0002_plans.sql. */
export const FREE_MAX_WEEKS = 4;

/** Pro plan that has not expired. plan_until null means lifetime. */
export function isPro(profile: Pick<Profile, "plan" | "plan_until"> | null | undefined): boolean {
  if (!profile || profile.plan !== "pro") return false;
  return !profile.plan_until || new Date(profile.plan_until).getTime() > Date.now();
}

export const roadmapWeeks = (doc: Roadmap): number => doc.weeks.reduce((n, b) => n + b.rows.length, 0);

/** Returns a message when the roadmap is too long for the user's plan, otherwise null. */
export function planLimitError(doc: Roadmap, profile: Profile | null | undefined): string | null {
  if (!ENFORCE_PLANS || isPro(profile)) return null;
  const w = roadmapWeeks(doc);
  return w > FREE_MAX_WEEKS ? `Your plan has ${w} weeks. The Free plan allows roadmaps up to 30 days (${FREE_MAX_WEEKS} weeks). Ask for a shorter plan, or upgrade to Pro.` : null;
}
