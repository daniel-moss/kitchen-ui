import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { cap, DeviceFrame, DocsFrame, noop } from "../../stories/helpers";
import AvatarClient from "../Avatar/AvatarClient";
import { AvatarGroupItem } from "../Avatar/AvatarGroup.types";
import AvatarJob from "../Avatar/AvatarJob";
import AvatarUser from "../Avatar/AvatarUser";
import { Icon } from "../Icon/Icon";
import MenuItem from "../Menu/MenuItem";
import MenuItemGroup from "../Menu/MenuItemGroup";
import TabGroup from "../Tabs/TabGroup";
import TabItem from "../Tabs/TabItem";
import TopBarNav from "./TopBarNav";
import TopBarNavLeftElements from "./TopBarNavLeftElements";
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

const SUB_PAGES = [
  { id: "requests", label: "Requests" },
  { id: "jobs", label: "Jobs" },
  { id: "series", label: "Series" },
];

const meta: Meta<typeof TopBarNav> = {
  title: "Components/TopBarNav",
  component: TopBarNav,
  // fullscreen — the stories' own DocsFrame provides the (only) padding.
  parameters: { layout: "fullscreen" },
  // TopBarNavProps is a union — react-docgen can't read JSDoc off it, so the
  // table is declared by hand (the ListItem pattern). Keep it in step with
  // TopBarNav.types.ts.
  argTypes: {
    children: {
      control: false,
      description: "The left side — a `TopBarNavLeftElements` assembly.",
      table: { type: { summary: "ReactNode" } },
    },
    variant: {
      control: false,
      description:
        "`list` for object lists (title + phase tabs; search + create on the right), `details` for object details pages (navigation tabs + live users), `inner` for inner pages (back + title only).",
      table: { type: { summary: '"list" | "details" | "inner"' }, defaultValue: { summary: '"list"' } },
    },
    tabs: {
      control: false,
      description:
        "A `TabGroup` element (`default` / `lg` — the bar defaults the size via context). List: inline, both breakpoints. Details: inline on desktop; a second 60px bar row on mobile that hides while scrolling down.",
      table: { type: { summary: "ReactNode" } },
    },
    onSearch: {
      control: false,
      description: 'List, DESKTOP only: the "Object search" IconButton. Shown when set.',
      table: { type: { summary: "() => void" } },
    },
    onCreate: {
      control: false,
      description: 'List: the create button — "New" Button on desktop, solid plus IconButton on mobile.',
      table: { type: { summary: "() => void" } },
    },
    createLabel: {
      description: "List: the create button's label (and the mobile tooltip).",
      table: { type: { summary: "string" }, defaultValue: { summary: '"New"' } },
    },
    liveUsers: {
      control: false,
      description:
        "Details: the live-users stack — up to 3 avatars on desktop / 2 on mobile; hover tooltip (desktop) / tap drawer (mobile). 1 user renders an AvatarLive, 2+ an AvatarGroup (xl).",
      table: { type: { summary: "AvatarGroupItem[]" } },
    },
    breakpoint: {
      options: ["auto", "desktop", "mobile"],
      control: { type: "inline-radio" },
      description: 'Desktop / mobile format. "auto" (default) follows the viewport.',
      table: { type: { summary: '"auto" | "desktop" | "mobile"' }, defaultValue: { summary: '"auto"' } },
    },
    className: { control: false, table: { type: { summary: "string" } } },
  },
};
export default meta;

type Story = StoryObj<typeof TopBarNav>;

const PhaseTabs = () => {
  const [tab, setTab] = useState("open");
  return (
    <TabGroup value={tab} onChange={setTab}>
      <TabItem value="open">Open</TabItem>
      <TabItem value="closed">Closed</TabItem>
    </TabGroup>
  );
};

const DetailsTabs = ({ withDetails = false }: { withDetails?: boolean }) => {
  const [tab, setTab] = useState(withDetails ? "details" : "service");
  return (
    <TabGroup value={tab} onChange={setTab}>
      {withDetails && <TabItem value="details">Details</TabItem>}
      <TabItem value="service">Service</TabItem>
      <TabItem value="timesheet">Timesheet</TabItem>
      <TabItem value="summary">Summary</TabItem>
      <TabItem value="requests">Product requests</TabItem>
      <TabItem value="activity">Activity</TabItem>
    </TabGroup>
  );
};

