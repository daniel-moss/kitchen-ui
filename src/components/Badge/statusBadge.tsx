import { Fragment } from "react";
import type { ComponentType, CSSProperties } from "react";

import BadgeColor from "./BadgeColor";
import { BadgeColorScheme } from "./BadgeColor.types";

export type StatusBadgeSize = "sm" | "md";

export interface StatusDef {
  scheme: BadgeColorScheme;
  label: string;
  /** Solid status icon (omit for a dot). */
  icon?: string;
  /** Icon rotation in degrees. */
  rotate?: number;
  /** Show a status dot instead of an icon. */
  dot?: boolean;
}

export interface StatusBadgeProps<S extends string> {
  /** Size (sm or md). Default "md". */
  size?: StatusBadgeSize;
  /** The status. Defaults to the first one. */
  status?: S;
  /**
   * A MORE SPECIFIC name for this status, printed instead of the status's own
   * label. The colour, the icon and the meaning stay the status's.
   *
   * It exists for SUB-STATUSES: a job on hold "for parts" is still on hold, and
   * production prints the sub-status name wherever there is one
   * (`getJobStatusOrSubStatusLabel`: "return job.substatus_label ? … :
   * job.status_label"). Pass nothing and the badge reads the status's label,
   * which is what every other object does.
   */
  label?: string;
}

// Build a status-badge component from a status → { scheme, icon/dot, label } map.
// Each status renders a BadgeColor (icon-only, not dismissable, no loading).
export function createStatusBadge<M extends Record<string, StatusDef>>(statuses: M) {
  type S = Extract<keyof M, string>;
  const keys = Object.keys(statuses) as S[];

  return function StatusBadge({ size = "md", status = keys[0], label }: StatusBadgeProps<S>) {
    const s = statuses[status];
    return (
      <BadgeColor
        size={size}
        colorScheme={s.scheme}
        leftIcon={s.dot ? undefined : s.icon}
        leftIconPack="solid"
        leftIconRotate={s.rotate}
        leftDot={s.dot}
      >
        {label ?? s.label}
      </BadgeColor>
    );
  };
}

const labelStyle: CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

// Shared Matrix render: status × {sm, md}. Used by each template's stories.
export function StatusMatrix<S extends string>({
  Component,
  statuses,
}: {
  Component: ComponentType<StatusBadgeProps<S>>;
  statuses: Record<S, StatusDef>;
}) {
  const STATUSES = Object.keys(statuses) as S[];
  return (
    <div
      style={{
        display: "inline-grid",
        gridTemplateColumns: "auto auto auto",
        gap: "var(--size-3) var(--size-4)",
        alignItems: "center",
        justifyItems: "start",
      }}
    >
      <span />
      <span style={labelStyle}>sm</span>
      <span style={labelStyle}>md</span>
      {STATUSES.map((status) => (
        <Fragment key={status}>
          <span style={labelStyle}>{status}</span>
          <Component status={status} size="sm" />
          <Component status={status} size="md" />
        </Fragment>
      ))}
    </div>
  );
}
