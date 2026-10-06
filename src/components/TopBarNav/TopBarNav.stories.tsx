import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { DocsFrame, noop } from "../../stories/helpers";
import { Do, DoDont, Dont } from "../../stories/DoDont";
import Avatar from "../Avatar/Avatar";
import AvatarGroup from "../Avatar/AvatarGroup";
import { AvatarGroupItem } from "../Avatar/AvatarGroup.types";
import Button from "../Button/Button";
import IconButton from "../IconButton/IconButton";
import TabGroup from "../Tabs/TabGroup";
import TabItem from "../Tabs/TabItem";
import TopBarNav from "./TopBarNav";
import TopBarNavLeftElements from "./TopBarNavLeftElements";
import TopBarNavRightElements from "./TopBarNavRightElements";
import TopBarNavTitle from "./TopBarNavTitle";

const LIVE: AvatarGroupItem[] = [
  { kind: "live", name: "Aisa Donovan" },
  { kind: "live", name: "Amy Lowery" },
];

const LIVE_MANY: AvatarGroupItem[] = [
  ...LIVE,
  { kind: "live", name: "Zara Mcneil" },
  { kind: "live", name: "Ismaeel Landry" },
  { kind: "live", name: "Camalla Robinson" },
];

/**
 * TopBarNav — the page's top navigation bar: an optional back button, the title
 * with its two slots, and an optional group of actions at the right end, over a
 * Divider. One 60px row, always the same height.
 */
