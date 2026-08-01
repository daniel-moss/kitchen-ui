import type { Meta, StoryObj } from "@storybook/react";

import PopoverFooter from "./PopoverFooter";
import Button from "../Button/Button";

type ButtonStyle = "solid" | "subtle" | "ghost";

type StoryArgs = {
  leading: boolean;
  buttonCount: 1 | 2;
  secondaryStyle: ButtonStyle;
  primaryStyle: ButtonStyle;
  stretch: boolean;
};

const surface: React.CSSProperties = { width: 400 };

/**
 * PopoverFooter — the action bar for popover-like containers (Popover, Dialog,
 * SidePanel, …). A full-width Divider on top plus a row of buttons. An optional
 * leading Cancel (ghost) is pinned far left; the trailing buttons hug the right
 * edge, or stretch to fill the width in the navigation/mobile variant.
 *
 * Priority increases left → right (ghost → subtle → solid). You may lower a
 * button's style, but the order must stay low → high. Max 3 buttons. All
 * buttons are the lg size.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Popover/PopoverFooter",
  component: PopoverFooter,
  parameters: { layout: "centered" },
  args: {
    leading: true,
    buttonCount: 2,
    secondaryStyle: "subtle",
    primaryStyle: "solid",
    stretch: false,
  },
  argTypes: {
    leading: { name: "leading Cancel", control: { type: "boolean" } },
    buttonCount: { name: "trailing buttons", options: [1, 2], control: { type: "inline-radio" } },
    secondaryStyle: {
      name: "secondary style",
      options: ["subtle", "ghost"],
      control: { type: "inline-radio" },
      if: { arg: "buttonCount", eq: 2 },
    },
    primaryStyle: {
      name: "primary style",
      options: ["solid", "subtle"],
      control: { type: "inline-radio" },
    },
    stretch: { control: { type: "boolean" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  render: ({ leading, buttonCount, secondaryStyle, primaryStyle, stretch }) => (
    <div style={surface}>
      <PopoverFooter
        stretch={stretch}
        leadingButton={
          leading ? (
            <Button size="lg" variant="ghost">
              Cancel
            </Button>
          ) : undefined
        }
      >
        {buttonCount === 2 && (
          <Button size="lg" variant={secondaryStyle}>
            Secondary
          </Button>
        )}
        <Button size="lg" variant={primaryStyle}>
          Primary
        </Button>
      </PopoverFooter>
    </div>
  ),
};

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-1)" }}>
    <span style={labelStyle}>{label}</span>
    <div style={surface}>{children}</div>
  </div>
);

/** Content — any button count, right-aligned. */
export const Content: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-6)" }}>
      <Row label="Primary only">
        <PopoverFooter>
          <Button size="lg" variant="solid">
            Primary
          </Button>
        </PopoverFooter>
      </Row>
      <Row label="Secondary + Primary">
        <PopoverFooter>
          <Button size="lg" variant="subtle">
            Secondary
          </Button>
          <Button size="lg" variant="solid">
            Primary
          </Button>
        </PopoverFooter>
      </Row>
      <Row label="Cancel + Primary">
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost">
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="solid">
            Primary
          </Button>
        </PopoverFooter>
      </Row>
      <Row label="Cancel + Secondary + Primary">
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost">
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="subtle">
            Secondary
          </Button>
          <Button size="lg" variant="solid">
            Primary
          </Button>
        </PopoverFooter>
      </Row>
    </div>
  ),
};

/** Actions — lowered button styles, priority order preserved (low → high). */
export const Actions: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-6)" }}>
      <Row label="Secondary (subtle) + Primary (solid)">
        <PopoverFooter>
          <Button size="lg" variant="subtle">
            Secondary
          </Button>
          <Button size="lg" variant="solid">
            Primary
          </Button>
        </PopoverFooter>
      </Row>
      <Row label="Secondary (ghost) + Primary (subtle)">
        <PopoverFooter>
          <Button size="lg" variant="ghost">
            Secondary
          </Button>
          <Button size="lg" variant="subtle">
            Primary
          </Button>
        </PopoverFooter>
      </Row>
    </div>
  ),
};

/** Navigation — buttons stretch to fill the width. Mainly for mobile. */
export const Navigation: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-6)" }}>
      <Row label="Full-width Primary">
        <PopoverFooter stretch>
          <Button size="lg" variant="solid">
            Primary
          </Button>
        </PopoverFooter>
      </Row>
      <Row label="Secondary + Primary (50/50)">
        <PopoverFooter stretch>
          <Button size="lg" variant="subtle">
            Secondary
          </Button>
          <Button size="lg" variant="solid">
            Primary
          </Button>
        </PopoverFooter>
      </Row>
    </div>
  ),
};
