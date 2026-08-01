import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Chip from "./Chip";
import { Icon } from "../Icon/Icon";
import AvatarUser from "../Avatar/AvatarUser";
import { docsFrame, noop } from "../../stories/helpers";

type Slot = "none" | "icon" | "avatar";
type ChipState = "default" | "focused" | "hovered" | "pressed" | "disabled";

type StoryArgs = {
  text: string;
  size: "md" | "lg";
  active: boolean;
  slotLeft: Slot;
  isLoading: boolean;
  isDisabled: boolean;
};

const diamond = () => <Icon icon="diamonds-4" pack="solid" size={14} />;
const SLOTS: Record<Exclude<Slot, "none">, React.ReactNode> = {
  icon: diamond(),
  avatar: <AvatarUser size="xxs" />,
};

/**
 * Chip — a compact filter / selection control: md (28px) or lg (32px), an
 * optional left slot (Icon or any avatar — strictly xxs/16px), an `active`
 * (selected) look, and a loading skeleton. Works as a toggle.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Chip",
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
        <Chip size="lg" active={active} isDisabled={state === "disabled"} onClick={noop}>
          {STATE_LABELS[state]}
        </Chip>
      </div>
    ))}
  </div>
);

const LoadingRow = ({ size }: { size: "md" | "lg" }) => (
  <div style={centeredRow}>
    <Chip size={size} isLoading>
      Chip
    </Chip>
    <Chip size={size} slotLeft={diamond()} isLoading>
      Chip
    </Chip>
    <Chip size={size} slotLeft={<AvatarUser size="xxs" />} isLoading>
      Chip
    </Chip>
  </div>
);

// --- stories -----------------------------------------------------------------

/** md/lg; `active` = the selected look; the left slot takes an Icon or an avatar. */
export const Playground: Story = {
  // The synthetic playground args/argTypes live on THIS story (not the meta) so
  // the docs-page ArgTypes table stays pure docgen from Chip.types.ts.
  parameters: { layout: "centered" },
  args: { text: "Chip", size: "md", active: false, slotLeft: "none", isLoading: false, isDisabled: false },
  argTypes: {
    text: { control: { type: "text" } },
    size: { options: ["md", "lg"], control: { type: "inline-radio" } },
    active: { control: { type: "boolean" } },
    slotLeft: { options: ["none", "icon", "avatar"], control: { type: "inline-radio" } },
    isLoading: { control: { type: "boolean" } },
    isDisabled: { control: { type: "boolean" } },
  },
  render: ({ text, size, active, slotLeft, isLoading, isDisabled }) => (
    <Chip
      size={size}
      active={active}
      slotLeft={slotLeft === "none" ? undefined : SLOTS[slotLeft]}
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
    <Chip size="lg" active={selected} onClick={() => setSelected((v) => !v)}>
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

/** Two sizes: md (28px, caption 13/20) and lg (32px, body 14/20). Text only. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={centeredRow}>
      <Chip size="md" onClick={noop}>
        Medium
      </Chip>
      <Chip size="lg" onClick={noop}>
        Large
      </Chip>
    </div>
  ),
};

/** Left slot: an Icon (solid 14, label color) or ANY avatar — strictly xxs (16px). */
export const SlotLeft: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={centeredRow}>
      <Chip size="md" slotLeft={diamond()} onClick={noop}>
        Medium
      </Chip>
      <Chip size="md" slotLeft={<AvatarUser size="xxs" />} onClick={noop}>
        Medium
      </Chip>
      <Chip size="lg" slotLeft={diamond()} onClick={noop}>
        Large
      </Chip>
      <Chip size="lg" slotLeft={<AvatarUser size="xxs" />} onClick={noop}>
        Large
      </Chip>
    </div>
  ),
};

/** A chip is inactive or active; clicking / tapping switches between them. */
export const ActiveInactive: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={centeredRow}>
      <Chip size="lg" onClick={noop}>
        Inactive
      </Chip>
      <Chip size="lg" active onClick={noop}>
        Active
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

/** lg loading — text only, with an icon, and with an avatar. */
export const LoadingLg: Story = {
  parameters: { controls: { disable: true } },
  render: () => <LoadingRow size="lg" />,
};

/** md loading — text only, with an icon, and with an avatar. */
export const LoadingMd: Story = {
  parameters: { controls: { disable: true } },
  render: () => <LoadingRow size="md" />,
};
