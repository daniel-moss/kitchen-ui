import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import GroupLabel from "./GroupLabel";
import { GroupLabelProps } from "./GroupLabel.types";
import Avatar from "../Avatar/Avatar";
import { Icon } from "../Icon/Icon";
import IconButton from "../IconButton/IconButton";

import { docsFrame, noop } from "../../stories/helpers";

// `GroupLabelProps` is a UNION (secondary excludes the content props), and
// react-docgen cannot read JSDoc off a union — it produced an empty table. So
// the props table is declared here by hand; keep it in step with the JSDoc in
// GroupLabel.types.ts.
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

const meta: Meta<GroupLabelProps> = {
  title: "Components/GroupLabel",
  component: GroupLabel,
  // fullscreen — `docsFrame` provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: { variant: "primary", label: "Label" },
  argTypes: {
    variant: {
      options: ["primary", "secondary"],
      control: { type: "inline-radio" },
      description: "`primary` is the 40px filled bar; `secondary` the 28px transparent row. Secondary carries the label alone — no slot, counter or caption.",
      table: { type: { summary: '"primary" | "secondary"' }, defaultValue: { summary: '"primary"' } },
    },
    label: {
      control: { type: "text" },
      description: "The group title — `caption-medium-500` (Inter Medium 13/20), `--text-strong` in primary and `--text-subtle` in secondary. On its own it fills the header and truncates.",
      table: { type: { summary: "ReactNode" } },
    },
    slotLeft: slot("ReactNode", "Slot before the label, 8px from the text — an Avatar at sm (24px) or an Icon (classic, regular, 14px, square container). Primary only."),
    counter: {
      control: { type: "text" },
      description: "Count after the label, separated by a bullet. Subtle. Primary only.",
      table: { type: { summary: "number | string" } },
    },
    counterIcon: {
      control: { type: "text" },
      description: "Icon name drawn to the left of the counter number. Primary only.",
      table: { type: { summary: "string" } },
    },
    caption: {
      control: { type: "text" },
      description: "Caption after the label and counter, separated by its own bullet. Subtle. Primary only.",
      table: { type: { summary: "ReactNode" } },
    },
    slotRight: slot("ReactNode", "Action at the right end — an IconButton, md ghost (32px) in primary and xs muted (24px) in secondary. Its clicks stay in the slot: it never toggles the accordion."),
    isAccordion: flag("The header becomes a toggle: it gets a caret and the hover / press / focus / disabled states. GroupLabel does not collapse anything by itself — the group container does.", "false"),
    open: flag("Controlled open state (`isAccordion`)."),
    defaultOpen: flag("Uncontrolled initial open state (`isAccordion`).", "false"),
    onOpenChange: slot("(open: boolean) => void", "Called with the new open state (`isAccordion`)."),
    disabled: flag("Dims the header to 30% and stops it responding. Accordion only.", "false"),
    isLoading: flag("The label becomes a 96px bar and the caret, counter, caption, slot and action are all hidden. The header keeps its own shape and stops being interactive.", "false"),
    className: slot("string", "Extra class on the header."),
  },
};
export default meta;

type Story = StoryObj<GroupLabelProps>;

// ---- helpers ---------------------------------------------------------------

const iconSlot = <Icon icon="diamonds-4" pack="regular" size={14} container="square" />;
const avatarSlot = <Avatar shape="square" content="image" size="sm" />;
const primaryAction = <IconButton icon="diamonds-4" size="md" variant="ghost" aria-label="Action" onClick={noop} />;
const secondaryAction = <IconButton icon="diamonds-4" size="xs" variant="muted" aria-label="Action" onClick={noop} />;

const noControls = { controls: { disable: true } };

// Every Figma Documentation preview stacks its rows 80px apart.
const Stack = ({ children }: { children: React.ReactNode }) => (
  <div style={{ ...docsFrame, display: "flex", flexDirection: "column", gap: "var(--size-20)" }}>{children}</div>
);
const One = ({ children }: { children: React.ReactNode }) => <div style={docsFrame}>{children}</div>;

const LONG_LABEL = "A very long group label which does not fit one line and is required to be truncated";

// The pseudo-states addon classes, on a WRAPPER — the header's own states are
// driven by the root element, and a `-all` wrapper would also mark the action.
const STATES: { title: string; wrap?: string; disabled?: boolean }[] = [
  { title: "Default" },
  { title: "Hovered", wrap: "pseudo-hover-all" },
  { title: "Pressed", wrap: "pseudo-active-all" },
  { title: "Focused", wrap: "pseudo-focus-visible-all" },
  { title: "Disabled", disabled: true },
];

const StateBoard = ({ variant }: { variant: "primary" | "secondary" }) => (
  <Stack>
    {STATES.map((s) => (
      <div key={s.title} className={s.wrap}>
        {variant === "primary" ? (
          <GroupLabel label={s.title} isAccordion disabled={s.disabled} />
        ) : (
          <GroupLabel variant="secondary" label={s.title} isAccordion disabled={s.disabled} />
        )}
      </div>
    ))}
  </Stack>
);

// ---- playground ------------------------------------------------------------

/** The header on its own. Switch the variant and the content below. */
export const Playground: Story = {
  render: (args: GroupLabelProps) => (
    <One>
      <GroupLabel {...args} />
    </One>
  ),
};

export const Overview: Story = {
  parameters: noControls,
  render: () => (
    <One>
      <GroupLabel label="Label" counter={12} slotLeft={iconSlot} slotRight={primaryAction} />
    </One>
  ),
};

// ---- anatomy ---------------------------------------------------------------

