import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";

import { AvatarRequestProps, AvatarRequestStatus } from "./AvatarRequest.types";

// Status → the icon addOn: glyph + color (no rotation). Status glyphs are raw
// names (no semantic tokens for these).
const STATUS: Record<Exclude<AvatarRequestStatus, "none">, { icon: string; color: string }> = {
  pending: { icon: "circle-dashed", color: "var(--violet-a9)" },
  accepted: { icon: "circle-check", color: "var(--orange-a9)" },
  finalized: { icon: "circle-check", color: "var(--jade-a9)" },
  declined: { icon: "circle-xmark", color: "var(--gray-a9)" },
};

// Avatar template for a Request: an object/icon avatar with the
// `request` semantic icon, and a status expressed as the corner icon addOn.
export default function AvatarRequest({
  size = "md",
  status = "none",
  className,
}: AvatarRequestProps) {
  const s = status === "none" ? null : STATUS[status];

  return (
    <Avatar
      shape="square"
      content="icon"
      icon={semanticIcons.request}
      size={size}
      className={className}
      addOn={s ? "icon" : "none"}
      addOnIcon={s?.icon}
      addOnIconColor={s?.color}
    />
  );
}
