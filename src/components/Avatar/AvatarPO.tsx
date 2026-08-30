import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";

import { AvatarPOProps, AvatarPOStatus } from "./AvatarPO.types";

// Status → the icon addOn: glyph + color + rotation. The progress statuses use
// the circle-*-stroke glyphs rotated so the filled arc reads as a clock-like
// progression. Status glyphs are raw names. (See avatar-po.md.)
const STATUS: Record<
  Exclude<AvatarPOStatus, "none">,
  { icon: string; color: string; rotate: number }
> = {
  draft: { icon: "circle-dashed", color: "var(--gray-a9)", rotate: 0 },
  unsent: { icon: "circle-dashed", color: "var(--violet-a9)", rotate: 0 },
  sent: { icon: "circle-quarter-stroke", color: "var(--blue-a9)", rotate: 90 },
  acknowledged: { icon: "circle-quarter-stroke", color: "var(--jade-a9)", rotate: 90 },
  inTransit: { icon: "circle-half-stroke", color: "var(--cyan-a9)", rotate: 180 },
  unstocked: { icon: "circle-three-quarters-stroke", color: "var(--amber-a9)", rotate: 270 },
  unpaid: { icon: "circle-three-quarters-stroke", color: "var(--orange-a9)", rotate: 270 },
  paid: { icon: "circle-check", color: "var(--jade-a9)", rotate: 0 },
  cancelled: { icon: "circle-xmark", color: "var(--gray-a9)", rotate: 0 },
};

// Avatar template for a Purchase Order: an object/icon avatar with the
// `purchase-order` semantic icon, and a status expressed as the corner icon addOn.
export default function AvatarPO({ size = "md", status = "none", className }: AvatarPOProps) {
  const s = status === "none" ? null : STATUS[status];

  return (
    <Avatar
      shape="square"
      content="icon"
      icon={semanticIcons.purchaseOrder}
      size={size}
      className={className}
      addOn={s ? "icon" : "none"}
      addOnIcon={s?.icon}
      addOnIconColor={s?.color}
      addOnIconRotate={s?.rotate}
    />
  );
}
