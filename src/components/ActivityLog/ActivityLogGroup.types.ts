import { HTMLAttributes, ReactNode } from "react";

export interface ActivityLogGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** The group header — the month the logs belong to, e.g. "January 2026". */
  label: ReactNode;

  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial open state. Default true — groups start expanded. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  /**
   * The logs — `ActivityLogItem`s, NEWEST first. They connect into one
   * timeline; the first and last one drop the connector that would point out
   * of the group.
   */
  children?: ReactNode;
  className?: string;
}
