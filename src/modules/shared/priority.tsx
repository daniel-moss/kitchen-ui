import { IconPack } from "../../components/Icon/Icon.types";

// The job-priority mapping (the "Priority Options" doc, New Job file node
// 23833-15685). ONE shared source for the form modules — mirrors the Filters
// prototype's local constants (folding Filters onto this is pending, like
// selectPopover's local copies).

export interface PriorityDef {
  icon: string;
  pack: IconPack;
  label: string;
  /** Urgent's fire is the only colored one (--orange-9). */
  isUrgent?: boolean;
}

export const PRIORITY: Record<1 | 2 | 3 | 4, PriorityDef> = {
  1: { icon: "fire", pack: "solid", label: "Urgent", isUrgent: true },
  2: { icon: "solid-priority-high", pack: "custom", label: "High" },
  3: { icon: "duotone-solid-priority-medium", pack: "custom-duotone", label: "Medium" },
  4: { icon: "duotone-solid-priority-low", pack: "custom-duotone", label: "Low" },
};

export const NO_PRIORITY: PriorityDef = { icon: "solid-priority-none", pack: "custom", label: "No priority" };

export const priorityOf = (priority: 1 | 2 | 3 | 4 | null): PriorityDef =>
  priority == null ? NO_PRIORITY : PRIORITY[priority];

/** The Priority list order (the doc): No priority, then Low → Urgent. */
export const PRIORITY_OPTIONS: (1 | 2 | 3 | 4 | null)[] = [null, 4, 3, 2, 1];
