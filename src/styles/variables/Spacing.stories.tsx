import type { Meta, StoryObj } from "@storybook/react";

/**
 * Visual reference for the spacing/size tokens in `spacing.css` (the `--size-*`
 * scale). Numeric suffix ≈ 4px scale (4 = 16px); underscore = fraction
 * (2_5 = 10px). Used for padding, margin, gap, and fixed element dimensions.
 */

const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

const SIZES: { name: string; px: string }[] = [
  { name: "0", px: "0" },
  { name: "px", px: "1px" },
  { name: "0_25", px: "1px" },
  { name: "0_5", px: "2px" },
  { name: "1", px: "4px" },
  { name: "1_25", px: "5px" },
  { name: "1_5", px: "6px" },
  { name: "2", px: "8px" },
  { name: "2_5", px: "10px" },
  { name: "3", px: "12px" },
  { name: "3_5", px: "14px" },
  { name: "4", px: "16px" },
  { name: "4_5", px: "18px" },
  { name: "5", px: "20px" },
  { name: "5_5", px: "22px" },
  { name: "6", px: "24px" },
  { name: "6_5", px: "26px" },
  { name: "7", px: "28px" },
  { name: "7_5", px: "30px" },
  { name: "8", px: "32px" },
  { name: "8_5", px: "34px" },
  { name: "9", px: "36px" },
  { name: "10", px: "40px" },
  { name: "11", px: "44px" },
  { name: "12", px: "48px" },
  { name: "13", px: "52px" },
  { name: "14", px: "56px" },
  { name: "16", px: "64px" },
  { name: "18", px: "72px" },
  { name: "20", px: "80px" },
  { name: "24", px: "96px" },
  { name: "26", px: "104px" },
  { name: "28", px: "112px" },
  { name: "32", px: "128px" },
  { name: "36", px: "144px" },
  { name: "40", px: "160px" },
  { name: "44", px: "176px" },
  { name: "48", px: "192px" },
  { name: "52", px: "208px" },
  { name: "56", px: "224px" },
  { name: "60", px: "240px" },
  { name: "62", px: "248px" },
  { name: "64", px: "256px" },
  { name: "72", px: "288px" },
  { name: "80", px: "320px" },
  { name: "96", px: "384px" },
  { name: "110", px: "440px" },
];

const meta: Meta = {
  title: "Variables/Spacing",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

const pageStyle: React.CSSProperties = {
  padding: "var(--size-8)",
  background: "var(--surface-level-first, #fff)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--size-2)",
};

export const Spacing: Story = {
  render: () => (
    <div style={pageStyle}>
      {SIZES.map(({ name, px }) => (
        <div key={name} style={{ display: "grid", gridTemplateColumns: "140px 56px 1fr", alignItems: "center", gap: "var(--size-4)" }}>
          <code style={{ fontFamily: mono, fontSize: 12, color: "var(--text-strong, var(--gray-12))" }}>
            --size-{name}
          </code>
          <span style={{ fontFamily: mono, fontSize: 11, color: "var(--gray-11)", textAlign: "right" }}>{px}</span>
          <div style={{ height: 14, width: `var(--size-${name})`, background: "var(--blue-9)", borderRadius: 2 }} />
        </div>
      ))}
    </div>
  ),
};
