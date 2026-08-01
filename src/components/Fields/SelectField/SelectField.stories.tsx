import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { cap, docsFrame, noop } from "../../../stories/helpers";
import SelectField from "./SelectField";
import { Icon } from "../../Icon/Icon";
import Avatar from "../../Avatar/Avatar";
import Input from "../../Input/Input";

type LeftSlot = "none" | "icon" | "avatar";

type StoryArgs = {
  value: string;
  leftSlot: LeftSlot;
  suffix: string;
  multiSelect: boolean;
  count: number;
  isValid: boolean;
  errorMessage: string;
  // disabled and readOnly are mutually exclusive — one control.
  state: "default" | "disabled" | "readOnly";
  open: boolean;
  fitContent: boolean;
};

const frame: React.CSSProperties = { width: 320 };

const iconSlot = <Icon icon="diamonds-4" pack="regular" size={14} container="square" />;
const avatarSlot = <Avatar type="user" content="image" size="xs" />;
const leftSlots: Record<LeftSlot, React.ReactNode> = { none: undefined, icon: iconSlot, avatar: avatarSlot };

/**
 * SelectField — the select trigger field: value + slots + chevron, and the
 * multi-select count pill. Fills its container by default (`fitContent` hugs
 * the value). Bare — label and help text come from the Input wrapper.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Fields/SelectField/SelectField",
  component: SelectField,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  // The synthetic playground args/argTypes live on THIS story (not the meta) so
  // the docs-page ArgTypes table stays pure docgen from SelectField.types.ts.
  // `disabled` / `readOnly` are driven by the single `state` control, so hide
  // the auto-generated (docgen) controls for them.
  parameters: { layout: "centered", controls: { exclude: ["disabled", "readOnly"] } },
  args: {
    value: "Value",
    leftSlot: "none",
    suffix: "",
    multiSelect: false,
    count: 2,
    isValid: true,
    errorMessage: "Choose an option",
    state: "default",
    open: false,
    fitContent: false,
  },
  argTypes: {
    value: { control: { type: "text" } },
    leftSlot: { options: ["none", "icon", "avatar"], control: { type: "inline-radio" } },
    suffix: { control: { type: "text" } },
    multiSelect: { control: { type: "boolean" } },
    count: { control: { type: "number" }, if: { arg: "multiSelect" } },
    isValid: { control: { type: "boolean" } },
    errorMessage: { control: { type: "text" }, if: { arg: "isValid", eq: false } },
    state: { options: ["default", "disabled", "readOnly"], control: { type: "inline-radio" } },
    open: { control: { type: "boolean" } },
    fitContent: { control: { type: "boolean" } },
  },
  // Pass props explicitly (no `...args` spread) so a stale persisted arg — e.g. an
  // old `readOnly` — can't leak into the component.
  render: ({ value, leftSlot, suffix, state, multiSelect, count, isValid, errorMessage, open, fitContent }) => {
    const stateProp = state === "disabled" ? { disabled: true } : state === "readOnly" ? { readOnly: true } : {};
    return (
      <div style={frame}>
        <SelectField
          value={value || undefined}
          slotLeft={leftSlots[leftSlot]}
          suffix={suffix || undefined}
          multiSelect={multiSelect}
          count={count}
          isValid={isValid}
          errorMessage={errorMessage}
          open={open}
          fitContent={fitContent}
          {...stateProp}
          onClearSelection={noop}
          onClick={noop}
        />
      </div>
    );
  },
};

/** Every field state (single-select). Hover / active are forced. */
export const States: Story = {
  parameters: { layout: "centered", controls: { disable: true } },
  render: () => {
    const stateRow = (label: string, node: React.ReactNode) => (
      <div>
        <span style={cap}>{label}</span>
        {node}
      </div>
    );
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-4)", ...frame }}>
        {stateRow("default (empty)", <SelectField onClick={noop} />)}
        {stateRow("default (filled)", <SelectField value="Value" onClick={noop} />)}
        {stateRow("hover", <div className="pseudo-hover-all"><SelectField value="Value" onClick={noop} /></div>)}
        {stateRow("active (open)", <SelectField value="Value" open onClick={noop} />)}
        {stateRow("error", <SelectField value="Value" isValid={false} errorMessage="Choose an option" onClick={noop} />)}
        {stateRow("disabled", <SelectField value="Value" disabled />)}
        {stateRow("read-only", <SelectField value="Value" readOnly />)}
        {stateRow("with icon + suffix", <SelectField value="Value" slotLeft={iconSlot} suffix="Suffix" onClick={noop} />)}
        {stateRow("fit-content (hugs the value)", <SelectField value="Value" fitContent onClick={noop} />)}
      </div>
    );
  },
};

