import { Fragment } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import SelectListItem from "./SelectListItem";
import { SelectListItemProps } from "./SelectListItem.types";
import { Icon } from "../Icon/Icon";
import Avatar from "../Avatar/Avatar";
import { cap, noop, PSEUDO_ALL } from "../../stories/helpers";

type Variant = "default" | "object";
type LeftSlot = "none" | "icon" | "avatar";
type Extra = "none" | "caption" | "tag";
type StateOption = "default" | "hover" | "press" | "focus";
type SelectMode = "single" | "multi" | "counter";

type StoryArgs = {
  variant: Variant;
  label: string;
  extra: Extra;
  extraText: string;
  leftSlot: LeftSlot;
  select: SelectMode;
  selected: boolean;
  count: number;
  disabled: boolean;
  state: StateOption;
};

const frame: React.CSSProperties = { width: 367 };

const iconSlot = <Icon icon="diamonds-4" pack="regular" size={14} container="square" />;
const avatarSlot = <Avatar type="user" content="image" size="xs" />;
const objectAvatar = <Avatar type="object" content="image" size="xl" />;
const leftSlots: Record<LeftSlot, React.ReactNode> = { none: undefined, icon: iconSlot, avatar: avatarSlot };

// caption / tag are mutually exclusive — build the right prop.
const extraProps = (extra: Extra, text: string): SelectListItemProps =>
  extra === "caption" ? { caption: text } : extra === "tag" ? { tag: text } : {};

