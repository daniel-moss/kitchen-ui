import { ReactNode } from "react";

import { ActivityLogItemProps } from "./ActivityLogItem.types";

/** One field an update changed. */
export interface ActivityLogFieldChange {
  /** The field's name as the form labels it, e.g. "Priority". */
  label: string;
  /**
   * The value before the change. Leave it out (or "") when the field was
   * empty — "No value" is struck in its place (DS doc "Cases" › "Value added").
   */
  oldValue?: ReactNode;
  /**
   * The value after the change. Leave it out (or "") when the field was
   * cleared — "No value" shows plain (DS doc "Cases" › "Value cleared").
   */
  newValue?: ReactNode;
  /** The old value's own icon (an `Icon` at 14px, or an xxs `AvatarUser`). */
  oldIcon?: ReactNode;
  /** The new value's own icon. */
  newIcon?: ReactNode;
  /** The new icon's tint, when the value has one. */
  newIconColor?: string;
  /**
   * A text field (a TextArea). Its values are paragraphs, so they never go in
   * the sentence: the log shows how the text was edited in a sub-log instead.
   * `oldValue` / `newValue` must then be strings.
   */
  isText?: boolean;
}

export interface ActivityLogUpdateProps
  extends Omit<ActivityLogItemProps, "text" | "children" | "accordion" | "symbol"> {
  /** Who made the change — usually the person's name. */
  person: ReactNode;
  /**
   * The fields that changed, in FORM order (the several-fields sentence names
   * the first ones). An empty list renders nothing.
   */
  changes: ActivityLogFieldChange[];
  /** The words between the person and the change. Default "updated". */
  verb?: ReactNode;
  /**
   * Replaces the field list in a several-fields sentence with the object the
   * fields belong to — a time session names itself ("Working: Mon, Jan 1 …").
   */
  subject?: ReactNode;
  /** The timeline symbol — the event type's icon. Default: an `Icon` "pen". */
  symbol?: ReactNode;
  /** Copy for a missing value. Default "No value". */
  emptyText?: string;
}
