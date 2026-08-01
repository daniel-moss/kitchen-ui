import type { Meta, StoryObj } from "@storybook/react";

import ListItemBody from "./ListItemBody";
import ListItemSlotIcon from "./ListItemSlotIcon";
import ListItemTextRight from "./ListItemTextRight";
import { ListItemTextLines, ListItemTextVariant } from "./ListItemTextLeft.types";
import Avatar from "../Avatar/Avatar";
import AvatarUser from "../Avatar/AvatarUser";
import AvatarGroup from "../Avatar/AvatarGroup";
import { AvatarGroupItem } from "../Avatar/AvatarGroup.types";
import IconButton from "../IconButton/IconButton";
import Button from "../Button/Button";
import Toggle from "../Toggle/Toggle";
import TabGroup from "../Tabs/TabGroup";
import TabItem from "../Tabs/TabItem";
import SelectField from "../Fields/SelectField/SelectField";
import { users } from "../../data/users";
import { cap, noop, LINES } from "../../stories/helpers";

type RightSlot = "none" | "iconOpen" | "iconOpenInSeparateTab" | "iconButton" | "button" | "tabStack" | "selectInput" | "toggle" | "userAvatar" | "liveUserAvatar" | "userAvatarStack";

type StoryArgs = {
  variant: ListItemTextVariant;
  title: string;
  caption: string;
  titleLines: ListItemTextLines;
  captionLines: ListItemTextLines;
  avatar: boolean;
  rightSlot: RightSlot;
};


const frame: React.CSSProperties = { width: 400 };

const objectAvatar = <Avatar type="object" content="icon" size="xl" />;
const groupItems: AvatarGroupItem[] = users.slice(0, 2).map((u) => ({ kind: "user", content: "image", imageSrc: u.avatar, name: u.name }));

const RIGHT_SLOTS: Record<Exclude<RightSlot, "none">, React.ReactNode> = {
  iconOpen: <ListItemSlotIcon icon="angle-right" />,
  iconOpenInSeparateTab: <ListItemSlotIcon icon="arrow-up-right" />,
  iconButton: <IconButton icon="diamonds-4" size="md" variant="ghost" aria-label="Action" onClick={noop} />,
  button: <Button variant="subtle" size="lg" onClick={noop}>Button</Button>,
  tabStack: (
    <TabGroup variant="contained" size="lg" defaultValue="a">
      <TabItem value="a">Tab</TabItem>
      <TabItem value="b">Tab</TabItem>
    </TabGroup>
  ),
  selectInput: <SelectField value="Value" fitContent />,
  toggle: <Toggle defaultChecked aria-label="Enable" />,
  userAvatar: <AvatarUser size="lg" content="image" />,
  liveUserAvatar: <Avatar type="live" content="image" size="lg" />,
  userAvatarStack: <AvatarGroup variation="inline" size="lg" items={groupItems} />,
};

const meta: Meta<StoryArgs> = {
  title: "Components/ListItem/ListItemBody",
  component: ListItemBody,
  parameters: { layout: "centered" },
  args: { variant: "titleCaption", title: "Title", caption: "Caption", titleLines: 1, captionLines: 1, avatar: true, rightSlot: "iconOpen" },
  argTypes: {
    variant: { name: "text variant", options: ["title", "titleCaption", "titleCaptionReversed"], control: { type: "inline-radio" } },
    title: { type: "string", control: { type: "text" } },
    caption: { type: "string", control: { type: "text" } },
    titleLines: { options: LINES, control: { type: "inline-radio" } },
    captionLines: { options: LINES, control: { type: "inline-radio" } },
    avatar: { control: { type: "boolean" } },
    rightSlot: { name: "right slot", options: ["none", "iconOpen", "iconOpenInSeparateTab", "iconButton", "button", "tabStack", "selectInput", "toggle", "userAvatar", "liveUserAvatar", "userAvatarStack"], control: { type: "select" } },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

export const Playground: Story = {
  render: ({ variant, title, caption, titleLines, captionLines, avatar, rightSlot }) => (
    <div style={frame}>
      <ListItemBody
        variant={variant}
        title={title}
        caption={caption}
        titleLines={titleLines}
        captionLines={captionLines}
        avatar={avatar ? objectAvatar : undefined}
        slotRight={rightSlot === "none" ? undefined : RIGHT_SLOTS[rightSlot]}
      />
    </div>
  ),
};

/** Every supported right-slot instance. */
export const Instances: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-5)", ...frame }}>
      {(Object.keys(RIGHT_SLOTS) as Exclude<RightSlot, "none">[]).map((key) => (
        <div key={key}>
          <span style={cap}>{key}</span>
          <ListItemBody variant="titleCaption" title="Title" caption="Caption" slotRight={RIGHT_SLOTS[key]} />
        </div>
      ))}
    </div>
  ),
};

/** Up to 3 instances, 8px apart; the slot centers on the 40px first row. */
export const MultipleInstances: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-5)", ...frame }}>
      <ListItemBody
        variant="titleCaption"
        title="Title"
        caption="Caption"
        avatar={objectAvatar}
        slotRight={
          <>
            <IconButton icon="pen" size="md" variant="ghost" aria-label="Edit" onClick={noop} />
            <ListItemSlotIcon icon="angle-right" />
          </>
        }
      />
      <ListItemBody
        variant="titleCaption"
        title="Title"
        caption="Caption"
        avatar={objectAvatar}
        slotRight={
          <>
            <AvatarUser size="lg" content="image" />
            <IconButton icon="pen" size="md" variant="ghost" aria-label="Edit" onClick={noop} />
            <ListItemSlotIcon icon="angle-right" />
          </>
        }
      />
      <ListItemBody
        variant="titleCaption"
        title="A very long title that will truncate before the end of the row"
        caption="Caption"
        right={<ListItemTextRight variant="tag" tag="Sep 21" />}
        slotRight={<ListItemSlotIcon icon="angle-right" />}
      />
    </div>
  ),
};
