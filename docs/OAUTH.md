# Turning on Google and GitHub sign-in

The buttons already exist in the app; they appear when `VITE_AUTH_PROVIDERS` lists the provider.

## 1. Google

1. Go to Google Cloud Console → APIs & Services → **OAuth consent screen**. Choose External, fill in app name, support email, and your privacy-policy URL (`https://YOUR-DOMAIN/privacy.html`). Publish it.
2. **Credentials → Create credentials → OAuth client ID → Web application.**
   - Authorized redirect URI: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
3. Copy the Client ID and Client secret.
4. Supabase dashboard → Authentication → **Providers → Google** → enable, paste both, save.

## 2. GitHub

1. GitHub → Settings → Developer settings → **OAuth Apps → New OAuth App**.
   - Homepage URL: your app URL.
   - Authorization callback URL: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
2. Generate a client secret. Copy the Client ID and secret.
3. Supabase → Authentication → **Providers → GitHub** → enable, paste both, save.

## 3. Allowed redirect URLs

Supabase → Authentication → **URL Configuration**:

- Site URL: your production URL (e.g. `https://trailmark.vercel.app`).
- Redirect URLs, add:
  - `https://YOUR-DOMAIN/**`
  - `http://localhost:5173/**`

## 4. Switch the buttons on

In `.env` (and in Vercel → Project → Settings → Environment Variables):

```
VITE_AUTH_PROVIDERS=google,github
```

Redeploy.

## 5. Mobile app (Expo)

The buttons are on the website now. To add them to the mobile app later:

1. `cd apps/mobile && npx expo install expo-web-browser expo-auth-session`
2. Call `supabase.auth.signInWithOAuth({ provider, options: { redirectTo: makeRedirectUri({ scheme: "trailmark" }), skipBrowserRedirect: true } })`, open `data.url` with `WebBrowser.openAuthSessionAsync`, then pass the returned `code` to `supabase.auth.exchangeCodeForSession`.
3. Add `trailmark://**` to Supabase's Redirect URLs.

Custom URL schemes don't work inside Expo Go; test social login in an EAS build (`npm run build:apk`).

**Apple rule:** if the iOS app offers Google or GitHub sign-in, Apple requires **Sign in with Apple** as well (guideline 4.8). Add it with `expo-apple-authentication` and the Apple provider in Supabase before submitting, or ship iOS with email sign-in only.
