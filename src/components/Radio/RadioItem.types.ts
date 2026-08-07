import { ChangeEventHandler, InputHTMLAttributes, ReactNode } from "react";

import { IconPack } from "../Icon/Icon.types";

export type RadioItemVariant = "inline" | "card";

export interface RadioItemProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "content" | "size"> {
  /** inline = bare row (radio left); card = bordered card (radio right). Default "inline". */
  variant?: RadioItemVariant;

  /** The main label (Inter Medium, strong). */
  label: ReactNode;
  /** Optional supporting caption below the label. */
  caption?: ReactNode;
  /** Optional left-slot icon name. */
  icon?: string;
  /** Optional color for the left-slot icon (e.g. a status color). */
  iconColor?: string;
  /** Icon weight. Default "solid" (the usual card icon); some designs use "regular". */
  iconPack?: IconPack;

  /** Optional content slot — shown below a divider when a card is selected. */
  content?: ReactNode;
  /**
   * The content slot's own 16px padding. Set false when the content brings its
   * own spacing — e.g. a full-bleed Divider between a field and a list. Default
   * true.
   */
  contentPadded?: boolean;

  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;

  /** Error styling (tomato). */
  error?: boolean;
  /** Non-interactive, whole item dimmed. */
  disabled?: boolean;
  /** Non-interactive; only the radio dims, the copy stays readable. */
  readOnly?: boolean;
  /** Non-interactive; copy becomes skeleton lines and the radio pulses. */
  loading?: boolean;

  className?: string;
}
