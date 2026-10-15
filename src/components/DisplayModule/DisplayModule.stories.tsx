import { CSSProperties, ReactNode, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { docsFrame, noop, PSEUDO_ALL } from "../../stories/helpers";
import { Do, DoDont, Dont } from "../../stories/DoDont";
import { joinWithSeparator } from "../../utils/textSeparator";
import DisplayModule from "./DisplayModule";
import { DisplayModuleBanner, DisplayModuleStatus, DisplayModuleVariant } from "./DisplayModule.types";
import Avatar from "../Avatar/Avatar";
import AvatarEquipment from "../Avatar/AvatarEquipment";
import AvatarFile from "../Avatar/AvatarFile";
import AvatarLive from "../Avatar/AvatarLive";
import Badge from "../Badge/Badge";
import Button from "../Button/Button";
import Card from "../Card/Card";
import CardFile from "../Card/CardFile";
import Counter from "../Counter/Counter";
import { Icon } from "../Icon/Icon";
import IconButton from "../IconButton/IconButton";
import ItemGroup from "../ItemGroup/ItemGroup";
import ListItem from "../ListItem/ListItem";
import ListItemSlotIcon from "../ListItem/ListItemSlotIcon";
import Segment from "../SegmentedControl/Segment";
import SegmentedControl from "../SegmentedControl/SegmentedControl";
import { SkeletonTypography } from "../SkeletonTypography/SkeletonTypography";
import Tooltip from "../Tooltip/Tooltip";
import ValueDisplay from "../ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../ValueDisplay/ValueDisplayGroup";

// The docs stories copy the Figma Documentation page (24009-19865) preview by
// preview, placeholder content included: "Title", "Label" / "Value", the
// diamonds-4 icon, "File name.xyz".

// ---- shared content ---------------------------------------------------------

const labelValues = (
  <ValueDisplayGroup>
    <ValueDisplay label="Label" value="Value" />
    <ValueDisplay label="Label" value="Value" />
  </ValueDisplayGroup>
);

const fileRow = (key: number) => (
  <ListItem
    key={key}
    variant="titleCaption"
    title="File name.xyz"
    caption="Added on Mon D, YYYY by Name S."
    avatar={<AvatarFile size="xl" type="generic" />}
    slotRight={<ListItemSlotIcon icon="angle-right" />}
    isClickable
    onClick={noop}
  />
);

const fileList = <ItemGroup>{[0, 1].map(fileRow)}</ItemGroup>;

const infoBanner: DisplayModuleBanner = {
  children: "Insert your content here.",
  ctaLabel: "Action",
  ctaOnClick: noop,
  onDismiss: noop,
};
const plainBanner: DisplayModuleBanner = { children: "Insert your content here." };

const diamondsButton = <IconButton icon="diamonds-4" size="md" variant="ghost" aria-label="Action" onClick={noop} />;

type View = "list" | "cards";

// The list / cards switch. The SELECTED segment's icon is solid, the other one
// regular — the same rule FilesModule follows (Daniel, 2026-10-06).
function ViewSwitcher({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  return (
    <SegmentedControl size="md" value={view} onChange={(value) => onChange(value as View)}>
      <Segment value="list" slotLeft={<Icon icon="list-ul" size={14} pack={view === "list" ? "solid" : "regular"} />} aria-label="List view" />
      <Segment value="cards" slotLeft={<Icon icon="grid-2" size={14} pack={view === "cards" ? "solid" : "regular"} />} aria-label="Cards view" />
    </SegmentedControl>
  );
}

function StatefulViewSwitcher() {
  const [view, setView] = useState<View>("cards");
  return <ViewSwitcher view={view} onChange={setView} />;
}

const viewSwitcher = <StatefulViewSwitcher />;

// A static tooltip drawn above its trigger, for previews that show the hover
// result (the live HoverTooltip only opens on a real pointer).
const tipAbove: CSSProperties = {
  position: "absolute",
  bottom: "calc(100% + var(--size-2))",
  left: "50%",
  transform: "translateX(-50%)",
  pointerEvents: "none",
  whiteSpace: "nowrap",
};

// The module clips its content, so a tooltip drawn inside the header would be
// cut. This one is drawn OUTSIDE the module, over the right slot's last 32px
// action: centred 32px from the module's right edge (16px padding + half the
// action), its tongue 8px above the action's top (the header's 10px padding).
function WithHeaderTip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <div style={{ position: "relative" }}>
      {children}
      <span style={{ ...tipAbove, left: "auto", right: 32, bottom: "calc(100% - 2px)", transform: "translateX(50%)" }}>
        <Tooltip placement="top" text={text} />
      </span>
    </div>
  );
}

