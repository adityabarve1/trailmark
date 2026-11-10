// Supabase Edge Function: deletes the calling user's account and (via ON DELETE CASCADE) all their data.
// Required by Apple App Store guideline 5.1.1(v) and Google Play's account-deletion policy.
// Deploy: supabase functions deploy delete-account
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

  const auth = req.headers.get("authorization") ?? "";
  const url = Deno.env.get("SUPABASE_URL")!;
  const asUser = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { authorization: auth } } });
  const { data, error } = await asUser.auth.getUser();
  if (error || !data.user) return new Response(JSON.stringify({ error: "Not signed in" }), { status: 401, headers: { ...cors, "content-type": "application/json" } });

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error: delErr } = await admin.auth.admin.deleteUser(data.user.id);
  if (delErr) return new Response(JSON.stringify({ error: delErr.message }), { status: 500, headers: { ...cors, "content-type": "application/json" } });

  return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "content-type": "application/json" } });
});
