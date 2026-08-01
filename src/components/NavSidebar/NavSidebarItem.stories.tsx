import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { PSEUDO_SELF } from "../../stories/helpers";
import NavSidebarItem from "./NavSidebarItem";

const meta: Meta<typeof NavSidebarItem> = {
  title: "Components/NavSidebar/NavSidebarItem",
  component: NavSidebarItem,
  parameters: { layout: "padded" },
  argTypes: {
    breakpoint: { control: "inline-radio", options: ["auto", "desktop", "mobile"] },
  },
};
export default meta;

type Story = StoryObj<typeof NavSidebarItem>;

const column = (width = 256) => ({
  display: "flex",
  flexDirection: "column" as const,
  gap: 4,
  width,
});

export const Playground: Story = {
  args: {
    children: "Home",
    icon: "house",
    active: false,
    isDisabled: false,
    breakpoint: "desktop",
  },
  render: (args) => (
    <div style={{ width: 256 }}>
      <NavSidebarItem {...args} />
    </div>
  ),
};

/** The three types, inactive and active. */
export const Types: Story = {
  render: () => (
    <div style={column()}>
      <NavSidebarItem icon="house" breakpoint="desktop">
        Home
      </NavSidebarItem>
      <NavSidebarItem icon="house" breakpoint="desktop" active>
        Home
      </NavSidebarItem>
      <NavSidebarItem type="stackHeader" icon="wrench-simple" breakpoint="desktop">
        Jobs
      </NavSidebarItem>
      <NavSidebarItem type="stackHeader" icon="wrench-simple" breakpoint="desktop" defaultOpen active>
        Jobs
      </NavSidebarItem>
      <NavSidebarItem type="stackItem" breakpoint="desktop">
        Calendar
      </NavSidebarItem>
      <NavSidebarItem type="stackItem" breakpoint="desktop" active>
        Calendar
      </NavSidebarItem>
    </div>
  ),
};

/** Right modifiers (default type only): hot key and notification dot. */
export const Modifiers: Story = {
  render: () => (
    <div style={column()}>
      <NavSidebarItem icon="magnifying-glass" hotKey="⌘K" breakpoint="desktop">
        Search...
      </NavSidebarItem>
      <NavSidebarItem icon="bullhorn" notificationDot breakpoint="desktop">
        What&apos;s new
      </NavSidebarItem>
    </div>
  ),
};

/** All visual states per type (pseudo classes on the element itself). */
export const States: Story = {
  parameters: PSEUDO_SELF,
  render: () => (
    <div style={{ display: "flex", gap: 24 }}>
      {[false, true].map((active) => (
        <div key={String(active)} style={column()}>
          <NavSidebarItem icon="house" breakpoint="desktop" active={active}>
            Default
          </NavSidebarItem>
          <NavSidebarItem icon="house" breakpoint="desktop" active={active} className="pseudo-hover">
            Hovered
          </NavSidebarItem>
          <NavSidebarItem icon="house" breakpoint="desktop" active={active} className="pseudo-active">
            Pressed
          </NavSidebarItem>
          <NavSidebarItem icon="house" breakpoint="desktop" active={active} className="pseudo-focus-visible">
            Focused
          </NavSidebarItem>
          <NavSidebarItem icon="house" breakpoint="desktop" active={active} isDisabled>
            Disabled
          </NavSidebarItem>
          <NavSidebarItem type="stackHeader" icon="wrench-simple" breakpoint="desktop" active={active}>
            Stack header
          </NavSidebarItem>
          <NavSidebarItem type="stackItem" breakpoint="desktop" active={active}>
            Stack item
          </NavSidebarItem>
        </div>
      ))}
    </div>
  ),
};

/** Mobile rows are 36px tall (desktop 32px) — the only difference. */
export const Mobile: Story = {
  render: () => (
    <div style={column(320)}>
      <NavSidebarItem icon="house" breakpoint="mobile">
        Home
      </NavSidebarItem>
      <NavSidebarItem icon="magnifying-glass" hotKey="⌘K" breakpoint="mobile">
        Search...
      </NavSidebarItem>
      <NavSidebarItem type="stackHeader" icon="wrench-simple" breakpoint="mobile">
        Jobs
      </NavSidebarItem>
      <NavSidebarItem type="stackItem" breakpoint="mobile">
        Calendar
      </NavSidebarItem>
    </div>
  ),
};

/** A stack: the header toggles its items (the future NavSidebar wires this). */
const StackDemo = () => {
  const [open, setOpen] = useState(true);
  return (
    <div style={column()}>
      <NavSidebarItem icon="house" breakpoint="desktop">
        Home
      </NavSidebarItem>
      <NavSidebarItem type="stackHeader" icon="wrench-simple" breakpoint="desktop" open={open} onOpenChange={setOpen}>
        Jobs
      </NavSidebarItem>
      {open && (
        <>
          <NavSidebarItem type="stackItem" breakpoint="desktop" active>
            Calendar
          </NavSidebarItem>
          <NavSidebarItem type="stackItem" breakpoint="desktop">
            Job requests
          </NavSidebarItem>
          <NavSidebarItem type="stackItem" breakpoint="desktop">
            Recurring jobs
          </NavSidebarItem>
        </>
      )}
      <NavSidebarItem icon="file-lines" breakpoint="desktop">
        Estimates
      </NavSidebarItem>
    </div>
  );
};

export const Stack: Story = {
  render: () => <StackDemo />,
};