const meta: Meta<StoryArgs> = {
  title: "Components/SelectList/SelectListItem",
  component: SelectListItem,
  parameters: { layout: "centered" },
  args: { variant: "default", label: "Option", extra: "none", extraText: "Caption", leftSlot: "none", select: "single", selected: false, count: 1, disabled: false, state: "default" },
  argTypes: {
    variant: { options: ["default", "object"], control: { type: "inline-radio" } },
    label: { type: "string", control: { type: "text" } },
    extra: { options: ["none", "caption", "tag"], control: { type: "inline-radio" }, if: { arg: "variant", eq: "default" } },
    extraText: { name: "caption / tag text", control: { type: "text" } },
    leftSlot: { name: "left slot", options: ["none", "icon", "avatar"], control: { type: "inline-radio" }, if: { arg: "variant", eq: "default" } },
    select: { options: ["single", "multi", "counter"], control: { type: "inline-radio" } },
    selected: { control: { type: "boolean" } },
    count: { control: { type: "number", min: 0 }, if: { arg: "select", eq: "counter" } },
    disabled: { control: { type: "boolean" } },
    state: { options: ["default", "hover", "press", "focus"], control: { type: "inline-radio" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  render: ({ variant, label, extra, extraText, leftSlot, select, selected, count, disabled, state }) => {
    const common = { variant, label, disabled, onClick: noop };
    return (
      <div className={PSEUDO_ALL[state]} style={frame}>
        {select === "counter" ? (
          // counter: no static tag; caption on the object variant only.
          variant === "object" ? (
            <SelectListItem {...common} select="counter" count={count} onDecrement={noop} avatar={objectAvatar} caption={extraText || "Caption"} />
          ) : (
            <SelectListItem {...common} select="counter" count={count} onDecrement={noop} slotLeft={leftSlots[leftSlot]} />
          )
        ) : variant === "object" ? (
          // object always has an avatar and a title + caption.
          <SelectListItem {...common} select={select} selected={selected} avatar={objectAvatar} caption={extraText || "Caption"} />
        ) : (
          <SelectListItem {...common} select={select} selected={selected} {...extraProps(extra, extraText)} slotLeft={leftSlots[leftSlot]} />
        )}
      </div>
    );
  },
};

// The full state matrix — states (rows) × select mode × unselected/selected (cols).
const COLS: { label: string; select: SelectMode; selected: boolean }[] = [
  { label: "single", select: "single", selected: false },
  { label: "single · selected", select: "single", selected: true },
  { label: "multi", select: "multi", selected: false },
  { label: "multi · selected", select: "multi", selected: true },
  { label: "counter", select: "counter", selected: false },
  { label: "counter · selected", select: "counter", selected: true },
];
// A matrix cell: counter columns derive selection from the count.
const matrixItem = (c: (typeof COLS)[number], disabled: boolean | undefined, objectProps?: object) =>
  c.select === "counter" ? (
    <SelectListItem label={objectProps != null ? "Title" : "Option"} select="counter" count={c.selected ? 1 : 0} onDecrement={noop} disabled={disabled} onClick={noop} {...objectProps} />
  ) : (
    <SelectListItem label={objectProps != null ? "Title" : "Option"} select={c.select} selected={c.selected} disabled={disabled} onClick={noop} {...objectProps} />
  );
const STATES: { label: string; pseudo?: string; disabled?: boolean }[] = [
  { label: "default" },
  { label: "hover", pseudo: "pseudo-hover-all" },
  { label: "press", pseudo: "pseudo-active-all" },
  { label: "focus", pseudo: "pseudo-focus-visible-all" },
  { label: "disabled", disabled: true },
];

export const Overview: Story = {
  parameters: { controls: { disable: true }, layout: "padded" },
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "64px repeat(6, 200px)", gap: "var(--size-3)", alignItems: "center" }}>
      <span />
      {COLS.map((c) => (
        <span key={c.label} style={cap}>
          {c.label}
        </span>
      ))}
      {STATES.map((s) => (
        <Fragment key={s.label}>
          <span style={cap}>{s.label}</span>
          {COLS.map((c) => (
            <div key={c.label} className={s.pseudo}>
              {matrixItem(c, s.disabled)}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  ),
};

/** Object variant — always an avatar + title (medium) and caption. */
export const Object: Story = {
  parameters: { controls: { disable: true }, layout: "padded" },
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "64px repeat(6, 240px)", gap: "var(--size-3)", alignItems: "center" }}>
      <span />
      {COLS.map((c) => (
        <span key={c.label} style={cap}>
          {c.label}
        </span>
      ))}
      {STATES.map((s) => (
        <Fragment key={s.label}>
          <span style={cap}>{s.label}</span>
          {COLS.map((c) => (
            <div key={c.label} className={s.pseudo}>
              {matrixItem(c, s.disabled, { variant: "object", avatar: objectAvatar, caption: "Caption" })}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  ),
};

/** Copy + slot combinations. */
export const Content: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-2)", ...frame }}>
      <SelectListItem label="Option" onClick={noop} />
      <SelectListItem label="Option" caption="Caption" onClick={noop} />
      <SelectListItem label="Option" tag="Tag" onClick={noop} />
      <SelectListItem label="Option" slotLeft={iconSlot} onClick={noop} />
      <SelectListItem label="Option" slotLeft={avatarSlot} caption="Caption" onClick={noop} />
      <SelectListItem label="Option" slotLeft={iconSlot} multiSelect selected onClick={noop} />
      <SelectListItem label="A very long option name that will truncate before the end" tag="Tag" selected onClick={noop} />
      <SelectListItem label="Counter option" select="counter" count={2} onDecrement={noop} onClick={noop} />
    </div>
  ),
};

/** Object right copy block — title / titleCaption / reversed / tag (Figma "Copy Slot Right"). */
export const ObjectRightBlock: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-2)", width: 367 }}>
      <SelectListItem variant="object" avatar={objectAvatar} label="Title" caption="Caption" rightTitle="Title" onClick={noop} />
      <SelectListItem variant="object" avatar={objectAvatar} label="Title" caption="Caption" rightTitle="Title" rightCaption="Caption" onClick={noop} />
      <SelectListItem variant="object" avatar={objectAvatar} label="Title" caption="Caption" rightTitle="Title" rightCaption="Caption" rightReversed onClick={noop} />
      <SelectListItem variant="object" avatar={objectAvatar} label="Title" caption="Caption" tag="Tag" onClick={noop} />
      <SelectListItem variant="object" avatar={objectAvatar} label="Caption first" caption="Caption" reversed onClick={noop} />
      <SelectListItem variant="object" avatar={objectAvatar} label="Counter object" caption="Caption" select="counter" count={1} onDecrement={noop} onClick={noop} />
    </div>
  ),
};
