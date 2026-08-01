import type { Meta, StoryObj } from "@storybook/react";

import { cap, docsFrame } from "../../../stories/helpers";
import Input from "../../Input/Input";
import DateField from "./DateField";

const DATE = new Date(2026, 0, 1); // Thursday, January 1 (current year — no year shown)
const OTHER_YEAR = new Date(2027, 0, 1); // Friday, January 1, 2027

/**
 * DateField — the date field: type a date in any format (Chrono parses it) or
 * pick one in the DatePicker. The display standardizes to "Monday, January 1"
 * (the year appears only when it is not the current year). Bare — label and
 * help text come from the Input wrapper.
 */
const meta: Meta<typeof DateField> = {
  title: "Components/Fields/DateField",
  component: DateField,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: {
    isValid: true,
  },
  argTypes: {
    errorMessage: { control: { type: "text" } },
    value: { control: false },
    defaultValue: { control: false },
  },
};
export default meta;

type Story = StoryObj<typeof DateField>;

/**
 * Type a date in ANY format and blur (or press Enter) — Chrono parses it and
 * the text standardizes: try "tomorrow", "next friday", "1/15", "in 2 weeks".
 * Unparseable text reverts to the last valid value.
 */
export const Playground: Story = {
  render: (args) => (
    <div style={docsFrame}>
      <DateField {...args} defaultValue={DATE} />
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

/** Empty — no placeholder; the calendar icon on the right. */
export const Basic: Story = {
  render: () => (
    <div style={docsFrame}>
      <DateField today={DATE} />
    </div>
  ),
};

/** Filled — the standardized value + the calendar icon. */
export const Filled: Story = {
  render: () => (
    <div style={docsFrame}>
      <DateField defaultValue={DATE} today={DATE} />
    </div>
  ),
};

/** Live: click to open the DatePicker; type any format and blur to parse. */
export const OpensPicker: Story = {
  render: () => (
    <div style={docsFrame}>
      <DateField defaultValue={DATE} today={DATE} pickerLabel="Date" />
    </div>
  ),
};

/** Empty + valid states. */
export const EmptyValid: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-20)" }}>
        {row("default", <DateField />)}
        {row("hovered", <DateField className="pseudo-hover-all" />)}
        {row("active", <DateField className="pseudo-focus-within-all" />)}
        {row("disabled", <DateField disabled />)}
      </div>
    </div>
  ),
};

/** Empty + invalid states (disabled can not be invalid). */
export const EmptyInvalid: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-20)" }}>
        {row("default", <DateField isValid={false} errorMessage="Choose Date received" />)}
        {row("hovered", <DateField className="pseudo-hover-all" isValid={false} errorMessage="Choose Date received" />)}
        {row("active", <DateField className="pseudo-focus-within-all" isValid={false} errorMessage="Choose Date received" />)}
      </div>
    </div>
  ),
};

/** Filled + valid states. */
export const FilledValid: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-20)" }}>
        {row("default", <DateField defaultValue={DATE} />)}
        {row("hovered", <DateField className="pseudo-hover-all" defaultValue={DATE} />)}
        {row("active", <DateField className="pseudo-focus-within-all" defaultValue={DATE} />)}
        {row("disabled", <DateField defaultValue={DATE} disabled />)}
        {row("read-only (no calendar icon)", <DateField defaultValue={DATE} readOnly />)}
      </div>
    </div>
  ),
};

/** Filled + invalid states (disabled and read-only can not be invalid). */
export const FilledInvalid: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-20)" }}>
        {row("default", <DateField defaultValue={DATE} isValid={false} errorMessage="Error message" />)}
        {row("hovered", <DateField className="pseudo-hover-all" defaultValue={DATE} isValid={false} errorMessage="Error message" />)}
        {row("active", <DateField className="pseudo-focus-within-all" defaultValue={DATE} isValid={false} errorMessage="Error message" />)}
      </div>
    </div>
  ),
};

/** The derived "Choose [Label]" message — live, from the Input label. */
export const MissingValueMessage: Story = {
  render: () => (
    <div style={docsFrame}>
      <Input label="Date received">
        <DateField isValid={false} />
      </Input>
    </div>
  ),
};

/** The state ladder — disabled/read-only can not be invalid. */
export const Overview: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 350 }}>
      <div>
        <span style={cap}>default (subtle calendar icon)</span>
        <DateField />
      </div>
      <div>
        <span style={cap}>hover</span>
        <DateField className="pseudo-hover-all" />
      </div>
      <div>
        <span style={cap}>active</span>
        <DateField className="pseudo-focus-within-all" />
      </div>
      <div>
        <span style={cap}>filled (current year — no year shown)</span>
        <DateField defaultValue={DATE} />
      </div>
      <div>
        <span style={cap}>filled (other year)</span>
        <DateField defaultValue={OTHER_YEAR} />
      </div>
      <div>
        <span style={cap}>invalid empty</span>
        <DateField isValid={false} errorMessage="Choose Date received" />
      </div>
      <div>
        <span style={cap}>invalid filled</span>
        <DateField defaultValue={DATE} isValid={false} errorMessage="Error message" />
      </div>
      <div>
        <span style={cap}>disabled (can not be invalid)</span>
        <DateField defaultValue={DATE} disabled isValid={false} errorMessage="never shown" />
      </div>
      <div>
        <span style={cap}>read-only (no calendar icon)</span>
        <DateField defaultValue={DATE} readOnly isValid={false} errorMessage="never shown" />
      </div>
    </div>
  ),
};

/** Inside an Input: the error message and picker label derive from the label. */
export const InsideInput: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 350 }}>
      <Input label="Date received" helpText="Help text">
        <DateField defaultValue={DATE} />
      </Input>
      <Input label="Date received">
        <DateField isValid={false} />
      </Input>
    </div>
  ),
};
