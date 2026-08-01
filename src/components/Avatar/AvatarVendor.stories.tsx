import { Fragment } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import AvatarVendor from "./AvatarVendor";
import { AvatarVendorStatus } from "./AvatarVendor.types";
import { AvatarSize } from "./Avatar.types";

const SIZES: AvatarSize[] = ["xxs", "xs", "sm", "md", "lg", "xl"];
const STATUSES: AvatarVendorStatus[] = ["none", "active", "inactive"];

/**
 * AvatarVendor — an Avatar template: object avatar with the `vendor` semantic
 * icon (or an image), and a `status` shown as the corner icon addOn. xxs
 * supports `none` only.
 */
const meta: Meta<typeof AvatarVendor> = {
  title: "Components/Avatar/AvatarVendor",
  component: AvatarVendor,
  parameters: { layout: "centered" },
  args: { size: "md", content: "icon", status: "active" },
  argTypes: {
    size: { options: SIZES, control: { type: "select" } },
    content: { options: ["icon", "image"], control: { type: "inline-radio" } },
    status: { options: STATUSES, control: { type: "select" } },
    imageSrc: { if: { arg: "content", eq: "image" } },
  },
};

export default meta;

type Story = StoryObj<typeof AvatarVendor>;

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

export const Playground: Story = {};

/** Icon content: every status × size. Plus an image row. xxs shows `none` only. */
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
                <AvatarVendor size={size} status={status} />
              )}
            </div>
          ))}
        </Fragment>
      ))}
      <span style={{ ...labelStyle, justifySelf: "start" }}>image</span>
      {SIZES.map((size) => (
        <div key={size}>
          <AvatarVendor size={size} content="image" />
        </div>
      ))}
    </div>
  ),
};
