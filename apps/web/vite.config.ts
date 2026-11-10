import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

/**
 * Content-Security-Policy for production builds. connect-src lists exactly where the app may send data:
 * Supabase (your data) and the LLM providers (only when the user uses their own key). This limits what
 * any injected script could exfiltrate. Not applied in dev because Vite's dev server injects inline scripts.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://api.openai.com https://generativelanguage.googleapis.com https://openrouter.ai https://api.groq.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const csp = (): Plugin => ({
  name: "trailmark-csp",
  apply: "build",
  transformIndexHtml: (html) => html.replace("<!--CSP-->", `<meta http-equiv="Content-Security-Policy" content="${CSP}">`),
});

const core = fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url));
const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  // Shared code lives in packages/core; alias it and allow Vite to serve files from the repo root.
  resolve: { alias: { "@trailmark/core": core } },
  server: { fs: { allow: [repoRoot] } },
  plugins: [
    react(),
    csp(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "privacy.html"],
      manifest: {
        name: "Trailmark: study roadmap and tracker",
        short_name: "Trailmark",
        description: "Build a study roadmap that fits your real schedule, then track it every day.",
        theme_color: "#152036",
        background_color: "#0C1220",
        display: "standalone",
        start_url: "/app",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        // Never cache API traffic: data and AI calls always go to the network.
        runtimeCaching: [{ urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/, handler: "CacheFirst", options: { cacheName: "fonts" } }],
      },
    }),
  ],
});
