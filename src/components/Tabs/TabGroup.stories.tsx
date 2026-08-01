import { ReactNode, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { docsFrame, PSEUDO_ALL } from "../../stories/helpers";
import { AvatarSize } from "../Avatar/Avatar.types";
import AvatarUser from "../Avatar/AvatarUser";

import TabGroup from "./TabGroup";
import { TabGroupVariant } from "./TabGroup.types";
import TabItem from "./TabItem";
import { TabItemProps, TabItemSize, TabItemVariant } from "./TabItem.types";

type StoryArgs = {
  variant: TabGroupVariant;
  size: TabItemSize;
  orientation: "horizontal" | "vertical";
};

// ---- helpers ---------------------------------------------------------------

// Every preview: centered, stacked vertically, --size-20 (80px) apart.
const frame = (node: ReactNode) => (
  <div style={docsFrame}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-20)" }}>{node}</div>
  </div>
);

// Placeholder icon used across the docs previews.
const ICON = "diamonds-4";

// TabGroup style → the TabItem variant it lays out.
const itemVariant = (style: TabGroupVariant): TabItemVariant => (style === "contained" ? "container" : style === "underlined" ? "underline" : "default");

const SIZE_LABEL: Record<TabItemSize, string> = { sm: "Small", md: "Medium", lg: "Large" };
const SIZES3: TabItemSize[] = ["sm", "md", "lg"];
const SIZES2: TabItemSize[] = ["sm", "md"];

// Left-slot avatar: xxs (16px) at sm, xs (20px) at md / lg.
const av = (s: TabItemSize): AvatarSize => (s === "sm" ? "xxs" : "xs");

// A single selected tab (the size previews).
const one = (style: TabGroupVariant, size: TabItemSize, extra: Partial<TabItemProps>, label: string): Story => ({
  parameters: { controls: { disable: true } },
  render: () =>
    frame(
      <TabItem variant={itemVariant(style)} size={size} selected {...extra}>
        {label}
      </TabItem>
    ),
});

// The same tab across sizes — slot / icon-only previews (parameters vary by size).
const stack = (style: TabGroupVariant, sizes: TabItemSize[], build: (s: TabItemSize) => Partial<TabItemProps>): Story => ({
  parameters: { controls: { disable: true } },
  render: () =>
    frame(
      sizes.map((s) => (
        <TabItem key={s} variant={itemVariant(style)} size={s} selected {...build(s)}>
          {SIZE_LABEL[s]}
        </TabItem>
      ))
    ),
});

// The five states, stacked (labels are the state names). Rendered at lg.
const STATE_TABS = [
  { label: "Default", cls: undefined as string | undefined, disabled: false },
  { label: "Hover", cls: PSEUDO_ALL.hover, disabled: false },
  { label: "Press", cls: PSEUDO_ALL.press, disabled: false },
  { label: "Focus", cls: PSEUDO_ALL.focus, disabled: false },
  { label: "Disabled", cls: undefined, disabled: true },
];
const states = (style: TabGroupVariant, selected: boolean): Story => ({
  parameters: { controls: { disable: true } },
  render: () =>
    frame(
      STATE_TABS.map((st) => (
        <div key={st.label} className={st.cls}>
          <TabItem variant={itemVariant(style)} size="lg" selected={selected} disabled={st.disabled} icon={ICON} counter="0">
            {st.label}
          </TabItem>
        </div>
      ))
    ),
});

// A controlled TabGroup — the section-opening group preview (simplest: no
// icon, no counter). Rendered at lg.
function GroupDemo({ variant, size = "lg" }: { variant: TabGroupVariant; size?: TabItemSize }) {
  const [value, setValue] = useState("overview");
  return (
    <TabGroup variant={variant} size={size} value={value} onChange={setValue}>
      <TabItem value="overview">Overview</TabItem>
      <TabItem value="activity">Activity</TabItem>
      <TabItem value="settings">Settings</TabItem>
    </TabGroup>
  );
}

// ---- meta ------------------------------------------------------------------

