import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Chip from "./Chip";
import ChipGroup from "./ChipGroup";
import type { ChipSize } from "./Chip.types";
import { docsFrame, noop } from "../../stories/helpers";

type StoryArgs = {
  count: number;
  size: ChipSize;
  width: number;
};

/**
 * ChipGroup — the container for a row of Chips. They wrap onto more lines when
 * the row runs out of width, with `--size-2` (8px) between them on both axes.
 * Layout only: the consumer owns which Chip is `active`.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Chip/ChipGroup",
  component: ChipGroup,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<StoryArgs>;

const CUISINES = [
  "Pizza",
  "Sushi",
  "Burgers",
  "Tacos",
  "Ramen",
  "Barbecue",
  "Salads",
  "Breakfast",
  "Desserts",
  "Sandwiches",
];

// --- stories -----------------------------------------------------------------

/** Chips in a wrapping row — resize the width to see them reflow. */
export const Playground: Story = {
  parameters: { layout: "centered" },
  args: { count: 6, size: "md", width: 320 },
  argTypes: {
    count: { control: { type: "range", min: 1, max: 10, step: 1 } },
    size: { options: ["sm", "md", "lg"], control: { type: "inline-radio" } },
    width: { control: { type: "range", min: 160, max: 640, step: 8 } },
  },
  render: ({ count, size, width }) => (
    <div style={{ width }}>
      <ChipGroup>
        {CUISINES.slice(0, count).map((label) => (
          <Chip key={label} size={size} onClick={noop}>
            {label}
          </Chip>
        ))}
      </ChipGroup>
    </div>
  ),
};

/** The group is a plain row of Chips, `--size-2` (8px) apart. */
export const Hero: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ ...docsFrame, display: "flex", justifyContent: "center" }}>
      <ChipGroup>
        <Chip onClick={noop}>Chip</Chip>
        <Chip onClick={noop}>Chip</Chip>
        <Chip onClick={noop}>Chip</Chip>
      </ChipGroup>
    </div>
  ),
};

/** When the row runs out of width the Chips wrap; the gap is 8px on both axes. */
export const Wrapping: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <div style={{ maxWidth: 320 }}>
        <ChipGroup>
          {CUISINES.map((label) => (
            <Chip key={label} onClick={noop}>
              {label}
            </Chip>
          ))}
        </ChipGroup>
      </div>
    </div>
  ),
};

// Full width — the weekday row from the "Repeat on" input: the chips share
// the row equally and the consumer keeps the picked days (no selection by
// default, per the design).
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const FullWidthDemo = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (label: string) =>
    setSelected((prev) => (prev.includes(label) ? prev.filter((v) => v !== label) : [...prev, label]));
  return (
    <ChipGroup isFullWidth>
      {WEEKDAYS.map((label) => (
        <Chip key={label} size="lg" isSelected={selected.includes(label)} onClick={() => toggle(label)}>
          {label}
        </Chip>
      ))}
    </ChipGroup>
  );
};

/** isFullWidth — one non-wrapping row, the chips share the width equally. */
export const FullWidth: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <FullWidthDemo />
    </div>
  ),
};

// Single-select — the consumer keeps ONE selected key.
const SingleSelectDemo = () => {
  const [selected, setSelected] = useState<string | null>("Sushi");
  return (
    <ChipGroup>
      {CUISINES.slice(0, 5).map((label) => (
        <Chip key={label} isSelected={selected === label} onClick={() => setSelected(label)}>
          {label}
        </Chip>
      ))}
    </ChipGroup>
  );
};

/** Live — single-select: the consumer keeps one selected value. */
export const SingleSelect: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ ...docsFrame, display: "flex", justifyContent: "center" }}>
      <SingleSelectDemo />
    </div>
  ),
};

// Multi-select — the consumer keeps a Set of selected keys.
const MultiSelectDemo = () => {
  const [selected, setSelected] = useState<string[]>(["Sushi", "Ramen"]);
  const toggle = (label: string) =>
    setSelected((prev) => (prev.includes(label) ? prev.filter((v) => v !== label) : [...prev, label]));
  return (
    <ChipGroup>
      {CUISINES.slice(0, 5).map((label) => (
        <Chip key={label} isSelected={selected.includes(label)} onClick={() => toggle(label)}>
          {label}
        </Chip>
      ))}
    </ChipGroup>
  );
};

/** Live — multi-select: the consumer keeps a list of selected values. */
export const MultiSelect: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ ...docsFrame, display: "flex", justifyContent: "center" }}>
      <MultiSelectDemo />
    </div>
  ),
};

/** Any Chip size works — keep one size inside a group. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ ...docsFrame, display: "flex", flexDirection: "column", gap: "var(--size-4)" }}>
      {(["sm", "md", "lg"] as ChipSize[]).map((size) => (
        <ChipGroup key={size}>
          {CUISINES.slice(0, 4).map((label) => (
            <Chip key={label} size={size} onClick={noop}>
              {label}
            </Chip>
          ))}
        </ChipGroup>
      ))}
    </div>
  ),
};
