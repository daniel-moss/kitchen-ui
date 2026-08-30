import clsx from "clsx";

import Avatar, { AVATAR_PX } from "./Avatar";
import { users } from "../../data/users";

import styles from "./AvatarUser.module.scss";
import { AvatarUserProps } from "./AvatarUser.types";

// Avatar template for a User: a circle avatar. The user icon, the letter counts
// and the corner radius all come from Avatar `shape="circle"`. AvatarUser adds
// the two things that are only meaningful for a user: the empty-slot
// placeholder and the primary-contact crown.
export default function AvatarUser({
  size = "md",
  content = "image",
  characters = "AB",
  imageSrc,
  count = 2,
  isPrimary = false,
  isLoading = false,
  className,
}: AvatarUserProps) {
  // Loading: the user-icon variant, pulsing (not Avatar's empty shape).
  if (isLoading) {
    return (
      <Avatar shape="circle" content="icon" size={size} className={clsx(styles.loading, className)} />
    );
  }

  // Placeholder: an empty slot — the user icon with no fill, inside a dashed
  // ring drawn over the avatar.
  if (content === "placeholder") {
    const px = AVATAR_PX[size];
    return (
      <span className={clsx(styles.placeholder, className)}>
        <svg className={styles.ring} viewBox={`0 0 ${px} ${px}`} aria-hidden="true">
          <circle
            cx={px / 2}
            cy={px / 2}
            r={(px - 1) / 2}
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        </svg>
        <Avatar shape="circle" content="icon" size={size} backgroundColor="transparent" />
      </span>
    );
  }

  // The crown addOn is only for image/letters/icon (Avatar also blocks icon
  // addOns on xxs).
  const crown = isPrimary && content !== "counter";

  return (
    <Avatar
      shape="circle"
      content={content}
      characters={characters}
      imageSrc={imageSrc ?? users[0].avatar}
      count={count}
      size={size}
      className={className}
      addOn={crown ? "icon" : "none"}
      addOnIcon="crown"
      addOnIconColor="var(--amber-a10)"
    />
  );
}
