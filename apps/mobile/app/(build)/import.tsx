import { useState } from "react";
import { Linking, View } from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { buildRoadmapPrompt, parseRoadmapText, todayISO } from "@trailmark/core";
import { setDraft } from "../../src/lib/draft";
import { Banner, Button, Card, H2, Input, Row, Screen, T } from "../../src/components/ui";

export default function BuildImport() {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const prompt = buildRoadmapPrompt({ todayISO: todayISO(), learnerNotes: notes.trim() || undefined });

  function check(raw: string) {
    const res = parseRoadmapText(raw);
    if (res.ok) { setDraft(res.roadmap); router.push("/preview"); } else setErrors(res.errors);
  }

  return (
    <Screen edges={["bottom"]}>
      <Card>
        <H2>1. Copy the prompt</H2>
        <Input label="Optional: anything to tell the mentor up front" value={notes} onChangeText={setNotes} placeholder="e.g. Python, FastAPI and LangGraph in 4 months" />
        <Button kind="primary" title={copied ? "Copied" : "Copy prompt"} onPress={async () => { await Clipboard.setStringAsync(prompt); setCopied(true); setTimeout(() => setCopied(false), 2500); }} />
        <Row>
          <Button small title="Open Claude" onPress={() => Linking.openURL("https://claude.ai/new")} />
          <Button small title="Open ChatGPT" onPress={() => Linking.openURL("https://chatgpt.com/")} />
          <Button small title="Open Gemini" onPress={() => Linking.openURL("https://gemini.google.com/app")} />
        </Row>
      </Card>
      <Card>
        <H2>2. Answer its questions</H2>
        <T muted>It asks about you, the technologies you want and your schedule, then shows a summary. Confirm it and it writes your roadmap. If the reply stops halfway, type “continue”.</T>
      </Card>
      <Card>
        <H2>3. Paste the reply here</H2>
        <Input value={text} onChangeText={(v) => { setText(v); setErrors([]); }} multiline style={{ minHeight: 160, fontFamily: undefined, fontSize: 13 }}
          placeholder="Paste everything from <<<ROADMAP_V1 to ROADMAP_V1>>>. If it came in parts, paste them all, in order." />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button kind="primary" title="Check and preview" disabled={!text.trim()} onPress={() => check(text)} />
          <Button title="Paste from clipboard" onPress={async () => { const v = await Clipboard.getStringAsync(); setText(v); if (v) check(v); }} />
        </View>
        {errors.length > 0 && <Banner kind="error" text={`That didn’t work: ${errors.join(" ")} Tip: ask the chatbot to fix these errors and output the full document again.`} />}
      </Card>
    </Screen>
  );
}
