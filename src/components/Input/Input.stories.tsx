import type { Meta, StoryObj } from "@storybook/react";

import { cap, docsFrame } from "../../stories/helpers";
import CheckboxItem from "../Checkbox/CheckboxItem";
import CheckboxGroup from "../Checkbox/CheckboxGroup";
import DateField from "../Fields/DateField/DateField";
import InputGroup from "../Fields/InputGroup/InputGroup";
import MediaField from "../Fields/MediaField/MediaField";
import PasswordField from "../Fields/PasswordField/PasswordField";
import SelectField from "../Fields/SelectField/SelectField";
import TextArea from "../Fields/TextArea/TextArea";
import TextField from "../Fields/TextField/TextField";
import RadioGroup from "../Radio/RadioGroup";
import RadioItem from "../Radio/RadioItem";
import Input from "./Input";

const DATE = new Date(2026, 0, 1); // Thursday, January 1
const noop = () => {};

/**
 * Input — the shared field header: label (with condition, hint, strength
 * indicator) + help text above ONE bare field (or the TextArea + MediaField
 * pair). A string label also flows down to the field, which derives its
 * default error message ("Enter/Choose/Provide/Add [Label]"), the TextArea
 * clear-Prompt copy, and the DateField picker label from it.
 */
const meta: Meta<typeof Input> = {
  title: "Components/Input/Input",
  component: Input,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: {
    label: "Label",
    helpText: "Help text",
    labelHint: false,
    isLoading: false,
  },
  argTypes: {
    label: { control: { type: "text" } },
    helpText: { control: { type: "text" } },
    labelCondition: { options: [undefined, "optional"], control: { type: "inline-radio" } },
    strength: { options: [undefined, "weak", "average", "strong", "excellent"], control: { type: "inline-radio" } },
    children: { control: false },
  },
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Playground: Story = {
  render: (args) => (
    <div style={docsFrame}>
      <Input {...args}>
        <TextField />
      </Input>
    </div>
  ),
};

// ---- docs-page stories (one per Figma Documentation example) ---------------

/** The label (the Label component, subtle variant), 6px above the field. */
export const WithLabel: Story = {
  render: () => (
    <div style={docsFrame}>
      <Input label="Label">
        <TextField />
      </Input>
    </div>
  ),
};

/** InputHelpText below the label (2px apart), above the field. */
export const WithHelpText: Story = {
  render: () => (
    <div style={docsFrame}>
      <Input label="Label" helpText="Help text">
        <TextField />
      </Input>
    </div>
  ),
};

/** The label's right slot — currently only the StrengthIndicator. */
export const WithRightSlot: Story = {
  render: () => (
    <div style={docsFrame}>
      <Input label="Label" strength="strong">
        <PasswordField variant="new" defaultValue="abcdefgh12" />
      </Input>
    </div>
  ),
};

export const WithTextField: Story = {
  render: () => (
    <div style={docsFrame}>
      <Input label="TextField">
        <TextField />
      </Input>
    </div>
  ),
};

export const WithTextArea: Story = {
  render: () => (
    <div style={docsFrame}>
      <Input label="TextArea">
        <TextArea />
      </Input>
    </div>
  ),
};

export const WithSelectField: Story = {
  render: () => (
    <div style={docsFrame}>
      <Input label="SelectField">
        <SelectField onClick={noop} />
      </Input>
    </div>
  ),
};

export const WithPasswordField: Story = {
  render: () => (
    <div style={docsFrame}>
      <Input label="PasswordField">
        <PasswordField />
      </Input>
    </div>
  ),
};

export const WithDateField: Story = {
  render: () => (
    <div style={docsFrame}>
      <Input label="DateField">
        <DateField breakpoint="desktop" today={DATE} />
      </Input>
    </div>
  ),
};

export const WithInputGroup: Story = {
  render: () => (
    <div style={docsFrame}>
      <Input label="InputGroup">
        <InputGroup>
          <DateField defaultValue={DATE} breakpoint="desktop" today={DATE} />
          <SelectField value="Value" />
        </InputGroup>
      </Input>
    </div>
  ),
};

export const WithCheckboxGroup: Story = {
  render: () => (
    <div style={docsFrame}>
      <Input label="CheckboxGroup">
        <CheckboxGroup orientation="horizontal">
          <CheckboxItem label="Label" />
          <CheckboxItem label="Label" />
        </CheckboxGroup>
      </Input>
    </div>
  ),
};

export const WithRadioGroup: Story = {
  render: () => (
    <div style={docsFrame}>
      <Input label="RadioGroup">
        <RadioGroup orientation="horizontal">
          <RadioItem value="a" label="Label" />
          <RadioItem value="b" label="Label" />
        </RadioGroup>
      </Input>
    </div>
  ),
};

export const WithMediaField: Story = {
  render: () => (
    <div style={docsFrame}>
      <Input label="MediaField">
        <MediaField breakpoint="desktop" />
      </Input>
    </div>
  ),
};

/** The textAreaMedia pair — two fields under one header, 12px apart. */
export const CombinedFields: Story = {
  render: () => (
    <div style={docsFrame}>
      <Input label="TextArea + MediaField">
        <TextArea />
        <MediaField breakpoint="desktop" />
      </Input>
    </div>
  ),
};

/** The header combinations (the component set). */
export const Overview: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 350px)", gap: 24 }}>
      <div>
        <span style={cap}>label</span>
        <Input label="Label">
          <TextField />
        </Input>
      </div>
      <div>
        <span style={cap}>label · loading</span>
        <Input label="Label" isLoading>
          <TextField />
        </Input>
      </div>
      <div>
        <span style={cap}>label + help text</span>
        <Input label="Label" helpText="Help text">
          <TextField />
        </Input>
      </div>
      <div>
        <span style={cap}>label + help text · loading</span>
        <Input label="Label" helpText="Help text" isLoading>
          <TextField />
        </Input>
      </div>
      <div>
        <span style={cap}>help text only</span>
        <Input helpText="Help text">
          <TextField />
        </Input>
      </div>
      <div>
        <span style={cap}>label (optional) + hint</span>
        <Input label="Label" labelCondition="optional" labelHint labelHintContent="More about this field">
          <TextField />
        </Input>
      </div>
      <div>
        <span style={cap}>strength indicator (password)</span>
        <Input label="New password" strength="strong">
          <PasswordField variant="new" defaultValue="abcdefgh12" />
        </Input>
      </div>
      <div>
        <span style={cap}>read-only field → "(read-only)"</span>
        <Input label="Label">
          <TextField defaultValue="Value" readOnly />
        </Input>
      </div>
    </div>
  ),
};

