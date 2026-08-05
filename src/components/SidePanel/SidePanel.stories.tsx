import { CSSProperties, ReactNode, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { DeviceFrame, docsFrame, noop } from "../../stories/helpers";
import AvatarEquipment from "../Avatar/AvatarEquipment";
import Button from "../Button/Button";
import Card from "../Card/Card";
import { Icon } from "../Icon/Icon";
import IconButton from "../IconButton/IconButton";
import ListItem from "../ListItem/ListItem";
import PopoverFooter from "../Popover/PopoverFooter";
import TabGroup from "../Tabs/TabGroup";
import TabItem from "../Tabs/TabItem";
import SidePanel from "./SidePanel";
import SidePanelNavigation from "./SidePanelNavigation";

const meta: Meta<typeof SidePanel> = {
  title: "Components/SidePanel/SidePanel",
  component: SidePanel,
  // fullscreen — the stage IS the story root and stands in for the app screen;
  // "padded" would inset it from the Canvas frame.
  parameters: { layout: "fullscreen" },
  args: {
    open: true,
    title: "Title",
    breakpoint: "desktop",
    state: "content",
    bodyPadded: true,
  },
  argTypes: {
    children: { control: false },
    nav: { control: false },
    footer: { control: false },
    avatar: { control: false },
    headerActions: { control: false },
    titleLeftSlot: { control: false },
    titleRightSlot: { control: false },
    captionLeftSlot: { control: false },
    captionRightSlot: { control: false },
    onClose: { control: false },
    onBack: { control: false },
    onRetry: { control: false },
    titleVariant: {
      options: [undefined, "title", "titleCaption", "titleCaptionReversed"],
      control: { type: "inline-radio" },
    },
    state: { options: ["content", "error", "offline"], control: { type: "inline-radio" } },
    breakpoint: { options: ["auto", "desktop", "mobile"], control: { type: "inline-radio" } },
  },
};
export default meta;

type Story = StoryObj<typeof SidePanel>;

// ---------------------------------------------------------------------------
// The stage: the story's own root, standing in for the app screen. It is the
// [data-drawer-root], so the panel renders inside it instead of covering the
// whole page — and it has NO chrome of its own (the Canvas block already draws
// the frame around it; a second bordered box inside would be a container in a
// container).
// ---------------------------------------------------------------------------
const STAGE_HEIGHT = 900;

const stage: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  height: STAGE_HEIGHT,
  background: "var(--surface-level-first)",
};

const Stage = ({ children }: { children: ReactNode }) => (
  <div data-drawer-root style={stage}>
    {children}
  </div>
);

// Shared example bits -------------------------------------------------------

const subSections = (
  <>
    <TabItem value="one">Sub-section 1</TabItem>
    <TabItem value="two">Sub-section 2</TabItem>
    <TabItem value="three">Sub-section 3</TabItem>
  </>
);

const footer = (
  <PopoverFooter>
    <Button size="lg" variant="solid" onClick={noop}>
      Primary
    </Button>
  </PopoverFooter>
);

// ---------------------------------------------------------------------------

export const Playground: Story = {
  render: (args) => (
    <Stage>
      <SidePanel {...args} onClose={noop}>
        {args.children}
      </SidePanel>
    </Stage>
  ),
  args: {
    nav: <SidePanelNavigation defaultValue="one">{subSections}</SidePanelNavigation>,
    footer,
    children: null,
  },
};

/** The full anatomy: header, navigation, body and footer. */
export const Hero: Story = {
  render: () => (
    <Stage>
      <SidePanel
        open
        breakpoint="desktop"
        title="Title"
        onClose={noop}
        nav={<SidePanelNavigation defaultValue="one">{subSections}</SidePanelNavigation>}
        footer={footer}
      >
        {null}
      </SidePanel>
    </Stage>
  ),
};

/** Header + body only — navigation and footer are both optional. */
export const Anatomy: Story = {
  render: () => (
    <Stage>
      <SidePanel open breakpoint="desktop" title="Title" onClose={noop}>
        {null}
      </SidePanel>
    </Stage>
  ),
};

/** With the optional footer, pinned to the bottom while the body scrolls. */
export const WithFooter: Story = {
  render: () => (
    <Stage>
      <SidePanel open breakpoint="desktop" title="Title" onClose={noop} footer={footer}>
        {null}
      </SidePanel>
    </Stage>
  ),
};

/** With the optional navigation, pinned under the header while the body scrolls. */
export const WithNavigation: Story = {
  render: () => (
    <Stage>
      <SidePanel
        open
        breakpoint="desktop"
        title="Title"
        onClose={noop}
        nav={<SidePanelNavigation defaultValue="one">{subSections}</SidePanelNavigation>}
      >
        {null}
      </SidePanel>
    </Stage>
  ),
};

/**
 * The header is a PopoverHeader, so everything it can carry is available here:
 * an xl avatar, a caption with its own slots, a title right slot, and up to two
 * ghost IconButtons as header actions.
 */
export const HeaderOptions: Story = {
  render: () => (
    <Stage>
      <SidePanel
        open
        breakpoint="desktop"
        title="Walk-in cooler"
        caption="Main kitchen"
        captionLeftSlot={<Icon icon="location-dot" size={12} />}
        avatar={<AvatarEquipment size="xl" />}
        headerActions={<IconButton variant="ghost" size="md" icon="arrow-up-right-from-square" aria-label="Open full page" />}
        onClose={noop}
      >
        {null}
      </SidePanel>
    </Stage>
  ),
};

