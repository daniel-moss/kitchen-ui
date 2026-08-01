import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import HintTrigger from "./HintTrigger";
import Tooltip from "../Tooltip/Tooltip";

/**
 * HintTrigger — a small hint icon with a hover state. On hover/focus (desktop)
 * or tap (mobile) it opens a Hint or, for a short tip, a Tooltip. Hint isn't
 * built yet, so the demo below uses a Tooltip.
 */
const meta: Meta<typeof HintTrigger> = {
  title: "Components/Hint/HintTrigger",
  component: HintTrigger,
  parameters: { layout: "centered" },
  args: { icon: "circle-info" },
  argTypes: {
    icon: { control: { type: "text" } },
    _isHovered: { control: { type: "boolean" } },
  },
};

export default meta;

type Story = StoryObj<typeof HintTrigger>;

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

export const Playground: Story = {};

/** default and hover. */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", gap: "var(--size-8)", alignItems: "center" }}>
      {[
        { label: "default", hovered: false },
        { label: "hover", hovered: true },
      ].map(({ label, hovered }) => (
        <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-3)" }}>
          <HintTrigger _isHovered={hovered} />
          <span style={labelStyle}>{label}</span>
        </div>
      ))}
    </div>
  ),
};

/** Hover (or focus) the trigger to open a Tooltip. */
export const WithTooltip: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <span style={{ position: "relative", display: "inline-flex" }}>
        <HintTrigger
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        />
        {open && (
          <span
            style={{
              position: "absolute",
              // Above the trigger so the cursor path from below never crosses it.
              bottom: "calc(100% + var(--size-2))",
              left: "50%",
              transform: "translateX(-50%)",
              pointerEvents: "none",
            }}
          >
            <Tooltip placement="top" text="Tooltip" />
          </span>
        )}
      </span>
    );
  },
};