const meta: Meta<typeof TopBarNav> = {
  title: "Components/TopBarNav",
  component: TopBarNav,
  // fullscreen — the docs stories' DocsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof TopBarNav>;

// ---- placeholder content, the way the Figma previews draw it ---------------

/** The generic avatar: square, the diamonds-4 placeholder glyph, md (28px). */
const AVATAR = <Avatar size="md" />;

/** The placeholder action — an icon button with the diamonds-4 glyph. */
const action = (key: string) => (
  <IconButton key={key} icon="diamonds-4" variant="ghost" size="lg" aria-label="Action" onClick={noop} />
);

/** A preview's placeholder tabs — two tabs reading "Label". */
const PlaceholderTabs = () => {
  const [tab, setTab] = useState("one");
  return (
    <TabGroup value={tab} onChange={setTab}>
      <TabItem value="one">Label</TabItem>
      <TabItem value="two">Label</TabItem>
    </TabGroup>
  );
};

/** The phase tabs of a real list — what belongs beside the title. */
const PhaseTabs = () => {
  const [tab, setTab] = useState("open");
  return (
    <TabGroup value={tab} onChange={setTab}>
      <TabItem value="open">Open</TabItem>
      <TabItem value="closed">Closed</TabItem>
    </TabGroup>
  );
};

/** The section navigation of a details page — what does NOT belong in the bar. */
const SectionTabs = () => {
  const [tab, setTab] = useState("service");
  return (
    <TabGroup value={tab} onChange={setTab}>
      <TabItem value="service">Service</TabItem>
      <TabItem value="timesheet">Timesheet</TabItem>
      <TabItem value="summary">Summary</TabItem>
      <TabItem value="activity">Activity</TabItem>
    </TabGroup>
  );
};

// ---- stories ---------------------------------------------------------------

/** Every slot filled: back, avatar, title, live users, two actions. */
export const Playground: Story = {
  parameters: { layout: "centered" },
  args: { breakpoint: "desktop" },
  render: (args) => (
    <TopBarNav {...args} liveUsers={LIVE} actions={[action("a"), action("b")]}>
      <TopBarNavLeftElements onBack={noop} breakpoint="desktop">
        <TopBarNavTitle title="Title" slotLeft={AVATAR} />
      </TopBarNavLeftElements>
    </TopBarNav>
  ),
};

/** The hero: the fullest bar. */
export const Hero: Story = {
  render: () => (
    <DocsFrame>
      <TopBarNav breakpoint="desktop" liveUsers={LIVE} actions={[action("a"), action("b")]}>
        <TopBarNavLeftElements onBack={noop} breakpoint="desktop">
          <TopBarNavTitle title="Title" slotLeft={AVATAR} />
        </TopBarNavLeftElements>
      </TopBarNav>
    </DocsFrame>
  ),
};

/** Anatomy: every part the section names, in one bar. */
export const Anatomy: Story = {
  render: () => (
    <DocsFrame>
      <TopBarNav breakpoint="desktop" liveUsers={LIVE} actions={action("a")}>
        <TopBarNavLeftElements onBack={noop} breakpoint="desktop">
          <TopBarNavTitle title="Title" slotLeft={AVATAR} />
        </TopBarNavLeftElements>
      </TopBarNav>
    </DocsFrame>
  ),
};

/** Phase tabs beside the title, against a section row crammed into the bar. */
export const TabsDoDont: Story = {
  render: () => (
    <DoDont>
      <Do caption="Phase tabs beside the title — two short tabs that switch what the list shows">
        <TopBarNav breakpoint="desktop" tabs={<PhaseTabs />}>
          <TopBarNavLeftElements>
            <TopBarNavTitle title="Jobs" />
          </TopBarNavLeftElements>
        </TopBarNav>
      </Do>
      <Dont caption="Section navigation inside the bar — a details page's sections belong to their own bar below it">
        <TopBarNav breakpoint="desktop" tabs={<SectionTabs />}>
          <TopBarNavLeftElements onBack={noop} breakpoint="desktop">
            <TopBarNavTitle title="JOB-10001" />
          </TopBarNavLeftElements>
        </TopBarNav>
      </Dont>
    </DoDont>
  ),
};

/** Live users beside the title, against live users among the actions. */
export const LiveUsersDoDont: Story = {
  render: () => (
    <DoDont>
      <Do caption="Live users beside the title, where the page says who is on it">
        <TopBarNav breakpoint="desktop" liveUsers={LIVE}>
          <TopBarNavLeftElements onBack={noop} breakpoint="desktop">
            <TopBarNavTitle title="JOB-10001" />
          </TopBarNavLeftElements>
        </TopBarNav>
      </Do>
      <Dont caption="Live users among the actions at the right end — that end is for things the user presses">
        <TopBarNav breakpoint="desktop" actions={<AvatarGroup variation="inline" size="xl" items={LIVE} />}>
          <TopBarNavLeftElements onBack={noop} breakpoint="desktop">
            <TopBarNavTitle title="JOB-10001" />
          </TopBarNavLeftElements>
        </TopBarNav>
      </Dont>
    </DoDont>
  ),
};

/** A page reached from the sidebar — no step back. */
export const BackButtonOff: Story = {
  render: () => (
    <DocsFrame>
      <TopBarNav breakpoint="desktop">
        <TopBarNavLeftElements>
          <TopBarNavTitle title="Title" />
        </TopBarNavLeftElements>
      </TopBarNav>
    </DocsFrame>
  ),
};

/** A page opened from another one — the back button leads to it. */
export const BackButtonOn: Story = {
  render: () => (
    <DocsFrame>
      <TopBarNav breakpoint="desktop">
        <TopBarNavLeftElements onBack={noop} breakpoint="desktop">
          <TopBarNavTitle title="Title" />
        </TopBarNavLeftElements>
      </TopBarNav>
    </DocsFrame>
  ),
};

/** The title alone. */
export const Title: Story = {
  render: () => (
    <DocsFrame>
      <TopBarNav breakpoint="desktop">
        <TopBarNavLeftElements>
          <TopBarNavTitle title="Title" />
        </TopBarNavLeftElements>
      </TopBarNav>
    </DocsFrame>
  ),
};

/** The avatar slot — any avatar type, always md. */
export const AvatarSlot: Story = {
  render: () => (
    <DocsFrame>
      <TopBarNav breakpoint="desktop">
        <TopBarNavLeftElements>
          <TopBarNavTitle title="Title" slotLeft={AVATAR} />
        </TopBarNavLeftElements>
      </TopBarNav>
    </DocsFrame>
  ),
};

/** The tabs, beside the title. */
export const Tabs: Story = {
  render: () => (
    <DocsFrame>
      <TopBarNav breakpoint="desktop" tabs={<PlaceholderTabs />}>
        <TopBarNavLeftElements>
          <TopBarNavTitle title="Title" />
        </TopBarNavLeftElements>
      </TopBarNav>
    </DocsFrame>
  ),
};

/** The live users, in the same place. */
export const LiveUsers: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-20)" }}>
        <TopBarNav breakpoint="desktop" liveUsers={[LIVE[0]!]}>
          <TopBarNavLeftElements>
            <TopBarNavTitle title="Title" />
          </TopBarNavLeftElements>
        </TopBarNav>
        <TopBarNav breakpoint="desktop" liveUsers={LIVE_MANY}>
          <TopBarNavLeftElements>
            <TopBarNavTitle title="Title" />
          </TopBarNavLeftElements>
        </TopBarNav>
      </div>
    </DocsFrame>
  ),
};

