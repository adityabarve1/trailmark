import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/lib/auth";
import { api } from "../../src/lib/api";
import { chatMemory, getDraft, setDraft } from "../../src/lib/draft";
import { RoadmapReveal } from "../../src/components/RoadmapReveal";
import { Banner, Button, Screen, T } from "../../src/components/ui";

export default function Preview() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const draft = getDraft();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (!draft) return <Screen><T>Nothing to preview.</T><Button title="Create a roadmap" onPress={() => router.replace("/start")} /></Screen>;
  return (
    <Screen>
      <RoadmapReveal roadmap={draft} busy={busy} onStart={async () => {
        if (!user) return;
        setBusy(true); setErr("");
        try {
          await api.createRoadmap(user.id, draft);
          setDraft(null); chatMemory.messages = [];
          await refreshProfile();
          router.replace("/");
        } catch (e) { setErr((e as Error).message); setBusy(false); }
      }} />
      {!!err && <Banner kind="error" text={err} />}
      <Button kind="ghost" title="Not right? Build it again" onPress={() => router.replace("/start")} />
    </Screen>
  );
}
