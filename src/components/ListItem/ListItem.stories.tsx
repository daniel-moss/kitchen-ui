import type { Meta, StoryObj } from "@storybook/react";

import ListItem from "./ListItem";
import ListItemSlotIcon from "./ListItemSlotIcon";
import ListItemSlotProgress from "./ListItemSlotProgress";
import ItemTextBlock from "../ItemText/ItemText/ItemTextBlock";
import ItemValue from "../ItemText/ItemValue/ItemValue";
import ValueDisplay from "../ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../ValueDisplay/ValueDisplayGroup";
import Avatar from "../Avatar/Avatar";
import AvatarClient from "../Avatar/AvatarClient";
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
  args: { variant: "titleCaption", title: "Title", caption: "Caption", titleLines: 1, captionLines: 1, isClickable: true, onClick: noop },
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
    captionPlaceholder: {
      control: { type: "text" },
      description:
        "What the caption line shows when `caption` has no value — \"No Location name\", \"No End date\". One token dimmer (`--text-placeholder`), the copy doc's standard empty behaviour. With neither, the caption line renders nothing.",
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
    captionSlotLeft: slot("ReactNode", "Left slot on the CAPTION line — an `Icon` for now. Its size, weight and color are the caller's choice; the slot only places the glyph 8px before the caption, in a 20px box centered on the line."),
    right: slot("ReactNode", "The right text block — an `ItemTextBlock` with `align=\"right\"`. Hugs its content and never truncates, so it takes priority over the left text."),

    // ---- slots ----
    avatar: slot("ReactNode", "Left slot — an Avatar (any type). The one strict parameter: the size must be xl (36px)."),
    slotRight: slot("ReactNode", "Right slot — up to 3 instances, 8px apart, centered on the 40px first row: `ListItemSlotIcon`, IconButton, Button (subtle lg), TabGroup (contained lg), a field, AvatarUser (lg) or an AvatarGroup (lg)."),
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
    size: {
      options: ["default", "compact"],
      control: { type: "inline-radio" },
      description:
        "Row height. `default` (60px) is 10px padding over a 40px body; `compact` (40px) drops the vertical padding so a 32px IconButton or a 22px Toggle still fits. Compact is for ONE line — no caption, no avatar.",
      table: { type: { summary: '"default" | "compact"' }, defaultValue: { summary: '"default"' } },
    },
    disabled: flag("Dimmed and non-interactive. On an accordion it dims the header only, so an open body stays readable.", "false"),
    isLoading: flag(
      "The text lines become bars and the row hides its grip, caret, right slot and bottom slot, then stops responding. Combines with every other prop — a list renders the same row and drives this from its query. The avatar is left exactly as passed.",
      "false",
    ),
    className: slot("string", "Extra class on the row container."),
  },
};

export default meta;

type Story = StoryObj<typeof ListItem>;

// ---- shared example pieces -------------------------------------------------

const objectAvatar = <Avatar shape="square" content="icon" size="xl" />;
const laborAvatar = <AvatarLabor size="xl" />;
const chevron = <ListItemSlotIcon icon="angle-right" />;

// Every Figma Documentation preview stacks its rows 80px apart.
const Stack = ({ children }: { children: React.ReactNode }) => (
  <div style={{ ...docsFrame, display: "flex", flexDirection: "column", gap: "var(--size-20)" }}>{children}</div>
);

const One = ({ children }: { children: React.ReactNode }) => <div style={docsFrame}>{children}</div>;

// Figma's placeholder copy, extended a little: the docs frame is wider than the
// Figma preview, and the string has to actually overflow to show the ellipsis.
const LONG_TITLE = "Very long title which does not fit 1 line of text and is required to be truncated";
const LONG_CAPTION = "Very long caption which does not fit 1 line of text and is required to be truncated";
const BLENDER =
  "The commercial blender in the kitchen is malfunctioning. It makes a loud grinding noise and struggles to blend even soft ingredients.";

const collapsibleBody = (
  <div style={{ font: "var(--font-body-400-compact)", color: "var(--text-subtle)" }}>Collapsible body content.</div>
);

const noControls = { controls: { disable: true } };

