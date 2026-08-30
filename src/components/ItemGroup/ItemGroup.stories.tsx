import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import ItemGroup from "./ItemGroup";
import { ItemGroupProps } from "./ItemGroup.types";
import ListItem from "../ListItem/ListItem";
import ListItemSlotIcon from "../ListItem/ListItemSlotIcon";
import GroupLabel from "../GroupLabel/GroupLabel";
import Avatar from "../Avatar/Avatar";
import AvatarLocation from "../Avatar/AvatarLocation";
import CardFile from "../Card/CardFile";
import { FileType } from "../Card/CardFile.types";
import { noop } from "../../stories/helpers";

type StoryArgs = {
  label: string;
  divider: boolean;
  separated: boolean;
  truncateAfter: number;
  accordion: boolean;
};

const frame: React.CSSProperties = { width: 440 };

// The doc's demo rows: a location item (clickable, chevron) and a plain
// settings item (static, object avatar).
const addressItem = (key: number) => (
  <ListItem
    key={key}
    variant="titleCaption"
    title="123 Main Street, Suite 45, San Francisco, CA 987654"
    caption="Headquarters"
    avatar={<AvatarLocation size="xl" />}
    isClickable
    onClick={noop}
    slotRight={<ListItemSlotIcon icon="angle-right" />}
  />
);

const settingsItem = (key: number) => (
  <ListItem
    key={key}
    variant="titleCaption"
    title="Title"
    caption="Caption"
    avatar={<Avatar shape="square" content="icon" size="xl" />}
  />
);

const meta: Meta<StoryArgs> = {
  title: "Components/ItemGroup",
  component: ItemGroup,
  parameters: { layout: "centered" },
  args: { label: "Label", divider: false, separated: false, truncateAfter: 0, accordion: false },
  argTypes: {
    label: { type: "string", control: { type: "text" } },
    divider: { name: "bottom divider", control: { type: "boolean" } },
    separated: { control: { type: "boolean" } },
    truncateAfter: { name: "truncateAfter (0 = off)", control: { type: "number", min: 0 } },
    accordion: { control: { type: "boolean" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

/** Empty the label for the plain variant; separated groups can not truncate. */
export const Playground: Story = {
  render: ({ label, divider, separated, truncateAfter, accordion }) => {
    const groupLabel = label ? <GroupLabel label={label} /> : undefined;
    const props = {
      label: groupLabel,
      divider: groupLabel ? divider : undefined,
      separated,
      truncateAfter: !separated && truncateAfter > 0 ? truncateAfter : undefined,
      ...(groupLabel && accordion ? { accordion: true as const, defaultOpen: true } : {}),
    } as ItemGroupProps;
    return (
      <div style={frame}>
        <ItemGroup {...props}>{[0, 1, 2, 3].map(addressItem)}</ItemGroup>
      </div>
    );
  },
};

/** Default group — the only group on the list: no label, no dividers. */
export const DefaultGroup: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={frame}>
      <ItemGroup>{[0, 1].map(addressItem)}</ItemGroup>
    </div>
  ),
};

/** Separated items — a divider (4px margins) between every two items. */
export const SeparatedItems: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={frame}>
      <ItemGroup separated>{[0, 1, 2].map(settingsItem)}</ItemGroup>
    </div>
  ),
};

/** A group with header — a GroupLabel with 12px margins above the items. */
export const WithHeader: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={frame}>
      <ItemGroup label={<GroupLabel label="Label" />}>{[0, 1].map(addressItem)}</ItemGroup>
    </div>
  ),
};

/**
 * Truncation — only the first N items show, plus a "Show X more" button (10px
 * margins). Expanding is one-way: the button disappears and the group stays
 * expanded.
 */
export const Truncation: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={frame}>
      <ItemGroup truncateAfter={2}>{[0, 1, 2, 3, 4, 5].map(addressItem)}</ItemGroup>
    </div>
  ),
};

/**
 * Accordion — the GroupLabel header expands / collapses the items. Closed,
 * the header keeps its 12px bottom margin. Click the headers to toggle.
 */
export const Accordion: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ ...frame, display: "flex", flexDirection: "column", gap: "var(--size-6)" }}>
      <ItemGroup label={<GroupLabel label="Label" />} accordion defaultOpen>
        {[0, 1].map(addressItem)}
      </ItemGroup>
      <ItemGroup label={<GroupLabel label="Label" />} accordion>
        {[2, 3].map(addressItem)}
      </ItemGroup>
    </div>
  ),
};

/**
 * Stacked groups — the gap between groups is 0; the upper group sets
 * `divider` (a full-width 1px line at its very bottom). With more than one
 * group, every group needs a label.
 */
export const StackedGroups: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={frame}>
      <ItemGroup label={<GroupLabel label="Label" />} divider>
        {[0, 1].map(addressItem)}
      </ItemGroup>
      <ItemGroup label={<GroupLabel label="Label" />}>{[2, 3].map(addressItem)}</ItemGroup>
    </div>
  ),
};

// Interactive reorder: the group tracks the handle drag; on drop it reports
// (from, to) and the story reorders its array.
const DraggingDemo = () => {
  const [order, setOrder] = useState(["First", "Second", "Third", "Fourth", "Fifth"]);
  const move = (from: number, to: number) =>
    setOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  return (
    <div style={frame}>
      <ItemGroup label={<GroupLabel label="Label" />} onReorder={move}>
        {order.map((title) => (
          <ListItem
            key={title}
            variant="titleCaption"
            title={title}
            caption="Caption"
            avatar={<Avatar shape="square" content="icon" size="xl" />}
            isDraggable
          />
        ))}
      </ItemGroup>
    </div>
  );
};

/**
 * Dragging — grab a grip handle and drag: the original dims, a lifted copy
 * follows the pointer, and a black line marks the drop position. On drop the
 * group calls `onReorder(from, to)` and the consumer reorders its items.
 */
export const Dragging: Story = {
  parameters: { controls: { disable: true } },
  render: () => <DraggingDemo />,
};

// Cards view — the children are Cards (CardFile), laid out in a wrap grid. With
// `onReorder`, long-press a card and drag: the others reflow (2D) to open the
// drop slot; on drop the group reports (from, to).
const FILES: { name: string; fileType: FileType }[] = [
  { name: "Invoice.pdf", fileType: "pdf" },
  { name: "Photo.png", fileType: "image" },
  { name: "Report.doc", fileType: "word" },
  { name: "Budget.xls", fileType: "spreadsheet" },
  { name: "Deck.pptx", fileType: "presentation" },
  { name: "Notes.md", fileType: "markdown" },
];

const CardsDemo = () => {
  const [order, setOrder] = useState(FILES);
  const move = (from: number, to: number) =>
    setOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  return (
    <div style={{ width: 560 }}>
      <ItemGroup view="cards" label={<GroupLabel label="Files" />} onReorder={move}>
        {order.map((f) => (
          <CardFile key={f.name} name={f.name} fileType={f.fileType} onClick={noop} onMenuClick={noop} />
        ))}
      </ItemGroup>
    </div>
  );
};

/**
 * Cards view — a wrap grid of Cards instead of a list. Long-press a card to
 * start a drag; the grid reflows in 2D to show the drop slot, and `onReorder`
 * fires on drop.
 */
export const Cards: Story = {
  parameters: { controls: { disable: true } },
  render: () => <CardsDemo />,
};
