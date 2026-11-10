import { useState } from "react";
import { Link } from "expo-router";
import { Text } from "react-native";
import { AuthCard } from "../../src/components/AuthCard";
import { Banner, Button, Input } from "../../src/components/ui";
import { useAuth } from "../../src/lib/auth";
import { useTheme } from "../../src/theme";

export default function Register() {
  const { signUp } = useAuth();
  const t = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (password.length < 8) { setErr("Use at least 8 characters for your password."); return; }
    setErr(""); setBusy(true);
    try { const r = await signUp(email.trim(), password, name.trim()); if (r.needsConfirmation) setSent(true); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }
  if (sent) return (
    <AuthCard title="Check your inbox" sub={`We sent a confirmation link to ${email}. Open it, then come back and sign in.`}>
      <Link href="/login" asChild><Button title="Go to sign in" kind="primary" /></Link>
    </AuthCard>
  );
  return (
    <AuthCard title="Create your account" sub="Build a roadmap that fits your real schedule, then track it every day.">
      <Input label="Your name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" />
      <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
      <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" hint="At least 8 characters." />
      {!!err && <Banner kind="error" text={err} />}
      <Button title="Create account" kind="primary" onPress={submit} busy={busy} disabled={!name || !email || !password} />
      <Link href="/login"><Text style={{ color: t.accent }}>Already have an account? Sign in</Text></Link>
    </AuthCard>
  );
}
