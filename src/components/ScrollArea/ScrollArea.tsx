import { HTMLAttributes, ReactNode, forwardRef, useImperativeHandle, useRef } from "react";

import clsx from "clsx";

import useOverlayScrollbar from "../../hooks/useOverlayScrollbar";

import styles from "./ScrollArea.module.scss";

// ScrollArea — the app's vertical scroll container (Daniel: EVERY scrolling
// container behaves like this). The native scrollbar is hidden because it
// pushes/shrinks the content when it appears; a 6px thumb is drawn ON TOP of
// the content instead (visible only while the content overflows, draggable).
//
// Structure: a relative wrapper (participates in the parent layout — size it
// via `wrapperClassName`) around the scrolling element (`className`; the
// forwarded ref points here) with the thumb overlaid.
export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  /** Class for the SCROLLING element (padding, gap, display…). */
  className?: string;
  /** Class for the outer wrapper (flex sizing in the parent layout). */
  wrapperClassName?: string;
  /**
   * Freeze the overlay thumb's measuring while true. The thumb's ResizeObserver
   * fires setState on every size change; during a per-frame resize (a drawer
   * lifting for the keyboard) that is 60 re-renders/sec — a visible reload. The
   * drawer suspends it for the duration of the keyboard animation.
   */
  suspendScrollbar?: boolean;
  children?: ReactNode;
}

const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  { className, wrapperClassName, suspendScrollbar = false, children, ...rest },
  ref,
) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => scrollRef.current as HTMLDivElement);
  const { thumb, dragging, onThumbPointerDown } = useOverlayScrollbar(scrollRef, !suspendScrollbar);

  return (
    <div className={clsx(styles.wrap, wrapperClassName)}>
      <div ref={scrollRef} className={clsx(styles.scroller, className)} {...rest}>
        {children}
      </div>
      {thumb != null && (
        <div
          className={clsx(styles.thumb, dragging && styles.thumbDragging)}
          style={{ top: thumb.top, height: thumb.height }}
          onPointerDown={onThumbPointerDown}
          aria-hidden="true"
        />
      )}
    </div>
  );
});

export default ScrollArea;
