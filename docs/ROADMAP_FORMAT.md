# roadmap.v1 — the roadmap document format

Every roadmap in Trailmark is one JSON document in this format. The in-app AI builder and the copy-paste prompt both produce it, and every screen reads from it. The validator is `packages/core/src/schema.ts`; the prompt that teaches assistants the format is `packages/core/src/prompt.ts`.

Assistants wrap the document in marker lines so the app can find it, even when it arrives in several "continue" parts:

```
<<<ROADMAP_V1
{ ...json... }
ROADMAP_V1>>>
```

## Top level

| Field | Type | Notes |
| --- | --- | --- |
| `schema` | `"roadmap.v1"` | Required. |
| `title` | string | Plan title. |
| `owner` | `{ name, headline?, goal? }` | Shown on the reveal screen. |
| `startDate` | `YYYY-MM-DD` | Moved back to the Monday if it isn't one. |
| `weeklyHoursTarget` | number | Used for hour goals. |
| `schedule` | object | See below. |
| `phases` | `{ key, name, months, line }[]` | At least one. Colours are assigned in order. |
| `gates` | string[] | One per phase transition. |
| `modules` | Module[] | At least one, each with topics that have subtopics. |
| `practiceTrack` | `{ name, unit, target, patterns[] }` | E.g. DSA / problems / 360. |
| `weeks` | `{ title, phase, rows: WeekRow[] }[]` | Months of week rows. 1–104 weeks in total. |
| `targets` | `{ month, hours, practice, done }[]` | One per month block, same order as `weeks`. |
| `projects` | `{ name, when, phase, stack, features[], milestones[] }[]` | |
| `projectChecklist` | string[] | Applied to every project (README items, etc.). |
| `extras`, `jobHunt` | string[] | Optional checklists. |

## schedule

```json
{
  "slots": [{ "id": "A", "label": "Slot A", "time": "05:40", "minutes": 45, "kind": "practice", "note": "…" }],
  "habits": ["Gym"],
  "fridayRule": "…", "weekend": "…",
  "dayPlan": [{ "time": "05:40–06:25", "what": "Slot A: DSA" }]
}
```

`kind: "practice"` slots show the week's practice focus; `kind: "topic"` slots show the day's topic. Each slot and habit becomes a checkbox in the daily log.

## Module

```json
{ "code": "M1", "title": "Java Core", "phase": "P1", "when": "Weeks 1–5, December 2026", "goal": "…",
  "topics": [{ "title": "Collections Framework", "subs": ["HashMap internals: buckets, load factor, resize"] }],
  "practice": ["Hands-on task"], "done": ["I can explain X"] }
```

## WeekRow

```json
{ "label": "W1 · Nov 30", "practice": "Arrays basics", "days": ["Mon", "Tue", "Wed", "Thu", "Fri"], "weekend": "…" }
```

`days` holds the five weekday topics, Monday to Friday.

## How progress is keyed

Ticks are stored by position: `M1.0.2` is module M1, first topic, third subtopic; `M1.p0` is its first practice task, `M1.d0` its first "done when" item. Projects use `p0.f1` (feature), `p0.m0` (milestone), `p0.r0` (checklist); extras `x0`; job hunt `a0`; gates `g0`; months `m0`. Editing a roadmap by inserting items in the middle of a list shifts the ticks after it — add new items at the end.

A complete real example is `data/aditya-roadmap.json`. The source of truth is `packages/core/src/schema.ts`.
