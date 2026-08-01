import { useEffect, useState } from "react";

export type Breakpoint = "auto" | "desktop" | "mobile";

const DESKTOP_QUERY = "(min-width: 64rem)"; // 1024px — --breakpoint-desktop-up

// Which presentation to use: true = desktop, false = mobile. "auto" (default)
// tracks the viewport; "desktop" / "mobile" force one (Storybook, tests).
// Shared by Dialog, Prompt, and Menu.
export default function useIsDesktop(breakpoint: Breakpoint = "auto") {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (breakpoint !== "auto") return breakpoint === "desktop";
    return typeof window === "undefined" ? true : window.matchMedia(DESKTOP_QUERY).matches;
  });

  useEffect(() => {
    if (breakpoint !== "auto") {
      setIsDesktop(breakpoint === "desktop");
      return;
    }
    const mq = window.matchMedia(DESKTOP_QUERY);
    const handler = () => setIsDesktop(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);

  return isDesktop;
}
