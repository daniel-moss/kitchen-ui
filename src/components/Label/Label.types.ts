import { LabelHTMLAttributes, ReactNode } from "react";

export type LabelVariant = "subtle" | "default";

export interface LabelProps extends Omit<LabelHTMLAttributes<HTMLLabelElement>, "children"> {
  /** The label text. */
  children: ReactNode;

  /**
   * subtle = Regular/subtle (input fields) · default = Medium/strong
   * (checkboxes, toggles, radio items). Default "default". (The old "strong"
   * variant moved to FormModule as its title — see FormModule.)
   */
  variant?: LabelVariant;

  /**
   * Condition text after the label (subtle). "optional" → "(optional)",
   * "readOnly" → "(read-only)", `true` → "(optional)", or any custom node.
   */
  condition?: "optional" | "readOnly" | boolean | ReactNode;

  /** Show a hint trigger (info icon) after the label. */
  hintTrigger?: boolean;
  /** Hint bubble content — the trigger opens a HoverHint with this caption. */
  hintContent?: ReactNode;

  /**
   * Element to render. Default "label". Use "span" when the Label sits inside
   * another label (e.g. ToggleItem's row), where a nested <label> is invalid.
   */
  as?: "label" | "span";

  className?: string;
}
