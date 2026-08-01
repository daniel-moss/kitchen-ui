import type { Meta, StoryObj } from "@storybook/react";

import Tooltip from "./Tooltip";
import { TooltipPlacement } from "./Tooltip.types";
import { Icon } from "../Icon/Icon";
import { AvatarGroupItem } from "../Avatar/AvatarGroup.types";
import { users } from "../../data/users";

const PLACEMENTS: TooltipPlacement[] = ["top", "bottom", "left", "right"];

const groupItems: AvatarGroupItem[] = users
  .slice(0, 3)
  .map((u) => ({ kind: "user", content: "image", imageSrc: u.avatar, name: u.name }));

/**
 * Tooltip — a chip (body + tongue). The body/tongue use the OPPOSITE theme (dark
 * on light, light on dark); the shadow stays in normal mode. Positioning against
 * a trigger is the consumer's job.
 */
const meta: Meta<typeof Tooltip> = {
  title: "Components/Tooltip",
  component: Tooltip,
  parameters: { layout: "centered" },
  args: {
    placement: "top",
    align: "center",
    variant: "text",
    text: "Tooltip",
    textAlign: "center",
    maxWidth: 240,
  },
  argTypes: {
    placement: { options: PLACEMENTS, control: { type: "inline-radio" } },
    align: { options: ["start", "center", "end"], control: { type: "inline-radio" } },
    variant: { options: ["text", "avatarGroup", "slot"], control: { type: "inline-radio" } },
    text: { control: { type: "text" }, if: { arg: "variant", eq: "text" } },
    textAlign: {
      options: ["center", "left"],
      control: { type: "inline-radio" },
      if: { arg: "variant", eq: "text" },
    },
    maxWidth: { control: { type: "number" } },
  },
};

export default meta;

type Story = StoryObj<typeof Tooltip>;

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

export const Playground: Story = {
  render: (args) => {
    if (args.variant === "avatarGroup") return <Tooltip {...args} items={groupItems} />;
    if (args.variant === "slot") {
      return (
        <Tooltip {...args}>
          <Icon icon="circle-info" size={14} />
          Slot content
        </Tooltip>
      );
    }
    return <Tooltip {...args} />;
  },
};

/** The four placements (tongue sides), centered. */
export const Placements: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", gap: "var(--size-8)", alignItems: "center" }}>
      {PLACEMENTS.map((placement) => (
        <div
          key={placement}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-4)" }}
        >
          <Tooltip placement={placement} text={placement} />
          <span style={labelStyle}>{placement}</span>
        </div>
      ))}
    </div>
  ),
};

/** Tongue alignment along the edge (bottom placement shown). */
export const Alignments: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", gap: "var(--size-8)", alignItems: "center" }}>
      {(["start", "center", "end"] as const).map((align) => (
        <div
          key={align}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-4)" }}
        >
          <Tooltip placement="bottom" align={align} text="A longer tooltip label" />
          <span style={labelStyle}>{align}</span>
        </div>
      ))}
    </div>
  ),
};

/** Body variants: text, icon + text (slot), and an AvatarGroup stack. */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", gap: "var(--size-8)", alignItems: "flex-start" }}>
      <Tooltip text="Just text" />
      <Tooltip variant="slot">
        <Icon icon="circle-info" size={14} />
        Icon + text
      </Tooltip>
      <Tooltip variant="avatarGroup" items={groupItems} />
    </div>
  ),
};
