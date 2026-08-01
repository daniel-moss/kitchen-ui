import { Fragment } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import AvatarWarranty from "./AvatarWarranty";
import { AvatarWarrantyStatus } from "./AvatarWarranty.types";
import { AvatarSize } from "./Avatar.types";

const SIZES: AvatarSize[] = ["xxs", "xs", "sm", "md", "lg", "xl"];
const STATUSES: AvatarWarrantyStatus[] = ["none", "active", "upcoming", "expired"];

/**
 * AvatarWarranty — an Avatar template: object/icon avatar with the `warranty`
 * semantic icon, and a `status` shown as the corner icon addOn. xxs supports
 * `none` only.
 */
const meta: Meta<typeof AvatarWarranty> = {
  title: "Components/Avatar/AvatarWarranty",
  component: AvatarWarranty,
  parameters: { layout: "centered" },
  args: { size: "md", status: "active" },
  argTypes: {
    size: { options: SIZES, control: { type: "select" } },
    status: { options: STATUSES, control: { type: "select" } },
  },
};

export default meta;

type Story = StoryObj<typeof AvatarWarranty>;

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
                <AvatarWarranty size={size} status={status} />
              )}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  ),
};
