import type { Meta, StoryObj } from "@storybook/react";

import { docsFrame, noop, PSEUDO_ALL, PSEUDO_SELF } from "../../stories/helpers";
import { Do, DoDont, Dont } from "../../stories/DoDont";
import { joinWithSeparator } from "../../utils/textSeparator";
import AvatarClient from "../Avatar/AvatarClient";
import IconButton from "../IconButton/IconButton";
import ListItem from "../ListItem/ListItem";
import ListItemSlotIcon from "../ListItem/ListItemSlotIcon";
import ValueDisplay from "../ValueDisplay/ValueDisplay";
import Card from "./Card";
import { CardBanner, CardStatus } from "./Card.types";

// The selectable states for the Playground. default / disabled / loading / error
// map to Card props; hover / press / focus are CSS pseudo-states forced via
// storybook-addon-pseudo-states.
type CardStateOption = "default" | "hover" | "press" | "focus" | "drag" | "disabled" | "loading" | "error";

type PlaygroundArgs = {
  state: CardStateOption;
  status: CardStatus;
  alertRing: boolean;
  banner: boolean;
  padding: number;
};

const STATE_OPTIONS: CardStateOption[] = ["default", "hover", "press", "focus", "drag", "disabled", "loading", "error"];
const STATUSES: CardStatus[] = ["info", "success", "warning", "error"];
const STATUS_LABELS: Record<CardStatus, string> = {
  info: "Info",
  success: "Success",
  warning: "Warning",
  error: "Error",
};

// Pseudo-state classes forced on the card BODY only (via bodyClassName), so the
// banner's own CTA / dismiss keep their resting state. The body is also the
// element that carries the interaction fill, so marking it is enough — the card
// reaches it through :has(.body:hover) for the shadow.
const PSEUDO_CLASS: Partial<Record<CardStateOption, string>> = {
  hover: PSEUDO_SELF.hover,
  press: PSEUDO_SELF.press,
  focus: PSEUDO_SELF.focus,
};

const demoBanner: CardBanner = {
  children: "Insert your content here.",
  ctaLabel: "Action",
  ctaOnClick: noop,
  onDismiss: noop,
};

// A stacked column of demo cards inside the docs frame. Cards sit --size-20
// (80px) apart, matching the Figma preview spacing.
const frameCol: React.CSSProperties = {
  ...docsFrame,
  display: "flex",
  flexDirection: "column",
  gap: "var(--size-20)",
};

// The card's canonical content — the Figma previews' `ListItem Template` at
// `variant = client`: an xl AvatarClient, title + caption, the open marker, and
// the row itself NOT clickable. The caption joins its two unrelated pieces with
// TEXT_SEPARATOR, never a hand-typed dot.
function Row({
  title = "Client name",
  caption = joinWithSeparator("Type", "Industry"),
}: {
  title?: string;
  caption?: string;
}) {
  return (
    <ListItem
      variant="titleCaption"
      title={title}
      caption={caption}
      avatar={<AvatarClient size="xl" type="business" content="icon" />}
      slotRight={<ListItemSlotIcon icon="angle-right" />}
      isClickable={false}
    />
  );
}

// The three variants a state applies across: no alert, alert ring, ring + banner.
const VARIANTS: { key: string; title: string; alertRing?: boolean; banner?: CardBanner }[] = [
  { key: "plain", title: "No alert" },
  { key: "ring", title: "With alert ring" },
  { key: "banner", title: "With ring + banner", banner: demoBanner },
];
VARIANTS[1].alertRing = true;

// Renders the three variants, all forced into one state — the States gallery.
function StateGallery({ state }: { state: CardStateOption }) {
  return (
    <div style={frameCol}>
      {VARIANTS.map((v) => (
        <Card
          key={v.key}
          status="info"
          alertRing={v.alertRing}
          banner={v.banner}
          onClick={noop}
          bodyClassName={PSEUDO_CLASS[state]}
          dragging={state === "drag"}
          disabled={state === "disabled"}
        >
          <Row title={v.title} />
        </Card>
      ))}
    </div>
  );
}

/**
 * Card — an interactive container. The card draws the surface, the corner and
 * the interaction states; the body is a slot. An optional alert ring and alert
 * banner mark a status on the whole card.
 */
const meta: Meta<PlaygroundArgs> = {
  title: "Components/Card/Card",
  component: Card,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Use the controls to preview every state and variant. */
export const Playground: Story = {
  // The synthetic playground args/argTypes live on THIS story (not the meta) so
  // the docs-page ArgTypes table stays pure docgen from Card.types.ts.
  parameters: { layout: "centered" },
  args: { state: "default", status: "info", alertRing: false, banner: false, padding: 4 },
  argTypes: {
    state: { options: STATE_OPTIONS, control: { type: "select" } },
    status: { options: STATUSES, control: { type: "inline-radio" } },
    alertRing: { control: { type: "boolean" } },
    banner: { control: { type: "boolean" } },
    padding: { control: { type: "number" } },
  },
  render: ({ state, status, alertRing, banner, padding }) => (
    <div style={{ width: 360 }}>
      <Card
        status={status}
        alertRing={alertRing}
        banner={banner ? demoBanner : undefined}
        disabled={state === "disabled"}
        loading={state === "loading"}
        dragging={state === "drag"}
        error={state === "error"}
        onRetry={noop}
        padding={padding}
        bodyClassName={PSEUDO_CLASS[state]}
        onClick={noop}
      >
        <Row />
      </Card>
    </div>
  ),
};

/** A plain card holding one static ListItem. */
export const Hero: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <Card onClick={noop}>
        <Row />
      </Card>
    </div>
  ),
};

