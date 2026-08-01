import { ReactNode } from "react";

export type PopoverHeaderTextVariant = "title" | "titleCaption" | "titleCaptionReversed";

export interface PopoverHeaderTextProps {
  /** Layout: title only, title+caption, or caption above title. Default "titleCaption". */
  variant?: PopoverHeaderTextVariant;

  title: string;
  /** Optional extra class for the title line (e.g. a status color). */
  titleClassName?: string;
  caption?: string;

  /** Title slots (left = Icon, right = Icon or HintTrigger). */
  titleLeftSlot?: ReactNode;
  titleRightSlot?: ReactNode;
  /** Caption slots (Icon). */
  captionLeftSlot?: ReactNode;
  captionRightSlot?: ReactNode;

  className?: string;
}
