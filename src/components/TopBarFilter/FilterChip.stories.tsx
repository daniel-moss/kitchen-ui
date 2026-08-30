import type { CSSProperties } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { docsFrame, noop, PSEUDO_SELF } from "../../stories/helpers";
import AvatarUser from "../Avatar/AvatarUser";
import { Icon } from "../Icon/Icon";
import SelectList from "../SelectList/SelectList";
import SelectListItem from "../SelectList/SelectListItem";
import SelectListItemGroup from "../SelectList/SelectListItemGroup";
import FilterChip, { FilterChipBox, FilterChipRemove } from "./FilterChip";

const meta: Meta<typeof FilterChip> = {
  title: "Components/TopBarFilter/FilterChip",
  component: FilterChip,
  // fullscreen — the stories' own frame provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: {
    property: "Property",
    condition: "condition",
    value: "Value",
    isFixed: false,
    conditionDisabled: false,
    valueDisabled: false,
    removeDisabled: false,
    breakpoint: "auto",
  },
  argTypes: {
    slotLeft: { control: false },
    onConditionClick: { control: false },
    onValueClick: { control: false },
    onRemove: { control: false },
    className: { control: false },
    breakpoint: { options: ["auto", "desktop", "mobile"], control: { type: "inline-radio" } },
  },
};
export default meta;

type Story = StoryObj<typeof FilterChip>;

// The Figma default slot icon — every icon parameter is the caller's.
const diamond = <Icon icon="diamonds-4" size={14} />;

// Layout of the Figma Documentation "Preview" frames: content centered in a
// column (or row), gap 80 in most previews, 40 in the interaction states.
const col = (gap: number): CSSProperties => ({
  ...docsFrame,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap,
});
const row = (gap: number): CSSProperties => ({
  ...docsFrame,
  display: "flex",
  justifyContent: "center",
  gap,
});

export const Playground: Story = {
  render: (args) => (
    <div style={row(0)}>
      <FilterChip {...args} slotLeft={diamond} onConditionClick={noop} onValueClick={noop} onRemove={noop} />
    </div>
  ),
};

/** The hero: a desktop chip with the icon slot, removable. */
export const Hero: Story = {
  render: () => (
    <div style={row(0)}>
      <FilterChip
        breakpoint="desktop"
        slotLeft={diamond}
        property="Property"
        condition="condition"
        value="Value"
        onConditionClick={noop}
        onValueClick={noop}
        onRemove={noop}
      />
    </div>
  ),
};

/** Anatomy — the desktop chip container: fixed height, hugs the content. */
export const ChipContainerDesktop: Story = {
  render: () => (
    <div style={row(0)}>
      <FilterChip
        breakpoint="desktop"
        slotLeft={<Icon icon="desktop" size={14} />}
        property="Desktop"
        condition="condition"
        value="Value"
        onConditionClick={noop}
        onValueClick={noop}
        onRemove={noop}
      />
    </div>
  ),
};

/** Anatomy — the mobile chip container: fills the width, the "value" box fills. */
export const ChipContainerMobile: Story = {
  render: () => (
    <div style={docsFrame}>
      <FilterChip
        breakpoint="mobile"
        slotLeft={<Icon icon="mobile" size={14} />}
        property="Mobile"
        condition="condition"
        value="Value"
        onConditionClick={noop}
        onValueClick={noop}
        onRemove={noop}
      />
    </div>
  ),
};

/** Content box paddings: 10px sides / 32px high on desktop, 12px / 36px on mobile. */
export const ContentBoxPaddings: Story = {
  render: () => (
    <div style={col(80)}>
      <FilterChipBox breakpoint="desktop">Desktop</FilterChipBox>
      <FilterChipBox breakpoint="mobile">Mobile</FilterChipBox>
    </div>
  ),
};

/** The bare minimum a content box can contain — text only. */
export const ContentBoxText: Story = {
  render: () => (
    <div style={row(0)}>
      <FilterChipBox>Copy</FilterChipBox>
    </div>
  ),
};

/** The left slot: an Icon (all parameters flexible) or any avatar at xs (20px). */
export const ContentBoxSlot: Story = {
  render: () => (
    <div style={col(80)}>
      <FilterChipBox slotLeft={diamond}>Copy</FilterChipBox>
      <FilterChipBox slotLeft={<AvatarUser size="xs" />}>Copy</FilterChipBox>
    </div>
  ),
};

/** The "remove" box: 32px wide on desktop, 36px on mobile — the icon is identical. */
export const RemoveBox: Story = {
  render: () => (
    <div style={col(80)}>
      <FilterChip
        breakpoint="desktop"
        slotLeft={<Icon icon="desktop" size={14} />}
        property="Desktop"
        condition="condition"
        value="Value"
        onConditionClick={noop}
        onValueClick={noop}
        onRemove={noop}
      />
      <FilterChip
        breakpoint="mobile"
        slotLeft={<Icon icon="mobile" size={14} />}
        property="Mobile"
        condition="condition"
        value="Value"
        onConditionClick={noop}
        onValueClick={noop}
        onRemove={noop}
      />
    </div>
  ),
};

/** The fixed chip: no "remove" box (and no divider before it). */
export const IsFixed: Story = {
  render: () => (
    <div style={col(0)}>
      <FilterChip breakpoint="desktop" slotLeft={diamond} property="isFixed" condition="true" value="Value" isFixed />
    </div>
  ),
};

