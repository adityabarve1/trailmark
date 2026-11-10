#!/usr/bin/env node
/**
 * One-command install for the whole repo: root tools, website, Expo app, then align the Expo packages.
 * Runs each step itself, so stray text typed after `npm run setup` (for example a pasted "# comment",
 * which zsh passes through as arguments) can't leak into the package installs.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const [major, minor] = process.versions.node.split(".").map(Number);
const supported = (major === 20 && minor >= 19) || (major === 22 && minor >= 13) || (major === 24 && minor >= 3) || major >= 25;
if (!supported) {
  console.warn(`
!! You are on Node ${process.versions.node}. Expo SDK 57 needs Node 22.13+ (22 LTS recommended).
!! Versions outside the supported list (for example 23) cause "Unsupported engine" warnings.
!! Fix:  nvm install 22 && nvm use 22   (then run "npm run setup" again)
`);
}

/**
 * Re-run safety: once `expo install` has pinned react (e.g. 19.2.3) in apps/mobile/package.json, a plain
 * `npm install` auto-picks the LATEST react-dom, whose peer range (react ^19.3) clashes with the pinned react
 * and fails with ERESOLVE. Pinning react-dom to the same version as react avoids that.
 */
function pinReactDom() {
  const file = "apps/mobile/package.json";
  if (!existsSync(file)) return;
  const pkg = JSON.parse(readFileSync(file, "utf8"));
  const react = pkg.dependencies?.react;
  if (react && !pkg.dependencies["react-dom"]) {
    pkg.dependencies["react-dom"] = react;
    writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
    console.log(`Pinned react-dom to ${react} in ${file} (matches react).`);
  }
}
pinReactDom();

const steps = [
  ["npm install", "."],
  ["npm install", "apps/web"],
  ["npm install", "apps/mobile"],
  // Picks the exact versions of React Native and every Expo package that match the current SDK.
  ["npx expo install expo-router expo-secure-store expo-status-bar expo-linking expo-constants expo-clipboard expo-haptics expo-splash-screen react react-native react-dom react-native-svg react-native-safe-area-context react-native-screens @react-native-async-storage/async-storage", "apps/mobile"],
  ["npx expo install typescript @types/react -- --save-dev", "apps/mobile"],
];

steps.forEach(([cmd, cwd], i) => {
  console.log(`\n[${i + 1}/${steps.length}] ${cmd.length > 90 ? cmd.slice(0, 87) + "..." : cmd}   (in ${cwd})`);
  try {
    execSync(cmd, { cwd, stdio: "inherit" });
  } catch {
    console.error(`\nStep ${i + 1} failed. Fix the error above and run "npm run setup" again; finished steps are skipped quickly.`);
    process.exit(1);
  }
});

console.log("\nDone. Next: npm run typecheck, then npm run web or npm run mobile.");
