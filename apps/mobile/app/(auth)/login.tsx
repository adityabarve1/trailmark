import { useState } from "react";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { AuthCard } from "../../src/components/AuthCard";
import { Banner, Button, Input } from "../../src/components/ui";
import { useAuth } from "../../src/lib/auth";
import { useTheme } from "../../src/theme";

export default function Login() {
  const { signIn } = useAuth();
  const t = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    setErr(""); setBusy(true);
    try { await signIn(email.trim(), password); } // the root gate moves you on
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }
  return (
    <AuthCard title="Welcome back" sub="Sign in to pick up where you left off.">
      <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
      <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" onSubmitEditing={submit} returnKeyType="go" />
      {!!err && <Banner kind="error" text={err} />}
      <Button title="Sign in" kind="primary" onPress={submit} busy={busy} disabled={!email || !password} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
        <Link href="/reset"><Text style={{ color: t.accent }}>Forgot password?</Text></Link>
        <Link href="/register"><Text style={{ color: t.accent }}>Create an account</Text></Link>
      </View>
    </AuthCard>
  );
}
