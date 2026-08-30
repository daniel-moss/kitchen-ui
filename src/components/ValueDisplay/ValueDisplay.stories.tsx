import type { Meta, StoryObj } from "@storybook/react";

import { AvatarGroupItem } from "../Avatar/AvatarGroup.types";
import AvatarLocation from "../Avatar/AvatarLocation";
import AvatarUser from "../Avatar/AvatarUser";
import Badge from "../Badge/Badge";
import BadgeJobStatus from "../Badge/BadgeJobStatus";
import CardFile from "../Card/CardFile";
import { Icon } from "../Icon/Icon";
import IconButton from "../IconButton/IconButton";
import LinkButton from "../LinkButton/LinkButton";
import ListItem from "../ListItem/ListItem";
import ListItemSlotIcon from "../ListItem/ListItemSlotIcon";
import { docsFrame, noop } from "../../stories/helpers";
import ValueDisplay from "./ValueDisplay";

// `ValueDisplayProps` is a UNION (one member per orientation × kind), and
// react-docgen cannot read JSDoc off a union — it renders an empty table. So
// the props table is declared here by hand; keep it in step with the JSDoc in
// ValueDisplay.types.ts.
const slot = (summary: string, description: string, defaultValue?: string) => ({
  control: false as const,
  description,
  table: { type: { summary }, ...(defaultValue ? { defaultValue: { summary: defaultValue } } : {}) },
});

const meta: Meta<typeof ValueDisplay> = {
  title: "Components/ValueDisplay/ValueDisplay",
  component: ValueDisplay,
  // fullscreen — `docsFrame` provides the (only) padding; "padded" would stack
  // Storybook's own padding on top of it.
  parameters: { layout: "fullscreen" },
  args: { label: "Label", value: "Value" },
  argTypes: {
    // ---- shared ----
    label: {
      control: { type: "text" },
      description:
        "The label — `body-400-compact` in `--text-subtle`. It never truncates: it wraps. It also builds the empty placeholder, so write it as normal copy.",
      table: { type: { summary: "string" } },
    },
    orientation: {
      options: ["horizontal", "vertical"],
      control: { type: "inline-radio" },
      description:
        "`horizontal` puts the label in a fixed 120px column beside the value; `vertical` stacks the label above it. The orientation decides which value kinds are available.",
      table: { type: { summary: '"horizontal" | "vertical"' }, defaultValue: { summary: '"horizontal"' } },
    },
    kind: {
      options: ["text", "badge", "linkButton", "shortText", "longText", "avatarStack", "files", "objectCard"],
      control: { type: "select" },
      description:
        "What the value holds. Horizontal: `text` / `badge` / `linkButton`. Vertical: `shortText` / `longText` / `avatarStack` / `files` / `objectCard`.",
      table: {
        type: { summary: '"text" | "badge" | "linkButton" | "shortText" | "longText" | "avatarStack" | "files" | "objectCard"' },
        defaultValue: { summary: '"text" (horizontal) / "longText" (vertical)' },
      },
    },
    emptyText: slot("string", 'Overrides the empty placeholder. Default: "No " + the label with an uppercase first letter.'),
    isLoading: slot("boolean", "Loading: the label stays and the value is replaced by skeletons. Each kind has its own skeleton shape.", "false"),
    className: slot("string", "Extra class on the pair container."),

    // ---- text (horizontal) / shortText + longText (vertical) ----
    value: {
      control: { type: "text" },
      description: "The text value. Empty or undefined renders the placeholder.",
      table: { type: { summary: "string" } },
    },
    valueColor: slot("string", "Value text color — any CSS color, normally a token (`var(--text-success)`). Text kinds only."),
    slotLeft: slot(
      "ReactNode",
      "Left slot before the text — an `Icon` (all its parameters are yours) or an avatar (the size is fixed at xs / 20px). 8px before the text. Horizontal `text` and vertical `shortText` only.",
    ),
    isWarning: slot(
      "boolean",
      "Warning look: `--text-warning` text plus an amber warning icon pinned to the right edge of the value. Horizontal `text` only.",
      "false",
    ),
    lineLimit: slot(
      "number | boolean",
      'Clamps `longText` and adds "Show more" / "Show less". Off by default (the text wraps freely). `true` uses the standard 4 lines; a number sets your own.',
    ),

    // ---- badge / linkButton ----
    badge: slot("ReactNode", "The badge element — Badge, BadgeColor, an object status badge. The size is fixed at md. `kind=\"badge\"`."),
    link: slot("ReactNode", 'The LinkButton element. `kind="linkButton"`.'),

    // ---- avatarStack ----
    items: slot("AvatarGroupItem[]", 'The users of the avatar stack. `kind="avatarStack"`.'),
    avatarLimit: slot(
      "number | boolean",
      'How many avatars show before the "+N" row. Defaults to 3; `false` shows every avatar; a number sets your own limit.',
      "3",
    ),

    // ---- files ----
    files: slot("ReactNode", 'The file cards — `CardFile` elements. Each fills its grid column (106–184px). `kind="files"`.'),
    loadingCount: slot("number", "How many skeleton cards the files loading state shows.", "1"),

    // ---- objectCard ----
    card: slot("ReactNode", 'The card content — one `ListItem`. ValueDisplay wraps it in the `Card`. `kind="objectCard"`.'),

    // ---- slotRight ----
    slotRight: slot("ReactNode", "One IconButton (lg — 36px) after the value. Horizontal only."),
  },
};
export default meta;

