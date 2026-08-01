import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { cap, docsFrame } from "../../../stories/helpers";
import OTPField from "./OTPField";
import OTPBox from "./OTPBox";

/**
 * OTPField — the one-time-code field: a row of single-digit boxes (default 6).
 * Entry is strictly sequential (type first→last, erase in reverse, no editing a
 * middle digit); the last digit completes the code (`onComplete`). On a rejected
 * code the field shakes, holds the error 2s, then clears the digits and the
 * error state — only the message stays until the user types. Bare — the label
 * lives on the Input wrapper.
 */
const meta: Meta<typeof OTPField> = {
  title: "Components/Fields/OTPField",
  component: OTPField,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof OTPField>;

const FIELD_W = 384;
// Every docs story centers its content in the preview surface.
const center = { display: "flex", justifyContent: "center" } as const;
const col = { display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-20)" } as const;

const row = (label: string, node: React.ReactNode) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-1_5)" }}>
    <span style={cap}>{label}</span>
    {node}
  </div>
);

const field = (node: React.ReactNode, width: number = FIELD_W) => <div style={{ width }}>{node}</div>;

export const Playground: Story = {
  parameters: { layout: "centered" },
  args: {
    defaultValue: "",
    length: 6,
    isValid: true,
    errorMessage: "Enter the code",
    autoFocus: false,
    disabled: false,
  },
  argTypes: {
    defaultValue: { control: { type: "text" } },
    length: { control: { type: "number", min: 4, max: 8 } },
    isValid: { control: { type: "boolean" } },
    errorMessage: { control: { type: "text" } },
    autoFocus: { control: { type: "boolean" } },
    disabled: { control: { type: "boolean" } },
  },
  // key on length: `length` is a design-time prop, not meant to change at
  // runtime — re-mount so the uncontrolled cells resize when the control changes.
  render: (args) => <div style={{ width: FIELD_W }}><OTPField key={args.length} {...args} /></div>,
};

// ---- docs-page stories (one per Figma Documentation example) ---------------

/** Hero — a filled 6-digit field. */
export const Basic: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={center}>{field(<OTPField autoFocus={false} defaultValue="012345" />)}</div>
    </div>
  ),
};

/** The field is responsive between a minimum and a maximum width. */
export const MinMaxWidth: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        {row("minimum width — 224px", field(<OTPField autoFocus={false} defaultValue="012345" />, 224))}
        {row("maximum width — 384px", field(<OTPField autoFocus={false} defaultValue="012345" />, 384))}
      </div>
    </div>
  ),
};

// A static illustration of the resting field: box 1 active (forced via the
// pseudo-states class on the box itself), the rest at their default "–". A real
// autoFocus here would scroll the docs page to this canvas on load and would
// not render in a headless screenshot — the component still autofocuses box 1
// in real use.
/** Active by default — the first box is focused on mount; entry is sequential. */
export const ActiveByDefault: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={center}>
        <div style={{ display: "flex", gap: "var(--size-2)", width: FIELD_W }}>
          <OTPBox value="" className="pseudo-focus" />
          {Array.from({ length: 5 }, (_, i) => (
            <OTPBox key={i} value="" />
          ))}
        </div>
      </div>
    </div>
  ),
};

// A wrong code every time it completes — to demonstrate the owned error
// response. Re-validate only when the user types a NEW digit (code non-empty),
// so the auto-reset's onChange("") neither re-arms nor clears the message early.
function ErrorResetDemo() {
  const [code, setCode] = useState("");
  const [valid, setValid] = useState(true);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-4)" }}>
      <div style={{ width: FIELD_W }}>
        <OTPField
          value={code}
          isValid={valid}
          autoFocus={false}
          onChange={(c) => {
            setCode(c);
            if (c !== "" && !valid) setValid(true);
          }}
          onComplete={() => setValid(false)}
        />
      </div>
      <span style={{ ...cap, maxWidth: FIELD_W, textAlign: "center" }}>
        Type any 6 digits — the completed code is rejected: the field shakes, holds the error for 2 seconds, then clears
        the digits and the red state. The message stays until you type again.
      </span>
    </div>
  );
}

/** The error response — live: shake, hold 2s, then reset digits + error state. */
export const ErrorReset: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={center}>
        <ErrorResetDemo />
      </div>
    </div>
  ),
};

// One box, with a caption naming its state.
const boxCell = (label: string, node: React.ReactNode) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-1_5)" }}>
    <div style={{ display: "flex", width: 40 }}>{node}</div>
    <span style={cap}>{label}</span>
  </div>
);

// One combo (Empty/Filled × Valid/Invalid): the box in each interaction state.
function ComboRow({ title, isValid = true, filled = false }: { title: string; isValid?: boolean; filled?: boolean }) {
  const v = filled ? "0" : "";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-3)" }}>
      <span style={cap}>{title}</span>
      <div style={{ display: "flex", gap: "var(--size-5)" }}>
        {boxCell("Default", <OTPBox value={v} isValid={isValid} />)}
        {boxCell("Hover", <OTPBox value={v} isValid={isValid} className="pseudo-hover" />)}
        {boxCell("Active", <OTPBox value={v} isValid={isValid} className="pseudo-focus" />)}
        {isValid && boxCell("Disabled", <OTPBox value={v} isValid disabled />)}
      </div>
    </div>
  );
}

/** Input states — a single box: Empty/Filled × Valid/Invalid, each state named. */
export const InputStates: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        <ComboRow title="Empty + Valid" />
        <ComboRow title="Empty + Invalid" isValid={false} />
        <ComboRow title="Filled + Valid" filled />
        <ComboRow title="Filled + Invalid" isValid={false} filled />
      </div>
    </div>
  ),
};

/** Group states — the whole field: Empty/Filled × Valid/Invalid. */
export const GroupStates: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        {row("Empty + Valid", field(<OTPField autoFocus={false} />))}
        {row("Empty + Invalid", field(<OTPField autoFocus={false} isValid={false} />))}
        {row("Filled + Valid", field(<OTPField autoFocus={false} defaultValue="012345" />))}
        {row("Filled + Invalid", field(<OTPField autoFocus={false} defaultValue="012345" isValid={false} />))}
      </div>
    </div>
  ),
};

/** Mobile keyboard — the boxes use the `tel` keyboard (device-only). */
export const MobileKeyboard: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={center}>{field(<OTPField autoFocus={false} />)}</div>
    </div>
  ),
};
