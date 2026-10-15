import { ReactNode } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { docsFrame } from "../../stories/helpers";

import AvatarVendor from "./AvatarVendor";
import { AvatarVendorAddOn } from "./AvatarVendor.types";
import { AvatarSize } from "./Avatar.types";

const SIZES: AvatarSize[] = ["xxs", "xs", "sm", "md", "lg", "xl"];
// `preferred` has no xxs (Avatar has no icon addOn there).
const PREFERRED_SIZES = SIZES.filter((s) => s !== "xxs");
const ADD_ONS: AvatarVendorAddOn[] = ["none", "active", "inactive", "preferred"];

// The docs preview frame: the examples sit centred in one row, 32px apart
// (mirrors the Figma Documentation "Preview" frames).
const frame = (node: ReactNode) => (
  <div style={docsFrame}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--size-8)" }}>
      {node}
    </div>
  </div>
);

const row = (content: "icon" | "image", addOn: AvatarVendorAddOn, sizes = SIZES) =>
  frame(
    <>
      {sizes.map((size) => (
        <AvatarVendor key={size} size={size} content={content} addOn={addOn} />
      ))}
    </>,
  );

/**
 * AvatarVendor — an Avatar template: object avatar with the `vendor` semantic
 * icon (or an image), and an `addOn` — a statusDot for active / inactive, or
 * the amber crown for a preferred vendor.
 */
const meta: Meta<typeof AvatarVendor> = {
  title: "Components/Avatar/AvatarVendor",
  component: AvatarVendor,
  // fullscreen — the docs stories' own `docsFrame` provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: { size: "md", content: "icon", addOn: "none" },
  argTypes: {
    size: { options: SIZES, control: { type: "select" } },
    content: { options: ["icon", "image"], control: { type: "inline-radio" } },
    addOn: { options: ADD_ONS, control: { type: "select" } },
    imageSrc: { if: { arg: "content", eq: "image" } },
  },
};

export default meta;

type Story = StoryObj<typeof AvatarVendor>;

export const Playground: Story = {
  parameters: { layout: "centered" },
};

const docs: Partial<Story> = { parameters: { controls: { disable: true } } };

/** The hero: xl, icon content, no addOn. */
export const Hero: Story = { ...docs, render: () => frame(<AvatarVendor size="xl" />) };

/** Content — the uploaded logo, every size. */
export const ContentImage: Story = { ...docs, render: () => row("image", "none") };
/** Content — the generic vendor icon, every size. */
export const ContentIcon: Story = { ...docs, render: () => row("icon", "none") };

/** addOn active — the jade statusDot. */
export const ActiveImage: Story = { ...docs, render: () => row("image", "active") };
export const ActiveIcon: Story = { ...docs, render: () => row("icon", "active") };

/** addOn inactive — the gray statusDot. */
export const InactiveImage: Story = { ...docs, render: () => row("image", "inactive") };
export const InactiveIcon: Story = { ...docs, render: () => row("icon", "inactive") };

/** addOn preferred — the amber crown. No xxs. */
export const PreferredImage: Story = { ...docs, render: () => row("image", "preferred", PREFERRED_SIZES) };
export const PreferredIcon: Story = { ...docs, render: () => row("icon", "preferred", PREFERRED_SIZES) };

/** Loading — the generic variant: icon content, no addOn. */
export const Loading: Story = { ...docs, render: () => row("icon", "none") };
