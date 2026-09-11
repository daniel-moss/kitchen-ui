import type { Meta, StoryObj } from "@storybook/react";

import { docsFrame, noop } from "../../stories/helpers";
import { Icon } from "../Icon/Icon";
import MenuItem from "../Menu/MenuItem";
import MenuItemGroup from "../Menu/MenuItemGroup";
import FilterChip from "./FilterChip";
import TopBarFilter from "./TopBarFilter";

const meta: Meta<typeof TopBarFilter> = {
  title: "Components/TopBarFilter/TopBarFilter",
  component: TopBarFilter,
  // fullscreen — the stories' own frame provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: {
    breakpoint: "desktop",
  },
  argTypes: {
    children: { control: false },
    addMenu: { control: false },
    onAddClick: { control: false },
    onClearAll: { control: false },
    onReset: { control: false },
    className: { control: false },
    breakpoint: { options: ["auto", "desktop", "mobile"], control: { type: "inline-radio" } },
  },
};
export default meta;

type Story = StoryObj<typeof TopBarFilter>;

const diamond = <Icon icon="diamonds-4" size={14} />;

// The default chip from the Figma examples: icon slot + Property/condition/Value.
const defaultChip = (key: number, isLocked = false) => (
  <FilterChip
    key={key}
    slotLeft={diamond}
    property="Property"
    condition="condition"
    value="Value"
    isLocked={isLocked}
    onConditionClick={isLocked ? undefined : noop}
    onValueClick={noop}
    onRemove={isLocked ? undefined : noop}
  />
);

// A compact chip (Filter/is/Value) — the wrap example uses these so the rows
// wrap inside the docs column the way the wider Figma preview wraps.
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
      <TopBarFilter {...args} addMenu={addMenu} onClearAll={noop}>
        {defaultChip(1)}
        {defaultChip(2)}
      </TopBarFilter>
    </div>
  ),
};

/** The standard bar: one chip, the "Add filter" button and "Clear all". */
export const Hero: Story = {
  render: () => (
    <div style={docsFrame}>
      <TopBarFilter breakpoint="desktop" addMenu={addMenu} onClearAll={noop}>
        {defaultChip(1)}
      </TopBarFilter>
    </div>
  ),
};

/** Standard view: "Clear all" in the right slot; the bar grows when chips wrap. */
export const StandardView: Story = {
  render: () => (
    <div style={docsFrame}>
      <TopBarFilter breakpoint="desktop" addMenu={addMenu} onClearAll={noop}>
        {compactChip(1)}
        {compactChip(2)}
        {compactChip(3)}
        {compactChip(4)}
      </TopBarFilter>
    </div>
  ),
};

/** A locked filter (no "remove" box), no own filters yet — the right slot is empty. */
export const LockedFiltersEmpty: Story = {
  render: () => (
    <div style={docsFrame}>
      <TopBarFilter breakpoint="desktop" addMenu={addMenu}>
        {defaultChip(1, true)}
      </TopBarFilter>
    </div>
  ),
};

/** A locked filter plus the user's own — "Reset" in the right slot. */
export const LockedFiltersReset: Story = {
  render: () => (
    <div style={docsFrame}>
      <TopBarFilter breakpoint="desktop" addMenu={addMenu} onReset={noop}>
        {defaultChip(1, true)}
        {defaultChip(2)}
      </TopBarFilter>
    </div>
  ),
};
