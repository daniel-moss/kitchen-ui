import { Fragment } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import AvatarBill from "./AvatarBill";
import { AvatarBillStatus } from "./AvatarBill.types";
import { AvatarSize } from "./Avatar.types";

const SIZES: AvatarSize[] = ["xxs", "xs", "sm", "md", "lg", "xl"];
const STATUSES: AvatarBillStatus[] = ["none", "draft", "outstanding", "overdue", "paid", "voided"];

/**
 * AvatarBill — an Avatar template: object/icon avatar with the `bill` semantic
 * icon, and a `status` shown as the corner icon addOn. xxs supports `none` only
 * (no addOns on xxs).
 */
const meta: Meta<typeof AvatarBill> = {
  title: "Components/Avatar/AvatarBill",
  component: AvatarBill,
  parameters: { layout: "centered" },
  args: { size: "md", status: "paid" },
  argTypes: {
    size: { options: SIZES, control: { type: "select" } },
    status: { options: STATUSES, control: { type: "select" } },
  },
};

export default meta;

type Story = StoryObj<typeof AvatarBill>;

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

export const Playground: Story = {};

/** Every status × size (matches the Figma set). xxs shows `none` only. */
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
              {/* xxs supports none only. */}
              {size === "xxs" && status !== "none" ? null : (
                <AvatarBill size={size} status={status} />
              )}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  ),
};
