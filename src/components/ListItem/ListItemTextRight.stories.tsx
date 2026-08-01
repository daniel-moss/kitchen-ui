import type { Meta, StoryObj } from "@storybook/react";

import ListItemTextRight from "./ListItemTextRight";
import { ListItemTextRightVariant } from "./ListItemTextRight.types";
import { cap } from "../../stories/helpers";

type StoryArgs = {
  variant: ListItemTextRightVariant;
  title: string;
  caption: string;
  tag: string;
};

const frame: React.CSSProperties = { width: 240, display: "flex", flexDirection: "column", alignItems: "flex-end" };

const meta: Meta<StoryArgs> = {
  title: "Components/ListItem/ListItemTextRight",
  component: ListItemTextRight,
  parameters: { layout: "centered" },
  args: { variant: "title", title: "Title", caption: "Caption", tag: "Tag" },
  argTypes: {
    variant: { options: ["title", "titleCaption", "titleCaptionReversed", "tag"], control: { type: "inline-radio" } },
    title: { type: "string", control: { type: "text" } },
    caption: { type: "string", control: { type: "text" } },
    tag: { type: "string", control: { type: "text" }, if: { arg: "variant", eq: "tag" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  render: (args) => (
    <div style={frame}>
      <ListItemTextRight {...args} />
    </div>
  ),
};

/** The four layouts — right-aligned, hugging their content. */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-6)", width: 240 }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={cap}>title</span>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <ListItemTextRight variant="title" title="Title" />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={cap}>titleCaption</span>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <ListItemTextRight variant="titleCaption" title="Title" caption="Caption" />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={cap}>titleCaptionReversed</span>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <ListItemTextRight variant="titleCaptionReversed" title="Title" caption="Caption" />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={cap}>tag</span>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <ListItemTextRight variant="tag" tag="Tag" />
        </div>
      </div>
    </div>
  ),
};
