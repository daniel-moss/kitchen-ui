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
    name: "Name",
    operator: "operator",
    value: "Value",
    isLocked: false,
    operatorDisabled: false,
    valueDisabled: false,
    removeDisabled: false,
    orientation: "horizontal",
  },
  argTypes: {
    slotLeft: { control: false },
    onOperatorClick: { control: false },
    onValueClick: { control: false },
    onRemove: { control: false },
    className: { control: false },
    // Normally the enclosing FilterChipGroup sets this; the control is here so
    // the Playground can show the vertical chip on its own.
    orientation: { options: ["horizontal", "vertical"], control: { type: "inline-radio" } },
  },
};
export default meta;

type Story = StoryObj<typeof FilterChip>;

// The Figma default slot icon — every icon parameter is the caller's.
const diamond = <Icon icon="diamonds-4" size={14} />;

// Layout of the Figma Documentation "Preview" frames: content centered in a
// column (or row), gap 80 in most previews, 40 between the remove-box states.
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
      <FilterChip {...args} slotLeft={diamond} onOperatorClick={noop} onValueClick={noop} onRemove={noop} />
    </div>
  ),
};

/** The hero: a desktop chip with the icon slot, removable. */
export const Hero: Story = {
  render: () => (
    <div style={row(0)}>
      <FilterChip
        slotLeft={diamond}
        name="Name"
        operator="operator"
        value="Value"
        onOperatorClick={noop}
        onValueClick={noop}
        onRemove={noop}
      />
    </div>
  ),
};

/**
 * Anatomy — the chip container: a fixed 36px height, hugging its content. In a
 * VERTICAL FilterChipGroup the same chip fills the row instead (see
 * `VerticalValueFill`).
 */
export const ChipContainer: Story = {
  render: () => (
    <div style={row(0)}>
      <FilterChip
        slotLeft={diamond}
        name="Name"
        operator="operator"
        value="Value"
        onOperatorClick={noop}
        onValueClick={noop}
        onRemove={noop}
      />
    </div>
  ),
};

/** The bare minimum a content box can contain — text only. */
export const ContentBoxText: Story = {
  render: () => (
    <div style={row(0)}>
      <FilterChipBox>Label</FilterChipBox>
    </div>
  ),
};

/** The left slot: an Icon (all parameters flexible) or any avatar at xs (20px). */
export const ContentBoxSlot: Story = {
  render: () => (
    <div style={row(80)}>
      <FilterChipBox slotLeft={diamond}>Icon</FilterChipBox>
      <FilterChipBox slotLeft={<AvatarUser size="xs" />}>Avatar</FilterChipBox>
    </div>
  ),
};

/** The "remove" box: icon-only, a fixed 36px square. */
export const RemoveBox: Story = {
  render: () => (
    <div style={{ ...row(80), alignItems: "center" }}>
      <FilterChipRemove onClick={noop} />
    </div>
  ),
};

/**
 * The locked chip: no "remove" box (and no divider before it). Its "value" box
 * still opens the read-only list, so it stays clickable and keeps its chevron
 * — and, being last, it takes the chip's radius on its right corners.
 */
export const IsLocked: Story = {
  render: () => (
    <div style={col(0)}>
      <FilterChip
        slotLeft={diamond}
        name="Name"
        operator="operator"
        value="Value"
        isLocked
        onValueClick={noop}
      />
    </div>
  ),
};

/**
 * A locked chip ignores `onOperatorClick` — the "operator" box stays
 * non-interactive, so it carries no chevron either (hover it: nothing
 * happens).
 */
export const LockedOperator: Story = {
  render: () => (
    <div style={col(0)}>
      <FilterChip
        slotLeft={diamond}
        name="Name"
        operator="operator"
        value="Value"
        isLocked
        onOperatorClick={noop}
        onValueClick={noop}
      />
    </div>
  ),
};

/**
 * A locked chip whose value is CUSTOM — one a Dialog would edit: no
 * `onValueClick`, the box is not clickable. (The rule was corrected
 * 2026-09-10: whether the box opens depends on WHERE the value comes from,
 * not on how many values it holds — the export name predates that and stays
 * for stable story links.)
 */
export const LockedValueSingle: Story = {
  render: () => (
    <div style={col(0)}>
      <FilterChip slotLeft={diamond} name="Name" operator="operator" value="Value" isLocked />
    </div>
  ),
};

/**
 * A locked chip whose value comes from the filter's OPTION LIST — one option
 * here, per the doc's example: the "value" box is clickable and opens the
 * selection with the rest of the options as a read-only SelectList (the
 * consumer's wiring — `readOnly` items show what is ticked without letting
 * the user change it; the selected option pins above a divider, the DS
 * selected-on-open rule). While the list is open the "value" box holds the
 * PRESSED state, and the list is left-aligned with the box (its default
 * alignment).
 */
