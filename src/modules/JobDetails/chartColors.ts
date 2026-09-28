// The two Timesheet charts' color rotations (Figma "Color Order" —
// 24616-81508 for Time distribution, 24616-81594 for Work timeline).
// "Colors have to be applied in this order. If the number of assignees / days
// is more than the number of available colors, the colors repeat themselves."

import { AvatarDayColorScheme } from "../../components/Avatar/AvatarDay.types";
import { AvatarLiveColor } from "../../components/Avatar/AvatarLive.types";

/**
 * A chart color — the live-collaboration set, which both rotations draw from.
 * It is narrowed to the colors AvatarDay also has, so one name can drive the
 * bar, the AvatarLive ring and the AvatarDay tile.
 */
export type ChartColor = AvatarLiveColor & AvatarDayColorScheme;

/** Time distribution — one color per tech, in the sorted list's order. */
export const TECH_COLORS: ChartColor[] = [
  "crimson",
  "teal",
  "amber",
  "indigo",
  "orange",
  "pink",
  "cyan",
  "plum",
  "blue",
  "violet",
];

/** Work timeline — one color per day, in chronological order. */
export const DAY_COLORS: ChartColor[] = [
  "violet",
  "orange",
  "blue",
  "pink",
  "amber",
  "cyan",
  "plum",
  "teal",
  "indigo",
  "crimson",
];

/** The color at `index`, wrapping around when the list runs out. */
export const colorAt = (colors: ChartColor[], index: number) => colors[index % colors.length];

/** A chart color → the CSS variable the bars and rings use. */
export const liveVar = (color: ChartColor) => `var(--live-collaboration-${color})`;
