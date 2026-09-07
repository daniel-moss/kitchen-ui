import { CSSProperties, ReactNode } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { cap, docsFrame, PSEUDO_ALL } from "../../stories/helpers";
import DateChip from "./DateChip";
import { DateChipBand, DateChipProps } from "./DateChip.types";

/**
 * DateChip — one date cell of the DatePicker calendar (Figma "#️⃣ DateChip"):
 * fixed 36px height, 6px radius, fills its cell. Selected = gray-a2 fill +
 * a 1px gray-12 inside stroke; today = error-colored text. The range band
 * (`band`) draws behind the chip with uniform 6px caps wherever it stops.
 */
const meta: Meta<typeof DateChip> = {
  title: "Components/DatePicker/DateChip",
  component: DateChip,
  parameters: { layout: "fullscreen" },
  args: { day: 1 },
};
export default meta;

type Story = StoryObj<typeof DateChip>;

// Hug + center: `data-hug` makes the DOCS preview container hug this content
// and center on the docs column (storybook-docs.css); fit-content + auto
// margins do the same in the standalone story view.
const frame: CSSProperties = { ...docsFrame, maxWidth: "none", width: "fit-content" };
const Hug = ({ style, children }: { style?: CSSProperties; children: ReactNode }) => (
  <div data-hug style={{ ...frame, ...style }}>
    {children}
  </div>
);

// A fixed-width cell for a lone chip — 44px, the DatePicker's cell width
// (in the picker the row provides it).
const cell = (chip: ReactNode) => <div style={{ display: "flex", width: 44 }}>{chip}</div>;

export const Playground: Story = {
  render: (args) => <Hug>{cell(<DateChip {...args} />)}</Hug>,
};

// ---- docs-page stories (one per Figma Documentation example) ---------------

// The five states of one chip look — horizontal, 40px apart, centered.
// Hover/press/focus come from the pseudo-states addon.
const states = (extra: Partial<DateChipProps>) => (
  <Hug style={{ display: "flex", gap: 40, alignItems: "flex-end" }}>
    {(
      [
        ["default", undefined],
        ["focused", PSEUDO_ALL.focus],
        ["hovered", PSEUDO_ALL.hover],
        ["pressed", PSEUDO_ALL.press],
      ] as const
    ).map(([label, cls]) => (
      <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-3)" }}>
        <span style={cap}>{label}</span>
        <div className={cls} style={{ display: "flex", width: 44 }}>
          <DateChip day={1} {...extra} />
        </div>
      </div>
    ))}
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-3)" }}>
      <span style={cap}>disabled</span>
      {cell(<DateChip day={1} disabled {...extra} />)}
    </div>
  </Hug>
);

/** Unselected chip — default / focused / hovered / pressed / disabled. */
export const Unselected: Story = {
  render: () => states({}),
};

/** Unselected "today" — error-colored text, in every state. */
export const UnselectedToday: Story = {
  render: () => states({ isToday: true }),
};

/**
 * Selected — gray-a2 fill + a 1px gray-12 inside stroke, Medium text. Hover
 * and press step the fill (a3 / a4); the stroke stays.
 */
export const Selected: Story = {
  render: () => states({ isSelected: true }),
};

/** Selected "today" — the error-colored text on the outlined chip. */
export const SelectedToday: Story = {
  render: () => states({ isSelected: true, isToday: true }),
};

/**
 * The range band behind the chip (`band`): square where it runs on to the
 * neighbor, a uniform 6px cap wherever it stops — a range end, a row break,
 * and the hover preview's end all look the same.
 */
export const Band: Story = {
  render: () => (
    <Hug style={{ display: "flex", gap: 40, alignItems: "flex-end" }}>
      {(["none", "middle", "capLeft", "capRight", "capBoth"] as DateChipBand[]).map((band) => (
        <div key={band} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-3)" }}>
          <span style={cap}>band = {band}</span>
          {cell(<DateChip day={1} band={band} />)}
        </div>
      ))}
    </Hug>
  ),
};