const hoveredPen = <IconButton icon="pen" size="md" variant="ghost" aria-label="Edit" _isHovered onClick={noop} />;

const Frame = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div style={{ ...docsFrame, ...style }}>{children}</div>
);

// ---- meta + the hand-declared props table ----------------------------------
// DisplayModuleProps is a UNION (the caption / titleSlotRight exclusion), and
// react-docgen renders an empty table for a union — so the table is declared
// here by hand. Keep it in step with the JSDoc in DisplayModule.types.ts.

const prop = (summary: string, description: string, defaultValue?: string) => ({
  description,
  control: false as const,
  table: { type: { summary }, ...(defaultValue ? { defaultValue: { summary: defaultValue } } : {}) },
});

/**
 * DisplayModule — a section of a page, a side panel or a form: a header with
 * the section's title and actions, and a body slot for any content.
 */
const meta: Meta = {
  title: "Components/DisplayModule",
  component: DisplayModule,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
  argTypes: {
    variant: prop(
      '"default" | "accordion" | "bodyOnly"',
      "`default` stacks the header, a divider and the body; `accordion` makes the header a toggle that opens and closes the body; `bodyOnly` is the body alone.",
      '"default"',
    ),
    title: prop("ReactNode", "The section's title — one line, ellipsis and a full-text hover tooltip when it is too long."),
    caption: prop(
      "ReactNode",
      "A detail under the title. Wraps to as many lines as it needs. Not rendered while `titleSlotRight` is set.",
    ),
    titleSlotRight: prop("ReactNode", "A Counter, a Badge or a HintTrigger right after the title. While it is set, `caption` is not rendered."),
    slotLeft: prop("ReactNode", "An avatar of any type, at `lg` (32px), before the title."),
    slotRight: prop(
      "ReactNode",
      "One or two elements after the title: a ghost IconButton or Button at `md`, an avatar at `lg`, a Badge or BadgeColor at `lg`, or a SegmentedControl at `md` — all 32px. A `copy` or `pen` IconButton gets its \"Copy\" / \"Edit\" tooltip automatically.",
    ),
    content: prop("ReactNode", "The body — any content. Required."),
    bodyPadded: prop("boolean", "Whether the body adds its `--size-4` (16px) padding around `content`. Set false when the content brings its own.", "true"),
    status: prop(
      '"none" | "info" | "success" | "warning" | "error"',
      "Any status other than `none` draws a 1px ring in its colour around the module.",
      '"none"',
    ),
    banner: prop(
      "DisplayModuleBanner",
      "An AlertBanner above the header, in the `status` colour: `children`, optional `ctaLabel` + `ctaHref` / `ctaOnClick` / `ctaIcon`, optional `onDismiss`. Needs a status other than `none`.",
    ),
    error: prop("boolean", "Replaces the body with the error EmptyState and its Reload button. The header stays.", "false"),
    onRetry: prop("() => void", "The Reload button's handler in the error state."),
    open: prop("boolean", "Accordion only — the open state, controlled."),
    defaultOpen: prop("boolean", "Accordion only — the open state on mount, uncontrolled.", "false"),
    onOpenChange: prop("(open: boolean) => void", "Accordion only — called with the next open state when the header is toggled."),
    disabled: prop("boolean", "Accordion only — dims the header to 30% and makes it non-interactive. The body is not dimmed.", "false"),
  },
};

export default meta;

type Story = StoryObj;

// ---- Playground ---------------------------------------------------------------

type RightSlot = "none" | "iconButton" | "button" | "avatar" | "badge" | "segmentedControl" | "two";
type TitleExtra = "none" | "caption" | "counter" | "badge";

type PlaygroundArgs = {
  variant: DisplayModuleVariant;
  title: string;
  captionText: string;
  extra: TitleExtra;
  leftAvatar: boolean;
  rightSlot: RightSlot;
  status: DisplayModuleStatus;
  hasBanner: boolean;
};

