import clsx from "clsx";
import type { CSSProperties } from "react";

import AvatarLive from "./AvatarLive";
import AvatarUser from "./AvatarUser";
import { AvatarLiveColor, AvatarLiveSize } from "./AvatarLive.types";
import { SkeletonTypography } from "../SkeletonTypography/SkeletonTypography";
// Circular at module level (Tooltip renders an AvatarGroup) — safe: all three
// are hoisted function declarations, only called at render time.
import HoverTooltip from "../Tooltip/HoverTooltip";
import TruncatingText from "../Tooltip/TruncatingText";

import styles from "./AvatarGroup.module.scss";
import { AvatarGroupItem, AvatarGroupProps, AvatarGroupSize } from "./AvatarGroup.types";

const AVATAR_PX: Record<AvatarGroupSize, number> = { xs: 20, sm: 24, md: 28, lg: 32, xl: 36 };

// Group-mask geometry per size: [avatar Ø, notch Ø, overlap-from-right].
const MASK: Record<AvatarGroupSize, [number, number, number]> = {
  xs: [20, 24, 4],
  sm: [24, 30, 5],
  md: [28, 34, 5],
  lg: [32, 38, 7],
  xl: [36, 42, 5],
};

// Distinct live ring colors, assigned in order (max 10 per group). Hues are
// interleaved on purpose — neighbors must contrast (crimson next to pink was
// too close to tell apart).
const RING_PALETTE: AvatarLiveColor[] = [
  "crimson",
  "teal",
  "violet",
  "orange",
  "blue",
  "pink",
  "cyan",
  "plum",
  "amber",
  "indigo",
];

// Inline group mask: the avatar circle MINUS a notch bitten from its right, so
// the next avatar nests with a gap ring. Uses an SVG <mask> (white keep, black
// remove) — NOT fill-rule evenodd (which would leave a stray crescent).
function groupMaskImage(size: AvatarGroupSize) {
  const [avatar, notch, ov] = MASK[size];
  const r = avatar / 2;
  const nr = notch / 2;
  const cy = avatar / 2;
  const cxn = avatar - ov + nr;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${avatar} ${avatar}">` +
    `<defs><mask id="m">` +
    `<circle cx="${avatar / 2}" cy="${cy}" r="${r}" fill="#fff"/>` +
    `<circle cx="${cxn}" cy="${cy}" r="${nr}" fill="#000"/>` +
    `</mask></defs>` +
    `<rect width="${avatar}" height="${avatar}" fill="#000" mask="url(#m)"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

type CounterItem = { counter: true; count: number; names: string[]; hidden: AvatarGroupItem[] };
type RenderItem = AvatarGroupItem | CounterItem;

function isCounter(item: RenderItem): item is CounterItem {
  return "counter" in item;
}

function renderAvatar(item: RenderItem, size: AvatarGroupSize, isLoading: boolean) {
  // Loading: the pulsing user avatar for every slot (kind/content unknown yet).
  if (isLoading) {
    return <AvatarUser size={size} isLoading />;
  }
  if (isCounter(item)) {
    return <AvatarUser size={size} content="counter" count={item.count} />;
  }
  if (item.kind === "live") {
    // Live avatars exist at md/lg/xl only (see AvatarGroupLiveItem); a group
    // sized below that falls back to the smallest live size.
    const liveSize: AvatarLiveSize = size === "xs" || size === "sm" ? "md" : size;
    return (
      <AvatarLive
        size={liveSize}
        content={item.content ?? "image"}
        imageSrc={item.imageSrc}
        characters={item.characters}
        color={item.ringColor}
      />
    );
  }
  return (
    <AvatarUser
      size={size}
      content={item.content ?? "image"}
      imageSrc={item.imageSrc}
      characters={item.characters}
    />
  );
}

// Groups AvatarUser and live avatars. See avatar-group.md.
export default function AvatarGroup({
  variation = "inline",
  size = "md",
  items,
  max,
  isLoading = false,
  className,
}: AvatarGroupProps) {
  // 1. Truncate: the overflow becomes a counter avatar in the last slot.
  let render: RenderItem[] = items;
  if (max != null && max > 0 && items.length > max) {
    const shown = items.slice(0, max - 1);
    const hidden = items.slice(max - 1);
    render = [
      ...shown,
      { counter: true, count: hidden.length, names: hidden.map((i) => i.name ?? "").filter(Boolean), hidden },
    ];
  }

  // 2. Assign distinct ring colors to live avatars (in order).
  let liveIdx = 0;
  render = render.map((it) => {
    if (!isCounter(it) && it.kind === "live") {
      const ringColor = it.ringColor ?? RING_PALETTE[liveIdx % RING_PALETTE.length];
      liveIdx += 1;
      return { ...it, ringColor };
    }
    return it;
  });

  if (variation === "stack") {
    return (
      <div className={clsx(styles.stack, className)}>
        {render.map((it, i) => (
          <div key={i} className={styles.row}>
            {renderAvatar(it, size, isLoading)}
            {isLoading ? (
              <SkeletonTypography variant="bodyCompact" width={96} />
            ) : isCounter(it) ? (
              // The overflow line: hovering it reveals the hidden users as an
              // avatar-stack tooltip (the names alone may not fit the width).
              <HoverTooltip variant="avatarGroup" items={it.hidden} className={styles.counterLine}>
                <span className={styles.name}>{it.names.join(", ")}</span>
              </HoverTooltip>
            ) : (
              // A truncated name shows the full name in a tooltip on hover.
              <TruncatingText text={it.name ?? ""} className={styles.name} />
            )}
          </div>
        ))}
      </div>
    );
  }

  // inline
  const px = AVATAR_PX[size];
  const step = px - (size === "lg" ? 4 : 2);
  const width = (render.length - 1) * step + px;

  return (
    <div className={clsx(styles.inline, className)} style={{ width, height: px }}>
      {render.map((it, i) => {
        const isLast = i === render.length - 1;
        const style: CSSProperties = { left: i * step, width: px, height: px, zIndex: i };
        if (!isLast) {
          const mask = groupMaskImage(size);
          const maskSize = `${px}px ${px}px`;
          Object.assign(style, {
            maskImage: mask,
            WebkitMaskImage: mask,
            maskSize,
            WebkitMaskSize: maskSize,
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
          });
        }
        return (
          <span key={i} className={styles.slot} style={style}>
            {renderAvatar(it, size, isLoading)}
          </span>
        );
      })}
    </div>
  );
}
