import type { Meta, StoryObj } from "@storybook/react";

import Avatar from "../Avatar/Avatar";
import { Icon } from "../Icon/Icon";
import { noop } from "../../stories/helpers";
import NavTopBarLeftElements from "./NavTopBarLeftElements";
import NavTopBarTitle from "./NavTopBarTitle";

const meta: Meta<typeof NavTopBarLeftElements> = {
  title: "Components/NavTopBar/NavTopBarLeftElements",
  component: NavTopBarLeftElements,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof NavTopBarLeftElements>;

export const Playground: Story = {
  render: () => (
    <NavTopBarLeftElements onBack={noop} onActions={noop}>
      <NavTopBarTitle title="Title" />
    </NavTopBarLeftElements>
  ),
};

/** The four Figma combinations: slots off/on. */
export const Combinations: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "flex-start" }}>
      <NavTopBarLeftElements>
        <NavTopBarTitle title="Title" />
      </NavTopBarLeftElements>
      <NavTopBarLeftElements onBack={noop}>
        <NavTopBarTitle title="Title" />
      </NavTopBarLeftElements>
      <NavTopBarLeftElements onBack={noop} onActions={noop}>
        <NavTopBarTitle title="Title" />
      </NavTopBarLeftElements>
      <NavTopBarLeftElements onActions={noop}>
        <NavTopBarTitle title="Title" />
      </NavTopBarLeftElements>
    </div>
  ),
};

/** Composed with the title's own slots. */
export const WithTitleSlots: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "flex-start" }}>
      <NavTopBarLeftElements onBack={noop} onActions={noop}>
        <NavTopBarTitle title="Pricebook" slotLeft={<Icon icon="tag" pack="solid" size={14} />} />
      </NavTopBarLeftElements>
      <NavTopBarLeftElements onBack={noop}>
        <NavTopBarTitle title="Workspace" slotLeft={<Avatar type="object" size="md" />} dropdown />
      </NavTopBarLeftElements>
    </div>
  ),
};
