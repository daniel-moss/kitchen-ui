import type { Meta, StoryObj } from "@storybook/react";

import ListItem from "./ListItem";
import ListItemSlotIcon from "./ListItemSlotIcon";
import ListItemTextRight from "./ListItemTextRight";
import Avatar from "../Avatar/Avatar";
import AvatarGroup from "../Avatar/AvatarGroup";
import AvatarLabor from "../Avatar/AvatarLabor";
import AvatarUser from "../Avatar/AvatarUser";
import Button from "../Button/Button";
import DateField from "../Fields/DateField/DateField";
import SelectField from "../Fields/SelectField/SelectField";
import TextField from "../Fields/TextField/TextField";
import { Icon } from "../Icon/Icon";
import IconButton from "../IconButton/IconButton";
import TabGroup from "../Tabs/TabGroup";
import TabItem from "../Tabs/TabItem";
import { LINES, docsFrame, noop } from "../../stories/helpers";

import styles from "./ListItem.stories.module.scss";

// `ListItemProps` is a UNION (the variant axes exclude each other), and
// react-docgen cannot read JSDoc off a union — it produced an empty table. So
// the props table is declared here by hand; keep it in step with the JSDoc in
// ListItem.types.ts and the *.types.ts files it extends.
const slot = (summary: string, description: string) => ({
  control: false as const,
  description,
  table: { type: { summary } },
});

const flag = (description: string, defaultValue?: string) => ({
  control: false as const,
  description,
  table: { type: { summary: "boolean" }, ...(defaultValue ? { defaultValue: { summary: defaultValue } } : {}) },
});

