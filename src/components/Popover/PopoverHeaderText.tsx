import clsx from "clsx";

import PopoverHeaderTitle from "./PopoverHeaderTitle";
import PopoverHeaderCaption from "./PopoverHeaderCaption";

import styles from "./PopoverHeaderText.module.scss";
import { PopoverHeaderTextProps } from "./PopoverHeaderText.types";

// The Text block of a PopoverHeader: Title with an optional Caption above or
// below it. Composes the Title and Caption parts.
export default function PopoverHeaderText({
  variant = "titleCaption",
  title,
  titleClassName,
  caption,
  titleLeftSlot,
  titleRightSlot,
  captionLeftSlot,
  captionRightSlot,
  className,
}: PopoverHeaderTextProps) {
  const titleEl = (
    <PopoverHeaderTitle title={title} titleClassName={titleClassName} leftSlot={titleLeftSlot} rightSlot={titleRightSlot} />
  );
  const captionEl =
    variant !== "title" && caption != null ? (
      <PopoverHeaderCaption caption={caption} leftSlot={captionLeftSlot} rightSlot={captionRightSlot} />
    ) : null;

  return (
    <div className={clsx(styles.text, className)}>
      {variant === "titleCaptionReversed" && captionEl}
      {titleEl}
      {variant === "titleCaption" && captionEl}
    </div>
  );
}
