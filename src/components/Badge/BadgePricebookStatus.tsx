import { createStatusBadge, StatusDef } from "./statusBadge";

// Pricebook status → scheme · icon · label. (See badge-pricebook-status.md.)
export const STATUS = {
  active: { scheme: "jade", icon: "circle-minus", rotate: 90, label: "Active" },
  review: { scheme: "amber", icon: "clock", label: "Review" },
  inactive: { scheme: "gray", icon: "ban", label: "Inactive" },
} satisfies Record<string, StatusDef>;

export type BadgePricebookStatusStatus = keyof typeof STATUS;

const BadgePricebookStatus = createStatusBadge(STATUS);
export default BadgePricebookStatus;
