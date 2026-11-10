# Trailmark

Build a study roadmap that fits your real schedule, then track it every day.

One repository, three parts:

| Folder | What it is | Runs on |
| --- | --- | --- |
| `apps/web` | React + Vite website, installable as a desktop app (PWA) | Vercel, any browser |
| `apps/mobile` | React Native app built with Expo (expo-router) | Expo Go while developing; Play Store and App Store via EAS Build |
| `packages/core` | Shared TypeScript: roadmap format and validator, AI prompt, parser, AI provider calls, database API, dates, stats | Used by both apps |

Plus `supabase/` (database schema, security rules, account-deletion function), `scripts/seed-owner.mjs` (owner account), `data/aditya-roadmap.json` (the owner's roadmap) and `docs/`.

`packages/core` has no runtime dependencies, so each app keeps its own `node_modules`. That avoids the classic monorepo problem of two React versions clashing between web and React Native.

## Features

- Email and password accounts, with Google and GitHub ready to switch on (`docs/OAUTH.md`).
- **Roadmap builder, two ways.** In the app, an AI mentor interviews the user and writes the plan, using the user's own key for Claude, ChatGPT, Gemini, OpenRouter or Groq. **Keys stay on the device**; the owner can't see them (`docs/SECURITY.md`). Without a key, users copy the prompt into any chatbot and paste the reply back.
- The **trail reveal animation** when a roadmap is created, on web and mobile.
- **Tracker:** Today (timetable and daily log), Progress (rings, year heatmap, gates, monthly targets), Syllabus (every subtopic a checkbox), Practice log with 7- and 30-day re-solves, Weekly review, Projects and job hunt.
- **1-day buffer:** logs for today and yesterday only, enforced in the database.

## Quick start

Needs **Node.js 22 LTS** (22.13 or newer; the current Expo SDK requires it). `.nvmrc` pins it: `nvm install && nvm use`. Node 23 is not supported.

Copy commands one line at a time and **leave out any `# comment`**: in zsh (the macOS default) the comment text is passed to the command as arguments.

```bash
# installs root, web and mobile, then aligns mobile packages to the Expo SDK
npm run setup
```

Then follow the **Setup guide** (database, env files, owner account, Vercel, Expo Go, store builds). In short:

```bash
# Database: run supabase/migrations/0001_init.sql in the Supabase SQL editor, then:
npx supabase functions deploy delete-account --project-ref YOUR-REF

# Env files
# root: scripts only (secret key)
cp .env.example .env.local
# web: public values
cp apps/web/.env.example apps/web/.env
# mobile: public values
cp apps/mobile/.env.example apps/mobile/.env

# Owner account (Aditya) with the full roadmap, optionally importing the old tracker's backup
OWNER_PASSWORD='a-strong-password' npm run seed:owner -- --backup ./plan-tracker-backup.json

# http://localhost:5173
npm run web
# shows a QR code: scan it with Expo Go on your phone
npm run mobile
```

## Commands

| Command (from repo root) | What it does |
| --- | --- |
| `npm run setup` | Install everything |
| `npm run web` | Website at http://localhost:5173 |
| `npm run web:build` | Production website build in `apps/web/dist` |
| `npm run mobile` | Start Expo; scan the QR code with Expo Go |
| `npm run typecheck` | Type-check web and mobile |
| `npm run seed:owner` | Create or update the owner account and roadmap |
| `npx supabase functions deploy delete-account --project-ref REF` | Deploy the account-deletion function |

| Command (in `apps/mobile`) | What it does |
| --- | --- |
| `npm run build:apk` | Cloud-built APK to install on your Android phone |
| `npm run build:android` | Play Store build (.aab) |
| `npm run build:ios` | App Store build, no Mac needed |
| `npm run submit:android` / `submit:ios` | Upload the latest build to the stores |
| `npm run doctor` | Check Expo dependencies |

## Deploying the website (Vercel)

Import the GitHub repo into Vercel and set **Root Directory** to `apps/web`. Vite is detected; `apps/web/vercel.json` adds SPA routing and security headers. Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_APP_URL` as environment variables. Never add the secret key.

## Structure

```
apps/
  web/                 React + Vite website
    src/lib/           supabase client, auth, tracker state, router, web key vault (IndexedDB + WebCrypto)
    src/pages/         Auth, Build, Today, Progress, Syllabus, Practice, Review, Projects, Settings
    src/components/    Shell, RoadmapReveal, Heatmap, ui
  mobile/              Expo app
    app/               expo-router screens: (auth), (build), (tabs), review, projects, settings
    src/lib/           supabase client (AsyncStorage), auth, tracker state, key vault (expo-secure-store)
    src/components/    ui (animated checks, rings, bars), RoadmapReveal, Heatmap, AuthBackdrop
    app.json, eas.json, metro.config.js
packages/core/src/     schema, parse, prompt, plan, dates, stats, types, providers, api
supabase/              migrations/0001_init.sql, functions/delete-account
scripts/seed-owner.mjs
data/aditya-roadmap.json
docs/                  STORES (EAS), OAUTH, SECURITY, ROADMAP_FORMAT
```

## Status

- **Web:** bundles cleanly and passed an end-to-end browser run against a mocked backend (sign-up, roadmap import, reveal, logging, locked days, syllabus, practice, review, settings) on desktop and mobile widths, after moving to the shared core.
- **Mobile:** every file passes a syntax check, and the code type-checks against the shared core. It hasn't been run on a device yet, because this build environment has no internet for `npm install` or Expo. Run `npm run setup` and `npm run mobile` first, and send any red-screen error.
- **Not yet checked:** a real Supabase project, real AI provider calls (model names change, so pick from your provider's list if one fails), and EAS builds.
