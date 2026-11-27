import { HTMLAttributes, ReactNode } from "react";

export interface ActivityLogValueProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * The value's own icon — an `Icon` at `size={14}` (`container="fixedHeight"`),
   * or an `AvatarUser` at `size="xxs"` for a person. It sits before the value,
   * centred on the line. Without it the value renders as plain text.
   */
  icon?: ReactNode;
  /**
   * The icon's tint, when the value has one (an "Urgent" priority's orange).
   * Ignored inside `ActivityLogRemoved` — a removed value's icon is gray-a8.
   * Default: the colour of the text around it.
   */
  iconColor?: string;
  /**
   * The value OPENS its line (a sub-log caption starts with it), so it has no
   * text before it and no space before its icon. Default false.
   */
  isLeading?: boolean;
  /**
   * Keep the WHOLE value on one line with its icon — a person's name next to
   * their avatar never breaks. Default false: only the first word stays with
   * the icon, so a long value can still wrap.
   */
  isWhole?: boolean;
  /**
   * The value text. A string keeps only its first word with the icon (unless
   * `isWhole`); the rest wraps normally.
   */
  children: ReactNode;
}
