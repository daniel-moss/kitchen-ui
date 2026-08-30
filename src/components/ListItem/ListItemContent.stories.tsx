import type { Meta, StoryObj } from "@storybook/react";

import ListItemContent from "./ListItemContent";
import ListItemTextRight from "./ListItemTextRight";
import { ListItemTextLines, ListItemTextVariant } from "./ListItemTextLeft.types";
import Avatar from "../Avatar/Avatar";
import AvatarUser from "../Avatar/AvatarUser";
import AvatarLocation from "../Avatar/AvatarLocation";
import { cap, LINES } from "../../stories/helpers";

type StoryArgs = {
  variant: ListItemTextVariant;
  title: string;
  caption: string;
  titleLines: ListItemTextLines;
  captionLines: ListItemTextLines;
  avatar: boolean;
  rightTag: string;
};


const frame: React.CSSProperties = { width: 320 };

const objectAvatar = <Avatar shape="square" content="icon" size="xl" />;

const meta: Meta<StoryArgs> = {
  title: "Components/ListItem/ListItemContent",
  component: ListItemContent,
  parameters: { layout: "centered" },
  args: { variant: "titleCaption", title: "Title", caption: "Caption", titleLines: 1, captionLines: 1, avatar: true, rightTag: "" },
  argTypes: {
    variant: { name: "text variant", options: ["title", "titleCaption", "titleCaptionReversed"], control: { type: "inline-radio" } },
    title: { type: "string", control: { type: "text" } },
    caption: { type: "string", control: { type: "text" } },
    titleLines: { options: LINES, control: { type: "inline-radio" } },
    captionLines: { options: LINES, control: { type: "inline-radio" } },
    avatar: { control: { type: "boolean" } },
    rightTag: { name: "right tag (empty = none)", control: { type: "text" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  render: ({ variant, title, caption, titleLines, captionLines, avatar, rightTag }) => (
    <div style={frame}>
      <ListItemContent
        variant={variant}
        title={title}
        caption={caption}
        titleLines={titleLines}
        captionLines={captionLines}
        avatar={avatar ? objectAvatar : undefined}
        right={rightTag !== "" ? <ListItemTextRight variant="tag" tag={rightTag} /> : undefined}
      />
    </div>
  ),
};

/** With / without the avatar slot; any avatar type at xl. */
export const Combinations: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-6)", ...frame }}>
      <div>
        <span style={cap}>text only</span>
        <ListItemContent variant="titleCaption" title="Title" caption="Caption" />
      </div>
      <div>
        <span style={cap}>object avatar</span>
        <ListItemContent variant="titleCaption" title="Title" caption="Caption" avatar={objectAvatar} />
      </div>
      <div>
        <span style={cap}>user avatar + lone title</span>
        <ListItemContent variant="title" title="Title" avatar={<AvatarUser size="xl" content="image" />} />
      </div>
      <div>
        <span style={cap}>location avatar + right tag</span>
        <ListItemContent
          variant="titleCaption"
          title="123 Main Street, Suite 45"
          caption="Headquarters"
          avatar={<AvatarLocation size="xl" />}
          right={<ListItemTextRight variant="tag" tag="Sep 21" />}
        />
      </div>
      <div>
        <span style={cap}>truncation</span>
        <ListItemContent
          variant="titleCaption"
          title="A very long title that will truncate before the end of the row"
          caption="A very long caption that will also truncate"
          avatar={objectAvatar}
          right={<ListItemTextRight variant="tag" tag="$1,240.00" />}
        />
      </div>
    </div>
  ),
};
