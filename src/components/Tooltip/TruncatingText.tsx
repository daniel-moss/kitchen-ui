import { CSSProperties, ReactNode, useRef } from "react";

import clsx from "clsx";

import styles from "./TruncatingText.module.scss";
import useAnchoredTooltip, { isTextClipped } from "./useAnchoredTooltip";

interface TruncatingTextBaseProps {
  /** Max lines before the ellipsis. Default 1 (single line); 2/3 clamp. */
  lines?: 1 | 2 | 3;
  /** Class applied to the text (font + color). */
  className?: string;
}

/**
 * Either plain `text`, or `children` (rich content — e.g. a line with
 * differently colored parts) plus the `tooltipText` the tooltip should show,
 * since rich content has no readable text of its own.
 */
export type TruncatingTextProps = TruncatingTextBaseProps &
  (
    | { text: string; children?: never; tooltipText?: never }
    | { children: ReactNode; tooltipText: string; text?: never }
  );

// Text with an ellipsis after `lines` lines (default one). When it actually
// overflows, hovering shows a Tooltip with the full text — placed on top,
// left-aligned, and CENTERED ON THE TEXT BOX (not on the cursor: production's
// Radix tooltip can only be positioned from its trigger's box, so a
// cursor-following tooltip is not buildable there — Daniel, 2026-10-04).
// Placement comes from the shared `useAnchoredTooltip`, which portals the
// tooltip to <body> so it is never clipped by an ancestor that scrolls or
// hides overflow (e.g. StepItemGroup's horizontally scrolling stack).
export default function TruncatingText({ text, children, tooltipText, lines = 1, className }: TruncatingTextProps) {
  const full = tooltipText ?? text ?? "";
  const textRef = useRef<HTMLSpanElement>(null);
  const tip = useAnchoredTooltip({ text: full, textAlign: "left" });

  // Single-line overflows horizontally, a multi-line clamp vertically —
  // `isTextClipped` tests both.
  const handleEnter = () => {
    if (isTextClipped(textRef.current)) tip.show(textRef.current);
  };

  const clampStyle: CSSProperties | undefined = lines > 1 ? { WebkitLineClamp: lines } : undefined;

  return (
    <span className={styles.wrap}>
      <span
        ref={textRef}
        className={clsx(lines > 1 ? styles.clamp : styles.text, className)}
        style={clampStyle}
        onMouseEnter={handleEnter}
        onMouseLeave={tip.hide}
      >
        {children ?? text}
      </span>

      {tip.node}
    </span>
  );
}
