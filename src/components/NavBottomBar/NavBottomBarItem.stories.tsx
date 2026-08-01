import type { Meta, StoryObj } from "@storybook/react";

import { PSEUDO_SELF } from "../../stories/helpers";
import NavBottomBarItem from "./NavBottomBarItem";

const meta: Meta<typeof NavBottomBarItem> = {
  title: "Components/NavBottomBar/NavBottomBarItem",
  component: NavBottomBarItem,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof NavBottomBarItem>;

export const Playground: Story = {
  args: {
    icon: "house",
    label: "Home",
    active: false,
    isDisabled: false,
  },
};

/** Inactive vs active — the active section gets the fill and the solid icon. */
export const ActiveState: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 80 }}>
      <NavBottomBarItem icon="house" label="Home" />
      <NavBottomBarItem icon="house" label="Home" active />
    </div>
  ),
};

/** All states, inactive and active columns. */
export const States: Story = {
  parameters: PSEUDO_SELF,
  render: () => (
    <div style={{ display: "flex", gap: 80 }}>
      {[false, true].map((active) => (
        <div key={String(active)} style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
          <NavBottomBarItem icon="diamonds-4" label="Default" active={active} />
          <NavBottomBarItem icon="diamonds-4" label="Hovered" active={active} className="pseudo-hover" />
          <NavBottomBarItem icon="diamonds-4" label="Pressed" active={active} className="pseudo-active" />
          <NavBottomBarItem icon="diamonds-4" label="Focused" active={active} className="pseudo-focus-visible" />
          <NavBottomBarItem icon="diamonds-4" label="Disabled" active={active} isDisabled />
        </div>
      ))}
    </div>
  ),
};

/** In a bar the items stretch to share the width — but never past 112px. */
export const Stretched: Story = {
  render: () => (
    <div style={{ display: "flex", width: 375 }}>
      <NavBottomBarItem icon="house" label="Home" active />
      <NavBottomBarItem icon="wrench-simple" label="Jobs" />
      <NavBottomBarItem icon="circle-dollar" label="Invoices" />
    </div>
  ),
};