const CONTEXT_MENU = (
  <MenuItemGroup>
    <MenuItem slotLeft={<Icon icon="pen" container="square" size={14} />} label="Edit" onClick={noop} />
    <MenuItem slotLeft={<Icon icon="copy" container="square" size={14} />} label="Duplicate" onClick={noop} />
    <MenuItem slotLeft={<Icon icon="box-archive" container="square" size={14} />} label="Archive" onClick={noop} />
  </MenuItemGroup>
);

/** The list bar (doc hero): title + phase tabs + search + New. */
export const Playground: Story = {
  args: { breakpoint: "desktop" },
  render: ({ breakpoint }) => (
    <DocsFrame>
      <TopBarNav breakpoint={breakpoint} tabs={<PhaseTabs />} onSearch={noop} onCreate={noop}>
        <TopBarNavLeftElements>
          <TopBarNavTitle title="Jobs" />
        </TopBarNavLeftElements>
      </TopBarNav>
    </DocsFrame>
  ),
};

/** The hero: the list bar with everything on. */
export const Hero: Story = {
  render: () => (
    <DocsFrame>
      <TopBarNav breakpoint="desktop" tabs={<PhaseTabs />} onSearch={noop} onCreate={noop}>
        <TopBarNavLeftElements>
          <TopBarNavTitle title="Jobs" />
        </TopBarNavLeftElements>
      </TopBarNav>
    </DocsFrame>
  ),
};

/** The TabGroup is optional — with and without. */
export const TabsOptional: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-20)" }}>
        <TopBarNav breakpoint="desktop" tabs={<PhaseTabs />} onSearch={noop} onCreate={noop}>
          <TopBarNavLeftElements>
            <TopBarNavTitle title="Jobs" />
          </TopBarNavLeftElements>
        </TopBarNav>
        <TopBarNav breakpoint="desktop" onSearch={noop} onCreate={noop}>
          <TopBarNavLeftElements>
            <TopBarNavTitle title="Jobs" />
          </TopBarNavLeftElements>
        </TopBarNav>
      </div>
    </DocsFrame>
  ),
};

/** Optional "Back" and "Context menu" buttons around the title. */
export const BackAndContextMenu: Story = {
  render: () => (
    <DocsFrame>
      <TopBarNav variant="details" breakpoint="desktop" tabs={<DetailsTabs />} liveUsers={LIVE}>
        <TopBarNavLeftElements onBack={noop} contextMenu={CONTEXT_MENU} breakpoint="desktop">
          <TopBarNavTitle title="JOB-101" />
        </TopBarNavLeftElements>
      </TopBarNav>
    </DocsFrame>
  ),
};

/** The title as a SelectList trigger (sub-pages) — click it. */
export const TitleDropdown: Story = {
  render: () => (
    <DocsFrame>
      <TopBarNav breakpoint="desktop" tabs={<PhaseTabs />} onSearch={noop} onCreate={noop}>
        <TopBarNavLeftElements>
          <TopBarNavTitle title="Jobs" subPages={SUB_PAGES} defaultSubPage="jobs" />
        </TopBarNavLeftElements>
      </TopBarNav>
      {/* Room for the sub-page list in the docs canvas. */}
      <div style={{ height: 160 }} />
    </DocsFrame>
  ),
};

/**
 * The interactive title's states are opacity-based: 75% on hover, 50% while
 * pressed (held while its list is open), 30% disabled; keyboard focus draws
 * a 2px ring 4px outside the title. Hover / press / tab to this live one.
 */
export const TitleStates: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--size-10) 0" }}>
        <TopBarNavTitle title="Title" subPages={SUB_PAGES} />
      </div>
      <div style={{ height: 160 }} />
    </DocsFrame>
  ),
};

/** The title's avatar slot — fixed 36px (xl); any avatar type. */
export const TitleAvatar: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-20)" }}>
        <TopBarNav variant="details" breakpoint="desktop" tabs={<DetailsTabs />} liveUsers={LIVE}>
          <TopBarNavLeftElements onBack={noop} contextMenu={CONTEXT_MENU} breakpoint="desktop">
            <TopBarNavTitle title="JOB-101" slotLeft={<AvatarJob size="xl" />} />
          </TopBarNavLeftElements>
        </TopBarNav>
        <TopBarNav variant="details" breakpoint="desktop" tabs={<DetailsTabs />} liveUsers={LIVE}>
          <TopBarNavLeftElements onBack={noop} contextMenu={CONTEXT_MENU} breakpoint="desktop">
            <TopBarNavTitle title="Space Age Kitchens" slotLeft={<AvatarClient size="xl" />} />
          </TopBarNavLeftElements>
        </TopBarNav>
        <TopBarNav variant="details" breakpoint="desktop" tabs={<DetailsTabs />} liveUsers={LIVE}>
          <TopBarNavLeftElements onBack={noop} contextMenu={CONTEXT_MENU} breakpoint="desktop">
            <TopBarNavTitle title="Amy Lowery" slotLeft={<AvatarUser size="xl" characters="AL" />} />
          </TopBarNavLeftElements>
        </TopBarNav>
      </div>
    </DocsFrame>
  ),
};

