#!/usr/bin/env node
/**
 * Creates (or updates) the owner's account and loads their roadmap and existing tracker data.
 *
 *   OWNER_EMAIL=you@example.com OWNER_PASSWORD='…' npm run seed:owner -- --backup ./plan-tracker-backup.json
 *
 * Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (never commit them, never ship them in the app).
 * Credentials are read from the environment only: nothing sensitive is stored in this repository.
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}
loadEnv(".env.local");
loadEnv(".env");

const need = (k) => { const v = process.env[k]; if (!v) { console.error(`Missing ${k}. See README → Owner account.`); process.exit(1); } return v; };
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
if (!url) { console.error("Missing SUPABASE_URL."); process.exit(1); }
const serviceKey = need("SUPABASE_SERVICE_ROLE_KEY");
const email = need("OWNER_EMAIL").trim().toLowerCase();
const password = need("OWNER_PASSWORD");
const name = process.env.OWNER_NAME || "Aditya Barve";
const headline = process.env.OWNER_HEADLINE || "Analyst (frontend developer), Dentsu Global Services, Pune";
const tz = process.env.OWNER_TIMEZONE || "Asia/Kolkata";
const args = process.argv.slice(2);
const backupPath = args.includes("--backup") ? args[args.indexOf("--backup") + 1] : null;
const roadmapPath = args.includes("--roadmap") ? args[args.indexOf("--roadmap") + 1] : "data/aditya-roadmap.json";

if (password.length < 8) { console.error("OWNER_PASSWORD must be at least 8 characters."); process.exit(1); }

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const die = (what, error) => { console.error(`${what}: ${error.message}`); process.exit(1); };

async function findUser() {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) die("Listing users", error);
    const hit = data.users.find((u) => (u.email || "").toLowerCase() === email);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

let user = await findUser();
if (user) {
  const { error } = await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true, user_metadata: { display_name: name } });
  if (error) die("Updating owner", error);
  console.log(`Owner exists (${email}); password and profile updated.`);
} else {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: name } });
  if (error) die("Creating owner", error);
  user = data.user;
  console.log(`Created owner account ${email}.`);
}
const uid = user.id;

// Profile (the auth trigger creates the row; make sure it has the right details).
{
  const { error } = await admin.from("profiles").upsert({ id: uid, display_name: name, headline, timezone: tz });
  if (error) die("Saving profile", error);
}

// Roadmap: reuse one with the same title so re-running doesn't duplicate it.
const doc = JSON.parse(readFileSync(roadmapPath, "utf8"));
if (doc.schema !== "roadmap.v1") { console.error(`${roadmapPath} is not a roadmap.v1 document.`); process.exit(1); }
let roadmapId;
{
  const { data: existing, error } = await admin.from("roadmaps").select("id").eq("user_id", uid).eq("title", doc.title).maybeSingle();
  if (error) die("Reading roadmaps", error);
  if (existing) {
    roadmapId = existing.id;
    const { error: e2 } = await admin.from("roadmaps").update({ doc }).eq("id", roadmapId);
    if (e2) die("Updating roadmap", e2);
    console.log("Roadmap updated.");
  } else {
    const { data, error: e2 } = await admin.from("roadmaps").insert({ user_id: uid, title: doc.title, doc }).select("id").single();
    if (e2) die("Creating roadmap", e2);
    roadmapId = data.id;
    console.log("Roadmap created.");
  }
  const { error: e3 } = await admin.from("profiles").update({ active_roadmap_id: roadmapId }).eq("id", uid);
  if (e3) die("Activating roadmap", e3);
}

// Optional: import the backup exported from the earlier single-page tracker (Export backup button).
if (backupPath) {
  const backup = JSON.parse(readFileSync(backupPath, "utf8"));
  if (backup.app !== "plan-tracker" || !backup.data) { console.error("That file isn't a plan-tracker backup."); process.exit(1); }
  const d = backup.data;

  const progress = { checks: d.progress?.checks ?? {}, proj: d.progress?.proj ?? {}, gates: d.progress?.gates ?? {}, months: d.progress?.months ?? {} };
  { const { error } = await admin.from("progress").upsert({ roadmap_id: roadmapId, user_id: uid, data: progress }); if (error) die("Importing progress", error); }

  const logs = Object.entries(d.logs?.days ?? {}).map(([day, l]) => ({
    roadmap_id: roadmapId, user_id: uid, day,
    data: {
      slots: { A: !!l.a, B: !!l.b }, habits: { Gym: !!l.g },
      ...(l.h ? { hours: +l.h } : {}), ...(l.p ? { practice: +l.p } : {}),
      ...(l.d ? { done: l.d } : {}), ...(l.s ? { stuck: l.s } : {}), ...(l.t ? { tomorrow: l.t } : {}),
    },
  }));
  if (logs.length) { const { error } = await admin.from("day_logs").upsert(logs); if (error) die("Importing logs", error); }

  const items = (d.dsa?.items ?? []).map((it) => ({
    roadmap_id: roadmapId, user_id: uid, name: it.name, pattern: it.pattern, difficulty: it.diff || "Medium",
    status: ["g", "a", "r"].includes(it.status) ? it.status : "a", solved_on: it.date, r7: it.r7 || null, r30: it.r30 || null,
  }));
  if (items.length) {
    await admin.from("practice_items").delete().eq("roadmap_id", roadmapId);
    const { error } = await admin.from("practice_items").insert(items); if (error) die("Importing DSA log", error);
  }

  const reviews = Object.entries(d.reviews?.weeks ?? {}).map(([k, r]) => ({
    roadmap_id: roadmapId, user_id: uid, week: parseInt(k.replace(/\D/g, ""), 10),
    data: { colour: r.c, topics: r.topics, project: r.proj, change: r.change },
  })).filter((r) => r.week >= 1 && r.week <= 104);
  if (reviews.length) { const { error } = await admin.from("weekly_reviews").upsert(reviews); if (error) die("Importing reviews", error); }

  console.log(`Imported backup: ${Object.keys(progress.checks).length} ticks, ${logs.length} days, ${items.length} practice items, ${reviews.length} reviews.`);
}

console.log("Done. Sign in with the owner email and password.");
