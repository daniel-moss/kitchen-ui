import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";

import { AvatarJobRequestProps, AvatarJobRequestStatus } from "./AvatarJobRequest.types";

// Status → the icon addOn: glyph + color (no rotation). Status glyphs are raw
// names (no semantic tokens for these). (See avatar-job-request.md.)
const STATUS: Record<Exclude<AvatarJobRequestStatus, "none">, { icon: string; color: string }> = {
  pending: { icon: "circle-dashed", color: "var(--violet-a9)" },
  accepted: { icon: "circle-check", color: "var(--orange-a9)" },
  finalized: { icon: "circle-check", color: "var(--jade-a9)" },
  declined: { icon: "circle-xmark", color: "var(--gray-a9)" },
};

// Avatar template for a Job Request: an object/icon avatar with the
// `job-request` semantic icon, and a status expressed as the corner icon addOn.
export default function AvatarJobRequest({
  size = "md",
  status = "none",
  className,
}: AvatarJobRequestProps) {
  const s = status === "none" ? null : STATUS[status];

  return (
    <Avatar
      type="object"
      content="icon"
      icon={semanticIcons.jobRequest}
      size={size}
      className={className}
      addOn={s ? "icon" : "none"}
      addOnIcon={s?.icon}
      addOnIconColor={s?.color}
    />
  );
}
