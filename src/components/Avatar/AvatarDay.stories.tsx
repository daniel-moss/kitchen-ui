import { ReactNode } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { docsFrame } from "../../stories/helpers";

import AvatarDay from "./AvatarDay";
import { AvatarDayColorScheme } from "./AvatarDay.types";

const SCHEMES: AvatarDayColorScheme[] = [
  "gray",
  "brown",
  "amber",
  "orange",
  "tomato",
  "crimson",
  "pink",
  "plum",
  "violet",
  "indigo",
  "blue",
  "cyan",
  "teal",
  "jade",
];

// The docs preview frame: the examples sit centered inside it (mirrors the
// Figma Documentation "Preview" frames).
const frame = (node: ReactNode) => (
  <div style={docsFrame}>
    <div style={{ display: "flex", justifyContent: "center" }}>{node}</div>
  </div>
);

/**
 * AvatarDay — a date shown as an avatar-sized calendar page: the month on a
 * colored strip, the day in a light container below. One size only (36px).
 */
const meta: Meta<typeof AvatarDay> = {
  title: "Components/Avatar/AvatarDay",
  component: AvatarDay,
  // fullscreen — the docs stories' own `docsFrame` provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: { colorScheme: "gray", month: "JAN", day: 1, isLoading: false },
  argTypes: {
    colorScheme: { options: SCHEMES, control: { type: "select" } },
    month: { control: { type: "text" } },
    day: { control: { type: "text" } },
  },
};
export default meta;

type Story = StoryObj<typeof AvatarDay>;

export const Playground: Story = {
  render: (args) => frame(<AvatarDay {...args} />),
};

/** The default tile: gray scheme, month above the day. */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: () => frame(<AvatarDay />),
};

/** Every color scheme. Only the tile fill and the two text colors change. */
export const ColorSchemes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--size-10)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {SCHEMES.map((scheme) => (
          <AvatarDay key={scheme} colorScheme={scheme} />
        ))}
      </div>
    </div>
  ),
};

// The months as the Figma documentation writes them — mixed casing on purpose:
// whatever comes in, the tile renders three uppercase letters.
const MONTHS = ["JAN", "FEB", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "nov", "Dec"];

/** The month slot: the first three letters only, always uppercase. */
export const Months: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--size-10)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {MONTHS.map((month) => (
          <AvatarDay key={month} month={month} />
        ))}
      </div>
    </div>
  ),
};

/** The day slot fits two digits. */
export const Days: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={docsFrame}>
      <div style={{ display: "flex", gap: "var(--size-10)", justifyContent: "center" }}>
        <AvatarDay day={1} />
        <AvatarDay day={31} />
      </div>
    </div>
  ),
};

/** Loading — the generic Avatar skeleton, same box and corners. */
export const Loading: Story = {
  parameters: { controls: { disable: true } },
  render: () => frame(<AvatarDay isLoading />),
};
