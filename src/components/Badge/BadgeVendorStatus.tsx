import { createStatusBadge, StatusDef } from "./statusBadge";

// Vendor status → scheme · dot · label. Both statuses use a status dot since
// the Figma update of 2026-09-16 (was circle-minus / ban icons).
export const STATUS = {
  active: { scheme: "jade", dot: true, label: "Active" },
  inactive: { scheme: "gray", dot: true, label: "Inactive" },
} satisfies Record<string, StatusDef>;

export type BadgeVendorStatusStatus = keyof typeof STATUS;

const BadgeVendorStatus = createStatusBadge(STATUS);
export default BadgeVendorStatus;
