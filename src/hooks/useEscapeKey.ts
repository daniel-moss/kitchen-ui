import { useEffect } from "react";

// Call `onEscape` when Escape is pressed while `active`. Listens on the
// document, so it works no matter where focus is. Used by the dismissible
// overlays (Dialog, Menu, SelectList) — NOT by Prompt, which can only be
// answered.
export default function useEscapeKey(active: boolean, onEscape?: () => void) {
  useEffect(() => {
    if (!active || !onEscape) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onEscape();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [active, onEscape]);
}
