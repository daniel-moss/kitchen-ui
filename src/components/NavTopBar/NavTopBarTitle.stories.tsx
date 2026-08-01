import type { Meta, StoryObj } from "@storybook/react";

import Avatar from "../Avatar/Avatar";
import AvatarUser from "../Avatar/AvatarUser";
import { Icon } from "../Icon/Icon";
import NavTopBarTitle from "./NavTopBarTitle";

const meta: Meta<typeof NavTopBarTitle> = {
  title: "Components/NavTopBar/NavTopBarTitle",
  component: NavTopBarTitle,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof NavTopBarTitle>;

export const Playground: Story = {
  args: {
    title: "Title",
    dropdown: false,
  },
};

/** The four Figma combinations: slots off/on. */
export const Combinations: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "flex-start" }}>
      <NavTopBarTitle title="Title" />
      <NavTopBarTitle title="Title" dropdown />
      <NavTopBarTitle title="Title" slotLeft={<Icon icon="diamonds-4" pack="solid" size={14} />} />
      <NavTopBarTitle title="Title" slotLeft={<Icon icon="diamonds-4" pack="solid" size={14} />} dropdown />
    </div>
  ),
};

/** The left slot takes an icon (8px gap) or any md avatar (10px gap). */
export const LeftSlot: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "flex-start" }}>
      <NavTopBarTitle title="Pricebook" slotLeft={<Icon icon="tag" pack="solid" size={14} />} />
      <NavTopBarTitle title="Workspace" slotLeft={<Avatar type="object" size="md" />} dropdown />
      <NavTopBarTitle title="Lorne Riddle" slotLeft={<AvatarUser size="md" />} />
    </div>
  ),
};

/** A long title truncates. */
export const Truncation: Story = {
  render: () => (
    <div style={{ width: 220 }}>
      <NavTopBarTitle
        title="Very long title which does not fit one line"
        slotLeft={<Icon icon="diamonds-4" pack="solid" size={14} />}
        dropdown
      />
    </div>
  ),
};
