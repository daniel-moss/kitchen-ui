import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { cap, docsFrame, DeviceFrame } from "../../../stories/helpers";
import Input from "../../Input/Input";
import StrengthIndicator from "../../Input/StrengthIndicator";
import { StrengthIndicatorState } from "../../Input/StrengthIndicator.types";
import PasswordField from "./PasswordField";
import { PasswordConditionState, PasswordFieldVariant } from "./PasswordField.types";

/**
 * PasswordField — the password field: masked value, Show/Hide eye button with
 * tooltips, and per-variant content below the field (error text / requirement
 * badges / match badge). Bare — label, help text, and the strength indicator
 * come from the Input wrapper.
 */
const meta: Meta<typeof PasswordField> = {
  title: "Components/Fields/PasswordField",
  component: PasswordField,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: {
    variant: "default",
    isValid: true,
    disabled: false,
    passwordManagerIcon: false,
    matchState: "default",
  },
  argTypes: {
    variant: { options: ["default", "new", "confirm"], control: { type: "inline-radio" } },
    matchState: { options: ["default", "valid", "invalid"], control: { type: "inline-radio" }, if: { arg: "variant", eq: "confirm" } },
    errorMessage: { control: { type: "text" } },
    conditions: { control: false },
  },
};
export default meta;

type Story = StoryObj<typeof PasswordField>;

// An 11-character value — renders as the docs' 11 dots.
const VALUE = "hunter2park";

export const Playground: Story = {
  render: (args) => (
    <div style={docsFrame}>
      <PasswordField {...args} defaultValue={VALUE} />
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

/** The hero — empty default field with the eye button. Live. */
export const Hero: Story = {
  render: () => (
    <div style={docsFrame}>
      <PasswordField />
    </div>
  ),
};

/** Default variant, filled — masked dots + the Show/Hide button. */
export const AnatomyDefault: Story = {
  render: () => (
    <div style={docsFrame}>
      <PasswordField defaultValue={VALUE} />
    </div>
  ),
};

/** New password — the three requirement badges, unchecked. */
export const AnatomyNew: Story = {
  render: () => (
    <div style={docsFrame}>
      <PasswordField variant="new" />
    </div>
  ),
};

/** The strength indicator — on the Input wrapper's label, not the field. */
export const AnatomyStrength: Story = {
  render: () => (
    <div style={docsFrame}>
      <Input label="New password" strength="excellent">
        <PasswordField
          variant="new"
          defaultValue={VALUE}
          conditions={[
            { label: "At least 8 characters", state: "valid" },
            { label: "Letters", state: "valid" },
            { label: "Numbers", state: "valid" },
          ]}
        />
      </Input>
    </div>
  ),
};

/** Confirm password — the single match badge. */
export const AnatomyConfirm: Story = {
  render: () => (
    <div style={docsFrame}>
      <PasswordField variant="confirm" />
    </div>
  ),
};

/** Live — hover the eye for the tooltip; click it to reveal / hide. */
export const ShowHideButton: Story = {
  render: () => (
    <div style={docsFrame}>
      <PasswordField defaultValue={VALUE} />
    </div>
  ),
};

/** The four strength statuses — the bare StrengthIndicator part. */
export const StrengthStatuses: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={{ ...col, alignItems: "center" }}>
        <StrengthIndicator state="excellent" />
        <StrengthIndicator state="strong" />
        <StrengthIndicator state="average" />
        <StrengthIndicator state="weak" />
      </div>
    </div>
  ),
};

/** The key icon next to the eye — visible while the field is focused. */
export const PasswordManagerIcon: Story = {
  render: () => (
    <div style={docsFrame}>
      <PasswordField passwordManagerIcon className="pseudo-focus-within-all" />
    </div>
  ),
};

