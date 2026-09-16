import { Fragment } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import AvatarSeries from "./AvatarSeries";
import { AvatarSeriesStatus } from "./AvatarSeries.types";
import { AvatarSize } from "./Avatar.types";

const SIZES: AvatarSize[] = ["xxs", "xs", "sm", "md", "lg", "xl"];
const STATUSES: AvatarSeriesStatus[] = ["none", "open", "closed"];

/**
 * AvatarSeries — an Avatar template: object/icon avatar with the `series`
 * semantic icon, and a `status` shown as a colored statusDot. xxs supports
 * `none` only.
 */
const meta: Meta<typeof AvatarSeries> = {
  title: "Components/Avatar/AvatarSeries",
  component: AvatarSeries,
  parameters: { layout: "centered" },
  args: { size: "md", status: "open" },
  argTypes: {
    size: { options: SIZES, control: { type: "select" } },
    status: { options: STATUSES, control: { type: "select" } },
  },
};

export default meta;

type Story = StoryObj<typeof AvatarSeries>;

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
                <AvatarSeries size={size} status={status} />
              )}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  ),
};