const rightSlots: Record<RightSlot, ReactNode> = {
  none: undefined,
  iconButton: diamondsButton,
  button: (
    <Button size="md" variant="ghost">
      Button
    </Button>
  ),
  avatar: <AvatarLive content="image" size="lg" color="crimson" />,
  badge: <Badge size="lg">Badge</Badge>,
  segmentedControl: viewSwitcher,
  two: (
    <>
      <Button size="md" variant="ghost">
        Button
      </Button>
      {diamondsButton}
    </>
  ),
};

/** Use the controls to preview every variant, slot and status. */
export const Playground: StoryObj<PlaygroundArgs> = {
  // The synthetic args live on THIS story, so the docs-page props table stays
  // the hand-declared one above.
  parameters: { layout: "centered" },
  args: {
    variant: "default",
    title: "Title",
    captionText: "Caption",
    extra: "caption",
    leftAvatar: false,
    rightSlot: "none",
    status: "none",
    hasBanner: false,
  },
  argTypes: {
    variant: { control: { type: "inline-radio" }, options: ["default", "accordion", "bodyOnly"] },
    title: { control: { type: "text" } },
    captionText: { name: "caption text", control: { type: "text" }, if: { arg: "extra", eq: "caption" } },
    extra: { name: "title extra", options: ["none", "caption", "counter", "badge"], control: { type: "inline-radio" } },
    leftAvatar: { name: "left avatar", control: { type: "boolean" } },
    rightSlot: { name: "right slot", options: Object.keys(rightSlots), control: { type: "inline-radio" } },
    status: { control: { type: "inline-radio" }, options: ["none", "info", "success", "warning", "error"] },
    hasBanner: { name: "banner", control: { type: "boolean" }, if: { arg: "status", neq: "none" } },
  },
  render: ({ variant, title, captionText, extra, leftAvatar, rightSlot, status, hasBanner }) => {
    const common = {
      variant,
      title,
      slotLeft: leftAvatar ? <Avatar size="lg" /> : undefined,
      slotRight: rightSlots[rightSlot],
      content: labelValues,
      defaultOpen: true,
      status,
      banner: hasBanner ? infoBanner : undefined,
    };
    return (
      <div style={{ width: 440 }}>
        {extra === "caption" ? (
          <DisplayModule {...common} caption={captionText} />
        ) : extra === "counter" ? (
          <DisplayModule {...common} titleSlotRight={<Counter value="5" />} />
        ) : extra === "badge" ? (
          <DisplayModule {...common} titleSlotRight={<Badge size="md">Badge</Badge>} />
        ) : (
          <DisplayModule {...common} />
        )}
      </div>
    );
  },
};

// ---- docs page stories, in page order ---------------------------------------

/** A module with a Copy and an Edit action over a group of values. */
export const Hero: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <DisplayModule
        title="Service address"
        slotRight={
          <>
            <IconButton icon="copy" size="md" variant="ghost" aria-label="Copy" onClick={noop} />
            <IconButton icon="pen" size="md" variant="ghost" aria-label="Edit" onClick={noop} />
          </>
        }
        content={
          <ValueDisplayGroup>
            <ValueDisplay label="Location name" value="HQ" />
            <ValueDisplay label="Street address" value="Main street 123" />
            <ValueDisplay label="Suite, unit, etc." value="Suite 45" />
            <ValueDisplay label="City" value="San Francisco" />
            <ValueDisplay label="State / Province" value="CA" />
            <ValueDisplay label="Postal code" value="98765" />
          </ValueDisplayGroup>
        }
      />
    </Frame>
  ),
};

/** Every part: banner, ring, header with both slots, divider and body. */
export const Anatomy: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <DisplayModule
        status="info"
        banner={infoBanner}
        slotLeft={<Avatar size="lg" />}
        title="Title"
        caption="Caption"
        slotRight={diamondsButton}
        content={labelValues}
      />
    </Frame>
  ),
};

