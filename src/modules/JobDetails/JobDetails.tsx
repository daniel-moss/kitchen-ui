import { MouseEvent as ReactMouseEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";

import clsx from "clsx";

import Avatar from "../../components/Avatar/Avatar";
import AvatarWarning from "../../components/Avatar/AvatarWarning";
import ItemText from "../../components/ItemText/ItemText/ItemText";
import { AvatarGroupItem } from "../../components/Avatar/AvatarGroup.types";
import Button from "../../components/Button/Button";
import { Divider } from "../../components/Divider/Divider";
import { Icon } from "../../components/Icon/Icon";
import IconButton from "../../components/IconButton/IconButton";
import Menu from "../../components/Menu/Menu";
import MenuItem from "../../components/Menu/MenuItem";
import MenuItemGroup from "../../components/Menu/MenuItemGroup";
import DrawerHeader from "../../components/Popover/DrawerHeader";
import Popover from "../../components/Popover/Popover";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import PopoverHeaderContent from "../../components/Popover/PopoverHeaderContent";
import PopoverHeaderText from "../../components/Popover/PopoverHeaderText";
import Input from "../../components/Input/Input";
import Prompt from "../../components/Prompt/Prompt";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import SelectField from "../../components/Fields/SelectField/SelectField";
import Toaster, { toast } from "../../components/Toast/Toaster";
import SidebarNav from "../../components/SidebarNav/SidebarNav";
import SidebarNavItem from "../../components/SidebarNav/SidebarNavItem";
import SidebarNavItemGroup from "../../components/SidebarNav/SidebarNavItemGroup";
import TopBarNav from "../../components/TopBarNav/TopBarNav";
import TopBarNavLeftElements from "../../components/TopBarNav/TopBarNavLeftElements";
import TopBarNavTitle from "../../components/TopBarNav/TopBarNavTitle";
import ScrollArea from "../../components/ScrollArea/ScrollArea";
import TabGroup from "../../components/Tabs/TabGroup";
import TabItem from "../../components/Tabs/TabItem";
import useIsDesktop, { Breakpoint } from "../../hooks/useIsDesktop";
import { semanticIcons } from "../../styles/semanticIcons";
import { User, users, usersById } from "../../data/users";
import ActionBar from "./ActionBar";
import CancelJobForm from "./CancelJobForm";
import ChangePauseStatusForm from "./ChangePauseStatusForm";
import CompleteJobForm from "./CompleteJobForm";
import SendSummaryForm from "./SendSummaryForm";
import Dialog from "../../components/Dialog/Dialog";
import ActivityPanel from "./ActivityPanel";
import {
  ActivityEvent,
  diffBilling,
  diffEquipment,
  diffJobProperties,
  diffServiceValues,
  FieldChange,
  JobStatusLog,
  ValueIcon,
} from "./activityEvents";
import { JobContact } from "./contacts";
import { Billing } from "./BillingForm";
import DetailsPanel from "./DetailsPanel";
import { JobLocation, LOCATIONS } from "./jobData";
import { chargesOf, chargesTotal, COMPANY, ESTIMATES, INVOICES, jobById } from "../../data/db";
import { useCurrentJobId, CurrentJobIdProvider } from "./currentJob";
import { seedActivity, seedLifecycle, seedSessions, seedSignature, seedEquipmentIds, seedEquipmentPool, seedJobState, seedLocation, seedScheduling } from "./jobSeed";
import { Job as ListJob } from "../shared/jobRow";
import { defaultJob, displayStatus, formatStatusTimestamp, JobState, JobStatus, statusLabel, useJobLifecycle } from "./jobState";
import PauseJobForm from "./PauseJobForm";
import SchedulingForm, { defaultScheduling, durationLabel, Scheduling, scheduledForLabel } from "./SchedulingForm";
import { defaultServiceValues, ServiceValues } from "./ServiceForm";
import ServicePanel from "./ServicePanel";
import { Equipment } from "./equipment";
import { EquipmentFormValues } from "./EquipmentForm";
import { defaultJobProperties, JobProperties, JOB_SOURCES, JobSource, sourceRequiresId } from "./JobPropertiesForm";
import { NewEquipment } from "../NewEquipmentForm/NewEquipmentForm.types";
import SummaryPanel from "./SummaryPanel";
import TimesheetForm from "./TimesheetForm";
import { FormsLog } from "./FormsModule";
import { SignatureResult } from "./SignatureModule";
import SessionForm, { Meridiem, SessionDraft } from "./SessionForm";
import StartJobForm from "./StartJobForm";
import SubStatusForm from "./SubStatusForm";
import TimesheetPanel, { categoryIcon, formatHrMin, roundUpSec, Session, StatusItems, TECH_STATUSES } from "./TimesheetPanel";
import { SelectPopoverList, useSelectPopover } from "../shared/selectPopover";
import { isRowDragActive } from "../../utils/dragLock";
import { copyText, noop, slot, useAnchoredMenu } from "./shared";

import styles from "./JobDetails.module.scss";

// Job Details — the page shell. Restructured 2026-10-04 (Daniel):
//
//   Desktop  SidebarNav | TopBarNav (back + job id, live users, and the job's
//            ACTIONS on the right) above a content row of [section-tabs bar +
//            scrolling main column] | divider | 400px details sidebar. The
//            tabs bar lives inside the content area, so it stops at the
//            divider; the sidebar pins only the time-tracking SessionBar.
//            There is no action bar here any more.
//   Mobile   TopBarNav, then the same section-tabs bar as its own row, then
//            the swipeable tab content; the ActionBar stays pinned at the
//            bottom. "Details" (the desktop sidebar) is the first tab.
//
// The ellipsis that used to sit next to the job id is gone — its Copy URL /
// Download PDF items are the last group of the actions menu now.

export interface JobDetailsProps {
  /** The job to show — the app looks it up from the route's id. */
  record: ListJob;
  /** Desktop / mobile shell. "auto" (default) follows the viewport. */
  breakpoint?: Breakpoint;
  /** Leaving the job. Unset in a standalone story, where there is nowhere to go. */
  onBack?: () => void;
  /**
   * Opening ANOTHER job — the "Recall to" link in the Service module and the
   * Related module's row both use it, in the SAME tab. Unset in a standalone
   * story (and then those rows are inert).
   */
  onOpenJob?: (id: string) => void;
  /**
   * The company setting that rounds logged time UP to the next 5 minutes.
   * A real setting would live in Settings, which this prototype does not have,
   * so it is a Storybook control (Daniel, 2026-08-11). It changes every
   * duration the Timesheet tab shows; the exact values move into the charts'
   * tooltips. Default false.
   */
  roundTo5min?: boolean;
}

// Real photos from the shared demo-users fixture; ring colors auto-assign
// (crimson, teal — high contrast between neighbors).
// Who is looking at the job right now. Only a job being WORKED has anyone on
// it, and the people on it are its own assignees (2026-09-28) — it used to be
// the same two strangers on every job, including ones finished in August.
/**
 * Who else is on this job right now — its own assignees, and only while it is
 * active.
 *
 * The VIEWER is left out (Daniel, 2026-10-06): the whole demo is Lorne
 * Riddle's screen, and "live users" means the people you are sharing the job
 * with. Seeing your own face there is like being shown yourself.
 */
const liveUsersFor = (record: ListJob): AvatarGroupItem[] =>
  record.status !== "active"
    ? []
    : record.assigneeIds
        .filter((id) => id !== VIEWER_ID)
        .map((id) => usersById.get(id))
        .filter((u): u is NonNullable<typeof u> => u != null)
        .map((u) => ({ kind: "live" as const, content: "image" as const, imageSrc: u.avatar, name: u.name }));

// On mobile "Details" (the desktop right sidebar) is the first tab and the
// tabs SWITCH the content (details vs placeholder); the desktop tabs stay
// static for now.
const Tabs = ({
  withDetails = false,
  value,
  onChange,
}: {
  withDetails?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}) => (
  // UNDERLINED (Daniel, 2026-10-04) — these are page sections, and the style
  // ignores `size`: the tab stretches to fill its bar so the line lands on the
  // bar's bottom edge.
  <TabGroup variant="underlined" value={value} onChange={onChange} defaultValue={value == null ? "service" : undefined}>
    {withDetails && <TabItem value="details">Details</TabItem>}
    <TabItem value="service">Service</TabItem>
    <TabItem value="timesheet">Timesheet</TabItem>
    <TabItem value="summary">Summary</TabItem>
    <TabItem value="activity">Activity</TabItem>
  </TabGroup>
);

/**
 * The page's SECTION NAVIGATION — its own bar, not a part of TopBarNav
 * (Daniel, 2026-10-04). On desktop it lives INSIDE the content area, so it
 * spans only the main column and never runs over the right sidebar; on mobile
 * it sits directly under the top bar. 60px like the top bar, transparent like
 * every app surface, with its own inner bottom stroke.
 */
const SectionTabs = ({
  withDetails = false,
  value,
  onChange,
  hideOnScroll = false,
}: {
  withDetails?: boolean;
  value: string;
  onChange: (value: string) => void;
  /** Mobile: stick under the top bar and hide while scrolling DOWN (see below). */
  hideOnScroll?: boolean;
}) => {
  const hidden = useHideOnScroll(hideOnScroll);
  const bar = (
    <div className={styles.sectionTabs}>
      {/* A plain horizontal scroller — NO edge fades (Daniel, 2026-10-04): the
          bar holds nothing but the tabs, so a fade marking "more content" is
          redundant. */}
      <div className={styles.sectionTabsScroller}>
        <div className={styles.sectionTabsInner}>
          <Tabs withDetails={withDetails} value={value} onChange={onChange} />
        </div>
      </div>
    </div>
  );
  if (!hideOnScroll) return bar;
  // The collapsing wrapper: the bar is bottom-anchored inside a height-animated
  // clip, so closing it looks like the row sliding up behind the top bar.
  return (
    <div ref={hidden.ref} className={clsx(styles.sectionTabsCollapse, hidden.hidden && styles.sectionTabsCollapsed)}>
      {bar}
    </div>
  );
};

/**
 * The mobile tabs bar's hide-on-scroll (Daniel, 2026-10-05) — the rule the old
 * TopBarNav's second tabs row had, now that the tabs are their own bar:
 * scrolling DOWN slides the row away, and the first scroll UP (or reaching the
 * top) brings it straight back.
 *
 * It listens on the nearest scrollable ANCESTOR, so the bar does not need to
 * know which shell it is in.
 */
function useHideOnScroll(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (!active) {
      setHidden(false);
      return undefined;
    }
    const el = ref.current;
    if (el == null) return undefined;
    let sc: HTMLElement | null = el.parentElement;
    while (sc != null && !/(auto|scroll)/.test(getComputedStyle(sc).overflowY)) sc = sc.parentElement;
    // Collapsing the row changes layout — stop the browser's scroll anchoring
    // from compensating for it, which reads as a scroll and feeds back.
    const prevAnchor = sc?.style.overflowAnchor ?? "";
    if (sc != null) sc.style.overflowAnchor = "none";
    const read = () => (sc != null ? sc.scrollTop : window.scrollY);
    let last = read();
    let ignoreUntil = 0;
    const onScroll = () => {
      const y = read();
      const dy = y - last;
      last = y;
      // Our own collapse can clamp scrollTop near the bottom — ignore those
      // echoes while the height transition runs.
      if (performance.now() < ignoreUntil) return;
      if (y <= 0) setHidden(false);
      else if (dy > 2) {
        setHidden(true);
        ignoreUntil = performance.now() + 250;
      } else if (dy < -2) setHidden(false);
    };
    const target: HTMLElement | Window = sc ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      target.removeEventListener("scroll", onScroll);
      if (sc != null) sc.style.overflowAnchor = prevAnchor;
    };
  }, [active]);
  return { ref, hidden };
}

interface TopBarProps {
  mobile?: boolean;
  /** Who is on the job right now — its own assignees, and only while active. */
  liveUsers: AvatarGroupItem[];
  /** Leaving the job — the app sends you back to the list it came from. */
  onBack?: () => void;
  /** Desktop: the job's primary actions. The mobile ActionBar owns them instead. */
  actions?: ReactNode;
}

// The page's top bar: back + title, live users, and (on desktop) the job's
// actions on the right. It carries NO tabs — they are their own bar — and no
// context-menu ellipsis next to the job id: its two items moved into the
// actions menu (Daniel, 2026-10-04).
const TopBar = ({ mobile = false, onBack, liveUsers, actions }: TopBarProps) => {
  const jobId = useCurrentJobId();
  return (
  <TopBarNav liveUsers={liveUsers} actions={actions} breakpoint={mobile ? "mobile" : "desktop"}>
    <TopBarNavLeftElements onBack={onBack}>
      {/* NO job avatar here (Daniel, 2026-09-26, after trying it on JOB-1094):
          the top bar carries the title alone. The avatar still leads the
          action menu's drawer header, where it identifies the job being acted
          on rather than repeating the page you are already looking at. */}
      <TopBarNavTitle title={jobId} />
    </TopBarNavLeftElements>
  </TopBarNav>
  );
};

// ---- job context menu (the ellipsis next to the title) ---------------------

// Simulated download: the processing toast resolves into the success one
// (the designed error toast would take its place on a real failure).
const downloadPdf = () => {
  const id = toast({ type: "processing", title: "Downloading PDF..." });
  window.setTimeout(() => toast.update(id, { type: "success", title: "PDF downloaded" }), 2000);
};

/**
 * The signed-in user is an ADMIN (Daniel, 2026-10-06: the demo is Lorne
 * Riddle's view and "he should be able to do everything within the app").
 *
 * The demo database has no role model yet, so this is a constant rather than
 * something read off the user — when roles arrive, this is the one place that
 * changes. It is what lets the Timesheet be managed for every tech, not only
 * for the person looking.
 */
const VIEWER_IS_ADMIN = true;

/** The signed-in user — Lorne Riddle. The whole demo is his screen. */
const VIEWER_ID = 1;

const copyJobUrl = () => void copyText(window.location.href, "Job URL");

// "Copy URL" / "Download PDF". They used to be a context menu of their own,
// behind an ellipsis next to the job id; that ellipsis is gone and they are
// the FIRST group of the actions menu now — one menu for everything you can
// do to the job, at both breakpoints (Figma 24049-13712 / 24049-13724).
//
// A CANCELLED job has no menu at all any more: the same two actions are its
// only bar buttons (Figma 24569-142615), and they call the same two functions.
const linkMenuItems = (onClose: () => void) => (
  <MenuItemGroup>
    <MenuItem
      label="Copy URL"
      slotLeft={slot("link")}
      onClick={() => {
        onClose();
        copyJobUrl();
      }}
    />
    <MenuItem
      label="Download PDF"
      slotLeft={slot("download")}
      onClick={() => {
        onClose();
        downloadPdf();
      }}
    />
  </MenuItemGroup>
);

