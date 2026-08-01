import type { Meta, StoryObj } from "@storybook/react";

/**
 * Visual reference for the color tokens in `colors/`.
 * - Radix: the integrated Radix scales (radix.css).
 * - Pure:  pure white/black + adaptive alpha (pure.css).
 * - Alias: the semantic layer (alias.css).
 *
 * Swatches follow the current theme. Use the "Theme" toolbar (top of Storybook)
 * to switch between light and dark — no need to show both at once.
 */

const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";
const STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const RADIX_COLORS = [
  "gray",
  "tomato",
  "crimson",
  "pink",
  "plum",
  "violet",
  "indigo",
  "blue",
  "cyan",
  "jade",
  "teal",
  "orange",
  "amber",
  "brown",
];

const meta: Meta = {
  title: "Variables/Colors",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

/* ---------- shared building blocks ---------- */

const pageStyle: React.CSSProperties = {
  padding: "var(--size-8)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--size-9)",
  background: "var(--surface-level-first, #fff)",
};

const colorHeadingStyle: React.CSSProperties = {
  fontFamily: "var(--font-family-base)",
  fontSize: "13px",
  fontWeight: 600,
  textTransform: "capitalize",
  letterSpacing: "0.02em",
  color: "var(--text-strong, var(--gray-12))",
  margin: "0 0 var(--size-3)",
};

const groupHeadingStyle: React.CSSProperties = {
  ...colorHeadingStyle,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--text-subtle, var(--gray-11))",
};

const rowLabelStyle: React.CSSProperties = {
  fontFamily: "var(--font-family-base)",
  fontSize: "11px",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "var(--gray-11)",
};

// Neutral container; swatches inside resolve against the current theme.
const blockStyle: React.CSSProperties = {
  background: "var(--gray-2)",
  color: "var(--gray-12)",
  padding: "var(--size-5)",
  borderRadius: 10,
  border: "1px solid var(--gray-a4)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--size-4)",
};

function Swatch({ varName, label }: { varName: string; label: string }) {
  return (
    <div
      title={varName}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 0 }}
    >
      <div
        style={{
          width: "100%",
          height: 36,
          borderRadius: 6,
          background: `var(${varName})`,
          border: "1px solid var(--gray-a6)",
        }}
      />
      <span style={{ fontFamily: mono, fontSize: 10, color: "var(--gray-11)" }}>{label}</span>
    </div>
  );
}

function ScaleRow({ label, vars }: { label: string; vars: { name: string; label: string }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={rowLabelStyle}>{label}</span>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 6 }}>
        {vars.map((v) => (
          <Swatch key={v.name} varName={v.name} label={v.label} />
        ))}
      </div>
    </div>
  );
}

const solidVars = (color: string) => STEPS.map((s) => ({ name: `--${color}-${s}`, label: String(s) }));
const alphaVars = (color: string) => STEPS.map((s) => ({ name: `--${color}-a${s}`, label: `A${s}` }));

/* ---------- Radix ---------- */

export const Radix: Story = {
  render: () => (
    <div style={pageStyle}>
      {RADIX_COLORS.map((color) => (
        <section key={color}>
          <h3 style={colorHeadingStyle}>{color}</h3>
          <div style={blockStyle}>
            <ScaleRow label="Solid" vars={solidVars(color)} />
            <ScaleRow label="Alpha" vars={alphaVars(color)} />
          </div>
        </section>
      ))}
    </div>
  ),
};

/* ---------- Pure ---------- */

export const Pure: Story = {
  render: () => (
    <div style={pageStyle}>
      {(["white", "black"] as const).map((c) => (
        <section key={c}>
          <h3 style={colorHeadingStyle}>{c}</h3>
          <div style={blockStyle}>
            <ScaleRow label="Solid" vars={[{ name: `--pure-${c}`, label: c }]} />
            <ScaleRow
              label="Alpha"
              vars={STEPS.map((s) => ({ name: `--pure-${c}-a${s}`, label: `A${s}` }))}
            />
          </div>
        </section>
      ))}

      <section>
        <h3 style={colorHeadingStyle}>adaptive (--pure-a*)</h3>
        <div style={blockStyle}>
          <ScaleRow label="Alpha" vars={STEPS.map((s) => ({ name: `--pure-a${s}`, label: `A${s}` }))} />
        </div>
      </section>
    </div>
  ),
};

/* ---------- Alias ---------- */

const ALIAS_GROUPS: { group: string; tokens: string[] }[] = [
  {
    group: "Surfaces",
    tokens: [
      "--surface-level-first",
      "--surface-level-second",
      "--surface-level-third",
      "--surface-interactive-default",
      "--surface-interactive-hover",
      "--surface-interactive-press",
    ],
  },
  {
    group: "Text",
    tokens: [
      "--text-strong",
      "--text-subtle",
      "--text-placeholder",
      "--text-info",
      "--text-success",
      "--text-warning",
      "--text-error",
    ],
  },
  { group: "Base", tokens: ["--white", "--black"] },
  { group: "Shadows", tokens: ["--box-shadow-shadow-default", "--box-shadow-shadow-contrast"] },
  {
    group: "Live Collaboration",
    tokens: [
      "--live-collaboration-crimson",
      "--live-collaboration-pink",
      "--live-collaboration-plum",
      "--live-collaboration-violet",
      "--live-collaboration-indigo",
      "--live-collaboration-blue",
      "--live-collaboration-cyan",
      "--live-collaboration-teal",
      "--live-collaboration-orange",
      "--live-collaboration-amber",
    ],
  },
];

function Chip({ token }: { token: string }) {
  return (
    <div style={{ background: "var(--gray-2)", padding: 6, borderRadius: 8, border: "1px solid var(--gray-a4)" }}>
      <div
        style={{
          height: 28,
          borderRadius: 5,
          background: `var(${token})`,
          border: "1px solid var(--gray-a6)",
        }}
      />
    </div>
  );
}

export const Alias: Story = {
  render: () => (
    <div style={pageStyle}>
      <span style={rowLabelStyle}>Each token follows the current theme — switch the Theme toolbar to compare.</span>
      {ALIAS_GROUPS.map(({ group, tokens }) => (
        <section key={group}>
          <h3 style={groupHeadingStyle}>{group}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-3)" }}>
            {tokens.map((token) => (
              <div
                key={token}
                style={{
                  display: "grid",
                  gridTemplateColumns: "64px 1fr",
                  gap: "var(--size-4)",
                  alignItems: "center",
                }}
              >
                <Chip token={token} />
                <code
                  style={{
                    fontFamily: mono,
                    fontSize: "12px",
                    color: "var(--text-strong, var(--gray-12))",
                  }}
                >
                  {token}
                </code>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
};
