import { ButtonHTMLAttributes, MouseEvent } from "react";

import { IconPack } from "../Icon/Icon.types";

/** Square sizes (px): xxxs 20, xxs 22, xs 24, sm 28, md 32, lg 36. */
export type IconButtonSize = "xxxs" | "xxs" | "xs" | "sm" | "md" | "lg";

/** No `danger` — use Button for destructive actions with labels. */
export type IconButtonVariant = "solid" | "subtle" | "ghost" | "muted";

type OnClickEvent = (event: MouseEvent<HTMLButtonElement>) => void;

export interface IconButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "disabled" | "onClick" | "aria-disabled" | "aria-busy" | "aria-pressed"
  > {
  /** Accessible label — required, there is no visible text. */
  "aria-label": string;

  /** Icon name (e.g. "diamonds-4"). Defaults to "diamonds-4". */
  icon?: string;
  /** Icon pack / weight. Default "regular". */
  iconPack?: IconPack;
  iconClassName?: string;

  /** Square size. Default "md". */
  size?: IconButtonSize;
  /** Variant: `solid`, `subtle`, `ghost`, or `muted` (dimmed icon that strengthens on interaction). Default "solid". */
  variant?: IconButtonVariant;
  /** Native button type. Default `"button"`. */
  type?: "button" | "submit" | "reset";
  className?: string;

  /** Keyboard-focusable. Default `true`. */
  isTabbable?: boolean;

  /** Click handler. Debounced on the leading edge (fires at once, then guards) unless `noDebounce`. */
  onClick?: OnClickEvent;
  /** Disable the built-in leading-edge click debounce. Default `false`. */
  noDebounce?: boolean;

  // Story-only visual-state simulators (hidden from the docs table).
  _isFocused?: boolean;
  _isHovered?: boolean;
  /** Force the pressed look. */
  isPressed?: boolean;
  /** Show a spinner and block clicks while an action runs. */
  isProcessing?: boolean;
  /** Dim the button and block interaction. Default `false`. */
  isDisabled?: boolean;
  /** Show a loading placeholder and block clicks while content loads. */
  isLoading?: boolean;
}
