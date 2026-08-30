import type { Meta, StoryObj } from "@storybook/react";

import AvatarLive from "./AvatarLive";
import { AvatarLiveColor, AvatarLiveSize } from "./AvatarLive.types";
import { users, initials } from "../../data/users";

const SIZES: AvatarLiveSize[] = ["md", "lg", "xl"];
const COLORS: AvatarLiveColor[] = [
  "crimson",
  "pink",
  "plum",
  "violet",
  "indigo",
  "blue",
  "cyan",
  "teal",
  "orange",
  "amber",
];

/**
 * AvatarLive — an Avatar template: a circle avatar inside a colored
 * collaboration ring (2px ring, 2px gap). md/lg/xl only.
 */
const meta: Meta<typeof AvatarLive> = {
  title: "Components/Avatar/AvatarLive",
  component: AvatarLive,
  parameters: { layout: "centered" },
  args: { size: "md", content: "image", color: "crimson", characters: "AB", count: 2 },
  argTypes: {
    size: { options: SIZES, control: { type: "inline-radio" } },
    content: { options: ["image", "letters", "counter"], control: { type: "inline-radio" } },
    color: { options: COLORS, control: { type: "select" } },
    characters: { if: { arg: "content", eq: "letters" } },
    imageSrc: { if: { arg: "content", eq: "image" } },
    count: { control: { type: "number" }, if: { arg: "content", eq: "counter" } },
  },
};
export default meta;

type Story = StoryObj<typeof AvatarLive>;

const labelStyle: React.CSSProperties = {
  font: "var(--font-caption-medium-500)",
  color: "var(--text-subtle)",
};

const column = (label: string, node: React.ReactNode) => (
  <div
    key={label}
    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--size-2)" }}
  >
    {node}
    <span style={labelStyle}>{label}</span>
  </div>
);

export const Playground: Story = {};

/**
 * The three sizes. The avatar inside is two size steps smaller than the outer
 * box — 28 holds a 20, 32 holds a 24, 36 holds a 28.
 */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--size-5)" }}>
      {SIZES.map((s, i) => column(s, <AvatarLive size={s} imageSrc={users[i].avatar} />))}
    </div>
  ),
};

/** Every ring color — the ten `--live-collaboration-*` tokens. */
export const Colors: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--size-4)", maxWidth: 360 }}>
      {COLORS.map((c, i) => column(c, <AvatarLive size="xl" color={c} imageSrc={users[i].avatar} />))}
    </div>
  ),
};

/**
 * Content. Letters use the inner avatar's own size, so md shows one letter and
 * lg/xl show two. The counter is the group's overflow slot — it fills the whole
 * box and has no ring.
 */
export const Content: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--size-5)" }}>
      {column("image", <AvatarLive size="xl" imageSrc={users[0].avatar} />)}
      {column("letters md", <AvatarLive size="md" content="letters" characters={initials(users[1])} />)}
      {column("letters xl", <AvatarLive size="xl" content="letters" characters={initials(users[2])} />)}
      {column("counter", <AvatarLive size="xl" content="counter" count={3} />)}
    </div>
  ),
};
