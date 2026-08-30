import { ReactNode } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { docsFrame } from "../../stories/helpers";

import { AvatarSize } from "./Avatar.types";
import AvatarWarning from "./AvatarWarning";

const SIZES: AvatarSize[] = ["xxs", "xs", "sm", "md", "lg", "xl"];

// The docs preview frame: the examples sit centered inside it (mirrors the
// Figma Documentation "Preview" frames).
const frame = (node: ReactNode) => (
  <div style={docsFrame}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--size-8)" }}>
      {node}
    </div>
  </div>
);

/**
 * AvatarWarning — an Avatar template: an object/icon avatar with the solid
 * warning glyph, filled `--amber-a3` with an `--amber-a11` icon.
 */
const meta: Meta<typeof AvatarWarning> = {
  title: "Components/Avatar/AvatarWarning",
  component: AvatarWarning,
  // fullscreen — the docs stories' own `docsFrame` provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: { size: "md", isLoading: false },
  argTypes: {
    size: { options: SIZES, control: { type: "select" } },
  },
};
export default meta;

type Story = StoryObj<typeof AvatarWarning>;

export const Playground: Story = {
  render: (args) => frame(<AvatarWarning {...args} />),
};

/** The default template, here at `xl`. */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: () => frame(<AvatarWarning size="xl" />),
};

/** Every size Avatar supports, xxs → xl. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    frame(
      <>
        {SIZES.map((size) => (
          <AvatarWarning key={size} size={size} />
        ))}
      </>,
    ),
};

/** Loading — the generic Avatar skeleton, with no amber fill or icon. */
export const Loading: Story = {
  parameters: { controls: { disable: true } },
  render: () => frame(<AvatarWarning size="xl" isLoading />),
};
