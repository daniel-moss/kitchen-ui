import { HTMLAttributes, MouseEvent, ReactNode } from "react";

export type LinkButtonSize = "sm" | "md";

export type LinkButtonColorScheme = "black" | "gray" | "blue" | "jade" | "amber" | "tomato";

export interface LinkButtonProps extends Omit<HTMLAttributes<HTMLElement>, "color" | "onClick"> {
  /** The label. Always underlined (except while interacting / loading). */
  children: ReactNode;
  /** md = 14/20, sm = 13/20. Default "md". */
  size?: LinkButtonSize;
  /** Text + icon color. Default "black" (--gray-12). */
  colorScheme?: LinkButtonColorScheme;
  className?: string;

  /** Icon name shown on the left (e.g. "plus"). 14px, classic-regular. */
  leftIcon?: string;
  leftIconClassName?: string;
  /** Icon name shown on the right (e.g. "arrow-up-right"). */
  rightIcon?: string;
  rightIconClassName?: string;

  /**
   * When set, LinkButton renders a real <a href> (navigation). Without it, it
   * renders a <button> (action).
   */
  href?: string;
  /** Anchor target (only meaningful with href). */
  target?: string;
  /** Anchor rel (only meaningful with href). */
  rel?: string;
  /** Button type (only meaningful without href). Default "button". */
  type?: "button" | "submit" | "reset";

  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** Skip the leading-edge debounce on onClick. Default false. */
  noDebounce?: boolean;

  isTabbable?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;

  // Used by stories to show states without real interaction.
  _isHovered?: boolean;
  isPressed?: boolean;
  _isFocused?: boolean;
}