// The pseudo-states addon classes. On the ROW itself for the clickable
// variants (a `-all` wrapper would also mark the slots as hovered and trip the
// row's slot-hover exclusion); on a WRAPPER for the accordion, whose trigger is
// the inner header element.
type StateRow = { title: string; self?: string; wrap?: string; disabled?: boolean; dragging?: boolean };

const CLICK_STATES: StateRow[] = [
  { title: "Hovered", self: "pseudo-hover" },
  { title: "Pressed", self: "pseudo-active" },
  { title: "Focused", self: "pseudo-focus-visible" },
  { title: "Disabled", disabled: true },
];

const ACCORDION_STATES: StateRow[] = [
  { title: "Hovered", wrap: "pseudo-hover-all" },
  { title: "Pressed", wrap: "pseudo-active-all" },
  { title: "Focused", wrap: "pseudo-focus-visible-all" },
  { title: "Disabled", wrap: "", disabled: true },
];

// ---- playground ------------------------------------------------------------

/** The plain row. Switch the behaviors in the stories below. */
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
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} />
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




/** Live: hover a truncated line — the tooltip follows the cursor. */

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
        isDraggable
      />
      <ListItem variant="titleCaption" title="Labor name" titleLines="wrap" caption={BLENDER} captionLines={2} avatar={laborAvatar} isAccordion>
        {collapsibleBody}
      </ListItem>
      <ListItem
        variant="titleCaption"
        title="Labor name"
        titleLines="wrap"
        caption={BLENDER}
        captionLines={2}
        avatar={laborAvatar}
        right={<ItemTextBlock align="right" variant="titleCaption" title="$100.00" caption="Caption" />}
        isAccordion
      >
        {collapsibleBody}
      </ListItem>
    </Stack>
  ),
};



// ---- right elements --------------------------------------------------------

const slotButton = (n: number) => <IconButton key={n} aria-label={`Action ${n}`} variant="ghost" size="md" onClick={noop} />;

const slotTabGroup = (
  <TabGroup variant="contained" size="lg" defaultValue="a">
    <TabItem value="a">Tab</TabItem>
    <TabItem value="b">Tab</TabItem>
  </TabGroup>
);

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

// Slot 1 sits at the row's edge; a second slot is inserted to its LEFT, so the
// first element never moves.
export const SlotOrder: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} slotRight={slotButton(1)} />
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} slotRight={[1, 2].map(slotButton)} />
    </Stack>
  ),
};

// Every instance a slot accepts, in the order the Figma doc lists them.
export const SlotInstances: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="titleCaption" title="Avatar" caption="Caption" avatar={objectAvatar} slotRight={<AvatarUser size="lg" />} />
      <ListItem
        variant="titleCaption"
        title="AvatarGroup"
        caption="Caption"
        avatar={objectAvatar}
        slotRight={<AvatarGroup size="lg" items={[{ name: "Avery Diaz" }, { content: "letters", characters: "MK", name: "Mira Kean" }]} />}
      />
      <ListItem
        variant="titleCaption"
        title="Button"
        caption="Caption"
        avatar={objectAvatar}
        slotRight={
          <Button variant="subtle" size="lg" onClick={noop}>
            Button
          </Button>
        }
      />
      <ListItem variant="titleCaption" title="IconButton" caption="Caption" avatar={objectAvatar} slotRight={slotButton(1)} />
      <ListItem variant="titleCaption" title="Input — text" caption="Caption" avatar={objectAvatar} slotRight={<TextField defaultValue="Value" />} />
      <ListItem
        variant="titleCaption"
        title="Input — date"
        caption="Caption"
        avatar={objectAvatar}
        slotRight={<DateField defaultValue={new Date(2026, 8, 21)} />}
      />
      <ListItem variant="titleCaption" title="ItemValue" caption="Caption" avatar={objectAvatar} slotRight={<ItemValue value="Value" />} isClickable onClick={noop} />
      <ListItem variant="titleCaption" title="Open chevron" caption="Caption" avatar={objectAvatar} slotRight={chevron} isClickable onClick={noop} />
      <ListItem
        variant="titleCaption"
        title="Open in a new tab"
        caption="Caption"
        avatar={objectAvatar}
        slotRight={<ListItemSlotIcon icon="arrow-up-right" />}
        isClickable
        onClick={noop}
      />
      <ListItem
        variant="titleCaption"
        title="ProgressRing"
        caption="Caption"
        avatar={objectAvatar}
        slotRight={<ListItemSlotProgress value={50} ariaLabel="Upload progress" />}
      />
      <ListItem variant="titleCaption" title="TabGroup" caption="Caption" avatar={objectAvatar} slotRight={slotTabGroup} />
      <ListItem variant="titleCaption" title="Toggle" caption="Caption" avatar={objectAvatar} isClickable toggle defaultChecked />
    </Stack>
  ),
};

