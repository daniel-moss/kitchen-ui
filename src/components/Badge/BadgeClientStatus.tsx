import { createStatusBadge, StatusDef } from "./statusBadge";

// Client status → scheme · icon · label. (See badge-client-status.md.)
export const STATUS = {
  active: { scheme: "jade", icon: "circle-minus", rotate: 90, label: "Active" },
  inactive: { scheme: "gray", icon: "ban", label: "Inactive" },
} satisfies Record<string, StatusDef>;

export type BadgeClientStatusStatus = keyof typeof STATUS;

const BadgeClientStatus = createStatusBadge(STATUS);
export default BadgeClientStatus;
