import { CSSProperties, MouseEvent, useRef, useState } from "react";
import { createPortal } from "react-dom";

import clsx from "clsx";

import Tooltip from "./Tooltip";
import styles from "./TruncatingText.module.scss";

interface TruncatingTextProps {
  /** The full text. Shown truncated; the tooltip reveals it in full. */
  text: string;
  /** Max lines before the ellipsis. Default 1 (single line); 2/3 clamp. */
  lines?: 1 | 2 | 3;
  /** Class applied to the text (font + color). */
  className?: string;
}

// Text with an ellipsis after `lines` lines (default one). When it actually
// overflows, hovering shows a Tooltip with the full text — placed on top,
// left-aligned, and following the cursor's horizontal position. The tooltip
// renders in a body-level portal so it is never clipped by an ancestor that
// scrolls or hides overflow (e.g. StepItemGroup's horizontally scrolling stack).
export default function TruncatingText({ text, lines = 1, className }: TruncatingTextProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const track = (clientX: number) => {
    const el = textRef.current;
    if (el) setPos({ x: clientX, y: el.getBoundingClientRect().top });
  };

  const handleEnter = (e: MouseEvent) => {
    const el = textRef.current;
    // Single-line overflows horizontally; a multi-line clamp vertically.
    if (el && (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight)) {
      track(e.clientX);
      setOpen(true);
    }
  };

  const handleMove = (e: MouseEvent) => {
    if (open) track(e.clientX);
  };

  const clampStyle: CSSProperties | undefined = lines > 1 ? { WebkitLineClamp: lines } : undefined;

  return (
    <span className={styles.wrap}>
      <span
        ref={textRef}
        className={clsx(lines > 1 ? styles.clamp : styles.text, className)}
        style={clampStyle}
        onMouseEnter={handleEnter}
        onMouseMove={handleMove}
        onMouseLeave={() => setOpen(false)}
      >
        {text}
      </span>

      {open &&
        createPortal(
          <span className={styles.overlay} style={{ left: pos.x, top: pos.y }}>
            <Tooltip placement="top" align="center" textAlign="left" text={text} />
          </span>,
          document.body,
        )}
    </span>
  );
}
