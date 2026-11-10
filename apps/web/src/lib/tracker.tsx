import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "./auth";
import { api } from "./api";
import { emptyProgress, type DayLog, type PracticeItem, type ProgressDoc, type Review, type RoadmapRow } from "@trailmark/core";
import { flatWeeks, type FlatWeek } from "@trailmark/core";
import type { Roadmap } from "@trailmark/core";
import { canEditLog, todayISO } from "@trailmark/core";

type SaveState = { kind: "idle" | "saving" | "saved" } | { kind: "error"; message: string };

interface TrackerState {
  loading: boolean;
  row: RoadmapRow | null;
  roadmap: Roadmap | null;
  weeks: FlatWeek[];
  progress: ProgressDoc;
  logs: Record<string, DayLog>;
  practice: PracticeItem[];
  reviews: Record<number, Review>;
  save: SaveState;
  toggle(store: keyof ProgressDoc, key: string): void;
  setLog(day: string, patch: Partial<DayLog>): boolean;
  addPractice(item: Omit<PracticeItem, "id" | "r7" | "r30">): Promise<void>;
  updatePractice(id: string, patch: Partial<PracticeItem>): Promise<void>;
  removePractice(id: string): Promise<void>;
  setReview(week: number, patch: Partial<Review>): void;
  reload(): Promise<void>;
}

const Ctx = createContext<TrackerState | null>(null);
const DEBOUNCE = 700;

export function TrackerProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<RoadmapRow | null>(null);
  const [progress, setProgress] = useState<ProgressDoc>(emptyProgress());
  const [logs, setLogs] = useState<Record<string, DayLog>>({});
  const [practice, setPractice] = useState<PracticeItem[]>([]);
  const [reviews, setReviews] = useState<Record<number, Review>>({});
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pending = useRef(0);

  const activeId = profile?.active_roadmap_id ?? null;

  const reload = useCallback(async () => {
    if (!user || !activeId) { setRow(null); setLoading(false); return; }
    setLoading(true);
    try {
      const r = await api.getRoadmap(activeId);
      setRow(r);
      if (r) {
        const [p, l, pr, rv] = await Promise.all([api.getProgress(r.id), api.getLogs(r.id), api.getPractice(r.id), api.getReviews(r.id)]);
        setProgress(p); setLogs(l); setPractice(pr); setReviews(rv);
      }
    } catch (e) {
      setSave({ kind: "error", message: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, [user, activeId]);

  useEffect(() => { void reload(); }, [reload]);

  /** Run a write after a pause; the latest call for a key wins. */
  const schedule = useCallback((key: string, fn: () => Promise<void>) => {
    const t = timers.current.get(key);
    if (t) clearTimeout(t);
    setSave({ kind: "saving" });
    timers.current.set(key, setTimeout(async () => {
      timers.current.delete(key);
      pending.current++;
      try {
        await fn();
        pending.current--;
        if (!pending.current && !timers.current.size) setSave({ kind: "saved" });
      } catch (e) {
        pending.current--;
        setSave({ kind: "error", message: (e as Error).message });
      }
    }, DEBOUNCE));
  }, []);

  // Warn before closing with unsaved changes.
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => { if (timers.current.size || pending.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, []);

  const value = useMemo<TrackerState>(() => {
    const uid = user?.id ?? "";
    const rid = row?.id ?? "";
    return {
      // Also "loading" in the gap between the active roadmap changing and its data arriving.
      loading: loading || (!!activeId && row?.id !== activeId), row, roadmap: row?.doc ?? null, weeks: row ? flatWeeks(row.doc) : [],
      progress, logs, practice, reviews, save,
      toggle(store, key) {
        setProgress((prev) => {
          const nextStore = { ...prev[store] };
          if (nextStore[key]) delete nextStore[key]; else nextStore[key] = true;
          const next = { ...prev, [store]: nextStore };
          schedule("progress", () => api.saveProgress(uid, rid, next));
          return next;
        });
      },
      setLog(day, patch) {
        if (!canEditLog(day, todayISO())) return false;
        setLogs((prev) => {
          const merged: DayLog = { ...(prev[day] ?? {}), ...patch };
          const next = { ...prev, [day]: merged };
          schedule("log:" + day, () => api.saveLog(uid, rid, day, merged));
          return next;
        });
        return true;
      },
      async addPractice(item) {
        const saved = await api.addPractice(uid, rid, item);
        setPractice((p) => [saved, ...p]);
      },
      async updatePractice(id, patch) {
        setPractice((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
        await api.updatePractice(id, patch);
      },
      async removePractice(id) {
        setPractice((p) => p.filter((x) => x.id !== id));
        await api.deletePractice(id);
      },
      setReview(week, patch) {
        setReviews((prev) => {
          const merged = { ...(prev[week] ?? {}), ...patch };
          schedule("review:" + week, () => api.saveReview(uid, rid, week, merged));
          return { ...prev, [week]: merged };
        });
      },
      reload,
    };
  }, [loading, activeId, row, progress, logs, practice, reviews, save, user, schedule, reload]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTracker(): TrackerState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTracker must be used inside TrackerProvider");
  return v;
}
