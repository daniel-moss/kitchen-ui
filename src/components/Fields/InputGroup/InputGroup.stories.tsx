import { ReactNode, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { cap, docsFrame } from "../../../stories/helpers";
import DateField from "../DateField/DateField";
import SelectField from "../SelectField/SelectField";
import TextField from "../TextField/TextField";
import Input from "../../Input/Input";
import InputGroup from "./InputGroup";
import { InputGroupProps } from "./InputGroup.types";

const DATE = new Date(2026, 0, 1); // Thursday, January 1

/**
 * InputGroup — fuses two or more fields into ONE bordered box that reads as a
 * single piece of data, with one shared error message. Bare — label and help
 * text come from the Input wrapper.
 */
const meta: Meta<typeof InputGroup> = {
  title: "Components/Fields/InputGroup",
  component: InputGroup,
  parameters: { layout: "fullscreen" },
  args: {
    isValid: true,
    disabled: false,
    readOnly: false,
  },
  argTypes: {
    errorMessage: { control: { type: "text" } },
    children: { control: false },
  },
};
export default meta;

type Story = StoryObj<typeof InputGroup>;

type GroupState = Omit<InputGroupProps, "children"> & { filled?: boolean };

// The three Figma variants (24701-51704), as reusable builders. `filled`
// controls the segments' values (the Figma isFilled axis).
const DateSelectGroup = ({ filled = true, ...props }: GroupState) => (
  <InputGroup {...props}>
    <DateField defaultValue={filled ? DATE : undefined} breakpoint="desktop" today={DATE} />
    <SelectField value={filled ? "Value" : undefined} />
  </InputGroup>
);

const TextSelectGroup = ({ filled = true, ...props }: GroupState) => (
  <InputGroup {...props}>
    <TextField defaultValue={filled ? "Value" : undefined} />
    <SelectField value={filled ? "Value" : undefined} />
  </InputGroup>
);

// The date + time + AM/PM shape: the time TextField is FIXED at 64px
// (placeholder "00:00"), the AM/PM SelectField hugs its content. Doubled
// selectors out-specify the grouped field's default flex: 1 1 0; the
// min-width keeps "AM"/"PM" whole (a grouped body has min-width: 0).
const TimeSegmentStyles = () => (
  <style>{`
    .igStoryTime.igStoryTime { flex: 0 0 var(--size-16); }
    .igStoryAmPm.igStoryAmPm { flex: 0 0 auto; min-width: 5rem; }
  `}</style>
);

const DateTextSelectGroup = ({ filled = true, ...props }: GroupState) => {
  // The time segment is a REAL masked input (the TextField placeholder
  // convention: "00:00" shows the shape, the mask is the consumer's wiring —
  // same wiring as the TextField docs): digits only, the colon inserts
  // itself, capped at 4 digits.
  const [time, setTime] = useState(filled ? "09:30" : "");
  return (
    <>
      <TimeSegmentStyles />
      <InputGroup {...props}>
        <DateField defaultValue={filled ? DATE : undefined} breakpoint="desktop" today={DATE} />
        <TextField
          className="igStoryTime"
          placeholder="00:00"
          keyboard="numeric"
          value={time}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
            setTime(digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits);
          }}
        />
        <SelectField className="igStoryAmPm" value="AM" />
      </InputGroup>
    </>
  );
};

// The docs-page canvases share these two frames.
const Single = ({ children }: { children: ReactNode }) => <div style={docsFrame}>{children}</div>;
const Column = ({ children }: { children: ReactNode }) => (
  <div style={{ ...docsFrame, display: "flex", flexDirection: "column", gap: "var(--size-20)" }}>{children}</div>
);

/** DateField + SelectField fused into one box. Toggle the controls. */
export const Playground: Story = {
  render: (args) => (
    <Single>
      <DateSelectGroup {...args} />
    </Single>
  ),
};

// ===== DateField + SelectField =============================================

/** The dateSelect variant, filled. */
export const DateSelect: Story = {
  render: () => (
    <Single>
      <DateSelectGroup />
    </Single>
  ),
};

/** Empty + valid: default and disabled (no read-only while empty). */
export const DateSelectEmpty: Story = {
  render: () => (
    <Column>
      <div>
        <span style={cap}>default</span>
        <DateSelectGroup filled={false} />
      </div>
      <div>
        <span style={cap}>disabled</span>
        <DateSelectGroup filled={false} disabled />
      </div>
    </Column>
  ),
};

/** Empty + invalid: the derived "Provide [Label]" message. */
export const DateSelectEmptyInvalid: Story = {
  render: () => (
    <Single>
      <DateSelectGroup filled={false} isValid={false} errorMessage="Provide Date & time" />
    </Single>
  ),
};

