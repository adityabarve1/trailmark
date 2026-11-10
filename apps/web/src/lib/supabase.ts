import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const configured = Boolean(url && anon);

export const supabase = createClient(url ?? "https://example.supabase.co", anon ?? "public-anon-key", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

/** OAuth providers switched on with VITE_AUTH_PROVIDERS="google,github" once enabled in Supabase. */
export const oauthProviders = String(import.meta.env.VITE_AUTH_PROVIDERS ?? "")
  .split(",").map((s) => s.trim()).filter((s): s is "google" | "github" => s === "google" || s === "github");

export const appUrl = (import.meta.env.VITE_APP_URL as string | undefined) ?? window.location.origin;
