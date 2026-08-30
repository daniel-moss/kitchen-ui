import type { Meta, StoryObj } from "@storybook/react";

import MenuItem from "./MenuItem";
import MenuItemGroup from "./MenuItemGroup";
import { MenuItemProps } from "./MenuItem.types";
import { Icon } from "../Icon/Icon";
import Avatar from "../Avatar/Avatar";
import { docsFrame, noop, PSEUDO_ALL } from "../../stories/helpers";

type Extra = "none" | "caption" | "tag";
type LeftSlot = "none" | "icon" | "avatar";
type RightSlot = "none" | "chevron" | "icon" | "toggle";
type StateOption = "default" | "hover" | "press" | "focus";

type StoryArgs = {
  label: string;
  extra: Extra;
  extraText: string;
  leftSlot: LeftSlot;
  rightSlot: RightSlot;
  danger: boolean;
  disabled: boolean;
  state: StateOption;
};

const icon = (name = "diamonds-4") => <Icon icon={name} pack="regular" size={14} container="square" />;
const avatar = <Avatar shape="circle" content="image" size="xs" />;
const chevron = icon("angle-right");

const leftSlots: Record<LeftSlot, React.ReactNode> = { none: undefined, icon: icon(), avatar };
const rightSlots: Partial<Record<RightSlot, React.ReactNode>> = { chevron, icon: icon() };

// caption / tag are mutually exclusive — build the right prop.
const extraProps = (extra: Extra, text: string) =>
  extra === "caption" ? { caption: text } : extra === "tag" ? { tag: text } : {};

// A menu-width column centered in the docs frame (a MenuItem is width:100%).
const Frame = ({ children, gap = "var(--size-0_5)" }: { children: React.ReactNode; gap?: string }) => (
  <div style={docsFrame}>
    <div style={{ width: 320, margin: "0 auto", display: "flex", flexDirection: "column", gap }}>{children}</div>
  </div>
);

const shareSubMenu = (
  <MenuItemGroup>
    <MenuItem label="Copy link" slotLeft={icon("link")} onClick={noop} />
    <MenuItem label="Email" slotLeft={icon("envelope")} onClick={noop} />
    <MenuItem label="Message" slotLeft={icon("message")} onClick={noop} />
  </MenuItemGroup>
);

/**
 * MenuItem — an action row inside a Menu: `[slotLeft] title [tag] [slotRight]`
 * with an optional caption. Variants: default, danger, a whole-row toggle, and
 * a sub-menu trigger.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Menu/MenuItem",
  component: MenuItem,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<StoryArgs>;

/** Build every combination from the controls. */
export const Playground: Story = {
  // The synthetic playground args/argTypes live on THIS story (not the meta) so
  // the docs-page ArgTypes table stays pure docgen from MenuItem.types.ts.
  parameters: { layout: "centered" },
  args: { label: "Action", extra: "none", extraText: "Caption", leftSlot: "none", rightSlot: "none", danger: false, disabled: false, state: "default" },
  argTypes: {
    label: { control: { type: "text" } },
    extra: { options: ["none", "caption", "tag"], control: { type: "inline-radio" } },
    extraText: { name: "caption / tag text", control: { type: "text" } },
    leftSlot: { name: "left slot", options: ["none", "icon", "avatar"], control: { type: "inline-radio" } },
    rightSlot: { name: "right slot (not danger)", options: ["none", "chevron", "icon", "toggle"], control: { type: "inline-radio" }, if: { arg: "danger", eq: false } },
    danger: { control: { type: "boolean" } },
    disabled: { control: { type: "boolean" } },
    state: { options: ["default", "hover", "press", "focus"], control: { type: "inline-radio" } },
  },
  render: ({ label, extra, extraText, leftSlot, rightSlot, danger, disabled, state }) => {
    const common = { label, slotLeft: leftSlots[leftSlot], disabled, onClick: noop, ...extraProps(extra, extraText) };
    // danger has no right slot; toggle is the interactive whole-row switch.
    const props = (
      danger ? { ...common, danger: true }
      : rightSlot === "toggle" ? { ...common, toggle: true, defaultChecked: true }
      : { ...common, slotRight: rightSlots[rightSlot] }
    ) as MenuItemProps;
    return (
      <div className={PSEUDO_ALL[state]} style={{ width: 320 }}>
        <MenuItem {...props} />
      </div>
    );
  },
};