// Handlers shared by the action-bar buttons and its overflow menu.
interface JobActions {
  onStart: () => void;
  onSchedule: () => void;
  onPause: () => void;
  /** "Put on hold" — the same form as Pause, opened on the on-hold Type. */
  onHold: () => void;
  onResume: () => void;
  onChangeActive: () => void;
  onChangePause: () => void;
  onComplete: () => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onReschedule: () => void;
  onUnschedule: () => void;
  onCancel: () => void;
  // Completed-job actions (Figma 24567-138760).
  onMarkInvoiced: () => void;
  onMarkEstimated: () => void;
  onResendSummary: () => void;
  /** Create invoice / estimate / recall — nothing opens yet (Daniel,
   *  2026-08-07), but each still writes its Activity log. */
  onCreateInvoice: () => void;
  onCreateEstimate: () => void;
  onCreateRecall: () => void;
}

/** A menu anchored to one of the action-bar buttons. */
interface MenuTrigger {
  onActions: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  open: boolean;
}

// The primary-actions row. Every status opens with the same ghost "Actions"
// button (leading `ellipsis`) that opens the overflow menu, then its own
// buttons:
//   upcoming/pastDue → Start      unscheduled → Schedule
//   active           → Complete   paused / held → Resume
//   completed        → "Mark as" + "Create"   (Figma 24567-138761 / 138770)
//   finalized        → "Resend summary" (desktop only) + "Create recall"
//                      (Figma 24568-141431 / 141441)
//   cancelled        → NO Actions button and no menu: Copy URL + Download PDF
//                      ARE the two buttons (Figma 24569-142615 / 24972-52200)
const ActionButtons = ({
  status,
  onMenu,
  menuPressed,
  actions,
  markAsMenu,
  createMenu,
  mobile = false,
}: {
  status: JobStatus;
  onMenu: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  menuPressed: boolean;
  actions: JobActions;
  markAsMenu: MenuTrigger;
  createMenu: MenuTrigger;
  /**
   * The mobile ActionBar is a full-width row, so its buttons stretch. In the
   * desktop top bar they hug instead (Daniel, 2026-10-04). It also decides
   * WHICH buttons a finalized job gets — the mobile bar has room for two, so
   * "Resend summary" moves into the menu there (Figma 24972-52007).
   */
  mobile?: boolean;
}) => {
  const grow = mobile ? styles.grow : undefined;
  // The overflow trigger is a LABELLED ghost button on every status, not an
  // icon-only ellipsis (Figma 24971-51627 / 24972-51954, 2026-10-06).
  const actionsButton = (extraClass?: string) => (
    <Button
      size="lg"
      variant="ghost"
      leftIcon="ellipsis"
      className={extraClass}
      isPressed={menuPressed}
      noDebounce
      onClick={onMenu}
    >
      Actions
    </Button>
  );
  if (status === "cancelled") {
    // A cancelled job has no lifecycle actions left, so the two link actions
    // come OUT of the overflow menu and become the bar itself. Nothing opens a
    // menu here any more.
    return (
      <>
        <Button size="lg" variant="ghost" leftIcon="link" className={grow} onClick={copyJobUrl}>
          Copy URL
        </Button>
        <Button size="lg" variant="ghost" leftIcon="download" className={grow} onClick={downloadPdf}>
          Download PDF
        </Button>
      </>
    );
  }
  if (status === "completed") {
    // All THREE share the mobile bar equally (Daniel, 2026-10-06) — the node
    // draws "Actions" hugging at 96px, and he chose the even split instead, so
    // the row matches every other status. Both other buttons OPEN A MENU, so
    // each holds its pressed look while its menu shows (the SidebarNav
    // Create-button pattern).
    return (
      <>
        {actionsButton(grow)}
        <Button
          size="lg"
          variant="solid"
          rightIcon="angle-down"
          className={grow}
          isPressed={markAsMenu.open}
          noDebounce
          onClick={markAsMenu.onActions}
        >
          Mark as
        </Button>
        <Button
          size="lg"
          variant="solid"
          rightIcon="angle-down"
          className={grow}
          isPressed={createMenu.open}
          noDebounce
          onClick={createMenu.onActions}
        >
          Create
        </Button>
      </>
    );
  }
  if (status === "finalized") {
    // Everything else about a finalized job is done, so all three buttons are
    // GHOST — nothing here is the one obvious next step.
    return (
      <>
        {actionsButton(grow)}
        {!mobile && (
          <Button size="lg" variant="ghost" leftIcon="paper-plane" onClick={actions.onResendSummary}>
            Resend summary
          </Button>
        )}
        <Button size="lg" variant="ghost" leftIcon="clock-rotate-left" className={grow} onClick={actions.onCreateRecall}>
          Create recall
        </Button>
      </>
    );
  }
  if (status === "unscheduled") {
    // TWO BUTTONS, no icon-only ellipsis (Figma 24049-13645 desktop /
    // 24054-13448 mobile, 2026-10-04): a ghost "Actions" that opens the menu,
    // and the solid "Schedule". On mobile both fill half the bar.
    //
    // The icon is the node's LEADING `ellipsis`. A trailing `--dropdown` was
    // tried on 2026-10-04 (the ellipsis is a label-substitute next to a label,
    // and "a menu opens here" is the more useful signal) — Daniel kept the
    // ellipsis for now.
    return (
      <>
        {actionsButton(grow)}
        <Button size="lg" variant="solid" leftIcon="calendar-lines-pen" className={grow} onClick={actions.onSchedule}>
          Schedule
        </Button>
      </>
    );
  }
  if (status === "active") {
    // Two Buttons (Figma 24058-15415 desktop / 24058-15423 mobile,
    // 2026-10-04): the Pause button left the bar for the menu, and Complete
    // is named "Complete".
    return (
      <>
        {actionsButton(grow)}
        <Button size="lg" variant="solid" leftIcon="circle-check" className={grow} onClick={actions.onComplete}>
          Complete
        </Button>
      </>
    );
  }
  if (status === "quickPaused" || status === "onHold") {
    // Paused / held: ghost "Actions" + the solid "Resume" (Figma 24096-19208
    // paused / 24970-48536 held, 2026-10-05). No Complete while stopped.
    return (
      <>
        {actionsButton(grow)}
        <Button size="lg" variant="solid" leftIcon="circle-play" className={grow} onClick={actions.onResume}>
          Resume
        </Button>
      </>
    );
  }
  // upcoming / pastDue — the same two Buttons as unscheduled (Figma
  // 24042-14995 desktop / 24055-13310 mobile, 2026-10-04): ghost "Actions"
  // opens the menu, solid "Start" opens the Start dialog.
  return (
    <>
      {actionsButton(grow)}
      <Button size="lg" variant="solid" leftIcon="circle-play" className={grow} onClick={actions.onStart}>
        Start
      </Button>
    </>
  );
};

// A completed job's two button menus (Figma 24590-204304 / 24590-203981).
// They are ONLY behind their own buttons now — the overflow menu no longer
// repeats them (Figma 24567-138776, 2026-10-06).
const createMenuItems = (actions: JobActions) => (
  <MenuItemGroup>
    <MenuItem label="Create invoice" slotLeft={slot("circle-dollar")} onClick={actions.onCreateInvoice} />
    <MenuItem label="Create estimate" slotLeft={slot("clock")} onClick={actions.onCreateEstimate} />
  </MenuItemGroup>
);
const markAsMenuItems = (actions: JobActions) => (
  <MenuItemGroup>
    <MenuItem label="Mark as invoiced" slotLeft={slot("circle-dollar")} onClick={actions.onMarkInvoiced} />
    <MenuItem label="Mark as estimated" slotLeft={slot("clock")} onClick={actions.onMarkEstimated} />
  </MenuItemGroup>
);

// The action-bar overflow menu — items depend on the job's state.
// IMPORTANT: call this as a FUNCTION ({jobActionMenuItems(...)}), not as a
// component — Menu's withGroupDividers can only see the MenuItemGroups when it
// receives the fragment itself; a component element hides them, and the
// between-group dividers silently disappear (Daniel caught this, 2026-07-21).
const jobActionMenuItems = ({
  status,
  actions,
  onClose,
  mobile = false,
}: {
  status: JobStatus;
  actions: JobActions;
  /** Closes the menu — the link items act and dismiss. */
  onClose: () => void;
  /**
   * The mobile bar fits fewer buttons, so a FINALIZED job's "Resend summary"
   * is a menu item there and a bar button on desktop (Figma 24972-52007 vs
   * 24972-52019).
   */
  mobile?: boolean;
}) => {
  const links = linkMenuItems(onClose);
  // The labels name the ACTION, without repeating "job" — the menu is already
  // the job's (Figma 24049-13712 / 24042-15254, 2026-10-04).
  const cancel = (
    <MenuItemGroup>
      <MenuItem label="Cancel" slotLeft={slot("ban")} danger onClick={actions.onCancel} />
    </MenuItemGroup>
  );
  // A completed job (Figma 24567-138776, re-read 2026-10-06): the links, then
  // recall / resend / resume. The Create and Mark-as actions are NOT repeated
  // here any more — each has its own button in the bar, with its own menu.
  if (status === "completed") {
    return (
      <>
        {links}
        <MenuItemGroup>
          <MenuItem label="Create recall" slotLeft={slot("clock-rotate-left")} onClick={actions.onCreateRecall} />
          <MenuItem label="Resend summary" slotLeft={slot("paper-plane")} onClick={actions.onResendSummary} />
          {/* The one STATUS action in this menu, so it carries the solid icon
              in its status colour — the same rule the active menu follows. */}
          <MenuItem label="Resume job" slotLeft={slot("circle-play", "solid", "var(--jade-a9)")} onClick={actions.onResume} />
        </MenuItemGroup>
      </>
    );
  }
  // A finalized job (Figma 24972-52019 desktop / 24972-52007 mobile): the
  // links, and on mobile the "Resend summary" the bar had no room for.
  if (status === "finalized") {
    return (
      <>
        {links}
        {mobile && (
          <MenuItemGroup>
            <MenuItem label="Resend summary" slotLeft={slot("paper-plane")} onClick={actions.onResendSummary} />
          </MenuItemGroup>
        )}
      </>
    );
  }
  if (status === "unscheduled") {
    // No "Schedule job" item — Schedule is a BUTTON in the bar now, so the
    // menu is only the links and Cancel (Figma 24049-13712 / 24049-13724).
    return (
      <>
        {links}
        {cancel}
      </>
    );
  }
  if (status === "active") {
    // Figma 24057-16092 (re-read 2026-10-04): the links, then ONE group of
    // four. No Complete item — Complete is the bar's button — and PAUSE and
    // PUT ON HOLD are separate entries now, each opening the Pause form on its
    // own Type. "Change job active status" is annotated "exists only if a
    // company supports active sub-statuses"; the demo has none configured, so
    // it is shown unconditionally for now — flagged.
    return (
      <>
        {links}
        <MenuItemGroup>
          {/* "Exists only if a company supports active sub-statuses" (the
              node's annotation). The demo company has them OFF, so this item
              does not appear here — see StartJobForm's "Active sub-statuses"
              story for the feature switched on. */}
          {/* The three STATUS actions carry solid icons in their status colour,
              so they are easier to pick out of the list (Daniel, 2026-10-05 —
              Figma 24057-16092). Reschedule is not a status change, so it
              keeps the plain regular icon. */}
          {COMPANY.subStatuses.active && (
            <MenuItem
              label="Change job active status"
              slotLeft={slot("circle-play", "solid", "var(--jade-a9)")}
              onClick={actions.onChangeActive}
            />
          )}
          <MenuItem label="Pause" slotLeft={slot("circle-pause", "solid", "var(--amber-a9)")} onClick={actions.onPause} />
          <MenuItem label="Hold" slotLeft={slot("circle-stop", "solid", "var(--crimson-a9)")} onClick={actions.onHold} />
          <MenuItem label="Reschedule" slotLeft={slot("calendar-lines-pen")} onClick={actions.onReschedule} />
        </MenuItemGroup>
      </>
    );
  }
  // Paused (Figma 24096-19267) and HELD (24970-48552) — the same shape, one
  // status action each, named for the status it changes. No Resume item:
  // Resume is the bar's button. No Cancel item in this design.
  if (status === "quickPaused" || status === "onHold") {
    const held = status === "onHold";
    return (
      <>
        {links}
        <MenuItemGroup>
          <MenuItem
            label={held ? "Change job on hold status" : "Change job pause status"}
            slotLeft={
              held
                ? slot("circle-stop", "solid", "var(--crimson-a9)")
                : slot("circle-pause", "solid", "var(--amber-a9)")
            }
            onClick={actions.onChangePause}
          />
          <MenuItem label="Reschedule" slotLeft={slot("calendar-lines-pen")} onClick={actions.onReschedule} />
        </MenuItemGroup>
      </>
    );
  }
  // Scheduled / upcoming / pastDue (Figma 24042-15254 desktop / 24042-15137
  // mobile, re-read 2026-10-04): the links, then ONE group holding Unschedule
  // and the danger Cancel — they used to be two groups with a line between.
  // NO "Start" item — Start is a button in the bar now, the same way Schedule
  // left the unscheduled menu.
  return (
    <>
      {links}
      <MenuItemGroup>
        <MenuItem label="Unschedule" slotLeft={slot("calendar-xmark")} onClick={actions.onUnschedule} />
        <MenuItem label="Cancel" slotLeft={slot("ban")} danger onClick={actions.onCancel} />
      </MenuItemGroup>
    </>
  );
};

// The mobile menu drawer's header: the JOB ID, and nothing else (Figma
// 24049-13724, 2026-10-04). It used to carry an AvatarJob and the status
// caption as well; the drawer only has to say which job it is acting on.
const JobMenuHeader = () => (
  <DrawerHeader>
    <PopoverHeaderContent>
      <PopoverHeaderText title={useCurrentJobId()} />
    </PopoverHeaderContent>
  </DrawerHeader>
);

/** A marked empty area — where real content lands in later slices. */
const Placeholder = ({ className }: { className?: string }) => (
  <div className={clsx(styles.placeholder, className)}>
    <span>Content</span>
  </div>
);