/** The badge progression from the docs — every step forced active. */
export const ConditionProgression: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        <PasswordField variant="new" className="pseudo-focus-within-all" />
        <PasswordField
          variant="new"
          className="pseudo-focus-within-all"
          defaultValue="hunter2p"
          conditions={[
            { label: "At least 8 characters", state: "valid" },
            { label: "Letters" },
            { label: "Numbers" },
          ]}
        />
        <PasswordField
          variant="new"
          className="pseudo-focus-within-all"
          defaultValue={VALUE}
          conditions={[
            { label: "At least 8 characters", state: "valid" },
            { label: "Letters", state: "valid" },
            { label: "Numbers", state: "valid" },
          ]}
        />
        <PasswordField variant="new" className="pseudo-focus-within-all" isValid={false} />
        <PasswordField
          variant="new"
          className="pseudo-focus-within-all"
          defaultValue={VALUE}
          isValid={false}
          conditions={[
            { label: "At least 8 characters", state: "valid" },
            { label: "Letters", state: "valid" },
            { label: "Numbers", state: "invalid" },
          ]}
        />
      </div>
    </div>
  ),
};

// A live "create password" form slice: strength on the Input label, badges on
// the field — intentionally independent signals (the docs).
function NewPasswordDemo() {
  const [value, setValue] = useState("");
  const hasLength = value.length >= 8;
  const hasLetters = /[a-zA-Z]/.test(value);
  const hasNumbers = /\d/.test(value);
  const met = [hasLength, hasLetters, hasNumbers].filter(Boolean).length;
  const strength: StrengthIndicatorState = met <= 1 ? "weak" : met === 2 ? "average" : value.length >= 12 ? "excellent" : "strong";
  const state = (ok: boolean): PasswordConditionState => (value.length === 0 ? "default" : ok ? "valid" : "invalid");
  return (
    <Input label="New password" strength={value.length > 0 ? strength : undefined}>
      <PasswordField
        variant="new"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        conditions={[
          { label: "At least 8 characters", state: state(hasLength) },
          { label: "Letters", state: state(hasLetters) },
          { label: "Numbers", state: state(hasNumbers) },
        ]}
        autoComplete="new-password"
      />
    </Input>
  );
}

/** Live — type to see the badges (and the strength on the label) react. */
export const ConditionsLive: Story = {
  render: () => (
    <div style={docsFrame}>
      <NewPasswordDemo />
    </div>
  ),
};

// ---- the state ladders (Behaviour → States) ---------------------------------

const ladder = (variant: PasswordFieldVariant, filled: boolean, invalid: boolean) => {
  const value = filled ? VALUE : undefined;
  // Figma: empty invalid shows the derived "Enter password"; filled invalid
  // shows a passed "Error message".
  const error = invalid && filled ? "Error message" : undefined;
  const common = { variant, defaultValue: value, isValid: !invalid, errorMessage: error };
  return (
    <div style={col}>
      {row("default", <PasswordField {...common} />)}
      {row("hovered", <PasswordField {...common} className="pseudo-hover-all" />)}
      {row("active", <PasswordField {...common} className="pseudo-focus-within-all" />)}
      {!invalid && row("disabled", <PasswordField {...common} disabled />)}
    </div>
  );
};

/** Default password — empty + valid. */
export const DefaultEmptyValid: Story = { render: () => <div style={docsFrame}>{ladder("default", false, false)}</div> };
/** Default password — empty + invalid (derived "Enter password"). */
export const DefaultEmptyInvalid: Story = { render: () => <div style={docsFrame}>{ladder("default", false, true)}</div> };
/** Default password — filled + valid. */
export const DefaultFilledValid: Story = { render: () => <div style={docsFrame}>{ladder("default", true, false)}</div> };
/** Default password — filled + invalid. */
export const DefaultFilledInvalid: Story = { render: () => <div style={docsFrame}>{ladder("default", true, true)}</div> };

