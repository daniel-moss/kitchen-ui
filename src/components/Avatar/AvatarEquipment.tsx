import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";

import { AvatarEquipmentProps, AvatarEquipmentStatus } from "./AvatarEquipment.types";

// Status → the icon addOn: glyph + color (no rotation). Status glyphs are raw
// names (no semantic tokens for these). (See avatar-equipment.md.)
const STATUS: Record<Exclude<AvatarEquipmentStatus, "none">, { icon: string; color: string }> = {
  covered: { icon: "shield-halved", color: "var(--jade-a9)" },
  partiallyCovered: { icon: "shield-exclamation", color: "var(--amber-a9)" },
  expired: { icon: "shield-xmark", color: "var(--gray-a9)" },
};

// Avatar template for Equipment: an object/icon avatar with the `equipment`
// semantic icon, and a warranty-coverage status as the corner icon addOn.
export default function AvatarEquipment({
  size = "md",
  status = "none",
  className,
}: AvatarEquipmentProps) {
  const s = status === "none" ? null : STATUS[status];

  return (
    <Avatar
      type="object"
      content="icon"
      icon={semanticIcons.equipment}
      size={size}
      className={className}
      addOn={s ? "icon" : "none"}
      addOnIcon={s?.icon}
      addOnIconColor={s?.color}
    />
  );
}
