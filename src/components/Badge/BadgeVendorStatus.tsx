import { createStatusBadge, StatusDef } from "./statusBadge";

// Vendor status → scheme · icon · label. (See badge-vendor-status.md.)
export const STATUS = {
  active: { scheme: "jade", icon: "circle-minus", rotate: 90, label: "Active" },
  inactive: { scheme: "gray", icon: "ban", label: "Inactive" },
} satisfies Record<string, StatusDef>;

export type BadgeVendorStatusStatus = keyof typeof STATUS;

const BadgeVendorStatus = createStatusBadge(STATUS);
export default BadgeVendorStatus;