/**
 * A fixed chip ignores `onConditionClick` — the "condition" box stays
 * non-interactive (hover it: nothing happens).
 */
export const FixedCondition: Story = {
  render: () => (
    <div style={col(0)}>
      <FilterChip
        breakpoint="desktop"
        slotLeft={diamond}
        property="isFixed"
        condition="true"
        value="Value"
        isFixed
        onConditionClick={noop}
      />
    </div>
  ),
};

/** A fixed chip with ONE value: no `onValueClick` — the box is not clickable. */
export const FixedValueSingle: Story = {
  render: () => (
    <div style={col(0)}>
      <FilterChip breakpoint="desktop" slotLeft={diamond} property="isFixed" condition="true" value="Value" isFixed />
    </div>
  ),
};

/**
 * A fixed chip with SEVERAL values: the "value" box is clickable and opens
 * the selected options as a read-only SelectList (the consumer's wiring —
 * `readOnly` items show what is ticked without letting the user change it).
 * While the list is open the "value" box holds the PRESSED state, and the
 * list is left-aligned with the box (its default alignment).
 */
export const FixedValueMultiple: Story = {
  // The addon presses the one clickable box in the chip (the "value" box) —
  // the read-only list rows take no states, so they are not affected.
  parameters: { pseudo: { active: ['[class*="_clickable"]'] } },
  render: () => (
    <div style={{ ...col(0), alignItems: "center" }}>
      <div style={{ position: "relative" }}>
        <FilterChip
          breakpoint="desktop"
          slotLeft={diamond}
          property="isFixed"
          condition="true"
          value="3 options"
          isFixed
          onValueClick={noop}
        />
        {/* Left-aligned with the "value" box: 82px is that box's width in
            this example (10px padding + "3 options" + 10px). */}
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: "calc(100% - 82px)" }}>
          <SelectList variant="inline" breakpoint="desktop" open onClose={noop}>
            <SelectListItemGroup>
              <SelectListItem label="Option 1" multiSelect selected readOnly />
              <SelectListItem label="Option 2" multiSelect selected readOnly />
              <SelectListItem label="Option 3" multiSelect selected readOnly />
            </SelectListItemGroup>
          </SelectList>
        </div>
      </div>
      {/* Room for the open list in the docs canvas. */}
      <div style={{ height: 150 }} />
    </div>
  ),
};

/** A non-clickable box next to a clickable one — hover the clickable one. */
export const IsClickable: Story = {
  render: () => (
    <div style={row(80)}>
      <FilterChipBox>isClickable = false</FilterChipBox>
      <FilterChipBox onClick={noop}>isClickable = true</FilterChipBox>
    </div>
  ),
};

/** The clickable box states: default, focused, hovered, pressed, disabled. */
export const InteractionStates: Story = {
  render: () => (
    <div style={col(40)}>
      <FilterChipBox onClick={noop}>Default</FilterChipBox>
      <FilterChipBox onClick={noop} className={PSEUDO_SELF.focus}>
        Focused
      </FilterChipBox>
      <FilterChipBox onClick={noop} className={PSEUDO_SELF.hover}>
        Hovered
      </FilterChipBox>
      <FilterChipBox onClick={noop} className={PSEUDO_SELF.press}>
        Pressed
      </FilterChipBox>
      <FilterChipBox onClick={noop} disabled>
        Disabled
      </FilterChipBox>
    </div>
  ),
};

/** Live: the desktop box caps at 240px — hover the truncated text for the full value. */
export const MaxWidth: Story = {
  render: () => (
    <div style={row(0)}>
      <FilterChipBox onClick={noop} style={{ width: 240 }}>
        Very long value which does not fit the box
      </FilterChipBox>
    </div>
  ),
};

/** The "property" box: usually an icon and text; always non-interactive. */
export const PropertyBox: Story = {
  render: () => (
    <div style={row(0)}>
      <FilterChipBox slotLeft={diamond}>Property</FilterChipBox>
    </div>
  ),
};

/** The "condition" box: text only, usually interactive. */
export const ConditionBox: Story = {
  render: () => (
    <div style={row(80)}>
      {/* Left: the fixed-filter form — non-interactive. Right: the usual
          clickable box (hover it). */}
      <FilterChipBox>is</FilterChipBox>
      <FilterChipBox onClick={noop}>is</FilterChipBox>
    </div>
  ),
};

/** The "value" box: interactive. */
export const ValueBox: Story = {
  render: () => (
    <div style={row(80)}>
      {/* Left: a fixed filter's single value — non-interactive. Right: the
          usual clickable box (hover it). */}
      <FilterChipBox>Value</FilterChipBox>
      <FilterChipBox onClick={noop}>Value</FilterChipBox>
    </div>
  ),
};

/** The "remove" box states: default, focused, hovered, pressed, disabled. */
export const RemoveStates: Story = {
  render: () => (
    <div style={col(80)}>
      <FilterChipRemove onClick={noop} />
      <FilterChipRemove onClick={noop} className={PSEUDO_SELF.focus} />
      <FilterChipRemove onClick={noop} className={PSEUDO_SELF.hover} />
      <FilterChipRemove onClick={noop} className={PSEUDO_SELF.press} />
      <FilterChipRemove onClick={noop} disabled />
    </div>
  ),
};

/** Live: hovering the "remove" box shows the "Remove" tooltip. */
export const RemoveTooltip: Story = {
  render: () => (
    <div style={row(0)}>
      <FilterChipRemove onClick={noop} />
    </div>
  ),
};