export const LockedValueMultiple: Story = {
  render: () => (
    <div style={{ ...col(0), alignItems: "center" }}>
      <div style={{ position: "relative" }}>
        <FilterChip
          slotLeft={diamond}
          name="Name"
          operator="operator"
          value="Option 1"
          isLocked
          onValueClick={noop}
          valuePressed
        />
        {/* Left-aligned with the "value" box: 89px is that box's width in
            this example (10px padding + "Option 1" + 6px + the chevron + 10px). */}
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: "calc(100% - 89px)" }}>
          <SelectList variant="inline" breakpoint="desktop" open onClose={noop}>
            <SelectListItemGroup>
              <SelectListItem label="Option 1" multiSelect selected readOnly />
            </SelectListItemGroup>
            <SelectListItemGroup>
              <SelectListItem label="Option 2" multiSelect readOnly />
              <SelectListItem label="Option 3" multiSelect readOnly />
            </SelectListItemGroup>
          </SelectList>
        </div>
      </div>
      {/* The list overhangs the flow by 129px (4px gap + 125px list); this
          reserves exactly that, so the frame's own 80px bottom padding is
          the visible space below the list (Daniel, 2026-09-10). */}
      <div style={{ height: 129 }} />
    </div>
  ),
};

/**
 * A non-clickable box next to a clickable one — the chevron is the difference
 * you can see without hovering.
 */
export const IsClickable: Story = {
  render: () => (
    <div style={row(80)}>
      <FilterChipBox>isClickable = false</FilterChipBox>
      <FilterChipBox onClick={noop}>isClickable = true</FilterChipBox>
    </div>
  ),
};

/** The clickable box states: default, hovered, pressed, focused, disabled. */
export const InteractionStates: Story = {
  render: () => (
    <div style={col(80)}>
      <FilterChipBox onClick={noop}>Default</FilterChipBox>
      <FilterChipBox onClick={noop} className={PSEUDO_SELF.hover}>
        Hovered
      </FilterChipBox>
      <FilterChipBox onClick={noop} className={PSEUDO_SELF.press}>
        Pressed
      </FilterChipBox>
      <FilterChipBox onClick={noop} className={PSEUDO_SELF.focus}>
        Focused
      </FilterChipBox>
      <FilterChipBox onClick={noop} disabled>
        Disabled
      </FilterChipBox>
    </div>
  ),
};

/**
 * A box that opened a list holds the PRESSED state while the list is on
 * screen — in a chip, hold `operatorPressed` / `valuePressed` to the list's
 * open state.
 */
