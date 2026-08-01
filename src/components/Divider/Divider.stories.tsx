import type { Meta, StoryObj } from "@storybook/react";

import { cap, docsFrame } from "../../stories/helpers";
import { Divider } from "./Divider";
import { DividerContrast } from "./Divider.types";

const CONTRASTS: DividerContrast[] = ["low", "medium", "high"];

// Docs examples: elements centered and stacked vertically, --size-20 (80px) apart.
const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--size-20)",
};
const labeledItem: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "var(--size-2)",
};

const rowLabel: React.CSSProperties = {
  font: "var(--font-body-500-compact)",
  color: "var(--text-strong)",
  padding: "var(--size-2) 0",
};

/**
 * Divider — a 1px separator line (2px when dashed), horizontal or vertical, in
 * three contrasts. Pure presentation. Vertical dividers need a parent that gives
 * them a height.
 */
const meta: Meta<typeof Divider> = {
  title: "Components/Divider",
  component: Divider,
  parameters: { layout: "fullscreen" },
  args: { orientation: "horizontal", contrast: "low", dashed: false, padding: 0 },
  argTypes: {
    orientation: { options: ["horizontal", "vertical"], control: { type: "inline-radio" } },
    contrast: { options: CONTRASTS, control: { type: "inline-radio" } },
    dashed: { control: { type: "boolean" } },
    padding: { control: { type: "number" } },
    className: { table: { disable: true } },
  },
};

export default meta;

type Story = StoryObj<typeof Divider>;

/** Interactive divider. */
export const Playground: Story = {
  parameters: { layout: "centered" },
  render: (args) =>
    args.orientation === "vertical" ? (
      <div style={{ display: "flex", height: 80 }}>
        <Divider {...args} />
      </div>
    ) : (
      <div style={{ width: 300 }}>
        <Divider {...args} />
      </div>
    ),
};

/** A horizontal divider separating two blocks of content. */
export const Hero: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <div style={stack}>
        <div style={{ width: 320, maxWidth: "100%" }}>
          <div style={rowLabel}>Section one</div>
          <Divider />
          <div style={rowLabel}>Section two</div>
        </div>
      </div>
    </div>
  ),
};

/** Horizontal fills the width; vertical fills the height of its parent. */
export const Orientation: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <div style={stack}>
        <div style={labeledItem}>
          <span style={cap}>horizontal</span>
          <div style={{ width: 300 }}>
            <Divider contrast="high" />
          </div>
        </div>
        <div style={labeledItem}>
          <span style={cap}>vertical</span>
          <div style={{ display: "flex", height: 60 }}>
            <Divider orientation="vertical" contrast="high" />
          </div>
        </div>
      </div>
    </div>
  ),
};

/** Three contrasts: low, medium, high. */
export const Contrast: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <div style={stack}>
        {CONTRASTS.map((c) => (
          <div key={c} style={labeledItem}>
            <span style={cap}>{c}</span>
            <div style={{ width: 300 }}>
              <Divider contrast={c} />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

/** The dashed line — 2px round dots, two contrast steps darker than solid. */
export const Dashed: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <div style={stack}>
        {CONTRASTS.map((c) => (
          <div key={c} style={labeledItem}>
            <span style={cap}>{c}</span>
            <div style={{ width: 300 }}>
              <Divider contrast={c} dashed />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

/** Padding spaces / insets the line on all sides (shown in outlined boxes). */
export const Padded: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const box: React.CSSProperties = { outline: "1px solid var(--blue-a6)", background: "var(--blue-a2)" };
    return (
      <div style={docsFrame}>
        <div style={stack}>
          <div style={labeledItem}>
            <span style={cap}>padding: 12px 0 — spaces above/below</span>
            <div style={{ width: 240, ...box }}>
              <Divider orientation="horizontal" contrast="high" padding="12px 0" />
            </div>
          </div>
          <div style={labeledItem}>
            <span style={cap}>padding: 12 — also insets the ends</span>
            <div style={{ width: 240, ...box }}>
              <Divider orientation="horizontal" contrast="high" padding={12} />
            </div>
          </div>
          <div style={labeledItem}>
            <span style={cap}>vertical, padding: 12</span>
            <div style={{ display: "flex", height: 80, ...box }}>
              <Divider orientation="vertical" contrast="high" padding={12} />
            </div>
          </div>
        </div>
      </div>
    );
  },
};
