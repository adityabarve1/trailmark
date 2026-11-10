import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../src/lib/auth";
import { TrackerProvider, useTracker } from "../src/lib/tracker";
import { Loading } from "../src/components/ui";
import { useTheme } from "../src/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Sends people to sign-in, the roadmap builder, or the tracker depending on where they are. */
function Gate() {
  const { loading, session, profile } = useAuth();
  const tracker = useTracker();
  const segments = useSegments();
  const router = useRouter();
  const t = useTheme();
  const group = segments[0] as string | undefined;

  useEffect(() => {
    if (loading) return;
    SplashScreen.hideAsync().catch(() => {});
    const inAuth = group === "(auth)", inBuild = group === "(build)";
    if (!session) { if (!inAuth) router.replace("/login"); return; }
    if (inAuth) { router.replace("/"); return; }
    if (!profile || inBuild) return;
    if (!profile.active_roadmap_id || (!tracker.loading && !tracker.roadmap)) router.replace("/start");
  }, [loading, session, profile, group, tracker.loading, tracker.roadmap, router]);

  if (loading) return <Loading />;
  const header = { headerShown: true, headerStyle: { backgroundColor: t.surface }, headerTintColor: t.ink, headerShadowVisible: false } as const;
  return (
    <>
      <StatusBar style={t.dark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.paper }, animation: "fade" }}>
        <Stack.Screen name="review" options={{ ...header, title: "Weekly review" }} />
        <Stack.Screen name="projects" options={{ ...header, title: "Projects" }} />
        <Stack.Screen name="settings" options={{ ...header, title: "Settings" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <TrackerProvider>
          <Gate />
        </TrackerProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