/** A single action row — hover it to see the row fill. */
export const Interactive: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <MenuItem label="Action" slotLeft={icon()} onClick={noop} />
    </Frame>
  ),
};

/** The bare minimum is copy only; it also supports a caption OR a tag. */
export const Copy: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <MenuItem label="Action" onClick={noop} />
      <MenuItem label="Action" caption="Caption" onClick={noop} />
      <MenuItem label="Action" tag="Tag" onClick={noop} />
    </Frame>
  ),
};

/** Left slot: an Icon (16px box) or an xs Avatar (20px). Top-aligned. */
export const LeftSlot: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <MenuItem label="Action" caption="Caption" slotLeft={icon()} onClick={noop} />
      <MenuItem label="Action" caption="Caption" slotLeft={avatar} onClick={noop} />
    </Frame>
  ),
};

/** Right slot: a chevron, a toggle, or a generic icon. Top-aligned. */
export const RightSlot: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <MenuItem label="Action" caption="Caption" slotRight={chevron} onClick={noop} />
      <MenuItem label="Action" caption="Caption" toggle defaultChecked />
      <MenuItem label="Action" caption="Caption" slotRight={icon()} onClick={noop} />
    </Frame>
  ),
};

/** Title truncates; caption wraps; a tag takes priority (the title ellipsizes). */
export const Overflow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <MenuItem
        label="Very long title which does not fit one line and truncates"
        caption="Very long caption which does not fit one line and wraps onto more lines"
        onClick={noop}
      />
      <MenuItem label="Very long title which does not fit one line and truncates" tag="Takes priority" onClick={noop} />
    </Frame>
  ),
};

/** A toggle in the right slot makes the whole row a switch — click anywhere. */
export const Toggle: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <MenuItem label="Notifications" slotLeft={icon("bell")} toggle />
      <MenuItem label="Notifications" slotLeft={icon("bell")} toggle defaultChecked />
    </Frame>
  ),
};

/** A sub-menu trigger — hover to open the nested card (desktop). */
export const SubMenu: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <MenuItem label="Share" slotLeft={icon("arrow-up-from-bracket")} subMenu={shareSubMenu} />
    </Frame>
  ),
};

/** Interaction states: default, focused, hovered, pressed, disabled. */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <MenuItem label="Default" slotLeft={icon()} onClick={noop} />
      <div className={PSEUDO_ALL.focus}>
        <MenuItem label="Focused" slotLeft={icon()} onClick={noop} />
      </div>
      <div className={PSEUDO_ALL.hover}>
        <MenuItem label="Hovered" slotLeft={icon()} onClick={noop} />
      </div>
      <div className={PSEUDO_ALL.press}>
        <MenuItem label="Pressed" slotLeft={icon()} onClick={noop} />
      </div>
      <MenuItem label="Disabled" slotLeft={icon()} disabled onClick={noop} />
    </Frame>
  ),
};

/** Danger — destructive actions: copy and left icon in error tones, no right slot. */
export const Danger: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <MenuItem label="Delete" slotLeft={icon("trash-can")} danger onClick={noop} />
      <MenuItem label="Delete" caption="This cannot be undone" slotLeft={icon("trash-can")} danger onClick={noop} />
      <MenuItem label="Delete" tag="Tag" slotLeft={icon("trash-can")} danger onClick={noop} />
    </Frame>
  ),
};

/** Danger interaction states — tomato tints. */
export const DangerStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <MenuItem label="Default" slotLeft={icon("trash-can")} danger onClick={noop} />
      <div className={PSEUDO_ALL.focus}>
        <MenuItem label="Focused" slotLeft={icon("trash-can")} danger onClick={noop} />
      </div>
      <div className={PSEUDO_ALL.hover}>
        <MenuItem label="Hovered" slotLeft={icon("trash-can")} danger onClick={noop} />
      </div>
      <div className={PSEUDO_ALL.press}>
        <MenuItem label="Pressed" slotLeft={icon("trash-can")} danger onClick={noop} />
      </div>
      <MenuItem label="Disabled" slotLeft={icon("trash-can")} danger disabled onClick={noop} />
    </Frame>
  ),
};
