import { HTMLAttributes, ReactNode } from "react";

export interface ChipGroupProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The Chips. They keep their own props — the group only lays them out, it
   * does not control which one is `active`.
   */
  children: ReactNode;
  /**
   * Stretch mode (like TabGroup's): the chips stop hugging and share the
   * row's full width equally, and the row does not wrap. Used for the
   * weekday "Repeat on" row. Default false — a wrapping row of hug-width
   * chips.
   */
  isFullWidth?: boolean;
  className?: string;
}
