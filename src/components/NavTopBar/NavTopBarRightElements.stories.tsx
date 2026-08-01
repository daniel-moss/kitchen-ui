import type { Meta, StoryObj } from "@storybook/react";

import { noop } from "../../stories/helpers";
import { AvatarGroupItem } from "../Avatar/AvatarGroup.types";
import NavTopBarRightElements from "./NavTopBarRightElements";

const LIVE: AvatarGroupItem[] = [
  { kind: "live", name: "Aisa Donovan" },
  { kind: "live", name: "Amy Lowery" },
];

const meta: Meta<typeof NavTopBarRightElements> = {
  title: "Components/NavTopBar/NavTopBarRightElements",
  component: NavTopBarRightElements,
  parameters: { layout: "padded" },
  argTypes: {
    breakpoint: { control: "inline-radio", options: ["auto", "desktop", "mobile"] },
  },
};
export default meta;

type Story = StoryObj<typeof NavTopBarRightElements>;

export const Playground: Story = {
  args: {
    avatars: LIVE,
    breakpoint: "desktop",
  },
  render: (args) => <NavTopBarRightElements {...args} onSearch={noop} onCreate={noop} />,
};

/** The four desktop combinations: avatars + optional search + optional create. */
export const Desktop: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "flex-end" }}>
      <NavTopBarRightElements breakpoint="desktop" avatars={LIVE} />
      <NavTopBarRightElements breakpoint="desktop" avatars={LIVE} onSearch={noop} />
      <NavTopBarRightElements breakpoint="desktop" avatars={LIVE} onCreate={noop} />
      <NavTopBarRightElements breakpoint="desktop" avatars={LIVE} onSearch={noop} onCreate={noop} />
    </div>
  ),
};

/** Mobile: no search; create becomes the solid plus IconButton. */
export const Mobile: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "flex-end" }}>
      <NavTopBarRightElements breakpoint="mobile" avatars={LIVE} />
      <NavTopBarRightElements breakpoint="mobile" avatars={LIVE} onSearch={noop} onCreate={noop} />
    </div>
  ),
};
