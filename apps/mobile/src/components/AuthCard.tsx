import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { configured } from "../lib/supabase";
import { font, radius, useTheme } from "../theme";
import { AuthBackdrop } from "./AuthBackdrop";
import { Banner } from "./ui";

export function Logo({ size = 36 }: { size?: number }) {
  const t = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect width={32} height={32} rx={9} fill={t.ink} />
      <Path d="M8 24 C 12 18, 20 22, 16 14 S 20 8, 24 8" stroke={t.dark ? "#152036" : "#7B93FF"} strokeWidth={2.6} strokeLinecap="round" fill="none" />
      <Circle cx={8} cy={24} r={2.6} fill="#22C55E" />
      <Circle cx={24} cy={8} r={2.6} fill="#F59E0B" />
    </Svg>
  );
}

export function AuthCard({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.paper, overflow: "hidden" }}>
      <AuthBackdrop />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 18 }} keyboardShouldPersistTaps="handled">
            <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <Logo /><Text style={{ color: t.ink, fontSize: 20, ...font.display }}>Trailmark</Text>
              </View>
              <Text accessibilityRole="header" style={{ color: t.ink, fontSize: 28, ...font.display }}>{title}</Text>
              <Text style={{ color: t.muted, marginBottom: 6 }}>{sub}</Text>
              {!configured && <Banner kind="error" text="Supabase isn’t configured. Copy apps/mobile/.env.example to .env, add your URL and key, then restart Expo." />}
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.l, padding: 22, gap: 12, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
});