// ---- SidebarNav config (display only) ------------------------------------


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
          {/* "Series", not "Job series" (Daniel, 2026-09-14) — the sub-menu's
              title already says "Create job". */}
          <MenuItem label="Series" slotLeft={slot(semanticIcons.series)} />
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
    <MenuItem label="Client" slotLeft={slot(semanticIcons.clientGeneric)} />
    <MenuItem
      label="Pricebook item"
      slotLeft={slot(semanticIcons.pricebook)}
      subMenu={
        <MenuItemGroup>
          <MenuItem label="Labor rate" slotLeft={slot(semanticIcons.laborRate)} />
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
    <SidebarNavItem icon="house">Home</SidebarNavItem>
    <SidebarNavItem icon={semanticIcons.estimate}>Estimates</SidebarNavItem>
    {/* The current page (a job's details) lives under Jobs — open + active. */}
    <SidebarNavItemGroup icon={semanticIcons.job} label="Jobs" defaultOpen>
      <SidebarNavItem type="stackItem">Job requests</SidebarNavItem>
      <SidebarNavItem type="stackItem" active>
        Jobs
      </SidebarNavItem>
      <SidebarNavItem type="stackItem">Job series</SidebarNavItem>
    </SidebarNavItemGroup>
    <SidebarNavItemGroup icon={semanticIcons.invoice} label="Invoices">
      <SidebarNavItem type="stackItem">Invoices</SidebarNavItem>
      <SidebarNavItem type="stackItem">Credit notes</SidebarNavItem>
    </SidebarNavItemGroup>
    <SidebarNavItem icon={semanticIcons.purchaseOrder}>Purchase orders</SidebarNavItem>
    <SidebarNavItem icon={semanticIcons.bill}>Bills</SidebarNavItem>
    <SidebarNavItem icon={semanticIcons.vendor}>Vendors</SidebarNavItem>
    <SidebarNavItem icon={semanticIcons.clientGeneric}>Clients</SidebarNavItem>
    <SidebarNavItemGroup icon={semanticIcons.pricebook} label="Pricebook">
      <SidebarNavItem type="stackItem">Labor rates</SidebarNavItem>
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

// ---- time-tracking helpers -------------------------------------------------

// Date formatters for a logged time session.
const TIME_FMT = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true }); // "11:30 AM"
const MONTH_FMT = new Intl.DateTimeFormat("en-US", { month: "short" }); // "Jan"
const FULL_DATE_FMT = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }); // "January 1, 2026"
const WEEKDAY_DATE_FMT = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }); // "Monday, January 1"
const WEEKDAY_DATE_YEAR_FMT = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }); // "Monday, January 1, 2025"
// Session date caption (node 21803-49414): "Monday, January 1" — the year is
// shown ONLY when it is not the current one (Daniel's rule).
const weekdayDate = (d: Date) => (d.getFullYear() === new Date().getFullYear() ? WEEKDAY_DATE_FMT : WEEKDAY_DATE_YEAR_FMT).format(d);

// Session moments in the ACTIVITY LOG are short: "Mon, Jan 1 at 11:30 AM"
// (Figma 24453-26325). Year only when it is not the current one, like every
// other date in the app.
const SHORT_DATE_FMT = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }); // "Mon, Jan 1"
const SHORT_DATE_YEAR_FMT = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
const shortDate = (d: Date) => (d.getFullYear() === new Date().getFullYear() ? SHORT_DATE_FMT : SHORT_DATE_YEAR_FMT).format(d);
const sessionMoment = (d: Date) => `${shortDate(d)} at ${TIME_FMT.format(d)}`;
// The same moment rebuilt from a stored session's labels ("January 1, 2026" +
// "11:30 AM"), for the side of an edit that is already logged.
const storedMoment = (dateLabel?: string, timeLabel?: string) =>
  dateLabel == null || timeLabel == null ? "" : `${shortDate(new Date(dateLabel))} at ${timeLabel}`;
/** A session's range in a log: "Mon, Jan 1 at 9:00 AM → Mon, Jan 1 at 2:30 PM". */
const sessionRangeLabel = (start: string, end: string) => `${start} → ${end}`;

/** "Monday, January 1 at 12:00 PM" — how a slot is written in the logs. */
const longSlotLabel = (s: Scheduling) => (s.date != null ? `${weekdayDate(s.date)} at ${s.time}` : "");

/** A tech status as a log value: its icon in regular weight (Daniel, 2026-08-05). */
const statusValueIcon = (status: string): ValueIcon => ({ icon: categoryIcon(status), pack: "regular" });

// Each job status owns its activity-log glyph — solid, in its own color
// (Figma 24512-62842).
type JobGlyph = { icon: string; color: string };
const JOB_GLYPH = {
  scheduled: { icon: "circle-half-stroke", color: "var(--blue-9)" },
  unscheduled: { icon: "circle-dashed", color: "var(--violet-9)" },
  active: { icon: "circle-play", color: "var(--jade-9)" },
  quickPaused: { icon: "circle-pause", color: "var(--amber-9)" },
  onHold: { icon: "circle-stop", color: "var(--crimson-9)" },
  cancelled: { icon: "circle-xmark", color: "var(--gray-a8)" },
  completed: { icon: "circle-check", color: "var(--orange-9)" },
  finalized: { icon: "circle-check", color: "var(--jade-9)" },
} satisfies Record<string, JobGlyph>;

// The pause logs name the SUB-STATUS when the company has them; without any,
// they fall back to the pause type's own name (Daniel, 2026-08-05).
const pauseGlyph = (type: string) => (type === "quick-pause" ? JOB_GLYPH.quickPaused : JOB_GLYPH.onHold);

// Not every log has a person behind it. FINALIZING is the system's doing — the
// user only creates an object from the job, or marks it as invoiced /
// estimated (Daniel, 2026-08-07; Figma 24567-140255 signs that log "Roopairs").
const SYSTEM_USER: User = { id: -1, firstName: "Roopairs", lastName: "", name: "Roopairs", avatar: "" };

// A MODULE glyph: regular weight, plain gray — `color: ""` is what tells the
// renderer this is not a job status. Used by the "created from" and Forms logs.
const moduleGlyph = (icon: string): JobGlyph => ({ icon, color: "" });
const pauseStatusName = (type: string, subStatus: string) =>
  subStatus !== "" ? subStatus : type === "quick-pause" ? "Quick-pause" : "On-hold";

// "09:35" + "AM" → a Date on `date` (12-hour → 24-hour).
const combineDateTime = (date: Date, clock: string, meridiem: Meridiem): Date => {
  const [h, m] = clock.split(":").map(Number);
  const hour = (h % 12) + (meridiem === "PM" ? 12 : 0);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, m);
};
// "09:35" + "AM" → "9:35 AM" (drop the hour's leading zero, matching TIME_FMT).
const clockToLabel = (clock: string, meridiem: Meridiem) => {
  const [h, m] = clock.split(":");
  return `${parseInt(h, 10)}:${m} ${meridiem}`;
};

// A session as stored in shell state (live values are derived at render from `elapsed`).
interface StoredSession {
  id: number;
  /**
   * Whose session it is. Seeded history carries several techs; a session
   * logged live here has none and belongs to the viewer.
   */
  userId?: number;
  startLabel: string;
  month: string;
  day: string;
  dateLabel: string;
  /** Start date as "Monday, January 1" (+ year only when not current). */
  weekdayLabel?: string;
  active: boolean;
  endLabel?: string;
  endDateLabel?: string;
  /** End date as "Monday, January 1" (+ year only when not current). */
  endWeekdayLabel?: string;
  durationSec: number;
  /** Check-out split category ("Travelling" / "Working"). */
  category?: string;
}

// elapsed seconds → "M:SS" / "MM:SS" / "H:MM:SS"
const formatElapsed = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};

// elapsed seconds → always "HH:MM:SS" (the session drawer's big timer — the
// Figma shows zero-padded hours: "01:15:45").
const formatElapsedFull = (s: number) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};

// The DESKTOP session bar — pinned under the action bar on every status but
// Unscheduled / Cancelled. Three states: a running session (solid-tomato
// status avatar, red elapsed + the status caption, ellipsis menu — Figma
// 24357-35024); idle on an ACTIVE job (amber warning avatar, "00:00"
// placeholder + amber "Not tracking your time" — 24178-58685); idle on any
// other status (NEUTRAL: gray avatar w/ a regular stopwatch, "00:00"
// placeholder + subtle "Check in to track your time" — 24358-37516). Both
// idles end in the ghost "Check in" button.
const SessionBar = ({
  checkedIn,
  jobActive,
  elapsed,
  category,
  onCheckIn,
  onCheckOut,
  onSwitchStatus,
}: {
  checkedIn: boolean;
  /** Job status is "active" — picks the amber vs neutral idle look. */
  jobActive: boolean;
  elapsed: number;
  /** The running session's check-in status (one of TECH_STATUSES). */
  category?: string;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onSwitchStatus: (status: string) => void;
}) => {
  // Active bar's ellipsis → the Time Session Context Menu (Figma 24358-37623).
  // Left-aligned like every other menu; against the screen edge the placement
  // helper flips it to the trigger's right edge.
  const menu = useAnchoredMenu(true);
  // The avatar is the DS Avatar (36px square icon tile), not a hand-built box.
  // Running = solid tomato with the status glyph; idle on an ACTIVE job = the
  // DS AvatarWarning (amber-a3 tile, amber-a11 glyph — it was a SOLID amber
  // box before, Daniel 2026-10-04); idle otherwise = a gray tile with the
  // regular stopwatch.
  const avatar = checkedIn ? (
    <Avatar
      size="xl"
      shape="square"
      content="icon"
      icon={categoryIcon(category)}
      iconPack="solid"
      backgroundColor="var(--tomato-9)"
      iconColor="var(--tomato-1)"
    />
  ) : jobActive ? (
    <AvatarWarning size="xl" />
  ) : (
    <Avatar
      size="xl"
      shape="square"
      content="icon"
      icon="stopwatch"
      iconPack="regular"
      backgroundColor="var(--gray-a3)"
      iconColor="var(--gray-a8)"
    />
  );
  return (
    <div className={styles.timerBar}>
      <div className={styles.timerRow}>
        {avatar}
        {/* The copy is ItemText (Figma 24357-35024 / 24358-37516 /
            24596-41059): the clock is the TITLE and the status the CAPTION.
            The clock is NOT tabular — the nodes ask for plain body/500
            compact, and ItemTextLine's own font-feature-settings would win
            over a consumer override anyway. */}
        <ItemText
          variant="titleCaption"
          title={checkedIn ? formatElapsed(elapsed) : "00:00"}
          titleColor={checkedIn ? "error" : "placeholder"}
          caption={checkedIn ? category ?? "Tracking your time" : jobActive ? "Not tracking your time" : "Check in to track your time"}
          captionColor={!checkedIn && jobActive ? "warning" : undefined}
        />
        {checkedIn ? (
          <IconButton
            icon="ellipsis"
            size="lg"
            variant="ghost"
            aria-label="Time session actions"
            isPressed={menu.open}
            noDebounce
            onClick={menu.onActions}
          />
        ) : (
          <Button size="lg" variant="ghost" leftIcon="arrow-right-to-arc" onClick={onCheckIn}>
            Check in
          </Button>
        )}
      </div>
      {menu.pos != null && (
        <div ref={menu.cardRef} className={styles.contextMenu} style={{ top: menu.pos.top, left: menu.pos.left, right: menu.pos.right }}>
          <Menu open={menu.open} onClose={menu.close} breakpoint="desktop" className={styles.sessionMenuCard}>
            <MenuItemGroup>
              <MenuItem
                label="Your status"
                slotLeft={slot(categoryIcon(category))}
                tag={category}
                // SelectList rows — all four statuses, check on the current one.
                subMenu={
                  <StatusItems
                    current={category}
                    onPick={(status) => {
                      menu.close();
                      onSwitchStatus(status);
                    }}
                  />
                }
              />
            </MenuItemGroup>
            <MenuItemGroup>
              <MenuItem
                label="Check out"
                slotLeft={slot("arrow-left-from-arc")}
                onClick={() => {
                  menu.close();
                  onCheckOut();
                }}
              />
            </MenuItemGroup>
          </Menu>
        </div>
      )}
    </div>
  );
};

// The MOBILE session pill — floats 12px above the action bar, left-aligned,
// on every status but Unscheduled / Cancelled. Running session: tomato pill
// with the solid status icon + live time (tap → the session drawer — Figma
// 24191-72816). Idle on an ACTIVE job: amber warning "Check in" pill
// (24181-59172). Idle otherwise: the NEUTRAL white pill — regular
// arrow-right-to-arc + "Check in" in strong (24358-37529). Idle taps open
// the Check in dialog.
const SessionPill = ({
  checkedIn,
  jobActive,
  elapsed,
  category,
  onClick,
}: {
  checkedIn: boolean;
  /** Job status is "active" — picks the amber vs neutral idle look. */
  jobActive: boolean;
  elapsed: number;
  category?: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    className={clsx(styles.pill, checkedIn ? styles.pillActive : jobActive ? styles.pillIdle : styles.pillNeutral)}
    aria-label={checkedIn ? "Active time session" : "Check in"}
    onClick={onClick}
  >
    <Icon
      icon={checkedIn ? categoryIcon(category) : jobActive ? "warning" : "arrow-right-to-arc"}
      pack={checkedIn || jobActive ? "solid" : "regular"}
    />
    <span className={clsx(styles.pillLabel, checkedIn && styles.pillTime)}>
      {checkedIn ? formatElapsed(elapsed) : "Check in"}
    </span>
  </button>
);

// The mobile "Time tracker" dialog (Figma 24178-58902, 2026-08-07 update) —
// opened by tapping the active pill. The header is the DRAG HANDLE ONLY (no
// title row, no close button): the drawer is dismissed by dragging it down or
// tapping the scrim. Body = the current STATUS caption + big red timer + the
// "Your status" card radios (a draft pick); footer = subtle "Check out" (→ the
// prompt) and solid "Update", which commits a status switch. Dismissing with an
// unsaved pick shows the Dialog's standard "Discard changes?" prompt.
const SessionDrawer = ({
  open,
  elapsed,
  category,
  onClose,
  onCheckOut,
  onSwitchStatus,
}: {
  open: boolean;
  elapsed: number;
  category?: string;
  onClose: () => void;
  onCheckOut: () => void;
  onSwitchStatus: (status: string) => void;
}) => {
  // The pick is a DRAFT — only Update commits (Figma annotation).
  const [draft, setDraft] = useState(category ?? "");
  useEffect(() => {
    if (open) setDraft(category ?? "");
  }, [open, category]);
  const dirty = draft !== (category ?? "");
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Time tracker"
      drawerHeader="dragHandle"
      breakpoint="mobile"
      confirmOnDismiss={dirty}
      footer={
        // Figma 24178-58902: NO Cancel — two equal-width buttons, subtle
        // "Check out" and solid "Update", each filling half the bar.
        <PopoverFooter stretch>
          <Button size="lg" variant="subtle" leftIcon="arrow-left-from-arc" isFullWidth onClick={onCheckOut}>
            Check out
          </Button>
          <Button
            size="lg"
            variant="solid"
            isFullWidth
            onClick={() => {
              if (draft !== "" && draft !== category) onSwitchStatus(draft);
              onClose();
            }}
          >
            Update
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.sessionDrawerBody}>
        <div className={styles.sessionDrawerValue}>
          <span className={styles.sessionDrawerCaption}>{category ?? "Tracking your time"}</span>
          <span className={styles.sessionDrawerClock}>{formatElapsedFull(elapsed)}</span>
        </div>
        {/* The status is picked from card radios now, not a select + drawer. */}
        <Input label="Your status">
          <RadioGroup value={draft} onChange={setDraft}>
            {TECH_STATUSES.map((s) => (
              <RadioItem key={s.value} value={s.value} variant="card" icon={s.icon} iconPack="regular" label={s.value} />
            ))}
          </RadioGroup>
        </Input>
      </div>
    </Dialog>
  );
};

