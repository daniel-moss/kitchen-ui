import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import TabGroup from "./TabGroup";
import TabItem from "./TabItem";
import type { TabGroupVariant } from "./TabGroup.types";
import type { TabItemSize } from "./TabItem.types";
import AvatarUser from "../Avatar/AvatarUser";
import { Icon } from "../Icon/Icon";
import { docsFrame } from "../../stories/helpers";

type StoryArgs = {
  variant: TabGroupVariant;
  size: TabItemSize;
  isFullWidth: boolean;
};

/**
 * TabGroup — a row of Tabs that navigates between sections of content. Two
 * styles: **pill** marks the selection with a soft filled shape and can sit
 * anywhere; **underlined** marks it with a line on the row's bottom edge, for
 * the row that labels the content directly underneath it.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Tabs/TabGroup",
  component: TabGroup,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<StoryArgs>;

const LABELS = ["Service", "Timesheet", "Summary"];

// A group that owns its own value, so every story is clickable. The underlined
// style needs a row with a height to fill — the frame gives it one.
function Tabs({
  labels = LABELS,
  initial = 0,
  ...props
}: { labels?: string[]; initial?: number } & Omit<
  React.ComponentProps<typeof TabGroup>,
  "children" | "value" | "onChange"
>) {
  const [value, setValue] = useState(labels[initial]);
  return (
    <TabGroup value={value} onChange={setValue} {...props}>
      {labels.map((label) => (
        <TabItem key={label} value={label}>
          {label}
        </TabItem>
      ))}
    </TabGroup>
  );
}

// The docs frame. Underlined tabs fill their row, so the row carries the 60px
// height and the bottom line their line sits on.
const Row = ({ children, bar = false }: { children: React.ReactNode; bar?: boolean }) => (
  <div style={{ ...docsFrame, display: "flex", flexDirection: "column", gap: "var(--size-20)", alignItems: "center" }}>
    {bar ? (
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          height: 60,
          width: "100%",
          justifyContent: "center",
          boxShadow: "inset 0 -1px 0 0 var(--gray-a4)",
        }}
      >
        {children}
      </div>
    ) : (
      children
    )}
  </div>
);

// --- stories -----------------------------------------------------------------

/** Switch the style, the size and the width. */
export const Playground: Story = {
  parameters: { layout: "centered" },
  args: { variant: "pill", size: "md", isFullWidth: false },
  argTypes: {
    variant: { options: ["pill", "underlined"], control: { type: "inline-radio" } },
    size: { options: ["md", "lg"], control: { type: "inline-radio" } },
    isFullWidth: { control: "boolean" },
  },
  render: ({ variant, size, isFullWidth }) => (
    <div style={{ width: 420, display: "flex", height: 60, alignItems: "stretch" }}>
      <Tabs variant={variant} size={size} isFullWidth={isFullWidth} />
    </div>
  ),
};

/** The hero — an underlined row on the bar it labels. */
export const Hero: Story = {
  render: () => (
    <Row bar>
      <Tabs variant="underlined" />
    </Row>
  ),
};

/** A row of tabs with no container of its own. */
export const Anatomy: Story = {
  render: () => (
    <Row>
      <Tabs />
    </Row>
  ),
};

/** pill, then underlined — the two are not interchangeable. */
export const Styles: Story = {
  render: () => (
    <>
      <Row>
        <Tabs variant="pill" />
      </Row>
      <Row bar>
        <Tabs variant="underlined" />
      </Row>
    </>
  ),
};

/** Hugging, then stretched to the container. */
export const FullWidth: Story = {
  render: () => (
    <>
      <Row>
        <div style={{ width: "100%" }}>
          <Tabs variant="pill" isFullWidth />
        </div>
      </Row>
      <Row bar>
        <div style={{ width: "100%", display: "flex" }}>
          <Tabs variant="underlined" isFullWidth />
        </div>
      </Row>
    </>
  ),
};