const meta: Meta<typeof ListItem> = {
  title: "Components/ListItem/ListItem",
  component: ListItem,
  // fullscreen — `docsFrame` provides the (only) padding; "padded" would stack
  // Storybook's own padding on top of it.
  parameters: { layout: "fullscreen" },
  args: { variant: "titleCaption", title: "Title", caption: "Caption", titleLines: 1, captionLines: 1 },
  argTypes: {
    // ---- text ----
    variant: {
      options: ["title", "titleCaption", "titleCaptionReversed"],
      control: { type: "inline-radio" },
      description: "Text layout: title only, title + caption, or caption above title.",
      table: { type: { summary: '"title" | "titleCaption" | "titleCaptionReversed"' }, defaultValue: { summary: '"title"' } },
    },
    title: {
      control: { type: "text" },
      description: "The title line — `body-500-compact` (Inter Medium 14/20) in `--text-strong`. A string truncates with a full-text hover tooltip; a ReactNode is rendered as-is.",
      table: { type: { summary: "ReactNode" } },
    },
    caption: {
      control: { type: "text" },
      description: "The caption line — `caption-md-400` (Inter Regular 13/20) in `--text-subtle`. Shown for the two caption variants.",
      table: { type: { summary: "ReactNode" } },
    },
    titleLines: {
      options: LINES,
      control: { type: "inline-radio" },
      description: "Title truncation rule: truncate after 1 / 2 / 3 lines, or `\"wrap\"` to never truncate.",
      table: { type: { summary: '1 | 2 | 3 | "wrap"' }, defaultValue: { summary: "1" } },
    },
    captionLines: {
      options: LINES,
      control: { type: "inline-radio" },
      description: "Caption truncation rule — same options as `titleLines`.",
      table: { type: { summary: '1 | 2 | 3 | "wrap"' }, defaultValue: { summary: "1" } },
    },
    titleClassName: slot("string", "Extra class for the title line (e.g. a status color)."),
    captionClassName: slot("string", "Extra class for the caption line (e.g. the warning / error color)."),
    captionSlotLeft: slot("ReactNode", "Left slot on the CAPTION line — an `Icon` for now. Its size, weight and color are the caller's choice; the slot only places the glyph 8px before the caption, top-aligned with its first line."),
    right: slot("ReactNode", "The right text block — a `ListItemTextRight`. Hugs its content and never truncates, so it takes priority over the left text."),

    // ---- slots ----
    avatar: slot("ReactNode", "Left slot — an Avatar (any type). The one strict parameter: the size must be xl (36px)."),
    slotRight: slot("ReactNode", "Right slot — up to 3 instances, 8px apart, centred on the 40px first row: `ListItemSlotIcon`, IconButton, Button (subtle lg), TabGroup (contained lg), a field, AvatarUser (lg) or an AvatarGroup (lg)."),
    slotBottom: slot("ReactNode", "Bottom slot — ONE instance stretched to the full row width, 8px below the body. Mobile-only, and only allowed on a static row (not clickable / draggable / accordion)."),

    // ---- clickable ----
    isClickable: flag("The whole row is a button: hover / press / focus states, and `onClick` fires. Clicks on a real control inside a slot stay in the slot."),
    onClick: slot("(event: MouseEvent<HTMLDivElement>) => void", "Row click handler. Needs `isClickable`."),
    toggle: flag("The row is an on/off switch (`role=\"switch\"`): clicking anywhere flips the ToggleSwitch drawn at the end of the right slot. Needs `isClickable`."),
    checked: flag("Controlled on/off state (`toggle`)."),
    defaultChecked: flag("Uncontrolled initial on/off state (`toggle`).", "false"),
    onCheckedChange: slot("(checked: boolean) => void", "Called with the new on/off state (`toggle`)."),
    toggleDisabled: flag("Dims ONLY the switch and stops the row flipping it — the rest of the row stays alive.", "false"),

    // ---- draggable ----
    isDraggable: flag("Adds the grip handle on the left. ListItem does not reorder anything by itself — the gesture lives in `ItemGroup`."),
    isDragging: flag("The lifted-card look while this row is being dragged.", "false"),

    // ---- accordion ----
    isAccordion: flag("The row becomes a collapsible header (caret + body below a divider). Exclusive with the clickable and draggable axes."),
    open: flag("Controlled open state (`isAccordion`)."),
    defaultOpen: flag("Uncontrolled initial open state (`isAccordion`).", "false"),
    onOpenChange: slot("(open: boolean) => void", "Called with the new open state (`isAccordion`)."),
    children: slot("ReactNode", "The collapsible body content, shown below a divider when open (`isAccordion`)."),

    // ---- shared ----
    disabled: flag("Dimmed and non-interactive. On an accordion it dims the header only, so an open body stays readable.", "false"),
    className: slot("string", "Extra class on the row container."),
  },
};

export default meta;

type Story = StoryObj<typeof ListItem>;

// ---- shared example pieces -------------------------------------------------

const objectAvatar = <Avatar type="object" content="icon" size="xl" />;
const laborAvatar = <AvatarLabor size="xl" />;
const chevron = <ListItemSlotIcon icon="angle-right" />;

// Every Figma Documentation preview stacks its rows 40px apart.
const Stack = ({ children }: { children: React.ReactNode }) => (
  <div style={{ ...docsFrame, display: "flex", flexDirection: "column", gap: "var(--size-10)" }}>{children}</div>
);

const One = ({ children }: { children: React.ReactNode }) => <div style={docsFrame}>{children}</div>;

// Figma's placeholder copy, extended a little: the docs frame is wider than the
// Figma preview, and the string has to actually overflow to show the ellipsis.
const LONG_TITLE = "Very long title which does not fit 1 line of text and is required to be truncated";
const LONG_CAPTION = "Very long caption which does not fit 1 line of text and is required to be truncated";
const BLENDER =
  "The commercial blender in the kitchen is malfunctioning. It makes a loud grinding noise and struggles to blend even soft ingredients.";

const collapsibleBody = (
  <div style={{ padding: "var(--size-3)", font: "var(--font-body-400-compact)", color: "var(--text-subtle)" }}>
    Collapsible body content.
  </div>
);

const noControls = { controls: { disable: true } };

