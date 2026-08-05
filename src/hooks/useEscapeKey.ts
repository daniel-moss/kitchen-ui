import { useEffect, useRef } from "react";

// Call `onEscape` when Escape is pressed while `active`. Listens on the
// document, so it works no matter where focus is. Used by the dismissible
// overlays (Dialog, Menu, SelectList) — NOT by Prompt, which can only be
// answered.
//
// Only the TOPMOST overlay reacts (Daniel, 2026-08-03): with a list open over a
// form dialog, one Escape closed both, because every hook instance had its own
// document listener. So the handlers live in one shared, mount-ordered map and
// a single listener calls the last one that mounted. The id comes from a ref,
// so a re-render (an inline `onEscape` changes identity every render) keeps the
// overlay's place in the order.
let nextId = 0;
const handlers = new Map<number, () => void>();

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key !== "Escape" || handlers.size === 0) return;
  const topId = Math.max(...handlers.keys());
  e.stopPropagation();
  handlers.get(topId)?.();
};

export default function useEscapeKey(active: boolean, onEscape?: () => void) {
  const idRef = useRef(-1);
  if (idRef.current < 0) idRef.current = ++nextId;

  useEffect(() => {
    if (!active || !onEscape) return undefined;
    const id = idRef.current;
    if (handlers.size === 0) document.addEventListener("keydown", onKeyDown);
    handlers.set(id, onEscape);
    return () => {
      handlers.delete(id);
      if (handlers.size === 0) document.removeEventListener("keydown", onKeyDown);
    };
  }, [active, onEscape]);
}