// The "Check in" dialog (Figma desktop 24194-74815, 2026-08-04 update) —
// opened from the idle bar's "Check in" button and the idle pill. The status
// is picked from a VERTICAL stack of card radios now, one per tech status, not
// from a select + popover (error "Choose Status"); confirming starts the
// session ("You're checked in").
const CheckInDialog = ({
  open,
  onClose,
  onCheckIn,
  mobile = false,
}: {
  open: boolean;
  onClose: () => void;
  onCheckIn: (status: string) => void;
  mobile?: boolean;
}) => {
  const [status, setStatus] = useState("");
  const [showError, setShowError] = useState(false);
  useEffect(() => {
    if (!open) return;
    setStatus("");
    setShowError(false);
  }, [open]);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Check in"
      breakpoint={mobile ? "mobile" : "desktop"}
      confirmOnDismiss={status !== ""}
      footer={
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button
            size="lg"
            variant="solid"
            leftIcon="arrow-right-to-arc"
            onClick={() => {
              if (status === "") {
                setShowError(true);
                return;
              }
              onCheckIn(status);
              onClose();
            }}
          >
            Check in
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.sessionDrawerBody}>
        {/* "Your status" — the same label the Time-tracker drawer uses
            (Daniel, 2026-08-04: one wording across the two). */}
        <Input label="Your status">
          <RadioGroup
            value={status}
            onChange={(v) => {
              setStatus(v);
              setShowError(false);
            }}
            isValid={!(showError && status === "")}
            // The derived message would read "Choose Your status" — written
            // out so the sentence stays natural.
            errorMessage="Choose your status"
          >
            {TECH_STATUSES.map((s) => (
              <RadioItem key={s.value} value={s.value} variant="card" icon={s.icon} iconPack="regular" label={s.value} />
            ))}
          </RadioGroup>
        </Input>
      </div>
    </Dialog>
  );
};

// ---- shared shell state ----------------------------------------------------

// "January 1, 2026" — how the equipment modules print an installation date
// (the five demo pieces are written that way).
const EQUIPMENT_DATE = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });

