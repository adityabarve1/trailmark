import type { Roadmap } from "./schema";

export interface Profile { id: string; display_name: string | null; headline: string | null; timezone: string; active_roadmap_id: string | null }
export interface RoadmapRow { id: string; user_id: string; title: string; doc: Roadmap; created_at: string }
export interface ProgressDoc { checks: Record<string, true>; proj: Record<string, true>; gates: Record<string, true>; months: Record<string, true> }
export interface DayLog { slots?: Record<string, boolean>; habits?: Record<string, boolean>; hours?: number; practice?: number; done?: string; stuck?: string; tomorrow?: string }
export interface PracticeItem { id: string; name: string; pattern: string; difficulty: string; status: "g" | "a" | "r"; solved_on: string; r7: string | null; r30: string | null }
export interface Review { colour?: "g" | "a" | "r"; topics?: string; project?: string; change?: string }

export const emptyProgress = (): ProgressDoc => ({ checks: {}, proj: {}, gates: {}, months: {} });
