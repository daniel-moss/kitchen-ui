import type { Meta, StoryObj } from "@storybook/react";

import { CSSProperties } from "react";

import { cap, DocsFrame, PSEUDO_SELF } from "../../stories/helpers";
import BottomBarNavItem from "./BottomBarNavItem";

const meta: Meta<typeof BottomBarNavItem> = {
  title: "Components/BottomBarNav/BottomBarNavItem",
  component: BottomBarNavItem,
  // fullscreen — `DocsFrame` provides the (only) padding in docs stories.
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof BottomBarNavItem>;

// Docs examples sit centered in the preview (like the Figma doc pages).
const centered: CSSProperties = { display: "flex", justifyContent: "center" };

export const Playground: Story = {
  args: {
    icon: "house",
    label: "Home",
    active: false,
    isDisabled: false,
  },
  render: (args) => (
    <DocsFrame>
      <div style={centered}>
        <BottomBarNavItem {...args} />
      </div>
    </DocsFrame>
  ),
};

/** The hero example — one item. */
export const Hero: Story = {
  render: () => (
    <DocsFrame>
      <div style={centered}>
        <BottomBarNavItem icon="diamonds-4" label="Section" />
      </div>
    </DocsFrame>
  ),
};

/** Inactive and active — every state. */
export const States: Story = {
  parameters: PSEUDO_SELF,
  render: () => (
    <DocsFrame>
      <div style={{ ...centered, gap: 80 }}>
        {[false, true].map((active) => (
          <div key={String(active)} style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
            <span style={cap}>{active ? "Active (current page)" : "Inactive"}</span>
            <BottomBarNavItem icon="diamonds-4" label="Default" active={active} />
            <BottomBarNavItem icon="diamonds-4" label="Focused" active={active} className="pseudo-focus-visible" />
            <BottomBarNavItem icon="diamonds-4" label="Hovered" active={active} className="pseudo-hover" />
            <BottomBarNavItem icon="diamonds-4" label="Pressed" active={active} className="pseudo-active" />
            <BottomBarNavItem icon="diamonds-4" label="Disabled" active={active} isDisabled />
          </div>
        ))}
      </div>
    </DocsFrame>
  ),
};

/** In a bar the items stretch to share the width — but never past 112px. */
export const Stretched: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ display: "flex", width: 375, margin: "0 auto" }}>
        <BottomBarNavItem icon="house" label="Home" active />
        <BottomBarNavItem icon="wrench-simple" label="Jobs" />
        <BottomBarNavItem icon="circle-dollar" label="Invoices" />
      </div>
    </DocsFrame>
  ),
};