/** md and lg — the step up changes the padding only. Underlined has one size. */
export const Sizes: Story = {
  render: () => (
    <Row>
      <Tabs variant="pill" size="md" />
      <Tabs variant="pill" size="lg" />
    </Row>
  ),
};

/** The five shapes: label, slot and label, label and counter, all three, and slot alone. */
export const Content: Story = {
  render: () => (
    <Row>
      <TabGroup defaultValue="a">
        <TabItem value="a">Label</TabItem>
        <TabItem value="b" slotLeft={<Icon icon="list" size={14} />}>
          Label
        </TabItem>
        <TabItem value="c" counter={4}>
          Label
        </TabItem>
        <TabItem value="d" slotLeft={<Icon icon="list" size={14} />} counter={4}>
          Label
        </TabItem>
        <TabItem value="e" slotLeft={<Icon icon="grid-2" size={14} />} aria-label="Cards" />
      </TabGroup>
    </Row>
  ),
};

/** An Icon or an avatar before the label, and the slot-only tab. */
export const LeftSlot: Story = {
  render: () => (
    <Row>
      <TabGroup defaultValue="icon">
        <TabItem value="icon" slotLeft={<Icon icon="list" size={14} />}>
          Icon
        </TabItem>
        <TabItem value="avatar" slotLeft={<AvatarUser size="xs" content="letters" characters="RC" />}>
          Avatar
        </TabItem>
        <TabItem value="only" slotLeft={<Icon icon="grid-2" size={14} />} aria-label="Cards view" />
      </TabGroup>
    </Row>
  ),
};

/** One tab is always selected; the style carries its own mark. */
export const Selection: Story = {
  render: () => (
    <>
      <Row>
        <Tabs variant="pill" initial={1} />
      </Row>
      <Row bar>
        <Tabs variant="underlined" initial={1} />
      </Row>
    </>
  ),
};

/** The warning colour holds in every state, so an inactive tab still shows it. */
export const Warning: Story = {
  render: () => (
    <Row>
      <TabGroup defaultValue="service">
        <TabItem value="service">Service</TabItem>
        <TabItem value="details" warning>
          Details
        </TabItem>
      </TabGroup>
      <TabGroup defaultValue="details">
        <TabItem value="service">Service</TabItem>
        <TabItem value="details" warning>
          Details
        </TabItem>
      </TabGroup>
    </Row>
  ),
};

/** A bar for the label, a circle for the slot — and it loads unselected. */
export const Loading: Story = {
  render: () => (
    <Row>
      <TabGroup defaultValue="a">
        <TabItem value="a">Service</TabItem>
        <TabItem value="b" loading>
          Timesheet
        </TabItem>
        <TabItem value="c" slotLeft={<Icon icon="list" size={14} />} loading>
          Summary
        </TabItem>
      </TabGroup>
    </Row>
  ),
};

/** Rest, selected and disabled, in both styles. */
export const States: Story = {
  render: () => (
    <>
      <Row>
        <TabGroup variant="pill" defaultValue="selected">
          <TabItem value="selected">Selected</TabItem>
          <TabItem value="rest">Rest</TabItem>
          <TabItem value="disabled" disabled>
            Disabled
          </TabItem>
        </TabGroup>
      </Row>
      <Row bar>
        <TabGroup variant="underlined" defaultValue="selected">
          <TabItem value="selected">Selected</TabItem>
          <TabItem value="rest">Rest</TabItem>
          <TabItem value="disabled" disabled>
            Disabled
          </TabItem>
        </TabGroup>
      </Row>
    </>
  ),
};

/** Focus: the ring at the tab's bounds. Tab in, then use the arrow keys. */
export const Focus: Story = {
  render: () => (
    <Row>
      <Tabs />
      <p style={{ color: "var(--text-subtle)", margin: 0 }}>Tab into the row, then use the arrow keys</p>
    </Row>
  ),
};
