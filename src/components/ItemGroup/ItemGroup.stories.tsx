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
import IconButton from "../IconButton/IconButton";
import { FileType } from "../Card/CardFile.types";
import { noop } from "../../stories/helpers";

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

// `ItemGroupProps` is a UNION (the header, items and accordion axes exclude
// each other), and react-docgen cannot read JSDoc off a union — it produced an
// empty table. So the props table is declared here by hand; keep it in step
// with the JSDoc in ItemGroup.types.ts.
const slot = (summary: string, description: string) => ({
  control: false as const,
  description,
  table: { type: { summary } },
});
const flag = (description: string, defaultValue?: string) => ({
  control: false as const,
  description,
  table: { type: { summary: "boolean" }, ...(defaultValue ? { defaultValue: { summary: defaultValue } } : {}) },
});

const meta: Meta<ItemGroupProps> = {
  title: "Components/ItemGroup",
  component: ItemGroup,
  parameters: { layout: "centered" },
  argTypes: {
    children: slot("ReactNode", "The items — `ListItem`s in list view, `Card`s in cards view. Each view has its own slot in Figma, so switching the view keeps both."),
    view: {
      options: ["list", "cards"],
      control: { type: "inline-radio" },
      description: "`list` stacks ListItems with no gap and 4px inset; `cards` wraps Cards at 12px gaps with 16px inset, each card flexing 106–184px.",
      table: { type: { summary: '"list" | "cards"' }, defaultValue: { summary: '"list"' } },
    },
    cardCountBasis: {
      control: { type: "number" },
      description: "Cards view only: size the columns as if the group held this many cards. Set it to the largest count among sibling groups so several groups in one module share ONE card width.",
      table: { type: { summary: "number" } },
    },
    label: slot("ReactNode", "A `GroupLabel` element shown as the header, with 12px margins. We label a group only when there is more than one — a single group carries no header."),
    divider: flag("1px divider at the very bottom, inset `--size-4` (16px) on each side. Set it when another group renders below this one: the gap between groups is 0 and the divider does the separating.", "false"),
    separated: flag("Puts a Divider between every two items — 4px above and below, 12px on the sides (Settings). List-only, and a separated group is never truncated.", "false"),
    truncateAfter: {
      control: { type: "number", min: 0 },
      description: "Show only the first N items plus a full-width lg ghost Button naming how many are hidden. Two-way: once open the button becomes \"Show less\". Never on a separated group or an accordion.",
      table: { type: { summary: "number" } },
    },
    onReorder: slot("(from: number, to: number) => void", "Enables drag-reorder. Called on drop with the old and new index — reorder your own array there; the group renders `children` as-is. List rows need `isDraggable`."),
    isAccordion: flag("The GroupLabel header becomes a toggle that collapses the group. Needs `label`, and is never combined with truncation.", "false"),
    open: flag("Controlled open state (`isAccordion`)."),
    defaultOpen: flag("Uncontrolled initial open state (`isAccordion`).", "false"),
    onOpenChange: slot("(open: boolean) => void", "Called with the new open state (`isAccordion`)."),
    disabled: flag("Dims the header and stops it responding. Accordion only.", "false"),
    className: slot("string", "Extra class on the group."),
  },
};

export default meta;

type Story = StoryObj<ItemGroupProps>;

/** The group with a header. Switch the view and the items below. */
export const Playground: Story = {
  render: (args: ItemGroupProps) => (
    <div style={frame}>
      <ItemGroup label={<GroupLabel label="Label" />} {...args}>
        {[0, 1, 2, 3].map(addressItem)}
      </ItemGroup>
    </div>
  ),
};

/** Every part at once — header, items, the reveal button, the bottom divider. */
export const Anatomy: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={frame}>
      <ItemGroup label={<GroupLabel label="Label" counter={5} />} truncateAfter={2} divider>
        {[0, 1, 2, 3, 4].map(addressItem)}
      </ItemGroup>
    </div>
  ),
};

/**
 * The header is a GroupLabel — its label, counter, caption, left slot, action
 * and states are set on it, not on the group.
 */
export const HeaderContent: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={frame}>
      <ItemGroup
        label={
          <GroupLabel
            label="Label"
            counter={12}
            caption="Caption"
            slotLeft={<Avatar shape="square" content="icon" size="sm" />}
            slotRight={<IconButton icon="ellipsis" variant="ghost" size="md" aria-label="More" onClick={noop} />}
          />
        }
      >
        {[0, 1].map(addressItem)}
      </ItemGroup>
    </div>
  ),
};

/** Each view has its own slot, so switching the view keeps both sets of items. */
export const ItemsViews: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-10)", width: 560 }}>
      <ItemGroup label={<GroupLabel label="List" />}>{[0, 1].map(addressItem)}</ItemGroup>
      <ItemGroup view="cards" label={<GroupLabel label="Cards" />}>
        {FILES.slice(0, 3).map((f) => (
          <CardFile key={f.name} name={f.name} fileType={f.fileType} onClick={noop} onMenuClick={noop} />
        ))}
      </ItemGroup>
    </div>
  ),
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
 * margins). Expanding is two-way: the button becomes "Show less" and collapses
 * the group back to the first N.
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
      <ItemGroup label={<GroupLabel label="Label" />} isAccordion defaultOpen>
        {[0, 1].map(addressItem)}
      </ItemGroup>
      <ItemGroup label={<GroupLabel label="Label" />} isAccordion>
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