type Story = StoryObj<typeof ValueDisplay>;

// ---- shared example data ---------------------------------------------------

const LONG_TEXT =
  "The product team convened late in the afternoon to review the latest iteration of the interface, focusing on clarity, consistency, and the cumulative impact of small interaction decisions. What initially appeared to be minor adjustments—spacing between elements, wording of helper text, timing of system feedback—gradually revealed themselves as critical factors in user confidence and task completion.";

const USERS: AvatarGroupItem[] = [
  { kind: "user", name: "Lorne Riddle" },
  { kind: "user", name: "Thiago Cummings" },
  { kind: "user", name: "Seb Phillips" },
  { kind: "user", name: "Angel Leblanc" },
  { kind: "user", name: "Ken Potts" },
];

const FILE_NAMES = ["Invoice.pdf", "Nameplate.jpg", "Manual.pdf", "Wiring.png", "Report.xlsx", "Notes.md"] as const;
const FILE_TYPES = ["pdf", "image", "pdf", "image", "spreadsheet", "markdown"] as const;

const fileCards = (count: number) =>
  FILE_NAMES.slice(0, count).map((name, i) => (
    <CardFile key={name} name={name} fileType={FILE_TYPES[i]} onClick={noop} onMenuClick={noop} />
  ));

const locationRow = (
  <ListItem
    isClickable
    onClick={noop}
    variant="titleCaption"
    avatar={<AvatarLocation size="xl" />}
    title="123 Main Street, Suite 45, San Francisco, CA 987654"
    caption="Headquarters"
    slotRight={<ListItemSlotIcon icon="angle-right" />}
  />
);

// ---- story frames ----------------------------------------------------------

// The docs frame with the examples stacked 24px apart, like the Figma previews.
const Frame = ({ children, width }: { children: React.ReactNode; width?: number }) => (
  <div style={docsFrame}>
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width, maxWidth: "100%" }}>{children}</div>
  </div>
);

export const Playground: Story = {
  render: (args) => (
    <Frame>
      <ValueDisplay {...args} />
    </Frame>
  ),
};

// ============================================================================
// Horizontal
// ============================================================================

/** The horizontal pair: a fixed 120px label column and a value that fills the rest. */
export const Horizontal: Story = {
  render: () => (
    <Frame>
      <ValueDisplay label="Label" value="Value" />
    </Frame>
  ),
};

/** The optional right slot — one IconButton (lg) after the value container. */
export const HorizontalSlotRight: Story = {
  render: () => (
    <Frame>
      <ValueDisplay
        label="Label"
        value="Value"
        slotRight={<IconButton icon="diamonds-4" variant="ghost" size="lg" aria-label="Action" onClick={noop} />}
      />
    </Frame>
  ),
};

