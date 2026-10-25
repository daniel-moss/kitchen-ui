import { createContext, useContext } from "react";

// The overlay's own "try to close" — the same path its close ×, scrim and
// Escape take. Dialog and SelectList provide it, so a Cancel button inside a
// consumer's footer can ask for the "Discard changes?" Prompt instead of
// closing straight away (Daniel, 2026-10-25 — the Labels list's Cancel asks
// like its × does). Null outside an overlay.
export const DismissContext = createContext<(() => void) | null>(null);

/** The enclosing overlay's dismiss attempt, or null outside one. */
export function useDismiss() {
  return useContext(DismissContext);
}