/** Two navigation levels: each top section owns its own set of sub-sections. */
export const MultilevelNavigation: Story = {
  render: function MultilevelNavigationStory() {
    const [section, setSection] = useState("one");
    return (
      <Stage>
        <SidePanel
          open
          breakpoint="desktop"
          title="Title"
          onClose={noop}
          nav={
            <SidePanelNavigation
              key={section}
              defaultValue="one"
              topLevelValue={section}
              onTopLevelChange={setSection}
              topLevel={
                <>
                  <TabItem value="one">Section 1</TabItem>
                  <TabItem value="two">Section 2</TabItem>
                </>
              }
            >
              {section === "one" ? (
                subSections
              ) : (
                <>
                  <TabItem value="one">Sub-section 4</TabItem>
                  <TabItem value="two">Sub-section 5</TabItem>
                </>
              )}
            </SidePanelNavigation>
          }
        >
          {null}
        </SidePanel>
      </Stage>
    );
  },
};

/** Mobile: no margins, no scrim — the panel fills the screen. */
export const Mobile: Story = {
  render: () => (
    <div style={docsFrame}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <DeviceFrame statusBar homeIndicator pageText="App content behind the panel.">
          <SidePanel open breakpoint="mobile" title="Title" onClose={noop}>
            {null}
          </SidePanel>
        </DeviceFrame>
      </div>
    </div>
  ),
};

/**
 * Live: opening an object from inside the panel replaces the content of the
 * SAME panel and adds the back arrow. Click the Equipment card, then Back.
 */
export const NavigationLevels: Story = {
  render: function NavigationLevelsStory() {
    // The consumer owns the stack — SidePanel only renders the current entry.
    const [stack, setStack] = useState<string[]>(["Location side panel"]);
    const title = stack[stack.length - 1];
    const isLocation = stack.length === 1;

    return (
      <Stage>
        <SidePanel
          open
          breakpoint="desktop"
          title={title}
          onClose={noop}
          onBack={isLocation ? undefined : () => setStack((s) => s.slice(0, -1))}
        >
          {isLocation ? (
            <Card padding={4} onClick={() => setStack((s) => [...s, "Equipment side panel"])}>
              <ListItem
                variant="titleCaption"
                avatar={<AvatarEquipment size="xl" />}
                title="Walk-in cooler"
                caption="Kitchen · Model WIC-320"
              />
            </Card>
          ) : null}
        </SidePanel>
      </Stage>
    );
  },
};

/** The warning tab in the object navigation — inactive (left) and active (right). */
export const WarningTabs: Story = {
  render: () => (
    <div style={{ ...docsFrame, display: "flex", gap: "var(--size-20)", justifyContent: "center" }}>
      <TabItem variant="default" size="md" warning icon="warning" iconPack="solid">
        Details
      </TabItem>
      <TabItem variant="default" size="md" warning selected icon="warning" iconPack="solid">
        Details
      </TabItem>
    </div>
  ),
};

/** The warning tab on the top navigation level — inactive (top) and active (bottom). */
export const WarningTabsTopLevel: Story = {
  render: () => (
    <div style={{ ...docsFrame, display: "flex", flexDirection: "column", gap: "var(--size-20)" }}>
      <TabGroup variant="contained" size="lg" isFullWidth defaultValue="client">
        <TabItem value="location" warning icon="warning" iconPack="solid">
          Location
        </TabItem>
        <TabItem value="client">Client</TabItem>
      </TabGroup>
      <TabGroup variant="contained" size="lg" isFullWidth defaultValue="location">
        <TabItem value="location" warning icon="warning" iconPack="solid">
          Location
        </TabItem>
        <TabItem value="client">Client</TabItem>
      </TabGroup>
    </div>
  ),
};

/** Both levels point at the problem, so an inactive tab still shows it. */
export const WarningInPanel: Story = {
  render: () => (
    <Stage>
      <SidePanel
        open
        breakpoint="desktop"
        title="Title"
        onClose={noop}
        nav={
          <SidePanelNavigation
            defaultValue="details"
            topLevelDefaultValue="location"
            topLevel={
              <>
                <TabItem value="location" warning icon="warning" iconPack="solid">
                  Location
                </TabItem>
                <TabItem value="client">Client</TabItem>
              </>
            }
          >
            <TabItem value="details" warning icon="warning" iconPack="solid">
              Details
            </TabItem>
            <TabItem value="equipment">Equipment</TabItem>
            <TabItem value="jobs">Jobs</TabItem>
          </SidePanelNavigation>
        }
      >
        {null}
      </SidePanel>
    </Stage>
  ),
};

/** The data could not be fetched. Navigation and footer are hidden. */
export const ErrorState: Story = {
  render: () => (
    <Stage>
      <SidePanel open breakpoint="desktop" title="Title" state="error" onClose={noop} onRetry={noop} footer={footer}>
        {null}
      </SidePanel>
    </Stage>
  ),
};

/** The connection was lost. */
export const OfflineState: Story = {
  render: () => (
    <Stage>
      <SidePanel open breakpoint="desktop" title="Title" state="offline" onClose={noop} onRetry={noop} footer={footer}>
        {null}
      </SidePanel>
    </Stage>
  ),
};