/** A label that does not fit one line wraps; the label and value stay top-aligned. */
export const HorizontalLabelWraps: Story = {
  render: () => (
    <Frame>
      <ValueDisplay label="Label which doesn't fit 1 line" value="Value" />
    </Frame>
  ),
};

/** Text on its own wraps when it does not fit one line. */
export const Text: Story = {
  render: () => (
    <Frame>
      <ValueDisplay label="Label" value="Value" />
      <ValueDisplay label="Label" value="Very long value which does not fit 1 line and needs to be wrapped" />
    </Frame>
  ),
};

/** The left slot takes an Icon or an avatar (fixed at xs / 20px). */
export const TextSlotLeft: Story = {
  render: () => (
    <Frame>
      <ValueDisplay label="Label" value="Value" slotLeft={<Icon icon="diamonds-4" size={14} />} />
      <ValueDisplay label="Label" value="Lorne Riddle" slotLeft={<AvatarUser size="xs" />} />
    </Frame>
  ),
};

/** With a left slot the text truncates to one line. Hover it for the full text. */
export const TextTruncates: Story = {
  render: () => (
    <Frame width={320}>
      <ValueDisplay
        label="Label"
        value="Very long value which does not fit 1 line and needs to be truncated"
        slotLeft={<Icon icon="diamonds-4" size={14} />}
      />
    </Frame>
  ),
};

/** The text takes any color — pass a token through `valueColor`. */
export const TextColors: Story = {
  render: () => (
    <Frame>
      <ValueDisplay
        label="Status"
        value="Active"
        valueColor="var(--text-success)"
        slotLeft={<Icon icon="shield" pack="solid" size={14} style={{ color: "var(--text-success)" }} />}
      />
      <ValueDisplay
        label="Status"
        value="Upcoming"
        valueColor="var(--text-info)"
        slotLeft={<Icon icon="clock" pack="solid" size={14} style={{ color: "var(--text-info)" }} />}
      />
      <ValueDisplay
        label="Status"
        value="Expired"
        valueColor="var(--text-error)"
        slotLeft={<Icon icon="hexagon-exclamation" pack="solid" size={14} style={{ color: "var(--text-error)" }} />}
      />
    </Frame>
  ),
};

/** A missing value becomes the placeholder — "No " + the label. */
export const TextEmpty: Story = {
  render: () => (
    <Frame>
      <ValueDisplay label="Label" />
      <ValueDisplay label="Name" />
      <ValueDisplay label="Model number" />
    </Frame>
  ),
};

/** The warning state — for a value that is important but missing, or suspicious. */
export const TextWarning: Story = {
  render: () => (
    <Frame>
      <ValueDisplay label="Manufacturer" value="No Manufacturer" isWarning />
      <ValueDisplay label="Credit limit" value="$1,000.00" isWarning />
      <ValueDisplay label="Label" value="Very long warning message which does not fit 1 line" isWarning />
    </Frame>
  ),
};

/** Loading — the label stays, the value becomes one skeleton line. */
export const TextLoading: Story = {
  render: () => (
    <Frame>
      <ValueDisplay label="Label" isLoading />
    </Frame>
  ),
};

/** Any badge — Badge, BadgeColor, an object status badge. The size is fixed at md. */
export const BadgeValue: Story = {
  render: () => (
    <Frame>
      <ValueDisplay label="Label" kind="badge" badge={<Badge size="md">Badge</Badge>} />
      <ValueDisplay label="Status" kind="badge" badge={<BadgeJobStatus status="active" />} />
    </Frame>
  ),
};

/** A badge that does not fit truncates its copy. Hover it for the full text. */
export const BadgeTruncates: Story = {
  render: () => (
    <Frame width={320}>
      <ValueDisplay
        label="Label"
        kind="badge"
        badge={<Badge size="md">Very long badge copy which does not fit 1 line and needs to be truncated</Badge>}
      />
    </Frame>
  ),
};

/** No badge — the placeholder. */
export const BadgeEmpty: Story = {
  render: () => (
    <Frame>
      <ValueDisplay label="Status" kind="badge" />
    </Frame>
  ),
};

/** Loading — the badge shell with a skeleton line inside. */
export const BadgeLoading: Story = {
  render: () => (
    <Frame>
      <ValueDisplay label="Status" kind="badge" isLoading />
    </Frame>
  ),
};

