import type { Meta, StoryObj } from "@storybook/react";

import { Icon } from "./Icon";
import { IconPack, IconSize } from "./Icon.types";

const SIZES: IconSize[] = [8, 10, 12, 14, 16, 18, 20, 24];

const meta: Meta<typeof Icon> = {
  title: "Components/Icon",
  component: Icon,
  parameters: {
    layout: "centered",
  },
  args: {
    icon: "house",
    size: 14,
    pack: "regular",
    container: "fixedHeight",
  },
  argTypes: {
    size: {
      options: SIZES,
      control: { type: "select" },
    },
    isLoading: { control: { type: "boolean" } },
    pack: {
      options: ["regular", "solid", "brand", "custom", "custom-duotone"],
      control: { type: "select" },
    },
    container: {
      options: ["fixedHeight", "square"],
      control: { type: "inline-radio" },
    },
    className: { control: false },
  },
};

export default meta;

type Story = StoryObj<typeof Icon>;

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

// A tinted box so the container's width/height are visible.
const boxStyle: React.CSSProperties = {
  background: "var(--blue-a4)",
  outline: "1px solid var(--blue-a7)",
};

export const Default: Story = {};

/**
 * The full size scale: 8, 10, 12, 14, 16, 18, 20, 24 px. Aligned on their
 * baseline so the growth is easy to compare.
 */
export const Sizes: Story = {
  argTypes: { size: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--size-6)", alignItems: "flex-end" }}>
      {SIZES.map((s) => (
        <div
          key={s}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-3)" }}
        >
          <Icon {...args} size={s} />
          <span style={labelStyle}>{s}</span>
        </div>
      ))}
    </div>
  ),
};

/**
 * The same icon in each pack. "regular" and "solid" are the classic pack (one
 * family, weight picks the style); "brand", "custom" and "custom-duotone" each
 * use their own font. Custom packs only contain the kit icons, so they use
 * different icon names.
 */
export const Packs: Story = {
  argTypes: { pack: { control: false }, icon: { control: false } },
  render: (args) => {
    const cells: { label: string; pack: IconPack; icon: string }[] = [
      { label: "regular", pack: "regular", icon: "house" },
      { label: "solid", pack: "solid", icon: "house" },
      { label: "brand", pack: "brand", icon: "github" },
      { label: "custom", pack: "custom", icon: "solid-priority-high" },
      { label: "custom-duotone", pack: "custom-duotone", icon: "duotone-solid-priority-medium" },
    ];

    return (
      <div style={{ display: "flex", gap: "var(--size-6)", alignItems: "flex-end" }}>
        {cells.map((c) => (
          <div
            key={c.label}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-3)" }}
          >
            <Icon {...args} pack={c.pack} icon={c.icon} />
            <span style={labelStyle}>{c.label}</span>
          </div>
        ))}
      </div>
    );
  },
};

/**
 * Loading state: the icon is replaced by a filled "circle" placeholder in
 * --gray-a3, pulsing in sync with SkeletonTypography. Shown across the size
 * scale.
 */
export const Loading: Story = {
  argTypes: { size: { control: false }, isLoading: { control: false } },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--size-6)", alignItems: "flex-end" }}>
      {SIZES.map((s) => (
        <div
          key={s}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-3)" }}
        >
          <Icon {...args} size={s} isLoading />
          <span style={labelStyle}>{s}</span>
        </div>
      ))}
    </div>
  ),
};

/**
 * "fixedHeight" keeps the height at the icon size and lets the width follow the
 * glyph. "square" is a fixed box (size + 2px at this size). The tinted box shows
 * the container bounds.
 */
export const Containers: Story = {
  argTypes: { container: { control: false } },
  render: (args) => {
    const cells: { label: string; container: "fixedHeight" | "square"; note: string }[] = [
      { label: "fixedHeight", container: "fixedHeight", note: "height fixed, width adapts" },
      { label: "square", container: "square", note: "fixed width & height" },
    ];

    return (
      <div style={{ display: "flex", gap: "var(--size-8)", alignItems: "flex-start" }}>
        {cells.map((c) => (
          <div
            key={c.label}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-3)" }}
          >
            <Icon {...args} container={c.container} icon="wrench-simple" style={boxStyle} />
            <span style={labelStyle}>{c.label}</span>
            <span style={{ ...labelStyle, color: "var(--text-subtle)" }}>{c.note}</span>
          </div>
        ))}
      </div>
    );
  },
};
