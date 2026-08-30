import clsx from "clsx";
import { forwardRef } from "react";

import { Icon } from "../Icon/Icon";
import { IconSize } from "../Icon/Icon.types";

import styles from "./Avatar.module.scss";
import { AvatarProps, AvatarShape, AvatarSize } from "./Avatar.types";

type SmallSize = Exclude<AvatarSize, "xxs">; // the icon addOn is never on xxs

// Avatar box px per size (xxs→xl).
export const AVATAR_PX: Record<AvatarSize, number> = {
  xxs: 16,
  xs: 20,
  sm: 24,
  md: 28,
  lg: 32,
  xl: 36,
};

// Icon glyph px per avatar size. Same on both shapes.
const ICON_SIZE: Record<AvatarSize, IconSize> = {
  xxs: 8,
  xs: 10,
  sm: 12,
  md: 12,
  lg: 14,
  xl: 16,
};

// Letter font px per avatar size — the same on square and circle.
const LETTER_PX: Record<AvatarSize, number> = {
  xxs: 10,
  xs: 10,
  sm: 10,
  md: 12,
  lg: 12,
  xl: 14,
};

// Displayed letters: one on xxs/xs, two from sm up (both shapes).
function displayLetters(characters: string, size: AvatarSize) {
  return characters.slice(0, size === "xxs" || size === "xs" ? 1 : 2);
}

// Counter font px per avatar size (counter is not used on xxs; xxs mirrors xs).
const COUNTER_PX: Record<AvatarSize, number> = {
  xxs: 10,
  xs: 10,
  sm: 10,
  md: 12,
  lg: 12,
  xl: 14,
};

// Counter text: "+N" up to 99, "99+" above.
function formatCount(n: number) {
  return n > 99 ? "99+" : `+${n}`;
}

// Placeholder image (mesh gradient) used when no imageSrc is given — mirrors the
// object placeholder in the design.
const DEFAULT_IMAGE =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36">` +
      `<defs>` +
      `<radialGradient id="a" cx="25%" cy="20%" r="90%">` +
      `<stop offset="0" stop-color="#f4a3c2"/>` +
      `<stop offset="55%" stop-color="#b39ae0"/>` +
      `<stop offset="100%" stop-color="#7fc8e8"/>` +
      `</radialGradient>` +
      `<radialGradient id="b" cx="85%" cy="90%" r="70%">` +
      `<stop offset="0" stop-color="#ffd27f" stop-opacity="0.9"/>` +
      `<stop offset="100%" stop-color="#ffd27f" stop-opacity="0"/>` +
      `</radialGradient>` +
      `</defs>` +
      `<rect width="36" height="36" fill="url(#a)"/>` +
      `<rect width="36" height="36" fill="url(#b)"/>` +
      `</svg>`,
  );

type Notch = { cx: number; cy: number; r: number };

// Notch geometry per addOn. The notch is centered on the addOn; the transparent
// gap ring is a constant 3px for statusDot, 2px for icon. The dot notch differs
// between square (flush in the corner at every size) and circle (inset, because
// a circle's corner is inset — 0px up to sm, 1px on md, 2px on lg/xl).
// The icon notch is the same for both shapes.
const NOTCH_DOT_SQUARE: Record<AvatarSize, Notch> = {
  xxs: { cx: 13.5, cy: 13.5, r: 5.5 },
  xs: { cx: 17.5, cy: 17.5, r: 5.5 },
  sm: { cx: 21, cy: 21, r: 6 },
  md: { cx: 25, cy: 25, r: 6 },
  lg: { cx: 29, cy: 29, r: 6 },
  xl: { cx: 33, cy: 33, r: 6 },
};

const NOTCH_DOT_CIRCLE: Record<AvatarSize, Notch> = {
  xxs: { cx: 13.5, cy: 13.5, r: 5.5 },
  xs: { cx: 17.5, cy: 17.5, r: 5.5 },
  sm: { cx: 21, cy: 21, r: 6 },
  md: { cx: 24, cy: 24, r: 6 },
  lg: { cx: 27, cy: 27, r: 6 },
  xl: { cx: 31, cy: 31, r: 6 },
};

const NOTCH_ICON: Record<SmallSize, Notch> = {
  xs: { cx: 16, cy: 16, r: 7 },
  sm: { cx: 19, cy: 19, r: 8 },
  md: { cx: 22, cy: 22, r: 9 },
  lg: { cx: 26, cy: 26, r: 9 },
  xl: { cx: 29, cy: 29, r: 10 },
};

// statusDot px per size (5 on xxs/xs, 6 on sm–xl).
const DOT_SIZE: Record<AvatarSize, number> = { xxs: 5, xs: 5, sm: 6, md: 6, lg: 6, xl: 6 };

// icon addOn: box (outer) px and glyph px per size.
const ADDON_ICON_BOX: Record<SmallSize, number> = { xs: 10, sm: 12, md: 14, lg: 14, xl: 16 };
const ADDON_ICON_PX: Record<SmallSize, IconSize> = { xs: 8, sm: 10, md: 12, lg: 12, xl: 14 };

