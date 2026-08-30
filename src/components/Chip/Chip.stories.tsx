import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Chip from "./Chip";
import type { ChipSize } from "./Chip.types";
import { Icon } from "../Icon/Icon";
import AvatarUser from "../Avatar/AvatarUser";
import { docsFrame, noop } from "../../stories/helpers";

type Slot = "none" | "icon" | "avatar";
type ChipState = "default" | "focused" | "hovered" | "pressed" | "disabled";

type StoryArgs = {
  text: string;
  size: ChipSize;
  active: boolean;
  slotLeft: Slot;
  isLoading: boolean;
  isDisabled: boolean;
};

// The icon is the caller's in every parameter — Figma's default is a 14px
// regular icon in the label color.
const diamond = () => <Icon icon="diamonds-4" size={14} />;
// The avatar size is fixed per chip size: xxs (16) in sm, xs (20) in md and lg.
const avatar = (size: ChipSize) => <AvatarUser size={size === "sm" ? "xxs" : "xs"} />;

const SLOTS: Record<Exclude<Slot, "none">, (size: ChipSize) => React.ReactNode> = {
  icon: () => diamond(),
  avatar: (size) => avatar(size),
};

/**
 * Chip — a compact filter / selection control: sm (28px), md (32px) or lg
 * (36px), an optional left slot (an Icon or an avatar), an `active` (selected)
 * look, and a loading skeleton. Works as a toggle.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Chip/Chip",
  component: Chip,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<StoryArgs>;

// --- ladder plumbing ---------------------------------------------------------
const STATES: ChipState[] = ["default", "focused", "hovered", "pressed", "disabled"];
const STATE_LABELS: Record<ChipState, string> = {
  default: "Default",
  focused: "Focused",
  hovered: "Hovered",
  pressed: "Pressed",
  disabled: "Disabled",
};
// Ancestor classes the pseudo-states addon rewrites CSS against — the chip is
// the only interactive element, so the cascade forces exactly its state.
const PSEUDO: Partial<Record<ChipState, string>> = {
  hovered: "pseudo-hover-all",
  pressed: "pseudo-active-all",
  focused: "pseudo-focus-visible-all",
};

const SIZES: ChipSize[] = ["sm", "md", "lg"];

const centeredColumn: React.CSSProperties = {
  ...docsFrame,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "var(--size-20)",
};
const centeredRow: React.CSSProperties = {
  ...docsFrame,
  display: "flex",
  gap: "var(--size-4)",
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "wrap",
};

const Ladder = ({ active }: { active: boolean }) => (
  <div style={centeredColumn}>
    {STATES.map((state) => (
      <div key={state} className={PSEUDO[state]}>
        <Chip size="md" active={active} isDisabled={state === "disabled"} onClick={noop}>
          {STATE_LABELS[state]}
        </Chip>
      </div>
    ))}
  </div>
);

const LoadingRow = ({ size }: { size: ChipSize }) => (
  <div style={centeredRow}>
    <Chip size={size} isLoading>
      Chip
    </Chip>
    <Chip size={size} slotLeft={diamond()} isLoading>
      Chip
    </Chip>
    <Chip size={size} slotLeft={avatar(size)} isLoading>
      Chip
    </Chip>
  </div>
);

// --- stories -----------------------------------------------------------------

/** sm/md/lg; `active` = the selected look; the left slot takes an Icon or an avatar. */
export const Playground: Story = {
  // The synthetic playground args/argTypes live on THIS story (not the meta) so
  // the docs-page ArgTypes table stays pure docgen from Chip.types.ts.
  parameters: { layout: "centered" },
  args: { text: "Chip", size: "md", active: false, slotLeft: "none", isLoading: false, isDisabled: false },
  argTypes: {
    text: { control: { type: "text" } },
    size: { options: SIZES, control: { type: "inline-radio" } },
    active: { control: { type: "boolean" } },
    slotLeft: { options: ["none", "icon", "avatar"], control: { type: "inline-radio" } },
    isLoading: { control: { type: "boolean" } },
    isDisabled: { control: { type: "boolean" } },
  },
  render: ({ text, size, active, slotLeft, isLoading, isDisabled }) => (
    <Chip
      size={size}
      active={active}
      slotLeft={slotLeft === "none" ? undefined : SLOTS[slotLeft](size)}
      isLoading={isLoading}
      isDisabled={isDisabled}
      onClick={noop}
    >
      {text}
    </Chip>
  ),
};

// A live chip that toggles its selected state on click.
const InteractiveChip = () => {
  const [selected, setSelected] = useState(false);
  return (
    <Chip size="md" active={selected} onClick={() => setSelected((v) => !v)}>
      Chip
    </Chip>
  );
};

/** Live — click to select and deselect (Chip works as a toggle). */
export const Interactive: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ ...docsFrame, display: "flex", justifyContent: "center" }}>
      <InteractiveChip />
    </div>
  ),
};

/** Three sizes: sm (28px, caption 13/20), md (32px) and lg (36px, both body 14/20). */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={centeredRow}>
      <Chip size="sm" onClick={noop}>
        Small
      </Chip>
      <Chip size="md" onClick={noop}>
        Medium
      </Chip>
      <Chip size="lg" onClick={noop}>
        Large
      </Chip>
    </div>
  ),
};

/** Left slot with an Icon — size 14, and every icon parameter is editable. */
export const SlotLeftIcon: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={centeredRow}>
      {SIZES.map((size) => (
        <Chip key={size} size={size} slotLeft={diamond()} onClick={noop}>
          {size} Icon
        </Chip>
      ))}
    </div>
  ),
};

/** Left slot with an avatar — the size is fixed (xxs in sm, xs in md and lg). */
export const SlotLeftAvatar: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={centeredRow}>
      {SIZES.map((size) => (
        <Chip key={size} size={size} slotLeft={avatar(size)} onClick={noop}>
          {size} Avatar
        </Chip>
      ))}
    </div>
  ),
};

/** A chip is selected or unselected; clicking / tapping switches between them. */
export const ActiveInactive: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={centeredRow}>
      <Chip size="md" onClick={noop}>
        Unselected
      </Chip>
      <Chip size="md" active onClick={noop}>
        Selected
      </Chip>
    </div>
  ),
};

/** Inactive across all 5 states. */
export const InactiveStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Ladder active={false} />,
};

/** Active across all 5 states. */
export const ActiveStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Ladder active />,
};

/** sm loading — text only, with an icon, and with an avatar. */
export const LoadingSm: Story = {
  parameters: { controls: { disable: true } },
  render: () => <LoadingRow size="sm" />,
};

/** md loading — text only, with an icon, and with an avatar. */
export const LoadingMd: Story = {
  parameters: { controls: { disable: true } },
  render: () => <LoadingRow size="md" />,
};

/** lg loading — text only, with an icon, and with an avatar. */
export const LoadingLg: Story = {
  parameters: { controls: { disable: true } },
  render: () => <LoadingRow size="lg" />,
};
