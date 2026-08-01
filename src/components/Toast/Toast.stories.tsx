import type { Meta, StoryObj } from "@storybook/react";

import { cap, noop } from "../../stories/helpers";
import Toast from "./Toast";
import { ToastProps, ToastType } from "./Toast.types";

const TYPES: ToastType[] = ["neutral", "processing", "success", "informative", "warning", "error"];

type StoryArgs = {
  type: ToastType;
  variant: "default" | "detailed";
  title: string;
  caption: string;
  withCta: boolean;
  withSecondaryCta: boolean;
  isDismissible: boolean;
  icon?: string;
};

/**
 * Toast — shows the system's response. Default = a one-row chip with an
 * optional action; detailed = a copy block with a caption and up to two CTAs.
 * Icon + title color are fixed per type; only neutral takes a custom icon.
 * This is the visual chip — the Toaster (positioning, stacking, auto-dismiss)
 * is a separate upcoming component.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Toast/Toast",
  component: Toast as never,
  parameters: { layout: "centered" },
  args: {
    type: "neutral",
    variant: "default",
    title: "Title",
    caption: "Caption",
    withCta: true,
    withSecondaryCta: true,
    isDismissible: true,
    icon: undefined,
  },
  argTypes: {
    type: { options: TYPES, control: { type: "inline-radio" } },
    variant: { options: ["default", "detailed"], control: { type: "inline-radio" } },
    caption: { if: { arg: "variant", eq: "detailed" } },
    withSecondaryCta: { if: { arg: "variant", eq: "detailed" } },
    icon: { if: { arg: "type", eq: "neutral" }, control: { type: "text" } },
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

const toArgs = (a: StoryArgs): ToastProps =>
  a.variant === "detailed"
    ? {
        type: a.type,
        variant: "detailed",
        title: a.title,
        caption: a.caption || undefined,
        cta: a.withCta ? { children: "Primary", onClick: noop } : undefined,
        secondaryCta: a.withCta && a.withSecondaryCta ? { children: "Secondary", onClick: noop } : undefined,
        isDismissible: a.isDismissible,
        icon: a.icon || undefined,
      }
    : {
        type: a.type,
        title: a.title,
        cta: a.withCta ? { children: "Action", onClick: noop } : undefined,
        isDismissible: a.isDismissible,
        icon: a.icon || undefined,
      };

export const Playground: Story = {
  render: (args) => <Toast {...toArgs(args)} />,
};

/** All six types — default and detailed (the Figma component grid). */
export const Overview: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {TYPES.map((type) => (
        <div key={type} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={cap}>{type}</span>
          <Toast type={type} title="Title" cta={{ children: "Action", onClick: noop }} />
          <Toast
            type={type}
            variant="detailed"
            title="Title"
            caption="Caption"
            cta={{ children: "Primary", onClick: noop }}
            secondaryCta={{ children: "Secondary", onClick: noop }}
          />
        </div>
      ))}
    </div>
  ),
};

/** Optional parts: no CTA, no dismiss, bare title (the docs anatomy rows). */
export const Anatomy: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Toast type="neutral" title="Title" cta={{ children: "Action", onClick: noop }} />
      <Toast type="neutral" title="Title" />
      <Toast type="neutral" title="Title" isDismissible={false} />
      <Toast type="neutral" title="Title" cta={{ children: "Action", onClick: noop }} isDismissible={false} />
      <Toast type="neutral" variant="detailed" title="Title" caption="Caption" />
      <Toast type="neutral" variant="detailed" title="Title" caption="Caption" isDismissible={false} />
    </div>
  ),
};

/** Both title and caption wrap when they do not fit one line (the docs). */
export const TextWrap: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Toast
        type="neutral"
        title="My name is toast. I'm a pretty large guy. I take more than 1 line."
        cta={{ children: "Action", onClick: noop }}
      />
      <Toast
        type="neutral"
        variant="detailed"
        title="Invitation for daniel.moss@roopairs.com has been resent."
        caption="Please check both inbox and spam folders to make sure that you've got an email."
        cta={{ children: "Primary", onClick: noop }}
        secondaryCta={{ children: "Secondary", onClick: noop }}
      />
    </div>
  ),
};
