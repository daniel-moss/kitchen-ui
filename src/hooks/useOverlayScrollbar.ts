import { RefObject, useEffect, useState } from "react";

export interface OverlayThumb {
  top: number;
  height: number;
}

// The shared overlay-scrollbar logic (used by ScrollArea): the native
// scrollbar is hidden — it would eat ~15px of content width and shrink the
// rows the moment content overflows. Instead a thumb is drawn ON TOP of the
// content and this hook computes its size/position from the scroll element.
// Returns null while the content fits (no thumb).
export default function useOverlayScrollbar(scrollRef: RefObject<HTMLDivElement | null>, enabled = true) {
  const [thumb, setThumb] = useState<OverlayThumb | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setThumb(null);
      return undefined;
    }
    const el = scrollRef.current;
    if (el == null) return undefined;

    const update = () => {
      const { scrollHeight, clientHeight, scrollTop } = el;
      if (scrollHeight <= clientHeight + 1) {
        setThumb(null);
        return;
      }
      const height = Math.max(24, (clientHeight / scrollHeight) * clientHeight);
      const top = (scrollTop / (scrollHeight - clientHeight)) * (clientHeight - height);
      setThumb({ top, height });
    };

    update();
    el.addEventListener("scroll", update, { passive: true });

    // The element box AND its direct children (lists filter, stacks expand)
    // drive scrollHeight; children can also be added/removed later.
    const ro = new ResizeObserver(update);
    const observeChildren = () => {
      ro.disconnect();
      ro.observe(el);
      Array.from(el.children).forEach((child) => ro.observe(child));
    };
    observeChildren();
    const mo = new MutationObserver(() => {
      observeChildren();
      update();
    });
    mo.observe(el, { childList: true });

    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
      mo.disconnect();
    };
  }, [scrollRef, enabled]);

  const onThumbPointerDown = (e: React.PointerEvent) => {
    const el = scrollRef.current;
    if (el == null || thumb == null) return;
    e.preventDefault();
    const startY = e.clientY;
    const startScroll = el.scrollTop;
    const track = el.clientHeight - thumb.height;
    const range = el.scrollHeight - el.clientHeight;
    setDragging(true);
    const move = (ev: PointerEvent) => {
      el.scrollTop = startScroll + ((ev.clientY - startY) / track) * range;
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return { thumb, dragging, onThumbPointerDown };
}
