import { useEffect, useRef, type ReactNode } from "react";
import {
  ActivityIndicator, Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput,
  View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { font, radius, useTheme } from "../theme";

/** Scrollable page with safe areas and keyboard avoidance. */
export function Screen({ children, scroll = true, edges = ["top"], padded = true }: { children: ReactNode; scroll?: boolean; edges?: Edge[]; padded?: boolean }) {
  const t = useTheme();
  const body = scroll
    ? <ScrollView contentContainerStyle={[padded && s.pad, { gap: 14 }]} keyboardShouldPersistTaps="handled">{children}</ScrollView>
    : <View style={[{ flex: 1 }, padded && s.pad]}>{children}</View>;
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: t.paper }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>{body}</KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Card({ children, style, accent }: { children: ReactNode; style?: StyleProp<ViewStyle>; accent?: string }) {
  const t = useTheme();
  return (
    <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }, accent ? { borderTopWidth: 4, borderTopColor: accent } : null, style]}>
      {children}
    </View>
  );
}

export function H1({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text accessibilityRole="header" style={[{ color: t.ink, fontSize: 30, lineHeight: 34, ...font.display }, style]}>{children}</Text>;
}
export function H2({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text accessibilityRole="header" style={[{ color: t.ink, fontSize: 19, lineHeight: 24, fontWeight: "700" }, style]}>{children}</Text>;
}
export function H3({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text style={[{ color: t.ink, fontSize: 15, fontWeight: "600" }, style]}>{children}</Text>;
}
export function T({ children, style, muted, small, bold }: { children: ReactNode; style?: StyleProp<TextStyle>; muted?: boolean; small?: boolean; bold?: boolean }) {
  const t = useTheme();
  return <Text style={[{ color: muted ? t.muted : t.ink, fontSize: small ? 13 : 15, lineHeight: small ? 18 : 21, fontWeight: bold ? "600" : "400" }, style]}>{children}</Text>;
}

type BtnKind = "primary" | "outline" | "ghost" | "accent" | "danger";
export function Button({ title, onPress, kind = "outline", small, disabled, busy, style }: { title: string; onPress?: () => void; kind?: BtnKind; small?: boolean; disabled?: boolean; busy?: boolean; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const bg = kind === "primary" ? t.ink : kind === "accent" ? t.accent : "transparent";
  const fg = kind === "primary" ? t.paper : kind === "accent" ? t.accentInk : kind === "danger" ? t.danger : kind === "ghost" ? t.muted : t.ink;
  const border = kind === "primary" ? t.ink : kind === "accent" ? t.accent : kind === "ghost" ? "transparent" : kind === "danger" ? t.danger : t.line;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled || !!busy }} onPress={onPress} disabled={disabled || busy}
      style={({ pressed }) => [s.btn, small && s.btnSm, { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.5 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }, style]}>
      {busy ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontWeight: "600", fontSize: small ? 13 : 15 }}>{title}</Text>}
    </Pressable>
  );
}

export function Input(props: TextInputProps & { label?: string; hint?: string }) {
  const t = useTheme();
  const { label, hint, style, multiline, ...rest } = props;
  return (
    <View style={{ gap: 5 }}>
      {label && <Text style={{ color: t.muted, fontSize: 13, fontWeight: "500" }}>{label}</Text>}
      <TextInput placeholderTextColor={t.muted} multiline={multiline} accessibilityLabel={label}
        style={[s.input, { backgroundColor: t.surface2, borderColor: t.line, color: t.ink }, multiline && { minHeight: 84, textAlignVertical: "top", paddingTop: 10 }, style]} {...rest} />
      {hint && <Text style={{ color: t.muted, fontSize: 12 }}>{hint}</Text>}
    </View>
  );
}

/** Checkbox with a springy box and a drawn tick, plus a light haptic. */
export function Check({ checked, onToggle, label, color, disabled }: { checked: boolean; onToggle: () => void; label: string; color?: string; disabled?: boolean }) {
  const t = useTheme();
  const c = color ?? t.accent;
  const anim = useRef(new Animated.Value(checked ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: checked ? 1 : 0, useNativeDriver: false, friction: 6, tension: 140 }).start();
  }, [checked, anim]);
  const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.18, 1] });
  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: [t.surface, c] });
  const border = anim.interpolate({ inputRange: [0, 1], outputRange: [t.line, c] });
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked, disabled }} accessibilityLabel={label} disabled={disabled}
      onPress={() => { void Haptics.selectionAsync().catch(() => {}); onToggle(); }}
      style={({ pressed }) => [s.checkRow, { opacity: disabled ? 0.55 : pressed ? 0.7 : 1 }]}>
      <Animated.View style={[s.checkBox, { backgroundColor: bg, borderColor: border, transform: [{ scale }] }]}>
        {checked && <Svg width={14} height={14} viewBox="0 0 16 16"><Path d="M3.5 8.5l3 3 6-7" stroke={t.paper} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>}
      </Animated.View>
      <Text style={{ flex: 1, color: checked ? t.muted : t.ink, fontSize: 15, lineHeight: 21 }}>{label}</Text>
    </Pressable>
  );
}

