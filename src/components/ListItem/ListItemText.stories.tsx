import type { Meta, StoryObj } from "@storybook/react";

import ListItemText from "./ListItemText";
import ListItemTextRight from "./ListItemTextRight";
import { ListItemTextLines, ListItemTextVariant } from "./ListItemTextLeft.types";
import { ListItemTextRightVariant } from "./ListItemTextRight.types";
import { cap, LINES } from "../../stories/helpers";

type RightOption = "none" | ListItemTextRightVariant;

type StoryArgs = {
  variant: ListItemTextVariant;
  title: string;
  caption: string;
  titleLines: ListItemTextLines;
  captionLines: ListItemTextLines;
  right: RightOption;
};


const frame: React.CSSProperties = { width: 280 };

const rightNode = (option: RightOption) =>
  option === "none" ? undefined : option === "tag" ? (
    <ListItemTextRight variant="tag" tag="Tag" />
  ) : (
    <ListItemTextRight variant={option} title="Title" caption="Caption" />
  );

const meta: Meta<StoryArgs> = {
  title: "Components/ListItem/ListItemText",
  component: ListItemText,
  parameters: { layout: "centered" },
  args: { variant: "titleCaption", title: "Title", caption: "Caption", titleLines: 1, captionLines: 1, right: "none" },
  argTypes: {
    variant: { name: "left variant", options: ["title", "titleCaption", "titleCaptionReversed"], control: { type: "inline-radio" } },
    title: { type: "string", control: { type: "text" } },
    caption: { type: "string", control: { type: "text" } },
    titleLines: { options: LINES, control: { type: "inline-radio" } },
    captionLines: { options: LINES, control: { type: "inline-radio" } },
    right: { name: "right block", options: ["none", "title", "titleCaption", "titleCaptionReversed", "tag"], control: { type: "inline-radio" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  render: ({ variant, title, caption, titleLines, captionLines, right }) => (
    <div style={frame}>
      <ListItemText variant={variant} title={title} caption={caption} titleLines={titleLines} captionLines={captionLines} right={rightNode(right)} />
    </div>
  ),
};

/** Common combinations — the left text truncates first; the right never does. */
export const Combinations: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-6)", ...frame }}>
      <div>
        <span style={cap}>left only</span>
        <ListItemText variant="titleCaption" title="Title" caption="Caption" />
      </div>
      <div>
        <span style={cap}>left + right title</span>
        <ListItemText variant="titleCaption" title="Title" caption="Caption" right={<ListItemTextRight variant="title" title="Title" />} />
      </div>
      <div>
        <span style={cap}>left + tag</span>
        <ListItemText variant="titleCaption" title="Title" caption="Caption" right={<ListItemTextRight variant="tag" tag="Sep 21" />} />
      </div>
      <div>
        <span style={cap}>truncation — left gives way</span>
        <ListItemText variant="titleCaption" title="A very long job title that will truncate before the end" caption="A very long caption that also truncates" right={<ListItemTextRight variant="titleCaption" title="$1,240.00" caption="Sep 21" />} />
      </div>
    </div>
  ),
};