/** A LinkButton value. */
export const LinkValue: Story = {
  render: () => (
    <Frame>
      <ValueDisplay label="Label" kind="linkButton" link={<LinkButton noDebounce>Link</LinkButton>} />
      <ValueDisplay
        label="Recall"
        kind="linkButton"
        link={
          <LinkButton rightIcon="arrow-up-right" noDebounce>
            JOB-10001
          </LinkButton>
        }
      />
    </Frame>
  ),
};

/** A button that does not fit truncates its copy. Hover it for the full text. */
export const LinkTruncates: Story = {
  render: () => (
    <Frame width={320}>
      <ValueDisplay
        label="Label"
        kind="linkButton"
        link={<LinkButton noDebounce>Very long button copy which does not fit 1 line and needs to be truncated</LinkButton>}
      />
    </Frame>
  ),
};

/** No link — the placeholder. */
export const LinkEmpty: Story = {
  render: () => (
    <Frame>
      <ValueDisplay label="Recall" kind="linkButton" />
    </Frame>
  ),
};

/** Loading — one skeleton line. */
export const LinkLoading: Story = {
  render: () => (
    <Frame>
      <ValueDisplay label="Recall" kind="linkButton" isLoading />
    </Frame>
  ),
};

// ============================================================================
// Vertical
// ============================================================================

/** The vertical pair: the label above the value, both filling the width. */
export const Vertical: Story = {
  render: () => (
    <Frame>
      <ValueDisplay orientation="vertical" kind="shortText" label="Label" value="Value" />
    </Frame>
  ),
};

/** A label that does not fit one line wraps. */
export const VerticalLabelWraps: Story = {
  render: () => (
    <Frame width={302}>
      <ValueDisplay orientation="vertical" kind="shortText" label="Label which doesn't fit one line" value="Value" />
    </Frame>
  ),
};

/** Short text wraps when it does not fit one line. */
export const ShortText: Story = {
  render: () => (
    <Frame>
      <ValueDisplay orientation="vertical" kind="shortText" label="Label" value="Value" />
      <ValueDisplay
        orientation="vertical"
        kind="shortText"
        label="Label"
        value="Very long value which does not fit 1 line and needs to be wrapped"
      />
    </Frame>
  ),
};

/** The left slot takes an Icon or an avatar (fixed at xs / 20px), top-aligned. */
export const ShortTextSlotLeft: Story = {
  render: () => (
    <Frame>
      <ValueDisplay
        orientation="vertical"
        kind="shortText"
        label="Label"
        value="Value"
        slotLeft={<Icon icon="diamonds-4" size={14} />}
      />
      <ValueDisplay
        orientation="vertical"
        kind="shortText"
        label="Label"
        value="Lorne Riddle"
        slotLeft={<AvatarUser size="xs" />}
      />
    </Frame>
  ),
};

/** A missing value becomes the placeholder. */
export const ShortTextEmpty: Story = {
  render: () => (
    <Frame>
      <ValueDisplay orientation="vertical" kind="shortText" label="Label" />
    </Frame>
  ),
};

/** Loading — one skeleton line. */
export const ShortTextLoading: Story = {
  render: () => (
    <Frame>
      <ValueDisplay orientation="vertical" kind="shortText" label="Label" isLoading />
    </Frame>
  ),
};

/** Long text has no line limit by default — it wraps as far as it needs. */
export const LongText: Story = {
  render: () => (
    <Frame>
      <ValueDisplay orientation="vertical" label="Label" value={LONG_TEXT} />
    </Frame>
  ),
};

/** With `lineLimit` the text clamps at 4 lines and gets Show more / Show less. */
export const LongTextTruncated: Story = {
  render: () => (
    <Frame>
      <ValueDisplay orientation="vertical" label="Label" value={LONG_TEXT} lineLimit />
      <ValueDisplay orientation="vertical" label="Label" value="A short value never needs the button." lineLimit />
    </Frame>
  ),
};

/** A missing value becomes the placeholder. */
export const LongTextEmpty: Story = {
  render: () => (
    <Frame>
      <ValueDisplay orientation="vertical" label="Technician notes" />
    </Frame>
  ),
};

