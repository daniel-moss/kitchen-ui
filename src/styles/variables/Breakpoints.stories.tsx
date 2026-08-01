import type { Meta, StoryObj } from "@storybook/react";

/**
 * Visual reference for the breakpoints in `breakpoints.css`.
 * Two layouts only: < 1024px = mobile, ≥ 1024px = desktop.
 * Note: CSS custom properties can't be used inside @media conditions, so media
 * queries hardcode the value: @media (min-width: 64rem) { … }.
 */

const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

const meta: Meta = {
  title: "Variables/Breakpoints",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

const pageStyle: React.CSSProperties = {
  padding: "var(--size-8)",
  background: "var(--surface-level-first, #fff)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--size-6)",
  color: "var(--text-strong, var(--gray-12))",
  fontFamily: "var(--font-family-base)",
};

export const Breakpoints: Story = {
  render: () => (
    <div style={pageStyle}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "var(--size-3)" }}>
        <code style={{ fontFamily: mono, fontSize: 13 }}>--breakpoint-desktop-up</code>
        <span style={{ fontFamily: mono, fontSize: 12, color: "var(--gray-11)" }}>64rem / 1024px</span>
      </div>

      {/* Range bar: mobile below the threshold, desktop at/above it. */}
      <div style={{ display: "flex", height: 64, borderRadius: 10, overflow: "hidden", border: "1px solid var(--gray-a6)" }}>
        <div
          style={{
            flex: "0 0 40%",
            background: "var(--gray-4)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 2,
          }}
        >
          <strong style={{ fontSize: 13 }}>mobile</strong>
          <span style={{ fontFamily: mono, fontSize: 11, color: "var(--gray-11)" }}>{"< 1024px"}</span>
        </div>
        <div
          style={{
            flex: "1 1 auto",
            background: "var(--blue-4)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 2,
            borderLeft: "2px solid var(--blue-9)",
          }}
        >
          <strong style={{ fontSize: 13 }}>desktop</strong>
          <span style={{ fontFamily: mono, fontSize: 11, color: "var(--gray-11)" }}>{"≥ 1024px"}</span>
        </div>
      </div>
    </div>
  ),
};
