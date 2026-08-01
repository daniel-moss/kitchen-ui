import { ReactNode, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { docsFrame } from "../../stories/helpers";
import RadioItem from "./RadioItem";
import { RadioItemVariant } from "./RadioItem.types";

// Figma's axes: `active` (the value) and `state` (the interaction state).
type ActiveOption = "unselected" | "selected";
type StateOption = "default" | "focus" | "hover" | "press" | "error" | "disabled" | "readOnly" | "loading";

type StoryArgs = {
  variant: RadioItemVariant;
  active: ActiveOption;
  state: StateOption;
  label: string;
  caption: string;
  showCaption: boolean;
  icon: string;
  showIcon: boolean;
  showContent: boolean;
};

const ACTIVE: ActiveOption[] = ["unselected", "selected"];
const STATES: StateOption[] = ["default", "focus", "hover", "press", "error", "disabled", "readOnly", "loading"];

// The docs ladders' states (loading has its own section), in the Figma order.
// The item LABELS name the states — the Figma previews' self-captioning pattern.
const LADDER_STATES: StateOption[] = ["default", "focus", "hover", "press", "error", "disabled", "readOnly"];
const STATE_LABELS: Partial<Record<StateOption, string>> = {
  default: "Default",
  focus: "Focused",
  hover: "Hovered",
  press: "Pressed",
  error: "Error",
  disabled: "Disabled",
  readOnly: "Read only",
};

const PSEUDO: Partial<Record<StateOption, string>> = {
  hover: "pseudo-hover-all",
  press: "pseudo-active-all",
  focus: "pseudo-focus-visible-all",
};

const noop = () => {};
const activeProps = (a: ActiveOption) => ({ checked: a === "selected" });
const stateProps = (s: StateOption) => ({
  error: s === "error",
  disabled: s === "disabled",
  readOnly: s === "readOnly",
  loading: s === "loading",
});

// Content-slot example — plain text; the slot brings its own 16px padding.
const SlotText = (
  <span style={{ font: "var(--font-body-400-compact)", color: "var(--text-subtle)" }}>
    Details for the selected option live here — any content.
  </span>
);

// Docs frames: a centered hugging column, and a stretched column with an
// optional fixed width (the Figma previews' narrow examples), both stacking
// examples at --size-20 (80px).
const Hug = ({ children }: { children: ReactNode }) => (
  <div style={{ ...docsFrame, display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-20)" }}>
    {children}
  </div>
);
const Col = ({ width, children }: { width?: number; children: ReactNode }) => (
  <div style={docsFrame}>
    <div
      style={{
        width,
        maxWidth: "100%",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "var(--size-20)",
      }}
    >
      {children}
    </div>
  </div>
);

// One forced value + state row (controlled `checked` + noop keeps it static;
// the pseudo classes force hover/press/focus).
const Row = ({
  variant,
  active,
  state,
  caption,
  content,
}: {
  variant: RadioItemVariant;
  active: ActiveOption;
  state: StateOption;
  caption?: boolean;
  content?: boolean;
}) => (
  <div className={PSEUDO[state]}>
    <RadioItem
      variant={variant}
      label={STATE_LABELS[state]}
      caption={caption ? "Caption" : undefined}
      content={content ? SlotText : undefined}
      {...activeProps(active)}
      {...stateProps(state)}
      onChange={noop}
    />
  </div>
);

const Ladder = ({
  variant,
  active,
  width,
  caption,
  content,
}: {
  variant: RadioItemVariant;
  active: ActiveOption;
  width?: number;
  caption?: boolean;
  content?: boolean;
}) => (
  <Col width={width}>
    {LADDER_STATES.map((state) => (
      <Row key={state} variant={variant} active={active} state={state} caption={caption} content={content} />
    ))}
  </Col>
);

// Live single-select group — one card selected at a time (a lone radio can't
// deselect, so the interactive demos use a group).
function LiveGroup({ variant = "card", count = 3 }: { variant?: RadioItemVariant; count?: number }) {
  const [val, setVal] = useState("a");
  const keys = ["a", "b", "c", "d"].slice(0, count);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-2)" }}>
      {keys.map((v) => (
        <RadioItem
          key={v}
          variant={variant}
          name="radio-live"
          label={`Option ${v.toUpperCase()}`}
          caption="Click to select"
          checked={val === v}
          onChange={() => setVal(v)}
        />
      ))}
    </div>
  );
}

