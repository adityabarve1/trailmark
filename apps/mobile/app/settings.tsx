import { useEffect, useState } from "react";
import { Alert, Linking, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { PROVIDERS, providerInfo, testKey, type ProviderId, type RoadmapRow } from "@trailmark/core";
import { useAuth } from "../src/lib/auth";
import { useTracker } from "../src/lib/tracker";
import { api } from "../src/lib/api";
import { appUrl } from "../src/lib/supabase";
import { loadKey, maskKey, removeKey, saveKey } from "../src/lib/keyVault";
import { Banner, Button, Card, H2, Input, Row, Screen, T, Tag } from "../src/components/ui";
import { useTheme } from "../src/theme";

function KeyRow({ userId, id }: { userId: string; id: ProviderId }) {
  const th = useTheme();
  const info = providerInfo(id);
  const [saved, setSaved] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { loadKey(userId, id).then(setSaved); }, [userId, id]);
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: th.line, paddingTop: 10, gap: 6 }}>
      <Row between><T bold>{info.name}</T>{saved ? <Tag text={`Saved · ${maskKey(saved)}`} color={th.good} /> : <Tag text="Not set" />}</Row>
      <Input value={value} onChangeText={setValue} placeholder={info.keyHint} secureTextEntry autoCapitalize="none" autoCorrect={false} accessibilityLabel={`${info.name} API key`} />
      <Row>
        <Button small kind="primary" title="Test and save" busy={busy} disabled={!value.trim()} onPress={async () => {
          setBusy(true); setMsg("Checking the key with the provider…");
          try { await testKey(id, value.trim(), info.defaultModel); await saveKey(userId, id, value.trim()); setSaved(value.trim()); setValue(""); setMsg("Key works and is saved on this phone."); }
          catch (e) { setMsg(`${(e as Error).message} The key was not saved.`); }
          finally { setBusy(false); }
        }} />
        {saved && <Button small kind="ghost" title="Remove" onPress={async () => { await removeKey(userId, id); setSaved(null); setMsg("Key removed from this phone."); }} />}
        <Button small kind="ghost" title="Get a key" onPress={() => Linking.openURL(info.keyUrl)} />
      </Row>
      {!!msg && <T muted small>{msg}</T>}
    </View>
  );
}

export default function Settings() {
  const th = useTheme();
  const router = useRouter();
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { row, reload } = useTracker();
  const [name, setName] = useState(profile?.display_name ?? "");
  const [headline, setHeadline] = useState(profile?.headline ?? "");
  const [maps, setMaps] = useState<RoadmapRow[]>([]);
  const [msg, setMsg] = useState("");
  useEffect(() => { api.listRoadmaps().then(setMaps).catch(() => setMaps([])); }, [row?.id]);
  if (!user) return null;

  return (
    <Screen edges={["bottom"]}>
      <Card>
        <H2>Profile</H2>
        <Input label="Name" value={name} onChangeText={setName} />
        <Input label="Headline" value={headline} onChangeText={setHeadline} placeholder="e.g. Frontend developer, Pune" />
        <T muted small>{`Email: ${user.email ?? ""} · Time zone: ${profile?.timezone ?? ""}`}</T>
        <Button small kind="primary" title="Save profile" onPress={async () => { await api.updateProfile(user.id, { display_name: name, headline }); await refreshProfile(); setMsg("Profile saved."); }} />
        {!!msg && <Banner kind="ok" text={msg} />}
      </Card>

      <Card>
        <H2>AI keys</H2>
        <T muted small>Used only by the roadmap builder. Stored in this phone’s secure keychain and sent only to the provider — never to Trailmark’s servers, so nobody running the app can read them.</T>
        {PROVIDERS.map((p) => <KeyRow key={p.id} userId={user.id} id={p.id} />)}
      </Card>

      <Card>
        <Row between><H2>Roadmaps</H2><Button small kind="primary" title="New roadmap" onPress={() => router.push("/start")} /></Row>
        {maps.map((m) => (
          <View key={m.id} style={{ borderTopWidth: 1, borderTopColor: th.line, paddingTop: 10, gap: 6 }}>
            <T bold>{m.title}</T>
            <T muted small>{`Created ${new Date(m.created_at).toLocaleDateString()}`}</T>
            {m.id === profile?.active_roadmap_id ? <Tag text="Active" color={th.good} /> : (
              <Row>
                <Button small title="Make active" onPress={async () => { await api.updateProfile(user.id, { active_roadmap_id: m.id }); await refreshProfile(); await reload(); }} />
                <Button small kind="ghost" title="Delete" onPress={() => Alert.alert(`Delete “${m.title}”?`, "This deletes the roadmap and all its progress.", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: async () => { await api.deleteRoadmap(m.id); setMaps((x) => x.filter((y) => y.id !== m.id)); } },
                ])} />
              </Row>
            )}
          </View>
        ))}
      </Card>

      <Card>
        <H2>Account</H2>
        <Row>
          <Button title="Sign out" onPress={() => signOut()} />
          <Button kind="danger" title="Delete account" onPress={() => Alert.alert("Delete your account?", "This permanently deletes your account and all your data.", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => { try { await api.deleteAccount(); } catch (e) { Alert.alert("Couldn’t delete", (e as Error).message); } } },
          ])} />
        </Row>
        {!!appUrl && <Text style={{ color: th.accent }} onPress={() => Linking.openURL(`${appUrl}/privacy.html`)}>Privacy policy</Text>}
      </Card>
    </Screen>
  );
}