export function Bar({ pct, color }: { pct: number; color?: string }) {
  const t = useTheme();
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(w, { toValue: Math.min(100, Math.max(0, pct)), duration: 600, useNativeDriver: false }).start(); }, [pct, w]);
  return (
    <View style={[s.bar, { backgroundColor: t.track }]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}>
      <Animated.View style={{ height: "100%", borderRadius: 99, backgroundColor: color ?? t.accent, width: w.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) }} />
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
/** Circular progress that sweeps in on mount. */
export function Ring({ pct, size = 112, stroke = 10, color, value, label }: { pct: number; size?: number; stroke?: number; color?: string; value: string; label: string }) {
  const t = useTheme();
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const p = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(p, { toValue: Math.min(100, Math.max(0, pct)), duration: 1000, useNativeDriver: false }).start(); }, [pct, p]);
  const offset = p.interpolate({ inputRange: [0, 100], outputRange: [c, 0] });
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }} accessibilityLabel={`${value} ${label}`}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={r} stroke={color ?? t.accent} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${c} ${c}`} strokeDashoffset={offset} rotation={-90} originX={size / 2} originY={size / 2} />
      </Svg>
      <Text style={{ color: t.ink, fontSize: 22, ...font.display }}>{value}</Text>
      <Text style={{ color: t.muted, fontSize: 11, textAlign: "center", maxWidth: size - 24 }}>{label}</Text>
    </View>
  );
}

export function Tag({ text, color }: { text: string; color?: string }) {
  const t = useTheme();
  const c = color ?? t.ink2;
  return <View style={[s.tag, { backgroundColor: color ? c + "22" : t.track }]}><Text style={{ color: c, fontSize: 12, fontWeight: "600" }}>{text}</Text></View>;
}

export function Row({ children, style, between }: { children: ReactNode; style?: StyleProp<ViewStyle>; between?: boolean }) {
  return <View style={[{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }, between && { justifyContent: "space-between" }, style]}>{children}</View>;
}

/** Segmented choice (single select). */
export function Seg<K extends string>({ value, options, onChange }: { value: K | undefined; options: [K, string, string?][]; onChange: (k: K) => void }) {
  const t = useTheme();
  return (
    <View style={[s.seg, { backgroundColor: t.surface2, borderColor: t.line }]} accessibilityRole="radiogroup">
      {options.map(([k, label, dot]) => {
        const on = value === k;
        return (
          <Pressable key={k} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => onChange(k)}
            style={[s.segBtn, on && { backgroundColor: t.ink }]}>
            {dot && <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: dot }} />}
            <Text style={{ color: on ? t.paper : t.ink, fontWeight: "500", fontSize: 13 }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Horizontal scrolling chips for picking one of many options. */
export function Chips({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  const t = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
      {options.map((o) => {
        const on = o === value;
        return (
          <Pressable key={o} onPress={() => onChange(o)} accessibilityRole="radio" accessibilityState={{ selected: on }}
            style={[s.chip, { borderColor: on ? t.ink : t.line, backgroundColor: on ? t.ink : t.surface }]}>
            <Text style={{ color: on ? t.paper : t.ink, fontSize: 13 }}>{o}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function Banner({ text, kind = "warn" }: { text: string; kind?: "warn" | "error" | "ok" }) {
  const t = useTheme();
  const bg = kind === "warn" ? t.bannerBg : kind === "error" ? t.danger + "1A" : t.good + "1A";
  const fg = kind === "warn" ? t.bannerInk : kind === "error" ? t.danger : t.good;
  return <View style={[s.banner, { backgroundColor: bg }]} accessibilityLiveRegion="polite"><Text style={{ color: fg, fontWeight: "500", lineHeight: 20 }}>{text}</Text></View>;
}

export function Loading({ label = "Loading" }: { label?: string }) {
  const t = useTheme();
  return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: t.paper }} accessibilityLabel={label}><ActivityIndicator size="large" color={t.accent} /></View>;
}

const s = StyleSheet.create({
  pad: { padding: 18, paddingBottom: 40 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.m, padding: 16, gap: 8 },
  btn: { minHeight: 44, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  btnSm: { minHeight: 34, paddingHorizontal: 12 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: radius.s, paddingHorizontal: 12, fontSize: 16 },
  checkRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", paddingVertical: 7 },
  checkBox: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: -1 },
  bar: { height: 8, borderRadius: 99, overflow: "hidden" },
  tag: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  seg: { flexDirection: "row", borderWidth: 1, borderRadius: 999, padding: 3, alignSelf: "flex-start", flexWrap: "wrap" },
  segBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  banner: { borderRadius: radius.m, paddingHorizontal: 14, paddingVertical: 11 },
});
