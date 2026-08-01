import type { Meta, StoryObj } from "@storybook/react";

import ListItemTextLeft from "./ListItemTextLeft";
import { ListItemTextLines, ListItemTextVariant } from "./ListItemTextLeft.types";
import { cap, LINES } from "../../stories/helpers";

type StoryArgs = {
  variant: ListItemTextVariant;
  title: string;
  caption: string;
  titleLines: ListItemTextLines;
  captionLines: ListItemTextLines;
};

const frame: React.CSSProperties = { width: 240 };

const meta: Meta<StoryArgs> = {
  title: "Components/ListItem/ListItemTextLeft",
  component: ListItemTextLeft,
  parameters: { layout: "centered" },
  args: { variant: "title", title: "Title", caption: "Caption", titleLines: 1, captionLines: 1 },
  argTypes: {
    variant: { options: ["title", "titleCaption", "titleCaptionReversed"], control: { type: "inline-radio" } },
    title: { type: "string", control: { type: "text" } },
    caption: { type: "string", control: { type: "text" } },
    titleLines: { options: LINES, control: { type: "inline-radio" } },
    captionLines: { options: LINES, control: { type: "inline-radio" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  render: (args) => (
    <div style={frame}>
      <ListItemTextLeft {...args} />
    </div>
  ),
};

/** The three layouts; both lines truncate. */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-6)", ...frame }}>
      <div>
        <span style={cap}>title</span>
        <ListItemTextLeft variant="title" title="Title" />
      </div>
      <div>
        <span style={cap}>titleCaption</span>
        <ListItemTextLeft variant="titleCaption" title="Title" caption="Caption" />
      </div>
      <div>
        <span style={cap}>titleCaptionReversed</span>
        <ListItemTextLeft variant="titleCaptionReversed" title="Title" caption="Caption" />
      </div>
      <div>
        <span style={cap}>truncation</span>
        <ListItemTextLeft variant="titleCaption" title="A very long title that will truncate before the end" caption="A very long caption that will also truncate before the end" />
      </div>
    </div>
  ),
};

const LONG = "A very long title that keeps going well past the available width of the list item row";

/** Truncation rules — 1 (default) / 2 / 3 lines with a full-text hover tooltip, or wrap. */
export const TruncationRules: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-6)", ...frame }}>
      {LINES.map((rule) => (
        <div key={String(rule)}>
          <span style={cap}>{rule === "wrap" ? "wrap (never truncates)" : `${rule} line${rule === 1 ? "" : "s"} — hover for tooltip`}</span>
          <ListItemTextLeft variant="title" title={LONG} titleLines={rule} />
        </div>
      ))}
    </div>
  ),
};
