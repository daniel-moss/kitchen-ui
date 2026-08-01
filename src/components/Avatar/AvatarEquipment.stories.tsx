import { Fragment } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import AvatarEquipment from "./AvatarEquipment";
import { AvatarEquipmentStatus } from "./AvatarEquipment.types";
import { AvatarSize } from "./Avatar.types";

const SIZES: AvatarSize[] = ["xxs", "xs", "sm", "md", "lg", "xl"];
const STATUSES: AvatarEquipmentStatus[] = ["none", "covered", "partiallyCovered", "expired"];

/**
 * AvatarEquipment — an Avatar template: object/icon avatar with the `equipment`
 * semantic icon, and a warranty-coverage `status` shown as the corner icon
 * addOn. xxs supports `none` only (no addOns on xxs).
 */
const meta: Meta<typeof AvatarEquipment> = {
  title: "Components/Avatar/AvatarEquipment",
  component: AvatarEquipment,
  parameters: { layout: "centered" },
  args: { size: "md", status: "covered" },
  argTypes: {
    size: { options: SIZES, control: { type: "select" } },
    status: { options: STATUSES, control: { type: "select" } },
  },
};

export default meta;

type Story = StoryObj<typeof AvatarEquipment>;

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
                <AvatarEquipment size={size} status={status} />
              )}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  ),
};
