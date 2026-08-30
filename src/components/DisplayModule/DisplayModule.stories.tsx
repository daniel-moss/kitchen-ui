import { Fragment } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import DisplayModule from "./DisplayModule";
import { DisplayModuleStatus, DisplayModuleVariant } from "./DisplayModule.types";
import Counter from "../Counter/Counter";
import Badge from "../Badge/Badge";
import Avatar from "../Avatar/Avatar";
import AvatarLive from "../Avatar/AvatarLive";
import IconButton from "../IconButton/IconButton";
import Button from "../Button/Button";
import HoverTooltip from "../Tooltip/HoverTooltip";

type RightSlot = "none" | "iconButton" | "button" | "avatar" | "two";
type TitleExtra = "none" | "caption" | "counter" | "badge";

type StoryArgs = {
  variant: DisplayModuleVariant;
  title: string;
  captionText: string;
  extra: TitleExtra;
  slotLeft: boolean;
  slotRight: RightSlot;
  status: DisplayModuleStatus;
  banner: boolean;
};

const noop = () => {};
const cap: React.CSSProperties = { font: "var(--font-caption-medium-500)", color: "var(--text-subtle)" };
const frame: React.CSSProperties = { width: 440 };
const STATUS_OPTIONS: DisplayModuleStatus[] = ["none", "info", "success", "warning", "error"];
const STATUSES: DisplayModuleStatus[] = ["info", "success", "warning", "error"];

const avatar = <Avatar shape="square" content="image" size="md" />;
const liveAvatar = <AvatarLive content="image" size="lg" color="crimson" />;
const iconButton = <IconButton icon="ellipsis" size="md" variant="ghost" aria-label="More" />;

// Right-slot actions are just IconButtons + a hover tooltip (not special props) —
// so they compose freely: on their own, together, or beside a menu / Button.
const editButton = (
  <HoverTooltip text="Edit">
    <IconButton icon="pencil" size="md" variant="ghost" aria-label="Edit" onClick={noop} />
  </HoverTooltip>
);
const copyButton = (
  <HoverTooltip text="Copy">
    <IconButton icon="copy" size="md" variant="ghost" aria-label="Copy" onClick={() => navigator.clipboard?.writeText("Copied module data")} />
  </HoverTooltip>
);
// While someone is editing, the Edit button is replaced by the editor's live
// avatar; hovering shows "<first name + last initial> is editing…".
const editingAvatar = (
  <HoverTooltip text="Aisa D. is editing…">
    <AvatarLive content="image" size="md" color="crimson" />
  </HoverTooltip>
);

const rightSlots: Record<RightSlot, React.ReactNode> = {
  none: undefined,
  iconButton,
  button: (
    <Button size="md" variant="ghost">
      Button
    </Button>
  ),
  avatar: liveAvatar,
  two: (
    <>
      <Button size="md" variant="ghost">
        Action
      </Button>
      {iconButton}
    </>
  ),
};

const bannerConfig = { children: "Insert your content here.", ctaLabel: "Action", ctaOnClick: noop, onDismiss: noop };

const sampleContent = (
  <span style={{ font: "var(--font-body-400-compact)", color: "var(--text-subtle)" }}>
    Any content can go in the body — text, lists, forms, even nested modules.
  </span>
);

/**
 * DisplayModule — a card section with a header + body. `default` stacks header /
 * divider / body; `accordion` collapses; `bodyOnly` is just the body. An optional
 * status ring and alert banner wrap it, like Card.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/DisplayModule",
  component: DisplayModule,
  parameters: { layout: "centered" },
  args: {
    variant: "default",
    title: "Title",
    captionText: "Caption",
    extra: "caption",
    slotLeft: false,
    slotRight: "none",
    status: "none",
    banner: false,
  },
  argTypes: {
    variant: { options: ["default", "accordion", "bodyOnly"], control: { type: "inline-radio" } },
    title: { control: { type: "text" } },
    captionText: { name: "caption text", control: { type: "text" }, if: { arg: "extra", eq: "caption" } },
    extra: { name: "title extra", options: ["none", "caption", "counter", "badge"], control: { type: "inline-radio" } },
    slotLeft: { name: "left avatar", control: { type: "boolean" } },
    slotRight: { name: "right slot", options: ["none", "iconButton", "button", "avatar", "two"], control: { type: "inline-radio" } },
    status: { options: STATUS_OPTIONS, control: { type: "inline-radio" } },
    banner: { control: { type: "boolean" }, if: { arg: "status", neq: "none" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  render: ({ variant, title, captionText, extra, slotLeft, slotRight, status, banner }) => {
    const common = {
      variant,
      title,
      slotLeft: slotLeft ? avatar : undefined,
      slotRight: rightSlots[slotRight],
      content: sampleContent,
      defaultOpen: true,
      status,
      banner: banner ? bannerConfig : undefined,
    };
    return (
      <div style={frame}>
        {extra === "caption" ? (
          <DisplayModule {...common} caption={captionText} />
        ) : extra === "counter" ? (
          <DisplayModule {...common} titleSlotRight={<Counter value="5" />} />
        ) : extra === "badge" ? (
          <DisplayModule
            {...common}
            titleSlotRight={
              <Badge size="sm" leftDot>
                Active
              </Badge>
            }
          />
        ) : (
          <DisplayModule {...common} />
        )}
      </div>
    );
  },
};

/** Status rings and banners (default body). */
export const Statuses: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-5)", ...frame }}>
      <div>
        <span style={cap}>none</span>
        <DisplayModule title="Title" caption="Caption" content={sampleContent} />
      </div>
      {STATUSES.map((s) => (
        <Fragment key={s}>
          <div>
            <span style={cap}>{s} (ring)</span>
            <DisplayModule status={s} title="Title" caption="Caption" content={sampleContent} />
          </div>
          <div>
            <span style={cap}>{s} banner</span>
            <DisplayModule status={s} banner={bannerConfig} title="Title" caption="Caption" content={sampleContent} />
          </div>
        </Fragment>
      ))}
    </div>
  ),
};

