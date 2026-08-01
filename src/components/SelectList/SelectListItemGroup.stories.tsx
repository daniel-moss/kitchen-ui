import type { Meta, StoryObj } from "@storybook/react";

import SelectListItemGroup from "./SelectListItemGroup";
import SelectListItem from "./SelectListItem";
import GroupLabel from "../GroupLabel/GroupLabel";
import AvatarLocation from "../Avatar/AvatarLocation";

type StoryArgs = {
  label: boolean;
  divider: boolean;
  multiSelect: boolean;
};

const noop = () => {};
const frame: React.CSSProperties = { width: 440 };

const objectAvatar = <AvatarLocation size="xl" />;

const meta: Meta<StoryArgs> = {
  title: "Components/SelectList/SelectListItemGroup",
  component: SelectListItemGroup,
  parameters: { layout: "centered" },
  args: { label: true, divider: true, multiSelect: false },
  argTypes: {
    label: { control: { type: "boolean" } },
    divider: { control: { type: "boolean" } },
    multiSelect: { control: { type: "boolean" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

/** Default items pair with a SECONDARY GroupLabel (object items with a primary one). */
export const Playground: Story = {
  render: ({ label, divider, multiSelect }) => (
    <div style={frame}>
      <SelectListItemGroup label={label ? <GroupLabel variant="secondary" label="Label" /> : undefined} divider={divider}>
        <SelectListItem label="Option" multiSelect={multiSelect} onClick={noop} />
        <SelectListItem label="Option" multiSelect={multiSelect} selected onClick={noop} />
        <SelectListItem label="Option" multiSelect={multiSelect} onClick={noop} />
      </SelectListItemGroup>
    </div>
  ),
};

/** Two groups stacked — the divider separates them; the last group omits it. */
export const Groups: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={frame}>
      <SelectListItemGroup label={<GroupLabel label="Label" counter={2} />}>
        <SelectListItem variant="object" avatar={objectAvatar} label="123 Main Street, Suite 45, San Francisco, CA 98765" caption="Headquarters" onClick={noop} />
        <SelectListItem variant="object" avatar={objectAvatar} label="123 Main Street, Suite 45, San Francisco, CA 98765" caption="Headquarters" onClick={noop} />
      </SelectListItemGroup>
      <SelectListItemGroup label={<GroupLabel label="Label" counter={2} />} divider={false}>
        <SelectListItem variant="object" avatar={objectAvatar} label="123 Main Street, Suite 45, San Francisco, CA 98765" caption="Headquarters" onClick={noop} />
        <SelectListItem variant="object" avatar={objectAvatar} label="123 Main Street, Suite 45, San Francisco, CA 98765" caption="Headquarters" onClick={noop} />
      </SelectListItemGroup>
    </div>
  ),
};

/** Without a label — just the items stack (plus divider). */
export const NoLabel: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={frame}>
      <SelectListItemGroup>
        <SelectListItem label="Option" onClick={noop} />
        <SelectListItem label="Option" onClick={noop} />
      </SelectListItemGroup>
    </div>
  ),
};
