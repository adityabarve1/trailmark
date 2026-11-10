import type { Roadmap } from "@trailmark/core";

/** The roadmap being previewed before it's saved (in memory; mobile keeps the app process alive). */
let draft: Roadmap | null = null;
export const setDraft = (r: Roadmap | null) => { draft = r; };
export const getDraft = () => draft;

/** Builder chat history survives navigating away and back. */
export const chatMemory: { messages: { role: "user" | "assistant"; content: string }[] } = { messages: [] };
