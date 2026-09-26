import { useEffect, useState } from "react";

import { Divider } from "../../components/Divider/Divider";
import { SidebarNavBreakpointContext } from "../../components/SidebarNav/SidebarNavContext";
import SidebarNavProfileButton from "../../components/SidebarNav/SidebarNavProfileButton";
import SidebarNavWorkspaceButton from "../../components/SidebarNav/SidebarNavWorkspaceButton";

import { AppBottomBar, bottomItems, navContent, Page, PROFILE, profileMenu, WORKSPACES } from "./appShell";

import styles from "./Filters.module.scss";

// The MOBILE MENU PAGE — the mobile counterpart of the desktop sidebar, and
// the only way to reach the lists that the bottom bar has no room for (Figma
// "Mobile menu page", doc 22589-5326, hero 22623-9553).
//
// It is a PAGE, not a drawer: the bottom bar's "Menu" item is a destination
// like any other, so it keeps its active state while you are here.
//
// Three deliberate differences from `SidebarNav`, all from the node:
//
// 1. NO Create row and NO Search row. On desktop those sit at the top of the
//    item list; on mobile the bottom bar already carries `plus` and `search`,
//    so repeating them here would be two ways to the same thing.
// 2. The minimum gap between the top items and the bottom items is 1px, not
//    the sidebar's 8px — the annotation on the node pins `itemSpacing`, and a
//    phone has far less height to give away.
// 3. Native scrolling instead of `ScrollArea`. Touch has no overlay thumb to
//    show, and a nested custom scroller is the thing that fights iOS momentum.
//
// The item list itself is `navContent` from the shell — the SAME config the
// desktop sidebar renders — so a page added to one is in the other for free.
export default function MenuPage({
  page,
  onNavigate,
}: {
  /** The page the user came from — it keeps its active state in the list. */
  page: Page;
  onNavigate: (next: Page) => void;
}) {
  // The stacks follow the page exactly as they do in the sidebar: a group
  // collapses when the active page leaves it. Opening the Menu page does not
  // change which page is active, so the group holding it is open on arrival —
  // which is what you want, since it shows you where you are.
  const pageInJobsStack = page === "jobs" || page === "series";
  const [jobsOpen, setJobsOpen] = useState(pageInJobsStack);
  useEffect(() => {
    setJobsOpen(pageInJobsStack);
  }, [pageInJobsStack]);

  const pageInInvoicesStack = page === "invoices" || page === "creditNotes";
  const [invoicesOpen, setInvoicesOpen] = useState(pageInInvoicesStack);
  useEffect(() => {
    setInvoicesOpen(pageInInvoicesStack);
  }, [pageInInvoicesStack]);

  const pageInPricebookStack =
    page === "labor" || page === "products" || page === "other" || page === "discounts" || page === "taxRates";
  const [pricebookOpen, setPricebookOpen] = useState(pageInPricebookStack);
  useEffect(() => {
    setPricebookOpen(pageInPricebookStack);
  }, [pageInPricebookStack]);

  return (
    // The context puts the workspace and profile buttons on their MOBILE
    // presentation — both open a drawer here, not a card.
    <SidebarNavBreakpointContext.Provider value="mobile">
      <div className={styles.mobile}>
        <div className={styles.menuHeader}>
          <SidebarNavWorkspaceButton workspaces={WORKSPACES} className={styles.menuWorkspace} />
          <SidebarNavProfileButton name={PROFILE.name} email={PROFILE.email} avatarSrc={PROFILE.avatarSrc}>
            {profileMenu}
          </SidebarNavProfileButton>
        </div>
        <Divider contrast="low" />
        <div className={styles.menuScroll}>
          <div className={styles.menuItems}>
            {navContent(
              page,
              onNavigate,
              { open: jobsOpen, onOpenChange: setJobsOpen },
              { open: invoicesOpen, onOpenChange: setInvoicesOpen },
              { open: pricebookOpen, onOpenChange: setPricebookOpen },
            )}
          </div>
          <div className={styles.menuItems}>{bottomItems}</div>
        </div>
        <AppBottomBar page="menu" onNavigate={onNavigate} />
      </div>
    </SidebarNavBreakpointContext.Provider>
  );
}
