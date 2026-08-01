import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { cap, docsFrame } from "../../../stories/helpers";
import Input from "../../Input/Input";
import TextField from "./TextField";

/**
 * TextField — a single line of text: optional prefix, suffix, value and an
 * opt-in placeholder (the DS default is none — informative text goes to the
 * hint or the help text). The field is bare — label and help text come from
 * the Input wrapper.
 */
const meta: Meta<typeof TextField> = {
  title: "Components/Fields/TextField",
  component: TextField,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: {
    keyboard: "text",
    isValid: true,
  },
  argTypes: {
    keyboard: { options: ["text", "email", "url", "tel", "numeric"], control: { type: "inline-radio" } },
    prefix: { control: { type: "text" } },
    suffix: { control: { type: "text" } },
    errorMessage: { control: { type: "text" } },
  },
};
export default meta;

type Story = StoryObj<typeof TextField>;

export const Playground: Story = {
  render: (args) => (
    <div style={docsFrame}>
      <TextField {...args} />
    </div>
  ),
};

// ---- docs-page stories (one per Figma Documentation example) ---------------

const row = (label: string, field: React.ReactNode) => (
  <div>
    <span style={cap}>{label}</span>
    {field}
  </div>
);

const col = { display: "flex", flexDirection: "column", gap: "var(--size-20)" } as const;

/** Empty — the bare single-line field. */
export const Basic: Story = {
  render: () => (
    <div style={docsFrame}>
      <TextField />
    </div>
  ),
};

// The placeholder example is a REAL masked time input — the mask is the
// consumer's wiring (TextField stays bare): digits only, the colon inserts
// itself, capped at 4 digits.
function MaskedTimeField() {
  const [time, setTime] = useState("");
  return (
    <TextField
      placeholder="00:00"
      keyboard="numeric"
      value={time}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
        setTime(digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits);
      }}
    />
  );
}

/** The opt-in placeholder — live: type into the masked field. */
export const WithPlaceholder: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        {row("with placeholder (a live time mask)", <MaskedTimeField />)}
        {row("without (the default)", <TextField />)}
      </div>
    </div>
  ),
};

/** Filled out. */
export const FilledOut: Story = {
  render: () => (
    <div style={docsFrame}>
      <TextField defaultValue="Value" />
    </div>
  ),
};

/** A subtle prefix before the value. */
export const WithPrefix: Story = {
  render: () => (
    <div style={docsFrame}>
      <TextField prefix="NET" defaultValue="30" />
    </div>
  ),
};

/** A subtle suffix after the value. */
export const WithSuffix: Story = {
  render: () => (
    <div style={docsFrame}>
      <TextField suffix="hr" defaultValue="1" />
    </div>
  ),
};

/** Prefix and suffix together. */
export const WithBoth: Story = {
  render: () => (
    <div style={docsFrame}>
      <TextField prefix="every" suffix="minutes" defaultValue="30" />
    </div>
  ),
};

/** Empty + valid states. */
export const EmptyValid: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        {row("default", <TextField />)}
        {row("hovered", <TextField className="pseudo-hover-all" />)}
        {row("active", <TextField className="pseudo-focus-within-all" />)}
        {row("disabled", <TextField disabled />)}
      </div>
    </div>
  ),
};

/** Empty + invalid states (disabled can not be invalid). */
export const EmptyInvalid: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        {row("default", <TextField isValid={false} errorMessage="Enter Company name" />)}
        {row("hovered", <TextField className="pseudo-hover-all" isValid={false} errorMessage="Enter Company name" />)}
        {row("active", <TextField className="pseudo-focus-within-all" isValid={false} errorMessage="Enter Company name" />)}
      </div>
    </div>
  ),
};

/** Filled + valid states. */
export const FilledValid: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        {row("default", <TextField defaultValue="Value" />)}
        {row("hovered", <TextField className="pseudo-hover-all" defaultValue="Value" />)}
        {row("active", <TextField className="pseudo-focus-within-all" defaultValue="Value" />)}
        {row("disabled", <TextField defaultValue="Value" disabled />)}
        {row("read-only", <TextField defaultValue="Value" readOnly />)}
      </div>
    </div>
  ),
};

/** Filled + invalid states (disabled and read-only can not be invalid). */
export const FilledInvalid: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        {row("default", <TextField defaultValue="Value" isValid={false} errorMessage="Error message" />)}
        {row("hovered", <TextField className="pseudo-hover-all" defaultValue="Value" isValid={false} errorMessage="Error message" />)}
        {row("active", <TextField className="pseudo-focus-within-all" defaultValue="Value" isValid={false} errorMessage="Error message" />)}
      </div>
    </div>
  ),
};

/** The derived "Enter [Label]" message — live, from the Input label. */
export const MissingValueMessage: Story = {
  render: () => (
    <div style={docsFrame}>
      <Input label="Company name">
        <TextField isValid={false} />
      </Input>
    </div>
  ),
};

/** The keyboard variants — live on a phone (type/inputMode attributes). */
export const Keyboards: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        {row('text (default)', <TextField keyboard="text" />)}
        {row('email — email-format data', <TextField keyboard="email" />)}
        {row('url — URL-format data', <TextField keyboard="url" />)}
        {row('tel — phone numbers', <TextField keyboard="tel" />)}
        {row('numeric — phone extensions, digit-only data', <TextField keyboard="numeric" />)}
      </div>
    </div>
  ),
};

/** The state ladder — empty/filled × valid/invalid, plus disabled/read-only. */
export const Overview: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 350 }}>
      <div>
        <span style={cap}>default</span>
        <TextField />
      </div>
      <div>
        <span style={cap}>hover</span>
        <TextField className="pseudo-hover-all" />
      </div>
      <div>
        <span style={cap}>active</span>
        <TextField className="pseudo-focus-within-all" />
      </div>
      <div>
        <span style={cap}>filled</span>
        <TextField defaultValue="Value" />
      </div>
      <div>
        <span style={cap}>invalid empty</span>
        <TextField isValid={false} errorMessage="Enter Name" />
      </div>
      <div>
        <span style={cap}>invalid filled</span>
        <TextField defaultValue="Value" isValid={false} errorMessage="Error message" />
      </div>
      <div>
        <span style={cap}>disabled (can not be invalid)</span>
        <TextField defaultValue="Value" disabled isValid={false} errorMessage="never shown" />
      </div>
      <div>
        <span style={cap}>read-only (can not be invalid)</span>
        <TextField defaultValue="Value" readOnly isValid={false} errorMessage="never shown" />
      </div>
    </div>
  ),
};

/** Prefix / suffix — subtle texts inside the field (the docs examples). */
export const Affixes: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 350 }}>
      <TextField prefix="NET" defaultValue="30" keyboard="numeric" />
      <TextField suffix="hr" defaultValue="2" keyboard="numeric" />
      <TextField prefix="every" suffix="minutes" defaultValue="30" keyboard="numeric" />
    </div>
  ),
};

/** Inside an Input: the default error message derives from the label. */
export const InsideInput: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 350 }}>
      <Input label="Name" helpText="Help text">
        <TextField />
      </Input>
      <Input label="Name">
        <TextField isValid={false} />
      </Input>
      <Input label="Label">
        <TextField defaultValue="Value" readOnly />
      </Input>
    </div>
  ),
};
