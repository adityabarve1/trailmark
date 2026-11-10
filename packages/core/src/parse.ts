import { validateRoadmap, type ValidationResult } from "./schema";

export const BEGIN = "<<<ROADMAP_V1";
export const END = "ROADMAP_V1>>>";

/**
 * Pull a roadmap.v1 document out of an assistant's reply (or several replies
 * pasted together). Accepts, in order of preference:
 *  1. text between <<<ROADMAP_V1 and ROADMAP_V1>>> markers, possibly split
 *     across several "continue" messages (each part re-opens with the marker or just continues);
 *  2. a ```json fenced block;
 *  3. the outermost { … } in the text.
 */
export function extractJson(text: string): string | null {
  const t = text.replace(/\r\n/g, "\n");
  const b = t.indexOf(BEGIN);
  if (b !== -1) {
    let body = t.slice(b + BEGIN.length);
    const e = body.lastIndexOf(END);
    if (e !== -1) body = body.slice(0, e);
    // Parts after a "continue" may repeat the opening marker or a "PART 2/3" line.
    body = body
      .split("\n")
      .filter((line) => !line.includes(BEGIN) && !line.includes(END) && !/^\s*(PART|Part)\s+\d+\s*(\/|of)\s*\d+\s*$/.test(line) && !/^\s*```/.test(line) && !/type\s+["“]?continue/i.test(line))
      .join("\n");
    return body.trim();
  }
  const fence = t.match(/```(?:json)?\s*\n([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const first = t.indexOf("{"), last = t.lastIndexOf("}");
  if (first !== -1 && last > first) return t.slice(first, last + 1);
  return null;
}

/**
 * When a reply is cut off mid-string and continued in the next message, the join leaves a raw
 * line break inside a JSON string, which is invalid JSON. Raw line breaks are never legal inside
 * JSON strings, so removing them there is a safe repair.
 */
export function repairSplitStrings(json: string): string {
  let out = "", inStr = false, esc = false;
  for (const ch of json) {
    if (inStr) {
      if (esc) { esc = false; out += ch; continue; }
      if (ch === "\\") { esc = true; out += ch; continue; }
      if (ch === '"') { inStr = false; out += ch; continue; }
      if (ch === "\n" || ch === "\r") continue;
      out += ch;
    } else {
      if (ch === '"') inStr = true;
      out += ch;
    }
  }
  return out;
}

export function hasCompleteDocument(text: string): boolean {
  return text.includes(BEGIN) && text.includes(END);
}

export function parseRoadmapText(text: string): ValidationResult {
  const raw = extractJson(text);
  if (!raw) return { ok: false, errors: ["No roadmap document found. Paste the whole reply, including the <<<ROADMAP_V1 and ROADMAP_V1>>> lines."] };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (first) {
    try {
      data = JSON.parse(repairSplitStrings(raw));
    } catch {
      const msg = first instanceof Error ? first.message : String(first);
      return { ok: false, errors: [`The document isn’t valid JSON (${msg}). If the reply was cut off, ask the assistant to “continue” and paste every part, in order.`] };
    }
  }
  return validateRoadmap(data);
}
