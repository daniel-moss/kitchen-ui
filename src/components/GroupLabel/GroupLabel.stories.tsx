import { Fragment } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import GroupLabel from "./GroupLabel";
import { GroupLabelProps } from "./GroupLabel.types";
import { Icon } from "../Icon/Icon";
import IconButton from "../IconButton/IconButton";
import Avatar from "../Avatar/Avatar";
import { cap, noop, PSEUDO_ALL } from "../../stories/helpers";

type Variant = "primary" | "secondary";
type LeftSlot = "none" | "icon" | "avatar";
type StateOption = "default" | "hover" | "press" | "focus";

type StoryArgs = {
  variant: Variant;
  label: string;
  counter: string;
  counterIcon: boolean;
  caption: string;
  leftSlot: LeftSlot;
  rightSlot: boolean;
  accordion: boolean;
  disabled: boolean;
  state: StateOption;
};

const frame: React.CSSProperties = { width: 355 };

const iconSlot = <Icon icon="diamonds-4" pack="regular" size={14} container="square" />;
const avatarSlot = <Avatar shape="square" content="image" size="sm" />;
const leftSlots: Record<LeftSlot, React.ReactNode> = { none: undefined, icon: iconSlot, avatar: avatarSlot };
const primaryAction = <IconButton icon="diamonds-4" size="md" variant="ghost" aria-label="Action" onClick={noop} />;
const secondaryAction = <IconButton icon="diamonds-4" size="xs" variant="muted" aria-label="Action" onClick={noop} />;

const meta: Meta<StoryArgs> = {
  title: "Components/GroupLabel",
  component: GroupLabel,
  parameters: { layout: "centered" },
  args: {
    variant: "primary",
    label: "Label",
    counter: "",
    counterIcon: false,
    caption: "",
    leftSlot: "none",
    rightSlot: false,
    accordion: false,
    disabled: false,
    state: "default",
  },
  argTypes: {
    variant: { options: ["primary", "secondary"], control: { type: "inline-radio" } },
    label: { type: "string", control: { type: "text" } },
    counter: { name: "counter (empty = none)", control: { type: "text" }, if: { arg: "variant", eq: "primary" } },
    counterIcon: { control: { type: "boolean" }, if: { arg: "variant", eq: "primary" } },
    caption: { control: { type: "text" }, if: { arg: "variant", eq: "primary" } },
    leftSlot: { name: "left slot", options: ["none", "icon", "avatar"], control: { type: "inline-radio" }, if: { arg: "variant", eq: "primary" } },
    rightSlot: { name: "right slot", control: { type: "boolean" } },
    accordion: { control: { type: "boolean" } },
    disabled: { control: { type: "boolean" }, if: { arg: "accordion", eq: true } },
    state: { options: ["default", "hover", "press", "focus"], control: { type: "inline-radio" }, if: { arg: "accordion", eq: true } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

/** The accordion toggles on click (uncontrolled). */
export const Playground: Story = {
  render: ({ variant, label, counter, counterIcon, caption, leftSlot, rightSlot, accordion, disabled, state }) => {
    const common = { label, accordion, disabled, slotRight: rightSlot ? (variant === "primary" ? primaryAction : secondaryAction) : undefined };
    const primaryProps: GroupLabelProps = {
      ...common,
      variant: "primary",
      slotLeft: leftSlots[leftSlot],
      counter: counter === "" ? undefined : counter,
      counterIcon: counterIcon ? "diamonds-4" : undefined,
      caption: caption === "" ? undefined : caption,
    };
    return (
      <div className={PSEUDO_ALL[state]} style={frame}>
        {variant === "primary" ? <GroupLabel {...primaryProps} /> : <GroupLabel variant="secondary" {...common} />}
      </div>
    );
  },
};

/** Primary content combinations. */
export const Primary: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-2)", ...frame }}>
      <GroupLabel label="Label" />
      <GroupLabel label="Label" counter={0} />
      <GroupLabel label="Label" counter={0} counterIcon="diamonds-4" />
      <GroupLabel label="Label" caption="Caption" />
      <GroupLabel label="Label" counter={0} caption="Caption" />
      <GroupLabel label="Label" slotLeft={iconSlot} />
      <GroupLabel label="Label" slotLeft={avatarSlot} />
      <GroupLabel label="Label" slotRight={primaryAction} />
      <GroupLabel label="A very long label that will truncate before the end" counter={12} counterIcon="diamonds-4" caption="Caption" slotLeft={iconSlot} slotRight={primaryAction} />
    </div>
  ),
};

/** Secondary — label + optional IconButton. */
export const Secondary: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-2)", ...frame }}>
      <GroupLabel variant="secondary" label="Label" />
      <GroupLabel variant="secondary" label="Label" slotRight={secondaryAction} />
    </div>
  ),
};

const STATES: { label: string; pseudo?: string; disabled?: boolean }[] = [
  { label: "default" },
  { label: "hover", pseudo: "pseudo-hover-all" },
  { label: "press", pseudo: "pseudo-active-all" },
  { label: "focus", pseudo: "pseudo-focus-visible-all" },
  { label: "disabled", disabled: true },
];

const AccordionGrid = ({ variant }: { variant: Variant }) => (
  <div style={{ display: "grid", gridTemplateColumns: "64px 330px 330px", gap: "var(--size-4)", alignItems: "center" }}>
    <span />
    <span style={cap}>closed</span>
    <span style={cap}>open</span>
    {STATES.map((s) => (
      <Fragment key={s.label}>
        <span style={cap}>{s.label}</span>
        {[false, true].map((isOpen) => (
          <div key={String(isOpen)} className={s.pseudo}>
            {variant === "primary" ? (
              <GroupLabel label="Label" accordion open={isOpen} disabled={s.disabled} />
            ) : (
              <GroupLabel variant="secondary" label="Label" accordion open={isOpen} disabled={s.disabled} />
            )}
          </div>
        ))}
      </Fragment>
    ))}
  </div>
);

/** Primary accordion — leading caret; filled row states. */
export const PrimaryAccordion: Story = {
  parameters: { controls: { disable: true }, layout: "padded" },
  render: () => <AccordionGrid variant="primary" />,
};

/** Secondary accordion — the caret follows the label; copy strengthens on interaction. */
export const SecondaryAccordion: Story = {
  parameters: { controls: { disable: true }, layout: "padded" },
  render: () => <AccordionGrid variant="secondary" />,
};
