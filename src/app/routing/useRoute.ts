import { useCallback, useEffect, useState } from "react";

import { DEFAULT_ROUTE, formatHash, parseHash, parseHashQuery, Route } from "./routes";
import { Page } from "../shell/appShell";

/**
 * The app's one piece of navigation state, read from the URL hash.
 *
 * The hash is the single source of truth: `navigate` writes it, the
 * `hashchange` listener reads it back. That one loop is what makes the
 * browser's back and forward buttons work without any history of our own —
 * going back changes the hash, which re-renders the app.
 *
 * `initial` is used only when the URL carries no hash, so a shared link always
 * wins over the story's default.
 */
export function useRoute(initial: Route = DEFAULT_ROUTE) {
  const [route, setRoute] = useState<Route>(() => {
    if (typeof window === "undefined") return initial;
    return parseHash(window.location.hash) ?? initial;
  });

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash) ?? DEFAULT_ROUTE);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useCallback((next: Route, query?: Record<string, string | undefined>) => {
    const hash = formatHash(next, query);
    // Writing the same hash fires no event, so set the state directly rather
    // than leaving the app stuck on the previous route.
    if (window.location.hash === hash) {
      setRoute(next);
      return;
    }
    window.location.hash = hash;
  }, []);

  /**
   * The signature every page already takes (`onNavigate: (next: Page) => void`),
   * so pages need no change to take part in routing.
   */
  const navigateToPage = useCallback(
    (page: Page, query?: Record<string, string | undefined>) => navigate({ kind: "list", page }, query),
    [navigate],
  );

  /**
   * Rewrite the hash's OPTIONS without touching the place or the history.
   * `replaceState` on purpose: the Jobs list's view is a qualifier, not a
   * destination, so switching tabs must not fill the back button with steps
   * (and, because it fires no `hashchange`, it cannot loop back into here).
   */
  const replaceQuery = useCallback(
    (query: Record<string, string | undefined>) => {
      const hash = formatHash(route, query);
      if (window.location.hash === hash) return;
      window.history.replaceState(null, "", hash);
    },
    [route],
  );

  /** The options the CURRENT url carries — see `parseHashQuery`. */
  const query = typeof window === "undefined" ? new URLSearchParams() : parseHashQuery(window.location.hash);

  return { route, query, navigate, navigateToPage, replaceQuery };
}

export default useRoute;
