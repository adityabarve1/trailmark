import { useColorScheme } from "react-native";

const light = {
  paper: "#F3F5FA", surface: "#FFFFFF", surface2: "#F7F8FC", ink: "#152036", ink2: "#3A4560", muted: "#5E6880",
  line: "#DFE3EC", track: "#E5E9F1", accent: "#3657F5", accentInk: "#FFFFFF", walker: "#F59E0B",
  good: "#0E8A5C", amber: "#B97300", red: "#C23549", danger: "#B42335", bannerBg: "#FFF4D9", bannerInk: "#6E4600",
  dark: false,
};
const dark: typeof light = {
  paper: "#0C1220", surface: "#131B2D", surface2: "#18223A", ink: "#E8ECF5", ink2: "#C5CCDC", muted: "#98A2B8",
  line: "#26304A", track: "#222C44", accent: "#7B93FF", accentInk: "#0C1220", walker: "#F59E0B",
  good: "#3CCB91", amber: "#F2B23E", red: "#FF7A8C", danger: "#FF6B7D", bannerBg: "#3A2A08", bannerInk: "#FFD58A",
  dark: true,
};
export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === "dark" ? dark : light;
}

export const radius = { s: 8, m: 14, l: 22 };
export const font = {
  // System fonts keep Expo Go setup simple; swap in expo-font + Bricolage Grotesque later for brand type.
  display: { fontWeight: "800" as const, letterSpacing: -0.4 },
};
