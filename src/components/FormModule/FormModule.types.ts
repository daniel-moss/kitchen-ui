import { ReactNode } from "react";

import { LabelProps } from "../Label/Label.types";

export interface FormModuleProps {
  /** The section title (heading/h3 — Semibold 15/24). Required. */
  title: string;
  /**
   * Condition caption after the title (subtle). Two variants (Figma):
   * "optional" → the fixed "(optional)" — marks an optional module (a module
   * with no inputs that is optional); any other value is custom copy shown
   * as-is, including its parentheses (e.g. "(if applicable)"). "readOnly" is
   * not applicable to a form section.
   */
  titleCondition?: Exclude<LabelProps["condition"], "readOnly">;
  /** Show an info icon after the title. */
  titleHint?: boolean;
  /**
   * Hint bubble content for the title's info icon (a HoverHint caption, like
   * Input's `labelHintContent`). Implies the trigger — `titleHint` is not
   * needed when this is set.
   */
  titleHintContent?: ReactNode;
  /** Subtle description below the title (optional; wraps). */
  caption?: ReactNode;
  /**
   * An optional banner below the header text — pass an AlertBanner (usually
   * `orientation="vertical" status="info"`) with contextual guidance.
   */
  banner?: ReactNode;
  /** The module body — the form fields. */
  children: ReactNode;
  className?: string;
}
