import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";

import { AvatarEstimateProps, AvatarEstimateStatus } from "./AvatarEstimate.types";

// Status → the icon addOn: glyph + color + rotation. Status glyphs are raw names
// (no semantic tokens for these). (See avatar-estimate.md.)
const STATUS: Record<
  Exclude<AvatarEstimateStatus, "none">,
  { icon: string; color: string; rotate: number }
> = {
  draft: { icon: "circle-dashed", color: "var(--gray-a9)", rotate: 0 },
  unsent: { icon: "circle-dashed", color: "var(--violet-a9)", rotate: 0 },
  awaitingApproval: { icon: "circle-half-stroke", color: "var(--blue-a9)", rotate: 180 },
  expired: { icon: "circle-exclamation", color: "var(--tomato-a9)", rotate: 0 },
  unconverted: { icon: "circle-check", color: "var(--orange-a9)", rotate: 0 },
  jobbed: { icon: "circle-check", color: "var(--jade-a9)", rotate: 0 },
  invoiced: { icon: "circle-check", color: "var(--jade-a9)", rotate: 0 },
  cancelled: { icon: "circle-xmark", color: "var(--gray-a9)", rotate: 0 },
};

// Avatar template for an Estimate: an object/icon avatar with the `estimate`
// semantic icon, and a status expressed as the corner icon addOn.
export default function AvatarEstimate({
  size = "md",
  status = "none",
  className,
}: AvatarEstimateProps) {
  const s = status === "none" ? null : STATUS[status];

  return (
    <Avatar
      type="object"
      content="icon"
      icon={semanticIcons.estimate}
      size={size}
      className={className}
      addOn={s ? "icon" : "none"}
      addOnIcon={s?.icon}
      addOnIconColor={s?.color}
      addOnIconRotate={s?.rotate}
    />
  );
}
