import { HTMLAttributes, ReactNode } from "react";

// `title` is the field name, not the HTML tooltip attribute — omit that one.
export interface ActivityLogSubItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** The changed field's name. Medium 14/20 in `--text-strong`. */
  title: ReactNode;
  /**
   * The value before the change. Rendered struck through in `--gray-a9`.
   * Leave it out when the field had no value — `emptyText` is struck instead.
   */
  oldValue?: ReactNode;
  /**
   * The value after the change. Rendered medium in `--gray-12`. Leave it out
   * when the field was CLEARED — `emptyText` is shown in the regular subtle
   * style instead (never emphasised; an empty field is not a new value).
   */
  newValue?: ReactNode;
  /**
   * Free-form caption. Replaces the `oldValue → newValue` line entirely, for
   * details that are not a value change.
   */
  caption?: ReactNode;
  /** Copy for a missing value on either side. Default "No value". */
  emptyText?: string;
  className?: string;
}
