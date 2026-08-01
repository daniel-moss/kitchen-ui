import type { Meta, StoryObj } from "@storybook/react";

/**
 * Visual reference for the box-shadow tokens in `shadows.css`.
 * 7 sizes (xs–3xl) × 4 directions (down/up/left/right) × default/contrast.
 * The shadow color is theme-aware (--box-shadow-shadow-default / -contrast):
 * "default" reads on light surfaces, "contrast" on dark/colored surfaces.
 */

const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

const SIZES = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"];
const DIRECTIONS = ["down", "up", "left", "right"] as const;
const VARIANTS = [
  { key: "", label: "default" },
  { key: "-contrast", label: "contrast" },
] as const;

const meta: Meta = {
  title: "Variables/Shadows",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

const pageStyle: React.CSSProperties = {
  padding: "var(--size-8)",
  background: "var(--surface-level-first, #fff)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--size-9)",
};

const headingStyle: React.CSSProperties = {
  fontFamily: "var(--font-family-base)",
  fontSize: 13,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--text-strong, var(--gray-12))",
  margin: "0 0 var(--size-4)",
};

function ShadowRow({ direction, variant }: { direction: string; variant: { key: string; label: string } }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-4)" }}>
      <span style={{ fontFamily: mono, fontSize: 11, color: "var(--gray-11)" }}>{variant.label}</span>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${SIZES.length}, 1fr)`,
          gap: "var(--size-6)",
        }}
      >
        {SIZES.map((size) => (
          <div key={size} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-3)" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 10,
                background: variant.key === "-contrast" ? "var(--gray-12)" : "var(--surface-level-second)",
                boxShadow: `var(--box-shadow-${size}-${direction}${variant.key})`,
              }}
            />
            <span style={{ fontFamily: mono, fontSize: 11, color: "var(--gray-11)" }}>{size}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const Shadows: Story = {
  render: () => (
    <div style={pageStyle}>
      {DIRECTIONS.map((direction) => (
        <section key={direction}>
          <h3 style={headingStyle}>{direction}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-5)" }}>
            {VARIANTS.map((variant) => (
              <ShadowRow key={variant.label} direction={direction} variant={variant} />
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
};
