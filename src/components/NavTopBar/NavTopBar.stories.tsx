import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { DeviceFrame, noop } from "../../stories/helpers";
import { AvatarGroupItem } from "../Avatar/AvatarGroup.types";
import { Icon } from "../Icon/Icon";
import { semanticIcons } from "../../styles/semanticIcons";
import TabGroup from "../Tabs/TabGroup";
import TabItem from "../Tabs/TabItem";
import NavTopBar from "./NavTopBar";
import NavTopBarLeftElements from "./NavTopBarLeftElements";
import NavTopBarTitle from "./NavTopBarTitle";

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

const meta: Meta<typeof NavTopBar> = {
  title: "Components/NavTopBar/NavTopBar",
  component: NavTopBar,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof NavTopBar>;

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

/** The list bar (doc hero): subpage title with dropdown + search + New. */
export const ListDesktop: Story = {
  render: () => (
    <NavTopBar liveUsers={LIVE} onSearch={noop} onCreate={noop} breakpoint="desktop">
      <NavTopBarLeftElements>
        <NavTopBarTitle
          title="Jobs"
          slotLeft={<Icon icon={semanticIcons.job} pack="solid" size={14} />}
          subPages={[
            { id: "requests", label: "Job requests" },
            { id: "jobs", label: "Jobs" },
            { id: "series", label: "Job series" },
          ]}
          defaultSubPage="jobs"
        />
      </NavTopBarLeftElements>
    </NavTopBar>
  ),
};

/** The details bar: back + ID + actions, tabs with the edge fade, live users. */
export const DetailsDesktop: Story = {
  render: () => (
    <NavTopBar variant="details" liveUsers={LIVE} tabs={<DetailsTabs />} breakpoint="desktop">
      <NavTopBarLeftElements onBack={noop} onActions={noop}>
        <NavTopBarTitle title="JOB-10001" />
      </NavTopBarLeftElements>
    </NavTopBar>
  ),
};

/** Details in a tight width — the tabs scroll with the fade. */
export const DetailsTabsOverflow: Story = {
  render: () => (
    <div style={{ width: 560 }}>
      <NavTopBar variant="details" liveUsers={LIVE} tabs={<DetailsTabs />} breakpoint="desktop">
        <NavTopBarLeftElements onBack={noop} onActions={noop}>
          <NavTopBarTitle title="JOB-10001" />
        </NavTopBarLeftElements>
      </NavTopBar>
    </div>
  ),
};

/** More than 3 live users: 2 + the counter; hover lists everyone. */
export const ManyLiveUsers: Story = {
  render: () => (
    <NavTopBar liveUsers={LIVE_MANY} onSearch={noop} onCreate={noop} breakpoint="desktop">
      <NavTopBarLeftElements>
        <NavTopBarTitle title="Purchase orders" slotLeft={<Icon icon={semanticIcons.purchaseOrder} pack="solid" size={14} />} />
      </NavTopBarLeftElements>
    </NavTopBar>
  ),
};

/** Mobile list: no search, plus icon create, max 2 avatars. */
export const ListMobile: Story = {
  render: () => (
    <DeviceFrame>
      <NavTopBar liveUsers={LIVE_MANY} onSearch={noop} onCreate={noop} breakpoint="mobile">
        <NavTopBarLeftElements>
          <NavTopBarTitle
            title="Jobs"
            slotLeft={<Icon icon={semanticIcons.job} pack="solid" size={14} />}
            subPages={[
              { id: "requests", label: "Job requests" },
              { id: "jobs", label: "Jobs" },
              { id: "series", label: "Job series" },
            ]}
            defaultSubPage="jobs"
          />
        </NavTopBarLeftElements>
      </NavTopBar>
    </DeviceFrame>
  ),
};

/** Mobile details: the tabs move to a second bar row, "Details" first. */
export const DetailsMobile: Story = {
  render: () => (
    <DeviceFrame>
      <NavTopBar variant="details" liveUsers={LIVE} tabs={<DetailsTabs withDetails />} breakpoint="mobile">
        <NavTopBarLeftElements onBack={noop} onActions={noop}>
          <NavTopBarTitle title="JOB-10001" />
        </NavTopBarLeftElements>
      </NavTopBar>
    </DeviceFrame>
  ),
};

/** Mobile: the bar hides scrolling down and reveals scrolling up (the tabs
 * row stays pinned on details). Scroll the content to try it. */
export const MobileHideOnScroll: Story = {
  render: () => (
    <DeviceFrame pageText="">
      <div style={{ position: "absolute", inset: 0, overflowY: "auto", borderRadius: 24 }}>
        <NavTopBar variant="details" liveUsers={LIVE} tabs={<DetailsTabs withDetails />} breakpoint="mobile" hideOnScroll>
          <NavTopBarLeftElements onBack={noop} onActions={noop}>
            <NavTopBarTitle title="JOB-10001" />
          </NavTopBarLeftElements>
        </NavTopBar>
        <div style={{ padding: 16, font: "var(--font-body-400-spacious)", color: "var(--text-subtle)" }}>
          {Array.from({ length: 40 }, (_, i) => (
            <p key={i}>Scrollable app content line {i + 1}.</p>
          ))}
        </div>
      </div>
    </DeviceFrame>
  ),
};
