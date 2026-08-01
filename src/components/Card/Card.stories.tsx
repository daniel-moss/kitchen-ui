import type { Meta, StoryObj } from "@storybook/react";

import { docsFrame, noop } from "../../stories/helpers";
import { SkeletonTypography } from "../SkeletonTypography/SkeletonTypography";
import Card from "./Card";
import { CardBanner, CardStatus } from "./Card.types";

// The selectable states for the Playground. default / disabled / loading / error
// map to Card props; hover / press / focus are CSS pseudo-states forced via
// storybook-addon-pseudo-states.
type CardStateOption = "default" | "hover" | "press" | "focus" | "drag" | "disabled" | "loading" | "error";

type PlaygroundArgs = {
  state: CardStateOption;
  status: CardStatus;
  ring: boolean;
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

// Pseudo-state classes forced on the card BODY only (via bodyClassName), so a
// banner's own CTA / dismiss keep their resting state. The Card tints the whole
// card via :has(.body:hover) — the addon rewrites that to also match
// .body.pseudo-hover — so the banner area tints with the state too.
const PSEUDO_CLASS: Partial<Record<CardStateOption, string>> = {
  hover: "pseudo-hover",
  press: "pseudo-active",
  focus: "pseudo-focus-visible",
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

// Representative card content — a title line + one body line.
function Demo({ title = "Card title", lines = 1 }: { title?: React.ReactNode; lines?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-2)" }}>
      <span style={{ font: "var(--font-body-500-compact)", color: "var(--text-strong)" }}>{title}</span>
      {Array.from({ length: lines }).map((_, i) => (
        <span key={i} style={{ font: "var(--font-body-400-spacious)", color: "var(--text-subtle)" }}>
          Some content that lives inside the card body.
        </span>
      ))}
    </div>
  );
}

// The three variants a state applies across: no alert, alert ring, ring + banner.
const VARIANTS: { key: string; title: string; ring?: boolean; banner?: CardBanner }[] = [
  { key: "plain", title: "No alert" },
  { key: "ring", title: "With alert ring", ring: true },
  { key: "banner", title: "With ring + banner", banner: demoBanner },
];

// Renders the three variants, all forced into one state — the States gallery.
function StateGallery({ state }: { state: CardStateOption }) {
  return (
    <div style={frameCol}>
      {VARIANTS.map((v) => (
        <Card
          key={v.key}
          status="info"
          ring={v.ring}
          banner={v.banner}
          onClick={noop}
          bodyClassName={PSEUDO_CLASS[state]}
          dragging={state === "drag"}
          disabled={state === "disabled"}
        >
          <Demo title={v.title} />
        </Card>
      ))}
    </div>
  );
}

/**
 * Card — an interactive container for any type of data. Corner radius, shadow
 * and background are the only component-level params; the body is a slot.
 * Optional alert ring (1px status border) and alert banner. Supports error and
 * loading states.
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
  args: { state: "default", status: "info", ring: false, banner: false, padding: 16 },
  argTypes: {
    state: { options: STATE_OPTIONS, control: { type: "select" } },
    status: { options: STATUSES, control: { type: "inline-radio" } },
    ring: { control: { type: "boolean" } },
    banner: { control: { type: "boolean" } },
    padding: { control: { type: "number" } },
  },
  render: ({ state, status, ring, banner, padding }) => (
    <div style={{ width: 360 }}>
      <Card
        status={status}
        ring={ring}
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
        <Demo lines={1} />
      </Card>
    </div>
  ),
};

/** A plain card — corner radius, shadow and background are the only component-level params. */
export const Hero: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <Card onClick={noop}>
        <Demo />
      </Card>
    </div>
  ),
};

/** The alert ring in 4 statuses: info, success, warning, error. */
export const AnatomyRing: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={frameCol}>
      {STATUSES.map((status) => (
        <Card key={status} status={status} ring onClick={noop}>
          <Demo title={STATUS_LABELS[status]} />
        </Card>
      ))}
    </div>
  ),
};

/** The alert banner in 4 statuses. The banner always carries a matching ring. */
export const AnatomyBanner: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={frameCol}>
      {STATUSES.map((status) => (
        <Card
          key={status}
          status={status}
          banner={{ children: "Insert your content here.", ctaLabel: "Action", ctaOnClick: noop, onDismiss: noop }}
          onClick={noop}
        >
          <Demo title={STATUS_LABELS[status]} />
        </Card>
      ))}
    </div>
  ),
};

/** The error state — the body is replaced with an EmptyState and a Reload button. */
export const ErrorState: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <Card error onRetry={noop} onClick={noop}>
        <Demo />
      </Card>
    </div>
  ),
};

/** Default — resting fill and shadow, across all three variants. */
export const StateDefault: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StateGallery state="default" />,
};

/** Focused — a 2px gray-12 border over the hover fill (keyboard focus). */
export const StateFocused: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StateGallery state="focus" />,
};

/** Hovered — the surface-interactive-hover fill; the resting shadow flattens. */
export const StateHovered: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StateGallery state="hover" />,
};

/** Pressed — the surface-interactive-press fill; the shadow flattens. */
export const StatePressed: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StateGallery state="press" />,
};

/** Dragging — a 1px gray-12 border + a large lift shadow; non-interactive. */
export const StateDragging: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StateGallery state="drag" />,
};

/** Disabled — 30% opacity; non-interactive. */
export const StateDisabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StateGallery state="disabled" />,
};

/** Loading — non-interactive; the consumer supplies skeletons matching the content. */
export const StateLoading: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <Card loading>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-2)" }}>
          <SkeletonTypography variant="bodyCompact" width="40%" />
          <SkeletonTypography variant="bodySpacious" width="100%" />
        </div>
      </Card>
    </div>
  ),
};