// Owns the job lifecycle + scheduling + the two menus + all the job forms
// (Start / Cancel / Pause / Resume / Change status / Complete) and the time
// sessions (check-in/out + add/edit/delete). Both shells use it; only the
// anchored-menu mode (desktop card vs mobile drawer) and layout differ.
function useJobShell(isDesktop: boolean, record: ListJob) {
  const actionMenu = useAnchoredMenu(isDesktop); // the actions ellipsis
  // A completed job's two action-bar buttons each open their own menu.
  const markAsMenu = useAnchoredMenu(isDesktop);
  const createMenu = useAnchoredMenu(isDesktop);
  // This prototype has exactly two assignees — Lorne (the viewer) + Thiago.
  const [scheduling, setScheduling] = useState<Scheduling>(() => seedScheduling(record));
  // Assignees are their OWN module since 2026-08-05, so they are their own
  // state too — nothing about them belongs to the scheduling slot any more.
  const [assignees, setAssignees] = useState<number[]>(record.assigneeIds);
  // The Service module's values — edited via ServiceForm; the Details panel's
  // Related module mirrors its "Recall to".
  const [serviceValues, setServiceValues] = useState<ServiceValues>(() => defaultServiceValues(record));
  // The job's equipment (ids into the location's pool) — lifted here so the
  // Service call form (Summary tab) reads the live Equipment-module list.
  const [equipmentIds, setEquipmentIds] = useState<string[]>(() => seedEquipmentIds(record));
  // Whether equipment is involved is DERIVED from the list since 2026-09-28
  // (the updated Equipment module has no "Is equipment involved?" question):
  // no equipment means the module reads "Equipment is not involved".
  // The Job-properties module's values (Job ID, Branch, Source, Source ID,
  // Date received, Received by) — edited by JobPropertiesForm.
  const [jobProperties, setJobProperties] = useState<JobProperties>(() => defaultJobProperties(record));
  // The workspace's job sources — state like the location/equipment pools, so a
  // source created in the form stays known to the MODULE (it decides whether
  // the Source ID row shows and whether the source has a logo).
  const [jobSources, setJobSources] = useState<JobSource[]>(JOB_SOURCES);
  const createJobSource = (source: JobSource) => setJobSources((prev) => [...prev, source]);
  // Billing intention — lifted out of DetailsPanel so its edits reach the
  // activity log (and "Last modified") like every other module's.
  const [billing, setBilling] = useState<Billing>({ intention: "inheritLocation", clientId: null });
  // The pool is state too — the New-equipment form appends to it (like the
  // locations pool), so a created piece exists everywhere the job reads it.
  const [equipmentPool, setEquipmentPool] = useState<Equipment[]>(() => seedEquipmentPool(record));
  // The job's own charges — labour from the time tracked on it, parts from the
  // service it is (db/jobCharges.ts). One hardcoded set used to serve all 78.
  const dbRecord = jobById(record.id);
  const charges = useMemo(() => (dbRecord == null ? [] : chargesOf(dbRecord)), [dbRecord]);
  const chargesSubtotal = useMemo(() => chargesTotal(charges), [charges]);
  const jobEquipment = equipmentPool.filter((e) => equipmentIds.includes(e.id));
  // The job's service location — lifted here because changing it also clears
  // the equipment (equipment belongs to a location); the Details panel clears
  // its own contacts + billing in the same confirm.
  const [location, setLocation] = useState<JobLocation>(() => seedLocation(record));
  const changeLocation = (next: JobLocation) => {
    setLocation(next);
    setEquipmentIds([]);
    // Billing falls back to the default intention — set directly, NOT through
    // changeBilling: the change-location prompt does not mention billing, so
    // it must not write a "Billing intention" activity log either.
    setBilling({ intention: "inheritLocation", clientId: null });
  };
  // The location pool is state too — the New-location form appends to it.
  const [locations, setLocations] = useState<JobLocation[]>(LOCATIONS);
  const addLocation = (next: JobLocation) => setLocations((prev) => [...prev, next]);
  const [job, setJob] = useState<JobState>(() => seedJobState(record));
  // The Activity tab: how long the job has been in the "Active" status.
  const lifecycle = useJobLifecycle(job, scheduling, seedLifecycle(record));
  const [startOpen, setStartOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  // Schedule flow: the "Schedule job" dialog (Figma 24222-20585 — the
  // Scheduling form with schedule copy), the plain "Unschedule job?" prompt
  // (unassigned job, Figma 24215-18742) and the assignees Unschedule dialog
  // (assigned job, Figma 24215-18740 / 24221-19652).
  const [scheduleOpen, setScheduleOpen] = useState(false);
  // Which radio the Scheduling form opens on — the actions pre-pick theirs
  // (Daniel, 2026-08-05); the module pen leaves it to the job’s own state.
  const [scheduleFormMode, setScheduleFormMode] = useState<"schedule" | "unschedule" | undefined>(undefined);
  // "Reschedule job" (paused/on-hold menu) — the same form again (24226-20672).
  // Lifecycle forms: Pause, Resume, Change active status, Change pause status,
  // and the "Time logged" (Complete) review.
  const [pauseOpen, setPauseOpen] = useState(false);
  // WHICH of the two dialogs is open — "Pause" and "Hold" are separate menu
  // items and separate dialogs (Figma 24058-15840 / 24963-43684).
  const [pauseFormType, setPauseFormType] = useState<"quick-pause" | "on-hold">("quick-pause");
  const [resumeOpen, setResumeOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  // Opens the moment the Complete flow finishes (Figma 24576-152451), and again
  // from "Resend summary" on a completed / finalized job.
  const [sendSummaryOpen, setSendSummaryOpen] = useState(false);
  // HOW it was opened: the Complete flow hands over to it (leading button
  // "Skip" — it is a step of that flow), or the user asked for it themselves
  // through "Resend summary" (leading button "Cancel").
  const [sendSummaryAfterCompletion, setSendSummaryAfterCompletion] = useState(false);
  // The two "This action can not be undone" confirmations a completed job shows
  // (Figma 24567-139607 / 24567-140732). Both finalize the job.
  const [markInvoicedOpen, setMarkInvoicedOpen] = useState(false);
  const [markEstimatedOpen, setMarkEstimatedOpen] = useState(false);
  // What the Complete flow's Signature step collected — it fills the Summary
  // tab's Signature module.
  // A finished job arrives with its sign-off already on file (2026-09-28) —
  // it is collected at the end of the visit, so a finalized job showing
  // "Not collected" reads as a gap in the record.
  const [signature, setSignature] = useState<SignatureResult | undefined>(() => seedSignature(record));
  const [changeActiveOpen, setChangeActiveOpen] = useState(false);
  const [changePauseOpen, setChangePauseOpen] = useState(false);
  // Time-session form (add / edit) + which session it edits (none = add), and
  // the session queued for deletion (drives the confirm Prompt).
  const [sessionFormOpen, setSessionFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | undefined>();
  // The day a NEW session should start on — the Timesheet review's per-day plus
  // names one; every other entry point leaves it as today.
  const [sessionStartDate, setSessionStartDate] = useState<Date | undefined>();
  // WHOSE session a new one is. The Timesheet's plus belongs to one tech's
  // group, so an admin adding time for somebody else files it under them
  // rather than under the viewer (Daniel, 2026-10-06). Unset = the viewer's.
  const [sessionUserId, setSessionUserId] = useState<number | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Session | undefined>();
  // Check-in state: a running session ticks `elapsed` once a second.
  const [checkedIn, setCheckedIn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  // Seeded from the job's generated history (2026-09-26), so a completed job
  // opens with its work already on the timesheet instead of an empty tab. A
  // running session on an active job keeps its live timer.
  const [sessions, setSessions] = useState<StoredSession[]>(() => seedSessions(record) as StoredSession[]);
  // Check-out flow: the confirm prompt, then the Timesheet review form that
  // every check-out ends in (Figma 24598-41150 / 24598-41148).
  const [checkOutPromptOpen, setCheckOutPromptOpen] = useState(false);
  const [timesheetOpen, setTimesheetOpen] = useState(false);

  // The viewing tech (the logged-in user, "Lorne Riddle"). The Complete review
  // is theirs, and a session logged live by check-in belongs to them.
  const viewer = users.find((u) => u.id === VIEWER_ID) ?? users[0];

  // The Activity tab's event list, OLDEST first. It opens with the job's
  // creation (stamped at mount, so the log reads "Just now") and grows as the
  // user edits a module.
  // Seeded from the job's generated history (2026-09-26): a job worked weeks
  // ago opens with that story — created, scheduled, started, completed, each
  // with its own date and the person who did it. Module edits still append
  // live below it. A job with no history falls back to the bare creation log.
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>(() => {
    const seeded = seedActivity(record);
    return seeded.length > 0 ? seeded : [{ id: 1, kind: "created", date: new Date(), user: viewer }];
  });
  // Appends one activity log — the viewer is always the actor, the moment is now.
  // The viewer is the actor unless the event names one — the only log that does
  // is the system's "Roopairs finalized the job".
  const pushEvent = (event: Omit<ActivityEvent, "id" | "date" | "user"> & { user?: User }) =>
    setActivityEvents((prev) => [...prev, { id: (prev[prev.length - 1]?.id ?? 0) + 1, date: new Date(), user: viewer, ...event }]);

  // The job's lifecycle logs (Figma 24512-62842). Every one is "{user} <did
  // something to the job>", optionally closing on its status — so they all go
  // through here. The timeline symbol is the job status's SOLID glyph in its own
  // color, and a typed reason becomes the log's single sub-log.
  const pushJobStatus = (glyph: JobGlyph, parts: Omit<JobStatusLog, "icon" | "color">) =>
    pushEvent({ kind: "jobStatus", jobStatus: { ...glyph, ...parts } });
  // "… the job" on its own, or "… the job with status <sub-status>".
  const pushJobStatusWithSub = (glyph: JobGlyph, verb: string, subStatus: string, reason: string, reasonTitle: string) =>
    pushJobStatus(
      glyph,
      subStatus === ""
        ? { text: ` ${verb}`, reason, reasonTitle }
        : { text: ` ${verb} with status `, value: subStatus, reason, reasonTitle },
    );

  // "Last modified" (Job properties module) — Daniel, 2026-08-03: it updates
  // EVERY time the user changes anything on the job, not just this module.
  // So it is stamped from an effect over the job's DATA rather than wired into
  // each handler: every mutation replaces one of these objects. `elapsed` and
  // the derived active time are deliberately NOT watched — the running timer
  // ticks once a second and is not a change to the job.
  const [lastModified, setLastModified] = useState<Date>(() => new Date());
  const touchJob = () => setLastModified(new Date());
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setLastModified(new Date());
  }, [serviceValues, equipmentIds, jobProperties, billing, scheduling, location, job, sessions, checkedIn]);

  // Equipment: one change can both add and remove (the Equipment form applies a
  // whole session of edits at once), so the diff of the id arrays becomes ONE
  // log — "added A, B and removed C" (Figma 24450-60498).
  // `pool` is passed explicitly when the caller just created a piece — the pool
  // state does not hold it yet in this render.
  const changeEquipmentIds = (next: string[], pool: Equipment[] = equipmentPool) => {
    const { added, removed } = diffEquipment(equipmentIds, next, pool);
    setEquipmentIds(next);
    if (added.length === 0 && removed.length === 0) return;
    setActivityEvents((prev) => [
      ...prev,
      { id: prev.length + 1, kind: "equipment", date: new Date(), user: viewer, added, removed },
    ]);
  };

  // Saving the Equipment form (Figma 24465-35321) — the picked equipment. The
  // FORM shows the '"Equipment" module updated' toast.
  const saveEquipment = ({ equipmentIds: next }: EquipmentFormValues) => changeEquipmentIds(next);

  // The New-equipment form (Figma 21897-7658), opened from the Equipment form's
  // picker. The created piece joins the location's POOL here and is returned so
  // the picker can tick it; it reaches the job when the form is saved. The
  // New-equipment form shows its own "Equipment created" toast.
  const createEquipment = (values: NewEquipment): Equipment => {
    // Created pieces get their own id space — the pool's ids are the
    // database's strings now.
    const id = `eq-created-${equipmentPool.length + 1}`;
    const equipment: Equipment = {
      id,
      name: values.name,
      manufacturer: values.manufacturer,
      model: values.model,
      serial: values.serial,
      category: values.category,
      type: values.type,
      ownership: values.ownership,
      area: values.area,
      // The Complete-job form shows this as plain text ("January 1, 2026").
      installDate: values.installDate != null ? EQUIPMENT_DATE.format(values.installDate) : "",
      notes: values.notes,
      labels: values.labels,
    };
    setEquipmentPool((prev) => [...prev, equipment]);
    return equipment;
  };

  // A job-contact edit (Figma 24487-43383). The contacts live in DetailsPanel,
  // so it reports the edit here — one log per change, naming the ROLE slot.
  // The clearing that follows a location change does NOT come through here:
  // that action has its own log (Daniel, 2026-08-03).
  const logContactChange = (role: string, before: JobContact | null, after: JobContact | null) => {
    setActivityEvents((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        kind: "contact",
        date: new Date(),
        user: viewer,
        role,
        contactBefore: before?.name ?? null,
        contactAfter: after?.name ?? null,
        contactBeforeAvatar: before?.avatar,
        contactAfterAvatar: after?.avatar,
      },
    ]);
  };

  // Saving the Job-properties form. It logs exactly like the Service module
  // (Daniel, 2026-08-03), so the same diff → ActivityUpdateLog rules apply.
  // The FORM shows the '"Job properties" updated' toast.
  const changeJobProperties = (next: JobProperties) => {
    const changes = diffJobProperties(jobProperties, next);
    setJobProperties(next);
    if (changes.length === 0) return;
    setActivityEvents((prev) => [
      ...prev,
      { id: prev.length + 1, kind: "updated", date: new Date(), user: viewer, changes },
    ]);
  };

  // A label edit (Figma 24492-52521). ONE log per save, naming everything it
  // touched — "added label X", "removed labels ~~X, Y~~", or both joined by
  // "and". The FORM shows the '"Labels" module updated' toast.
  const logLabelsChange = (added: string[], removed: string[]) => {
    setActivityEvents((prev) => [
      ...prev,
      { id: prev.length + 1, kind: "labels", date: new Date(), user: viewer, added, removed },
    ]);
  };

  // Saving the Scheduling module's edit form — same log pattern as Service /
  // Job properties (Daniel, 2026-08-04). The FORM shows the '"Scheduling"
  // updated' toast.
  // The lifecycle flows that also move the scheduling (Schedule job,
  // Reschedule, Unschedule) keep the plain setScheduling: they are their OWN
  // actions with their own toasts, not a module edit.

  // Saving the Billing form — same log pattern as Service / Job properties
  // (Daniel, 2026-08-03). The FORM shows the '"Billing intention" module
  // updated' toast.
  const changeBilling = (next: Billing) => {
    const changes = diffBilling(billing, next);
    setBilling(next);
    if (changes.length === 0) return;
    setActivityEvents((prev) => [
      ...prev,
      { id: prev.length + 1, kind: "updated", date: new Date(), user: viewer, changes },
    ]);
  };

  // Saving the Service form is the only caller of onServiceChange, so the diff
  // between the two value sets IS the edit the user just made.
  const changeServiceValues = (next: ServiceValues) => {
    const changes = diffServiceValues(serviceValues, next);
    setServiceValues(next);
    if (changes.length === 0) return;
    setActivityEvents((prev) => [
      ...prev,
      { id: prev.length + 1, kind: "updated", date: new Date(), user: viewer, changes },
    ]);
  };

  const avatarStatus = displayStatus(job, scheduling);
  const caption = statusLabel(job, scheduling);
  const locked = job.status === "cancelled"; // cancelled → editing restricted
  // A tech can log time only while the job is actively being worked — NOT while
  // upcoming, unscheduled or cancelled (item 11).
  // Time tracking is SEPARATE from the job lifecycle (Daniel 2026-07-28,
  // Figma 24358-37516 / 24358-37529): the check in/out UI and the Timesheet
  // "+" show on every status EXCEPT Unscheduled and Cancelled.
  //
  // A COMPLETED or FINALIZED job is the one-way case (Daniel, 2026-08-07):
  // completing does NOT check the tech out, so the bar/pill stay while their
  // session runs — that is how they reach Check out. Once they do, both
  // disappear for good: nobody checks IN to a job whose work is done.
  const isDone = job.status === "completed" || job.status === "finalized";
  // A CLOSED job's timesheet is frozen: nobody adds, edits or deletes a
  // session on one, not even a full-permission admin (Daniel, 2026-10-06), so
  // those groups show no plus and those rows no context menu.
  //
  // CLOSED means the jobs list's **Closed phase** — FINALIZED or CANCELLED.
  // "Completed" is an OPEN status (it sits under Open in the list, waiting to
  // be invoiced or estimated), and its timesheet is still editable: correcting
  // the hours is exactly what happens between completing a job and billing it
  // (Daniel, 2026-10-06, narrowing my first reading of "closed").
  const timesheetFrozen = job.status === "finalized" || job.status === "cancelled";
  // **The time tracker is for the job's ASSIGNEES** (Daniel, 2026-10-06).
  // Somebody who is not on the job has no time to track on it, so they get
  // neither the desktop bar nor the mobile pill — being an admin does not
  // change that, because this is the viewer's OWN stopwatch.
  const viewerIsAssignee = assignees.includes(viewer.id);
  const canTrackTime =
    viewerIsAssignee && job.status !== "unscheduled" && job.status !== "cancelled" && (!isDone || checkedIn);
  const canAddSessions = canTrackTime;
  // The viewer may manage EVERYBODY's time on this job, not just their own —
  // add, edit and delete sessions in any tech's Timesheet group (Daniel,
  // 2026-10-06). It is an ADMIN right, and correcting a timesheet from the
  // office is not the same action as a tech tracking their own time, so it
  // does NOT follow `canTrackTime`: a job nobody has started yet, or one the
  // viewer is not assigned to, can still be corrected — until it closes.
  const canManageTimesheet = VIEWER_IS_ADMIN && !timesheetFrozen;
  // The job's assignees — the Timesheet tab shows a group per assignee.
  const assigneeUsers = assignees
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is (typeof users)[number] => u != null);

  // Tick the check-in clock once a second while checked in.
  useEffect(() => {
    if (!checkedIn) return;
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(t);
  }, [checkedIn]);

  // Sessions with live values: the active one's timer / duration come from `elapsed`.
  const displaySessions: Session[] = sessions.map((s) => {
    const durationSec = s.active ? elapsed : s.durationSec;
    return { ...s, durationSec, timerLabel: s.active ? formatElapsed(elapsed) : formatHrMin(durationSec) };
  });
  // Per-assignee sessions. Seeded history has a tech on every session; a
  // session logged live here has none, so it belongs to the viewer (2026-09-26
  // — this used to hand EVERY session to the viewer, so a job worked by anyone
  // else showed "No time logged").
  const sessionsByUser: Record<number, Session[]> = {};
  for (const session of displaySessions) {
    (sessionsByUser[session.userId ?? viewer.id] ??= []).push(session);
  }
  // What the Assignees module shows per person (Figma 24522-63732): their total
  // tracked time — live, the running session included — and, while they are
  // checked in, the status they are working under.
  //
  // The per-session totals are ROUNDED the way the company rounds (2026-10-06,
  // when `COMPANY.roundsTimeUp` went on): the Timesheet's own group headers
  // already were, and the same person's "Total tracked" must not read 4 hr
  // 24 min beside a timesheet that adds up to 4 hr 30 min. A RUNNING session
  // is never rounded — the Timesheet does not round one either.
  const assigneeStats: Record<number, { trackedSec: number; status?: string }> = {};
  for (const user of assigneeUsers) {
    const list = sessionsByUser[user.id] ?? [];
    assigneeStats[user.id] = {
      trackedSec: list.reduce((acc, s) => acc + (s.active ? s.durationSec : roundUpSec(s.durationSec, COMPANY.roundsTimeUp)), 0),
      status: list.find((s) => s.active)?.category,
    };
  }

  // Ends the running session (check-out / pause): stamp its end time + duration.
  const endActiveSession = () => {
    const now = new Date();
    const dur = elapsed;
    setSessions((prev) =>
      prev.map((s) =>
        s.active
          ? { ...s, active: false, endLabel: TIME_FMT.format(now), endDateLabel: FULL_DATE_FMT.format(now), endWeekdayLabel: weekdayDate(now), durationSec: dur }
          : s,
      ),
    );
  };

  // Starts a fresh time session (no toast — callers decide the feedback).
  // `category` = the check-in status ("Travelling" / "Working") when known.
  const beginSession = (category?: string) => {
    const now = new Date();
    setElapsed(0);
    setCheckedIn(true);
    setSessions((prev) => [
      ...prev,
      {
        id: prev.reduce((max, s) => Math.max(max, s.id), 0) + 1,
        startLabel: TIME_FMT.format(now),
        month: MONTH_FMT.format(now).toUpperCase(),
        day: String(now.getDate()),
        dateLabel: FULL_DATE_FMT.format(now),
        weekdayLabel: weekdayDate(now),
        active: true,
        durationSec: 0,
        category,
      },
    ]);
  };

  // Called by the Start/Cancel dialogs on submit. The "…on" timestamps are the
  // real moment of the click. Concept 7: the Start form's "Check in" card
  // decides whether a session starts; the chosen status becomes its category.
  // No sub-status on an ACTIVE job (Daniel, 2026-09-28) — the check-in status
  // says what the tech is doing, so the job is simply "Active".
  const startJob = (reason: string, checkIn: boolean, status: string) => {
    const ts = formatStatusTimestamp(new Date());
    setJob({
      status: "active",
      statusMessage: reason || undefined,
      everStarted: true,
      startedAt: ts,
      activeAt: ts,
    });
    pushJobStatusWithSub(JOB_GLYPH.active, "started the job", "", reason, "Start reason");
    if (checkIn) {
      beginSession(status || undefined);
      pushEvent({ kind: "checkin", status });
    }
  };
  const cancelJob = (reason: string) => {
    setCheckedIn(false);
    endActiveSession();
    setJob((j) => ({ ...j, status: "cancelled", statusMessage: reason, cancelledAt: formatStatusTimestamp(new Date()) }));
    pushJobStatus(JOB_GLYPH.cancelled, { text: " cancelled the job", reason, reasonTitle: "Cancel reason" });
  };
  // Pause / hold: quick-pause or on-hold, with a sub-status + reason. The tech
  // is checked out only when the form's "Check out" box is ticked (Figma
  // 24512-62825) — otherwise the job pauses and their session keeps running.
  const pauseJob = (type: string, subStatus: string, reason: string, checkOut: boolean) => {
    if (checkOut) {
      setCheckedIn(false);
      endActiveSession();
    }
    setJob((j) => ({
      ...j,
      status: type === "quick-pause" ? "quickPaused" : "onHold",
      subStatus: subStatus || undefined,
      statusMessage: reason || undefined,
      pausedAt: formatStatusTimestamp(new Date()),
    }));
    // One wording for both types — the status names the sub-status, or the pause
    // type itself when the company has none (Figma 24512-62842). The glyph is
    // what tells quick-pause from on-hold. Pausing with "Check out" ticked
    // writes TWO logs, like starting a job with "Check in" — job action first.
    pushJobStatus(pauseGlyph(type), {
      text: " paused the job with status ",
      value: pauseStatusName(type, subStatus),
      reason,
      reasonTitle: "Pause reason",
    });
    if (checkOut) pushEvent({ kind: "checkout" });
  };
  // Resume back to active with a fresh sub-status (updates "Active on").
  // Like startJob (Figma 24096-19684): the form's "Check in" card decides
  // whether a session starts; the chosen status becomes its category.
  // Resuming returns the job to a plain "Active" — the pause reason goes with
  // the pause it belonged to.
  const doResume = (reason: string, checkIn: boolean, status: string) => {
    setJob((j) => ({ ...j, status: "active", subStatus: undefined, statusMessage: reason || undefined, activeAt: formatStatusTimestamp(new Date()) }));
    pushJobStatusWithSub(JOB_GLYPH.active, "resumed the job", "", reason, "Resume reason");
    if (checkIn) {
      beginSession(status || undefined);
      pushEvent({ kind: "checkin", status });
    }
  };
  // Complete: the work is done, so the job leaves Active for "Completed" and
  // its sub-status goes with it. The tech STAYS CHECKED IN — completing the job
  // does not stop their timer, they check out by hand (Daniel, 2026-08-07).
  const completeJob = (result: SignatureResult) => {
    setJob((j) => ({
      ...j,
      status: "completed",
      subStatus: undefined,
      statusMessage: undefined,
      completedAt: formatStatusTimestamp(new Date()),
    }));
    setSignature(result);
    pushJobStatus(JOB_GLYPH.completed, { text: " completed the job" });
  };
  // "Mark as invoiced" / "Mark as estimated" write TWO logs (Figma 24592-40478
  // + 24567-140255): the user's own action, then the SYSTEM's — the user never
  // finalizes the job, marking it is what makes the system finalize it.
  const finalizeJob = (how: "invoiced" | "estimated") => {
    setJob((j) => ({ ...j, status: "finalized", finalizedAt: formatStatusTimestamp(new Date()) }));
    pushEvent({
      kind: "createdFrom",
      jobStatus: { ...moduleGlyph(how === "invoiced" ? "circle-dollar" : "clock"), text: ` marked as ${how}` },
    });
    pushEvent({
      kind: "jobStatus",
      user: SYSTEM_USER,
      jobStatus: { ...JOB_GLYPH.finalized, text: " finalized the job" },
    });
    toast({ type: "success", title: `Marked as ${how}` });
  };
  // "Create invoice" / "Create estimate" / "Create recall" open nothing yet
  // (Daniel, 2026-08-07) — but each still writes its log, naming the object it
  // would have made (Figma 24592-40478).
  const CREATED_FROM = {
    // Real ids from the database (2026-09-28) — these used to be INV-10001 and
    // EST-10001, which exist nowhere.
    invoice: { icon: "circle-dollar", text: " created a related invoice ", value: INVOICES[0]?.id ?? "" },
    estimate: { icon: "clock", text: " created a related estimate ", value: ESTIMATES[0]?.id ?? "" },
    recall: { icon: "clock-rotate-left", text: " created a recall ", value: record.id },
  };
  const logCreatedFrom = (what: keyof typeof CREATED_FROM) => {
    const it = CREATED_FROM[what];
    pushEvent({
      kind: "createdFrom",
      jobStatus: { ...moduleGlyph(it.icon), text: it.text, value: it.value, valueLink: true },
    });
  };

  // The "Forms" module's logs (Figma 24592-40934). The module owns its forms,
  // so it reports each change and the sentence is assembled here — every one on
  // the same regular `clipboard-list` glyph.
  const logForms = (log: FormsLog) => {
    const forms = moduleGlyph("clipboard-list");
    if (log.kind === "added") {
      pushEvent({
        kind: "forms",
        jobStatus: { ...forms, text: ` added ${log.names.length === 1 ? "a form" : "forms"} `, value: log.names.join(", ") },
      });
    } else if (log.kind === "removed") {
      // The removed names are struck through, like every value that is gone.
      pushEvent({
        kind: "forms",
        jobStatus: { ...forms, text: ` removed ${log.names.length === 1 ? "a form" : "forms"} `, strikeValue: log.names.join(", ") },
      });
    } else if (log.kind === "visibility") {
      pushEvent({
        kind: "forms",
        jobStatus: {
          ...forms,
          text: " updated ",
          value: log.name,
          tailText: " visibility to ",
          tailValue: log.visibility === "private" ? "Private" : "Public",
        },
      });
    } else if (log.kind === "renamed") {
      pushEvent({ kind: "forms", jobStatus: { ...forms, text: " renamed a form: ", strikeValue: log.from, value: log.to } });
    } else {
      const verb = log.kind === "completed" ? " completed a form " : " saved changes to a form ";
      pushEvent({ kind: "forms", jobStatus: { ...forms, text: verb, value: log.name } });
    }
  };

  // Work summary / Notes to dispatcher(s): one TextArea property each, so they
  // take the general update-log shape (Figma 24489-50029) — the same accordion
  // Service and Job properties use for a single long-text field.
  const logTextProperty = (label: string, oldValue: string, newValue: string) =>
    pushEvent({ kind: "updated", changes: [{ label, oldValue, newValue, longText: true }] });

  // Change the active sub-status / status message (stays active).
  const doChangeActive = (subStatus: string, reason: string) => {
    setJob((j) => ({ ...j, subStatus: subStatus || undefined, statusMessage: reason || undefined }));
    // A typed Status message rides along as the log's sub-log (Figma 24517-63481).
    if (subStatus !== "") {
      pushJobStatus(JOB_GLYPH.active, {
        text: " changed active status to ",
        value: subStatus,
        reason,
        reasonTitle: "Status message",
      });
    }
  };
  // Change the pause Type / sub-status / reason (stays paused; keeps "Paused on").
  const doChangePause = (type: string, subStatus: string, reason: string) => {
    setJob((j) => ({ ...j, status: type === "quick-pause" ? "quickPaused" : "onHold", subStatus: subStatus || undefined, statusMessage: reason || undefined }));
    // The Pause reason is a NEW one each time, so it is this log's sub-log
    // (Figma 24517-63511).
    pushJobStatus(pauseGlyph(type), {
      text: " changed pause status to ",
      value: pauseStatusName(type, subStatus),
      reason,
      reasonTitle: "Pause reason",
    });
  };

  // Check-in — opens the Check in dialog (Figma 24194-74433); confirming
  // with a status starts the session.
  const [checkInOpen, setCheckInOpen] = useState(false);
  const checkIn = () => {
    actionMenu.close();
    setCheckInOpen(true);
  };
  const doCheckIn = (status: string) => {
    beginSession(status);
    // Figma 24358-37597: the success toast is DETAILED now — the status the
    // tech checked in under is its caption.
    toast({ type: "success", variant: "detailed", title: "You're checked in", caption: status });
    // ONE log for checking in (Daniel, 2026-08-05): the session it opens is not
    // finished yet, so there is no session to log.
    pushEvent({ kind: "checkin", status });
  };
  // The running session's check-in status (drives the bar/pill identity).
  const activeCategory = sessions.find((sess) => sess.active)?.category;
  // Switching status (Figma 24192-73283): logs the running session and starts
  // a fresh one under the new status ("Your status updated" toast).
  const switchStatus = (status: string) => {
    if (status === activeCategory) return;
    endActiveSession();
    beginSession(status);
    // The switch itself is the log (Figma 24453-26403/26436/26425/26447) — the
    // session it closes and the one it opens are not logged separately.
    pushEvent({ kind: "status", status });
    // Detailed toast (Figma 24358-37727). The caption names the NEW status
    // only — Daniel, 2026-08-04, dropping the "old → new" pair.
    toast({ type: "success", variant: "detailed", title: "Your status updated", caption: status });
  };

  // Ends the running session and logs it — no Time review in this concept.
  // The bar/pill fall back to their idle state (amber on an active job,
  // neutral otherwise).
  const doCheckOut = () => {
    setCheckedIn(false);
    endActiveSession();
    toast({ type: "success", title: "Time session saved" });
    pushEvent({ kind: "checkout" });
    // Every check-out ends in the Timesheet review (Figma 24598-41150).
    setTimesheetOpen(true);
  };
  // "Check out" (bar / pill drawer / Timesheet row): an ACTIVE job opens the
  // confirm prompt first (Figma 24184-59897); any other status logs the
  // session directly (drawer annotation on Figma 24178-58902) — the prompt
  // only guards active work.
  const checkOut = () => {
    actionMenu.close();
    if (job.status === "active") setCheckOutPromptOpen(true);
    else doCheckOut();
  };
  const confirmCheckOut = () => {
    setCheckOutPromptOpen(false);
    doCheckOut();
  };

  // Time-session form actions (the Timesheet plus + the ended-row menu).
  // `userId` names the tech the new session belongs to — the Timesheet's plus
  // passes its own group's; the Timesheet review's per-day plus does not, so
  // that one stays the viewer's own.
  const openAddSession = (startDate?: Date, userId?: number) => {
    setEditingSession(undefined);
    setSessionStartDate(startDate);
    setSessionUserId(userId);
    setSessionFormOpen(true);
  };
  const openEditSession = (session: Session) => {
    setEditingSession(session);
    setSessionFormOpen(true);
  };
  const confirmDeleteSession = () => {
    if (deleteTarget != null) {
      setSessions((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      // The whole session is struck through in the log (Figma 24453-26470).
      pushEvent({
        kind: "sessionDeleted",
        status: deleteTarget.category,
        sessionRange: sessionRangeLabel(
          storedMoment(deleteTarget.dateLabel, deleteTarget.startLabel),
          storedMoment(deleteTarget.endDateLabel ?? deleteTarget.dateLabel, deleteTarget.endLabel),
        ),
      });
    }
    setDeleteTarget(undefined);
    toast({ type: "success", title: "Time session deleted" });
  };
  // Save the "Time session" form: add a new row, or update the edited one.
  const saveSession = (draft: SessionDraft) => {
    const startDt = combineDateTime(draft.startDate, draft.startClock, draft.startMeridiem);
    const endDt = combineDateTime(draft.endDate, draft.endClock, draft.endMeridiem);
    const fields = {
      category: draft.category,
      startLabel: clockToLabel(draft.startClock, draft.startMeridiem),
      month: MONTH_FMT.format(draft.startDate).toUpperCase(),
      day: String(draft.startDate.getDate()),
      dateLabel: FULL_DATE_FMT.format(draft.startDate),
      weekdayLabel: weekdayDate(draft.startDate),
      active: false,
      endLabel: clockToLabel(draft.endClock, draft.endMeridiem),
      endDateLabel: FULL_DATE_FMT.format(draft.endDate),
      endWeekdayLabel: weekdayDate(draft.endDate),
      durationSec: Math.max(0, Math.round((endDt.getTime() - startDt.getTime()) / 1000)),
    };
    setSessions((prev) =>
      editingSession != null
        ? // An edit never re-files the session: it keeps whosever it already was.
          prev.map((s) => (s.id === editingSession.id ? { ...s, ...fields } : s))
        : [...prev, { id: prev.reduce((mx, s) => Math.max(mx, s.id), 0) + 1, userId: sessionUserId ?? viewer.id, ...fields }],
    );

    // The activity log (Figma 24453-26325). Adding names the whole session;
    // editing lists only the fields that really moved, in FORM order (status,
    // start, end) — the update-log rules then pick the row or the accordion.
    const startMoment = sessionMoment(startDt);
    const endMoment = sessionMoment(endDt);
    const range = sessionRangeLabel(startMoment, endMoment);
    if (editingSession == null) {
      pushEvent({ kind: "sessionAdded", status: draft.category, sessionRange: range });
    } else {
      const was = editingSession;
      const changes: FieldChange[] = [
        // The status carries its icon on BOTH sides — inline and in the
        // accordion's sub-log (Figma 24509-62280 / 24511-62572).
        {
          label: "Status",
          oldValue: was.category ?? "",
          newValue: draft.category,
          oldIcon: was.category != null ? statusValueIcon(was.category) : undefined,
          newIcon: statusValueIcon(draft.category),
        },
        { label: "Start time", oldValue: storedMoment(was.dateLabel, was.startLabel), newValue: startMoment },
        { label: "End time", oldValue: storedMoment(was.endDateLabel ?? was.dateLabel, was.endLabel), newValue: endMoment },
      ].filter((c) => c.oldValue !== c.newValue);
      if (changes.length > 0) pushEvent({ kind: "sessionUpdated", changes, status: draft.category, sessionRange: range });
    }

    // Figma toast 24105-15803 — same copy as check-out.
    toast({ type: "success", title: "Time session saved" });
  };

  // The Scheduling module's logs (Figma 24522-89331). Three shapes, and which
  // one is written depends on WHAT moved (Daniel, 2026-08-05):
  //   slot cleared          → "unscheduled the job ~~<old slot>~~"   calendar-xmark
  //   slot set or moved     → "(re)scheduled the job for <slot> for <duration>"
  //                                                                  calendar-check
  //   duration alone        → "updated Est. duration: ~~old~~ → new" hourglass
  //                           ("Duration" until 2026-09-14 — the node's copy
  //                           follows the field rename)
  const logScheduling = (was: Scheduling, next: Scheduling) => {
    const slot = (s: Scheduling) => (s.date != null ? `${longSlotLabel(s)}` : "");
    const dur = (s: Scheduling) => durationLabel(s.hours, s.minutes);
    const slotChanged = slot(was) !== slot(next);
    const durationChanged = dur(was) !== dur(next);

    if (next.date == null && was.date != null) {
      pushEvent({ kind: "scheduling", jobStatus: { icon: "calendar-xmark", color: "", text: " unscheduled the job ", strikeValue: slot(was) } });
      return;
    }
    if (slotChanged) {
      // The duration rides along in this log, changed or not. Scheduling and
      // RE-scheduling carry different glyphs (Figma 24522-89334 / 89710).
      const rescheduled = was.date != null;
      pushEvent({
        kind: "scheduling",
        jobStatus: {
          icon: rescheduled ? "calendar-lines-pen" : "calendar-check",
          color: "",
          text: ` ${rescheduled ? "rescheduled" : "scheduled"} the job for `,
          value: `${slot(next)} for ${dur(next)}`,
        },
      });
      return;
    }
    if (durationChanged) {
      pushEvent({
        kind: "scheduling",
        jobStatus: { icon: "hourglass", color: "", text: " updated ", label: "Est. duration", strikeValue: dur(was), value: dur(next) },
      });
    }
  };

  // The Assignees module (Figma 24522-89736). One log per save, naming who
  // came on and who went off: "assigned A, B", "unassigned ~~C~~", or both
  // joined by "and". The unassigned names are always struck through.
  const changeAssignees = (next: number[]) => {
    // Each name carries its avatar, like every other person in a log.
    const people = (ids: number[]) =>
      ids
        .map((id) => users.find((u) => u.id === id))
        .filter((u): u is (typeof users)[number] => u != null)
        .map((u) => ({ name: u.name, avatar: u.avatar }));
    const added = people(next.filter((id) => !assignees.includes(id)));
    const removed = people(assignees.filter((id) => !next.includes(id)));
    setAssignees(next);
    if (added.length === 0 && removed.length === 0) return;
    pushEvent({
      kind: "assignees",
      jobStatus: {
        icon: added.length > 0 && removed.length > 0 ? "user" : added.length > 0 ? "user-plus" : "user-minus",
        color: "",
        // The avatars bring their own gaps, so the sentence adds no trailing space.
        text: added.length > 0 ? " assigned" : " unassigned",
        people: added.length > 0 ? added : undefined,
        tailText: added.length > 0 && removed.length > 0 ? " and unassigned" : undefined,
        // The people who left are always struck through.
        tailPeople: removed.length > 0 ? removed : undefined,
      },
    });
  };

  // The ONE Scheduling save (Daniel, 2026-08-05): the module's pen and the
  // Schedule / Reschedule / Unschedule actions all land here, and the job's own
  // status follows the slot — a first slot makes it Upcoming, clearing the slot
  // makes it Unscheduled, a moved slot leaves the status alone.
  const confirmSchedule = (next: Scheduling) => {
    const was = scheduling;
    setScheduling(next);
    if (next.date == null && was.date != null) {
      setJob((j) => ({ ...j, status: "unscheduled", unscheduledAt: formatStatusTimestamp(new Date()) }));
    } else if (next.date != null && was.date == null) {
      // Booking it NOW is this job's "Scheduled on".
      setJob({ status: "upcoming", everStarted: false, scheduledAt: formatStatusTimestamp(new Date()) });
    }
    logScheduling(was, next);
  };

  // A completed job's items live in THREE menus (the overflow + the two button
  // menus), so every one of its actions closes all three.
  const closeActionMenus = () => {
    actionMenu.close();
    markAsMenu.close();
    createMenu.close();
  };

  const actions: JobActions = {
    onStart: () => {
      actionMenu.close();
      setStartOpen(true);
    },
    onSchedule: () => {
      actionMenu.close();
      setScheduleFormMode("schedule");
      setScheduleOpen(true);
    },
    onPause: () => {
      actionMenu.close();
      setPauseFormType("quick-pause");
      setPauseOpen(true);
    },
    onHold: () => {
      actionMenu.close();
      setPauseFormType("on-hold");
      setPauseOpen(true);
    },
    onResume: () => {
      closeActionMenus();
      setResumeOpen(true);
    },
    onChangeActive: () => {
      actionMenu.close();
      setChangeActiveOpen(true);
    },
    onChangePause: () => {
      actionMenu.close();
      setChangePauseOpen(true);
    },
    // Complete job → the 5-step Complete flow (Equipment · Forms · Summary ·
    // Charges · Signature).
    onComplete: () => {
      actionMenu.close();
      setCompleteOpen(true);
    },
    onCheckIn: checkIn,
    onCheckOut: checkOut,
    // Reschedule and Unschedule open the SAME Scheduling form as Schedule
    // (Daniel, 2026-08-05) — no separate dialogs, and no question about
    // assignees any more.
    onReschedule: () => {
      actionMenu.close();
      setScheduleFormMode("schedule");
      setScheduleOpen(true);
    },
    onUnschedule: () => {
      actionMenu.close();
      setScheduleFormMode("unschedule");
      setScheduleOpen(true);
    },
    onCancel: () => {
      actionMenu.close();
      setCancelOpen(true);
    },
    onMarkInvoiced: () => {
      closeActionMenus();
      setMarkInvoicedOpen(true);
    },
    onMarkEstimated: () => {
      closeActionMenus();
      setMarkEstimatedOpen(true);
    },
    onResendSummary: () => {
      closeActionMenus();
      setSendSummaryAfterCompletion(false);
      setSendSummaryOpen(true);
    },
    onCreateInvoice: () => {
      closeActionMenus();
      logCreatedFrom("invoice");
    },
    onCreateEstimate: () => {
      closeActionMenus();
      logCreatedFrom("estimate");
    },
    onCreateRecall: () => {
      closeActionMenus();
      logCreatedFrom("recall");
    },
  };

  return {
    jobId: record.id,
    charges,
    chargesSubtotal,
    actionMenu,
    markAsMenu,
    createMenu,
    scheduling,
    setScheduling,
    serviceValues,
    setServiceValues,
    equipmentIds,
    setEquipmentIds,
    changeEquipmentIds,
    saveEquipment,
    equipmentPool,
    createEquipment,
    jobEquipment,
    jobProperties,
    changeJobProperties,
    jobSources,
    createJobSource,
    billing,
    changeBilling,
    lastModified,
    touchJob,
    logContactChange,
    logLabelsChange,
    location,
    changeLocation,
    locations,
    addLocation,
    job,
    viewer,
    lifecycle,
    activityEvents,
    changeServiceValues,
    startOpen,
    setStartOpen,
    cancelOpen,
    setCancelOpen,
    scheduleOpen,
    setScheduleOpen,
    scheduleFormMode,
    setScheduleFormMode,
    confirmSchedule,
    pauseOpen,
    setPauseOpen,
    pauseFormType,
    resumeOpen,
    setResumeOpen,
    completeOpen,
    setCompleteOpen,
    sendSummaryOpen,
    setSendSummaryOpen,
    sendSummaryAfterCompletion,
    setSendSummaryAfterCompletion,
    markInvoicedOpen,
    setMarkInvoicedOpen,
    markEstimatedOpen,
    setMarkEstimatedOpen,
    completeJob,
    finalizeJob,
    signature,
    logForms,
    logTextProperty,
    changeActiveOpen,
    setChangeActiveOpen,
    changePauseOpen,
    setChangePauseOpen,
    sessionFormOpen,
    setSessionFormOpen,
    editingSession,
    deleteTarget,
    setDeleteTarget,
    checkedIn,
    elapsed,
    activeCategory,
    switchStatus,
    checkOutPromptOpen,
    setCheckOutPromptOpen,
    confirmCheckOut,
    timesheetOpen,
    setTimesheetOpen,
    sessionStartDate,
    checkInOpen,
    setCheckInOpen,
    doCheckIn,
    displaySessions,
    sessionsByUser,
    assignees,
    assigneeStats,
    changeAssignees,
    avatarStatus,
    caption,
    locked,
    assigneeUsers,
    canTrackTime,
    canAddSessions,
    canManageTimesheet,
    timesheetFrozen,
    startJob,
    cancelJob,
    pauseJob,
    doResume,
    doChangeActive,
    doChangePause,
    saveSession,
    confirmDeleteSession,
    openEditSession,
    openAddSession,
    actions,
  };
}

type ShellState = ReturnType<typeof useJobShell>;

// All the lifecycle + time-session forms, shared by both shells (they differ
// only by the mobile flag / Prompt breakpoint). Rendered once per shell.
const JobForms = ({ s, mobile = false }: { s: ShellState; mobile?: boolean }) => (
  <>
    <PauseJobForm open={s.pauseOpen} onClose={() => s.setPauseOpen(false)} onPause={s.pauseJob} type={s.pauseFormType} mobile={mobile} />
    {/* Complete job — the 5-step flow (Equipment shares the live equipment list;
        the rest is a snapshot). Figma section 24106-16424. */}
    <CompleteJobForm
      charges={s.charges}
      chargesTotal={s.chargesSubtotal}
      open={s.completeOpen}
      onClose={() => s.setCompleteOpen(false)}
      // Completing moves the job to "Completed" (stamping "Completed on"),
      // files the signature into the Summary tab's Signature module, and hands
      // straight over to the Send-summary form (Daniel, 2026-08-07).
      onCompleted={(signature) => {
        s.setCompleteOpen(false);
        s.completeJob(signature);
        s.setSendSummaryAfterCompletion(true);
        s.setSendSummaryOpen(true);
      }}
      equipmentIds={s.equipmentIds}
      onEquipmentIdsChange={s.changeEquipmentIds}
      equipmentPool={s.equipmentPool}
      // The Signature step recaps the job: Type / Recall to / Service belong to
      // the Service module, Source ID to Job properties (and only shows when
      // the source provides one).
      jobFacts={{
        jobId: s.jobProperties.jobId,
        sourceId: sourceRequiresId(s.jobSources, s.jobProperties.source) ? s.jobProperties.sourceId : undefined,
        isRecall: s.serviceValues.type === "recall",
        recallTo: s.serviceValues.recallTo,
        service: s.serviceValues.service,
      }}
      mobile={mobile}
    />
    {/* Send job summary — opens right after the job is completed
        (Figma 24576-152451), and again from "Resend summary". The hand-over
        from the Complete flow is a step of it, so its leading button says
        "Skip"; opened by hand it says "Cancel". */}
    <SendSummaryForm
      open={s.sendSummaryOpen}
      onClose={() => s.setSendSummaryOpen(false)}
      afterCompletion={s.sendSummaryAfterCompletion}
      mobile={mobile}
    />
    {/* Schedule job dialog (Figma 24222-20585) — the Scheduling form with
        schedule copy; its own toast is the scheduled one (24049-13916). */}
    {/* Schedule / Reschedule / Unschedule job all open the SAME Scheduling form
        now (Daniel, 2026-08-05) — it names the action on its own button and
        writes the same logs as the module's pen. */}
    <SchedulingForm
      open={s.scheduleOpen}
      onClose={() => s.setScheduleOpen(false)}
      initial={s.scheduling}
      initialMode={s.scheduleFormMode}
      onSave={s.confirmSchedule}
      mobile={mobile}
    />
    {/* Resume job (Figma 24096-19684): the Start-job form shape — sub-status,
        optional Resume reason, and the Check in card. Resuming a PAUSED job has
        no banner; resuming a COMPLETED one warns that the signature is void
        (Figma 24567-140277). */}
    <StartJobForm
      open={s.resumeOpen}
      onClose={() => s.setResumeOpen(false)}
      onStart={s.doResume}
      title="Resume job"
      // "Resume", not "Resume job" (Daniel, 2026-10-05) — the dialog's title
      // already names the job, the same trim Start / Cancel / Schedule took.
      submitLabel="Resume"
      reasonLabel="Resume reason"
      toastTitle={`"${s.jobId}" resumed`}
      banner={
        s.job.status === "completed"
          ? "Resuming this job will return it to Active status. A new signature will need to be collected to complete this job."
          : undefined
      }
      mobile={mobile}
    />
    {/* The two "Mark as" confirmations — both finalize the job
        (Figma 24567-139607 / 24567-140732). The primary carries the SAME
        leading icon as its menu item, so the action is recognisable from the
        row you picked to the button you press (2026-10-06). */}
    <Prompt
      open={s.markInvoicedOpen}
      title="Mark the job as invoiced?"
      body="This action can not be undone"
      actionLabel="Mark as invoiced"
      actionIcon="circle-dollar"
      onAction={() => {
        s.setMarkInvoicedOpen(false);
        s.finalizeJob("invoiced");
      }}
      onCancel={() => s.setMarkInvoicedOpen(false)}
      breakpoint={mobile ? "mobile" : "desktop"}
    />
    <Prompt
      open={s.markEstimatedOpen}
      title="Mark the job as estimated?"
      body="This action can not be undone"
      actionLabel="Mark as estimated"
      actionIcon="clock"
      onAction={() => {
        s.setMarkEstimatedOpen(false);
        s.finalizeJob("estimated");
      }}
      onCancel={() => s.setMarkEstimatedOpen(false)}
      breakpoint={mobile ? "mobile" : "desktop"}
    />
    <SubStatusForm
      open={s.changeActiveOpen}
      onClose={() => s.setChangeActiveOpen(false)}
      title="Change active status"
      submitLabel="Change status"
      reasonLabel="Status message"
      toastTitle={`"${s.jobId}" status changed`}
      initialSubStatus={s.job.subStatus ?? ""}
      initialReason={s.job.statusMessage ?? ""}
      onSubmit={s.doChangeActive}
      mobile={mobile}
    />
    <ChangePauseStatusForm
      open={s.changePauseOpen}
      onClose={() => s.setChangePauseOpen(false)}
      initialType={s.job.status === "onHold" ? "on-hold" : "quick-pause"}
      initialSubStatus={s.job.subStatus ?? ""}
      onSubmit={s.doChangePause}
      mobile={mobile}
    />
    <SessionForm
      open={s.sessionFormOpen}
      onClose={() => s.setSessionFormOpen(false)}
      session={s.editingSession}
      startDate={s.sessionStartDate}
      onSave={s.saveSession}
      mobile={mobile}
    />
    {/* The Timesheet review — opens on EVERY check-out (Figma 24598-41150 /
        24598-41148). It confirms nothing: "It's correct", Cancel and the ✕ all
        just close it; the session was already logged by the check-out. */}
    <TimesheetForm
      open={s.timesheetOpen}
      onClose={() => s.setTimesheetOpen(false)}
      sessions={s.displaySessions}
      onAddSession={(dayLabel) => s.openAddSession(dayLabel != null ? new Date(dayLabel) : undefined)}
      onEditSession={s.openEditSession}
      onDeleteSession={s.setDeleteTarget}
      mobile={mobile}
    />
    {/* Check-in dialog (Figma 24194-74433 / 74815): pick a status, check in. */}
    <CheckInDialog open={s.checkInOpen} onClose={() => s.setCheckInOpen(false)} onCheckIn={s.doCheckIn} mobile={mobile} />
    {/* Check-out confirm (Figma 24184-59897) — the danger action logs the
        session ("Time session saved"). Same copy on both breakpoints. */}
    <Prompt
      open={s.checkOutPromptOpen}
      title="Check out?"
      body="The job is still in progress. Are you sure you want to stop tracking your time and check out?"
      actionLabel="Check out"
      actionVariant="danger"
      actionIcon="arrow-left-from-arc"
      onAction={s.confirmCheckOut}
      onCancel={() => s.setCheckOutPromptOpen(false)}
      breakpoint={mobile ? "mobile" : "desktop"}
    />
    <Prompt
      open={s.deleteTarget != null}
      title="Delete time session?"
      body="Time session will be permanently deleted. This action can not be undone."
      actionLabel="Delete"
      actionVariant="danger"
      // `trash-can`, the token every other delete uses — this one said
      // `trash`, a different glyph (Daniel, 2026-10-06).
      actionIcon="trash-can"
      onAction={s.confirmDeleteSession}
      onCancel={() => s.setDeleteTarget(undefined)}
      breakpoint={mobile ? "mobile" : "desktop"}
    />
  </>
);

// ---- layouts --------------------------------------------------------------

const DesktopShell = ({ roundTo5min, record, onBack, onOpenJob }: { roundTo5min: boolean; record: ListJob; onBack?: () => void; onOpenJob?: (id: string) => void }) => {
  const s = useJobShell(true, record);
  // Desktop tabs switch the main content column; Details is the persistent
  // sidebar, so the tabs are Service / Timesheet / … (default Service).
  const [tab, setTab] = useState("service");
  return (
    <div className={styles.workArea}>
        {/* The job's actions sit in the TOP BAR on desktop now — there is no
            action bar in the sidebar any more (Daniel, 2026-10-04). */}
        <TopBar
          onBack={onBack}
          liveUsers={liveUsersFor(record)}
          actions={
            <ActionButtons
              status={s.job.status}
              onMenu={s.actionMenu.onActions}
              menuPressed={s.actionMenu.open}
              actions={s.actions}
              markAsMenu={s.markAsMenu}
              createMenu={s.createMenu}
            />
          }
        />
        <div className={styles.contentRow}>
          {/* The section tabs belong to the CONTENT AREA, so the bar stops at
              the sidebar's divider instead of running across it. */}
          <div className={styles.mainColumn}>
          <SectionTabs value={tab} onChange={setTab} />
          <ScrollArea wrapperClassName={styles.mainArea} className={styles.mainAreaScroll}>
            {/* The main column is capped at 560px (Figma: never edge-to-edge) —
                the Service panel gets the same cap as the Placeholder. */}
            {tab === "service" ? (
              <div className={styles.mainContent}>
                <ServicePanel serviceValues={s.serviceValues} onServiceChange={s.changeServiceValues} equipmentIds={s.equipmentIds} onEquipmentSave={s.saveEquipment} equipmentPool={s.equipmentPool} onCreateEquipment={s.createEquipment} locationName={s.location.name} onOpenJob={onOpenJob} />
              </div>
            ) : tab === "timesheet" ? (
              <div className={styles.mainContent}>
                <TimesheetPanel
                  assignees={s.assigneeUsers}
                  viewerId={s.viewer.id}
                  canEditOthers={s.canManageTimesheet}
                  readOnly={s.timesheetFrozen}
                  sessionsByUser={s.sessionsByUser}
                  onStopSession={s.actions.onCheckOut}
                  onSwitchStatus={s.switchStatus}
                  onEditSession={s.openEditSession}
                  onDeleteSession={s.setDeleteTarget}
                  onAddSession={(userId) => s.openAddSession(undefined, userId)}
                  canAddSessions={s.canAddSessions}
                  started={false}
                  roundTo5min={roundTo5min}
                />
              </div>
            ) : tab === "summary" ? (
              <div className={styles.mainContent}>
                <SummaryPanel
                  charges={s.charges}
                  chargesTotal={s.chargesSubtotal}
                  jobEquipment={s.jobEquipment}
                  signature={s.signature}
                  onFormsLog={s.logForms}
                  onTextLog={s.logTextProperty}
                />
              </div>
            ) : tab === "activity" ? (
              <div className={styles.mainContent}>
                <ActivityPanel
                  billableSec={s.lifecycle.billableSec}
                  lifecycleSec={s.lifecycle.lifecycleSec}
                  breakdown={s.lifecycle.breakdown}
                  events={s.activityEvents}
                />
              </div>
            ) : (
              <Placeholder className={styles.mainContent} />
            )}
          </ScrollArea>
          </div>
          {/* The details sidebar's left edge — MEDIUM, like SidebarNav's right
              edge on the other side of the page (Daniel, 2026-10-04). */}
          <Divider orientation="vertical" contrast="medium" />
          <ScrollArea wrapperClassName={styles.sidebar} className={styles.sidebarScroll}>
            {/* The ACTION BAR is gone from the desktop sidebar (Daniel,
                2026-10-04) — the job's actions are in the top bar. What stays
                pinned here is time tracking, which is separate from the job
                lifecycle: the bar shows on every status except Unscheduled /
                Cancelled, in three states — running session, amber idle
                (active job) or the neutral "Check in to track your time". */}
            {!s.locked && s.canTrackTime && (
              <div className={styles.sidebarHeader}>
                {/* No Divider after it — the bar draws its own inner bottom
                    stroke (Daniel, 2026-10-04). */}
                <SessionBar
                  checkedIn={s.checkedIn}
                  jobActive={s.job.status === "active"}
                  elapsed={s.elapsed}
                  category={s.activeCategory}
                  onCheckIn={s.actions.onCheckIn}
                  onCheckOut={s.actions.onCheckOut}
                  onSwitchStatus={s.switchStatus}
                />
              </div>
            )}
            <DetailsPanel scheduling={s.scheduling} onSchedulingChange={s.confirmSchedule}
          assignees={s.assignees}
          onAssigneesChange={s.changeAssignees}
          assigneeStats={s.assigneeStats} job={s.job} locked={s.locked} recallTo={s.serviceValues.type === "recall" ? s.serviceValues.recallTo : null} location={s.location} onLocationChange={s.changeLocation} locations={s.locations} onAddLocation={s.addLocation} equipmentCount={s.jobEquipment.length} jobProperties={s.jobProperties} onJobPropertiesChange={s.changeJobProperties} jobSources={s.jobSources} onCreateJobSource={s.createJobSource} billing={s.billing} onBillingChange={s.changeBilling} lastModified={s.lastModified} onJobChange={s.touchJob} onContactChange={s.logContactChange} onLabelsChange={s.logLabelsChange} onOpenJob={onOpenJob} />
          </ScrollArea>
        </div>
      {/* The actions overflow menu card — it leads with Copy URL / Download
          PDF on every status. A CANCELLED job has no "Actions" button, so this
          never opens there: those two are its bar buttons instead. */}
      {s.actionMenu.pos != null && (
        <div ref={s.actionMenu.cardRef} className={styles.contextMenu} style={{ left: s.actionMenu.pos.left, top: s.actionMenu.pos.top }}>
          <Menu open={s.actionMenu.open} onClose={s.actionMenu.close} breakpoint="desktop">
            {jobActionMenuItems({ status: s.job.status, actions: s.actions, onClose: s.actionMenu.close })}
          </Menu>
        </div>
      )}
      {/* A completed job's two button menus (Figma 24590-203979 / 24590-204302). */}
      {s.markAsMenu.pos != null && (
        <div ref={s.markAsMenu.cardRef} className={styles.contextMenu} style={{ left: s.markAsMenu.pos.left, top: s.markAsMenu.pos.top }}>
          <Menu open={s.markAsMenu.open} onClose={s.markAsMenu.close} breakpoint="desktop">
            {markAsMenuItems(s.actions)}
          </Menu>
        </div>
      )}
      {s.createMenu.pos != null && (
        <div ref={s.createMenu.cardRef} className={styles.contextMenu} style={{ left: s.createMenu.pos.left, top: s.createMenu.pos.top }}>
          <Menu open={s.createMenu.open} onClose={s.createMenu.close} breakpoint="desktop">
            {createMenuItems(s.actions)}
          </Menu>
        </div>
      )}
      <StartJobForm open={s.startOpen} onClose={() => s.setStartOpen(false)} onStart={s.startJob} />
      <CancelJobForm open={s.cancelOpen} onClose={() => s.setCancelOpen(false)} scheduling={s.scheduling} onCancel={s.cancelJob} />
      <JobForms s={s} />
      <Toaster breakpoint="desktop" />
    </div>
  );
};


// ---- mobile tab pager -------------------------------------------------------

const MOBILE_TABS = ["details", "service", "timesheet", "summary", "activity"];
const PAGER_SETTLE_MS = 240;

// A real-time swipe pager (Daniel, 2026-07-22): dragging the content moves the
// CURRENT tab with the finger and reveals the neighbor beside it; releasing
// past ~1/3 width (or flicking) settles onto it, otherwise springs back. Tab
// taps reuse the same settle motion (the `tab` prop change starts a settle
// toward the tapped tab). While idle only the current panel is mounted.
const SwipePager = ({
  tab,
  onTabChange,
  render,
}: {
  tab: string;
  onTabChange: (t: string) => void;
  render: (t: string) => JSX.Element;
}) => {
  // `shown` lags the prop during the settle animation.
  const [shown, setShown] = useState(tab);
  const [drag, setDrag] = useState<number | null>(null); // finger dx in px
  const [settle, setSettle] = useState<{ toTab: string; shift: -1 | 1; started: boolean } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; y: number; captured: boolean; skip: boolean } | null>(null);
  const settleTimer = useRef<number | undefined>(undefined);

  const index = MOBILE_TABS.indexOf(shown);
  const prevTab = index > 0 ? MOBILE_TABS[index - 1] : null;
  const nextTab = index < MOBILE_TABS.length - 1 ? MOBILE_TABS[index + 1] : null;

  const beginSettle = (toTab: string, shift: -1 | 1, fromDx: number | null) => {
    window.clearTimeout(settleTimer.current);
    setDrag(fromDx); // keep the track at the finger's last offset for this frame
    setSettle({ toTab, shift, started: false });
    // Next frame: enable the transition and move to the target slot.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setDrag(null);
        setSettle((cur) => (cur == null ? null : { ...cur, started: true }));
      }),
    );
    settleTimer.current = window.setTimeout(() => {
      setShown(toTab);
      setSettle(null);
    }, PAGER_SETTLE_MS + 20);
  };

  // An outside tab change (tab-bar tap) settles toward the new tab.
  useEffect(() => {
    if (tab === shown || settle != null) return;
    const shift: -1 | 1 = MOBILE_TABS.indexOf(tab) > index ? 1 : -1;
    beginSettle(tab, shift, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (settle != null) return; // let the current settle finish
    const t = e.touches[0];
    // A gesture starting inside a horizontal scroller (e.g. nothing in the
    // content today, but future-proof) never drags the pager.
    let el = e.target as HTMLElement | null;
    let skip = false;
    while (el != null && el !== rootRef.current) {
      // The pager's own track is horizontally overflowing by design — only
      // OTHER horizontal scrollers opt a gesture out.
      if (el.dataset.pagerTrack == null && el.scrollWidth > el.clientWidth + 1) {
        skip = true;
        break;
      }
      el = el.parentElement;
    }
    gesture.current = { x: t.clientX, y: t.clientY, captured: false, skip };
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (g == null || g.skip || settle != null || isRowDragActive()) return;
    const t = e.touches[0];
    const dx = t.clientX - g.x;
    const dy = t.clientY - g.y;
    if (!g.captured) {
      // Capture only a decisively horizontal move; a vertical start opts out.
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
        g.skip = true;
        return;
      }
      if (Math.abs(dx) < 12 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      g.captured = true;
    }
    // No neighbor on that side → rubber-band resistance.
    const damped = (dx < 0 && nextTab == null) || (dx > 0 && prevTab == null) ? dx * 0.25 : dx;
    setDrag(damped);
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const g = gesture.current;
    gesture.current = null;
    if (g == null || !g.captured || settle != null) {
      setDrag(null);
      return;
    }
    const dx = e.changedTouches[0].clientX - g.x;
    const width = rootRef.current?.clientWidth ?? window.innerWidth;
    const toTab = dx < 0 ? nextTab : prevTab;
    if (toTab != null && Math.abs(dx) > Math.min(width / 3, 120)) {
      const shift: -1 | 1 = dx < 0 ? 1 : -1;
      onTabChange(toTab);
      beginSettle(toTab, shift, drag);
    } else {
      // Spring back to the current tab.
      beginSettle(shown, 0 as never as -1 | 1, drag);
    }
  };

  const active = drag != null || settle != null;
  // Track slots: [left?, CURRENT, right?] — the CURRENT page is ALWAYS mounted
  // with a stable key, so mounting the neighbors mid-gesture never unmounts the
  // element the finger touched (an unmounted touch target kills the rest of
  // the touch stream — the original "drag sticks" bug). During a settle toward
  // a non-adjacent tab (tab-bar tap), the target takes the travel-side slot.
  const leftSlot = settle != null && settle.shift === -1 ? settle.toTab : prevTab;
  const rightSlot = settle != null && settle.shift === 1 ? settle.toTab : nextTab;
  const leftMounted = active && leftSlot != null;
  const rightMounted = active && rightSlot != null;
  const basePercent = leftMounted ? -100 : 0;
  const settleDelta = settle != null && settle.started && settle.toTab !== shown ? (settle.shift === 1 ? -100 : 100) : 0;

  return (
    <div ref={rootRef} className={styles.pager} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        data-pager-track
        className={styles.pagerTrack}
        style={{
          transform: `translateX(calc(${basePercent + settleDelta}% + ${drag ?? 0}px))`,
          transition: settle != null && settle.started ? `transform ${PAGER_SETTLE_MS}ms cubic-bezier(0.32, 0.72, 0, 1)` : "none",
        }}
      >
        {leftMounted && (
          <div className={styles.page} key={leftSlot}>
            {render(leftSlot!)}
          </div>
        )}
        <div className={styles.page} key={shown}>
          {render(shown)}
        </div>
        {rightMounted && (
          <div className={styles.page} key={rightSlot}>
            {render(rightSlot!)}
          </div>
        )}
      </div>
    </div>
  );
};

const MobileShell = ({ roundTo5min, record, onBack, onOpenJob }: { roundTo5min: boolean; record: ListJob; onBack?: () => void; onOpenJob?: (id: string) => void }) => {
  const s = useJobShell(false, record);
  // The Details tab (the desktop right sidebar) is the only tab with real
  // content so far; the others keep the placeholder.
  const [tab, setTab] = useState("details");
  // The active pill opens the session drawer (mobile only).
  const [sessionDrawerOpen, setSessionDrawerOpen] = useState(false);
  return (
    <div className={styles.mobile}>
      {/* The top bar is OUTSIDE the scroller, so it stays fixed while the page
          scrolls (Daniel, 2026-10-04). The tabs bar is INSIDE it and scrolls
          away with the content. */}
      <TopBar mobile onBack={onBack} liveUsers={liveUsersFor(record)} />
      <ScrollArea wrapperClassName={styles.mobileScroll} className={styles.mobileScrollInner}>
        {/* The tabs are their own bar here too — a row under the top bar, not
            a part of it (Daniel, 2026-10-04). The ActionBar still owns the
            job's actions at the bottom of the screen. */}
        <SectionTabs withDetails hideOnScroll value={tab} onChange={setTab} />
        {/* Swipe-to-switch-tabs listens ONLY here (the tab content) — not on
            the TopBarNav, the tabs bar or the ActionBar (Daniel, 2026-07-22). */}
        {/* Real-time swipe pager: drag the content to pull the next tab in. */}
        <SwipePager
          tab={tab}
          onTabChange={setTab}
          render={(t) =>
            t === "details" ? (

          <DetailsPanel mobile scheduling={s.scheduling} onSchedulingChange={s.confirmSchedule}
          assignees={s.assignees}
          onAssigneesChange={s.changeAssignees}
          assigneeStats={s.assigneeStats} job={s.job} locked={s.locked} recallTo={s.serviceValues.type === "recall" ? s.serviceValues.recallTo : null} location={s.location} onLocationChange={s.changeLocation} locations={s.locations} onAddLocation={s.addLocation} equipmentCount={s.jobEquipment.length} jobProperties={s.jobProperties} onJobPropertiesChange={s.changeJobProperties} jobSources={s.jobSources} onCreateJobSource={s.createJobSource} billing={s.billing} onBillingChange={s.changeBilling} lastModified={s.lastModified} onJobChange={s.touchJob} onContactChange={s.logContactChange} onLabelsChange={s.logLabelsChange} onOpenJob={onOpenJob} />
            ) : t === "service" ? (
              <ServicePanel mobile serviceValues={s.serviceValues} onServiceChange={s.changeServiceValues} equipmentIds={s.equipmentIds} onEquipmentSave={s.saveEquipment} equipmentPool={s.equipmentPool} onCreateEquipment={s.createEquipment} locationName={s.location.name} onOpenJob={onOpenJob} />
            ) : t === "timesheet" ? (
          <TimesheetPanel
            assignees={s.assigneeUsers}
            viewerId={s.viewer.id}
            canEditOthers={s.canManageTimesheet}
            readOnly={s.timesheetFrozen}
            sessionsByUser={s.sessionsByUser}
            onStopSession={s.actions.onCheckOut}
            onSwitchStatus={s.switchStatus}
            onEditSession={s.openEditSession}
            onDeleteSession={s.setDeleteTarget}
            onAddSession={(userId) => s.openAddSession(undefined, userId)}
            canAddSessions={s.canAddSessions}
            started={false}
            roundTo5min={roundTo5min}
            mobile
          />
            ) : t === "summary" ? (
              <SummaryPanel
                charges={s.charges}
                chargesTotal={s.chargesSubtotal}
                mobile
                jobEquipment={s.jobEquipment}
                signature={s.signature}
                onFormsLog={s.logForms}
                onTextLog={s.logTextProperty}
              />
            ) : t === "activity" ? (
              <ActivityPanel
            mobile
            billableSec={s.lifecycle.billableSec}
            lifecycleSec={s.lifecycle.lifecycleSec}
            breakdown={s.lifecycle.breakdown}
            events={s.activityEvents}
          />
            ) : (
              <Placeholder className={styles.mobileContent} />
            )
          }
        />
      </ScrollArea>
      {/* The session pill floats 12px above the action bar, on every status
          except Unscheduled / Cancelled (time tracking is separate from the
          job lifecycle). Running session: tap opens the session drawer;
          otherwise: tap opens the Check in dialog. A zero-height anchor keeps
          it glued to the action bar's top edge regardless of the safe-area
          inset. */}
      {s.canTrackTime && (
        <div className={styles.pillAnchor}>
          <SessionPill
            checkedIn={s.checkedIn}
            jobActive={s.job.status === "active"}
            elapsed={s.elapsed}
            category={s.activeCategory}
            onClick={s.checkedIn ? () => setSessionDrawerOpen(true) : s.actions.onCheckIn}
          />
        </div>
      )}
      {/* The bottom action bar stays on mobile. A cancelled job keeps it too:
          Copy URL / Download PDF ARE its two buttons now (Figma 24972-52200,
          2026-10-06), so nothing it can still do is hidden behind a menu. */}
      <ActionBar placement="bottom">
        <ActionButtons
          status={s.job.status}
          onMenu={s.actionMenu.onActions}
          menuPressed={s.actionMenu.open}
          actions={s.actions}
          markAsMenu={s.markAsMenu}
          createMenu={s.createMenu}
          mobile
        />
      </ActionBar>
      <SessionDrawer
        open={sessionDrawerOpen && s.checkedIn}
        elapsed={s.elapsed}
        category={s.activeCategory}
        onSwitchStatus={s.switchStatus}
        onClose={() => setSessionDrawerOpen(false)}
        onCheckOut={() => {
          setSessionDrawerOpen(false);
          s.actions.onCheckOut();
        }}
      />
      <Menu
        open={s.actionMenu.open}
        onClose={s.actionMenu.close}
        drawerHeader={<JobMenuHeader />}
        breakpoint="mobile"
      >
        {jobActionMenuItems({ status: s.job.status, actions: s.actions, onClose: s.actionMenu.close, mobile: true })}
      </Menu>
      {/* A completed job's two button menus become drawers on mobile, under the
          same job header as the overflow menu (Figma 24590-203977 / 24590-204300). */}
      <Menu
        open={s.markAsMenu.open}
        onClose={s.markAsMenu.close}
        drawerHeader={<JobMenuHeader />}
        breakpoint="mobile"
      >
        {markAsMenuItems(s.actions)}
      </Menu>
      <Menu
        open={s.createMenu.open}
        onClose={s.createMenu.close}
        drawerHeader={<JobMenuHeader />}
        breakpoint="mobile"
      >
        {createMenuItems(s.actions)}
      </Menu>
      <StartJobForm open={s.startOpen} onClose={() => s.setStartOpen(false)} onStart={s.startJob} mobile />
      <CancelJobForm open={s.cancelOpen} onClose={() => s.setCancelOpen(false)} scheduling={s.scheduling} onCancel={s.cancelJob} mobile />
      <JobForms s={s} mobile />
      <Toaster breakpoint="mobile" />
    </div>
  );
};

export default function JobDetails({ record, breakpoint = "auto", roundTo5min = COMPANY.roundsTimeUp, onBack, onOpenJob }: JobDetailsProps) {
  const isDesktop = useIsDesktop(breakpoint);
  // Remounting on the job id is deliberate: every module seeds its state from
  // the record, so opening another job has to start those modules over rather
  // than carry the previous job's edits across.
  return (
    <CurrentJobIdProvider id={record.id}>
      {isDesktop ? (
        <DesktopShell key={record.id} roundTo5min={roundTo5min} record={record} onBack={onBack} onOpenJob={onOpenJob} />
      ) : (
        <MobileShell key={record.id} roundTo5min={roundTo5min} record={record} onBack={onBack} onOpenJob={onOpenJob} />
      )}
    </CurrentJobIdProvider>
  );
}
