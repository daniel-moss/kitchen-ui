import { createStatusBadge, StatusDef } from "./statusBadge";

// Pricebook status → scheme · dot · label. All three statuses use a status dot
// since the Figma update of 2026-09-16 (was circle-minus / clock / ban icons).
export const STATUS = {
  active: { scheme: "jade", dot: true, label: "Active" },
  review: { scheme: "amber", dot: true, label: "Review" },
  inactive: { scheme: "gray", dot: true, label: "Inactive" },
} satisfies Record<string, StatusDef>;

export type BadgePricebookStatusStatus = keyof typeof STATUS;

const BadgePricebookStatus = createStatusBadge(STATUS);
export default BadgePricebookStatus;