// SVG circle path (used to subtract the notch, and as the circle avatar outline).
function circlePath(cx: number, cy: number, r: number) {
  return `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
}

// Alpha mask: the avatar shape (square or circle) minus a circular notch
// (fill-rule evenodd). Filled = visible, hole = transparent, so the gap ring
// shows whatever is behind the avatar.
function avatarMaskImage(w: number, shape: AvatarShape, notch: Notch) {
  const clip = shape === "circle" ? `<circle cx="${w / 2}" cy="${w / 2}" r="${w / 2}"/>` : `<rect width="${w}" height="${w}"/>`;
  const main = shape === "circle" ? circlePath(w / 2, w / 2, w / 2) : `M 0 0 H ${w} V ${w} H 0 Z`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${w}">` +
    `<defs><clipPath id="c">${clip}</clipPath></defs>` +
    `<path fill="#000" fill-rule="evenodd" clip-path="url(#c)" d="${main} ${circlePath(notch.cx, notch.cy, notch.r)}"/>` +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function AvatarRoot(props: AvatarProps, ref: React.Ref<HTMLDivElement>) {
  const {
    size = "md",
    shape = "square",
    content = "icon",
    addOn = "none",
    icon = "diamonds-4",
    iconPack = "solid",
    iconClassName,
    iconColor,
    backgroundColor,
    characters = "AB",
    imageSrc = DEFAULT_IMAGE,
    imageAlt = "",
    count = 2,
    addOnIcon = "diamonds-4",
    addOnIconPack = "solid",
    addOnIconColor,
    addOnIconRotate = 0,
    statusDotColor,
    isLoading = false,
    className,
    style,
    ...rest
  } = props;

  // Surface background override (e.g. AvatarFile's scale-9 fill).
  let surfaceStyle: React.CSSProperties | undefined = backgroundColor
    ? { background: backgroundColor }
    : undefined;
  let addOnEl: React.ReactNode = null;

  // AddOns are not allowed on counter content nor while loading; the `icon`
  // addOn is additionally not allowed on xxs.
  const addOnAllowed =
    !isLoading && addOn !== "none" && content !== "counter" && !(addOn === "icon" && size === "xxs");

  if (addOnAllowed) {
    const notch =
      addOn === "statusDot"
        ? shape === "circle"
          ? NOTCH_DOT_CIRCLE[size]
          : NOTCH_DOT_SQUARE[size]
        : NOTCH_ICON[size as SmallSize];
    const w = AVATAR_PX[size];
    const mask = avatarMaskImage(w, shape, notch);
    const maskSize = `${w}px ${w}px`;
    surfaceStyle = {
      ...surfaceStyle,
      maskImage: mask,
      WebkitMaskImage: mask,
      maskSize,
      WebkitMaskSize: maskSize,
      maskRepeat: "no-repeat",
      WebkitMaskRepeat: "no-repeat",
    };

    // Both addOns position from the notch center (top = cy − s/2, left = cx − s/2)
    // — for circle dots the notch is inset, so corner offsets do not work.
    if (addOn === "statusDot") {
      const d = DOT_SIZE[size];
      addOnEl = (
        <span
          className={styles.dot}
          style={{ top: notch.cy - d / 2, left: notch.cx - d / 2, width: d, height: d, background: statusDotColor }}
        />
      );
    } else {
      const box = ADDON_ICON_BOX[size as SmallSize];
      addOnEl = (
        <span
          className={styles.addOnIcon}
          style={{
            top: notch.cy - box / 2,
            left: notch.cx - box / 2,
            width: box,
            height: box,
            color: addOnIconColor,
            transform: addOnIconRotate ? `rotate(${addOnIconRotate}deg)` : undefined,
          }}
        >
          <Icon icon={addOnIcon} pack={addOnIconPack} size={ADDON_ICON_PX[size as SmallSize]} />
        </span>
      );
    }
  }

  return (
    <div
      className={clsx(styles.base, styles[`${shape}Shape`], styles[`${size}Size`], className)}
      style={style}
      ref={ref}
      {...rest}
    >
      {isLoading ? (
        // Loading: empty pulsing shape; content and addOns are suppressed.
        <span className={clsx(styles.surface, styles.loading)} />
      ) : (
        <>
          <span className={styles.surface} style={surfaceStyle}>
            {content === "image" ? (
              <img className={styles.image} src={imageSrc} alt={imageAlt} />
            ) : (
              <span className={styles.content}>
                {content === "letters" && (
                  <span className={styles.letter} style={{ fontSize: LETTER_PX[size] }}>
                    {displayLetters(characters, size)}
                  </span>
                )}
                {content === "counter" && (
                  <span className={styles.counter} style={{ fontSize: COUNTER_PX[size] }}>
                    {formatCount(count)}
                  </span>
                )}
                {content === "icon" && (
                  <span
                    className={clsx(styles.iconContent, { [styles.iconCircle]: shape === "circle" })}
                    style={iconColor ? { color: iconColor } : undefined}
                  >
                    {shape === "circle" ? (
                      // Circle icon is locked: always the `user` glyph, regular, gray-a9.
                      <Icon icon="user" pack="regular" size={ICON_SIZE[size]} />
                    ) : (
                      <Icon icon={icon} pack={iconPack} size={ICON_SIZE[size]} className={iconClassName} />
                    )}
                  </span>
                )}
              </span>
            )}
          </span>
          {addOnEl}
        </>
      )}
    </div>
  );
}

const Avatar = forwardRef(AvatarRoot);

export default Avatar;
