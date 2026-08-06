import { CSSProperties, MouseEvent, useContext, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

import useMountTransition from "../../hooks/useMountTransition";
import useIsDesktop from "../../hooks/useIsDesktop";
import useEscapeKey from "../../hooks/useEscapeKey";
import useRestoreFocus from "../../hooks/useRestoreFocus";
import useFocusTrap from "../../hooks/useFocusTrap";
import Popover from "../Popover/Popover";
import { DrawerRootContext } from "../Popover/DrawerRootContext";
import PopoverHeader from "../Popover/PopoverHeader";
import PopoverHeaderContent from "../Popover/PopoverHeaderContent";
import PopoverHeaderText from "../Popover/PopoverHeaderText";
import EmptyState from "../EmptyState/EmptyState";

import styles from "./SidePanel.module.scss";
import { SidePanelProps, SidePanelState } from "./SidePanel.types";

// Enter/exit duration; keep in sync with the transitions in SidePanel.module.scss.
const DURATION = 240;

// The desktop panel width — fixed (Figma: the panel never resizes).
const PANEL_WIDTH = 400;

// Enter: fast out of the edge, decelerate into place. Exit: start slow,
// accelerate away — the same pair the drawer uses, so the scrim and the panel
// move together.

// The error / offline body states (EmptyState content). Same copy as Dialog's.
const STATE_CONTENT: Record<Exclude<SidePanelState, "content">, {
  icon: string;
  title: string;
  caption: string;
  actionLabel: string;
}> = {
  error: {
    icon: "circle-xmark",
    title: "Hmm, something went wrong",
    caption: "An error occurred while fetching data",
    actionLabel: "Reload",
  },
  offline: {
    icon: "wifi-slash",
    title: "You're offline",
    caption: "Content will load once reconnected.",
    actionLabel: "Try again",
  },
};

// SidePanel — the data-preview overlay. Desktop: a fixed 400px panel that
// slides in from the right edge over a scrim, with a 12px margin all around and
// the full screen height. Mobile: the same panel filling the whole screen (no
// scrim, no margin, no radius — the focus Dialog pattern).
//
// It is built on Popover, so the header and the navigation stay pinned on top,
// the footer stays pinned at the bottom, and only the body scrolls. Opening
// another object from inside a panel does NOT stack a second panel: the
// consumer swaps the content and passes `onBack` (see the prop docs).
// See Figma "SidePanel".
export default function SidePanel({
  open,
  onClose,
  title,
  caption,
  titleVariant,
  titleClassName,
  titleLeftSlot,
  titleRightSlot,
  captionLeftSlot,
  captionRightSlot,
  avatar,
  headerActions,
  close = true,
  headerDivider = true,
  onBack,
  nav,
  footer,
  children,
  bodyPadded = true,
  state = "content",
  onRetry,
  breakpoint = "auto",
  className,
}: SidePanelProps) {
  const isDesktop = useIsDesktop(breakpoint);
  const layerRef = useRef<HTMLDivElement>(null);

  // Where the panel renders. Normally <body> (it must cover the whole screen),
  // but inside a mock container — a Storybook device frame, a docs preview box —
  // it renders in that container instead, so the panel stays within the mock.
  // Same resolution as the Popover drawer: the DrawerRootContext value if there
  // is one, else the closest [data-drawer-root], else <body>.
  const ctxRoot = useContext(DrawerRootContext);
  const markerRef = useRef<HTMLSpanElement>(null);
  const [root, setRoot] = useState<Element | null>(ctxRoot);
  useLayoutEffect(() => {
    if (ctxRoot != null) {
      setRoot((prev) => (prev === ctxRoot ? prev : ctxRoot));
      return;
    }
    setRoot(markerRef.current?.closest("[data-drawer-root]") ?? document.body);
  }, [ctxRoot]);

  // The enter transition waits for that root. The panel only PAINTS once it is
  // portaled, so a panel that mounts already open (the consumer renders it the
  // moment it is needed) would otherwise run both of the hook's frames before
  // anything painted: the closed state is never shown, and the panel appears at
  // rest and just fades in — the glitch Daniel reported (2026-08-06). Mounting
  // still follows `open` alone, so the marker below can resolve the root.
  const { mounted, visible } = useMountTransition(open && root != null, DURATION);

  // Overlay a11y — Escape dismisses, focus is trapped inside the panel and
  // returns to the trigger on close.
  useEscapeKey(open, onClose);
  useRestoreFocus(open, layerRef);
  useFocusTrap(layerRef, open);

  // Closed: only the marker stays, so the root is known BEFORE the next open.
  if (!mounted) return <span ref={markerRef} hidden />;

  const isStateView = state !== "content";

  const header = (
    <>
      <PopoverHeader
        back={onBack != null}
        onBack={onBack}
        close={close}
        onClose={onClose}
        divider={headerDivider}
      >
        <PopoverHeaderContent avatar={avatar} actions={headerActions}>
          <PopoverHeaderText
            variant={titleVariant ?? (caption != null ? "titleCaption" : "title")}
            title={title}
            titleClassName={titleClassName}
            caption={caption}
            titleLeftSlot={titleLeftSlot}
            titleRightSlot={titleRightSlot}
            captionLeftSlot={captionLeftSlot}
            captionRightSlot={captionRightSlot}
          />
        </PopoverHeaderContent>
      </PopoverHeader>
      {/* The navigation is chrome, not content: it sits in the pinned header
          region so it stays put while the body scrolls. */}
      {!isStateView && nav}
    </>
  );

  // error / offline → an EmptyState in place of the body (the navigation and
  // the footer go with it — the object itself failed to load).
  const body = isStateView ? (
    <div className={styles.stateView}>
      <EmptyState
        error
        icon={STATE_CONTENT[state].icon}
        title={STATE_CONTENT[state].title}
        caption={STATE_CONTENT[state].caption}
        primaryAction={{ label: STATE_CONTENT[state].actionLabel, leftIcon: "arrows-rotate", onClick: onRetry }}
      />
    </div>
  ) : bodyPadded ? (
    <div className={styles.body}>{children}</div>
  ) : (
    children
  );

  // The slide distance — the panel's own width plus the layer's 12px margin, so
  // it starts fully outside the right edge. Only the DISTANCE is inline (as a
  // custom property); the transform and its transition live in the stylesheet
  // (.panel / .panelOpen). Driving them from inline styles wobbled: React
  // commits the transform and the transition string together, and the browser
  // could pick the animation up mid-flight and play it from the wrong place —
  // the panel visibly swung ~200px past its resting spot and back (Daniel's
  // recording, 2026-08-06).
  const offscreen = isDesktop ? `${PANEL_WIDTH + 12}px` : "100%";
  const panelStyle: CSSProperties & { "--side-panel-offscreen": string } = {
    "--side-panel-offscreen": offscreen,
    background: "var(--surface-level-first)",
    width: isDesktop ? PANEL_WIDTH : "100%",
    height: "100%",
    maxHeight: "none",
    opacity: 1,
    ...(isDesktop
      ? null
      : {
          borderRadius: 0,
          // Full-screen on mobile, so the panel owns the safe areas: an explicit
          // override first, then the mock device frame's vars (Storybook), then
          // the real device's env().
          paddingTop: "var(--side-panel-safe-top, var(--phone-safe-top, env(safe-area-inset-top, 0px)))",
          paddingBottom: "var(--side-panel-safe-bottom, var(--phone-safe-bottom, env(safe-area-inset-bottom, 0px)))",
        }),
  };

  const onScrimClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const layer = (
    <div
      ref={layerRef}
      className={clsx(
        styles.layer,
        root === document.body && styles.layerFixed,
        isDesktop ? styles.scrim : styles.fullScreen,
        visible && styles.layerOpen,
        className,
      )}
      onClick={isDesktop ? onScrimClick : undefined}
    >
      <Popover
        header={header}
        footer={isStateView ? undefined : footer}
        className={clsx(styles.panel, visible && styles.panelOpen)}
        style={panelStyle}
      >
        {body}
      </Popover>
    </div>
  );

  // Any drawer opened from INSIDE the panel (a SelectList search, a DatePicker)
  // portals to the SAME root — synchronously, which is what lets its focus open
  // the iOS keyboard inside the tap.
  return (
    <DrawerRootContext.Provider value={root}>
      <span ref={markerRef} hidden />
      {root != null && createPortal(layer, root)}
    </DrawerRootContext.Provider>
  );
}