/** New password — empty + valid (disabled hides the badges). */
export const NewEmptyValid: Story = { render: () => <div style={docsFrame}>{ladder("new", false, false)}</div> };
/** New password — empty + invalid (unchecked badges turn invalid). */
export const NewEmptyInvalid: Story = { render: () => <div style={docsFrame}>{ladder("new", false, true)}</div> };
/** New password — filled + valid. */
export const NewFilledValid: Story = { render: () => <div style={docsFrame}>{ladder("new", true, false)}</div> };
/** New password — filled + invalid. */
export const NewFilledInvalid: Story = { render: () => <div style={docsFrame}>{ladder("new", true, true)}</div> };

/** Confirm password — empty + valid (disabled hides the badge). */
export const ConfirmEmptyValid: Story = { render: () => <div style={docsFrame}>{ladder("confirm", false, false)}</div> };
/** Confirm password — empty + invalid (the match badge turns red). */
export const ConfirmEmptyInvalid: Story = { render: () => <div style={docsFrame}>{ladder("confirm", false, true)}</div> };
/** Confirm password — filled + valid. */
export const ConfirmFilledValid: Story = { render: () => <div style={docsFrame}>{ladder("confirm", true, false)}</div> };
/** Confirm password — filled + invalid. */
export const ConfirmFilledInvalid: Story = { render: () => <div style={docsFrame}>{ladder("confirm", true, true)}</div> };

/** The "text" keyboard — open this story on a phone. */
export const MobileKeyboard: Story = {
  render: () => (
    <div style={{ ...docsFrame, display: "flex", justifyContent: "center" }}>
      <DeviceFrame statusBar pageText="">
        <div style={{ padding: "var(--size-2) var(--size-4)" }}>
          <PasswordField variant="new" />
        </div>
      </DeviceFrame>
    </div>
  ),
};

// ---- the compact overview stories -------------------------------------------

/** The three variants (the docs): default, new (badges), confirm (match badge). */
export const Variants: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 350 }}>
      <div>
        <span style={cap}>default</span>
        <PasswordField defaultValue="hunter2hunter2" />
      </div>
      <div>
        <span style={cap}>new — requirement badges</span>
        <PasswordField variant="new" />
      </div>
      <div>
        <span style={cap}>new — some requirements met</span>
        <PasswordField
          variant="new"
          defaultValue="abcdefgh"
          conditions={[
            { label: "At least 8 characters", state: "valid" },
            { label: "Letters", state: "valid" },
            { label: "Numbers", state: "invalid" },
          ]}
        />
      </div>
      <div>
        <span style={cap}>confirm — match badge</span>
        <PasswordField variant="confirm" defaultValue="hunter2hunter2" matchState="valid" />
      </div>
    </div>
  ),
};

/** The state ladder — disabled can not be invalid; no read-only exists. */
export const States: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 350 }}>
      <div>
        <span style={cap}>empty</span>
        <PasswordField />
      </div>
      <div>
        <span style={cap}>hover</span>
        <PasswordField className="pseudo-hover-all" defaultValue="hunter2hunter2" />
      </div>
      <div>
        <span style={cap}>active</span>
        <PasswordField className="pseudo-focus-within-all" defaultValue="hunter2hunter2" />
      </div>
      <div>
        <span style={cap}>invalid empty ("Enter password")</span>
        <PasswordField isValid={false} />
      </div>
      <div>
        <span style={cap}>invalid filled</span>
        <PasswordField defaultValue="hunter2hunter2" isValid={false} errorMessage="Error message" />
      </div>
      <div>
        <span style={cap}>disabled (no eye button, no badges)</span>
        <PasswordField defaultValue="hunter2hunter2" disabled />
      </div>
      <div>
        <span style={cap}>password manager icon (focus the field)</span>
        <PasswordField defaultValue="hunter2hunter2" passwordManagerIcon />
      </div>
    </div>
  ),
};

/** Inside an Input — type to see the badges and the strength indicator react. */
export const InsideInput: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 350 }}>
      <Input label="Password">
        <PasswordField autoComplete="current-password" />
      </Input>
      <NewPasswordDemo />
      <Input label="Confirm password">
        <PasswordField variant="confirm" matchState="default" autoComplete="new-password" />
      </Input>
    </div>
  ),
};