// The pseudo-states addon classes. On the ROW itself for the clickable
// variants (a `-all` wrapper would also mark the slots as hovered and trip the
// row's slot-hover exclusion); on a WRAPPER for the accordion, whose trigger is
// the inner header element.
type StateRow = { title: string; self?: string; wrap?: string; disabled?: boolean; dragging?: boolean };

const CLICK_STATES: StateRow[] = [
  { title: "Default" },
  { title: "Focused", self: "pseudo-focus-visible" },
  { title: "Hovered", self: "pseudo-hover" },
  { title: "Pressed", self: "pseudo-active" },
  { title: "Dragging", dragging: true },
  { title: "Disabled", disabled: true },
];

const ACCORDION_STATES: StateRow[] = [
  { title: "Default" },
  { title: "Focused", wrap: "pseudo-focus-visible-all" },
  { title: "Hovered", wrap: "pseudo-hover-all" },
  { title: "Pressed", wrap: "pseudo-active-all" },
  { title: "Disabled", disabled: true },
];

// ---- playground ------------------------------------------------------------

/** The plain row. Switch the behaviours in the stories below. */
export const Playground: Story = {
  render: (args) => (
    <One>
      <ListItem {...args} avatar={objectAvatar} slotRight={chevron} />
    </One>
  ),
};

// ---- hero + anatomy --------------------------------------------------------

export const Overview: Story = {
  parameters: noControls,
  render: () => (
    <One>
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} slotRight={chevron} isClickable onClick={noop} />
    </One>
  ),
};

export const Anatomy: Story = {
  parameters: noControls,
  render: () => (
    <One>
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} slotRight={chevron} />
    </One>
  ),
};

// ---- content ---------------------------------------------------------------

export const LeftSlot: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="titleCaption" title="Title" caption="Caption" />
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} />
    </Stack>
  ),
};

export const TextVariants: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="title" title="Title" avatar={objectAvatar} />
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} />
      <ListItem variant="titleCaptionReversed" title="Title" caption="Caption" avatar={objectAvatar} />
    </Stack>
  ),
};

export const CaptionSlot: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="titleCaption" title="Title" caption="Caption" />
      <ListItem
        variant="titleCaption"
        title="Title"
        caption="Caption"
        captionSlotLeft={<Icon icon="diamonds-4" size={14} />}
      />
      <ListItem
        variant="titleCaption"
        title="Title"
        caption="Custom caption color, icon color, size, style, container type and rotation"
        captionLines={2}
        captionClassName={styles.errorText}
        captionSlotLeft={<Icon icon="house" pack="solid" size={10} container="square" rotate={180} className={styles.errorText} />}
      />
    </Stack>
  ),
};

export const Truncation: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="title" title={LONG_TITLE} avatar={objectAvatar} />
      <ListItem variant="titleCaption" title={LONG_TITLE} caption={LONG_CAPTION} avatar={objectAvatar} />
      <ListItem variant="titleCaptionReversed" title={LONG_TITLE} caption={LONG_CAPTION} avatar={objectAvatar} />
    </Stack>
  ),
};

/** Live: hover a truncated line — the tooltip follows the cursor. */
export const TruncationTooltip: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="title" title={LONG_TITLE} avatar={objectAvatar} />
      <ListItem variant="titleCaption" title={LONG_TITLE} caption={LONG_CAPTION} avatar={objectAvatar} />
    </Stack>
  ),
};

export const MultiLine: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem
        variant="titleCaption"
        title="Labor name"
        titleLines="wrap"
        caption={BLENDER}
        captionLines={2}
        avatar={laborAvatar}
        slotRight={chevron}
        isDraggable
      />
      <ListItem variant="titleCaption" title="Labor name" titleLines="wrap" caption={BLENDER} captionLines={2} avatar={laborAvatar} slotRight={chevron} isAccordion>
        {collapsibleBody}
      </ListItem>
      <ListItem
        variant="titleCaption"
        title="Labor name"
        titleLines="wrap"
        caption={BLENDER}
        captionLines={2}
        avatar={laborAvatar}
        right={<ListItemTextRight variant="titleCaption" title="$100.00" caption="Caption" />}
        slotRight={chevron}
        isAccordion
      >
        {collapsibleBody}
      </ListItem>
    </Stack>
  ),
};

