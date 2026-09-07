import type { Meta, StoryObj } from "@storybook/react";

import { DeviceFrame, DocsFrame } from "../../stories/helpers";
import BottomBarNav from "./BottomBarNav";
import BottomBarNavItem from "./BottomBarNavItem";

const meta: Meta<typeof BottomBarNav> = {
  title: "Components/BottomBarNav/BottomBarNav",
  component: BottomBarNav,
  // fullscreen — `DocsFrame` provides the (only) padding in docs stories.
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof BottomBarNav>;

const items = (
  <>
    <BottomBarNavItem icon="house" label="Home" active />
    <BottomBarNavItem icon="wrench-simple" label="Jobs" />
    <BottomBarNavItem icon="plus" label="Create" />
    <BottomBarNavItem icon="magnifying-glass" label="Search" />
    <BottomBarNavItem icon="bars" label="Menu" />
  </>
);

/** The doc's bar: Home (active), Jobs, Create, Search, Menu. */
export const Playground: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ width: 375, margin: "0 auto" }}>
        <BottomBarNav breakpoint="mobile">{items}</BottomBarNav>
      </div>
    </DocsFrame>
  ),
};

/** The hero example. */
export const Hero: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ width: 375, margin: "0 auto" }}>
        <BottomBarNav breakpoint="mobile">{items}</BottomBarNav>
      </div>
    </DocsFrame>
  ),
};

/** The bar fills the width; items cap at 112px and stay centered (min 320). */
export const Responsiveness: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "center", width: "100%" }}>
        <BottomBarNav breakpoint="mobile">{items}</BottomBarNav>
        <div style={{ width: 320 }}>
          <BottomBarNav breakpoint="mobile">{items}</BottomBarNav>
        </div>
      </div>
    </DocsFrame>
  ),
};

/** Fixed at the screen bottom; the safe-area strip comes from the shared inset. */
export const FixedBottom: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <DeviceFrame>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
          <BottomBarNav breakpoint="mobile">{items}</BottomBarNav>
        </div>
        </DeviceFrame>
      </div>
    </DocsFrame>
  ),
};
