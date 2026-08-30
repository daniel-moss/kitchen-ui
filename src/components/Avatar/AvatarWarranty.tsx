import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";

import { AvatarWarrantyProps, AvatarWarrantyStatus } from "./AvatarWarranty.types";

// Status → the icon addOn: glyph + color (no rotation). Status glyphs are raw
// names (no semantic tokens for these). (See avatar-warranty.md.)
const STATUS: Record<Exclude<AvatarWarrantyStatus, "none">, { icon: string; color: string }> = {
  active: { icon: "circle-check", color: "var(--jade-a9)" },
  upcoming: { icon: "calendar-lines", color: "var(--blue-a9)" },
  expired: { icon: "circle-xmark", color: "var(--gray-a9)" },
};

// Avatar template for a Warranty: an object/icon avatar with the `warranty`
// semantic icon, and a status expressed as the corner icon addOn.
export default function AvatarWarranty({
  size = "md",
  status = "none",
  className,
}: AvatarWarrantyProps) {
  const s = status === "none" ? null : STATUS[status];

  return (
    <Avatar
      shape="square"
      content="icon"
      icon={semanticIcons.warranty}
      size={size}
      className={className}
      addOn={s ? "icon" : "none"}
      addOnIcon={s?.icon}
      addOnIconColor={s?.color}
    />
  );
}