/** The three body options. */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-6)", ...frame }}>
      <div>
        <span style={cap}>default</span>
        <DisplayModule title="Title" caption="Caption" content={sampleContent} />
      </div>
      <div>
        <span style={cap}>accordion — click the header to toggle</span>
        <DisplayModule variant="accordion" title="Title" caption="Caption" slotRight={iconButton} content={sampleContent} defaultOpen />
      </div>
      <div>
        <span style={cap}>bodyOnly</span>
        <DisplayModule variant="bodyOnly" content={sampleContent} />
      </div>
    </div>
  ),
};

/** Accordion header interaction states (forced), closed and open. */
export const AccordionStates: Story = {
  parameters: { controls: { disable: true }, layout: "padded" },
  render: () => {
    const STATES: { label: string; pseudo?: string; disabled?: boolean }[] = [
      { label: "default" },
      { label: "hover", pseudo: "pseudo-hover-all" },
      { label: "press", pseudo: "pseudo-active-all" },
      { label: "focus", pseudo: "pseudo-focus-visible-all" },
      { label: "disabled", disabled: true },
    ];
    return (
      <div style={{ display: "grid", gridTemplateColumns: "80px 360px 360px", gap: "var(--size-4)", alignItems: "start" }}>
        <span />
        <span style={cap}>closed</span>
        <span style={cap}>open</span>
        {STATES.map((s) => (
          <Fragment key={s.label}>
            <span style={{ ...cap, alignSelf: "center" }}>{s.label}</span>
            <div className={s.pseudo}>
              <DisplayModule variant="accordion" title="Title" caption="Caption" content={sampleContent} disabled={s.disabled} />
            </div>
            <div className={s.pseudo}>
              <DisplayModule variant="accordion" title="Title" caption="Caption" content={sampleContent} defaultOpen disabled={s.disabled} />
            </div>
          </Fragment>
        ))}
      </div>
    );
  },
};

/** Header slot combinations. */
export const Slots: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-4)", ...frame }}>
      <DisplayModule title="Title" caption="Caption" content={sampleContent} />
      <DisplayModule title="Title" slotLeft={avatar} caption="Caption" content={sampleContent} />
      <DisplayModule title="Title" slotLeft={avatar} titleSlotRight={<Counter value="5" />} content={sampleContent} />
      <DisplayModule title="Title" caption="Caption" slotRight={rightSlots.two} content={sampleContent} />
      <DisplayModule
        title="Title"
        caption="A long caption that wraps onto multiple lines instead of truncating like the title."
        content={sampleContent}
      />
      <DisplayModule title="A very long title that will not fit here" slotLeft={avatar} slotRight={iconButton} content={sampleContent} />
    </div>
  ),
};

/**
 * Right-slot actions. Edit and Copy are ordinary IconButtons with a hover
 * tooltip — they compose freely (alone, together, or beside a menu / Button).
 * While a module is being edited, the Edit button becomes the editor's avatar.
 */
export const Actions: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-5)", ...frame }}>
      <div>
        <span style={cap}>edit button — "Edit" tooltip on hover</span>
        <DisplayModule title="Title" slotRight={editButton} content={sampleContent} />
      </div>
      <div>
        <span style={cap}>being edited — avatar replaces the edit button</span>
        <DisplayModule title="Title" slotRight={editingAvatar} content={sampleContent} />
      </div>
      <div>
        <span style={cap}>copy button — "Copy" tooltip on hover</span>
        <DisplayModule title="Title" slotRight={copyButton} content={sampleContent} />
      </div>
      <div>
        <span style={cap}>copy + edit</span>
        <DisplayModule title="Title" slotRight={<>{copyButton}{editButton}</>} content={sampleContent} />
      </div>
      <div>
        <span style={cap}>edit + context menu</span>
        <DisplayModule title="Title" slotRight={<>{editButton}{iconButton}</>} content={sampleContent} />
      </div>
      <div>
        <span style={cap}>copy + button</span>
        <DisplayModule
          title="Title"
          slotRight={
            <>
              {copyButton}
              <Button size="md" variant="ghost">Action</Button>
            </>
          }
          content={sampleContent}
        />
      </div>
    </div>
  ),
};

/** "No fetching data" — the body shows an error EmptyState with a Reload action. */
export const ErrorState: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={frame}>
      <DisplayModule title="Title" error onRetry={noop} content={sampleContent} />
    </div>
  ),
};
