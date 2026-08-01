import type { Meta, StoryObj } from "@storybook/react";

/**
 * Visual reference for the border-radius tokens in `border-radius.css`.
 * Numeric suffix ≈ 4px scale (1 = 4px); underscore = half step (1_5 = 6px).
 */

const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

const RADII: { name: string; px: string }[] = [
  { name: "0", px: "0" },
  { name: "0_5", px: "2px" },
  { name: "1", px: "4px" },
  { name: "1_5", px: "6px" },
  { name: "2", px: "8px" },
  { name: "2_5", px: "10px" },
  { name: "3", px: "12px" },
  { name: "3_5", px: "14px" },
  { name: "4", px: "16px" },
  { name: "5", px: "20px" },
  { name: "6", px: "24px" },
  { name: "full", px: "50%" },
];

const meta: Meta = {
  title: "Variables/Border Radius",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

const pageStyle: React.CSSProperties = {
  padding: "var(--size-8)",
  background: "var(--surface-level-first, #fff)",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
  gap: "var(--size-6)",
};

export const BorderRadius: Story = {
  render: () => (
    <div style={pageStyle}>
      {RADII.map(({ name, px }) => (
        <div
          key={name}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-3)" }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: "var(--blue-9)",
              borderRadius: `var(--border-radius-${name})`,
            }}
          />
          <div style={{ textAlign: "center" }}>
            <code style={{ fontFamily: mono, fontSize: 12, color: "var(--text-strong, var(--gray-12))" }}>
              --border-radius-{name}
            </code>
            <div style={{ fontFamily: mono, fontSize: 11, color: "var(--gray-11)" }}>{px}</div>
          </div>
        </div>
      ))}
    </div>
  ),
};
