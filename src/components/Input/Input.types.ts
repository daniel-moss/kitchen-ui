import { ReactNode } from "react";

import { LabelProps } from "../Label/Label.types";
import { StrengthIndicatorState } from "./StrengthIndicator.types";

export interface InputProps {
  /** Field label (rendered with the Label component, subtle variant). */
  label?: ReactNode;
  /**
   * Label condition — "(optional)" / custom. "(read-only)" is NOT accepted
   * here: it appears automatically, and only when the wrapped field itself is
   * `readOnly`.
   */
  labelCondition?: Exclude<LabelProps["condition"], "readOnly">;
  /** Show a hint trigger (info icon) on the label. */
  labelHint?: boolean;
  /** Hint bubble content for the label's trigger (a HoverHint caption). */
  labelHintContent?: ReactNode;

  /** Description help text below the label, above the field (neutral). */
  helpText?: ReactNode;

  /**
   * Password strength — shown at the label's right edge (used with
   * PasswordField). The value comes from the consumer; Input has no strength
   * logic.
   */
  strength?: StrengthIndicatorState;

  /** Skeleton loading state (label / help text / field). */
  isLoading?: boolean;

  /**
   * The field — ONE of: TextField, TextArea, SelectField, DateField,
   * PasswordField, InputGroup, CheckboxGroup, RadioGroup, MediaField — or TWO
   * for the textAreaMedia combination: a TextArea followed by a MediaField
   * (stacked --size-3 (12px) apart under the shared header).
   */
  children: ReactNode;

  className?: string;
}
