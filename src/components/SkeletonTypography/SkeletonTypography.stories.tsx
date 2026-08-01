import type { Meta, StoryObj } from "@storybook/react";

import { SkeletonTypography } from "./SkeletonTypography";
import type { SkeletonTypographyVariant } from "./SkeletonTypography.types";

/**
 * Replaces a text layer while content loads. Each variant matches the line box
 * of a text style, so swapping text for a skeleton (and back) does not shift the
 * layout. All skeletons share one 800ms pulse so they animate in sync.
 */
const meta: Meta<typeof SkeletonTypography> = {
  title: "Components/Skeleton/SkeletonTypography",
  component: SkeletonTypography,
  parameters: { layout: "centered" },
  args: {
    variant: "bodyCompact",
    width: 200,
  },
  argTypes: {
    variant: {
      control: { type: "select" },
      options: [
        "captionSM",
        "captionMD",
        "bodyCompact",
        "bodySpacious",
        "h6",
        "h5",
        "h4",
        "h3",
        "h2",
        "h1",
      ],
    },
    width: { control: { type: "text" } },
  },
};

export default meta;

type Story = StoryObj<typeof SkeletonTypography>;

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
  width: 110,
};

export const Default: Story = {};

const variants: SkeletonTypographyVariant[] = [
  "captionSM",
  "captionMD",
  "bodyCompact",
  "bodySpacious",
  "h6",
  "h5",
  "h4",
  "h3",
  "h2",
  "h1",
];

/** Every variant, with its name. The row height shows the container (line box). */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-3)", width: 320 }}>
      {variants.map((variant) => (
        <div key={variant} style={{ display: "flex", alignItems: "center", gap: "var(--size-4)" }}>
          <span style={labelStyle}>{variant}</span>
          <SkeletonTypography variant={variant} />
        </div>
      ))}
    </div>
  ),
};

/**
 * A skeleton standing in for real text, side by side, to show it matches the
 * line box. Toggle by removing the skeleton to confirm no layout shift.
 */
export const NextToText: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-2)", width: 280 }}>
      <span style={{ font: "var(--font-heading-h3)", color: "var(--text-strong)" }}>
        Walk-in cooler
      </span>
      <SkeletonTypography variant="bodyCompact" width="100%" />
      <SkeletonTypography variant="bodyCompact" width="70%" />
    </div>
  ),
};
