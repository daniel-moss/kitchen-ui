import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";

import { AvatarLaborRateProps, AvatarLaborRateStatus } from "./AvatarLaborRate.types";

// Status → the statusDot color (Figma 2026-09-16: dots replaced the corner
// status icons on every pricebook avatar).
const DOT_COLOR: Record<Exclude<AvatarLaborRateStatus, "none">, string> = {
  active: "var(--jade-a9)",
  review: "var(--amber-a9)",
  inactive: "var(--gray-a9)",
};

// Avatar template for a Labor rate: an object/icon avatar with the `labor-rate`
// semantic icon, and a status shown as a colored statusDot.
// RENAMED from AvatarLabor on 2026-10-06, with the object itself.
export default function AvatarLaborRate({ size = "md", status = "none", className }: AvatarLaborRateProps) {
  const dotColor = status === "none" ? undefined : DOT_COLOR[status];

  return (
    <Avatar
      shape="square"
      content="icon"
      icon={semanticIcons.laborRate}
      size={size}
      className={className}
      addOn={dotColor ? "statusDot" : "none"}
      statusDotColor={dotColor}
    />
  );
}
