import { HTMLAttributes, ReactNode } from "react";

// `title` is the field name, not the HTML tooltip attribute — omit that one.
export interface ActivityLogSubItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /**
   * The changed field's name. body/500 compact, `--text-strong`, with the
   * sub-log icon before it (Figma `title = true`).
   * Leave it out ONLY for a text field changed on its own — the log sentence
   * already names that field. The sub-log then drops the icon too, and its
   * caption is body/400 spacious (Figma `title = false`); put an
   * `ActivityLogTextChange` in `caption`.
   */
  title?: ReactNode;
  /**
   * The value before the change: body/400 compact, `--gray-a8`, struck
   * through. Leave it out when the field was empty — `emptyText` is struck
   * in its place.
   */
  oldValue?: ReactNode;
  /** The old value's own icon (a priority, a type). Turns gray-a8 with it. */
  oldIcon?: ReactNode;
  /**
   * The value after the change: body/400 compact, `--text-strong`, like the
   * arrow. Leave it out when the field was CLEARED — `emptyText` then shows
   * in `--text-subtle`, because an empty field is not a new value.
   */
  newValue?: ReactNode;
  /** The new value's own icon. */
  newIcon?: ReactNode;
  /** The new icon's tint, when the value has one. */
  newIconColor?: string;
  /**
   * Free-form caption. Replaces the `old → new` line, for details that are not
   * a value change (a reason, a text change). `--text-strong`.
   */
  caption?: ReactNode;
  /** Copy for a missing value on either side. Default "No value". */
  emptyText?: string;
  className?: string;
}
