import { createContext, useContext, useEffect, useState, type ReactNode, type MouseEvent } from "react";

/** A tiny History-API router: enough for this app, used by the web app. */
interface RouterState { path: string; go(to: string, replace?: boolean): void }
const Ctx = createContext<RouterState>({ path: "/", go: () => {} });

export function Router({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(window.location.pathname || "/");
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const go = (to: string, replace = false) => {
    if (to === window.location.pathname) return;
    if (replace) window.history.replaceState(null, "", to);
    else window.history.pushState(null, "", to);
    setPath(to);
    window.scrollTo(0, 0);
  };
  return <Ctx.Provider value={{ path, go }}>{children}</Ctx.Provider>;
}

export const useRouter = () => useContext(Ctx);

export function Link({ to, children, className, ...rest }: { to: string; children: ReactNode; className?: string; "aria-current"?: "page" }) {
  const { go } = useRouter();
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go(to);
  };
  return <a href={to} onClick={onClick} className={className} {...rest}>{children}</a>;
}
