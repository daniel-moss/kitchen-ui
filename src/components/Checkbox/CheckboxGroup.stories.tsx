import { ReactNode } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { docsFrame } from "../../stories/helpers";
import CheckboxGroup from "./CheckboxGroup";
import { CheckboxGroupOrientation } from "./CheckboxGroup.types";
import CheckboxItem from "./CheckboxItem";
import Input from "../Input/Input";

type StoryArgs = {
  orientation: CheckboxGroupOrientation;
  isValid: boolean;
  errorMessage: string;
  caption: boolean;
};

// Return an array (not a fragment) so the group's per-item injection reaches each one.
const items = (count: number, caption: boolean) =>
  Array.from({ length: count }, (_, i) => (
    <CheckboxItem key={i} label="Label" caption={caption ? "Caption" : undefined} />
  ));

// Docs frame: examples stacked at --size-20 (80px).
const Col = ({ children }: { children: ReactNode }) => (
  <div style={{ ...docsFrame, display: "flex", flexDirection: "column", gap: "var(--size-20)" }}>{children}</div>
);

/**
 * CheckboxGroup — groups up to 4 card CheckboxItems, laid out vertically or
 * horizontally, with a validation state. When invalid, the items turn error
 * and an error message shows below. Bare — label and help text come from the
 * Input wrapper.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Checkbox/CheckboxGroup",
  component: CheckboxGroup,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<StoryArgs>;

/** Use the controls to preview orientation and validity. */
export const Playground: Story = {
  // The synthetic playground args/argTypes live on THIS story (not the meta) so
  // the docs-page ArgTypes table stays pure docgen from CheckboxGroup.types.ts.
  parameters: { layout: "centered" },
  args: {
    orientation: "vertical",
    isValid: true,
    errorMessage: "Choose an option",
    caption: true,
  },
  argTypes: {
    orientation: { options: ["vertical", "horizontal"], control: { type: "inline-radio" } },
    isValid: { control: { type: "boolean" } },
    errorMessage: { control: { type: "text" } },
    caption: { control: { type: "boolean" } },
  },
  render: ({ orientation, isValid, errorMessage, caption }) => (
    <div style={{ width: 420 }}>
      <CheckboxGroup orientation={orientation} isValid={isValid} errorMessage={errorMessage}>
        {items(3, orientation === "vertical" && caption)}
      </CheckboxGroup>
    </div>
  ),
};

/** Live — a vertical group of three cards; click to select any of them. */
export const Interactive: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Col>
      <CheckboxGroup>{items(3, true)}</CheckboxGroup>
    </Col>
  ),
};

/** The two orientations: horizontal shares the width equally; vertical stacks. */
export const Orientation: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Col>
      <CheckboxGroup orientation="horizontal">{items(2, false)}</CheckboxGroup>
      <CheckboxGroup>{items(2, true)}</CheckboxGroup>
    </Col>
  ),
};

/** Invalid — every item turns error and one shared message shows below. */
export const Invalid: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Col>
      <CheckboxGroup orientation="horizontal" isValid={false} errorMessage="Choose Type">
        {items(3, false)}
      </CheckboxGroup>
      <CheckboxGroup isValid={false} errorMessage="Choose Type">
        {items(3, true)}
      </CheckboxGroup>
    </Col>
  ),
};

/** Inside an Input: shared label/help, and the derived "Choose [Label]". */
export const InsideInput: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Col>
      <Input label="Type" helpText="Help text">
        <CheckboxGroup orientation="horizontal" isValid={false}>
          {items(3, false)}
        </CheckboxGroup>
      </Input>
      <Input label="Type" helpText="Help text">
        <CheckboxGroup isValid={false}>{items(3, true)}</CheckboxGroup>
      </Input>
    </Col>
  ),
};