/** The right elements are optional. */
export const RightElementsOptional: Story = {
  render: () => (
    <DocsFrame>
      <TopBarNav breakpoint="desktop" tabs={<PhaseTabs />}>
        <TopBarNavLeftElements>
          <TopBarNavTitle title="Jobs" />
        </TopBarNavLeftElements>
      </TopBarNav>
    </DocsFrame>
  ),
};

/** Mobile list: the "New" Button becomes an IconButton; no search. */
export const ListMobile: Story = {
  render: () => (
    <DocsFrame>
      <TopBarNav breakpoint="mobile" tabs={<PhaseTabs />} onSearch={noop} onCreate={noop}>
        <TopBarNavLeftElements>
          <TopBarNavTitle title="Jobs" />
        </TopBarNavLeftElements>
      </TopBarNav>
    </DocsFrame>
  ),
};

/** Tabs scroll with the 40px edge fade when there is not enough room. */
export const ListTabsScroll: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <TopBarNav breakpoint="desktop" tabs={<DetailsTabs />} onSearch={noop} onCreate={noop}>
          <TopBarNavLeftElements>
            <TopBarNavTitle title="Jobs" />
          </TopBarNavLeftElements>
        </TopBarNav>
      </div>
    </DocsFrame>
  ),
};

/** Mobile sub-pages: the SelectList opens inline here too. */
export const SubPagesMobile: Story = {
  render: () => (
    <DocsFrame>
      <TopBarNav breakpoint="mobile" onCreate={noop}>
        <TopBarNavLeftElements>
          <TopBarNavTitle title="Jobs" subPages={SUB_PAGES} defaultSubPage="jobs" />
        </TopBarNavLeftElements>
      </TopBarNav>
      <div style={{ height: 160 }} />
    </DocsFrame>
  ),
};

/** The details bar: back + avatar + title + context menu, tabs, live users. */
export const DetailsDesktop: Story = {
  render: () => (
    <DocsFrame>
      <TopBarNav variant="details" breakpoint="desktop" tabs={<DetailsTabs />} liveUsers={LIVE}>
        <TopBarNavLeftElements onBack={noop} contextMenu={CONTEXT_MENU} breakpoint="desktop">
          <TopBarNavTitle title="JOB-101" slotLeft={<AvatarJob size="xl" />} />
        </TopBarNavLeftElements>
      </TopBarNav>
    </DocsFrame>
  ),
};

/** The "Back" button is optional — with and without. */
export const BackOptional: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-20)" }}>
        <TopBarNav variant="details" breakpoint="desktop" tabs={<DetailsTabs />} liveUsers={LIVE}>
          <TopBarNavLeftElements onBack={noop} contextMenu={CONTEXT_MENU} breakpoint="desktop">
            <TopBarNavTitle title="JOB-101" />
          </TopBarNavLeftElements>
        </TopBarNav>
        <TopBarNav variant="details" breakpoint="desktop" tabs={<DetailsTabs />} liveUsers={LIVE}>
          <TopBarNavLeftElements contextMenu={CONTEXT_MENU} breakpoint="desktop">
            <TopBarNavTitle title="JOB-101" />
          </TopBarNavLeftElements>
        </TopBarNav>
      </div>
    </DocsFrame>
  ),
};

/** The context menu (owned by the bar) — click the ellipsis. */
export const ContextMenu: Story = {
  render: () => (
    <DocsFrame>
      <TopBarNav variant="details" breakpoint="desktop" tabs={<DetailsTabs />} liveUsers={LIVE}>
        <TopBarNavLeftElements onBack={noop} contextMenu={CONTEXT_MENU} breakpoint="desktop">
          <TopBarNavTitle title="JOB-101" slotLeft={<AvatarJob size="xl" />} />
        </TopBarNavLeftElements>
      </TopBarNav>
      {/* Room for the open menu card in the docs canvas. */}
      <div style={{ height: 180 }} />
    </DocsFrame>
  ),
};