/** Card for one object the person opens; DisplayModule for a section. */
export const WhenToUse: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const rowProps = {
      variant: "titleCaption" as const,
      title: joinWithSeparator("Name", "Manufacturer"),
      caption: joinWithSeparator("Serial: 01234", "Model: 56789"),
      avatar: <AvatarEquipment size="xl" />,
      slotRight: <ListItemSlotIcon icon="angle-right" />,
    };
    const equipmentRow = (clickable: boolean) =>
      clickable ? <ListItem {...rowProps} isClickable onClick={noop} /> : <ListItem {...rowProps} isClickable={false} />;
    return (
      <DoDont>
        <Do caption="An equipment item as a Card, so the whole card opens the equipment.">
          <Card onClick={noop} style={{ width: "100%" }}>
            {equipmentRow(false)}
          </Card>
        </Do>
        <Dont caption="The same item as a DisplayModule with a ListItem nested.">
          <div style={{ width: "100%" }}>
            <DisplayModule
              variant="bodyOnly"
              bodyPadded={false}
              content={<div style={{ padding: "var(--size-1)" }}>{equipmentRow(true)}</div>}
            />
          </div>
        </Dont>
      </DoDont>
    );
  },
};

/** variant = "default" — header, divider, body. */
export const VariantDefault: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <DisplayModule title="Title" content={null} />
    </Frame>
  ),
};

/** variant = "accordion", closed. */
export const VariantAccordion: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <DisplayModule variant="accordion" title="Title" content={labelValues} />
    </Frame>
  ),
};

/** variant = "bodyOnly" — a list of files that names itself. */
export const VariantBodyOnly: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <DisplayModule variant="bodyOnly" bodyPadded={false} content={fileList} />
    </Frame>
  ),
};

/** A title too long for one line, with the full-text tooltip it shows on hover. */
export const Title: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const longTitle = "Very long title which doesn't fit one line";
    return (
      <Frame style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 240 }}>
          <DisplayModule title={longTitle} content={null} />
          {/* The title line sits 16px from the module's top: its tooltip ends 8px above it. */}
          <span style={{ ...tipAbove, bottom: "calc(100% - var(--size-2))", whiteSpace: "normal", width: "max-content" }}>
            {/* textAlign left — the same as the live truncation tooltip (TruncatingText). */}
            <Tooltip placement="top" text={longTitle} textAlign="left" />
          </span>
        </div>
      </Frame>
    );
  },
};

/** A title with a caption that wraps to two lines. */
export const Caption: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <DisplayModule title="Title" caption="Very long caption which does not fit 1 line and needs to be wrapped into 2 lines" content={null} />
    </Frame>
  ),
};

/** slotLeft — an equipment avatar. */
export const LeftSlot: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <DisplayModule slotLeft={<AvatarEquipment size="lg" />} title="Title" content={null} />
    </Frame>
  ),
};

/** slotRight — a Button and an IconButton. */
export const RightSlot: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <DisplayModule
        title="Title"
        slotRight={
          <>
            <Button size="md" variant="ghost">
              Button
            </Button>
            {diamondsButton}
          </>
        }
        content={null}
      />
    </Frame>
  ),
};

/** slotRight — an avatar. */
export const RightSlotAvatar: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <DisplayModule title="Title" slotRight={<Avatar size="lg" />} content={null} />
    </Frame>
  ),
};

/** slotRight — a Badge at `lg`. */
export const RightSlotBadge: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <DisplayModule
        title="Title"
        slotRight={
          <Badge size="lg">Badge</Badge>
        }
        content={null}
      />
    </Frame>
  ),
};

// The same three files as cards or as list rows, following the switch.
function FilesBySwitch() {
  const [view, setView] = useState<View>("cards");
  return (
    <DisplayModule
      title="Title"
      slotRight={<ViewSwitcher view={view} onChange={setView} />}
      bodyPadded={false}
      content={
        <ItemGroup view={view}>
          {[0, 1, 2].map((i) =>
            view === "cards" ? (
              <CardFile key={i} name="File name" fileType="image" onClick={noop} onMenuClick={noop} />
            ) : (
              fileRow(i)
            ),
          )}
        </ItemGroup>
      }
    />
  );
}

/** slotRight — a SegmentedControl switching the body between cards and a list. Try it. */
export const RightSlotSegmentedControl: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <FilesBySwitch />
    </Frame>
  ),
};

/** The body with its default padding. */
export const Body: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <DisplayModule title="Title" content={labelValues} />
    </Frame>
  ),
};

/** A list that runs edge to edge — bodyPadded={false}. */
export const BodyEdgeToEdge: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <DisplayModule variant="bodyOnly" bodyPadded={false} content={fileList} />
    </Frame>
  ),
};

