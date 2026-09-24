import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Chip from "./Chip";
import ChipGroup from "./ChipGroup";
import type { ChipSize } from "./Chip.types";
import type { ChipSelectionMode } from "./ChipSelectionModeContext";
import { Icon } from "../Icon/Icon";
import { docsFrame, noop } from "../../stories/helpers";

type StoryArgs = {
  count: number;
  size: ChipSize;
  width: number;
  selectionMode: ChipSelectionMode;
};

/**
 * ChipGroup — the container for a row of Chips. They wrap onto more lines when
 * the row runs out of width, with `--size-2` (8px) between them on both axes.
 * The consumer owns which Chip is `isSelected`; the group owns validation —
 * `isValid={false}` turns every chip error and shows the message below.
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
  args: { count: 6, size: "md", width: 320, selectionMode: "multiple" },
  argTypes: {
    count: { control: { type: "range", min: 1, max: 10, step: 1 } },
    size: { options: ["sm", "md", "lg"], control: { type: "inline-radio" } },
    width: { control: { type: "range", min: 160, max: 640, step: 8 } },
    selectionMode: { options: ["multiple", "single"], control: { type: "inline-radio" } },
  },
  render: ({ count, size, width, selectionMode }) => (
    <div style={{ width }}>
      <ChipGroup selectionMode={selectionMode}>
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

// The two full-width boards use the SAME chips, so the only difference the
// reader sees is the sizing.
const TIME_FRAMES = ["Day", "3 days", "Week", "Month"];

/** isFullWidth = false — the chips hug their labels and the row wraps. */
export const FullWidthOff: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <ChipGroup>
        {TIME_FRAMES.map((label) => (
          <Chip key={label} size="lg" onClick={noop}>
            {label}
          </Chip>
        ))}
      </ChipGroup>
    </div>
  ),
};

/** isFullWidth = true — one non-wrapping row, the chips share the width equally. */
export const FullWidth: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <ChipGroup isFullWidth>
        {TIME_FRAMES.map((label) => (
          <Chip key={label} size="lg" onClick={noop}>
            {label}
          </Chip>
        ))}
      </ChipGroup>
    </div>
  ),
};

// Pick one — selectionMode="single": the chips announce themselves as a radio
// group, Tab reaches the row once and the arrows move between them. The
// consumer still keeps the value.
const SingleSelectDemo = () => {
  const [selected, setSelected] = useState<string>("Sushi");
  return (
    <ChipGroup selectionMode="single">
      {CUISINES.slice(0, 5).map((label) => (
        <Chip key={label} isSelected={selected === label} onClick={() => setSelected(label)}>
          {label}
        </Chip>
      ))}
    </ChipGroup>
  );
};

/** Live — pick one: `selectionMode="single"`, one chip always selected. Try the arrow keys. */
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

/** Invalid — every chip turns error and the message shows 6px below. */
export const Validation: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <ChipGroup isValid={false} errorMessage="Choose Cuisine">
        {CUISINES.slice(0, 3).map((label) => (
          <Chip key={label} onClick={noop}>
            {label}
          </Chip>
        ))}
      </ChipGroup>
    </div>
  ),
};

/** A group holds one kind of chip — one size and one orientation. */
export const OneKindOfChip: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ ...docsFrame, display: "flex", flexDirection: "column", gap: "var(--size-8)" }}>
      <ChipGroup>
        {CUISINES.slice(0, 3).map((label) => (
          <Chip key={label} onClick={noop}>
            {label}
          </Chip>
        ))}
      </ChipGroup>
      <ChipGroup>
        {CUISINES.slice(0, 3).map((label) => (
          <Chip key={label} orientation="vertical" slotLeft={<Icon icon="diamonds-4" size={14} />} onClick={noop}>
            {label}
          </Chip>
        ))}
      </ChipGroup>
    </div>
  ),
};
