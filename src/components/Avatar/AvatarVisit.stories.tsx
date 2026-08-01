import type { Meta, StoryObj } from "@storybook/react";

import AvatarVisit from "./AvatarVisit";
import { AvatarSize } from "./Avatar.types";

const SIZES: AvatarSize[] = ["xxs", "xs", "sm", "md", "lg", "xl"];

/**
 * AvatarVisit — an Avatar template: object/icon avatar with the `visit` semantic
 * icon. Icon-only, no statuses.
 */
const meta: Meta<typeof AvatarVisit> = {
  title: "Components/Avatar/AvatarVisit",
  component: AvatarVisit,
  parameters: { layout: "centered" },
  args: { size: "md" },
  argTypes: {
    size: { options: SIZES, control: { type: "select" } },
  },
};

export default meta;

type Story = StoryObj<typeof AvatarVisit>;

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
          <AvatarVisit size={s} />
          <span style={labelStyle}>{s}</span>
        </div>
      ))}
    </div>
  ),
};
