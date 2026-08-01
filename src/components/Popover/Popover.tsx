import { PointerEvent as ReactPointerEvent, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

import useMountTransition from "../../hooks/useMountTransition";
import ScrollArea from "../ScrollArea/ScrollArea";
import { isRowDragActive } from "../../utils/dragLock";
import { DrawerRootContext } from "./DrawerRootContext";

import styles from "./Popover.module.scss";
import { PopoverProps } from "./Popover.types";

// Enter/exit duration. Keep in sync with the transitions in Popover.module.scss.
const DURATION = 160;

// How far the drawer sheet travels while fading in/out. A short shift instead
// of a full slide-off: iOS never paints below the page's bottom edge (except
// mid-gesture), so a sheet sliding all the way down visibly CLIPS at that
// line — with the fade+shift it dissolves in place and never crosses it.
const SHEET_SHIFT = 32;

// A container that floats above the page and holds any content. It only defines
// the surface style + sticky header/footer layout; the content is yours.
//
// Desktop = a floating rounded card (fades/scales in). Mobile = a bottom-sheet
// drawer over a scrim (slides up), dismissed by tapping the scrim, swiping the
// sheet down, or (with a bodyOnly DrawerHeader) its close button.
// See Kitchen UI/components/popover.md.
export default function Popover({
  children,
  header,
  footer,
  drawer = false,
  open = true,
  onClose,
  dismissible = true,
  className,
  style,
}: PopoverProps) {
  const { mounted, visible, setVisible } = useMountTransition(open, DURATION);

  if (!mounted) return null;

  if (!drawer) {
    return (
      <div
        className={clsx(styles.popover, styles.card, visible && styles.cardOpen, className)}
        style={style}
      >
        {header && <div className={styles.header}>{header}</div>}
        <ScrollArea wrapperClassName={styles.body} className={styles.bodyScroll}>
          {children}
        </ScrollArea>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    );
  }

  return (
    <Drawer
      visible={visible}
      setVisible={setVisible}
      header={header}
      footer={footer}
      onClose={onClose}
      dismissible={dismissible}
      className={className}
      style={style}
    >
      {children}
    </Drawer>
  );
}

type DrawerProps = Pick<
  PopoverProps,
  "children" | "header" | "footer" | "onClose" | "dismissible" | "className" | "style"
> & {
  visible: boolean;
  setVisible: (v: boolean) => void;
};

// The mobile bottom-sheet: scrim + a draggable sheet. Split out so the gesture
// and transition state only run for the drawer presentation.
function Drawer({
  children,
  header,
  footer,
  onClose,
  dismissible = true,
  className,
  style,
  visible,
  setVisible,
}: DrawerProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  // True while the keyboard-lift rAF loop is running (below). The body resizes
  // every frame then, so the overlay scrollbar's ResizeObserver is suspended to
  // avoid 60 re-renders/sec (a visible "reload" of the drawer).
  const [kbAnimating, setKbAnimating] = useState(false);

  // The scrim must fill the app/device frame. Rendering it inline breaks the
  // moment ANY positioned ancestor sits between (a ScrollArea, a relative
  // wrapper in content) — the scrim would fill that box instead. So it
  // portals to a drawer root: the DrawerRootContext element when provided
  // (SYNCHRONOUSLY, so the portal renders on the first pass — required for the
  // in-tap focus that opens the iOS keyboard), else the closest
  // [data-drawer-root], else the viewport.
  const ctxRoot = useContext(DrawerRootContext);
  const markerRef = useRef<HTMLSpanElement>(null);
  const [drawerRoot, setDrawerRoot] = useState<Element | null>(ctxRoot);
  useLayoutEffect(() => {
    if (ctxRoot != null) {
      setDrawerRoot((prev) => (prev === ctxRoot ? prev : ctxRoot));
      return;
    }
    setDrawerRoot(markerRef.current?.closest("[data-drawer-root]") ?? document.body);
  }, [ctxRoot]);

  // Keyboard handling. The sheet must sit above the keyboard, but the band
  // between its footer and the keyboard must be the sheet's OWN OPAQUE surface —
  // NOT the scrim. The scrim is only ~5% black, so the page shows THROUGH it: any
  // gap left as bare scrim flashes the page while the keyboard rises (verified
  // frame by frame). So keep the sheet anchored to the screen bottom (bottom: 0)
  // — its opaque background then fills all the way down, behind the keyboard — and
  // push the FOOTER up to the keyboard top with padding-bottom = keyboard height.
  // The padding is inside the sheet, painted with its surface colour, so it
  // covers the band no matter where the rising keyboard currently is.
  //
  // lift = scrim height − (offsetTop + vv.height) = gap from the sheet's bottom up
  // to the keyboard top. MEASURE the scrim's offsetHeight — NOT window.innerHeight:
  // on standalone iOS innerHeight shrinks with the keyboard (innerHeight − vv.height
  // ≈ 0), so the lift never fired and the footer stayed behind the keyboard. The
  // scrim's offsetHeight is the sheet's real containing block, correct in every
  // mode. Cap max-height to the visible height (minus offsetTop + top inset) so the
  // header stays on screen when iOS scrolls the visual viewport (offsetTop > 0).
  // Snap (no CSS transition — a transition re-targets on every event and BOUNCES).
  // Imperative (no React render lag). Body-portaled (fixed) scrim only.
  useEffect(() => {
    const vv = window.visualViewport;
    if (vv == null || drawerRoot !== document.body) return undefined;
    // visualViewport EVENTS only fire at the start/end of the keyboard slide, and
    // iOS's keyboard even OVERSHOOTS and settles — so a CSS transition on the
    // footer follows a different curve than the keyboard and the gap between them
    // wobbles (looks glitchy). Instead read vv.height LIVE every animation frame
    // (rAF) and SNAP the footer to it: the footer is then glued to the keyboard's
    // actual position each frame, matching whatever iOS does. The loop runs while
    // the value keeps changing and stops once it holds still for a few frames.
    let rafId = 0;
    let stableFrames = 0;
    let prevLift = Number.NaN;
    const apply = () => {
      const sheet = sheetRef.current;
      const scrimEl = scrimRef.current;
      if (sheet == null || scrimEl == null) return Number.NaN;
      const offsetTop = Math.round(vv.offsetTop);
      const lift = Math.round(scrimEl.offsetHeight - vv.offsetTop - vv.height);
      if (lift > 80) {
        sheet.style.paddingBottom = `${lift}px`;
        sheet.style.maxHeight = `calc(100% - ${offsetTop}px - var(--popover-drawer-top-inset, env(safe-area-inset-top, 0px)))`;
      } else {
        sheet.style.paddingBottom = "";
        sheet.style.maxHeight = "";
      }
      return lift;
    };
    const loop = () => {
      const lift = apply();
      if (lift === prevLift) stableFrames += 1;
      else {
        stableFrames = 0;
        prevLift = lift;
      }
      // ~6 still frames (100ms) means the keyboard settled — stop the loop.
      if (stableFrames < 6) {
        rafId = requestAnimationFrame(loop);
      } else {
        rafId = 0;
        setKbAnimating(false);
      }
    };
    const startLoop = () => {
      stableFrames = 0;
      prevLift = Number.NaN;
      setKbAnimating(true);
      if (rafId === 0) rafId = requestAnimationFrame(loop);
    };
    vv.addEventListener("resize", startLoop);
    vv.addEventListener("scroll", startLoop);
    apply();
    return () => {
      vv.removeEventListener("resize", startLoop);
      vv.removeEventListener("scroll", startLoop);
      if (rafId !== 0) cancelAnimationFrame(rafId);
    };
  }, [drawerRoot]);

  // Gesture math lives in refs (synchronous); dragY state drives the transform.
  const armed = useRef(false); // a drag may begin (body was at the top)
  const draggingRef = useRef(false); // a drag is actually underway
  const startY = useRef(0);
  const dragYRef = useRef(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // React events bubble through the React TREE, not the DOM — a drawer opened
    // from inside another drawer (e.g. a SelectList/DatePicker over this form) is
    // a React descendant, so WITHOUT this its swipe would also fire the parent
    // sheet's handlers and dismiss it too. Stop the gesture at this sheet.
    e.stopPropagation();
    if (!dismissible) return; // no swipe-to-dismiss (e.g. a Prompt)
    // A drag that STARTS inside the scrolling body may only dismiss when the
    // body is at the top (so the list scrolls first, then hands off). A drag
    // from the header/handle (outside the body) always arms — you can pull the
    // sheet down by its handle even when the list is scrolled down.
    const inBody = bodyRef.current?.contains(e.target as Node) ?? false;
    armed.current = !inBody || (bodyRef.current?.scrollTop ?? 0) <= 0;
    startY.current = e.clientY;
    dragYRef.current = 0;
  };

  // Touch: when the body sits at its top and the finger pulls DOWN, the
  // gesture belongs to the sheet — without this, native scrolling hijacks it
  // after a few pixels (pointercancel) and the sheet snaps back. Must be a
  // real non-passive touchmove listener; pointer events can't stop a scroll.
  useEffect(() => {
    const el = bodyRef.current;
    if (el == null || !dismissible) return;
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      const dy = (e.touches[0]?.clientY ?? 0) - touchStartY;
      if (draggingRef.current || (el.scrollTop <= 0 && dy > 0)) e.preventDefault();
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [dismissible]);

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    // A long-press row drag (ItemGroup) starts AFTER pointerdown already
    // armed the sheet — the sheet must not dismiss-drag along with the row.
    if (!armed.current || e.buttons === 0 || isRowDragActive()) return;
    const dy = e.clientY - startY.current;
    if (!draggingRef.current) {
      if (dy > 4) {
        draggingRef.current = true;
        setIsDragging(true);
        sheetRef.current?.setPointerCapture(e.pointerId);
      } else {
        return;
      }
    }
    const clamped = Math.max(0, dy); // no upward pull past the open position
    dragYRef.current = clamped;
    setDragY(clamped);
  };

  const endDrag = () => {
    // Always disarm: a plain tap (down + up, no drag) must not leave the sheet
    // armed — stray pointermoves from a LATER gesture (e.g. dragging a list
    // row, whose pointerdown never reaches the sheet) would start a sheet
    // drag out of nowhere.
    armed.current = false;
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    setDragY(0);

    const height = sheetRef.current?.offsetHeight ?? 0;
    const threshold = Math.min(height * 0.25, 160);
    if (dragYRef.current > threshold) {
      // dragYRef keeps the release position: the exit continues from there
      setVisible(false);
      onClose?.();
    } else {
      dragYRef.current = 0; // spring back — a later close starts from rest
    }
  };

  // Tap on the scrim itself (not the sheet) calls onClose. Whether that actually
  // closes is up to the caller (a Prompt passes no onClose; a confirm dialog
  // routes it to a warning Prompt). `dismissible` only gates the swipe gesture.
  const onScrimClick = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  // Fade + short shift, both directions: enter rises SHEET_SHIFT px while
  // fading in; exit sinks the same distance while fading out. A swipe-release
  // dismiss continues sinking from the finger's position (dragYRef).
  const transform = isDragging
    ? `translateY(${dragY}px)`
    : visible
      ? "translateY(0)"
      : `translateY(${dragYRef.current + SHEET_SHIFT}px)`;

  // Enter: fast in, decelerate into place. Exit: start slow, accelerate away
  // (same curve as the scrim, so the whole scene moves together). The keyboard
  // lift (footer padding-bottom) is NOT transitioned here — the rAF loop above
  // snaps it to the keyboard's live position every frame, so it needs no CSS
  // curve (a fixed curve can't match iOS's own overshoot-and-settle).
  const transition = isDragging
    ? "none"
    : visible
      ? `transform ${DURATION}ms cubic-bezier(0.32, 0.72, 0, 1), opacity ${DURATION}ms ease-out`
      : `transform ${DURATION}ms cubic-bezier(0.5, 0, 0.85, 0.3), opacity ${DURATION}ms cubic-bezier(0.5, 0, 0.85, 0.3)`;

  const scrim = (
    <div
      ref={scrimRef}
      className={clsx(
        styles.scrim,
        drawerRoot === document.body && styles.scrimFixed,
        visible && styles.scrimOpen,
      )}
      onClick={onScrimClick}
      // A pointerdown on THIS drawer's scrim (not the sheet) would otherwise
      // bubble through the React tree to a parent drawer's sheet and arm its
      // dismiss-drag — keep the whole gesture within this drawer.
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        ref={sheetRef}
        className={clsx(styles.popover, styles.drawer, className)}
        style={{
          ...style,
          transform,
          opacity: isDragging || visible ? 1 : 0,
          transition,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {header && <div className={styles.header}>{header}</div>}
        {/* With a footer, the home-indicator safe area is a surface strip
            below it (the footer must stay above the indicator). Without one,
            the safe area is PADDING inside the scrolling body instead — so
            scrolled content passes behind the indicator zone, still visible. */}
        <ScrollArea
          ref={bodyRef}
          wrapperClassName={styles.body}
          className={clsx(styles.bodyScroll, footer == null && styles.safeBottom)}
          suspendScrollbar={kbAnimating}
        >
          {children}
        </ScrollArea>
        {footer && <div className={styles.footer}>{footer}</div>}
        {footer != null && <div className={styles.homeIndicator} aria-hidden />}
      </div>
    </div>
  );

  return (
    <>
      <span ref={markerRef} hidden />
      {drawerRoot != null && createPortal(scrim, drawerRoot)}
    </>
  );
}
