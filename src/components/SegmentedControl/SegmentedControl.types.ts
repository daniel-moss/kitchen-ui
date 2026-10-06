import { HTMLAttributes, ReactNode } from "react";

import { SegmentOrientation, SegmentSize } from "./Segment.types";

export interface SegmentedControlProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "role"> {
  /** Segment children, each with a `value`. Two to six of them. */
  children: ReactNode;

  /** Selected segment's value (controlled). */
  value?: string;
  /** Uncontrolled initial selection. Defaults to the first segment. */
  defaultValue?: string;
  /** Called with the newly selected segment's value. */
  onChange?: (value: string) => void;

  /** Passed to every Segment; a Segment's own `size` still wins. Default "lg". */
  size?: SegmentSize;
  /**
   * Passed to every Segment; a Segment's own `orientation` still wins.
   * "vertical" belongs with `isFullWidth`. Default "horizontal".
   */
  orientation?: SegmentOrientation;

  /**
   * Stretch the track to its container; the segments share the width equally.
   * The mode for a narrow surface — a panel, a drawer, a dialog. Default false,
   * where every segment hugs its label and the control hugs the row.
   */
  isFullWidth?: boolean;

  className?: string;
}