/** status = "warning" — the ring alone; the content says what is missing. */
export const StatusRing: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <DisplayModule
        status="warning"
        title="Equipment"
        content={
          <ValueDisplayGroup>
            <ValueDisplay label="Name" value="Value" />
            <ValueDisplay label="Manufacturer" isWarning />
          </ValueDisplayGroup>
        }
      />
    </Frame>
  ),
};

/** status = "warning" + a banner. */
export const StatusBanner: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <DisplayModule status="warning" banner={plainBanner} title="Title" content={null} />
    </Frame>
  ),
};

/** An info banner with a call to action and a dismiss button. */
export const StatusBannerActions: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <DisplayModule status="info" banner={infoBanner} title="Title" content={null} />
    </Frame>
  ),
};

/** Accordion, closed. */
export const AccordionClosed: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <DisplayModule variant="accordion" title="Title" content={labelValues} />
    </Frame>
  ),
};

/** Accordion, open. */
export const AccordionOpen: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <DisplayModule variant="accordion" title="Title" content={labelValues} defaultOpen />
    </Frame>
  ),
};

/** A closed accordion with an Edit action in its header — try it: it never toggles the module. */
export const AccordionAction: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <DisplayModule
        variant="accordion"
        title="Title"
        slotRight={<IconButton icon="pen" size="md" variant="ghost" aria-label="Edit" onClick={noop} />}
        content={labelValues}
      />
    </Frame>
  ),
};

/** The Edit button, hovered, with its tooltip. */
export const Edit: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <WithHeaderTip text="Edit">
        <DisplayModule title="Title" slotRight={hoveredPen} content={null} />
      </WithHeaderTip>
    </Frame>
  ),
};

/** While someone else edits — their live avatar, with its tooltip. */
export const Editing: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <WithHeaderTip text="Name S. is editing…">
        <DisplayModule title="Title" slotRight={<AvatarLive content="image" size="lg" color="crimson" />} content={null} />
      </WithHeaderTip>
    </Frame>
  ),
};

/** The Copy button, hovered, with its tooltip. */
export const Copy: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <WithHeaderTip text="Copy">
        <DisplayModule
          title="Notes"
          slotRight={<IconButton icon="copy" size="md" variant="ghost" aria-label="Copy" _isHovered onClick={noop} />}
          content={null}
        />
      </WithHeaderTip>
    </Frame>
  ),
};

/** Loading — the title stays, the slots are off, the caller draws the body. */
export const Loading: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <DisplayModule
        title="Notes"
        content={
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[0, 1, 2, 3].map((i) => (
              <SkeletonTypography key={i} variant="bodySpacious" />
            ))}
          </div>
        }
      />
    </Frame>
  ),
};

/** error — the error EmptyState in the body. */
export const LoadError: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <DisplayModule title="Title" error onRetry={noop} content={null} />
    </Frame>
  ),
};

// The accordion header states. hovered / pressed / focused are forced with
// storybook-addon-pseudo-states on a wrapper; disabled is the real prop.
const stateStory = (pseudo?: string, opts: { open?: boolean; disabled?: boolean } = {}): Story => ({
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <div className={pseudo}>
        <DisplayModule
          variant="accordion"
          title="Title"
          content={labelValues}
          defaultOpen={opts.open}
          disabled={opts.disabled}
        />
      </div>
    </Frame>
  ),
});

export const StateDefault = stateStory();
export const StateHovered = stateStory(PSEUDO_ALL.hover);
export const StatePressed = stateStory(PSEUDO_ALL.press);
export const StateFocused = stateStory(PSEUDO_ALL.focus);
export const StateDisabled = stateStory(undefined, { open: true, disabled: true });

/** An action hovered inside an accordion header — the header stays at rest. */
export const StateActionHovered: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <WithHeaderTip text="Edit">
        <DisplayModule variant="accordion" title="Title" slotRight={hoveredPen} content={labelValues} />
      </WithHeaderTip>
    </Frame>
  ),
};

/** Focused under a banner — the header's top corners are square. */
export const StateFocusedBanner: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <div className={PSEUDO_ALL.focus}>
        <DisplayModule variant="accordion" status="info" banner={plainBanner} title="Title" content={labelValues} defaultOpen />
      </div>
    </Frame>
  ),
};
