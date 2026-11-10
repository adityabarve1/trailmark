import { useState } from "react";
import { Link } from "expo-router";
import { Text } from "react-native";
import { AuthCard } from "../../src/components/AuthCard";
import { Banner, Button, Input } from "../../src/components/ui";
import { useAuth } from "../../src/lib/auth";
import { useTheme } from "../../src/theme";

export default function Reset() {
  const { sendReset } = useAuth();
  const t = useTheme();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  return (
    <AuthCard title="Reset your password" sub="We’ll email you a link. It opens the Trailmark website, where you set a new password; then sign in here.">
      <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      {!!msg && <Banner kind="ok" text={msg} />}
      {!!err && <Banner kind="error" text={err} />}
      <Button title="Send reset link" kind="primary" disabled={!email} onPress={async () => {
        setErr(""); try { await sendReset(email.trim()); setMsg(`Reset link sent to ${email}.`); } catch (e) { setErr((e as Error).message); }
      }} />
      <Link href="/login"><Text style={{ color: t.accent }}>Back to sign in</Text></Link>
    </AuthCard>
  );
}
