import clsx from "clsx";

import Avatar from "./Avatar";
import { IconPack } from "../Icon/Icon.types";
import { objectPlaceholder } from "../../data/users";

import { AvatarFileProps, AvatarFileType } from "./AvatarFile.types";

// Each file type fills the avatar with a solid scale-9 background and a
// contrasting scale-1 icon (solid weight). (See avatar-file.md.)
const VARIANT: Record<
  Exclude<AvatarFileType, "image">,
  { icon: string; iconColor: string; bg: string; pack?: IconPack }
> = {
  generic: { icon: "file", iconColor: "var(--blue-1)", bg: "var(--blue-9)" },
  imagePlaceholder: { icon: "image", iconColor: "var(--jade-1)", bg: "var(--jade-9)" },
  gif: { icon: "gif", iconColor: "var(--cyan-1)", bg: "var(--cyan-9)" },
  audio: { icon: "headphones", iconColor: "var(--amber-1)", bg: "var(--amber-9)" },
  video: { icon: "video", iconColor: "var(--violet-1)", bg: "var(--violet-9)" },
  pdf: { icon: "file-pdf", iconColor: "var(--tomato-1)", bg: "var(--tomato-9)" },
  word: { icon: "file-word", iconColor: "var(--blue-1)", bg: "var(--blue-9)" },
  spreadsheet: { icon: "table", iconColor: "var(--jade-1)", bg: "var(--jade-9)" },
  presentation: { icon: "presentation-screen", iconColor: "var(--orange-1)", bg: "var(--orange-9)" },
  markdown: { icon: "markdown", iconColor: "var(--crimson-1)", bg: "var(--crimson-9)", pack: "brand" },
  vector: { icon: "bezier-curve", iconColor: "var(--teal-1)", bg: "var(--teal-9)" },
  archive: { icon: "box-archive", iconColor: "var(--gray-1)", bg: "var(--gray-9)" },
};

// Avatar template for a File. Always renders in LIGHT mode (wrapped in
// `.light-theme`) so the scale tokens stay light even inside a dark surface.
export default function AvatarFile({ size = "md", type = "generic", imageSrc, className }: AvatarFileProps) {
  const inner =
    type === "image" ? (
      <Avatar shape="square" content="image" imageSrc={imageSrc ?? objectPlaceholder} size={size} />
    ) : (
      (() => {
        const v = VARIANT[type];
        return (
          <Avatar
            shape="square"
            content="icon"
            icon={v.icon}
            iconPack={v.pack ?? "solid"}
            iconColor={v.iconColor}
            backgroundColor={v.bg}
            size={size}
          />
        );
      })()
    );

  // `inline-flex` is REQUIRED, do not remove: the avatar is inline-flex, so a
  // default (inline/block) wrapper builds a line box around it and adds ~4px of
  // baseline gap — which made every AvatarFile row 4px too tall (e.g. 64px vs
  // the 60px spec inside a ListItem). inline-flex makes the avatar a flex item,
  // so the wrapper hugs it exactly (no line box, no gap).
  return (
    <span className={clsx("light-theme", className)} style={{ display: "inline-flex" }}>
      {inner}
    </span>
  );
}
