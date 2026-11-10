import { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/lib/auth";
import { useTracker } from "../../src/lib/tracker";
import { Button, Card, H1, Screen, T } from "../../src/components/ui";
import { radius, useTheme } from "../../src/theme";

/** Small looping illustration: chat bubbles appearing, or a document sliding across. */
function Art({ kind }: { kind: "chat" | "paste" }) {
  const t = useTheme();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1, duration: 1800, useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: 1200, useNativeDriver: true })]));
    loop.start(); return () => loop.stop();
  }, [v]);
  return (
    <View style={{ height: 80, borderRadius: radius.m, backgroundColor: t.surface2, overflow: "hidden", padding: 12, gap: 7 }}>
      {kind === "chat" ? [0.46, 0.38, 0.58].map((w, i) => (
        <Animated.View key={i} style={{ height: 14, borderRadius: 8, width: `${w * 100}%`, alignSelf: i === 1 ? "flex-end" : "flex-start",
          backgroundColor: i === 1 ? t.accent + "66" : t.track, opacity: v.interpolate({ inputRange: [0, 0.3 + i * 0.2, 1], outputRange: [0.3, 1, 1] }) }} />
      )) : (
        <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-between" }}>
          <Animated.View style={{ width: "38%", borderRadius: 10, backgroundColor: t.track, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, 150] }) }] }} />
          <View style={{ width: "38%", borderRadius: 10, borderWidth: 2, borderStyle: "dashed", borderColor: t.line }} />
        </View>
      )}
    </View>
  );
}

export default function Start() {
  const t = useTheme();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { roadmap } = useTracker();
  const first = profile?.display_name?.split(" ")[0];
  const Choice = ({ kind, title, body, cta, to }: { kind: "chat" | "paste"; title: string; body: string; cta: string; to: "/chat" | "/import" }) => (
    <Pressable onPress={() => router.push(to)} accessibilityRole="button" style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
      <Card>
        <Art kind={kind} />
        <Text style={{ color: t.ink, fontSize: 19, fontWeight: "700" }}>{title}</Text>
        <T muted>{body}</T>
        <Text style={{ color: t.accent, fontWeight: "700" }}>{cta} →</Text>
      </Card>
    </Pressable>
  );
  return (
    <Screen>
      <H1>{`Let’s plan your route${first ? ", " + first : ""}`}</H1>
      <T muted>Your roadmap holds the syllabus, the week-by-week plan and your daily timetable. Pick how to create it.</T>
      <Choice kind="chat" to="/chat" title="Build it in the app" cta="Start the interview"
        body="Chat with an AI mentor using your own API key from Claude, ChatGPT, Gemini, OpenRouter or Groq. Your key stays on this phone." />
      <Choice kind="paste" to="/import" title="No API key? Use any chatbot" cta="Copy the prompt"
        body="Copy our prompt into Claude, ChatGPT or Gemini, answer its questions, then paste the reply back. No key, no cost." />
      <View style={{ flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 6 }}>
        {roadmap && <Button small kind="ghost" title="Back to my plan" onPress={() => router.replace("/")} />}
        <Button small kind="ghost" title="Sign out" onPress={() => signOut()} />
      </View>
    </Screen>
  );
}
