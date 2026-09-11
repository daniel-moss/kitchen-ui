import { ButtonHTMLAttributes, MouseEvent } from "react";

import { IconPack } from "../Icon/Icon.types";
import { Size } from "../../types";

export type ButtonVariant = "solid" | "subtle" | "ghost" | "danger";

type OnClickEvent = (event: MouseEvent<HTMLButtonElement>) => void;

export interface ButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "disabled" | "onClick" | "aria-disabled" | "aria-busy" | "aria-pressed"
  > {
  /** Height of the button: `sm` 28px · `md` 32px · `lg` 36px. */
  size: Exclude<Size, "xxs" | "xs" | "xl">; // sm | md | lg
  /** Visual style: `solid` (primary), `subtle` (secondary), `ghost` (low-emphasis), `danger` (destructive). */
  variant: ButtonVariant;
  /** Native button type. Default `"button"`. */
  type?: "button" | "submit" | "reset";
  className?: string;

  /** Keyboard-focusable. Default `true`. */
  isTabbable?: boolean;
  /** Stretch to fill the container width. Default `false`. */
  isFullWidth?: boolean;

  /** Icon name shown on the left (e.g. "plus"). */
  leftIcon?: string;
  /** Icon weight for the left icon. Default "regular". */
  leftIconPack?: IconPack;
  leftIconClassName?: string;
  /** Icon name shown on the right. */
  rightIcon?: string;
  /** Icon weight for the right icon. Default "regular". */
  rightIconPack?: IconPack;
  rightIconClassName?: string;

  /** Click handler. Debounced on the leading edge (fires at once, then guards) unless `noDebounce`. */
  onClick?: OnClickEvent;
  /** Disable the built-in leading-edge click debounce. Default `false`. */
  noDebounce?: boolean;

  // Story-only visual-state simulators (hidden from the docs table).
  _isFocused?: boolean;
  _isHovered?: boolean;
  /** Force the pressed look. */
  isPressed?: boolean;
  /** Show a spinner and block clicks while an action runs — keeps the button width. */
  isProcessing?: boolean;
  /** Dim the button and block interaction. Default `false`. */
  isDisabled?: boolean;
  /** Show a skeleton label and block clicks while content loads. */
  isLoading?: boolean;
}
