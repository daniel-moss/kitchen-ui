import type { Meta, StoryObj } from "@storybook/react";

import { Skeleton } from "./Skeleton";

/**
 * Loading placeholder (a pulsing block). Skeletons mimic the shape of the
 * content they stand in for: text → bar, icon/avatar → circle, image/card →
 * rectangle. All skeletons share one 800ms pulse so they animate in sync.
 */
const meta: Meta<typeof Skeleton> = {
  title: "Components/Skeleton/Skeleton",
  component: Skeleton,
  parameters: { layout: "centered" },
  args: {
    width: 160,
    height: 12,
    circle: false,
  },
  argTypes: {
    width: { control: { type: "text" } },
    height: { control: { type: "text" } },
    circle: { control: { type: "boolean" } },
    borderRadius: { control: { type: "text" } },
  },
};

export default meta;

type Story = StoryObj<typeof Skeleton>;

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

export const Default: Story = {};

/**
 * The shapes a skeleton stands in for: a text bar, a circle (icon / avatar),
 * and a rounded rectangle (image / card).
 */
export const Shapes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "var(--size-8)", alignItems: "flex-end" }}>
      {[
        { label: "Text bar", node: <Skeleton width={160} height={10} /> },
        { label: "Circle", node: <Skeleton width={32} height={32} circle /> },
        { label: "Rectangle", node: <Skeleton width={120} height={72} borderRadius="var(--border-radius-2)" /> },
      ].map(({ label, node }) => (
        <div
          key={label}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-3)" }}
        >
          {node}
          <span style={labelStyle}>{label}</span>
        </div>
      ))}
    </div>
  ),
};

/**
 * A multi-line text placeholder: stacked 10px bars with the last line shorter,
 * the way a paragraph skeleton reads.
 */
export const TextBlock: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-2)", width: 280 }}>
      <Skeleton width="100%" height={10} />
      <Skeleton width="100%" height={10} />
      <Skeleton width="60%" height={10} />
    </div>
  ),
};
