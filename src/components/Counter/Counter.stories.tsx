import type { Meta, StoryObj } from "@storybook/react";

import Counter from "./Counter";

type StoryArgs = {
  value: string;
};

/**
 * Counter — a small 20px pill showing a count.
 */
const meta: Meta<StoryArgs> = {
  title: "Components/Counter",
  component: Counter,
  parameters: { layout: "centered" },
  args: { value: "0" },
  argTypes: {
    value: { control: { type: "text" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  render: ({ value }) => <Counter value={value} />,
};

/** A range of values. */
export const Examples: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", gap: "var(--size-3)", alignItems: "center" }}>
      {["0", "5", "42", "128", "999+"].map((v) => (
        <Counter key={v} value={v} />
      ))}
    </div>
  ),
};
