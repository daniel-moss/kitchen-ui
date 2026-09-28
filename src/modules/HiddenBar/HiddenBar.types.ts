import { ReactNode } from "react";

/** The optional action a group offers — a ghost `sm` Button after the text. */
export interface HiddenBarAction {
  label: string;
  onClick: () => void;
}

export interface HiddenBarGroupProps {
  /**
   * The sentence. Wrap the counts in `<strong>` — the bar styles those in
   * `--text-strong` / caption-500 and leaves the rest subtle.
   */
  children: ReactNode;
  /** The button after the text. Omit for a text-only group. */
  action?: HiddenBarAction;
  className?: string;
}

export interface HiddenBarProps {
  /** One or more `HiddenBarGroup`s, laid out in a row 16px apart. */
  children: ReactNode;
  /** The Divider above the row (contrast medium). Default true. */
  divider?: boolean;
  className?: string;
}
