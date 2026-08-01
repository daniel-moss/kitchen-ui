import type { Meta, StoryObj } from "@storybook/react";

import { semanticIcons } from "../../styles/semanticIcons";
import { Icon } from "../Icon/Icon";
import MenuItem from "../Menu/MenuItem";
import MenuItemGroup from "../Menu/MenuItemGroup";
import NavSidebar from "./NavSidebar";
import NavSidebarItem from "./NavSidebarItem";
import NavSidebarItemGroup from "./NavSidebarItemGroup";

const meta: Meta<typeof NavSidebar> = {
  title: "Components/NavSidebar/NavSidebar",
  component: NavSidebar,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof NavSidebar>;

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
    <NavSidebarItem icon="house" active>
      Home
    </NavSidebarItem>
    <NavSidebarItem icon={semanticIcons.estimate}>Estimates</NavSidebarItem>
    <NavSidebarItemGroup icon={semanticIcons.job} label="Jobs">
      <NavSidebarItem type="stackItem">Job requests</NavSidebarItem>
      <NavSidebarItem type="stackItem">Jobs</NavSidebarItem>
      <NavSidebarItem type="stackItem">Job series</NavSidebarItem>
    </NavSidebarItemGroup>
    <NavSidebarItemGroup icon={semanticIcons.invoice} label="Invoices">
      <NavSidebarItem type="stackItem">Invoices</NavSidebarItem>
      <NavSidebarItem type="stackItem">Credit notes</NavSidebarItem>
    </NavSidebarItemGroup>
    <NavSidebarItem icon={semanticIcons.purchaseOrder}>Purchase orders</NavSidebarItem>
    <NavSidebarItem icon={semanticIcons.bill}>Bills</NavSidebarItem>
    <NavSidebarItem icon={semanticIcons.vendor}>Vendors</NavSidebarItem>
    <NavSidebarItem icon={semanticIcons.client}>Clients</NavSidebarItem>
    <NavSidebarItemGroup icon={semanticIcons.pricebook} label="Pricebook">
      <NavSidebarItem type="stackItem">Labor</NavSidebarItem>
      <NavSidebarItem type="stackItem">Products</NavSidebarItem>
      <NavSidebarItem type="stackItem">Other</NavSidebarItem>
      <NavSidebarItem type="stackItem">Discounts</NavSidebarItem>
      <NavSidebarItem type="stackItem">Tax rates</NavSidebarItem>
    </NavSidebarItemGroup>
    <NavSidebarItemGroup icon={semanticIcons.reports} label="Reports">
      <NavSidebarItem type="stackItem">Clients &amp; locations</NavSidebarItem>
      <NavSidebarItem type="stackItem">Jobs</NavSidebarItem>
      <NavSidebarItem type="stackItem">Inventory</NavSidebarItem>
    </NavSidebarItemGroup>
  </>
);

const bottomItems = (
  <>
    <NavSidebarItem icon="circle-question">Help center</NavSidebarItem>
    <NavSidebarItem icon="bullhorn">What&apos;s new</NavSidebarItem>
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
    <div style={{ height: 700 }}>
      <NavSidebar {...sidebarProps}>{navContent}</NavSidebar>
    </div>
  ),
};

/** Not enough height: the header sticks, everything else scrolls. */
export const Overflow: Story = {
  render: () => (
    <div style={{ height: 420 }}>
      <NavSidebar {...sidebarProps}>{navContent}</NavSidebar>
    </div>
  ),
};

/** Minimal: no search, no bottom items, no Create button. */
export const Minimal: Story = {
  render: () => (
    <div style={{ height: 420 }}>
      <NavSidebar
        workspaces={[{ id: "1", name: "Workspace" }]}
        profileName="Lorne Riddle"
        profileEmail="email@address.com"
        profileMenu={profileMenu}
        breakpoint="desktop"
      >
        <NavSidebarItem icon="house">Home</NavSidebarItem>
        <NavSidebarItem icon={semanticIcons.estimate}>Estimates</NavSidebarItem>
      </NavSidebar>
    </div>
  ),
};

/** A long workspace name truncates instead of pushing the profile button. */
export const LongWorkspaceName: Story = {
  render: () => (
    <div style={{ height: 300 }}>
      <NavSidebar
        {...sidebarProps}
        workspaces={[
          { id: "1", name: "Super long workspace name which does not fit" },
          { id: "2", name: "Workspace 2" },
        ]}
      >
        <NavSidebarItem icon="house">Home</NavSidebarItem>
      </NavSidebar>
    </div>
  ),
};
