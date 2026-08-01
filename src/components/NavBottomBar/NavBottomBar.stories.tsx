import type { Meta, StoryObj } from "@storybook/react";

import { DeviceFrame } from "../../stories/helpers";
import NavBottomBar from "./NavBottomBar";
import NavBottomBarItem from "./NavBottomBarItem";

const meta: Meta<typeof NavBottomBar> = {
  title: "Components/NavBottomBar/NavBottomBar",
  component: NavBottomBar,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof NavBottomBar>;

const items = (
  <>
    <NavBottomBarItem icon="house" label="Home" active />
    <NavBottomBarItem icon="wrench-simple" label="Jobs" />
    <NavBottomBarItem icon="plus" label="Create" strong />
    <NavBottomBarItem icon="magnifying-glass" label="Search" />
    <NavBottomBarItem icon="bars" label="Menu" />
  </>
);

/** The doc's bar: Home (active), Jobs, Create (strong icon), Search, Menu. */
export const Playground: Story = {
  render: () => (
    <div style={{ width: 375 }}>
      <NavBottomBar breakpoint="mobile">{items}</NavBottomBar>
    </div>
  ),
};

/** The bar fills the width; items cap at 112px and stay centered (min 320). */
export const Responsiveness: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <NavBottomBar breakpoint="mobile">{items}</NavBottomBar>
      <div style={{ width: 320 }}>
        <NavBottomBar breakpoint="mobile">{items}</NavBottomBar>
      </div>
    </div>
  ),
};

/** Fixed at the screen bottom; the safe-area strip comes from the shared inset. */
export const Mobile: Story = {
  render: () => (
    <DeviceFrame>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
        <NavBottomBar breakpoint="mobile">{items}</NavBottomBar>
      </div>
    </DeviceFrame>
  ),
};
