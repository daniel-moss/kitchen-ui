import { Fragment } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import AvatarJobSeries from "./AvatarJobSeries";
import { AvatarJobSeriesStatus } from "./AvatarJobSeries.types";
import { AvatarSize } from "./Avatar.types";

const SIZES: AvatarSize[] = ["xxs", "xs", "sm", "md", "lg", "xl"];
const STATUSES: AvatarJobSeriesStatus[] = ["none", "open", "closed"];

/**
 * AvatarJobSeries — an Avatar template: object/icon avatar with the `job-series`
 * semantic icon, and a `status` shown as a colored statusDot. xxs supports
 * `none` only.
 */
const meta: Meta<typeof AvatarJobSeries> = {
  title: "Components/Avatar/AvatarJobSeries",
  component: AvatarJobSeries,
  parameters: { layout: "centered" },
  args: { size: "md", status: "open" },
  argTypes: {
    size: { options: SIZES, control: { type: "select" } },
    status: { options: STATUSES, control: { type: "select" } },
  },
};

export default meta;

type Story = StoryObj<typeof AvatarJobSeries>;

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

export const Playground: Story = {};

/** Every status × size. xxs shows `none` only. */
export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div
      style={{
        display: "inline-grid",
        gridTemplateColumns: `auto repeat(${SIZES.length}, 44px)`,
        gap: "var(--size-3)",
        alignItems: "center",
        justifyItems: "center",
      }}
    >
      <span />
      {SIZES.map((s) => (
        <span key={s} style={labelStyle}>
          {s}
        </span>
      ))}
      {STATUSES.map((status) => (
        <Fragment key={status}>
          <span style={{ ...labelStyle, justifySelf: "start" }}>{status}</span>
          {SIZES.map((size) => (
            <div key={size}>
              {size === "xxs" && status !== "none" ? null : (
                <AvatarJobSeries size={size} status={status} />
              )}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  ),
};