/** One action at the right end. */
export const ActionsOne: Story = {
  render: () => (
    <DocsFrame>
      <TopBarNav breakpoint="desktop" actions={action("a")}>
        <TopBarNavLeftElements>
          <TopBarNavTitle title="Title" />
        </TopBarNavLeftElements>
      </TopBarNav>
    </DocsFrame>
  ),
};

/** Three, the most the row takes. */
export const ActionsThree: Story = {
  render: () => (
    <DocsFrame>
      <TopBarNav breakpoint="desktop" actions={[action("a"), action("b"), action("c")]}>
        <TopBarNavLeftElements>
          <TopBarNavTitle title="Title" />
        </TopBarNavLeftElements>
      </TopBarNav>
    </DocsFrame>
  ),
};

/** A button with a label. */
export const ActionsButton: Story = {
  render: () => (
    <DocsFrame>
      <TopBarNav
        breakpoint="desktop"
        actions={
          <Button variant="solid" size="lg" onClick={noop}>
            Button
          </Button>
        }
      >
        <TopBarNavLeftElements>
          <TopBarNavTitle title="Title" />
        </TopBarNavLeftElements>
      </TopBarNav>
    </DocsFrame>
  ),
};

/** An icon-only button. */
export const ActionsIconButton: Story = {
  render: () => (
    <DocsFrame>
      <TopBarNav breakpoint="desktop" actions={action("a")}>
        <TopBarNavLeftElements>
          <TopBarNavTitle title="Title" />
        </TopBarNavLeftElements>
      </TopBarNav>
    </DocsFrame>
  ),
};

/** The list helper on desktop: search, then the labelled create button. */
export const ActionsList: Story = {
  render: () => (
    <DocsFrame>
      <TopBarNav
        breakpoint="desktop"
        actions={<TopBarNavRightElements onSearch={noop} onCreate={noop} breakpoint="desktop" />}
      >
        <TopBarNavLeftElements>
          <TopBarNavTitle title="Jobs" />
        </TopBarNavLeftElements>
      </TopBarNav>
    </DocsFrame>
  ),
};

/** The same helper on mobile: no search, and create becomes an icon button. */
export const ActionsListMobile: Story = {
  render: () => (
    <DocsFrame>
      <TopBarNav
        breakpoint="mobile"
        actions={<TopBarNavRightElements onSearch={noop} onCreate={noop} breakpoint="mobile" />}
      >
        <TopBarNavLeftElements>
          <TopBarNavTitle title="Jobs" />
        </TopBarNavLeftElements>
      </TopBarNav>
    </DocsFrame>
  ),
};

/** Loading, on a page with no step back. */
export const Loading: Story = {
  render: () => (
    <DocsFrame>
      <TopBarNav breakpoint="desktop" isLoading tabs={<PlaceholderTabs />} actions={action("a")}>
        <TopBarNavLeftElements>
          <TopBarNavTitle title="Title" />
        </TopBarNavLeftElements>
      </TopBarNav>
    </DocsFrame>
  ),
};

/** Loading, with the back button — it is navigation, not data. */
export const LoadingWithBack: Story = {
  render: () => (
    <DocsFrame>
      <TopBarNav breakpoint="desktop" isLoading liveUsers={LIVE} actions={action("a")}>
        <TopBarNavLeftElements onBack={noop} breakpoint="desktop">
          <TopBarNavTitle title="Title" slotLeft={AVATAR} />
        </TopBarNavLeftElements>
      </TopBarNav>
    </DocsFrame>
  ),
};
