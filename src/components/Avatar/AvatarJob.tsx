import Avatar from "./Avatar";
import { semanticIcons } from "../../styles/semanticIcons";

import { AvatarJobProps, AvatarJobStatus } from "./AvatarJob.types";

// Status → the icon addOn: glyph + color + rotation. Status glyphs are raw names
// (no semantic tokens for these). (See avatar-job.md.)
const STATUS: Record<
  Exclude<AvatarJobStatus, "none">,
  { icon: string; color: string; rotate: number }
> = {
  draft: { icon: "circle-dashed", color: "var(--gray-a9)", rotate: 0 },
  unscheduled: { icon: "circle-dashed", color: "var(--violet-a9)", rotate: 0 },
  upcoming: { icon: "circle-half-stroke", color: "var(--blue-a9)", rotate: 180 },
  pastDue: { icon: "circle-exclamation", color: "var(--tomato-a9)", rotate: 0 },
  active: { icon: "circle-play", color: "var(--jade-a9)", rotate: 0 },
  quickPaused: { icon: "circle-pause", color: "var(--amber-a9)", rotate: 0 },
  onHoldExternal: { icon: "circle-stop", color: "var(--crimson-a9)", rotate: 0 },
  onHoldInternal: { icon: "circle-stop", color: "var(--brown-a9)", rotate: 0 },
  completed: { icon: "circle-check", color: "var(--orange-a9)", rotate: 0 },
  finalized: { icon: "circle-check", color: "var(--jade-a9)", rotate: 0 },
  cancelled: { icon: "circle-xmark", color: "var(--gray-a9)", rotate: 0 },
};

// Avatar template for a Job: an object/icon avatar with the `job` semantic icon,
// and a status expressed as the corner icon addOn.
export default function AvatarJob({ size = "md", status = "none", className }: AvatarJobProps) {
  const s = status === "none" ? null : STATUS[status];

  return (
    <Avatar
      shape="square"
      content="icon"
      icon={semanticIcons.job}
      size={size}
      className={className}
      addOn={s ? "icon" : "none"}
      addOnIcon={s?.icon}
      addOnIconColor={s?.color}
      addOnIconRotate={s?.rotate}
    />
  );
}
