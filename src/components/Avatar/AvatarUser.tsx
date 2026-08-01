import Avatar from "./Avatar";
import { users } from "../../data/users";

import { AvatarUserProps } from "./AvatarUser.types";

// Avatar template for a User: a user-type (circle) avatar. All content variants
// mirror Avatar `type=user`. A primary user gets a crown icon addOn.
// (See avatar-user.md.)
export default function AvatarUser({
  size = "md",
  content = "image",
  letter = "AB",
  imageSrc,
  count = 2,
  isPrimary = false,
  className,
}: AvatarUserProps) {
  // The crown addOn is only for image/icon/letters (Avatar also blocks addOns on
  // xxs and on counter/placeholder content).
  const crown = isPrimary && (content === "image" || content === "icon" || content === "letters");

  return (
    <Avatar
      type="user"
      content={content}
      letter={letter}
      imageSrc={imageSrc ?? users[0].avatar}
      count={count}
      size={size}
      className={className}
      addOn={crown ? "icon" : "none"}
      addOnIcon="crown"
      addOnIconColor="var(--amber-10)"
    />
  );
}