// Stateful wrapper so the × button actually clears (count → 0).
function Clearable({ count: initial, value, multiSelectLabel }: { count: number; value?: string; multiSelectLabel?: string }) {
  const [count, setCount] = useState(initial);
  return <SelectField multiSelect count={count} value={value} multiSelectLabel={multiSelectLabel} onClearSelection={() => setCount(0)} onClick={noop} />;
}

/** Multi-select — the count pill appears once options are selected. Click × to clear. */
export const MultiSelect: Story = {
  parameters: { layout: "centered", controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-4)", ...frame }}>
      <div>
        <span style={cap}>empty</span>
        <SelectField multiSelect count={0} onClick={noop} />
      </div>
      <div>
        <span style={cap}>1 selected → the option name (click × to clear)</span>
        <Clearable count={1} value="Apples" />
      </div>
      <div>
        <span style={cap}>{'>1 selected → "Options selected" (default)'}</span>
        <Clearable count={3} value="Apples" />
      </div>
      <div>
        <span style={cap}>{'>1 selected → custom copy'}</span>
        <Clearable count={3} value="Austin" multiSelectLabel="Locations selected" />
      </div>
      <div>
        <span style={cap}>error</span>
        <SelectField multiSelect count={1} value="Apples" isValid={false} errorMessage="Choose at least two" onClearSelection={noop} onClick={noop} />
      </div>
      <div>
        <span style={cap}>read-only</span>
        <SelectField multiSelect count={3} value="Apples" readOnly />
      </div>
    </div>
  ),
};

/** Inside an Input: the default error message derives from the label. */
export const InsideInput: Story = {
  parameters: { layout: "centered", controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-6)", ...frame }}>
      <Input label="Location" helpText="Help text">
        <SelectField value="Austin" onClick={noop} />
      </Input>
      <Input label="Location">
        <SelectField isValid={false} onClick={noop} />
      </Input>
      <Input label="Location">
        <SelectField value="Austin" readOnly />
      </Input>
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

/** Multi-select, filled — counter + summary copy. Click × to clear (live). */
export const Basic: Story = {
  render: () => (
    <div style={docsFrame}>
      <Clearable count={3} />
    </div>
  ),
};

/** Empty — no placeholder; informative text goes to the hint or the help text. */
export const Empty: Story = {
  render: () => (
    <div style={docsFrame}>
      <SelectField onClick={noop} />
    </div>
  ),
};

/** Filled — the selected option's name is the value. */
export const FilledOut: Story = {
  render: () => (
    <div style={docsFrame}>
      <SelectField value="Value" onClick={noop} />
    </div>
  ),
};

/** The left slot — an icon (14px, square container) or an avatar (xs / 20px). */
export const LeftSlot: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        {row("icon — size and color may vary", <SelectField value="Value" slotLeft={iconSlot} onClick={noop} />)}
        {row("avatar — any type, xs / 20px", <SelectField value="Value" slotLeft={avatarSlot} onClick={noop} />)}
      </div>
    </div>
  ),
};

/** A subtle suffix after the value. */
export const WithSuffix: Story = {
  render: () => (
    <div style={docsFrame}>
      <SelectField value="Value" suffix="Suffix" onClick={noop} />
    </div>
  ),
};

/** Multi-select with both slots: counter + icon + value + suffix. */
export const MultiSelectSlots: Story = {
  render: () => (
    <div style={docsFrame}>
      <SelectField multiSelect count={1} value="Value" slotLeft={iconSlot} suffix="Suffix" onClearSelection={noop} onClick={noop} />
    </div>
  ),
};

/** Single-select, empty + valid states. */
export const EmptyValid: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        {row("default", <SelectField onClick={noop} />)}
        {row("hovered", <SelectField className="pseudo-hover-all" onClick={noop} />)}
        {row("active (open)", <SelectField open onClick={noop} />)}
        {row("disabled", <SelectField disabled />)}
      </div>
    </div>
  ),
};

/** Single-select, empty + invalid states (disabled can not be invalid). */
export const EmptyInvalid: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        {row("default", <SelectField isValid={false} errorMessage="Choose Location" onClick={noop} />)}
        {row("hovered", <SelectField className="pseudo-hover-all" isValid={false} errorMessage="Choose Location" onClick={noop} />)}
        {row("active (open)", <SelectField open isValid={false} errorMessage="Choose Location" onClick={noop} />)}
      </div>
    </div>
  ),
};

