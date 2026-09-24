import { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import ItemValue from "./ItemValue";
import { ItemValueProps } from "./ItemValue.types";

import AvatarUser from "../../Avatar/AvatarUser";
import { Icon } from "../../Icon/Icon";
import IconButton from "../../IconButton/IconButton";
import ListItem from "../../ListItem/ListItem";

import { docsFrame, noop } from "../../../stories/helpers";

const full: CSSProperties = { width: "100%" };
// A single example, centered on the preview.
const center: CSSProperties = { display: "flex", justifyContent: "center" };
// Examples side by side, --size-20 (80px) apart, centered on the preview.
const rowCenter: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--size-20)" };
// Full-width rows stacked --size-20 (80px) apart.
const columnRows: CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--size-20)", width: "100%" };
const slotRow: CSSProperties = { display: "flex", alignItems: "center", gap: "var(--size-2)" };

const icon = <Icon icon="diamonds-4" size={14} />;

const COLORS = ["strong", "subtle", "placeholder", "warning", "error"];

const meta: Meta<ItemValueProps> = {
  title: "Components/ItemText/ItemValue",
  component: ItemValue,
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div style={docsFrame}>{Story()}</div>],
  args: { value: "Value", color: "strong" },
  argTypes: {
    value: { description: "The value text.", control: { type: "text" }, table: { type: { summary: "ReactNode" } } },
    color: {
      description: 'Value color. Default "strong"; "placeholder" for a value that is not set. The chevron never follows it.',
      options: COLORS,
      control: { type: "select" },
      table: { type: { summary: COLORS.join(" | ") }, defaultValue: { summary: '"strong"' } },
    },
    slotLeft: {
      description: "Optional slot before the value — an Avatar or an Icon. An Icon here follows the value's color.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
    className: { description: "Extra class on the line.", control: false, table: { type: { summary: "string" } } },
  },
};
export default meta;

type Story = StoryObj<ItemValueProps>;

export const Playground: Story = {
  render: (args) => (
    <div style={center}>
      <ItemValue {...args} />
    </div>
  ),
};

export const Anatomy: Story = {
  render: () => (
    <div style={center}>
      <ItemValue value="Value" />
    </div>
  ),
};

// The value's color comes from the line inside; the chevron stays placeholder.
export const Color: Story = {
  render: () => (
    <div style={rowCenter}>
      <ItemValue value="Value" />
      <ItemValue value="Not set" color="placeholder" />
    </div>
  ),
};

// The left slot takes an Avatar or an Icon.
export const LeftSlot: Story = {
  render: () => (
    <div style={rowCenter}>
      <ItemValue value="Value" slotLeft={<AvatarUser size="xs" />} />
      <ItemValue value="Value" slotLeft={icon} />
    </div>
  ),
};

// Unlike the chevron and an Avatar, the slot's ICON follows the value's color —
// it sits inside the line, so it inherits through `currentColor`. The chevron
// stays placeholder in both.
export const LeftSlotIconColor: Story = {
  render: () => (
    <div style={rowCenter}>
      <ItemValue value="Value" slotLeft={icon} />
      <ItemValue value="Not set" color="placeholder" slotLeft={icon} />
    </div>
  ),
};

// ItemValue goes in a ListItem RIGHT SLOT, not in the right text block — which
// is what lets a control sit before it, like the View menu's sort-order button.
export const InARow: Story = {
  render: () => (
    <div style={columnRows}>
      <ListItem
        variant="title"
        title="Sort by"
        size="compact"
        isClickable
        onClick={noop}
        slotRight={
          <span style={slotRow}>
            <IconButton icon="arrow-down-short-wide" variant="ghost" size="md" aria-label="Sort order" />
            <ItemValue value="Status changed" />
          </span>
        }
      />
      <ListItem variant="title" title="Schedule horizon" size="compact" isClickable onClick={noop} slotRight={<ItemValue value="Next 7 days" />} />
    </div>
  ),
};

// The value keeps its width; the row's TITLE truncates instead.
export const TitleTruncatesFirst: Story = {
  render: () => (
    <div style={full}>
      <ListItem
        variant="title"
        title="A very long row title that has to give way to the value"
        isClickable
        onClick={noop}
        slotRight={<ItemValue value="Next 7 days" />}
      />
    </div>
  ),
};
