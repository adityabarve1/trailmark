import { Tabs } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { useTracker } from "../../src/lib/tracker";
import { Loading } from "../../src/components/ui";
import { useTheme } from "../../src/theme";

const ICONS: Record<string, string> = {
  index: "M4 12h16M12 4v16",
  progress: "M5 19V11M12 19V5M19 19v-6",
  syllabus: "M6 4h12v16H6zM9 8h6M9 12h6M9 16h4",
  practice: "M8 6l-5 6 5 6M16 6l5 6-5 6",
  more: "M5 12h.01M12 12h.01M19 12h.01",
};

function Icon({ name, color }: { name: string; color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d={ICONS[name]} stroke={color} strokeWidth={name === "more" ? 3.2 : 1.9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export default function TabsLayout() {
  const t = useTheme();
  const { loading, roadmap } = useTracker();
  if (loading || !roadmap) return <Loading label="Loading your plan" />;
  return (
    <Tabs screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: t.accent,
      tabBarInactiveTintColor: t.muted,
      tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.line },
      tabBarIcon: ({ color }) => <Icon name={route.name} color={String(color)} />,
    })}>
      <Tabs.Screen name="index" options={{ title: "Today" }} />
      <Tabs.Screen name="progress" options={{ title: "Progress" }} />
      <Tabs.Screen name="syllabus" options={{ title: "Syllabus" }} />
      <Tabs.Screen name="practice" options={{ title: "Practice" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
    </Tabs>
  );
}
