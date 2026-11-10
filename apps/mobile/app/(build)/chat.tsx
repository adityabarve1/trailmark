import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View, type ScrollViewInstance } from "react-native";
import { useRouter } from "expo-router";
import {
  buildRoadmapPrompt, chat, hasCompleteDocument, parseRoadmapText, PROVIDERS, providerInfo, todayISO,
  type ChatMessage, type ProviderId,
} from "@trailmark/core";
import { useAuth } from "../../src/lib/auth";
import { loadKey } from "../../src/lib/keyVault";
import { chatMemory, setDraft } from "../../src/lib/draft";
import { Banner, Button, Chips, Input, Screen, T } from "../../src/components/ui";
import { radius, useTheme } from "../../src/theme";

export default function BuildChat() {
  const t = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [provider, setProvider] = useState<ProviderId>("anthropic");
  const [model, setModel] = useState(providerInfo("anthropic").defaultModel);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(chatMemory.messages);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [docErr, setDocErr] = useState<string[]>([]);
  const abort = useRef<AbortController | null>(null);
  const scroller = useRef<ScrollViewInstance>(null);

  useEffect(() => { if (user) loadKey(user.id, provider).then((k) => setHasKey(!!k)); }, [user, provider]);
  useEffect(() => { chatMemory.messages = messages; setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 50); }, [messages]);

  const system = buildRoadmapPrompt({ todayISO: todayISO() });

  function openDoc(convo: ChatMessage[]) {
    const all = convo.filter((m) => m.role === "assistant").map((m) => m.content).join("");
    const at = all.indexOf("<<<ROADMAP_V1");
    const res = parseRoadmapText(at >= 0 ? all.slice(at) : all);
    if (res.ok) { setDraft(res.roadmap); router.push("/preview"); } else setDocErr(res.errors);
  }

  async function send(text: string) {
    if (!user) return;
    const key = await loadKey(user.id, provider);
    if (!key) { setHasKey(false); return; }
    setErr(""); setBusy(true);
    let convo: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(convo);
    abort.current = new AbortController();
    try {
      let collected = "";
      for (let round = 0; round < 6; round++) {
        const res = await chat(provider, key, model, system, convo, abort.current.signal);
        collected += res.text;
        convo = [...convo, { role: "assistant", content: res.text }];
        setMessages(convo);
        if (!collected.includes("<<<ROADMAP_V1") || hasCompleteDocument(collected) || (!res.truncated && !/type continue/i.test(res.text))) break;
        convo = [...convo, { role: "user", content: "continue" }];
        setMessages(convo);
      }
      if (hasCompleteDocument(collected)) openDoc(convo);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setErr((e as Error).message);
    } finally { setBusy(false); }
  }

  const docReady = messages.some((m) => m.role === "assistant" && m.content.includes("<<<ROADMAP_V1"));
  const info = providerInfo(provider);

  return (
    <Screen edges={["bottom"]} scroll={false}>
      <View style={{ gap: 8 }}>
        <Chips value={info.name} options={PROVIDERS.map((p) => p.name)} onChange={(name) => { const p = PROVIDERS.find((x) => x.name === name)!; setProvider(p.id); setModel(p.defaultModel); }} />
        <Input label="Model" value={model} onChangeText={setModel} autoCapitalize="none" autoCorrect={false} hint={`Suggestions: ${info.models.join(", ")}`} />
        {hasKey === false && <Banner kind="error" text={`No ${info.name} key on this phone. Add it in More → Settings → AI keys, or use the copy-paste route.`} />}
      </View>
      <ScrollView ref={scroller} style={{ flex: 1, marginVertical: 10 }} contentContainerStyle={{ gap: 8, paddingVertical: 6 }}>
        {!messages.length && <T muted style={{ textAlign: "center", marginTop: 30 }}>Say hello to start. You can mention anything up front, like “I work 9 to 6 and want to learn Go and Kubernetes in 6 months”.</T>}
        {messages.map((m, i) => {
          const mine = m.role === "user";
          return (
            <View key={i} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "86%", padding: 12, borderRadius: 18,
              borderBottomRightRadius: mine ? 6 : 18, borderBottomLeftRadius: mine ? 18 : 6,
              backgroundColor: mine ? t.ink : t.surface, borderWidth: mine ? 0 : 1, borderColor: t.line }}>
              <Text style={{ color: mine ? t.paper : t.ink, lineHeight: 21 }}>
                {!mine && m.content.includes("<<<ROADMAP_V1") ? `Roadmap document (${Math.round(m.content.length / 1000)} KB)` : m.content}
              </Text>
            </View>
          );
        })}
        {busy && <View style={{ alignSelf: "flex-start", padding: 14, borderRadius: 18, backgroundColor: t.surface }}><ActivityIndicator color={t.muted} /></View>}
      </ScrollView>
      {!!err && <Banner kind="error" text={err} />}
      {docErr.length > 0 && (
        <View style={{ gap: 6 }}>
          <Banner kind="error" text={`The roadmap has problems: ${docErr.join(" ")}`} />
          <Button small title="Ask the mentor to fix it" onPress={() => { const e = docErr.join(" "); setDocErr([]); void send(`Your roadmap document failed validation: ${e} Output the corrected full document between the markers.`); }} />
        </View>
      )}
      <View style={{ gap: 8, borderTopWidth: 1, borderColor: t.line, paddingTop: 10 }}>
        <Input value={input} onChangeText={setInput} placeholder={messages.length ? "Your answer…" : "Hi! I want to plan my learning."} multiline style={{ minHeight: 48, maxHeight: 140, borderRadius: radius.m }} />
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {busy ? <Button title="Stop" onPress={() => abort.current?.abort()} />
            : <Button title="Send" kind="primary" disabled={!input.trim() || hasKey === false} onPress={() => { const x = input.trim(); setInput(""); void send(x); }} />}
          {docReady && !busy && <Button title="Preview my roadmap" kind="accent" onPress={() => openDoc(messages)} />}
          {messages.length > 0 && !busy && <Button title="Start over" kind="ghost" onPress={() => Alert.alert("Start over?", "This clears the interview.", [{ text: "Cancel", style: "cancel" }, { text: "Start over", style: "destructive", onPress: () => setMessages([]) }])} />}
        </View>
      </View>
    </Screen>
  );
}
