import type { Meta, StoryObj } from "@storybook/react";

import ListItem from "./ListItem";
import { ListItemProps } from "./ListItem.types";
import ListItemSlotIcon from "./ListItemSlotIcon";
import ListItemTextRight from "./ListItemTextRight";
import { ListItemTextLines, ListItemTextVariant } from "./ListItemTextLeft.types";
import Avatar from "../Avatar/Avatar";
import Button from "../Button/Button";
import TabGroup from "../Tabs/TabGroup";
import TabItem from "../Tabs/TabItem";
import SelectField from "../Fields/SelectField/SelectField";
import Toggle from "../Toggle/Toggle";
import { cap, noop, LINES, PSEUDO_ALL } from "../../stories/helpers";

type BottomSlot = "none" | "button" | "tabStack" | "selectInput";
type Behavior = "static" | "clickable" | "toggle" | "draggable" | "clickableDraggable" | "accordion";
type ItemState = "default" | "hover" | "press" | "focus" | "dragging" | "disabled";

type StoryArgs = {
  variant: ListItemTextVariant;
  title: string;
  caption: string;
  titleLines: ListItemTextLines;
  captionLines: ListItemTextLines;
  avatar: boolean;
  bottomSlot: BottomSlot;
  behavior: Behavior;
  state: ItemState;
};


const frame: React.CSSProperties = { width: 420 };

const objectAvatar = <Avatar type="object" content="icon" size="xl" />;

const BOTTOM_SLOTS: Record<Exclude<BottomSlot, "none">, React.ReactNode> = {
  button: (
    <Button variant="subtle" size="lg" isFullWidth onClick={noop}>
      Button
    </Button>
  ),
  tabStack: (
    <TabGroup variant="contained" size="lg" isFullWidth defaultValue="a">
      <TabItem value="a">Tab</TabItem>
      <TabItem value="b">Tab</TabItem>
    </TabGroup>
  ),
  selectInput: <SelectField value="Value" />,
};

const meta: Meta<StoryArgs> = {
  title: "Components/ListItem/ListItem",
  component: ListItem,
  parameters: { layout: "centered" },
  args: { variant: "titleCaption", title: "Title", caption: "Caption", titleLines: 1, captionLines: 1, avatar: true, bottomSlot: "none", behavior: "static", state: "default" },
  argTypes: {
    variant: { name: "text variant", options: ["title", "titleCaption", "titleCaptionReversed"], control: { type: "inline-radio" } },
    title: { type: "string", control: { type: "text" } },
    caption: { type: "string", control: { type: "text" } },
    titleLines: { options: LINES, control: { type: "inline-radio" } },
    captionLines: { options: LINES, control: { type: "inline-radio" } },
    avatar: { control: { type: "boolean" } },
    bottomSlot: { name: "bottom slot", options: ["none", "button", "tabStack", "selectInput"], control: { type: "inline-radio" } },
    behavior: { options: ["static", "clickable", "toggle", "draggable", "clickableDraggable", "accordion"], control: { type: "inline-radio" } },
    state: { options: ["default", "hover", "press", "focus", "dragging", "disabled"], control: { type: "inline-radio" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

/** Pick the behavior: static / clickable / toggle (whole-row switch) / draggable. */
export const Playground: Story = {
  render: ({ variant, title, caption, titleLines, captionLines, avatar, bottomSlot, behavior, state }) => {
    const props = {
      variant,
      title,
      caption,
      titleLines,
      captionLines,
      avatar: avatar ? objectAvatar : undefined,
      slotBottom: bottomSlot === "none" ? undefined : BOTTOM_SLOTS[bottomSlot],
      ...(behavior === "draggable"
        ? { isDraggable: true, isDragging: state === "dragging", disabled: state === "disabled" }
        : behavior === "clickable"
          ? { isClickable: true, onClick: noop, disabled: state === "disabled" }
          : behavior === "toggle"
            ? { isClickable: true, toggle: true, defaultChecked: true, disabled: state === "disabled" }
            : behavior === "clickableDraggable"
              ? { isClickable: true, isDraggable: true, onClick: noop, isDragging: state === "dragging", disabled: state === "disabled" }
              : behavior === "accordion"
                ? { isAccordion: true, defaultOpen: true, disabled: state === "disabled", children: accordionContent }
                : {}),
    } as ListItemProps;
    return (
      <div
        className={behavior === "clickable" || behavior === "toggle" || behavior === "clickableDraggable" || behavior === "accordion" ? PSEUDO_ALL[state] : undefined}
        style={frame}
      >
        <ListItem {...props} />
      </div>
    );
  },
};

// The pseudo class goes on the item itself — `pseudo-*-all` would also mark
// the slot wrapper as hovered and trip the slot-hover exclusion.
const CLICK_STATES: { label: ItemState; pseudo?: string; disabled?: boolean }[] = [
  { label: "default" },
  { label: "hover", pseudo: "pseudo-hover" },
  { label: "press", pseudo: "pseudo-active" },
  { label: "focus", pseudo: "pseudo-focus-visible" },
  { label: "disabled", disabled: true },
];

/** Clickable (non-draggable) — the row is a button; slot clicks don't trigger it. */
export const Clickable: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-5)", ...frame }}>
      {CLICK_STATES.map((s) => (
        <div key={s.label}>
          <span style={cap}>{s.label}</span>
          <ListItem
            className={s.pseudo}
            variant="titleCaption"
            title="Title"
            caption="Caption"
            avatar={objectAvatar}
            slotRight={<ListItemSlotIcon icon="angle-right" />}
            isClickable
            disabled={s.disabled}
            onClick={noop}
          />
        </div>
      ))}
    </div>
  ),
};

// Sample collapsible content for the accordion stories.
const accordionContent = (
  <div style={{ padding: "var(--size-3)", font: "var(--font-body-400-compact)", color: "var(--text-subtle)" }}>
    Collapsible body content.
  </div>
);

/** Accordion — a collapsible header + body below a divider. Click to toggle. */
export const Accordion: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-5)", ...frame }}>
      <div>
        <span style={cap}>interactive (click the header)</span>
        <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} isAccordion defaultOpen>
          {accordionContent}
        </ListItem>
      </div>
      {CLICK_STATES.map((s) => (
        <div key={s.label}>
          <span style={cap}>{s.label} · closed</span>
          <div className={s.pseudo ? `${s.pseudo}-all` : undefined}>
            <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} isAccordion disabled={s.disabled}>
              {accordionContent}
            </ListItem>
          </div>
        </div>
      ))}
      {CLICK_STATES.map((s) => (
        <div key={`${s.label}-open`}>
          <span style={cap}>{s.label} · open</span>
          <div className={s.pseudo ? `${s.pseudo}-all` : undefined}>
            <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} isAccordion open disabled={s.disabled}>
              {accordionContent}
            </ListItem>
          </div>
        </div>
      ))}
    </div>
  ),
};