const meta: Meta<StoryArgs> = {
  title: "Components/Tabs/TabGroup",
  component: TabGroup,
  // fullscreen — the docs stories' own `docsFrame` provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: { variant: "default", size: "lg", orientation: "horizontal" },
  argTypes: {
    variant: { options: ["default", "contained", "underlined"], control: { type: "inline-radio" } },
    size: { options: ["sm", "md", "lg"], control: { type: "inline-radio" } },
    // Icon-over-label; only the contained variant honors it (specced for lg).
    orientation: { options: ["horizontal", "vertical"], control: { type: "inline-radio" }, if: { arg: "variant", eq: "contained" } },
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

/** Click a tab or use arrow / Home / End keys — selection is owned by TabGroup. */
export const Playground: Story = {
  render: ({ variant, size }) => frame(<GroupDemo variant={variant} size={size} />),
};

// ===== Default ==============================================================

export const GroupDefault: Story = { parameters: { controls: { disable: true } }, render: () => frame(<GroupDemo variant="default" />) };

export const DefaultSmall = one("default", "sm", {}, SIZE_LABEL.sm);
export const DefaultMedium = one("default", "md", {}, SIZE_LABEL.md);
export const DefaultLarge = one("default", "lg", {}, SIZE_LABEL.lg);

export const DefaultIcon = stack("default", SIZES3, () => ({ icon: ICON }));
export const DefaultAvatar = stack("default", SIZES3, (s) => ({ avatar: <AvatarUser size={av(s)} /> }));

export const DefaultCounter = stack("default", SIZES3, () => ({ counter: "0" }));

export const DefaultIconOnly = stack("default", SIZES3, (s) => ({ iconOnly: true, icon: ICON, "aria-label": SIZE_LABEL[s] }));
export const DefaultIconOnlyCounter = stack("default", SIZES3, (s) => ({ iconOnly: true, icon: ICON, counter: "0", "aria-label": SIZE_LABEL[s] }));

export const DefaultStatesInactive = states("default", false);
export const DefaultStatesActive = states("default", true);

// ===== Contained ============================================================

export const GroupContained: Story = { parameters: { controls: { disable: true } }, render: () => frame(<GroupDemo variant="contained" />) };

export const ContainedSmall = one("contained", "sm", {}, SIZE_LABEL.sm);
export const ContainedMedium = one("contained", "md", {}, SIZE_LABEL.md);
export const ContainedLarge = one("contained", "lg", {}, SIZE_LABEL.lg);

export const ContainedIcon = stack("contained", SIZES3, () => ({ icon: ICON }));
export const ContainedAvatar = stack("contained", SIZES3, (s) => ({ avatar: <AvatarUser size={av(s)} /> }));

export const ContainedCounter = stack("contained", SIZES3, () => ({ counter: "0" }));

export const ContainedIconOnly = stack("contained", SIZES3, (s) => ({ iconOnly: true, icon: ICON, "aria-label": SIZE_LABEL[s] }));
export const ContainedIconOnlyCounter = stack("contained", SIZES3, (s) => ({ iconOnly: true, icon: ICON, counter: "0", "aria-label": SIZE_LABEL[s] }));

/** Vertical layout — single contained Tabs, lg only: icon / avatar, each also with a counter. */
export const ContainedVertical: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    frame([
      <TabItem key="icon" variant="container" size="lg" orientation="vertical" selected icon={ICON}>
        Tab
      </TabItem>,
      <TabItem key="avatar" variant="container" size="lg" orientation="vertical" selected avatar={<AvatarUser size="xs" />}>
        Tab
      </TabItem>,
      <TabItem key="icon-counter" variant="container" size="lg" orientation="vertical" selected icon={ICON} counter="0">
        Tab
      </TabItem>,
      <TabItem key="avatar-counter" variant="container" size="lg" orientation="vertical" selected avatar={<AvatarUser size="xs" />} counter="0">
        Tab
      </TabItem>,
    ]),
};

export const ContainedStatesInactive = states("contained", false);
export const ContainedStatesActive = states("contained", true);

// ===== Underlined ===========================================================

export const GroupUnderlined: Story = { parameters: { controls: { disable: true } }, render: () => frame(<GroupDemo variant="underlined" />) };

export const UnderlinedSmall = one("underlined", "sm", {}, SIZE_LABEL.sm);
export const UnderlinedMedium = one("underlined", "md", {}, SIZE_LABEL.md);

export const UnderlinedIcon = stack("underlined", SIZES2, () => ({ icon: ICON }));
export const UnderlinedAvatar = stack("underlined", SIZES2, (s) => ({ avatar: <AvatarUser size={av(s)} /> }));

export const UnderlinedCounter = stack("underlined", SIZES2, () => ({ counter: "0" }));

export const UnderlinedIconOnly = stack("underlined", SIZES2, (s) => ({ iconOnly: true, icon: ICON, "aria-label": SIZE_LABEL[s] }));
export const UnderlinedIconOnlyCounter = stack("underlined", SIZES2, (s) => ({ iconOnly: true, icon: ICON, counter: "0", "aria-label": SIZE_LABEL[s] }));

export const UnderlinedStatesInactive = states("underlined", false);
export const UnderlinedStatesActive = states("underlined", true);
