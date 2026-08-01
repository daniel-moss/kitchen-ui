import { Fragment } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { docsFrame } from "../../stories/helpers";
import Label from "./Label";
import { LabelVariant } from "./Label.types";

type ConditionOption = "none" | "optional" | "readOnly";

type StoryArgs = {
  children: string;
  variant: LabelVariant;
  condition: ConditionOption;
  hintTrigger: boolean;
};

const VARIANTS: LabelVariant[] = ["subtle", "default"];
const cap: React.CSSProperties = { font: "var(--font-caption-medium-500)", color: "var(--text-subtle)" };

/**
 * Label — a form field label. Two variants (subtle for input fields / default
 * for checkboxes, toggles, radio items), an optional condition ("(optional)" /
 * "(read-only)"), and an optional hint trigger (info icon).
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Label",
  component: Label,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: {
    children: "Label",
    variant: "default",
    condition: "none",
    hintTrigger: false,
  },
  argTypes: {
    children: { control: { type: "text" } },
    variant: { options: VARIANTS, control: { type: "inline-radio" } },
    condition: { options: ["none", "optional", "readOnly"], control: { type: "inline-radio" } },
    hintTrigger: { control: { type: "boolean" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

// Labels are tiny — the docs previews center them (like the Figma page).
const centered = { display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-20)" } as const;

export const Playground: Story = {
  render: ({ children, variant, condition, hintTrigger }) => (
    <div style={docsFrame}>
      <div style={centered}>
        <Label variant={variant} condition={condition === "none" ? undefined : condition} hintTrigger={hintTrigger}>
          {children}
        </Label>
      </div>
    </div>
  ),
};

// ---- docs-page stories (one per Figma Documentation example) ---------------

/** A bare subtle label. */
export const Basic: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={centered}>
        <Label variant="subtle">Label</Label>
      </div>
    </div>
  ),
};

/** The parts: text + optional condition caption + optional hint trigger. */
export const Parts: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={centered}>
        <Label variant="subtle">Label</Label>
        <Label variant="subtle" hintTrigger>
          Label
        </Label>
        <Label variant="subtle" condition="optional">
          Label
        </Label>
        <Label variant="subtle" condition="optional" hintTrigger>
          Label
        </Label>
      </div>
    </div>
  ),
};

/** subtle (input fields) vs default (checkboxes, toggles, radio items). */
export const Variants: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={centered}>
        <Label variant="subtle">Subtle</Label>
        <Label variant="default">Default</Label>
      </div>
    </div>
  ),
};

/** The three condition captions: optional, read-only, and custom copy. */
export const Conditions: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={centered}>
        <Label variant="subtle" condition="optional">
          Label
        </Label>
        <Label variant="subtle" condition="readOnly">
          Label
        </Label>
        <Label variant="subtle" condition="(if applicable)">
          Label
        </Label>
      </div>
    </div>
  ),
};

/** In a narrow container the text wraps; caption + trigger stay on line 1. */
export const Wrapping: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={centered}>
        <div style={{ width: 280 }}>
          <Label variant="subtle" condition="optional" hintTrigger>
            Very long label which doesn’t fit 1 line
          </Label>
        </div>
      </div>
    </div>
  ),
};

/** Every variant across the condition / hint-trigger combinations. */
export const Overview: Story = {
  // Not frame-wrapped — keeps Storybook's centering.
  parameters: { controls: { disable: true }, layout: "centered" },
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "auto auto", columnGap: "var(--size-10)", rowGap: "var(--size-4)", alignItems: "center" }}>
      {VARIANTS.map((v) => (
        <span key={v} style={cap}>
          {v}
        </span>
      ))}
      {([
        { condition: undefined, hintTrigger: false },
        { condition: undefined, hintTrigger: true },
        { condition: "optional", hintTrigger: false },
        { condition: "optional", hintTrigger: true },
        { condition: "readOnly", hintTrigger: false },
        { condition: "readOnly", hintTrigger: true },
      ] as const).map((combo, i) => (
        <Fragment key={i}>
          {VARIANTS.map((v) => (
            <Label key={v} variant={v} condition={combo.condition} hintTrigger={combo.hintTrigger}>
              Label
            </Label>
          ))}
        </Fragment>
      ))}
    </div>
  ),
};
