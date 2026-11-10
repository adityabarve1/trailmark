# Releasing to Google Play and the App Store (Expo + EAS)

The mobile app in `apps/mobile` is built with Expo. You develop in **Expo Go** and make store builds in the cloud with **EAS Build** — no Android Studio, and no Mac even for iOS.

Expo Go is for development only. The app people download from the stores is a real build made by EAS.

## One-time setup

```bash
npm install -g eas-cli
# your Expo account (free at expo.dev)
eas login
cd apps/mobile
# links the app to your Expo account (writes the project ID into app.json)
eas init
```

Before your first store build, change the IDs in `apps/mobile/app.json` to ones you own — they can never change after the first upload:

- `expo.android.package`, e.g. `com.adityabarve.trailmark`
- `expo.ios.bundleIdentifier`, the same value

### Give the cloud builds your public settings

`.env` isn't uploaded to EAS (it's in `.gitignore`), so add the three public values to EAS once for each environment:

```bash
eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_URL --value https://YOUR-PROJECT.supabase.co --visibility plaintext
eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value YOUR-PUBLISHABLE-KEY --visibility plaintext
eas env:create --environment preview --name EXPO_PUBLIC_APP_URL --value https://YOUR-SITE.vercel.app --visibility plaintext
# repeat the three lines with --environment production
```

Never add the secret / service-role key to EAS.

## Android

### Install a test build on your phone (APK)

```bash
cd apps/mobile
# eas build --platform android --profile preview
npm run build:apk
```

EAS builds in the cloud (about 10–20 minutes on the free tier) and gives you a link and QR code. Open it on your Android phone and install the APK.

### Play Store release (AAB)

You need a Google Play developer account (one-time fee).

```bash
# eas build --platform android --profile production
npm run build:android
```

1. Play Console → **Create app** → fill in name, language, free/paid.
2. Fill **App content**: privacy policy URL (`https://YOUR-SITE/privacy.html`), Data safety (collects email, name and user content; encrypted in transit; users can delete their account in the app; AI keys stay on the device), content rating, target audience.
3. Upload the first `.aab` **by hand**: Testing → **Internal testing** → Create release → upload the file EAS gave you. (Google requires the first upload in the console.)
4. New personal developer accounts must run a closed test with testers before getting production access — follow what Play Console shows for your account.
5. Later releases can be uploaded with `npm run submit:android` once you add a Google service-account key (`eas submit` walks you through it).

## iOS (no Mac needed)

You need an Apple Developer Program membership (yearly fee).

```bash
cd apps/mobile
# EAS creates certificates and profiles for you when asked
npm run build:ios
# uploads the build to App Store Connect / TestFlight
npm run submit:ios
```

Then in App Store Connect: fill the listing, screenshots, the privacy "nutrition label", and give reviewers a **test account** (a separate email and password, not your own). Submit for review.

## Review rules that commonly cause rejections

- **Account deletion (Apple 5.1.1(v), Google Play policy):** already in Settings → Account. Make sure the `delete-account` Edge Function is deployed.
- **Sign in with Apple (Apple 4.8):** if you add Google or GitHub login to the iOS app, Apple requires Sign in with Apple as well.
- **Minimum functionality (Apple 4.2):** the app is fully native (React Native), with secure key storage and the tracker — mention this in review notes.

## Updating the app

- **JavaScript-only changes:** rebuild with the same commands (or add EAS Update later for over-the-air updates).
- `appVersionSource: "remote"` and `autoIncrement` in `eas.json` bump the build number for you. Change `version` in `app.json` for user-visible releases.

## Keeping Expo current

Expo Go from the stores only opens projects on the **latest** Expo SDK. When Expo Go says the project is incompatible:

```bash
cd apps/mobile
npx expo install expo@latest
npx expo install --fix
npx expo-doctor
```
