import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Segment from "./Segment";
import SegmentedControl from "./SegmentedControl";
import type { SegmentSize } from "./Segment.types";
import AvatarUser from "../Avatar/AvatarUser";
import { Icon } from "../Icon/Icon";
import { docsFrame } from "../../stories/helpers";

type StoryArgs = {
  segments: number;
  size: SegmentSize;
  isFullWidth: boolean;
};

/**
 * SegmentedControl — a track holding two to six Segments, with a divider
 * between them and exactly one selected. It switches between views of the same
 * content; navigating between sections of content is TabGroup's job.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/SegmentedControl",
  component: SegmentedControl,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<StoryArgs>;

const LABELS = ["One", "Two", "Three", "Four", "Five", "Six"];

// A control that owns its own value, so every story is clickable.
function Control({
  labels = LABELS.slice(0, 3),
  initial = 0,
  ...props
}: {
  labels?: string[];
  initial?: number;
} & Omit<React.ComponentProps<typeof SegmentedControl>, "children" | "value" | "onChange">) {
  const [value, setValue] = useState(labels[initial]);
  return (
    <SegmentedControl value={value} onChange={setValue} {...props}>
      {labels.map((label) => (
        <Segment key={label} value={label}>
          {label}
        </Segment>
      ))}
    </SegmentedControl>
  );
}

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ ...docsFrame, display: "flex", flexDirection: "column", gap: "var(--size-20)", alignItems: "center" }}>
    {children}
  </div>
);

// --- stories -----------------------------------------------------------------

/** Resize the set and the track to see how the control reacts. */
export const Playground: Story = {
  parameters: { layout: "centered" },
  args: { segments: 3, size: "lg", isFullWidth: false },
  argTypes: {
    segments: { control: { type: "range", min: 2, max: 6, step: 1 } },
    size: { options: ["md", "lg"], control: { type: "inline-radio" } },
    isFullWidth: { control: "boolean" },
  },
  render: ({ segments, size, isFullWidth }) => (
    <div style={{ width: 420 }}>
      <Control labels={LABELS.slice(0, segments)} size={size} isFullWidth={isFullWidth} />
    </div>
  ),
};

/** The hero — three segments, the first selected. */
export const Hero: Story = {
  render: () => (
    <Row>
      <Control />
    </Row>
  ),
};

/** The track, the segments edge to edge, and a divider between each pair. */
export const Anatomy: Story = {
  render: () => (
    <Row>
      <Control />
    </Row>
  ),
};

/** Two to six segments. Past six the row stops reading as one control. */
export const Segments: Story = {
  render: () => (
    <Row>
      {[2, 3, 4, 5, 6].map((count) => (
        <Control key={count} labels={LABELS.slice(0, count)} />
      ))}
    </Row>
  ),
};

/** Hugging (default), then stretched to the container. */
export const FullWidth: Story = {
  render: () => (
    <Row>
      <Control />
      <div style={{ width: "100%" }}>
        <Control isFullWidth />
      </div>
    </Row>
  ),
};

/** lg (36px) is the default; md (32px) is for a tighter row. */
export const Sizes: Story = {
  render: () => (
    <Row>
      <Control size="lg" />
      <Control size="md" />
    </Row>
  ),
};

/** The three shapes: label, slot and label, and slot alone. */
export const Content: Story = {
  render: () => (
    <Row>
      <SegmentedControl defaultValue="a">
        <Segment value="a">Label</Segment>
        <Segment value="b" slotLeft={<Icon icon="list" size={14} />}>
          Label
        </Segment>
        <Segment value="c" slotLeft={<Icon icon="grid-2" size={14} />} aria-label="Cards" />
      </SegmentedControl>
    </Row>
  ),
};

/** An Icon or an avatar before the label, and the slot-only segment. */
export const LeftSlot: Story = {
  render: () => (
    <Row>
      <SegmentedControl defaultValue="icon">
        <Segment value="icon" slotLeft={<Icon icon="list" size={14} />}>
          Icon
        </Segment>
        <Segment value="avatar" slotLeft={<AvatarUser size="xs" content="letters" characters="RC" />}>
          Avatar
        </Segment>
        <Segment value="list" slotLeft={<Icon icon="list" size={14} />} aria-label="List view" />
        <Segment value="cards" slotLeft={<Icon icon="grid-2" size={14} />} aria-label="Cards view" />
      </SegmentedControl>
    </Row>
  ),
};

/** Vertical stacks the slot over the label — lg only, and full width. */
export const Orientation: Story = {
  render: () => (
    <Row>
      <div style={{ width: "100%" }}>
        <SegmentedControl defaultValue="table" size="lg" orientation="vertical" isFullWidth>
          <Segment value="table" slotLeft={<Icon icon="table" size={14} />}>
            Table
          </Segment>
          <Segment value="cards" slotLeft={<Icon icon="grid-2" size={14} />}>
            Cards
          </Segment>
          <Segment value="timeline" slotLeft={<Icon icon="chart-gantt" size={14} />}>
            Timeline
          </Segment>
        </SegmentedControl>
      </div>
    </Row>
  ),
};

/** One segment is always selected — there is no empty state. */
export const Selection: Story = {
  render: () => (
    <Row>
      <Control initial={1} />
    </Row>
  ),
};

/** The two dividers touching the selection are hidden; the last segment has none. */
export const Divider: Story = {
  render: () => (
    <Row>
      {[0, 1, 2].map((index) => (
        <Control key={index} initial={index} />
      ))}
    </Row>
  ),
};

/** The warning colour holds in every state, so an inactive segment still shows it. */
export const Warning: Story = {
  render: () => (
    <Row>
      <SegmentedControl defaultValue="location">
        <Segment value="client">Client</Segment>
        <Segment value="location" isWarning>
          Location
        </Segment>
      </SegmentedControl>
      <SegmentedControl defaultValue="client">
        <Segment value="client">Client</Segment>
        <Segment value="location" isWarning>
          Location
        </Segment>
      </SegmentedControl>
    </Row>
  ),
};

/** Inactive: rest, then the hover, press and disabled steps. */
export const InactiveStates: Story = {
  render: () => (
    <Row>
      <SegmentedControl defaultValue="selected">
        <Segment value="selected">Selected</Segment>
        <Segment value="rest">Rest</Segment>
        <Segment value="disabled" isDisabled>
          Disabled
        </Segment>
      </SegmentedControl>
    </Row>
  ),
};

/**
 * The selection slides between segments. Click through these, and try the arrow
 * keys — the surface steps aside while a segment holds focus.
 */
export const Motion: Story = {
  render: () => (
    <Row>
      <Control labels={["Table", "Cards", "Timeline"]} />
      <div style={{ width: "100%" }}>
        <Control labels={["Day", "Week", "Month"]} isFullWidth />
      </div>
      <SegmentedControl defaultValue="client">
        <Segment value="client">Client</Segment>
        <Segment value="location" isWarning>
          Location
        </Segment>
      </SegmentedControl>
    </Row>
  ),
};

/** Focus: the ring at the segment's bounds, the fill redrawn inside it. */
export const Focus: Story = {
  render: () => (
    <Row>
      <Control />
      <p style={{ color: "var(--text-subtle)", margin: 0 }}>Tab into the control, then use the arrow keys</p>
    </Row>
  ),
};