export const Anatomy: Story = {
  parameters: noControls,
  render: () => (
    <One>
      <GroupLabel label="Label" counter={12} caption="Caption" slotLeft={iconSlot} slotRight={primaryAction} isAccordion />
    </One>
  ),
};

// Radius 6; gaps of 12 — caret ↔ content in primary, content ↔ action in both.
// In secondary the caret sits inside the content, 8px after the label.
export const AnatomyGaps: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <GroupLabel label="Label" slotRight={primaryAction} isAccordion />
      <GroupLabel variant="secondary" label="Label" slotRight={secondaryAction} isAccordion />
    </Stack>
  ),
};

// ---- variants --------------------------------------------------------------

export const Variants: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <GroupLabel label="Label" />
      <GroupLabel variant="secondary" label="Label" />
    </Stack>
  ),
};

// Primary heads a list; secondary heads a quieter section.
export const VariantsInUse: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <GroupLabel label="Locations" counter={8} />
      <GroupLabel variant="secondary" label="Today" />
    </Stack>
  ),
};

// Secondary carries the label alone — only the label, the caret and the action.
export const SecondaryLabelOnly: Story = {
  parameters: noControls,
  render: () => (
    <One>
      <GroupLabel variant="secondary" label="Label" slotRight={secondaryAction} isAccordion />
    </One>
  ),
};

// ---- content ---------------------------------------------------------------

// On its own the label fills the header and truncates.
export const ContentLabel: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <GroupLabel label={LONG_LABEL} />
      <GroupLabel variant="secondary" label={LONG_LABEL} />
    </Stack>
  ),
};

// Next to a counter or a caption the label hugs its text.
export const ContentLabelHugs: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <GroupLabel label="Label" counter={12} />
      <GroupLabel label={LONG_LABEL} counter={12} />
    </Stack>
  ),
};

export const ContentSlotLeft: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <GroupLabel label="Label" slotLeft={avatarSlot} />
      <GroupLabel label="Label" slotLeft={iconSlot} />
    </Stack>
  ),
};

export const ContentCounter: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <GroupLabel label="Label" counter={12} />
      <GroupLabel label="Label" counter={12} counterIcon="diamonds-4" />
    </Stack>
  ),
};

export const ContentCaption: Story = {
  parameters: noControls,
  render: () => (
    <One>
      <GroupLabel label="Label" caption="Caption" />
    </One>
  ),
};

export const ContentCounterAndCaption: Story = {
  parameters: noControls,
  render: () => (
    <One>
      <GroupLabel label="Label" counter={12} caption="Caption" />
    </One>
  ),
};

// ---- right slot ------------------------------------------------------------

export const RightSlot: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <GroupLabel label="Label" slotRight={primaryAction} />
      <GroupLabel variant="secondary" label="Label" slotRight={secondaryAction} />
    </Stack>
  ),
};

// The action is its own trigger — clicking it does not toggle the accordion.
export const RightSlotIsOwnTrigger: Story = {
  parameters: noControls,
  render: function RightSlotIsOwnTriggerStory() {
    const [clicks, setClicks] = useState(0);
    const [open, setOpen] = useState(false);
    return (
      <Stack>
        <GroupLabel
          label={`Open: ${open ? "yes" : "no"} · action clicks: ${clicks}`}
          isAccordion
          open={open}
          onOpenChange={setOpen}
          slotRight={<IconButton icon="diamonds-4" size="md" variant="ghost" aria-label="Action" onClick={() => setClicks((c) => c + 1)} />}
        />
      </Stack>
    );
  },
};

// ---- accordion -------------------------------------------------------------

// caret-right, solid, gray-a9 — 14px in primary, 12px in secondary.
export const AccordionCaret: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <GroupLabel label="Label" isAccordion />
      <GroupLabel variant="secondary" label="Label" isAccordion />
    </Stack>
  ),
};

// Opening rotates the same glyph 90°.
export const AccordionOpen: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <GroupLabel label="Label" isAccordion open />
      <GroupLabel variant="secondary" label="Label" isAccordion open />
    </Stack>
  ),
};

// The header is the trigger; the group below it is the consumer's to collapse.
export const AccordionTrigger: Story = {
  parameters: noControls,
  render: function AccordionTriggerStory() {
    const [open, setOpen] = useState(true);
    return (
      <div style={docsFrame}>
        <GroupLabel label="Label" counter={3} isAccordion open={open} onOpenChange={setOpen} />
        {open && (
          <div style={{ padding: "var(--size-2) var(--size-3)", font: "var(--font-body-400-compact)", color: "var(--text-subtle)" }}>
            The group content. GroupLabel does not hide this — the container does.
          </div>
        )}
      </div>
    );
  },
};

// ---- states ----------------------------------------------------------------

// A static header has one state.
export const StatesStatic: Story = {
  parameters: noControls,
  render: () => (
    <One>
      <GroupLabel label="Label" />
    </One>
  ),
};

export const StatesPrimary: Story = {
  parameters: noControls,
  render: () => <StateBoard variant="primary" />,
};

export const StatesSecondary: Story = {
  parameters: noControls,
  render: () => <StateBoard variant="secondary" />,
};

// ---- loading ---------------------------------------------------------------

export const Loading: Story = {
  parameters: noControls,
  render: () => (
    <Stack>
      <GroupLabel label="Label" isLoading />
      <GroupLabel variant="secondary" label="Label" isLoading />
    </Stack>
  ),
};

// The Usage section is a TABLE only — the Figma doc page has no preview there,
// so there is no Usage story.
