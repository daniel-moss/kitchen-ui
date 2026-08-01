import { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";

export interface ChipProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "disabled" | "onClick" | "aria-pressed" | "aria-busy" | "aria-disabled"
  > {
  /** md = 28px, lg = 32px. Default "md". */
  size?: "md" | "lg";
  /**
   * Selected look: gray-a2 fill + 1px gray-12 border, no shadow. Also sets
   * `aria-pressed`, so pass it (true/false) on chips that work as toggles.
   */
  active?: boolean;
  /**
   * Left slot — an Icon (solid, size 14; it inherits the label color) or ANY
   * avatar. The avatar size is strict: **xxs (16px)** in both chip sizes.
   */
  slotLeft?: ReactNode;
  /**
   * Loading skeleton: a bar instead of the label, and a gray circle instead
   * of the left slot (if one is set). The chip is not interactive.
   */
  isLoading?: boolean;
  isDisabled?: boolean;
  className?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** The label text. */
  children?: ReactNode;
}
