import type { Meta, StoryObj } from "@storybook/react";

import MenuItemGroup from "./MenuItemGroup";
import MenuItem from "./MenuItem";
import GroupLabel from "../GroupLabel/GroupLabel";
import { Icon } from "../Icon/Icon";
import { noop } from "../../stories/helpers";

type StoryArgs = {
  label: boolean;
  divider: boolean;
};

const frame: React.CSSProperties = { width: 231 };

const icon = (name: string) => <Icon icon={name} pack="regular" size={14} container="square" />;

const meta: Meta<StoryArgs> = {
  title: "Components/Menu/MenuItemGroup",
  component: MenuItemGroup,
  parameters: { layout: "centered" },
  args: { label: false, divider: false },
  argTypes: {
    label: { control: { type: "boolean" } },
    divider: { control: { type: "boolean" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  render: ({ label, divider }) => (
    <div style={frame}>
      <MenuItemGroup label={label ? <GroupLabel variant="secondary" label="Label" /> : undefined} divider={divider}>
        <MenuItem label="Action" slotLeft={icon("diamonds-4")} onClick={noop} />
        <MenuItem label="Action" slotLeft={icon("diamonds-4")} onClick={noop} />
      </MenuItemGroup>
    </div>
  ),
};

/** A menu — groups separated by dividers; the last group omits it. */
export const Menu: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={frame}>
      <MenuItemGroup divider>
        <MenuItem label="Edit" slotLeft={icon("pen")} onClick={noop} />
        <MenuItem label="Duplicate" slotLeft={icon("copy")} onClick={noop} />
      </MenuItemGroup>
      <MenuItemGroup label={<GroupLabel variant="secondary" label="Settings" />} divider>
        <MenuItem label="Notifications" toggle defaultChecked />
        <MenuItem label="Share" slotLeft={icon("arrow-up-from-bracket")} slotRight={icon("angle-right")} onClick={noop} />
      </MenuItemGroup>
      <MenuItemGroup>
        <MenuItem label="Delete" slotLeft={icon("trash-can")} danger onClick={noop} />
      </MenuItemGroup>
    </div>
  ),
};
