import clsx from "clsx";

import ItemTextBlock from "../ItemText/ItemText/ItemTextBlock";

import styles from "./ListItemContent.module.scss";
import { ListItemContentProps } from "./ListItemContent.types";

// ListItemContent — the content region of a ListItem: an optional left slot
// (an xl / 36px Avatar, any type), the left text block, and an optional right
// block 16px after it. Everything is vertically centered. See Figma
// "ListItem › Content".
//
// The text is ItemTextBlock, the shared row-text component: the type styles,
// colors, line slots, truncation rules and the loading bars are defined once
// there and every row component reads the same ones. This file keeps
// ListItem's own prop names and its two ListItem-specific rules — the caption
// placeholder and the single-line row height.
export default function ListItemContent({
  avatar,
  variant = "title",
  title,
  caption,
  captionPlaceholder,
  titleLines = 1,
  captionLines = 1,
  titleClassName,
  captionClassName,
  captionSlotLeft,
  right,
  isLoading = false,
  className,
}: ListItemContentProps) {
  // The caption, or — where the row has no value for it — its PLACEHOLDER, one
  // token dimmer (the copy doc's standard empty behaviour, Figma 27171-15212).
  const captionValue = caption ?? captionPlaceholder;
  const isPlaceholder = caption == null && captionPlaceholder != null;

  // A caption variant with nothing to put on the second line renders as a lone
  // title: ItemTextBlock always draws the line its variant names, so the
  // variant — not the value — has to carry the decision.
  const hasCaption = variant !== "title" && captionValue != null;
  const blockVariant = !hasCaption ? "title" : variant === "titleCaptionReversed" ? "captionTitle" : "titleCaption";

  // While loading there is no right block: it holds a value the row does not
  // have yet, and the bars on the left already say the row is coming.
  const showRight = right != null && !isLoading;

  return (
    <div className={clsx(styles.content, className)}>
      {avatar != null && <span className={styles.slotLeft}>{avatar}</span>}
      <div className={styles.textRow}>
        <ItemTextBlock
          align="left"
          variant={blockVariant}
          title={title}
          caption={captionValue}
          captionColor={isPlaceholder ? "placeholder" : "subtle"}
          captionSlotLeft={captionSlotLeft}
          titleLines={titleLines}
          captionLines={captionLines}
          titleClassName={titleClassName}
          captionClassName={captionClassName}
          isLoading={isLoading}
          // A lone title still keeps the two-line block height — the row's
          // 60px minimum is also enforced on the row itself, but the block
          // carries it so a row with its own padding still measures right.
          className={clsx(styles.left, variant === "title" && styles.singleLine)}
        />
        {showRight && <div className={styles.right}>{right}</div>}
      </div>
    </div>
  );
}
