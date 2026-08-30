import type { Meta, StoryObj } from "@storybook/react";

import { DocsFrame } from "../../stories/helpers";
import { semanticIcons } from "../../styles/semanticIcons";
import { Icon } from "../Icon/Icon";
import MenuItem from "../Menu/MenuItem";
import MenuItemGroup from "../Menu/MenuItemGroup";
import SidebarNav from "./SidebarNav";
import SidebarNavItem from "./SidebarNavItem";
import SidebarNavItemGroup from "./SidebarNavItemGroup";

const meta: Meta<typeof SidebarNav> = {
  title: "Components/SidebarNav/SidebarNav",
  component: SidebarNav,
  // fullscreen — `DocsFrame` provides the (only) padding in docs stories.
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof SidebarNav>;

const slot = (icon: string) => <Icon icon={icon} container="square" />;

const profileMenu = (
  <>
    <MenuItemGroup>
      <MenuItem label="Settings" slotLeft={slot("gear")} />
    </MenuItemGroup>
    <MenuItemGroup>
      <MenuItem label="Help center" slotLeft={slot("circle-question")} />
      <MenuItem label="Contact support" slotLeft={slot("headset")} />
      <MenuItem label="Request feature" slotLeft={slot("circle-info")} />
      <MenuItem label="What's new" slotLeft={slot("bullhorn")} />
    </MenuItemGroup>
    <MenuItemGroup>
      <MenuItem label="Log out" slotLeft={slot("arrow-right-from-bracket")} danger />
    </MenuItemGroup>
  </>
);

const createMenu = (
  <MenuItemGroup>
    <MenuItem label="Estimate" slotLeft={slot(semanticIcons.estimate)} />
    <MenuItem
      label="Job"
      slotLeft={slot(semanticIcons.job)}
      subMenu={
        <MenuItemGroup>
          <MenuItem label="Job" slotLeft={slot(semanticIcons.job)} />
          <MenuItem label="Job series" slotLeft={slot(semanticIcons.jobSeries)} />
        </MenuItemGroup>
      }
      subMenuTitle="Create job"
    />
    <MenuItem
      label="Invoice"
      slotLeft={slot(semanticIcons.invoice)}
      subMenu={
        <MenuItemGroup>
          <MenuItem label="Invoice" slotLeft={slot(semanticIcons.invoice)} />
          <MenuItem label="Credit note" slotLeft={slot(semanticIcons.creditNote)} />
        </MenuItemGroup>
      }
      subMenuTitle="Create invoice"
    />
    <MenuItem label="Purchase order" slotLeft={slot(semanticIcons.purchaseOrder)} />
    <MenuItem label="Bill" slotLeft={slot(semanticIcons.bill)} />
    <MenuItem label="Vendor" slotLeft={slot(semanticIcons.vendor)} />
    <MenuItem label="Client" slotLeft={slot(semanticIcons.client)} />
    <MenuItem
      label="Pricebook item"
      slotLeft={slot(semanticIcons.pricebook)}
      subMenu={
        <MenuItemGroup>
          <MenuItem label="Labor" slotLeft={slot(semanticIcons.labor)} />
          <MenuItem label="Product" slotLeft={slot(semanticIcons.product)} />
          <MenuItem label="Other" slotLeft={slot(semanticIcons.other)} />
          <MenuItem label="Discount" slotLeft={slot(semanticIcons.discount)} />
          <MenuItem label="Tax rate" slotLeft={slot(semanticIcons.taxRate)} />
        </MenuItemGroup>
      }
      subMenuTitle="Create pricebook item"
    />
  </MenuItemGroup>
);

const navContent = (
  <>
    <SidebarNavItem icon="house" active>
      Home
    </SidebarNavItem>
    <SidebarNavItem icon={semanticIcons.estimate}>Estimates</SidebarNavItem>
    <SidebarNavItemGroup icon={semanticIcons.job} label="Jobs">
      <SidebarNavItem type="stackItem">Requests</SidebarNavItem>
      <SidebarNavItem type="stackItem">Jobs</SidebarNavItem>
      <SidebarNavItem type="stackItem">Series</SidebarNavItem>
    </SidebarNavItemGroup>
    <SidebarNavItemGroup icon={semanticIcons.invoice} label="Invoices">
      <SidebarNavItem type="stackItem">Invoices</SidebarNavItem>
      <SidebarNavItem type="stackItem">Credit notes</SidebarNavItem>
    </SidebarNavItemGroup>
    <SidebarNavItem icon={semanticIcons.purchaseOrder}>Purchase orders</SidebarNavItem>
    <SidebarNavItem icon={semanticIcons.bill}>Bills</SidebarNavItem>
    <SidebarNavItem icon={semanticIcons.vendor}>Vendors</SidebarNavItem>
    <SidebarNavItem icon={semanticIcons.client}>Clients</SidebarNavItem>
    <SidebarNavItemGroup icon={semanticIcons.pricebook} label="Pricebook">
      <SidebarNavItem type="stackItem">Labor</SidebarNavItem>
      <SidebarNavItem type="stackItem">Products</SidebarNavItem>
      <SidebarNavItem type="stackItem">Other</SidebarNavItem>
      <SidebarNavItem type="stackItem">Discounts</SidebarNavItem>
      <SidebarNavItem type="stackItem">Tax rates</SidebarNavItem>
    </SidebarNavItemGroup>
    <SidebarNavItemGroup icon={semanticIcons.reports} label="Reports">
      <SidebarNavItem type="stackItem">Clients &amp; locations</SidebarNavItem>
      <SidebarNavItem type="stackItem">Jobs</SidebarNavItem>
      <SidebarNavItem type="stackItem">Inventory</SidebarNavItem>
    </SidebarNavItemGroup>
  </>
);

const bottomItems = (
  <>
    <SidebarNavItem icon="circle-question">Help center</SidebarNavItem>
    <SidebarNavItem icon="bullhorn">What&apos;s new</SidebarNavItem>
  </>
);

const sidebarProps = {
  workspaces: [
    { id: "1", name: "Workspace" },
    { id: "2", name: "Workspace 2" },
  ],
  profileName: "Lorne Riddle",
  profileEmail: "email@address.com",
  profileMenu,
  onSearchClick: () => {},
  bottomItems,
  createMenu,
  breakpoint: "desktop" as const,
};

/** The doc's hero: full sidebar in a 700px frame — bottom block pinned down. */
export const Playground: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ height: 700 }}>
        <SidebarNav {...sidebarProps}>{navContent}</SidebarNav>
      </div>
    </DocsFrame>
  ),
};

