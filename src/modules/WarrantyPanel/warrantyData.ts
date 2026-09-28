import { WarrantyState } from "../../data/db";

// What the Warranty side panel needs beyond the db record itself.

/**
 * Warranty status → the "Status" value's icon, label and color (Figma
 * 22002-1953). The icon trio is the same one `AvatarWarranty` puts in its
 * corner, so the header avatar and the value always agree.
 */
export const WARRANTY_STATUS: Record<WarrantyState, { icon: string; label: string; color: string }> = {
  active: { icon: "circle-check", label: "Active", color: "var(--text-success)" },
  upcoming: { icon: "calendar-lines", label: "Upcoming", color: "var(--text-info)" },
  expired: { icon: "circle-xmark", label: "Expired", color: "var(--text-placeholder)" },
};
