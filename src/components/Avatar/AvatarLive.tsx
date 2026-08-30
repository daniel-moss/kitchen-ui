import clsx from "clsx";
import { CSSProperties } from "react";

import Avatar from "./Avatar";
import { AvatarSize } from "./Avatar.types";

import styles from "./AvatarLive.module.scss";
import { AvatarLiveProps, AvatarLiveSize } from "./AvatarLive.types";

// The ring is 2px with a 2px gap on every side, so the avatar inside is exactly
// two size steps smaller than the outer box (md 28 → xs 20, lg 32 → sm 24,
// xl 36 → md 28). That is also why live letters look smaller: they are the
// inner avatar's own letter size, and the inner avatar shows one letter at xs.
const INNER_SIZE: Record<AvatarLiveSize, AvatarSize> = { md: "xs", lg: "sm", xl: "md" };

// Avatar template for a live collaborator: a circle avatar inside a colored
// collaboration ring.
export default function AvatarLive({
  size = "md",
  content = "image",
  color = "crimson",
  characters = "AB",
  imageSrc,
  count = 2,
  className,
}: AvatarLiveProps) {
  // The counter is the group's overflow slot — a plain circle counter at the
  // full size, with no ring at all.
  if (content === "counter") {
    return <Avatar shape="circle" content="counter" size={size} count={count} className={className} />;
  }

  return (
    <span
      className={clsx(styles.ring, className)}
      style={{ "--avatar-live-ring": `var(--live-collaboration-${color})` } as CSSProperties}
    >
      <Avatar
        shape="circle"
        content={content}
        size={INNER_SIZE[size]}
        characters={characters}
        imageSrc={imageSrc}
      />
    </span>
  );
}
