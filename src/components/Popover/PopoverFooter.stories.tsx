import type { Meta, StoryObj } from "@storybook/react";
import { CSSProperties, ReactNode } from "react";

import PopoverFooter from "./PopoverFooter";
import PopoverFooterText from "./PopoverFooterText";
import Button from "../Button/Button";
import { DocsFrame } from "../../stories/helpers";

type StoryArgs = {
  slotLeft: "none" | "button" | "text";
  buttonCount: 1 | 2;
  secondaryStyle: "subtle" | "ghost";
  stretch: boolean;
  // Docs-table-only rows — real props documented in argTypes, never set as args.
  children?: never;
  className?: never;
};

/**
 * PopoverFooter — the action bar at the bottom of popover-like containers
 * (Popover, Dialog, SidePanel, select menus). A full-width Divider on top plus
 * a row of actions: an optional left slot (a ghost Cancel or a display-only
 * PopoverFooterText) pinned far left, and the trailing buttons on the right.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Popover/PopoverFooter",
  component: PopoverFooter,
  // fullscreen — `docsFrame` provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: { slotLeft: "button", buttonCount: 1, secondaryStyle: "subtle", stretch: false },
  argTypes: {
    // Real props, declared by hand: PopoverFooterProps is a union (slotLeft ⊕
    // stretch), and react-docgen cannot read JSDoc off a union — the ListItem
    // gotcha. Keep these in step with PopoverFooter.types.ts.
    children: {
      control: false,
      description:
        "The trailing buttons, pushed to the right edge (Secondary, then Primary). Priority increases left → right; the rightmost is the primary action and the only required one. The secondary is `subtle` by default (`ghost` is also allowed). All buttons the lg size. Max 3 actions total, including the left slot.",
      table: { type: { summary: "ReactNode" } },
    },
    slotLeft: {
      options: ["none", "button", "text"],
      control: { type: "inline-radio" },
      if: { arg: "stretch", eq: false },
      description:
        "The left slot, pinned to the far left: a low-priority ghost Button (typically Cancel) or a display-only `PopoverFooterText`. Not available together with `stretch`. (The playground control picks an example element.)",
      table: { type: { summary: "ReactNode" } },
    },
    stretch: {
      control: { type: "boolean" },
      description:
        "Full-width layout (Figma `layout=fullWidth`): the buttons stay on one row and share the width equally. Not available together with `slotLeft`.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    className: { control: false, table: { type: { summary: "string" } } },
    // Playground-only controls — kept out of the docs Props table.
    buttonCount: {
      name: "trailing buttons",
      options: [1, 2],
      control: { type: "inline-radio" },
      table: { disable: true },
    },
    secondaryStyle: {
      name: "secondary style",
      options: ["subtle", "ghost"],
      control: { type: "inline-radio" },
      if: { arg: "buttonCount", eq: 2 },
      table: { disable: true },
    },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

const cancel = (
  <Button size="lg" variant="ghost">
    Cancel
  </Button>
);

const primary = (
  <Button size="lg" variant="solid">
    Primary
  </Button>
);

const secondary = (variant: "subtle" | "ghost" = "subtle") => (
  <Button size="lg" variant={variant}>
    Secondary
  </Button>
);

// Stacked footers inside one docs preview — the Figma doc's 80px rhythm.
const stack: CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--size-20)" };
const Stack = ({ children }: { children: ReactNode }) => <div style={stack}>{children}</div>;

export const Playground: Story = {
  render: ({ slotLeft, buttonCount, secondaryStyle, stretch }) => {
    const buttons = (
      <>
        {buttonCount === 2 && secondary(secondaryStyle)}
        {primary}
      </>
    );
    return (
      <DocsFrame>
        {stretch ? (
          <PopoverFooter stretch>{buttons}</PopoverFooter>
        ) : (
          <PopoverFooter
            slotLeft={
              slotLeft === "button" ? (
                cancel
              ) : slotLeft === "text" ? (
                <PopoverFooterText icon="calendar">May, 2027</PopoverFooterText>
              ) : undefined
            }
          >
            {buttons}
          </PopoverFooter>
        )}
      </DocsFrame>
    );
  },
};

/** Hero — the most common footer: ghost Cancel + Primary. */
export const Hero: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <DocsFrame>
      <PopoverFooter slotLeft={cancel}>{primary}</PopoverFooter>
    </DocsFrame>
  ),
};

/** Anatomy — the configuration showing the most parts at once. */
export const Anatomy: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <DocsFrame>
      <PopoverFooter slotLeft={<PopoverFooterText>Label</PopoverFooterText>}>
        {secondary()}
        {primary}
      </PopoverFooter>
    </DocsFrame>
  ),
};

/** The two contents of the left slot: a ghost button, or a display-only text. */
export const SlotLeftKinds: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <DocsFrame>
      <Stack>
        <PopoverFooter slotLeft={cancel}>
          {secondary()}
          {primary}
        </PopoverFooter>
        <PopoverFooter slotLeft={<PopoverFooterText>Label</PopoverFooterText>}>
          {secondary()}
          {primary}
        </PopoverFooter>
      </Stack>
    </DocsFrame>
  ),
};

/** The text with its optional icon. */
export const TextWithIcon: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <DocsFrame>
      <PopoverFooter slotLeft={<PopoverFooterText icon="diamonds-4">Label</PopoverFooterText>}>
        {secondary()}
        {primary}
      </PopoverFooter>
    </DocsFrame>
  ),
};

/** The trailing buttons: subtle Secondary (default), ghost Secondary, Primary only. */
export const Buttons: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <DocsFrame>
      <Stack>
        <PopoverFooter>
          {secondary()}
          {primary}
        </PopoverFooter>
        <PopoverFooter>
          {secondary("ghost")}
          {primary}
        </PopoverFooter>
        <PopoverFooter>{primary}</PopoverFooter>
      </Stack>
    </DocsFrame>
  ),
};

/** The three layouts: default, slotLeft, fullWidth. */
export const Layouts: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <DocsFrame>
      <Stack>
        <PopoverFooter>
          {secondary()}
          {primary}
        </PopoverFooter>
        <PopoverFooter slotLeft={cancel}>
          {secondary()}
          {primary}
        </PopoverFooter>
        <PopoverFooter stretch>
          {secondary()}
          {primary}
        </PopoverFooter>
      </Stack>
    </DocsFrame>
  ),
};

/** Priority combinations — only the primary button is required. */
export const Priority: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <DocsFrame>
      <Stack>
        <PopoverFooter slotLeft={cancel}>
          {secondary()}
          {primary}
        </PopoverFooter>
        <PopoverFooter>
          {secondary("ghost")}
          {primary}
        </PopoverFooter>
        <PopoverFooter slotLeft={cancel}>{primary}</PopoverFooter>
        <PopoverFooter>{primary}</PopoverFooter>
      </Stack>
    </DocsFrame>
  ),
};

/** A long slotLeft text truncates; the buttons never shrink. */
export const Truncation: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <DocsFrame>
      <PopoverFooter
        slotLeft={<PopoverFooterText icon="diamonds-4">A very long label that does not fit the row</PopoverFooterText>}
      >
        {secondary()}
        {primary}
      </PopoverFooter>
    </DocsFrame>
  ),
};

/** Full width — the buttons share the row equally; a single Primary fills it. */
export const FullWidth: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <DocsFrame>
      <Stack>
        <PopoverFooter stretch>
          {secondary()}
          {primary}
        </PopoverFooter>
        <PopoverFooter stretch>{primary}</PopoverFooter>
      </Stack>
    </DocsFrame>
  ),
};
