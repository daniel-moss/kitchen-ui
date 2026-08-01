import { Fragment } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import BadgeColor from "./BadgeColor";
import { BadgeColorScheme } from "./BadgeColor.types";
import { BadgeSize } from "./Badge.types";

const SIZES: BadgeSize[] = ["sm", "md", "lg"];
const SCHEMES: BadgeColorScheme[] = [
  "gray",
  "brown",
  "amber",
  "orange",
  "tomato",
  "crimson",
  "violet",
  "blue",
  "cyan",
  "jade",
];

/**
 * BadgeColor — a colored Badge, re-skinned per color scheme (tinted fill,
 * colored border/text/icon). Same sizes and dismiss behavior as Badge; left
 * slot is icon-only, no loading state. All alpha scales, so it tints on any
 * surface and flips in dark mode.
 */
const meta: Meta<typeof BadgeColor> = {
  title: "Components/Badge/BadgeColor",
  component: BadgeColor,
  parameters: { layout: "centered" },
  args: {
    size: "md",
    colorScheme: "blue",
    children: "Badge",
    leftIcon: "diamonds-4",
    isDismissable: true,
  },
  argTypes: {
    size: { options: SIZES, control: { type: "inline-radio" } },
    colorScheme: { options: SCHEMES, control: { type: "select" } },
    children: { control: { type: "text" } },
    leftIcon: { control: { type: "text" } },
    isDismissable: { control: { type: "boolean" } },
  },
};

export default meta;

type Story = StoryObj<typeof BadgeColor>;

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

export const Playground: Story = {};

/** Every scheme (md, icon + dismiss). */
export const Schemes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-3)", alignItems: "flex-start" }}>
      {SCHEMES.map((scheme) => (
        <div key={scheme} style={{ display: "flex", alignItems: "center", gap: "var(--size-4)" }}>
          <span style={{ ...labelStyle, width: 64 }}>{scheme}</span>
          <BadgeColor colorScheme={scheme} leftIcon="diamonds-4" isDismissable>
            Badge
          </BadgeColor>
        </div>
      ))}
    </div>
  ),
};

/** Sizes × slot / dismiss for one scheme. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const cols: { label: string; props: Parameters<typeof BadgeColor>[0] }[] = [
      { label: "none", props: {} },
      { label: "icon", props: { leftIcon: "diamonds-4" } },
      { label: "dismiss", props: { leftIcon: "diamonds-4", isDismissable: true } },
    ];
    return (
      <div
        style={{
          display: "inline-grid",
          gridTemplateColumns: `auto repeat(${cols.length}, auto)`,
          gap: "var(--size-4)",
          alignItems: "center",
          justifyItems: "start",
        }}
      >
        <span />
        {cols.map((c) => (
          <span key={c.label} style={labelStyle}>
            {c.label}
          </span>
        ))}
        {SIZES.map((size) => (
          <Fragment key={size}>
            <span style={labelStyle}>{size}</span>
            {cols.map((c) => (
              <BadgeColor key={c.label} colorScheme="blue" size={size} {...c.props}>
                Badge
              </BadgeColor>
            ))}
          </Fragment>
        ))}
      </div>
    );
  },
};
