import { useEffect, type ReactElement } from "react";
import { AuthProvider, useAuth } from "./lib/auth";
import { Router, useRouter } from "./lib/router";
import { TrackerProvider, useTracker } from "./lib/tracker";
import { Shell } from "./components/Shell";
import { Spinner } from "./components/ui";
import { Login, Register, Reset } from "./pages/Auth";
import { Start, BuildChat, BuildImport, BuildPreview } from "./pages/Build";
import { Today } from "./pages/Today";
import { Progress } from "./pages/Progress";
import { Syllabus } from "./pages/Syllabus";
import { Practice } from "./pages/Practice";
import { Review } from "./pages/Review";
import { Projects } from "./pages/Projects";
import { Settings } from "./pages/Settings";

const APP_PAGES: Record<string, () => ReactElement | null> = {
  "/app": Today,
  "/app/progress": Progress,
  "/app/syllabus": Syllabus,
  "/app/practice": Practice,
  "/app/review": Review,
  "/app/projects": Projects,
  "/app/settings": Settings,
};

function Redirect({ to }: { to: string }) {
  const { go } = useRouter();
  useEffect(() => { go(to, true); }, [to, go]);
  return null;
}

function Routes() {
  const { loading, session, profile } = useAuth();
  const { path } = useRouter();
  const tracker = useTracker();

  if (loading) return <div className="boot"><Spinner /></div>;

  if (!session) {
    if (path === "/register") return <Register />;
    if (path === "/reset") return <Reset />;
    if (path !== "/login") return <Redirect to="/login" />;
    return <Login />;
  }
  if (path === "/reset") return <Reset />;
  if (path === "/start") return <Start />;
  if (path === "/build/chat") return <BuildChat />;
  if (path === "/build/import") return <BuildImport />;
  if (path === "/build/preview") return <BuildPreview />;

  if (!profile) return <div className="boot"><Spinner /></div>;
  if (!profile.active_roadmap_id) return <Redirect to="/start" />;
  if (tracker.loading) return <div className="boot"><Spinner label="Loading your plan" /></div>;
  if (!tracker.roadmap) return <Redirect to="/start" />;

  const Page = APP_PAGES[path];
  if (!Page) return <Redirect to="/app" />;
  if (path === "/app/settings") return <Shell><Settings /></Shell>;
  return <Shell><Page /></Shell>;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <TrackerProvider>
          <Routes />
        </TrackerProvider>
      </AuthProvider>
    </Router>
  );
}
