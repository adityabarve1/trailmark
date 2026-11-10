import type { ReactNode } from "react";
import { Link, useRouter } from "../lib/router";
import { useTracker } from "../lib/tracker";
import { useAuth } from "../lib/auth";
import { Logo } from "./Logo";

const NAV = [
  { to: "/app", label: "Today", icon: "M4 12h16M12 4v16" },
  { to: "/app/progress", label: "Progress", icon: "M5 19V11M12 19V5M19 19v-6" },
  { to: "/app/syllabus", label: "Syllabus", icon: "M6 4h12v16H6zM9 8h6M9 12h6M9 16h4" },
  { to: "/app/practice", label: "Practice", icon: "M8 6l-5 6 5 6M16 6l5 6-5 6" },
  { to: "/app/review", label: "Review", icon: "M4 6h16M4 12h10M4 18h6" },
  { to: "/app/projects", label: "Projects", icon: "M4 7h16v12H4zM9 7V4h6v3" },
  { to: "/app/settings", label: "Settings", icon: "M12 9a3 3 0 100 6 3 3 0 000-6zM4 12h2M18 12h2M12 4v2M12 18v2" },
];

export function Shell({ children }: { children: ReactNode }) {
  const { path } = useRouter();
  const { save, roadmap } = useTracker();
  const { profile } = useAuth();
  const status = save.kind === "saving" ? "Saving…" : save.kind === "saved" ? "Saved" : save.kind === "error" ? `Not saved: ${save.message}` : "";
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to="/app" className="brand"><Logo /><span>Trailmark</span></Link>
        <nav aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="nav-item" aria-current={path === n.to ? "page" : undefined}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d={n.icon} /></svg>{n.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <p className="who">{profile?.display_name ?? ""}</p>
          <p className="muted small">{roadmap?.title}</p>
        </div>
      </aside>
      <main className="main">
        <p className={`save-status ${save.kind}`} role="status" aria-live="polite">{status}</p>
        {children}
      </main>
      <nav className="tabbar" aria-label="Main">
        {NAV.filter((n) => n.label !== "Review").map((n) => (
          <Link key={n.to} to={n.to} className="tab-item" aria-current={path === n.to ? "page" : undefined}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={n.icon} /></svg><span>{n.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