export const RightText: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} right={<ListItemTextRight variant="title" title="Title" />} />
      <ListItem
        variant="titleCaption"
        title="Title"
        caption="Caption"
        avatar={objectAvatar}
        right={<ListItemTextRight variant="titleCaption" title="Title" caption="Caption" />}
      />
      <ListItem
        variant="titleCaption"
        title="Title"
        caption="Caption"
        avatar={objectAvatar}
        right={<ListItemTextRight variant="titleCaptionReversed" title="Title" caption="Caption" />}
      />
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} right={<ListItemTextRight variant="tag" tag="Tag" />} />
    </Stack>
  ),
};

export const RightTextPriority: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem
        variant="titleCaption"
        title={LONG_TITLE}
        caption={LONG_CAPTION}
        avatar={objectAvatar}
        right={<ListItemTextRight variant="title" title="Takes priority" />}
      />
      <ListItem
        variant="titleCaption"
        title={LONG_TITLE}
        caption={LONG_CAPTION}
        avatar={objectAvatar}
        right={<ListItemTextRight variant="titleCaption" title="Takes priority" caption="Caption" />}
      />
      <ListItem
        variant="titleCaption"
        title={LONG_TITLE}
        caption={LONG_CAPTION}
        avatar={objectAvatar}
        right={<ListItemTextRight variant="titleCaptionReversed" title="Takes priority" caption="Caption" />}
      />
      <ListItem variant="titleCaption" title={LONG_TITLE} caption={LONG_CAPTION} avatar={objectAvatar} right={<ListItemTextRight variant="tag" tag="Takes priority" />} />
    </Stack>
  ),
};

// ---- right elements --------------------------------------------------------

const slotButton = (n: number) => <IconButton key={n} aria-label={`Action ${n}`} variant="ghost" size="md" onClick={noop} />;

export const RightSlots: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} slotRight={slotButton(1)} />
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} slotRight={[1, 2].map(slotButton)} />
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} slotRight={[1, 2, 3].map(slotButton)} />
    </Stack>
  ),
};

export const SlotIcons: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} slotRight={chevron} isClickable onClick={noop} />
      <ListItem
        variant="titleCaption"
        title="Title"
        caption="Caption"
        avatar={objectAvatar}
        slotRight={<ListItemSlotIcon icon="arrow-up-right" />}
        isClickable
        onClick={noop}
      />
    </Stack>
  ),
};

export const SlotButtons: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} slotRight={<IconButton aria-label="Edit" icon="pen" variant="ghost" size="md" onClick={noop} />} />
      <ListItem
        variant="titleCaption"
        title="Title"
        caption="Caption"
        avatar={objectAvatar}
        slotRight={
          <Button variant="subtle" size="lg" onClick={noop}>
            Button
          </Button>
        }
      />
    </Stack>
  ),
};

export const SlotTabGroup: Story = {
  parameters: noControls,
  render: () => (
    <One>
      <ListItem
        variant="titleCaption"
        title="Title"
        caption="Caption"
        avatar={objectAvatar}
        slotRight={
          <TabGroup variant="contained" size="lg" defaultValue="a">
            <TabItem value="a">Tab</TabItem>
            <TabItem value="b">Tab</TabItem>
          </TabGroup>
        }
      />
    </One>
  ),
};

// The input keeps a fixed width in the right slot — the row never stretches it
// (240px, the width of the Figma slot instance).
const fixedInput = (field: React.ReactNode) => <div style={{ width: 240 }}>{field}</div>;

export const SlotInputs: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} slotRight={fixedInput(<TextField defaultValue="Value" />)} />
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} slotRight={fixedInput(<SelectField value="Value" />)} />
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} slotRight={fixedInput(<DateField defaultValue={new Date(2026, 8, 21)} />)} />
    </Stack>
  ),
};

