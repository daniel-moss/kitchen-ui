import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { docsFrame, noop } from "../../stories/helpers";
import { Icon } from "../Icon/Icon";
import IconButton from "../IconButton/IconButton";
import Menu from "../Menu/Menu";
import MenuItem from "../Menu/MenuItem";
import MenuItemGroup from "../Menu/MenuItemGroup";
import HoverTooltip from "../Tooltip/HoverTooltip";
import FilterChip from "./FilterChip";
import FilterChipGroup from "./FilterChipGroup";

const meta: Meta<typeof FilterChipGroup> = {
  title: "Components/TopBarFilter/FilterChipGroup",
  component: FilterChipGroup,
  // fullscreen — the stories' own frame provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: {
    breakpoint: "auto",
  },
  argTypes: {
    children: { control: false },
    addMenu: { control: false },
    onAddClick: { control: false },
    className: { control: false },
    breakpoint: { options: ["auto", "desktop", "mobile"], control: { type: "inline-radio" } },
  },
};
export default meta;

type Story = StoryObj<typeof FilterChipGroup>;

const diamond = <Icon icon="diamonds-4" size={14} />;

// The default chip from the Figma examples: icon slot + Property/condition/Value.
const defaultChip = (key: number) => (
  <FilterChip
    key={key}
    slotLeft={diamond}
    property="Property"
    condition="condition"
    value="Value"
    onConditionClick={noop}
    onValueClick={noop}
    onRemove={noop}
  />
);

// The wrap example's compact chip: text only, Filter/is/Value.
const compactChip = (key: number) => (
  <FilterChip
    key={key}
    property="Filter"
    condition="is"
    value="Value"
    onConditionClick={noop}
    onValueClick={noop}
    onRemove={noop}
  />
);

const addMenu = (
  <MenuItemGroup>
    <MenuItem label="Action" slotLeft={diamond} onClick={noop} />
    <MenuItem label="Action" slotLeft={diamond} onClick={noop} />
  </MenuItemGroup>
);

export const Playground: Story = {
  render: (args) => (
    <div style={docsFrame}>
      <FilterChipGroup {...args} addMenu={addMenu}>
        {defaultChip(1)}
        {defaultChip(2)}
      </FilterChipGroup>
    </div>
  ),
};

/** The hero: one chip and the "Add filter" button. */
export const Hero: Story = {
  render: () => (
    <div style={docsFrame}>
      <FilterChipGroup breakpoint="desktop" addMenu={addMenu}>
        {defaultChip(1)}
      </FilterChipGroup>
    </div>
  ),
};

/** Desktop: a wrapping row of chips, the "Add filter" button after them. */
export const AnatomyDesktop: Story = {
  render: () => (
    <div style={docsFrame}>
      {/* 440px matches the Figma preview width, so the four chips wrap the same way. */}
      <div style={{ maxWidth: 440 }}>
        <FilterChipGroup breakpoint="desktop" addMenu={addMenu}>
          {compactChip(1)}
          {compactChip(2)}
          {compactChip(3)}
          {compactChip(4)}
        </FilterChipGroup>
      </div>
    </div>
  ),
};

/** Mobile: a column of full-width chips, no "Add filter" button. */
export const AnatomyMobile: Story = {
  render: () => (
    <div style={docsFrame}>
      <FilterChipGroup breakpoint="mobile">
        {defaultChip(1)}
        {defaultChip(2)}
        {defaultChip(3)}
        {defaultChip(4)}
      </FilterChipGroup>
    </div>
  ),
};

/** Live: hovering the "Add filter" button shows its tooltip. */
export const AddFilterTooltip: Story = {
  render: () => (
    <div style={{ ...docsFrame, display: "flex", justifyContent: "center" }}>
      <HoverTooltip text="Add filter">
        <IconButton variant="ghost" size="md" icon="plus" aria-label="Add filter" onClick={noop} />
      </HoverTooltip>
    </div>
  ),
};

// The button ↔ Menu wiring, isolated like the Figma example: the button is
// pressed while the Menu is open, the Menu sits 4px below, left-aligned.
function AddFilterMenuDemo() {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ ...docsFrame, display: "flex", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, minHeight: 130 }}>
        <IconButton
          variant="ghost"
          size="md"
          icon="plus"
          aria-label="Add filter"
          isPressed={open}
          onClick={() => setOpen(!open)}
        />
        <Menu open={open} onClose={() => setOpen(false)} breakpoint="desktop">
          {addMenu}
        </Menu>
      </div>
    </div>
  );
}

/** Live: clicking the "Add filter" button toggles its Menu. */
export const AddFilterMenu: Story = {
  render: () => <AddFilterMenuDemo />,
};
