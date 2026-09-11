import { useEffect, useLayoutEffect, useRef, useState } from "react";

import BottomBarNav from "../../components/BottomBarNav/BottomBarNav";
import BottomBarNavItem from "../../components/BottomBarNav/BottomBarNavItem";
import { Icon } from "../../components/Icon/Icon";
import MenuItem from "../../components/Menu/MenuItem";
import MenuItemGroup from "../../components/Menu/MenuItemGroup";
import SidebarNav from "../../components/SidebarNav/SidebarNav";
import SidebarNavItem from "../../components/SidebarNav/SidebarNavItem";
import SidebarNavItemGroup from "../../components/SidebarNav/SidebarNavItemGroup";
import { objectPlaceholder } from "../../data/users";
import { semanticIcons } from "../../styles/semanticIcons";
import { noop } from "../../stories/helpers";

import styles from "./Filters.module.scss";

// The prototype's shared APP SHELL — everything both list pages (Jobs and
// Estimates) stand inside: the sidebar, the mobile bottom bar, and the two
// positioning hooks the pages' floating cards and tables share. Split out of
// Filters.tsx on 2026-09-11, when the Estimates page arrived — one copy, two
// pages, and Filters.tsx stops being the only home for shell chrome.

/** The prototype's pages. The sidebar and the bottom bar navigate between them. */
export type Page = "jobs" | "estimates";

// MenuItem left icon (square 16px box) — same helper the other prototypes use.
const slot = (icon: string) => <Icon icon={icon} container="square" />;

// ---- SidebarNav config (display only) --------------------------------------

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

