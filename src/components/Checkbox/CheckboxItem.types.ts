import { ChangeEventHandler, InputHTMLAttributes, ReactNode } from "react";

import { IconPack } from "../Icon/Icon.types";

export type CheckboxItemVariant = "inline" | "card";

export interface CheckboxItemProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "content" | "size"> {
  /** inline = bare row (checkbox left); card = bordered card (checkbox right). Default "inline". */
  variant?: CheckboxItemVariant;

  /** The main label (Inter Medium, strong). */
  label: ReactNode;
  /** Optional supporting caption below the label (Inter Regular, subtle). */
  caption?: ReactNode;
  /** Optional left-slot icon name. Icon-only for now. */
  icon?: string;
  /** Weight of the left-slot icon. Default "solid". */
  iconPack?: IconPack;

  /** Optional content slot — shown below a divider when a card is selected. */
  content?: ReactNode;

  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;

  /** Error styling (tomato). */
  error?: boolean;
  /** Non-interactive, whole item dimmed. */
  disabled?: boolean;
  /** Non-interactive; only the checkbox dims, the copy stays readable. */
  readOnly?: boolean;
  /** Non-interactive; copy becomes skeleton lines and the checkbox pulses. */
  loading?: boolean;

  className?: string;
}