/** The hero example — the full sidebar (Create on top, bottom items pinned). */
export const Hero: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ height: 700 }}>
        <SidebarNav {...sidebarProps}>{navContent}</SidebarNav>
      </div>
    </DocsFrame>
  ),
};

/** Not enough height: the header sticks, everything else scrolls. */
export const Overflow: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ height: 420 }}>
        <SidebarNav {...sidebarProps}>{navContent}</SidebarNav>
      </div>
    </DocsFrame>
  ),
};

/** Minimal: no search, no bottom items, no Create button. */
export const Minimal: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ height: 420 }}>
      <SidebarNav
        workspaces={[{ id: "1", name: "Workspace" }]}
        profileName="Lorne Riddle"
        profileEmail="email@address.com"
        profileMenu={profileMenu}
        breakpoint="desktop"
      >
        <SidebarNavItem icon="house">Home</SidebarNavItem>
        <SidebarNavItem icon={semanticIcons.estimate}>Estimates</SidebarNavItem>
      </SidebarNav>
      </div>
    </DocsFrame>
  ),
};

/** A long workspace name truncates instead of pushing the profile button. */
export const LongWorkspaceName: Story = {
  render: () => (
    <DocsFrame>
      <div style={{ height: 300 }}>
      <SidebarNav
        {...sidebarProps}
        workspaces={[
          { id: "1", name: "Super long workspace name which does not fit" },
          { id: "2", name: "Workspace 2" },
        ]}
      >
        <SidebarNavItem icon="house">Home</SidebarNavItem>
      </SidebarNav>
      </div>
    </DocsFrame>
  ),
};