// The row's own affordance: where it goes, and whether it leaves the page.
export const SlotAffordance: Story = {
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

// An editable value goes in the SLOT as an ItemValue; a read-only one is a tag
// in the right text block.
export const SlotItemValue: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} slotRight={<ItemValue value="Value" />} isClickable onClick={noop} />
      <ListItem
        variant="titleCaption"
        title="Title"
        caption="Caption"
        avatar={objectAvatar}
        right={<ItemTextBlock align="right" variant="tag" tag="Value" />}
        slotRight={chevron}
        isClickable
        onClick={noop}
      />
    </Stack>
  ),
};



// The input keeps a fixed width in the right slot — the row never stretches it
// (240px, the width of the Figma slot instance).
const fixedInput = (field: React.ReactNode) => <div style={{ width: 240 }}>{field}</div>;


/** Live: click anywhere on a row — the whole row is the switch. */


/**
 * A progress ring in the right slot — the upload case from the design: the
 * file's avatar and size, with the ring showing how far the upload has gone.
 */

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


export const BottomInstances: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="titleCaption" title="Title" caption="Caption" slotBottom={bottomButton} />
      <ListItem variant="titleCaption" title="Title" caption="Caption" slotBottom={<TextField defaultValue="Value" />} />
      <ListItem variant="titleCaption" title="Title" caption="Caption" slotBottom={<SelectField value="Value" />} />
      <ListItem variant="titleCaption" title="Title" caption="Caption" slotBottom={<DateField defaultValue={new Date(2026, 8, 21)} />} />
      <ListItem variant="titleCaption" title="Title" caption="Caption" slotBottom={bottomTabGroup} />
    </Stack>
  ),
};



// ---- dragging --------------------------------------------------------------

export const DragStates: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} isDraggable />
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} isDraggable isDragging />
    </Stack>
  ),
};


// ---- interactivity ---------------------------------------------------------

// Board 1 — isClickable = true.
export const ClickableStates: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      {CLICK_STATES.map((st) => (
        <ListItem
          key={st.title}
          className={st.self}
          variant="titleCaption"
          title={st.title}
          caption="Caption"
          avatar={objectAvatar}
          slotRight={chevron}
          isClickable
          disabled={st.disabled}
          onClick={noop}
        />
      ))}
    </Stack>
  ),
};

// Board 2 — isClickable = true, isDraggable = true. The grip is the only
// difference: a draggable row still takes the same row states.
export const ClickableDraggableStates: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      {CLICK_STATES.map((st) => (
        <ListItem
          key={st.title}
          className={st.self}
          variant="titleCaption"
          title={st.title}
          caption="Caption"
          avatar={objectAvatar}
          slotRight={chevron}
          isClickable
          isDraggable
          disabled={st.disabled}
          onClick={noop}
        />
      ))}
    </Stack>
  ),
};

// A static row has no states at all — nothing happens on hover or press.
export const StaticNoStates: Story = {
  parameters: noControls,
  render: () => (
    <One>
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} />
    </One>
  ),
};

// Controls keep their own clicks: the right slot's IconButton and the bottom
// slot's Button act on themselves, not on the row.
export const SlotClicks: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem
        variant="titleCaption"
        title="Title"
        caption="Caption"
        avatar={objectAvatar}
        slotRight={<IconButton icon="ellipsis" variant="ghost" size="lg" aria-label="More" onClick={noop} />}
        isClickable
        onClick={noop}
      />
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} slotBottom={bottomButton} />
    </Stack>
  ),
};

