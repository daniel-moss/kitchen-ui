import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";

import { AvatarOtherProps, AvatarOtherStatus } from "./AvatarOther.types";

// Status → the icon addOn: glyph token, color, and rotation.
const STATUS: Record<
  Exclude<AvatarOtherStatus, "none">,
  { icon: string; color: string; rotate: number }
> = {
  active: { icon: semanticIcons.active, color: "var(--jade-a9)", rotate: 90 },
  review: { icon: semanticIcons.review, color: "var(--amber-a9)", rotate: 0 },
  inactive: { icon: semanticIcons.inactive, color: "var(--gray-a9)", rotate: 0 },
};

// Avatar template for Other (a line-item catch-all): an object/icon avatar with
// the `other` semantic icon, and a status expressed as the corner icon addOn.
export default function AvatarOther({ size = "md", status = "none", className }: AvatarOtherProps) {
  const s = status === "none" ? null : STATUS[status];

  return (
    <Avatar
      type="object"
      content="icon"
      icon={semanticIcons.other}
      size={size}
      className={className}
      addOn={s ? "icon" : "none"}
      addOnIcon={s?.icon}
      addOnIconColor={s?.color}
      addOnIconRotate={s?.rotate}
    />
  );
}
