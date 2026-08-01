import type { Meta, StoryObj } from "@storybook/react";

import SelectListFooter from "./SelectListFooter";
import Button from "../Button/Button";
import MenuItem from "../Menu/MenuItem";
import { Icon } from "../Icon/Icon";

type Variant = "menuItem" | "actionBar";

type StoryArgs = {
  variant: Variant;
  primaryText: string;
  secondaryButton: boolean;
  cancelButton: boolean;
};

const noop = () => {};
const frame: React.CSSProperties = { width: 428 };

const meta: Meta<StoryArgs> = {
  title: "Components/SelectList/SelectListFooter",
  component: SelectListFooter,
  parameters: { layout: "centered" },
  args: { variant: "menuItem", primaryText: "Primary", secondaryButton: true, cancelButton: true },
  argTypes: {
    variant: { options: ["menuItem", "actionBar"], control: { type: "inline-radio" } },
    primaryText: { type: "string", control: { type: "text" }, if: { arg: "variant", eq: "actionBar" } },
    secondaryButton: { control: { type: "boolean" }, if: { arg: "variant", eq: "actionBar" } },
    cancelButton: { control: { type: "boolean" }, if: { arg: "variant", eq: "actionBar" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

/** menuItem (default) = divider + a MenuItem; actionBar = a PopoverFooter. */
export const Playground: Story = {
  render: ({ variant, primaryText, secondaryButton, cancelButton }) => (
    <div style={frame}>
      {variant === "menuItem" ? (
        <SelectListFooter>
          <MenuItem label="Action" slotLeft={<Icon icon="diamonds-4" pack="regular" size={14} container="square" />} onClick={noop} />
        </SelectListFooter>
      ) : (
        <SelectListFooter
          variant="actionBar"
          leadingButton={cancelButton ? <Button variant="ghost" size="lg" onClick={noop}>Cancel</Button> : undefined}
        >
          {secondaryButton && <Button variant="subtle" size="lg" onClick={noop}>Secondary</Button>}
          <Button variant="solid" size="lg" onClick={noop}>{primaryText}</Button>
        </SelectListFooter>
      )}
    </div>
  ),
};

/** The menuItem variant — e.g. an "Add new" action at the end of a select menu. */
export const MenuItemVariant: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={frame}>
      <SelectListFooter>
        <MenuItem label="Add new client" slotLeft={<Icon icon="plus" pack="regular" size={14} container="square" />} onClick={noop} />
      </SelectListFooter>
    </div>
  ),
};

/** Common actionBar button combinations. */
export const ActionBar: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-6)", ...frame }}>
      <SelectListFooter variant="actionBar">
        <Button variant="solid" size="lg" onClick={noop}>Primary</Button>
      </SelectListFooter>
      <SelectListFooter variant="actionBar">
        <Button variant="subtle" size="lg" onClick={noop}>Secondary</Button>
        <Button variant="solid" size="lg" onClick={noop}>Primary</Button>
      </SelectListFooter>
      <SelectListFooter variant="actionBar" leadingButton={<Button variant="ghost" size="lg" onClick={noop}>Cancel</Button>}>
        <Button variant="subtle" size="lg" onClick={noop}>Secondary</Button>
        <Button variant="solid" size="lg" onClick={noop}>Primary</Button>
      </SelectListFooter>
    </div>
  ),
};