// ---- accordion -------------------------------------------------------------

export const AccordionSizes: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} isAccordion>
        {collapsibleBody}
      </ListItem>
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} isAccordion open>
        {collapsibleBody}
      </ListItem>
      <ListItem variant="title" title="Title" size="compact" isAccordion>
        {collapsibleBody}
      </ListItem>
      <ListItem variant="title" title="Title" size="compact" isAccordion open>
        {collapsibleBody}
      </ListItem>
    </Stack>
  ),
};

// The body is a free slot — any content, 12px padding, the row grows to fit.
export const AccordionBody: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} isAccordion open>
        {collapsibleBody}
      </ListItem>
      <ListItem variant="title" title="Title" size="compact" isAccordion open>
        <ValueDisplayGroup>
          <ValueDisplay label="Model" value="CoolTech 5000" />
          <ValueDisplay label="Serial number" value="CT5000-88213" />
        </ValueDisplayGroup>
      </ListItem>
    </Stack>
  ),
};

export const AccordionStates: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      {ACCORDION_STATES.map((s) => (
        <div key={s.title} className={s.wrap}>
          <ListItem variant="titleCaption" title={s.title} caption="Caption" avatar={objectAvatar} isAccordion disabled={s.disabled}>
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
          <ListItem variant="titleCaption" title={s.title} caption="Caption" avatar={objectAvatar} isAccordion open disabled={s.disabled}>
            {collapsibleBody}
          </ListItem>
        </div>
      ))}
    </Stack>
  ),
};

// ---- Loading -----------------------------------------------------------------

export const Loading: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={<Avatar shape="square" size="xl" isLoading />} isLoading />
      <ListItem variant="title" title="Title" size="compact" isLoading />
    </Stack>
  ),
};

// The grip, the caret, the right slot and the bottom slot are all passed here
// and none of them render: a loading row is the same row in every variant.
export const LoadingHidesControls: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem
        variant="titleCaption"
        title="Draggable + clickable, with a right slot"
        caption="Caption"
        avatar={<Avatar shape="square" size="xl" isLoading />}
        slotRight={chevron}
        isClickable
        onClick={noop}
        isDraggable
        isLoading
      />
    </Stack>
  ),
};

// A list of one kind knows its object type before the data arrives, so the
// avatar is real — only the text is unknown. See AvatarClient's doc page.
export const LoadingKnownObjectType: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={<Avatar shape="square" size="xl" isLoading />} isLoading />
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={<AvatarClient type="generic" size="xl" />} isLoading />
    </Stack>
  ),
};

// No avatar, and a right block — the loading row draws whatever layout the
// loaded row will use.
export const LoadingLayouts: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem
        variant="titleCaption"
        title="Title"
        caption="Caption"
        right={<ItemTextBlock align="right" variant="title" title="Value" />}
        isLoading
      />
    </Stack>
  ),
};

export const LoadingList: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      {[0, 1, 2, 3].map((i) => (
        <ListItem key={i} variant="titleCaption" title="Title" caption="Caption" avatar={<AvatarClient type="generic" size="xl" />} isLoading />
      ))}
    </Stack>
  ),
};

// ---- Size --------------------------------------------------------------------

/** Default (60px) beside compact (40px) — the same row, minus the vertical padding. */
export const Sizes: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="titleCaption" title="Default" caption="Caption" avatar={objectAvatar} isDraggable />
      <ListItem variant="title" title="Compact" size="compact" isDraggable />
    </Stack>
  ),
};

// Compact exists for rows whose right slot holds a control: at 40px with no
// vertical padding, a 32px IconButton and a 22px Toggle both still fit.
export const CompactControls: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="title" title="Sort by" size="compact" slotRight={<IconButton icon="arrow-down-short-wide" variant="ghost" size="md" aria-label="Sort order" />} />
      <ListItem variant="title" title="Show archived" size="compact" isClickable toggle onClick={noop} />
    </Stack>
  ),
};

// Anatomy, second preview: the optional grip and caret, 12px from the body.
export const AnatomyGripCaret: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} isDraggable />
      <ListItem variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} isAccordion>
        {collapsibleBody}
      </ListItem>
    </Stack>
  ),
};