/** Loading — four skeleton lines. */
export const LongTextLoading: Story = {
  render: () => (
    <Frame>
      <ValueDisplay orientation="vertical" label="Label" isLoading />
    </Frame>
  ),
};

/** Up to 3 avatars show without truncation. */
export const AvatarStack: Story = {
  render: () => (
    <Frame>
      <ValueDisplay orientation="vertical" kind="avatarStack" label="Assignees" items={USERS.slice(0, 3)} />
    </Frame>
  ),
};

/** Above 3 the stack truncates to a "+N" row and gets Show more / Show less. */
export const AvatarStackTruncated: Story = {
  render: () => (
    <Frame>
      <ValueDisplay orientation="vertical" kind="avatarStack" label="Assignees" items={USERS} />
    </Frame>
  ),
};

/** Names truncate when they do not fit. Hover a truncated line for the full name. */
export const AvatarStackNames: Story = {
  render: () => (
    <Frame width={254}>
      <ValueDisplay orientation="vertical" kind="avatarStack" label="Assignees" items={USERS} />
    </Frame>
  ),
};

/** No users — a placeholder avatar and the placeholder copy. */
export const AvatarStackEmpty: Story = {
  render: () => (
    <Frame>
      <ValueDisplay orientation="vertical" kind="avatarStack" label="Assignees" />
    </Frame>
  ),
};

/** Loading — three skeleton avatar rows. */
export const AvatarStackLoading: Story = {
  render: () => (
    <Frame>
      <ValueDisplay orientation="vertical" kind="avatarStack" label="Assignees" isLoading />
    </Frame>
  ),
};

// The Figma file-grid previews are 440px wide — the width where the 106–184px
// cards wrap after three columns. The stories keep it so the documented wrap
// behavior is actually visible (the docs column alone is wider).
const FILES_WIDTH = 440;

/** The file grid — every file, no limit. */
export const Files: Story = {
  render: () => (
    <Frame width={FILES_WIDTH}>
      <ValueDisplay orientation="vertical" kind="files" label="Files" files={fileCards(6)} />
    </Frame>
  ),
};

/** One card fills the width up to its 184px maximum. */
export const FilesOneCard: Story = {
  render: () => (
    <Frame width={FILES_WIDTH}>
      <ValueDisplay orientation="vertical" kind="files" label="Files" files={fileCards(1)} />
    </Frame>
  ),
};

/** Cards shrink to their 106px minimum, then wrap. Every row keeps the first row's width. */
export const FilesWrap: Story = {
  render: () => (
    <Frame width={FILES_WIDTH}>
      <ValueDisplay orientation="vertical" kind="files" label="Files" files={fileCards(4)} />
    </Frame>
  ),
};

/** No files — the placeholder. */
export const FilesEmpty: Story = {
  render: () => (
    <Frame>
      <ValueDisplay orientation="vertical" kind="files" label="Files" />
    </Frame>
  ),
};

/** Loading — one card in its loading state by default; `loadingCount` shows more. */
export const FilesLoading: Story = {
  render: () => (
    <Frame width={FILES_WIDTH}>
      <ValueDisplay orientation="vertical" kind="files" label="Files" isLoading />
      <ValueDisplay orientation="vertical" kind="files" label="Files" isLoading loadingCount={3} />
    </Frame>
  ),
};

/** One card with the object's data — a ListItem inside a Card. */
export const ObjectCard: Story = {
  render: () => (
    <Frame>
      <ValueDisplay orientation="vertical" kind="objectCard" label="Location" card={locationRow} />
    </Frame>
  ),
};

/** No object — the placeholder. */
export const ObjectCardEmpty: Story = {
  render: () => (
    <Frame>
      <ValueDisplay orientation="vertical" kind="objectCard" label="Location" />
    </Frame>
  ),
};

/** Loading — the card with a skeleton avatar and two skeleton lines. */
export const ObjectCardLoading: Story = {
  render: () => (
    <Frame>
      <ValueDisplay orientation="vertical" kind="objectCard" label="Location" isLoading />
    </Frame>
  ),
};
