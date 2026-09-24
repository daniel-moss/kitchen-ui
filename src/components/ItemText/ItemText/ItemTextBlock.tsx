import clsx from "clsx";

import ItemTextLine from "./ItemTextLine";

import styles from "./ItemTextBlock.module.scss";
import { ItemTextBlockProps } from "./ItemTextBlock.types";

// ItemTextBlock — one column of row text: a title with an optional caption
// (either order), or a single tag line. Each line's text style and color come
// from the variant's preset; `titleColor` / `captionColor` / `tagColor` and
// `titleStyle` / `captionStyle` / `tagStyle` override them when a row needs it
// — the same two axes Figma exposes on the nested ItemTextLine instances.
// `align` decides the side: left fills and truncates, right hugs and never
// truncates.
// See Figma "ItemText › ItemTextBlock".
export default function ItemTextBlock({
  variant = "title",
  align = "left",
  title,
  caption,
  tag,
  titleColor = "strong",
  captionColor = "subtle",
  tagColor = "subtle",
  titleStyle = "bodyMedium",
  captionStyle = "caption",
  tagStyle = "bodyRegular",
  titleSlotLeft,
  titleSlotRight,
  captionSlotLeft,
  captionSlotRight,
  tagSlotLeft,
  tagSlotRight,
  titleLines = 1,
  captionLines = 1,
  tagLines = 1,
  isLoading = false,
  titleClassName,
  captionClassName,
  tagClassName,
  className,
}: ItemTextBlockProps) {
  // A right block is as wide as its widest line, so every line has to pack its
  // content to the right edge. The class comes from this module, because a
  // descendant selector cannot reach another CSS module's class.
  const sideClass = align === "right" ? styles.lineRight : undefined;

  const titleLine = (
    <ItemTextLine
      key="title"
      label={title}
      textStyle={titleStyle}
      color={titleColor}
      slotLeft={titleSlotLeft}
      slotRight={titleSlotRight}
      lines={titleLines}
      isLoading={isLoading}
      className={clsx(sideClass, titleClassName)}
    />
  );

  const captionLine = (
    <ItemTextLine
      key="caption"
      label={caption}
      textStyle={captionStyle}
      color={captionColor}
      slotLeft={captionSlotLeft}
      slotRight={captionSlotRight}
      lines={captionLines}
      isLoading={isLoading}
      className={clsx(sideClass, captionClassName)}
    />
  );

  const tagLine = (
    <ItemTextLine
      key="tag"
      label={tag}
      textStyle={tagStyle}
      color={tagColor}
      slotLeft={tagSlotLeft}
      slotRight={tagSlotRight}
      lines={tagLines}
      isLoading={isLoading}
      className={clsx(sideClass, tagClassName)}
    />
  );

  const lines =
    variant === "tag" ? [tagLine] : variant === "captionTitle" ? [captionLine, titleLine] : variant === "titleCaption" ? [titleLine, captionLine] : [titleLine];

  return <div className={clsx(styles.block, styles[align], className)}>{lines}</div>;
}
