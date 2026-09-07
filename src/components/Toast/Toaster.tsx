import { CSSProperties, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import clsx from "clsx";

import useIsDesktop, { Breakpoint } from "../../hooks/useIsDesktop";
import Toast from "./Toast";
import { ToastEntry, getEntries, removeToast, subscribe, toast } from "./toastStore";

import styles from "./Toaster.module.scss";

// The store lives in toastStore.ts (HMR safety — see the note there); the
// public API is re-exported here so consumers keep one import.
export { toast } from "./toastStore";
export type { ToastPatch } from "./toastStore";

// Animation model copied from sonner v1.5.0 (the library production uses):
// toasts are absolutely positioned at the screen edge, offsets come from
// measured heights, and everything moves via 400ms ease transitions on
// transform/opacity/height. Collapsed by default — the toasts behind the
// front one peek out by GAP, scale down 5% per step and hide their content;
// hovering the stack expands it (and pauses the timers). Keep these in sync
// with Toaster.module.scss.
//
// Measurements (heights → offsets) are written IMPERATIVELY as CSS vars in
// one layout effect — setState during the commit phase (per-item measure
// callbacks) nested React updates past the limit and crashed with 3+ toasts.
const GAP = 14; // sonner's gap: expanded spacing AND the collapsed peek
// Collapsed cap (sonner's visibleToasts). Unlike sonner, EXPANDING shows all
// active toasts (Daniel: hiding live toasts from an inspecting user is
// confusing) — the cap only bounds the collapsed pile.
const VISIBLE_TOASTS = 3;
const EXIT_DURATION = 400;
const DEFAULT_DURATION = 4000;

// ---- Toaster ----------------------------------------------------------------

export interface ToasterProps {
  /** Desktop = TOP-right corner (Daniel, 2026-09-08); mobile = top, full width. Default "auto". */
  breakpoint?: Breakpoint;
  /** Auto-dismiss delay (ms). `processing` toasts never auto-dismiss. Default 4000. */
  duration?: number;
}

// Toaster — mount ONCE (app shell / story). Renders the toast stack per the
// docs: desktop top-right, 24px from the window edges, newest in front;
// mobile on top, 8px below the status bar, full width with 8px edge gaps.
// Collapsed sonner-style stack — hover to expand (pauses the timers).
// Auto-dismisses after `duration`; a `processing` toast stays until
// updated/dismissed. Portals to the closest [data-drawer-root] (device frame
// / app shell) or the viewport.
export default function Toaster({ breakpoint = "auto", duration = DEFAULT_DURATION }: ToasterProps) {
  const isDesktop = useIsDesktop(breakpoint);
  const list = useSyncExternalStore(subscribe, getEntries, getEntries);
  const [expanded, setExpanded] = useState(false);

  const markerRef = useRef<HTMLSpanElement>(null);
  const [root, setRoot] = useState<Element | null>(null);
  useLayoutEffect(() => {
    setRoot(markerRef.current?.closest("[data-drawer-root]") ?? document.body);
  }, []);

  // Purge closing entries once their exit transition finished. One timeout
  // per id (NOT reset on list changes — that staggered the unmounts when
  // several toasts dismissed together).
  const purgeRef = useRef(new Map<number, number>());
  useEffect(() => {
    const purges = purgeRef.current;
    list.forEach((e) => {
      if (e.closing && !purges.has(e.id)) {
        purges.set(
          e.id,
          window.setTimeout(() => {
            purges.delete(e.id);
            removeToast(e.id);
          }, EXIT_DURATION),
        );
      }
    });
    Array.from(purges.keys()).forEach((id) => {
      if (!list.some((e) => e.id === id)) {
        clearTimeout(purges.get(id));
        purges.delete(id);
      }
    });
  }, [list]);
  useEffect(() => {
    const purges = purgeRef.current;
    return () => purges.forEach(clearTimeout);
  }, []);

  // ---- auto-dismiss timers (in refs — pause/resume must not re-render) ----
  const timersRef = useRef(new Map<number, number>());
  const expandedRef = useRef(false);
  const disarm = (id: number) => {
    const timer = timersRef.current.get(id);
    if (timer != null) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  };
  const arm = (entry: ToastEntry) => {
    disarm(entry.id);
    if (entry.closing || entry.props.type === "processing") return;
    timersRef.current.set(
      entry.id,
      window.setTimeout(() => {
        timersRef.current.delete(entry.id);
        toast.dismiss(entry.id);
      }, duration),
    );
  };
  useEffect(() => {
    const timers = timersRef.current;
    list.forEach((e) => {
      const eligible = !e.closing && e.props.type !== "processing" && !expandedRef.current;
      if (eligible && !timers.has(e.id)) arm(e);
      if ((e.closing || e.props.type === "processing") && timers.has(e.id)) disarm(e.id);
    });
    Array.from(timers.keys()).forEach((id) => {
      if (!list.some((e) => e.id === id)) disarm(id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, duration]);
  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  // Hovering the stack expands it and pauses every timer (sonner) — DESKTOP
  // ONLY: touch has no hover, but iOS synthesizes mouseenter from taps (and
  // the matching mouseleave may never come), which froze the timers on the
  // phone — toasts then never auto-dismissed. The collapse runs on a GRACE
  // DELAY: dismissing the front toast makes it pointer-transparent, so the
  // stationary pointer "leaves" for a moment until the next card slides
  // underneath it — collapsing right away made the stack flicker (collapse
  // starts, then re-expands). One transition later the pointer is either on
  // the next card (cancel) or truly gone.
  const collapseTimerRef = useRef<number | null>(null);
  const onStackEnter = !isDesktop
    ? undefined
    : () => {
        if (collapseTimerRef.current != null) {
          clearTimeout(collapseTimerRef.current);
          collapseTimerRef.current = null;
        }
        expandedRef.current = true;
        setExpanded(true);
        getEntries().forEach((e) => disarm(e.id));
      };
  const onStackLeave = !isDesktop
    ? undefined
    : () => {
        if (collapseTimerRef.current != null) clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = window.setTimeout(() => {
          collapseTimerRef.current = null;
          expandedRef.current = false;
          setExpanded(false);
          getEntries().forEach((e) => arm(e));
        }, EXIT_DURATION);
      };
  // Leaving desktop (or a stuck synthetic hover): make sure the pause ends.
  useEffect(() => {
    if (isDesktop) return;
    if (collapseTimerRef.current != null) clearTimeout(collapseTimerRef.current);
    collapseTimerRef.current = null;
    expandedRef.current = false;
    setExpanded(false);
    getEntries().forEach((e) => arm(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop]);
  useEffect(
    () => () => {
      if (collapseTimerRef.current != null) clearTimeout(collapseTimerRef.current);
    },
    [],
  );

  // ---- layout ----------------------------------------------------------------
  // Indexes are pure list order (newest = 0 = front), computed in render.
  // Closing toasts keep the index they had (frozen ref) so their exit class
  // matches where they were; the survivors re-index and close the gap.
  const active = list.filter((e) => !e.closing);
  const indexes = new Map<number, number>();
  active.forEach((entry, i) => indexes.set(entry.id, active.length - 1 - i));
  const frozenRef = useRef(new Map<number, number>());
  indexes.forEach((index, entryId) => frozenRef.current.set(entryId, index));
  Array.from(frozenRef.current.keys()).forEach((entryId) => {
    if (!list.some((e) => e.id === entryId)) frozenRef.current.delete(entryId);
  });
  const indexOf = (entry: ToastEntry) => (entry.closing ? (frozenRef.current.get(entry.id) ?? 0) : (indexes.get(entry.id) ?? 0));

  // Measured natural chip heights (ref, NOT state). Heights → offsets are
  // written straight to the DOM after every render: no setState from effects.
  const itemsRef = useRef(new Map<number, HTMLDivElement>());
  const naturalRef = useRef(new Map<number, number>());
  useLayoutEffect(() => {
    const items = itemsRef.current;
    const natural = naturalRef.current;
    Array.from(natural.keys()).forEach((id) => {
      if (!list.some((e) => e.id === id)) natural.delete(id);
    });

    // Measure where the height is NOT forced (front or expanded — a fresh
    // toast is always front, so everything gets measured at least once;
    // collapsed behind-toasts keep their last known natural height).
    list.forEach((entry) => {
      const chip = items.get(entry.id)?.firstElementChild as HTMLElement | null;
      if (chip == null) return;
      const index = indexOf(entry);
      const forced = index !== 0 && !expanded;
      if (!forced || !natural.has(entry.id)) natural.set(entry.id, chip.offsetHeight);
    });

    const frontEntry = active.length > 0 ? active[active.length - 1] : null;
    const frontHeight = frontEntry != null ? (natural.get(frontEntry.id) ?? 0) : 0;

    // Expanded offsets: heights of the newer toasts + gaps.
    let offset = 0;
    for (let index = 0; index < active.length; index++) {
      const entry = active[active.length - 1 - index];
      const el = items.get(entry.id);
      if (el != null) {
        el.style.setProperty("--offset", `${offset}px`);
        const behind = index !== 0 && !expanded;
        el.style.height = behind ? `${frontHeight}px` : `${natural.get(entry.id) ?? 0}px`;
      }
      offset += (natural.get(entry.id) ?? 0) + GAP;
    }
    // Closing toasts keep their frozen --offset/height untouched.
  });

  const stack = (
    <div
      className={clsx(styles.stack, isDesktop ? styles.desktop : styles.mobile, root === document.body && styles.fixed)}
      role="region"
      aria-label="Notifications"
      onMouseEnter={onStackEnter}
      onMouseLeave={onStackLeave}
    >
      {list.map((entry) => {
        const index = indexOf(entry);
        const front = index === 0;
        const behind = !front && !expanded && !entry.closing;
        const closingKind = entry.closing ? (front ? styles.closingFront : expanded ? styles.closingSpread : styles.closingBehind) : null;
        return (
          <div
            key={entry.id}
            ref={(el) => {
              // The enter is a CSS keyframe animation — it starts on DOM
              // insertion by itself; no class flip, nothing to race.
              if (el != null) itemsRef.current.set(entry.id, el);
              else itemsRef.current.delete(entry.id);
            }}
            style={{ zIndex: list.length - index, "--peek": `${index * GAP}px`, "--scale": String(1 - index * 0.05) } as CSSProperties}
            className={clsx(
              styles.item,
              behind && styles.behind,
              entry.closing && styles.closing,
              closingKind,
              index >= VISIBLE_TOASTS && !expanded && styles.hidden,
            )}
          >
            <Toast
              {...entry.props}
              onDismiss={() => {
                entry.props.onDismiss?.();
                toast.dismiss(entry.id);
              }}
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <span ref={markerRef} hidden />
      {root != null && createPortal(stack, root)}
    </>
  );
}
