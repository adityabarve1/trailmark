import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/lib/auth";
import { useTracker } from "../../src/lib/tracker";
import { Button, Card, H1, Screen, T } from "../../src/components/ui";
import { useTheme } from "../../src/theme";

export default function More() {
  const th = useTheme();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { roadmap } = useTracker();
  const items: { to: "/review" | "/projects" | "/settings" | "/start"; title: string; sub: string }[] = [
    { to: "/review", title: "Weekly review", sub: "This week’s numbers, colour and what to change" },
    { to: "/projects", title: "Projects and job hunt", sub: "Features, milestones and checklists" },
    { to: "/settings", title: "Settings", sub: "Profile, AI keys, roadmaps, account" },
    { to: "/start", title: "New roadmap", sub: "Build another plan with AI or any chatbot" },
  ];
  return (
    <Screen>
      <H1>More</H1>
      <Card>
        <T bold>{profile?.display_name ?? ""}</T>
        <T muted small>{roadmap?.title ?? ""}</T>
      </Card>
      {items.map((it) => (
        <Pressable key={it.to} onPress={() => router.push(it.to)} accessibilityRole="button" style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <Card style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: th.ink, fontSize: 16, fontWeight: "600" }}>{it.title}</Text>
              <T muted small>{it.sub}</T>
            </View>
            <Text style={{ color: th.muted, fontSize: 22 }}>›</Text>
          </Card>
        </Pressable>
      ))}
      <Button title="Sign out" kind="ghost" onPress={() => signOut()} />
    </Screen>
  );
}
