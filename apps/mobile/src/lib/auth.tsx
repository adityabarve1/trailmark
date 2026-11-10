import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { Profile } from "@trailmark/core";
import { supabase, appUrl } from "./supabase";
import { api } from "./api";

interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, name: string): Promise<{ needsConfirmation: boolean }>;
  sendReset(email: string): Promise<void>;
  signOut(): Promise<void>;
  refreshProfile(): Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (s: Session | null) => {
    if (!s) { setProfile(null); return; }
    try {
      const p = await api.getProfile(s.user.id);
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (p && tz && p.timezone !== tz) { await api.updateProfile(s.user.id, { timezone: tz }); p.timezone = tz; }
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      void loadProfile(s);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const value = useMemo<AuthState>(() => ({
    loading, session, user: session?.user ?? null, profile,
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message === "Invalid login credentials" ? "Email or password is wrong." : error.message);
    },
    async signUp(email, password, name) {
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: { display_name: name }, emailRedirectTo: appUrl ? `${appUrl}/login` : undefined },
      });
      if (error) throw new Error(error.message);
      return { needsConfirmation: !data.session };
    },
    async sendReset(email) {
      // The link opens the website, where the new password is set; then sign in here.
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: appUrl ? `${appUrl}/reset` : undefined });
      if (error) throw new Error(error.message);
    },
    async signOut() { await supabase.auth.signOut(); },
    async refreshProfile() { await loadProfile(session); },
  }), [loading, session, profile, loadProfile]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
