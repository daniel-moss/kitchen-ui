import { Fragment } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import AvatarClient from "../Avatar/AvatarClient";
import AvatarUser from "../Avatar/AvatarUser";

import TabItem from "./TabItem";
import { TabItemSize, TabItemVariant } from "./TabItem.types";

type StateOption = "default" | "hover" | "press" | "focus" | "disabled" | "loading";

type StoryArgs = {
  variant: TabItemVariant;
  size: TabItemSize;
  orientation: "horizontal" | "vertical";
  selected: boolean;
  label: string;
  icon: string;
  counter: string;
  iconOnly: boolean;
  disabled: boolean;
  loading: boolean;
};

const STATE_OPTIONS: StateOption[] = ["default", "hover", "press", "focus", "disabled", "loading"];

const PSEUDO: Partial<Record<StateOption, string>> = {
  hover: "pseudo-hover-all",
  press: "pseudo-active-all",
  focus: "pseudo-focus-visible-all",
};
const stateProps = (s: StateOption) => ({ disabled: s === "disabled", loading: s === "loading" });

const cap: React.CSSProperties = { font: "var(--font-caption-medium-500)", color: "var(--text-subtle)" };
const ICON = "house";

// Container's selected tab is a raised white surface — show it on a segmented
// track (a subtle gray rounded band) like a real tab bar.
const Track: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "inline-flex", gap: "var(--size-1)", padding: "var(--size-1)", background: "var(--gray-a3)", borderRadius: "var(--border-radius-2)" }}>
    {children}
  </div>
);

const meta: Meta<StoryArgs> = {
  title: "Components/Tabs/TabItem",
  component: TabItem,
  parameters: { layout: "centered" },
  args: {
    variant: "default",
    size: "md",
    orientation: "horizontal",
    selected: false,
    label: "Tab",
    icon: ICON,
    counter: "0",
    iconOnly: false,
    disabled: false,
    loading: false,
  },
  argTypes: {
    variant: { options: ["default", "container", "underline"], control: { type: "inline-radio" } },
    size: { options: ["sm", "md", "lg"], control: { type: "inline-radio" } },
    orientation: { options: ["horizontal", "vertical"], control: { type: "inline-radio" }, if: { arg: "variant", eq: "container" } },
    selected: { control: { type: "boolean" } },
    label: { control: { type: "text" } },
    icon: { control: { type: "text" } },
    counter: { control: { type: "text" } },
    iconOnly: { control: { type: "boolean" } },
    disabled: { control: { type: "boolean" } },
    loading: { control: { type: "boolean" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  render: ({ label, icon, counter, ...args }) => {
    const tab = <TabItem {...args} icon={icon || undefined} counter={counter || undefined}>{label}</TabItem>;
    return args.variant === "container" ? <Track>{tab}</Track> : tab;
  },
};

// One variant's full matrix — states (rows) × unselected / selected (cols).
const Matrix = ({ variant }: { variant: TabItemVariant }) => {
  const wrap = (node: React.ReactNode) => (variant === "container" ? <Track>{node}</Track> : node);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "72px auto auto", alignItems: "center", rowGap: "var(--size-4)", columnGap: "var(--size-6)" }}>
      <span />
      <span style={cap}>unselected</span>
      <span style={cap}>selected</span>
      {STATE_OPTIONS.map((s) => (
        <Fragment key={s}>
          <span style={cap}>{s}</span>
          {[false, true].map((sel) => (
            <div key={String(sel)} className={PSEUDO[s]}>
              {wrap(
                <TabItem variant={variant} selected={sel} icon={ICON} counter="0" {...stateProps(s)}>
                  Tab
                </TabItem>,
              )}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
};

export const Default: Story = { parameters: { controls: { disable: true } }, render: () => <Matrix variant="default" /> };
export const Container: Story = { parameters: { controls: { disable: true } }, render: () => <Matrix variant="container" /> };
export const Underline: Story = { parameters: { controls: { disable: true } }, render: () => <Matrix variant="underline" /> };

/** Container vertical — icon over label (specced for the lg size). */
export const Vertical: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Track>
      <TabItem variant="container" size="lg" orientation="vertical" icon={ICON} counter="0">
        Tab
      </TabItem>
      <TabItem variant="container" size="lg" orientation="vertical" selected icon={ICON} counter="0">
        Tab
      </TabItem>
      <TabItem variant="container" size="lg" orientation="vertical" icon={ICON}>
        Tab
      </TabItem>
    </Track>
  ),
};

/**
 * Left slot can hold an avatar (user / client / generic) instead of an icon.
 * Use xxs (16px) at sm and xs (20px) at md / lg.
 */
export const Avatar: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-5)", alignItems: "flex-start" }}>
      <div style={{ display: "flex", gap: "var(--size-4)", alignItems: "center" }}>
        <span style={cap}>md</span>
        <TabItem selected avatar={<AvatarUser size="xs" />}>Lorne Riddle</TabItem>
        <TabItem avatar={<AvatarClient size="xs" type="business" content="image" />} counter="3">
          Acme Diner
        </TabItem>
        <TabItem avatar={<AvatarClient size="xs" type="generic" />}>Unassigned</TabItem>
      </div>
      <div style={{ display: "flex", gap: "var(--size-4)", alignItems: "center" }}>
        <span style={cap}>sm</span>
        <TabItem size="sm" selected avatar={<AvatarUser size="xxs" />}>
          Lorne Riddle
        </TabItem>
        <TabItem size="sm" avatar={<AvatarClient size="xxs" type="business" content="image" />} counter="3">
          Acme Diner
        </TabItem>
      </div>
    </div>
  ),
};

/** Sizes (sm / md / lg) across the three variants. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "48px repeat(3, auto)", alignItems: "center", rowGap: "var(--size-4)", columnGap: "var(--size-5)", justifyItems: "start" }}>
      <span />
      {(["default", "container", "underline"] as TabItemVariant[]).map((v) => (
        <span key={v} style={cap}>
          {v}
        </span>
      ))}
      {(["sm", "md", "lg"] as TabItemSize[]).map((sz) => (
        <Fragment key={sz}>
          <span style={cap}>{sz}</span>
          {(["default", "container", "underline"] as TabItemVariant[]).map((v) => (
            <div key={v}>
              {v === "container" ? (
                <Track>
                  <TabItem variant={v} size={sz} selected icon={ICON} counter="0">
                    Tab
                  </TabItem>
                </Track>
              ) : (
                <TabItem variant={v} size={sz} selected icon={ICON} counter="0">
                  Tab
                </TabItem>
              )}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  ),
};

/** Icon-only (keeps the counter) and label-only combinations. */
export const Content: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", gap: "var(--size-4)", alignItems: "center" }}>
      <TabItem selected icon={ICON} counter="0">
        Tab
      </TabItem>
      <TabItem selected icon={ICON}>
        Tab
      </TabItem>
      <TabItem selected counter="12">
        Tab
      </TabItem>
      <TabItem selected iconOnly icon={ICON} aria-label="Tab" />
      <TabItem selected iconOnly icon={ICON} counter="9" aria-label="Tab" />
    </div>
  ),
};
