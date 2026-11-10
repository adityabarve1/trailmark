import { Stack } from "expo-router";
import { useTheme } from "../../src/theme";
export default function BuildLayout() {
  const t = useTheme();
  return <Stack screenOptions={{ headerStyle: { backgroundColor: t.surface }, headerTintColor: t.ink, headerShadowVisible: false, contentStyle: { backgroundColor: t.paper } }}>
    <Stack.Screen name="start" options={{ headerShown: false }} />
    <Stack.Screen name="chat" options={{ title: "Build with AI" }} />
    <Stack.Screen name="import" options={{ title: "Use any chatbot" }} />
    <Stack.Screen name="preview" options={{ headerShown: false }} />
  </Stack>;
}
