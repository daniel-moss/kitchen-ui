import Avatar from "../components/Avatar/Avatar";
import { AvatarSize } from "../components/Avatar/Avatar.types";
import HoverTooltip from "../components/Tooltip/HoverTooltip";

import corrigo from "../assets/sources/corrigo.svg";
import ecotrakDark from "../assets/sources/ecotrak-dark.svg";
import ecotrakLight from "../assets/sources/ecotrak-light.svg";
import resq from "../assets/sources/resq.svg";
import roopairsDark from "../assets/sources/roopairs-dark.svg";
import roopairsLight from "../assets/sources/roopairs-light.svg";
import serviceChannelDark from "../assets/sources/service-channel-dark.svg";
import serviceChannelLight from "../assets/sources/service-channel-light.svg";

import styles from "./sources.module.scss";

// The companies a job request can come from, and their logos. There is no
// AvatarSource component — a source avatar IS an Avatar, square, filled with an
// image. What a call site cannot know, and what this file owns, is three
// things: which sources exist, that a logo is artwork prepared by hand per
// theme, and that the avatar carries the source's name in a tooltip.
//
// The artwork is exported from the Figma "Source avatar" documentation page
// (30876-134767) as a 100×100 SVG tile: the brand background fills the tile and
// the Avatar's rounded corners clip it.

export interface SourceLogo {
  /** The company's name, as it is written in the product and in the tooltip. */
  name: string;
  /** Artwork for the light theme. */
  light: string;
  /**
   * Artwork for the dark theme. Absent when the brand tile works unchanged in
   * both — Corrigo and ResQ export byte-identical artwork, so they keep one
   * file instead of two copies that could drift apart.
   */
  dark?: string;
}

/** Keyed by the job source's id, as the database stores it. */
export const SOURCE_LOGOS: Record<string, SourceLogo> = {
  roopairs: { name: "Roopairs", light: roopairsLight, dark: roopairsDark },
  "service-channel": { name: "ServiceChannel", light: serviceChannelLight, dark: serviceChannelDark },
  corrigo: { name: "Corrigo", light: corrigo },
  // Ecotrak's tile inverts between themes — dark tile on light, light on dark.
  ecotrak: { name: "Ecotrak", light: ecotrakLight, dark: ecotrakDark },
  resq: { name: "ResQ", light: resq },
};

export interface SourceAvatarProps {
  /** A key of `SOURCE_LOGOS` — "corrigo", "service-channel", … */
  source: string;
  /** Avatar size. Default "md". */
  size?: AvatarSize;
  /**
   * Show the source's name in a tooltip. Default true.
   *
   * Roopairs is a mobile Safari PWA, where there is no hover — so on touch the
   * tooltip only appears if `tapToShow` is set, and that swallows the tap.
   * Leave `tapToShow` off inside a row the user is meant to tap.
   */
  showTooltip?: boolean;
  /** Let a tap reveal the tooltip on touch devices. Default false. */
  tapToShow?: boolean;
  className?: string;
}

/**
 * A job source's logo: an `Avatar`, square, `content="image"`, with the
 * artwork picked by theme and the source's name in a tooltip.
 */
export default function SourceAvatar({
  source,
  size = "md",
  showTooltip = true,
  tapToShow = false,
  className,
}: SourceAvatarProps) {
  const logo = SOURCE_LOGOS[source];
  if (logo == null) return null;

  // The logo is decorative: the tooltip and the row's own text carry the name,
  // so an alt would only repeat them.
  const tile = (src: string) => (
    <Avatar size={size} shape="square" content="image" imageSrc={src} imageAlt="" className={className} />
  );

  // `display: none` already removes the hidden artwork from the accessibility
  // tree, so neither copy needs aria-hidden.
  const avatar =
    logo.dark == null ? (
      tile(logo.light)
    ) : (
      <>
        <span className={styles.lightOnly}>{tile(logo.light)}</span>
        <span className={styles.darkOnly}>{tile(logo.dark)}</span>
      </>
    );

  if (!showTooltip) return avatar;

  return (
    <HoverTooltip text={logo.name} tapToShow={tapToShow}>
      {avatar}
    </HoverTooltip>
  );
}