/** Clickable + draggable — both behaviors combined. */
export const ClickableDraggable: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-5)", ...frame }}>
      {[...CLICK_STATES, { label: "dragging" as ItemState, dragging: true }].map((s: { label: ItemState; pseudo?: string; disabled?: boolean; dragging?: boolean }) => (
        <div key={s.label}>
          <span style={cap}>{s.label}</span>
          <ListItem
            className={s.pseudo}
            variant="titleCaption"
            title="Title"
            caption="Caption"
            avatar={objectAvatar}
            slotRight={<ListItemSlotIcon icon="angle-right" />}
            isClickable
            isDraggable
            isDragging={s.dragging}
            disabled={s.disabled}
            onClick={noop}
          />
        </div>
      ))}
    </div>
  ),
};

/** Toggle — the whole row is the switch: click anywhere to flip it. */
export const ToggleRow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-5)", ...frame }}>
      <ListItem variant="titleCaption" title="Notifications" caption="Get notified about job updates" avatar={objectAvatar} isClickable toggle defaultChecked />
      <ListItem variant="title" title="Auto-assign" isClickable toggle />
    </div>
  ),
};

/** Draggable (non-clickable) — grip handle; dragging lifts the row into a card. */
export const Draggable: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-5)", ...frame }}>
      {(["default", "dragging", "disabled"] as const).map((state) => (
        <div key={state}>
          <span style={cap}>{state}</span>
          <ListItem
            variant="titleCaption"
            title="Title"
            caption="Caption"
            avatar={objectAvatar}
            isDraggable
            isDragging={state === "dragging"}
            disabled={state === "disabled"}
          />
        </div>
      ))}
    </div>
  ),
};

/** The bottom slot — one instance, stretched to the full row width. */
export const BottomSlot: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-5)", ...frame }}>
      {(Object.keys(BOTTOM_SLOTS) as Exclude<BottomSlot, "none">[]).map((key) => (
        <div key={key}>
          <span style={cap}>{key}</span>
          <ListItem variant="titleCaption" title="Title" caption="Caption" slotBottom={BOTTOM_SLOTS[key]} />
        </div>
      ))}
    </div>
  ),
};

/** Body features still compose: avatar, right text, right slot instances. */
export const Composition: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-5)", ...frame }}>
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} slotRight={<ListItemSlotIcon icon="angle-right" />} />
      <ListItem
        variant="titleCaption"
        title="Title"
        caption="Caption"
        avatar={objectAvatar}
        right={<ListItemTextRight variant="tag" tag="Sep 21" />}
        slotRight={<Toggle defaultChecked aria-label="Enable" />}
        slotBottom={
          <Button variant="subtle" size="lg" isFullWidth onClick={noop}>
            Button
          </Button>
        }
      />
    </div>
  ),
};
