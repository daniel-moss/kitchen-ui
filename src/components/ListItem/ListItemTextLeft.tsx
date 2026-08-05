import { ReactNode } from "react";

import clsx from "clsx";

import TruncatingText from "../Tooltip/TruncatingText";

import styles from "./ListItemTextLeft.module.scss";
import { ListItemTextLeftProps, ListItemTextLines } from "./ListItemTextLeft.types";

// One text line honoring its truncation rule: 1–3 lines = ellipsis + a
// full-text tooltip on hover (TruncatingText); "wrap" = plain wrapping text.
// A non-string (ReactNode) line is rendered as-is — the caller owns truncation.
const line = (text: ReactNode, lines: ListItemTextLines, className: string) =>
  lines === "wrap" ? (
    <span className={clsx(styles.wrapLine, className)}>{text}</span>
  ) : typeof text === "string" ? (
    <TruncatingText text={text} lines={lines} className={className} />
  ) : (
    <span className={className}>{text}</span>
  );

// ListItemTextLeft — the left text block of a ListItem: a title with an
// optional caption below (or above — titleCaptionReversed). Left-aligned.
// Each line truncates after 1 (default) / 2 / 3 lines with a full-text hover
// tooltip, or wraps — per the designs. A lone title keeps the 40px row height.
// See Figma "ListItem › Content Text Left".
export default function ListItemTextLeft({
  variant = "title",
  title,
  caption,
  titleLines = 1,
  captionLines = 1,
  titleClassName,
  captionClassName,
  captionSlotLeft,
  className,
}: ListItemTextLeftProps) {
  const titleLine = line(title, titleLines, clsx(styles.title, titleClassName));
  const caption_ = variant !== "title" && caption != null ? line(caption, captionLines, clsx(styles.caption, captionClassName)) : null;
  // With a left slot the caption becomes a row: the glyph, 8px, then the text
  // (Figma 28927-35531). The text still owns the truncation.
  const captionLine =
    caption_ != null && captionSlotLeft != null ? (
      <span className={styles.captionRow}>
        <span className={styles.captionSlot}>{captionSlotLeft}</span>
        {caption_}
      </span>
    ) : (
      caption_
    );

  return (
    <div className={clsx(styles.text, variant === "title" && styles.singleLine, className)}>
      {variant === "titleCaptionReversed" ? (
        <>
          {captionLine}
          {titleLine}
        </>
      ) : (
        <>
          {titleLine}
          {captionLine}
        </>
      )}
    </div>
  );
}
