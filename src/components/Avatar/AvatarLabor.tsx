import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";

import { AvatarLaborProps, AvatarLaborStatus } from "./AvatarLabor.types";

// Status → the icon addOn: glyph token, color, and rotation.
const STATUS: Record<
  Exclude<AvatarLaborStatus, "none">,
  { icon: string; color: string; rotate: number }
> = {
  active: { icon: semanticIcons.active, color: "var(--jade-a9)", rotate: 90 },
  review: { icon: semanticIcons.review, color: "var(--amber-a9)", rotate: 0 },
  inactive: { icon: semanticIcons.inactive, color: "var(--gray-a9)", rotate: 0 },
};

// Avatar template for Labor: an object/icon avatar with the `labor` semantic
// icon, and a status expressed as the corner icon addOn.
export default function AvatarLabor({ size = "md", status = "none", className }: AvatarLaborProps) {
  const s = status === "none" ? null : STATUS[status];

  return (
    <Avatar
      type="object"
      content="icon"
      icon={semanticIcons.labor}
      size={size}
      className={className}
      addOn={s ? "icon" : "none"}
      addOnIcon={s?.icon}
      addOnIconColor={s?.color}
      addOnIconRotate={s?.rotate}
    />
  );
}