/** Live: click anywhere on a row — the whole row is the switch. */
export const SlotToggle: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} isClickable toggle />
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} isClickable toggle defaultChecked />
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} isClickable toggle defaultChecked slotRight={chevron} />
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} isClickable toggle defaultChecked toggleDisabled />
    </Stack>
  ),
};

export const SlotAvatars: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} slotRight={<AvatarUser size="lg" />} />
      <ListItem
        variant="titleCaption"
        title="Title"
        caption="Caption"
        avatar={objectAvatar}
        slotRight={<AvatarGroup size="lg" items={[{ name: "Avery Diaz" }, { content: "letters", letter: "MK", name: "Mira Kean" }]} />}
      />
    </Stack>
  ),
};

// ---- bottom elements -------------------------------------------------------

const bottomButton = (
  <Button variant="subtle" size="lg" isFullWidth onClick={noop}>
    Button
  </Button>
);

const bottomTabGroup = (
  <TabGroup variant="contained" size="lg" isFullWidth defaultValue="a">
    <TabItem value="a">Tab</TabItem>
    <TabItem value="b">Tab</TabItem>
  </TabGroup>
);

export const BottomSlot: Story = {
  parameters: noControls,
  render: () => (
    <One>
      <ListItem variant="titleCaption" title="Title" caption="Caption" slotBottom={bottomButton} />
    </One>
  ),
};

export const BottomButton: Story = {
  parameters: noControls,
  render: () => (
    <One>
      <ListItem variant="titleCaption" title="Title" caption="Caption" slotBottom={bottomButton} />
    </One>
  ),
};

export const BottomTabGroup: Story = {
  parameters: noControls,
  render: () => (
    <One>
      <ListItem variant="titleCaption" title="Title" caption="Caption" slotBottom={bottomTabGroup} />
    </One>
  ),
};

export const BottomInputs: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="titleCaption" title="Title" caption="Caption" slotBottom={<TextField defaultValue="Value" />} />
      <ListItem variant="titleCaption" title="Title" caption="Caption" slotBottom={<SelectField value="Value" />} />
      <ListItem variant="titleCaption" title="Title" caption="Caption" slotBottom={<DateField defaultValue={new Date(2026, 8, 21)} />} />
    </Stack>
  ),
};

// ---- dragging --------------------------------------------------------------

export const Draggable: Story = {
  parameters: noControls,
  render: () => (
    <One>
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} slotRight={chevron} isDraggable />
    </One>
  ),
};

export const DraggingState: Story = {
  parameters: noControls,
  render: () => (
    <One>
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} slotRight={chevron} isDraggable isDragging />
    </One>
  ),
};

// ---- interactivity ---------------------------------------------------------

export const InteractiveStates: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      {CLICK_STATES.map((s) => (
        <ListItem
          key={s.title}
          className={s.self}
          variant="titleCaption"
          title={s.title}
          caption="Caption"
          avatar={objectAvatar}
          slotRight={chevron}
          isClickable
          isDraggable
          isDragging={s.dragging}
          disabled={s.disabled}
          onClick={noop}
        />
      ))}
    </Stack>
  ),
};

// ---- accordion -------------------------------------------------------------

export const AccordionStates: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      {ACCORDION_STATES.map((s) => (
        <div key={s.title} className={s.wrap}>
          <ListItem variant="titleCaption" title={s.title} caption="Caption" avatar={objectAvatar} slotRight={chevron} isAccordion disabled={s.disabled}>
            {collapsibleBody}
          </ListItem>
        </div>
      ))}
    </Stack>
  ),
};

export const AccordionOpenStates: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      {ACCORDION_STATES.map((s) => (
        <div key={s.title} className={s.wrap}>
          <ListItem variant="titleCaption" title={s.title} caption="Caption" avatar={objectAvatar} slotRight={chevron} isAccordion open disabled={s.disabled}>
            {collapsibleBody}
          </ListItem>
        </div>
      ))}
    </Stack>
  ),
};
