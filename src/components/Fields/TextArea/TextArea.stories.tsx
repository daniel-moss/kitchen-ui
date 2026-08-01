import type { Meta, StoryObj } from "@storybook/react";

import { cap, docsFrame } from "../../../stories/helpers";
import Input from "../../Input/Input";
import TextArea from "./TextArea";

const LONG =
  "Before starting any work, verify the equipment details, including the model and serial number, to ensure " +
  "you have the correct parts and service history. If the equipment is under warranty, confirm coverage before " +
  "proceeding with repairs. Always follow safety protocols—disconnect power, shut off gas if applicable, and " +
  "allow the unit to cool down before handling any components.";

/**
 * TextArea — paragraphs of text: min 4 rows, grows with the content, a clear
 * (×) button whenever filled. The field is bare — label and help text come
 * from the Input wrapper.
 */
const meta: Meta<typeof TextArea> = {
  title: "Components/Fields/TextArea",
  component: TextArea,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: {
    isValid: true,
    clearable: true,
  },
  argTypes: {
    errorMessage: { control: { type: "text" } },
    clearPromptLabel: { control: { type: "text" } },
  },
};
export default meta;

type Story = StoryObj<typeof TextArea>;

/** The clear (×) button opens the confirm Prompt. */
export const Playground: Story = {
  render: (args) => (
    <div style={docsFrame}>
      <TextArea {...args} defaultValue={LONG} clearPromptLabel="Reason for call" />
    </div>
  ),
};

// ---- docs-page stories (one per Figma Documentation example) ---------------

const FILLED =
  "The walk-in cooler is not holding temperature. The compressor runs constantly " +
  "and the unit reads 45\u00b0F overnight. Ice is building up on the evaporator coil.";

const row = (label: string, field: React.ReactNode) => (
  <div>
    <span style={cap}>{label}</span>
    {field}
  </div>
);

const col = { display: "flex", flexDirection: "column", gap: "var(--size-20)" } as const;

/** Filled — grows with the content. */
export const Basic: Story = {
  render: () => (
    <div style={docsFrame}>
      <TextArea defaultValue={FILLED} clearPromptLabel="Reason for call" />
    </div>
  ),
};

/** Empty — no placeholder, min 4 rows. */
export const Empty: Story = {
  render: () => (
    <div style={docsFrame}>
      <TextArea />
    </div>
  ),
};

/** Live: the clear (×) — hover for its tooltip, click for the confirm Prompt. */
export const WithClear: Story = {
  render: () => (
    <div style={docsFrame}>
      <TextArea defaultValue={FILLED} clearPromptLabel="Reason for call" />
    </div>
  ),
};

/** Live: type to see the field expand — no inner scroll, no max height. */
export const Grows: Story = {
  render: () => (
    <div style={docsFrame}>
      <TextArea defaultValue={LONG} clearPromptLabel="Reason for call" />
    </div>
  ),
};

/** Empty + valid states. */
export const EmptyValid: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        {row("default", <TextArea />)}
        {row("hovered", <TextArea className="pseudo-hover-all" />)}
        {row("active", <TextArea className="pseudo-focus-within-all" />)}
        {row("disabled", <TextArea disabled />)}
      </div>
    </div>
  ),
};

/** Empty + invalid states (disabled can not be invalid). */
export const EmptyInvalid: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        {row("default", <TextArea isValid={false} errorMessage="Provide Reason for call" />)}
        {row("hovered", <TextArea className="pseudo-hover-all" isValid={false} errorMessage="Provide Reason for call" />)}
        {row("active", <TextArea className="pseudo-focus-within-all" isValid={false} errorMessage="Provide Reason for call" />)}
      </div>
    </div>
  ),
};

/** Filled + valid states. */
export const FilledValid: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        {row("default", <TextArea defaultValue={FILLED} />)}
        {row("hovered", <TextArea className="pseudo-hover-all" defaultValue={FILLED} />)}
        {row("active", <TextArea className="pseudo-focus-within-all" defaultValue={FILLED} />)}
        {row("disabled", <TextArea defaultValue={FILLED} disabled />)}
        {row("read-only (no clear button)", <TextArea defaultValue={FILLED} readOnly />)}
      </div>
    </div>
  ),
};

/** Filled + invalid states (disabled and read-only can not be invalid). */
export const FilledInvalid: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        {row("default", <TextArea defaultValue={FILLED} isValid={false} errorMessage="Error message" />)}
        {row("hovered", <TextArea className="pseudo-hover-all" defaultValue={FILLED} isValid={false} errorMessage="Error message" />)}
        {row("active", <TextArea className="pseudo-focus-within-all" defaultValue={FILLED} isValid={false} errorMessage="Error message" />)}
      </div>
    </div>
  ),
};

/** The derived "Provide [Label]" message — live, from the Input label. */
export const MissingValueMessage: Story = {
  render: () => (
    <div style={docsFrame}>
      <Input label="Reason for call">
        <TextArea isValid={false} />
      </Input>
    </div>
  ),
};

/** The state ladder — min 4 rows; disabled/read-only can not be invalid. */
export const Overview: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 350 }}>
      <div>
        <span style={cap}>default (min 4 rows)</span>
        <TextArea />
      </div>
      <div>
        <span style={cap}>hover</span>
        <TextArea className="pseudo-hover-all" />
      </div>
      <div>
        <span style={cap}>active</span>
        <TextArea className="pseudo-focus-within-all" />
      </div>
      <div>
        <span style={cap}>filled (clear button)</span>
        <TextArea defaultValue="Value" />
      </div>
      <div>
        <span style={cap}>invalid empty</span>
        <TextArea isValid={false} errorMessage="Provide Reason for call" />
      </div>
      <div>
        <span style={cap}>invalid filled</span>
        <TextArea defaultValue="Value" isValid={false} errorMessage="Error message" />
      </div>
      <div>
        <span style={cap}>disabled</span>
        <TextArea defaultValue="Value" disabled />
      </div>
      <div>
        <span style={cap}>read-only</span>
        <TextArea defaultValue="Value" readOnly />
      </div>
    </div>
  ),
};

/** No inner scroll — the field GROWS with its content (no max height). */
export const AutoGrow: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ maxWidth: 350 }}>
      <TextArea defaultValue={`${LONG} ${LONG}`} />
    </div>
  ),
};

/** Inside an Input: the Prompt copy and error message derive from the label. */
export const InsideInput: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 350 }}>
      <Input label="Reason for call" helpText="Help text">
        <TextArea defaultValue={LONG} />
      </Input>
      <Input label="Reason for call">
        <TextArea isValid={false} />
      </Input>
    </div>
  ),
};
