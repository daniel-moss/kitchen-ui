import { ReactNode } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { docsFrame } from "../../stories/helpers";
import RadioGroup from "./RadioGroup";
import { RadioGroupOrientation } from "./RadioGroup.types";
import RadioItem from "./RadioItem";
import Input from "../Input/Input";

type StoryArgs = {
  orientation: RadioGroupOrientation;
  isValid: boolean;
  errorMessage: string;
  caption: boolean;
};

const VALUES = ["a", "b", "c", "d"];

// Return an array (not a fragment) so the group's per-item injection reaches
// each one. Each RadioItem carries a `value` — the group owns the selection.
const items = (count: number, caption: boolean) =>
  VALUES.slice(0, count).map((v) => (
    <RadioItem key={v} value={v} label="Label" caption={caption ? "Caption" : undefined} />
  ));

// Docs frame: examples stacked at --size-20 (80px).
const Col = ({ children }: { children: ReactNode }) => (
  <div style={{ ...docsFrame, display: "flex", flexDirection: "column", gap: "var(--size-20)" }}>{children}</div>
);

/**
 * RadioGroup — groups up to 4 card RadioItems, laid out vertically or
 * horizontally, with a validation state. Single-select: only one item can be
 * selected. When invalid, the items turn error and an error message shows
 * below. Bare — label and help text come from the Input wrapper.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Radio/RadioGroup",
  component: RadioGroup,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<StoryArgs>;

/** Use the controls to preview orientation and validity. */
export const Playground: Story = {
  // The synthetic playground args/argTypes live on THIS story (not the meta) so
  // the docs-page ArgTypes table stays pure docgen from RadioGroup.types.ts.
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
      <RadioGroup orientation={orientation} isValid={isValid} errorMessage={errorMessage} defaultValue="a">
        {items(3, orientation === "vertical" && caption)}
      </RadioGroup>
    </div>
  ),
};

/** Live — a vertical group of three cards; click to change the selection. */
export const Interactive: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Col>
      <RadioGroup defaultValue="a">{items(3, true)}</RadioGroup>
    </Col>
  ),
};

/** The two orientations: horizontal shares the width equally; vertical stacks. */
export const Orientation: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Col>
      <RadioGroup orientation="horizontal" defaultValue="a">
        {items(2, false)}
      </RadioGroup>
      <RadioGroup defaultValue="a">{items(2, true)}</RadioGroup>
    </Col>
  ),
};

/** Invalid — every item turns error and one shared message shows below. */
export const Invalid: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Col>
      <RadioGroup orientation="horizontal" isValid={false} errorMessage="Choose Type">
        {items(3, false)}
      </RadioGroup>
      <RadioGroup isValid={false} errorMessage="Choose Type">
        {items(3, true)}
      </RadioGroup>
    </Col>
  ),
};

/** Inside an Input: shared label/help, and the derived "Choose [Label]". */
export const InsideInput: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Col>
      <Input label="Type" helpText="Help text">
        <RadioGroup orientation="horizontal" isValid={false}>
          {items(3, false)}
        </RadioGroup>
      </Input>
      <Input label="Type" helpText="Help text">
        <RadioGroup isValid={false}>{items(3, true)}</RadioGroup>
      </Input>
    </Col>
  ),
};
