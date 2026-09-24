import { ReactNode } from "react";

import clsx from "clsx";

import { SkeletonTypography } from "../../SkeletonTypography/SkeletonTypography";
import { SkeletonTypographyVariant } from "../../SkeletonTypography/SkeletonTypography.types";
import TruncatingText from "../../Tooltip/TruncatingText";

import styles from "./ItemTextLine.module.scss";
import { ItemTextLineProps, ItemTextLines, ItemTextLineStyle } from "./ItemTextLine.types";

// The bar has to sit on the same line box as the text it replaces, so each text
// style maps to the skeleton variant with the matching box. Both body styles
// share the 20px compact line, which is why they map to the same one.
const SKELETON_VARIANT: Record<ItemTextLineStyle, SkeletonTypographyVariant> = {
  bodyMedium: "bodyCompact",
  bodyRegular: "bodyCompact",
  caption: "captionMD",
};

// The text itself, honoring its truncation rule: 1–3 lines = ellipsis + a
// full-text tooltip on hover (TruncatingText); "wrap" = plain wrapping text.
// A non-string label is rendered as-is — the caller owns truncation.
const renderLabel = (label: ReactNode, lines: ItemTextLines, className: string) =>
  lines === "wrap" ? (
    <span className={clsx(styles.freeText, className)}>{label}</span>
  ) : typeof label === "string" ? (
    <TruncatingText text={label} lines={lines} className={className} />
  ) : (
    <span className={clsx(styles.freeText, className)}>{label}</span>
  );

// ItemTextLine — one line of row text: [slotLeft] 8px [text] 8px [slotRight],
// centered on a 20px line. Three text styles (bodyMedium / bodyRegular /
// caption) and five colors; the slots' icons inherit the color. The text hugs
// its content and truncates, so a right slot sits next to the text instead of
// at the far edge. See Figma "ItemText › ItemTextLine".
export default function ItemTextLine({ label, textStyle = "bodyMedium", color = "strong", slotLeft, slotRight, lines = 1, isLoading = false, className }: ItemTextLineProps) {
  return (
    <span className={clsx(styles.line, styles[color], className)}>
      {isLoading ? (
        <SkeletonTypography variant={SKELETON_VARIANT[textStyle]} className={styles.skeleton} />
      ) : (
        <>
          {slotLeft != null && <span className={styles.slot}>{slotLeft}</span>}
          {renderLabel(label, lines, styles[textStyle])}
          {slotRight != null && <span className={styles.slot}>{slotRight}</span>}
        </>
      )}
    </span>
  );
}