/** Mobile: the context menu opens as a drawer titled like the page. */
export const ContextMenuMobile: Story = {
  render: () => (
    <DeviceFrame>
      <TopBarNav variant="details" breakpoint="mobile" tabs={<DetailsTabs withDetails />} liveUsers={LIVE}>
        <TopBarNavLeftElements onBack={noop} contextMenu={CONTEXT_MENU} breakpoint="mobile">
          <TopBarNavTitle title="JOB-101" slotLeft={<AvatarJob size="xl" />} />
        </TopBarNavLeftElements>
      </TopBarNav>
    </DeviceFrame>
  ),
};

/** Mobile details: the tabs move to their own 60px bar row (no fade). */
export const DetailsMobile: Story = {
  render: () => (
    <DocsFrame>
      <TopBarNav variant="details" breakpoint="mobile" tabs={<DetailsTabs withDetails />} liveUsers={LIVE}>
        <TopBarNavLeftElements onBack={noop} contextMenu={CONTEXT_MENU} breakpoint="mobile">
          <TopBarNavTitle title="JOB-101" />
        </TopBarNavLeftElements>
      </TopBarNav>
    </DocsFrame>
  ),
};

/** Mobile: the tabs row hides scrolling down, returns scrolling up. Scroll the content. */
export const HideOnScroll: Story = {
  render: () => (
    <DeviceFrame pageText="">
      <div style={{ position: "absolute", inset: 0, overflowY: "auto", borderRadius: 24 }}>
        <TopBarNav variant="details" breakpoint="mobile" tabs={<DetailsTabs withDetails />} liveUsers={LIVE}>
          <TopBarNavLeftElements onBack={noop} contextMenu={CONTEXT_MENU} breakpoint="mobile">
            <TopBarNavTitle title="JOB-101" />
          </TopBarNavLeftElements>
        </TopBarNav>
        <div style={{ padding: 16, font: "var(--font-body-400-spacious)", color: "var(--text-subtle)" }}>
          {Array.from({ length: 40 }, (_, i) => (
            <p key={i}>Scrollable app content line {i + 1}.</p>
          ))}
        </div>
      </div>
    </DeviceFrame>
  ),
};

/** Live users: 1 = AvatarLive; 2+ = AvatarGroup; more than 3 truncate to 2 + counter. */
export const LiveUsers: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-20)" }}>
        <div>
          <span style={cap}>1 user</span>
          <TopBarNav variant="details" breakpoint="desktop" tabs={<DetailsTabs />} liveUsers={[LIVE[0]]}>
            <TopBarNavLeftElements onBack={noop}>
              <TopBarNavTitle title="JOB-101" />
            </TopBarNavLeftElements>
          </TopBarNav>
        </div>
        <div>
          <span style={cap}>2 users</span>
          <TopBarNav variant="details" breakpoint="desktop" tabs={<DetailsTabs />} liveUsers={LIVE}>
            <TopBarNavLeftElements onBack={noop}>
              <TopBarNavTitle title="JOB-101" />
            </TopBarNavLeftElements>
          </TopBarNav>
        </div>
        <div>
          <span style={cap}>5 users — 2 + counter (hover for everyone)</span>
          <TopBarNav variant="details" breakpoint="desktop" tabs={<DetailsTabs />} liveUsers={LIVE_MANY}>
            <TopBarNavLeftElements onBack={noop}>
              <TopBarNavTitle title="JOB-101" />
            </TopBarNavLeftElements>
          </TopBarNav>
        </div>
      </div>
    </DocsFrame>
  ),
};

/** Mobile: up to 2 live-user slots; a tap opens the drawer with everyone. */
export const LiveUsersMobile: Story = {
  render: () => (
    <DeviceFrame>
      <TopBarNav variant="details" breakpoint="mobile" tabs={<DetailsTabs withDetails />} liveUsers={LIVE_MANY}>
        <TopBarNavLeftElements onBack={noop} breakpoint="mobile">
          <TopBarNavTitle title="JOB-101" />
        </TopBarNavLeftElements>
      </TopBarNav>
    </DeviceFrame>
  ),
};

/** The inner bar: back + title only. Some inner pages have no back button. */
export const Inner: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--size-20)" }}>
        <TopBarNav variant="inner" breakpoint="desktop">
          <TopBarNavLeftElements onBack={noop}>
            <TopBarNavTitle title="Settings" />
          </TopBarNavLeftElements>
        </TopBarNav>
        <TopBarNav variant="inner" breakpoint="desktop">
          <TopBarNavLeftElements>
            <TopBarNavTitle title="Settings" />
          </TopBarNavLeftElements>
        </TopBarNav>
      </div>
    </DocsFrame>
  ),
};