export const PressedWhileOpen: Story = {
  render: () => (
    <div style={{ ...col(0), alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
        <FilterChipBox onClick={noop} isPressed>
          Option 1
        </FilterChipBox>
        <SelectList variant="inline" breakpoint="desktop" open onClose={noop}>
          <SelectListItemGroup>
            <SelectListItem label="Option 1" multiSelect selected />
          </SelectListItemGroup>
          <SelectListItemGroup>
            <SelectListItem label="Option 2" multiSelect />
            <SelectListItem label="Option 3" multiSelect />
          </SelectListItemGroup>
        </SelectList>
      </div>
    </div>
  ),
};

/**
 * Live: in a horizontal group a box caps at 240px — hover the truncated text
 * for the full value. The chevron never shrinks with it.
 */
export const MaxWidth: Story = {
  render: () => (
    <div style={row(0)}>
      <FilterChipBox onClick={noop} style={{ width: 240 }}>
        Very long value which does not fit the box
      </FilterChipBox>
    </div>
  ),
};

/**
 * In a vertical group the "value" box label fills the width by default, and
 * the text truncates when it does not fit — the box here is 280px wide. There
 * is no fixed max width in that orientation; the cap is a share (below).
 */
export const VerticalValueFill: Story = {
  render: () => (
    <div style={row(0)}>
      <FilterChipBox orientation="vertical" fill style={{ width: 280 }}>
        Very long value which does not fit the box
      </FilterChipBox>
    </div>
  ),
};

/**
 * The share, at the width it was designed against: a 343px chip — a 375px
 * phone inside a drawer with 16px padding on each side. "Labels" hugs at 92px,
 * under its 101.33px share; "do not include any of" hits the share and
 * truncates; "3 labels" fills the 111px they leave. The value is the widest of
 * the three, which is the whole point — it can never be squeezed away.
 */
export const VerticalBoxShare: Story = {
  render: () => (
    <div style={row(0)}>
      <div style={{ width: 343 }}>
        <FilterChip
          orientation="vertical"
          slotLeft={diamond}
          name="Labels"
          operator="do not include any of"
          value="3 labels"
          onOperatorClick={noop}
          onValueClick={noop}
          onRemove={noop}
        />
      </div>
    </div>
  ),
};

/** The "name" box: usually an icon and text; always non-interactive. */
export const NameBox: Story = {
  render: () => (
    <div style={row(0)}>
      <FilterChipBox slotLeft={diamond}>Label</FilterChipBox>
    </div>
  ),
};

/** The "operator" box pressed, its single-select operator list open. */
export const OperatorBox: Story = {
  render: () => (
    <div style={{ ...col(0), alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
        <FilterChipBox onClick={noop} isPressed>
          operator 1
        </FilterChipBox>
        <SelectList variant="inline" breakpoint="desktop" open onClose={noop}>
          <SelectListItemGroup>
            <SelectListItem label="operator 1" selected />
            <SelectListItem label="operator 2" />
            <SelectListItem label="operator 3" />
          </SelectListItemGroup>
        </SelectList>
      </div>
    </div>
  ),
};

/** The "value" box: interactive — hover it. */
export const ValueBox: Story = {
  render: () => (
    <div style={row(0)}>
      <FilterChipBox onClick={noop}>Value</FilterChipBox>
    </div>
  ),
};

/** The "remove" box states: default, hovered, pressed, focused, disabled. */
export const RemoveStates: Story = {
  render: () => (
    <div style={row(40)}>
      <FilterChipRemove onClick={noop} />
      <FilterChipRemove onClick={noop} className={PSEUDO_SELF.hover} />
      <FilterChipRemove onClick={noop} className={PSEUDO_SELF.press} />
      <FilterChipRemove onClick={noop} className={PSEUDO_SELF.focus} />
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

// The docs' hint content: a DEFAULT hint with an EMPTY slot container —
// the doc shows the mechanics, not a particular usage (Daniel, 2026-09-10;
// the page's preview draws a bare 100px body slot). Real content — e.g. the
// schedule-horizon conflict's EmptyState — is the consumer's.
const emptyHintSlot = <div style={{ height: 100 }} />;

/**
 * The warning state: an `--amber-a2` body in an `--amber-a11` ring, amber
 * content boxes, the solid `warning` icon in the name slot (the chip swaps it
 * itself — `slotLeft` is set aside), and a normal "remove" box. Below: an
 * operator-less warning chip.
 */
export const IsWarning: Story = {
  render: () => (
    <div style={col(80)}>
      <FilterChip
        slotLeft={diamond}
        isWarning
        name="Name"
        operator="operator"
        value="Value"
        onOperatorClick={noop}
        onValueClick={noop}
        onRemove={noop}
      />
      <FilterChip
        slotLeft={diamond}
        isWarning
        name="Name"
        value="Value"
        onValueClick={noop}
        onRemove={noop}
      />
    </div>
  ),
};

/**
 * The icon-color rule: a default-colored value-slot icon INHERITS the warning
 * color (top, `sparkle`); an icon whose color was customized KEEPS it
 * (below, the green `circle-check`).
 */
export const WarningIconColors: Story = {
  render: () => (
    <div style={col(80)}>
      <FilterChip
        isWarning
        name="Type"
        operator="is"
        value="New"
        valueSlotLeft={<Icon icon="sparkle" size={14} />}
        onOperatorClick={noop}
        onValueClick={noop}
        onRemove={noop}
      />
      <FilterChip
        isWarning
        name="Status"
        operator="is"
        value="Finalized"
        valueSlotLeft={<Icon icon="circle-check" pack="solid" size={14} style={{ color: "var(--text-success)" }} />}
        onOperatorClick={noop}
        onValueClick={noop}
        onRemove={noop}
      />
    </div>
  ),
};

/**
 * Live — hover the "name" box: the warning chip explains itself with a Hint
 * anchored there (`nameHint`; the bubble stays while the pointer is inside it,
 * so interactive content stays reachable). The doc shows the default hint with
 * an empty slot — the content is the consumer's.
 */
export const WarningHint: Story = {
  render: () => (
    <div style={{ ...col(0), alignItems: "center" }}>
      <FilterChip
        slotLeft={diamond}
        isWarning
        nameHint={emptyHintSlot}
        nameHintWidth={276}
        name="Name"
        operator="operator"
        value="Value"
        onOperatorClick={noop}
        onValueClick={noop}
        onRemove={noop}
      />
      {/* The hovered bubble overhangs the flow by ~116px (10px gap + the
          106px hint); reserving it keeps the frame's 80px padding as the
          visible space on every side (Daniel, 2026-09-10). */}
      <div style={{ height: 116 }} />
    </div>
  ),
};

/**
 * Live — the mobile presentation: tapping the "name" box opens the same hint
 * content as a drawer (click it here). The chip has no breakpoint of its own
 * any more, so this story forces the HINT alone with `nameHintBreakpoint`; in
 * the app the viewport decides.
 */
export const WarningHintMobile: Story = {
  render: () => (
    <div style={docsFrame}>
      <FilterChip
        nameHintBreakpoint="mobile"
        slotLeft={diamond}
        isWarning
        nameHint={emptyHintSlot}
        name="Name"
        operator="operator"
        value="Value"
        onOperatorClick={noop}
        onValueClick={noop}
        onRemove={noop}
      />
    </div>
  ),
};