/** The three parts — the card surface, the body slot, the banner and the ring. */
export const Anatomy: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <Card status="info" banner={demoBanner} onClick={noop}>
        <Row />
      </Card>
    </div>
  ),
};

/** Hovered — the body's fill covers its padding and reaches the card's corners. */
export const AnatomyHovered: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <Card onClick={noop} bodyClassName={PSEUDO_SELF.hover}>
        <Row />
      </Card>
    </div>
  ),
};

/** When a card fits, and when a plain container is the right thing instead. */
export const WhenToUse: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <DoDont>
      <Do caption="A file card — the whole tile opens the file, so there is one target and one set of states.">
        <Card onClick={noop} style={{ width: "100%" }}>
          <Row title="Invoice October.pdf" caption={joinWithSeparator("PDF", "248 KB")} />
        </Card>
      </Do>
      <Dont caption="A read-only summary in a card — nothing to tap, so the shadow and the hover fill promise an action that is not there.">
        <Card padding="var(--size-4)" style={{ width: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-1)" }}>
            <ValueDisplay label="Client" value="Wildwood Kitchen" />
            <ValueDisplay label="Service" value="Walk-in cooler repair" />
            <ValueDisplay label="Status" value="Scheduled" />
          </div>
        </Card>
      </Dont>
    </DoDont>
  ),
};

/** The row inside a card is never the target — the card is. */
export const HoldingListItem: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <DoDont>
      <Do caption="A row that is not clickable, with the open marker on the right — one target, and the card carries every state.">
        <Card onClick={noop} bodyClassName={PSEUDO_SELF.hover} style={{ width: "100%" }}>
          <Row />
        </Card>
      </Do>
      <Dont caption="A clickable row inside the card — the row takes the hover, and the card stops responding over its own area.">
        <div className={PSEUDO_ALL.hover} style={{ width: "100%" }}>
          <Card onClick={noop}>
            <ListItem
              variant="titleCaption"
              title="Client name"
              caption={joinWithSeparator("Type", "Industry")}
              avatar={<AvatarClient size="xl" type="business" content="icon" />}
              slotRight={<ListItemSlotIcon icon="angle-right" />}
              isClickable
              onClick={noop}
            />
          </Card>
        </div>
      </Dont>
    </DoDont>
  ),
};

/** The open marker adds no target; an action in the same slot is a real one. */
export const RightSlot: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={frameCol}>
      <Card onClick={noop}>
        <Row />
      </Card>
      <Card onClick={noop}>
        <ListItem
          variant="titleCaption"
          title="Client name"
          caption={joinWithSeparator("Type", "Industry")}
          avatar={<AvatarClient size="xl" type="business" content="icon" />}
          slotRight={<IconButton icon="ellipsis" variant="ghost" size="md" aria-label="More actions" onClick={noop} />}
          isClickable={false}
        />
      </Card>
    </div>
  ),
};

/** The alert ring in four statuses: info, success, warning, error. */
export const AlertRing: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={frameCol}>
      {STATUSES.map((status) => (
        <Card key={status} status={status} alertRing onClick={noop}>
          <Row title={STATUS_LABELS[status]} />
        </Card>
      ))}
    </div>
  ),
};

/** Hovered with a warning banner — the banner keeps its colour, the body does not. */
export const AlertBannerPreview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <Card status="warning" banner={demoBanner} onClick={noop} bodyClassName={PSEUDO_SELF.hover}>
        <Row />
      </Card>
    </div>
  ),
};

/** The error state — the body is replaced with an EmptyState and a Reload button. */
export const ErrorState: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <Card error onRetry={noop} onClick={noop}>
        <Row />
      </Card>
    </div>
  ),
};

/** Default — resting fill and shadow, across all three variants. */
export const StateDefault: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StateGallery state="default" />,
};

/** Hovered — the body steps to the hover fill; the resting shadow flattens. */
export const StateHovered: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StateGallery state="hover" />,
};

/** Pressed — the body steps to the press fill; the shadow flattens. */
export const StatePressed: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StateGallery state="press" />,
};

/** Focused — a 2px gray-12 ring over the hover fill; it replaces the alert ring. */
export const StateFocused: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StateGallery state="focus" />,
};

/** Dragging — a 1px gray-12 edge + a large lift shadow; non-interactive. */
export const StateDragging: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StateGallery state="drag" />,
};

/** Disabled — 30% opacity across the whole card; non-interactive. */
export const StateDisabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StateGallery state="disabled" />,
};
