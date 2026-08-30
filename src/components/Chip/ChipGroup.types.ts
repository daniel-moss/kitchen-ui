import { HTMLAttributes, ReactNode } from "react";

export interface ChipGroupProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The Chips. They keep their own props — the group only lays them out, it
   * does not control which one is `active`.
   */
  children: ReactNode;
  className?: string;
}
