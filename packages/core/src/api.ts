/**
 * All database reads and writes, shared by web and mobile.
 * Each app passes in its own Supabase client (different session storage per platform).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Roadmap } from "./schema";
import { emptyProgress, type DayLog, type PracticeItem, type Profile, type ProgressDoc, type Review, type RoadmapRow } from "./types";

type Res<T> = { data: T; error: { message: string } | null };
function check<T>(res: Res<T>): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}
const PRACTICE_COLS = "id,name,pattern,difficulty,status,solved_on,r7,r30";

export function createApi(supabase: SupabaseClient) {
  const now = () => new Date().toISOString();
  const api = {
    async getProfile(userId: string): Promise<Profile | null> {
      return check(await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()) as Profile | null;
    },
    async updateProfile(userId: string, patch: Partial<Omit<Profile, "id">>) {
      check(await supabase.from("profiles").update(patch).eq("id", userId));
    },
    async listRoadmaps(): Promise<RoadmapRow[]> {
      return check(await supabase.from("roadmaps").select("*").order("created_at", { ascending: false })) as RoadmapRow[];
    },
    async getRoadmap(id: string): Promise<RoadmapRow | null> {
      return check(await supabase.from("roadmaps").select("*").eq("id", id).maybeSingle()) as RoadmapRow | null;
    },
    /** Saves a roadmap and makes it the active one. */
    async createRoadmap(userId: string, doc: Roadmap): Promise<RoadmapRow> {
      const row = check(await supabase.from("roadmaps").insert({ user_id: userId, title: doc.title, doc }).select().single()) as RoadmapRow;
      await api.updateProfile(userId, { active_roadmap_id: row.id });
      return row;
    },
    async deleteRoadmap(id: string) {
      check(await supabase.from("roadmaps").delete().eq("id", id));
    },
    async getProgress(roadmapId: string): Promise<ProgressDoc> {
      const row = check(await supabase.from("progress").select("data").eq("roadmap_id", roadmapId).maybeSingle()) as { data: ProgressDoc } | null;
      return { ...emptyProgress(), ...(row?.data ?? {}) };
    },
    async saveProgress(userId: string, roadmapId: string, data: ProgressDoc) {
      check(await supabase.from("progress").upsert({ roadmap_id: roadmapId, user_id: userId, data, updated_at: now() }));
    },
    async getLogs(roadmapId: string): Promise<Record<string, DayLog>> {
      const rows = check(await supabase.from("day_logs").select("day,data").eq("roadmap_id", roadmapId)) as { day: string; data: DayLog }[];
      return Object.fromEntries(rows.map((r) => [r.day, r.data]));
    },
    async saveLog(userId: string, roadmapId: string, day: string, data: DayLog) {
      check(await supabase.from("day_logs").upsert({ roadmap_id: roadmapId, user_id: userId, day, data, updated_at: now() }));
    },
    async getPractice(roadmapId: string): Promise<PracticeItem[]> {
      return check(await supabase.from("practice_items").select(PRACTICE_COLS).eq("roadmap_id", roadmapId).order("solved_on", { ascending: false })) as PracticeItem[];
    },
    async addPractice(userId: string, roadmapId: string, item: Omit<PracticeItem, "id" | "r7" | "r30">): Promise<PracticeItem> {
      return check(await supabase.from("practice_items").insert({ ...item, user_id: userId, roadmap_id: roadmapId }).select(PRACTICE_COLS).single()) as PracticeItem;
    },
    async updatePractice(id: string, patch: Partial<PracticeItem>) {
      check(await supabase.from("practice_items").update(patch).eq("id", id));
    },
    async deletePractice(id: string) {
      check(await supabase.from("practice_items").delete().eq("id", id));
    },
    async getReviews(roadmapId: string): Promise<Record<number, Review>> {
      const rows = check(await supabase.from("weekly_reviews").select("week,data").eq("roadmap_id", roadmapId)) as { week: number; data: Review }[];
      return Object.fromEntries(rows.map((r) => [r.week, r.data]));
    },
    async saveReview(userId: string, roadmapId: string, week: number, data: Review) {
      check(await supabase.from("weekly_reviews").upsert({ roadmap_id: roadmapId, user_id: userId, week, data, updated_at: now() }));
    },
    /** Calls the delete-account Edge Function, then signs out. */
    async deleteAccount() {
      const { error } = await supabase.functions.invoke("delete-account", { method: "POST" });
      if (error) throw new Error(error.message);
      await supabase.auth.signOut();
    },
  };
  return api;
}
export type Api = ReturnType<typeof createApi>;
