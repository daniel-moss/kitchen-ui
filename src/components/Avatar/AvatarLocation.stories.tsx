import type { Meta, StoryObj } from "@storybook/react";

import AvatarLocation from "./AvatarLocation";
import { AvatarSize } from "./Avatar.types";

const SIZES: AvatarSize[] = ["xxs", "xs", "sm", "md", "lg", "xl"];

/**
 * AvatarLocation — an Avatar template: object/icon avatar with the `location`
 * semantic icon. Icon-only, no statuses.
 */
const meta: Meta<typeof AvatarLocation> = {
  title: "Components/Avatar/AvatarLocation",
  component: AvatarLocation,
  parameters: { layout: "centered" },
  args: { size: "md" },
  argTypes: {
    size: { options: SIZES, control: { type: "select" } },
  },
};

export default meta;

type Story = StoryObj<typeof AvatarLocation>;

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

export const Playground: Story = {};

/** All sizes. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--size-4)" }}>
      {SIZES.map((s) => (
        <div
          key={s}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-3)" }}
        >
          <AvatarLocation size={s} />
          <span style={labelStyle}>{s}</span>
        </div>
      ))}
    </div>
  ),
};
