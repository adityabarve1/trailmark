# Security notes

## AI keys: the owner can't read them

- Keys are stored **only on the user's device**:
  - iOS / Android app: the OS keychain (iOS Keychain, Android Keystore) via `expo-secure-store`, readable only while the phone is unlocked and never synced to other devices (`apps/mobile/src/lib/keyVault.ts`).
  - Web / desktop: encrypted with AES-GCM in IndexedDB (`apps/web/src/lib/ai/keyVault.ts`) using a **non-extractable** WebCrypto key generated on that browser. The raw key can't be exported, so copied ciphertext is useless elsewhere.
- AI requests go **directly from the device to the provider** (`packages/core/src/providers.ts`). Trailmark has no server that sees them.
- The database has **no column** for API keys, and no code path writes one to Supabase.
- The production web build sets a Content-Security-Policy whose `connect-src` allows only Supabase and the five AI providers, which limits where any injected script could send data.

What this does not protect against: malware on the user's own device, or a malicious code change shipped in the app itself. Code review and branch protection on your repository are the defence there. Anthropic's browser access needs the `anthropic-dangerous-direct-browser-access` header; it is "dangerous" only because a key in a browser can be read by scripts running on that page, which is exactly the user's own key on their own device here.

## Data access

- Row Level Security on every table: users can only read and write their own rows.
- Triggers force `user_id` to the caller and check that the roadmap belongs to them.
- The daily-log window (today and yesterday only, in the user's time zone) is enforced in the database (`enforce_log_window`), not just the UI.
- The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. It belongs only in `.env.local` for the seed script and in Supabase's own secrets for the `delete-account` function. Never put it in a `VITE_` variable, the app, or Git.

## Accounts

- Passwords are handled entirely by Supabase Auth (bcrypt). The app never stores them.
- The owner account is created by `scripts/seed-owner.mjs` from environment variables; no password is stored in the repository.
- Turn on **Leaked password protection** and a minimum length of 8+ in Supabase → Authentication → Policies.