/** Every field type inside the same Input header (the Figma field variants). */
export const Fields: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 420 }}>
      <Input label="TextField" helpText="Help text">
        <TextField />
      </Input>
      <Input label="TextArea">
        <TextArea />
      </Input>
      <Input label="SelectField">
        <SelectField onClick={noop} />
      </Input>
      <Input label="PasswordField">
        <PasswordField />
      </Input>
      <Input label="DateField">
        <DateField breakpoint="desktop" today={DATE} />
      </Input>
      <Input label="InputGroup">
        <InputGroup>
          <DateField defaultValue={DATE} breakpoint="desktop" today={DATE} />
          <SelectField value="Value" />
        </InputGroup>
      </Input>
      <Input label="CheckboxGroup">
        <CheckboxGroup orientation="horizontal">
          <CheckboxItem label="Label" />
          <CheckboxItem label="Label" />
          <CheckboxItem label="Label" />
        </CheckboxGroup>
      </Input>
      <Input label="RadioGroup">
        <RadioGroup orientation="horizontal">
          <RadioItem value="a" label="Label" />
          <RadioItem value="b" label="Label" />
          <RadioItem value="c" label="Label" />
        </RadioGroup>
      </Input>
      <Input label="MediaField" helpText="Help text">
        <MediaField breakpoint="desktop" />
      </Input>
      <Input label="TextArea + MediaField" helpText="The textAreaMedia combination — two fields, 12px apart">
        <TextArea />
        <MediaField breakpoint="desktop" />
      </Input>
    </div>
  ),
};

/** The derived copy: "Enter/Choose/Provide [Label]" without an errorMessage prop. */
export const DerivedMessages: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 350 }}>
      <Input label="Name">
        <TextField isValid={false} />
      </Input>
      <Input label="Location">
        <SelectField isValid={false} onClick={noop} />
      </Input>
      <Input label="Reason for call">
        <TextArea isValid={false} />
      </Input>
      <Input label="Date & time">
        <InputGroup isValid={false}>
          <DateField breakpoint="desktop" today={DATE} />
          <SelectField />
        </InputGroup>
      </Input>
      <Input label="Photos">
        <MediaField breakpoint="desktop" isValid={false} />
      </Input>
    </div>
  ),
};