// The nav items BELOW the built-in Search row (SidebarNav renders Search
// itself when `onSearchClick` is set). TWO items navigate since 2026-09-11 —
// "Estimates" and the Jobs stack's "Jobs" sub-item switch the page and carry
// the active state; everything else stays display-only.
//
// The Jobs stack is CONTROLLED by the page (see `Sidebar`): it collapses when
// the user navigates out of it.
const navContent = (
  page: Page,
  onNavigate: (next: Page) => void,
  jobsStack: { open: boolean; onOpenChange: (next: boolean) => void },
) => (
  <>
    <SidebarNavItem icon="house">Home</SidebarNavItem>
    <SidebarNavItem
      icon={semanticIcons.estimate}
      active={page === "estimates"}
      onClick={() => onNavigate("estimates")}
    >
      Estimates
    </SidebarNavItem>
    <SidebarNavItemGroup
      icon={semanticIcons.job}
      label="Jobs"
      open={jobsStack.open}
      onOpenChange={jobsStack.onOpenChange}
    >
      <SidebarNavItem type="stackItem">Requests</SidebarNavItem>
      <SidebarNavItem type="stackItem" active={page === "jobs"} onClick={() => onNavigate("jobs")}>
        Jobs
      </SidebarNavItem>
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

// ---- the sidebar -----------------------------------------------------------

// The DS `SidebarNav` (Daniel, 2026-09-03 — the hand-assembled copy is gone).
// Everything the old local build did by hand is the component's own behavior
// now: the 60px header, Create on top of the item list with its right-opening
// top-aligned menu card, the built-in Search item (rendered when
// `onSearchClick` is set; its hot key follows the OS), the 1px row rhythm,
// the pinned bottom items and the medium (--gray-a4) edge divider.
//
// `breakpoint="desktop"` keeps the sidebar rendered (and its menus on their
// card presentation) whatever the canvas width is — the component returns
// null on mobile otherwise, and the context it provides carries the value to
// the workspace / profile buttons.
//
// `imageSrc` gives the 28px object avatar a picture instead of the name's
// first letter (Daniel, 2026-08-17). `objectPlaceholder` is the kit's shared
// demo object image (src/data/users.ts) — its path is relative on purpose,
// because the built Storybook is served under a sub-path on GitHub Pages.
export const Sidebar = ({ page, onNavigate }: { page: Page; onNavigate: (next: Page) => void }) => {
  // The stack follows the PAGE (Daniel, 2026-09-11): "when the user goes to a
  // page out of the current NavItem group, the group collapses automatically".
  // Leaving the Jobs stack for Estimates closes it; coming back opens it.
  //
  // CONTROLLED, not forced: the group is re-synced only when the page crosses
  // in or out of it, so a stack the user opened BY HAND while another page is
  // active stays open — `onOpenChange` writes the same state the page writes.
  // Only the group holding the page being left collapses, which is what the
  // rule says; the display-only stacks (Invoices, Pricebook, Reports) keep
  // whatever the user set.
  //
  // FLAGGED: this is consumer wiring, because only the consumer knows what the
  // active page is — the DS `SidebarNavItemGroup` cannot see it. If the rule
  // should hold for every app automatically, the DS component would have to
  // watch its children's `active` props, which is a DS change to approve, not
  // a prototype one.
  const pageInJobsStack = page === "jobs";
  const [jobsOpen, setJobsOpen] = useState(pageInJobsStack);
  useEffect(() => {
    setJobsOpen(pageInJobsStack);
  }, [pageInJobsStack]);

  return (
    <SidebarNav
      breakpoint="desktop"
      workspaces={[{ id: "1", name: "Workspace", imageSrc: objectPlaceholder }]}
      profileName="Lorne Riddle"
      profileEmail="email@address.com"
      profileMenu={profileMenu}
      onSearchClick={noop}
      createMenu={createMenu}
      bottomItems={bottomItems}
    >
      {navContent(page, onNavigate, { open: jobsOpen, onOpenChange: setJobsOpen })}
    </SidebarNav>
  );
};

// ---- the mobile bottom bar --------------------------------------------------

// The design's bar holds Home · Jobs · Create · Search · Menu and has NO
// Estimates item — in the app the Estimates list would be reached through
// "Menu", which this prototype does not build. So on the Estimates page no
// item is active, and "Jobs" navigates back to the Jobs list — FLAGGED: say
// the word if the bar should behave differently there.
export const AppBottomBar = ({ page, onNavigate }: { page: Page; onNavigate: (next: Page) => void }) => (
  <BottomBarNav breakpoint="mobile" className={styles.bottomBar}>
    <BottomBarNavItem icon="house" label="Home" />
    <BottomBarNavItem
      icon={semanticIcons.job}
      label="Jobs"
      active={page === "jobs"}
      onClick={() => onNavigate("jobs")}
    />
    {/* A PLAIN item since 2026-09-03 (Daniel + node 1502-14983): bare
        `plus`, regular weight — the Create adjustment (`strong`,
        circle-plus) is gone from the design and the component. */}
    <BottomBarNavItem icon="plus" label="Create" />
    <BottomBarNavItem icon="magnifying-glass" label="Search" />
    <BottomBarNavItem icon="bars" label="Menu" />
  </BottomBarNav>
);

// ---- anchored cards --------------------------------------------------------

// A plain (non-module) class on the Custom dialog's scrim. The dialog portals to
// <body>, so every anchored card here would read a click inside it as "outside";
// `useAnchoredCard` looks for this marker and stays open instead.
export const DIALOG_MARKER = "concept-filters-dialog";

type CardAlign = "left" | "right";

// One anchored body portal, shared by everything in this concept that opens next
// to something: the Filters menu (from the view bar's button and from the filter
// bar's plus), a chip's condition menu and value list, and both pages' View
// menu. It is a body portal because a card anchored inside the bars would be
// clipped by their overflow; `position: fixed` from the trigger's rect,
// re-measured on scroll and resize.
export function useAnchoredCard(align: CardAlign = "left", ignoreSelector?: string) {
  const [open, setOpen] = useState(false);
  // `| null` in the type parameter makes the ref MUTABLE: most triggers attach
  // it as a wrapper div's `ref`, but the view bars assign TopBarView's own
  // buttons into it by hand (see the pages' DesktopViewBar components).
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left?: number; right?: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const update = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (rect == null) return;
      // Pinned by the RIGHT edge near the right of the screen, so the card grows
      // leftwards and its own width never has to be measured.
      setPos(
        align === "right"
          ? { right: window.innerWidth - rect.right, top: rect.bottom + 4 }
          : { left: rect.left, top: rect.bottom + 4 },
      );
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, align]);

  // A click outside the trigger and the card closes it. `ignoreSelector` spares
  // a card's OWN satellite portals — the Filters menu's hovered option list is a
  // second portal, so it is not inside `cardRef`, and without this ticking an
  // option in it closed the whole menu underneath.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Element;
      if (anchorRef.current?.contains(target) === true) return;
      if (cardRef.current?.contains(target) === true) return;
      // The Custom DIALOG portals to <body>, so it is "outside" EVERY card here
      // — a click on its date field or its Range box closed the dialog, the
      // option list and the Filters menu all at once (Daniel, 2026-08-20). It
      // is a modal these cards opened, so no card ever closes on it; its own
      // scrim and Cancel are what dismiss it.
      if (target.closest?.(`.${DIALOG_MARKER}`) != null) return;
      if (ignoreSelector != null && target.closest?.(ignoreSelector) != null) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, ignoreSelector]);

  return { open, setOpen, anchorRef, cardRef, pos };
}