/** Single-select, filled + valid states. */
export const FilledValid: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        {row("default", <SelectField value="Value" onClick={noop} />)}
        {row("hovered", <SelectField className="pseudo-hover-all" value="Value" onClick={noop} />)}
        {row("active (open)", <SelectField open value="Value" onClick={noop} />)}
        {row("disabled", <SelectField value="Value" disabled />)}
        {row("read-only (no chevron)", <SelectField value="Value" readOnly />)}
      </div>
    </div>
  ),
};

/** Single-select, filled + invalid states (disabled and read-only can not be invalid). */
export const FilledInvalid: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        {row("default", <SelectField value="Value" isValid={false} errorMessage="Error message" onClick={noop} />)}
        {row("hovered", <SelectField className="pseudo-hover-all" value="Value" isValid={false} errorMessage="Error message" onClick={noop} />)}
        {row("active (open)", <SelectField open value="Value" isValid={false} errorMessage="Error message" onClick={noop} />)}
      </div>
    </div>
  ),
};

/** Multi-select value copy: 1 selected → the option's name; more → summary copy. */
export const MultiSelectCopy: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        {row("1 selected — the option's name", <SelectField multiSelect count={1} value="Ice bin" onClearSelection={noop} onClick={noop} />)}
        {row('>1 selected — "Options selected" (default)', <SelectField multiSelect count={3} value="Ice bin" onClearSelection={noop} onClick={noop} />)}
        {row(">1 selected — the exact copy from the designs", <SelectField multiSelect count={3} value="Austin" multiSelectLabel="Locations selected" onClearSelection={noop} onClick={noop} />)}
      </div>
    </div>
  ),
};

/** Clear all — live: hover the × for the tooltip, click it to clear the field. */
export const ClearAll: Story = {
  render: () => (
    <div style={docsFrame}>
      <Clearable count={3} value="Ice bin" />
    </div>
  ),
};

/** Multi-select, empty + valid — no counter when empty, identical to single-select. */
export const MultiEmptyValid: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        {row("default", <SelectField multiSelect count={0} onClick={noop} />)}
        {row("hovered", <SelectField multiSelect count={0} className="pseudo-hover-all" onClick={noop} />)}
        {row("active (open)", <SelectField multiSelect count={0} open onClick={noop} />)}
        {row("disabled", <SelectField multiSelect count={0} disabled />)}
      </div>
    </div>
  ),
};

/** Multi-select, empty + invalid states (disabled can not be invalid). */
export const MultiEmptyInvalid: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        {row("default", <SelectField multiSelect count={0} isValid={false} errorMessage="Choose Location" onClick={noop} />)}
        {row("hovered", <SelectField multiSelect count={0} className="pseudo-hover-all" isValid={false} errorMessage="Choose Location" onClick={noop} />)}
        {row("active (open)", <SelectField multiSelect count={0} open isValid={false} errorMessage="Choose Location" onClick={noop} />)}
      </div>
    </div>
  ),
};

/** Multi-select, filled + valid — the counter rides along every state. */
export const MultiFilledValid: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        {row("default", <SelectField multiSelect count={1} value="Value" onClearSelection={noop} onClick={noop} />)}
        {row("hovered", <SelectField multiSelect count={1} value="Value" className="pseudo-hover-all" onClearSelection={noop} onClick={noop} />)}
        {row("active (open)", <SelectField multiSelect count={1} value="Value" open onClearSelection={noop} onClick={noop} />)}
        {row("disabled", <SelectField multiSelect count={1} value="Value" disabled onClearSelection={noop} />)}
        {row("read-only (outlined counter, no ×, no chevron)", <SelectField multiSelect count={1} value="Value" readOnly />)}
      </div>
    </div>
  ),
};

/** Multi-select, filled + invalid states (disabled and read-only can not be invalid). */
export const MultiFilledInvalid: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={col}>
        {row("default", <SelectField multiSelect count={1} value="Value" isValid={false} errorMessage="Error message" onClearSelection={noop} onClick={noop} />)}
        {row("hovered", <SelectField multiSelect count={1} value="Value" className="pseudo-hover-all" isValid={false} errorMessage="Error message" onClearSelection={noop} onClick={noop} />)}
        {row("active (open)", <SelectField multiSelect count={1} value="Value" open isValid={false} errorMessage="Error message" onClearSelection={noop} onClick={noop} />)}
      </div>
    </div>
  ),
};

/** The derived "Choose [Label]" message — live, from the Input label. */
export const MissingValueMessage: Story = {
  render: () => (
    <div style={docsFrame}>
      <Input label="Location">
        <SelectField isValid={false} onClick={noop} />
      </Input>
    </div>
  ),
};