/** Filled + valid: default, disabled and read-only. */
export const DateSelectFilled: Story = {
  render: () => (
    <Column>
      <div>
        <span style={cap}>default</span>
        <DateSelectGroup />
      </div>
      <div>
        <span style={cap}>disabled</span>
        <DateSelectGroup disabled />
      </div>
      <div>
        <span style={cap}>read-only</span>
        <DateSelectGroup readOnly />
      </div>
    </Column>
  ),
};

/** Filled + invalid: a custom message via errorMessage. */
export const DateSelectFilledInvalid: Story = {
  render: () => (
    <Single>
      <DateSelectGroup isValid={false} errorMessage="Error message" />
    </Single>
  ),
};

// ===== TextField + SelectField =============================================

/** The textSelect variant, filled. */
export const TextSelect: Story = {
  render: () => (
    <Single>
      <TextSelectGroup />
    </Single>
  ),
};

/** Empty + valid: default and disabled. */
export const TextSelectEmpty: Story = {
  render: () => (
    <Column>
      <div>
        <span style={cap}>default</span>
        <TextSelectGroup filled={false} />
      </div>
      <div>
        <span style={cap}>disabled</span>
        <TextSelectGroup filled={false} disabled />
      </div>
    </Column>
  ),
};

/** Empty + invalid: the derived "Provide [Label]" message. */
export const TextSelectEmptyInvalid: Story = {
  render: () => (
    <Single>
      <TextSelectGroup filled={false} isValid={false} errorMessage="Provide Amount" />
    </Single>
  ),
};

/** Filled + valid: default, disabled and read-only. */
export const TextSelectFilled: Story = {
  render: () => (
    <Column>
      <div>
        <span style={cap}>default</span>
        <TextSelectGroup />
      </div>
      <div>
        <span style={cap}>disabled</span>
        <TextSelectGroup disabled />
      </div>
      <div>
        <span style={cap}>read-only</span>
        <TextSelectGroup readOnly />
      </div>
    </Column>
  ),
};

/** Filled + invalid: a custom message via errorMessage. */
export const TextSelectFilledInvalid: Story = {
  render: () => (
    <Single>
      <TextSelectGroup isValid={false} errorMessage="Error message" />
    </Single>
  ),
};

// ===== DateField + TextField + SelectField =================================

/** The dateTextSelect variant (date + time + AM/PM), filled. */
export const DateTextSelect: Story = {
  render: () => (
    <Single>
      <DateTextSelectGroup />
    </Single>
  ),
};

/** Empty + valid: default and disabled (the time keeps its "00:00" placeholder). */
export const DateTextSelectEmpty: Story = {
  render: () => (
    <Column>
      <div>
        <span style={cap}>default</span>
        <DateTextSelectGroup filled={false} />
      </div>
      <div>
        <span style={cap}>disabled</span>
        <DateTextSelectGroup filled={false} disabled />
      </div>
    </Column>
  ),
};

/** Empty + invalid: the derived "Provide [Label]" message. */
export const DateTextSelectEmptyInvalid: Story = {
  render: () => (
    <Single>
      <DateTextSelectGroup filled={false} isValid={false} errorMessage="Provide Date & time" />
    </Single>
  ),
};

/** Filled + valid: default, disabled and read-only. */
export const DateTextSelectFilled: Story = {
  render: () => (
    <Column>
      <div>
        <span style={cap}>default</span>
        <DateTextSelectGroup />
      </div>
      <div>
        <span style={cap}>disabled</span>
        <DateTextSelectGroup disabled />
      </div>
      <div>
        <span style={cap}>read-only</span>
        <DateTextSelectGroup readOnly />
      </div>
    </Column>
  ),
};

/** Filled + invalid: a custom message via errorMessage. */
export const DateTextSelectFilledInvalid: Story = {
  render: () => (
    <Single>
      <DateTextSelectGroup isValid={false} errorMessage="Error message" />
    </Single>
  ),
};

// ===== "Missing value" message =============================================

/** The derived message, live: label "Amount" → "Provide Amount". */
export const MissingValue: Story = {
  render: () => (
    <Single>
      <Input label="Amount">
        <InputGroup isValid={false}>
          <TextField />
          <SelectField />
        </InputGroup>
      </Input>
    </Single>
  ),
};

/** Inside an Input: one label/help header, and the derived "Provide [Label]". */
export const InsideInput: Story = {
  render: () => (
    <Column>
      <Input label="Date & time" helpText="Help text">
        <DateSelectGroup />
      </Input>
      <Input label="Date & time">
        <DateSelectGroup filled={false} isValid={false} />
      </Input>
    </Column>
  ),
};
