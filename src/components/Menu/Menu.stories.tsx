import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Menu from "./Menu";
import MenuItem from "./MenuItem";
import MenuItemGroup from "./MenuItemGroup";
import IconButton from "../IconButton/IconButton";
import { Icon } from "../Icon/Icon";
import { DeviceFrame, STATUS_BAR, noop } from "../../stories/helpers";

type StoryArgs = {
  open: boolean;
  title: string;
};

const icon = (name: string) => <Icon icon={name} pack="regular" size={14} container="square" />;

const shareSubMenu = (
  <MenuItemGroup>
    <MenuItem label="Copy link" slotLeft={icon("link")} onClick={noop} />
    <MenuItem label="Email" slotLeft={icon("envelope")} onClick={noop} />
    <MenuItem label="Message" slotLeft={icon("message")} onClick={noop} />
  </MenuItemGroup>
);

const meta: Meta<StoryArgs> = {
  title: "Components/Menu/Menu",
  component: Menu,
  parameters: { layout: "centered" },
  args: { open: true, title: "" },
  argTypes: {
    open: { control: { type: "boolean" } },
    title: { name: "title (mobile root)", control: { type: "text" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

/** Desktop card. Hover "Share" to open its sub-menu (4px beside the item). */
export const Playground: Story = {
  render: ({ open }) => (
    <div style={{ minHeight: 380, minWidth: 500, display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: 16 }}>
      <Menu open={open} breakpoint="desktop">
        <MenuItemGroup>
          <MenuItem label="Edit" slotLeft={icon("pen")} onClick={noop} />
          <MenuItem label="Duplicate" slotLeft={icon("copy")} onClick={noop} />
        </MenuItemGroup>
        <MenuItemGroup>
          <MenuItem label="Notifications" toggle defaultChecked />
          <MenuItem label="Share" slotLeft={icon("arrow-up-from-bracket")} subMenu={shareSubMenu} />
        </MenuItemGroup>
        <MenuItemGroup>
          <MenuItem label="Delete" slotLeft={icon("trash-can")} danger onClick={noop} />
        </MenuItemGroup>
      </Menu>
    </div>
  ),
};

/** The width adapts to the content between min 160 and max 384. */
export const Widths: Story = {
  parameters: { controls: { disable: true }, layout: "padded" },
  render: () => (
    <div style={{ display: "flex", gap: "var(--size-6)", alignItems: "flex-start" }}>
      <Menu breakpoint="desktop">
        <MenuItemGroup>
          <MenuItem label="Edit" onClick={noop} />
          <MenuItem label="Copy" onClick={noop} />
        </MenuItemGroup>
      </Menu>
      <Menu breakpoint="desktop">
        <MenuItemGroup>
          <MenuItem label="Assign to a technician" slotLeft={icon("user")} onClick={noop} />
          <MenuItem label="Mark as completed" slotLeft={icon("check")} onClick={noop} />
        </MenuItemGroup>
      </Menu>
      <Menu breakpoint="desktop">
        <MenuItemGroup>
          <MenuItem label="A very long action label that runs past the 384px maximum width and wraps to more lines" onClick={noop} />
        </MenuItemGroup>
      </Menu>
    </div>
  ),
};

// The 4px trigger-gap rule: the menu sits 4px from the IconButton that opens it.
const TriggerDemo = () => {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ minHeight: 420, minWidth: 500, paddingTop: 16 }}>
      <div style={{ position: "relative", width: "fit-content" }}>
        <IconButton icon="ellipsis" size="md" variant="muted" aria-label="More actions" onClick={() => setOpen((o) => !o)} />
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0 }}>
          <Menu open={open} onClose={() => setOpen(false)} breakpoint="desktop">
            <MenuItemGroup>
              <MenuItem label="Edit" slotLeft={icon("pen")} onClick={noop} />
              <MenuItem label="Share" slotLeft={icon("arrow-up-from-bracket")} subMenu={shareSubMenu} />
            </MenuItemGroup>
            <MenuItemGroup>
              <MenuItem label="Delete" slotLeft={icon("trash-can")} danger onClick={noop} />
            </MenuItemGroup>
          </Menu>
        </div>
      </div>
    </div>
  );
};

/** Attached to a trigger — 4px between the trigger and the menu. Click to toggle. */
export const WithTrigger: Story = {
  parameters: { controls: { disable: true } },
  render: () => <TriggerDemo />,
};

// ---- mobile (drawer) --------------------------------------------------------

const MobileDemo = ({ title }: { title: string }) => {
  const [open, setOpen] = useState(true);
  return (
    <DeviceFrame>
      {!open && (
        <div style={{ position: "absolute", top: STATUS_BAR + 40, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <IconButton icon="ellipsis" size="md" variant="muted" aria-label="Reopen menu" onClick={() => setOpen(true)} />
        </div>
      )}
      <Menu open={open} onClose={() => setOpen(false)} title={title || undefined} breakpoint="mobile">
        <MenuItemGroup>
          <MenuItem label="Edit" slotLeft={icon("pen")} onClick={noop} />
          <MenuItem label="Duplicate" slotLeft={icon("copy")} onClick={noop} />
        </MenuItemGroup>
        <MenuItemGroup>
          <MenuItem label="Notifications" toggle defaultChecked />
          <MenuItem label="Share" slotLeft={icon("arrow-up-from-bracket")} subMenu={shareSubMenu} />
        </MenuItemGroup>
        <MenuItemGroup>
          <MenuItem label="Delete" slotLeft={icon("trash-can")} danger onClick={noop} />
        </MenuItemGroup>
      </Menu>
    </DeviceFrame>
  );
};

/**
 * Mobile drawer. Tap "Share" — the drawer content swaps to the sub-menu with a
 * back button and "Share" as the title. The root title is optional (set the
 * control); without it the header is just the drag handle.
 */
export const Mobile: Story = {
  parameters: { controls: { disable: true }, layout: "centered" },
  render: () => <MobileDemo title="" />,
};

/** Mobile with a root title in the drawer header. */
export const MobileWithTitle: Story = {
  parameters: { controls: { disable: true }, layout: "centered" },
  render: () => <MobileDemo title="Job actions" />,
};