/**
 * RadioItem — the full component. `inline` is a bare row (radio left); `card` is
 * a bordered, selectable card (radio right) that turns "selected" when checked
 * and can reveal a content slot. Used when there are up to 4 options and only
 * one of them must be selected.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Radio/RadioItem",
  component: RadioItem,
  // fullscreen — the docs stories' docsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<StoryArgs>;

/** Use the controls to preview any variant + value + state combination. */
export const Playground: Story = {
  // The synthetic playground args/argTypes live on THIS story (not the meta) so
  // the docs-page ArgTypes table stays pure docgen from RadioItem.types.ts.
  parameters: { layout: "centered" },
  args: {
    variant: "card",
    active: "unselected",
    state: "default",
    label: "Label",
    caption: "Caption",
    showCaption: true,
    icon: "diamonds-4",
    showIcon: false,
    showContent: false,
  },
  argTypes: {
    variant: { options: ["inline", "card"], control: { type: "inline-radio" } },
    active: { options: ACTIVE, control: { type: "inline-radio" } },
    state: { options: STATES, control: { type: "select" } },
    label: { control: { type: "text" } },
    caption: { control: { type: "text" } },
    showCaption: { name: "caption", control: { type: "boolean" } },
    icon: { control: { type: "text" } },
    showIcon: { name: "left icon", control: { type: "boolean" } },
    showContent: { name: "content slot", control: { type: "boolean" } },
  },
  render: ({ variant, active, state, label, caption, showCaption, icon, showIcon, showContent }) => (
    <div style={{ width: 320 }} className={PSEUDO[state]}>
      <RadioItem
        variant={variant}
        label={label}
        caption={showCaption ? caption : undefined}
        icon={showIcon ? icon : undefined}
        content={showContent ? SlotText : undefined}
        {...activeProps(active)}
        {...stateProps(state)}
        onChange={noop}
      />
    </div>
  ),
};

/** Live — a single-select group of cards; click any card to move the selection. */
export const Interactive: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Col>
      <LiveGroup />
    </Col>
  ),
};

// ===== Inline ==============================================================

/** The minimal inline item: radio + label. */
export const Inline: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Hug>
      <RadioItem variant="inline" label="Label" defaultChecked />
    </Hug>
  ),
};

/** Inline with the optional caption. */
export const InlineCaption: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Hug>
      <RadioItem variant="inline" label="Label" caption="Caption" defaultChecked />
    </Hug>
  ),
};

/** Label and caption wrap; the radio offsets keep the first line aligned. */
export const InlineWrap: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Col width={228}>
      <RadioItem
        variant="inline"
        label="Very long label which does not fit 1 line"
        caption="Very long caption which does not fit 1 line"
        defaultChecked
      />
    </Col>
  ),
};

/** The left icon, with and without a caption. */
export const InlineIcon: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Hug>
      <RadioItem variant="inline" label="Label" icon="diamonds-4" defaultChecked />
      <RadioItem variant="inline" label="Label" caption="Caption" icon="diamonds-4" defaultChecked />
    </Hug>
  ),
};

/** Unselected inline across all 7 states (the labels name the states). */
export const InlineUnselected: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Ladder variant="inline" active="unselected" width={280} />,
};

/** Selected inline across all 7 states. */
export const InlineSelected: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Ladder variant="inline" active="selected" width={280} />,
};

/** Inline loading — the skeleton follows the caption visibility. */
export const InlineLoading: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Col width={228}>
      <RadioItem variant="inline" label="Label" loading />
      <RadioItem variant="inline" label="Label" caption="Caption" loading />
    </Col>
  ),
};

// ===== Card ================================================================

/** The card item: background, radio on the right. */
export const Card: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Col>
      <RadioItem variant="card" label="Label" caption="Caption" defaultChecked />
    </Col>
  ),
};

/** The caption is optional. */
export const CardNoCaption: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Col>
      <RadioItem variant="card" label="Label" defaultChecked />
    </Col>
  ),
};

/** Content wraps when it does not fit one line. */
export const CardWrap: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Col width={232}>
      <RadioItem
        variant="card"
        label="Very long label which does not fit 1 line"
        caption="Very long caption which does not fit 1 line"
        defaultChecked
      />
    </Col>
  ),
};

/** The left icon, with and without a caption. */
export const CardIcon: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Col>
      <RadioItem variant="card" label="Label" icon="diamonds-4" defaultChecked />
      <RadioItem variant="card" label="Label" caption="Caption" icon="diamonds-4" defaultChecked />
    </Col>
  ),
};

/** A selected card has 2 variants: with and without the content container. */
export const CardContainer: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Col>
      <RadioItem variant="card" label="Label" caption="Caption" defaultChecked />
      <RadioItem variant="card" label="Label" caption="Caption" defaultChecked content={SlotText} />
    </Col>
  ),
};

/** Unselected card across all 7 states. */
export const CardUnselected: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Ladder variant="card" active="unselected" caption />,
};

/** Selected card (no content slot) across all 7 states. */
export const CardSelected: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Ladder variant="card" active="selected" caption />,
};

/** Selected card with the content slot across all 7 states. */
export const CardSelectedContainer: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Ladder variant="card" active="selected" caption content />,
};

/** Card loading — unselected chrome, skeleton follows the caption visibility. */
export const CardLoading: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Col>
      <RadioItem variant="card" label="Label" loading />
      <RadioItem variant="card" label="Label" caption="Caption" loading />
    </Col>
  ),
};