export type AnchoredCard = ReturnType<typeof useAnchoredCard>;

// ---- one-axis table scrolling (mobile) -------------------------------------

// The table is ONE scroll container that pans both ways, so a diagonal drag
// moves it sideways and down at the same time. On a phone that feels wrong —
// Daniel asked for one direction per gesture (2026-08-16).
//
// There is no CSS for this: `touch-action` is static, and it is intersected
// down the ancestor chain, so nesting a `pan-x` scroller inside a `pan-y` one
// just forbids both. So the axis is locked in JS: the first few pixels of each
// touch decide the direction, and the other axis is pinned to the value it had
// when the gesture started.
//
// The lock lives ONLY while the finger is down. An earlier version held it
// through the momentum phase as well, which killed the flick entirely —
// assigning scrollLeft/scrollTop while iOS is running its inertia aborts the
// inertia. Releasing at `touchend` keeps the momentum fully native, and it
// still travels in one direction, because the drag held the other axis still
// and that is the velocity iOS carries into the flick.
//
// Returns a ref for the element WRAPPING the table — the Table's own root is
// the scroller, and it is that wrapper's only child.
export function useSingleAxisScroll(enabled: boolean) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return undefined;
    const el = hostRef.current?.firstElementChild as HTMLElement | null;
    if (el == null) return undefined;

    let axis: "x" | "y" | null = null;
    let startX = 0;
    let startY = 0;
    let lockLeft = 0;
    let lockTop = 0;
    let touching = false;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t == null) return;
      touching = true;
      axis = null;
      startX = t.clientX;
      startY = t.clientY;
      lockLeft = el.scrollLeft;
      lockTop = el.scrollTop;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (axis != null) return;
      const t = e.touches[0];
      if (t == null) return;
      const dx = Math.abs(t.clientX - startX);
      const dy = Math.abs(t.clientY - startY);
      if (dx < 6 && dy < 6) return; // too small to tell the direction yet
      axis = dx > dy ? "x" : "y";
      // The browser may already have scrolled a little before we decided.
      lockLeft = el.scrollLeft;
      lockTop = el.scrollTop;
    };

    // The lock ends the moment the finger lifts, so the flick-and-release
    // momentum is left completely alone.
    const onTouchEnd = () => {
      touching = false;
      axis = null;
    };

    // Pin the locked-out axis — ONLY while the finger is down. Assigning
    // scrollLeft/scrollTop during iOS's momentum phase aborts the inertia
    // (that is what made the table stop dead on release), so this must never
    // run after touchend. The drag already held the other axis at a standstill,
    // so the momentum iOS starts from carries almost no velocity on it.
    const onScroll = () => {
      if (!touching || axis == null) return;
      if (axis === "x") {
        if (el.scrollTop !== lockTop) el.scrollTop = lockTop;
      } else if (el.scrollLeft !== lockLeft) {
        el.scrollLeft = lockLeft;
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    el.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("scroll", onScroll);
    };
  }, [enabled]);

  return hostRef;
}
