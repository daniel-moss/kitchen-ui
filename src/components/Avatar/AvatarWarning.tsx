import Avatar from "./Avatar";

import { AvatarWarningProps } from "./AvatarWarning.types";

// Avatar template for a warning: an object/icon avatar with the solid warning
// glyph, in amber. Everything else (sizes, icon sizes, radius, loading) comes
// from Avatar.
export default function AvatarWarning({ size = "md", isLoading = false, className }: AvatarWarningProps) {
  return (
    <Avatar
      shape="square"
      content="icon"
      icon="triangle-exclamation"
      iconPack="solid"
      backgroundColor="var(--amber-a3)"
      iconColor="var(--amber-a11)"
      size={size}
      isLoading={isLoading}
      className={className}
    />
  );
}
