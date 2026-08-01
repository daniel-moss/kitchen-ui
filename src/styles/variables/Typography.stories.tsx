import type { Meta, StoryObj } from "@storybook/react";
import { useLayoutEffect, useRef, useState } from "react";

/**
 * Visual reference for the typography tokens in `typography.css`.
 * Each text style is a set of three paired tokens applied together:
 *   font: var(--font-<name>);
 *   letter-spacing: var(--letter-spacing-<name>);
 *   font-feature-settings: var(--feature-settings-<name>);
 * (the same thing the `font` SCSS mixin does).
 *
 * The parameters shown for each token are read live from the rendered element
 * (getComputedStyle), so they always reflect the real resolved values.
 */

const PREVIEW = "The quick brown fox jumps over the lazy dog";
const GLYPHS = "0123456789@*#</|\\>-_—=+()&^%$!?,.`~[]{};:\"\"・∙•";

const GROUPS: { group: string; names: string[] }[] = [
  {
    group: "Body",
    names: [
      "body-400-compact",
      "body-400-compact-tabular",
      "body-400-spacious",
      "body-500-compact",
      "body-500-compact-tabular",
      "body-500-spacious",
    ],
  },
  {
    group: "Caption",
    names: ["caption-small-400", "caption-small-500", "caption-medium-400", "caption-medium-500"],
  },
  {
    group: "Heading",
    names: ["heading-h1", "heading-h2", "heading-h3", "heading-h4", "heading-h5", "heading-h6"],
  },
];

const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

// Apply the three paired tokens for a named text style.
const previewStyle = (name: string): React.CSSProperties => ({
  font: `var(--font-${name})`,
  letterSpacing: `var(--letter-spacing-${name})`,
  fontFeatureSettings: `var(--feature-settings-${name})`,
  color: "var(--text-strong, var(--gray-12))",
  margin: 0,
});

interface Resolved {
  size: string;
  lineHeight: string;
  weight: string;
  letterSpacing: string;
  featureSettings: string;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt
        style={{
          fontFamily: "var(--font-family-base)",
          fontSize: "11px",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "var(--text-subtle, var(--gray-10))",
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          margin: 0,
          fontFamily: mono,
          fontSize: "12px",
          color: "var(--text-strong, var(--gray-12))",
        }}
      >
        {value}
      </dd>
    </>
  );
}

function Specimen({ name }: { name: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [info, setInfo] = useState<Resolved | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const cs = getComputedStyle(ref.current);
    setInfo({
      size: cs.fontSize,
      lineHeight: cs.lineHeight,
      weight: cs.fontWeight,
      letterSpacing: cs.letterSpacing,
      featureSettings: cs.fontFeatureSettings,
    });
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(220px, 260px) 1fr",
        gap: "var(--size-8)",
        padding: "var(--size-6) 0",
        borderTop: "1px solid var(--gray-a4, rgba(0,0,0,0.08))",
        alignItems: "start",
      }}
    >
      {/* Metadata column */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-4)" }}>
        <code
          style={{
            fontFamily: mono,
            fontSize: "12px",
            color: "var(--text-strong, var(--gray-12))",
            wordBreak: "break-all",
          }}
        >
          --font-{name}
        </code>
        {info && (
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              columnGap: "var(--size-4)",
              rowGap: "var(--size-2)",
              margin: 0,
            }}
          >
            <Field label="Size" value={info.size} />
            <Field label="Line" value={info.lineHeight} />
            <Field label="Weight" value={info.weight} />
            <Field label="Tracking" value={info.letterSpacing} />
          </dl>
        )}
      </div>

      {/* Preview column */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-3)", minWidth: 0 }}>
        <p ref={ref} style={previewStyle(name)}>
          {PREVIEW}
          <br />
          {GLYPHS}
        </p>
        {info && (
          <code
            style={{
              fontFamily: mono,
              fontSize: "11px",
              color: "var(--text-subtle, var(--gray-10))",
              wordBreak: "break-word",
            }}
          >
            features: {info.featureSettings}
          </code>
        )}
      </div>
    </div>
  );
}

const meta: Meta = {
  title: "Variables/Typography",
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj;

// Name matches the title's last segment so Storybook hoists this single story
// to one sidebar leaf (no extra "Typography" folder).
export const All: Story = {
  name: "Typography",
  render: () => (
    <div
      style={{
        maxWidth: 980,
        padding: "var(--size-8)",
        background: "var(--surface-level-first, #fff)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--size-9)",
      }}
    >
      {GROUPS.map(({ group, names }) => (
        <section key={group}>
          <h2
            style={{
              fontFamily: "var(--font-family-base)",
              fontSize: "13px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-subtle, var(--gray-11))",
              margin: "0 0 var(--size-2)",
            }}
          >
            {group}
          </h2>
          {names.map((name) => (
            <Specimen key={name} name={name} />
          ))}
        </section>
      ))}
    </div>
  ),
};
