import { createStatusBadge, StatusDef } from "./statusBadge";

// Purchase Order status → scheme · icon · label. The progress statuses use the
// circle-*-stroke glyphs rotated. (See badge-po-status.md.)
export const STATUS = {
  draft: { scheme: "gray", icon: "circle-dashed", label: "Draft" },
  unsent: { scheme: "violet", icon: "circle-dashed", label: "Unsent" },
  sent: { scheme: "blue", icon: "circle-quarter-stroke", rotate: 90, label: "Sent" },
  acknowledged: { scheme: "jade", icon: "circle-quarter-stroke", rotate: 90, label: "Acknowledged" },
  inTransit: { scheme: "cyan", icon: "circle-half-stroke", rotate: 180, label: "In transit" },
  unstocked: { scheme: "amber", icon: "circle-three-quarters-stroke", rotate: 270, label: "Unstocked" },
  unpaid: { scheme: "orange", icon: "circle-three-quarters-stroke", rotate: 270, label: "Unpaid" },
  paid: { scheme: "jade", icon: "circle-check", label: "Paid" },
  cancelled: { scheme: "gray", icon: "circle-xmark", label: "Cancelled" },
} satisfies Record<string, StatusDef>;

export type BadgePOStatusStatus = keyof typeof STATUS;

const BadgePOStatus = createStatusBadge(STATUS);
export default BadgePOStatus;
