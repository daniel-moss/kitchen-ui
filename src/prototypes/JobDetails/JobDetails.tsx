import { MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from "react";

import clsx from "clsx";

import AvatarJob from "../../components/Avatar/AvatarJob";
import { AvatarGroupItem } from "../../components/Avatar/AvatarGroup.types";
import { BadgeJobStatusStatus } from "../../components/Badge/BadgeJobStatus";
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
import SelectField from "../../components/Fields/SelectField/SelectField";
import Toaster, { toast } from "../../components/Toast/Toaster";
import NavSidebar from "../../components/NavSidebar/NavSidebar";
import NavSidebarItem from "../../components/NavSidebar/NavSidebarItem";
import NavSidebarItemGroup from "../../components/NavSidebar/NavSidebarItemGroup";
import NavTopBar from "../../components/NavTopBar/NavTopBar";
import NavTopBarLeftElements from "../../components/NavTopBar/NavTopBarLeftElements";
import NavTopBarTitle from "../../components/NavTopBar/NavTopBarTitle";
import ScrollArea from "../../components/ScrollArea/ScrollArea";
import TabGroup from "../../components/Tabs/TabGroup";
import TabItem from "../../components/Tabs/TabItem";
import useIsDesktop, { Breakpoint } from "../../hooks/useIsDesktop";
import { semanticIcons } from "../../styles/semanticIcons";
import { users } from "../../data/users";
import ActionBar from "./ActionBar";
import CancelJobForm from "./CancelJobForm";
import ChangePauseStatusForm from "./ChangePauseStatusForm";
import CompleteJobForm from "./CompleteJobForm";
import Dialog from "../../components/Dialog/Dialog";
import DetailsPanel from "./DetailsPanel";
import { DEFAULT_LOCATION, JOB_ID, JobLocation, LOCATIONS } from "./jobData";
import { defaultJob, displayStatus, formatStatusTimestamp, JobState, JobStatus, statusLabel } from "./jobState";
import PauseJobForm from "./PauseJobForm";
import SchedulingForm, { defaultScheduling, Scheduling } from "./SchedulingForm";
import { defaultServiceValues, ServiceValues } from "./ServiceForm";
import ServicePanel, { EQUIPMENT_POOL, INITIAL_JOB_EQUIPMENT } from "./ServicePanel";
import SummaryPanel from "./SummaryPanel";
import SessionForm, { Meridiem, SessionDraft } from "./SessionForm";
import StartJobForm from "./StartJobForm";
import UnscheduleJobForm from "./UnscheduleJobForm";
import SubStatusForm from "./SubStatusForm";
import TimesheetPanel, { categoryIcon, formatHrMin, Session, StatusItems } from "./TimesheetPanel";
import { SelectPopoverList, useSelectPopover } from "../../forms/shared/selectPopover";
import { isRowDragActive } from "../../utils/dragLock";
import { copyText, noop, slot, useAnchoredMenu } from "./shared";

import styles from "./JobDetails.module.scss";

// Job Details — prototype shell (slice 1). Desktop: NavSidebar + NavTopBar
// (details) + a max-560px main content column + a 400px right sidebar with
// the ActionBar pinned on top. Mobile: the right sidebar becomes the first
// tab ("Details"), the ActionBar pins to the bottom, and the top bar hides
// on scroll. Content areas are placeholders — filled in later slices.

export interface JobDetailsProps {
  /** Desktop / mobile shell. "auto" (default) follows the viewport. */
  breakpoint?: Breakpoint;
}

// Real photos from the shared demo-users fixture; ring colors auto-assign
// (crimson, teal — high contrast between neighbors).
const LIVE_USERS: AvatarGroupItem[] = [users[10], users[2]].map((u) => ({
  kind: "live",
  content: "image",
  imageSrc: u.avatar,
  name: u.name,
}));

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
  <TabGroup value={value} onChange={onChange} defaultValue={value == null ? "service" : undefined}>
    {withDetails && <TabItem value="details">Details</TabItem>}
    <TabItem value="service">Service</TabItem>
    <TabItem value="timesheet">Timesheet</TabItem>
    <TabItem value="summary">Summary</TabItem>
    <TabItem value="activity">Activity</TabItem>
  </TabGroup>
);

interface TopBarProps {
  mobile?: boolean;
  hideOnScroll?: boolean;
  /** Opens the job context menu (the ellipsis next to the title). */
  onActions: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  actionsPressed?: boolean;
  /** Mobile: controlled tab selection. */
  tab?: string;
  onTabChange?: (value: string) => void;
  /** The job avatar's status ring (upcoming / pastDue / active / cancelled / unscheduled). */
  avatarStatus: BadgeJobStatusStatus;
}

const TopBar = ({ mobile = false, hideOnScroll = false, onActions, actionsPressed = false, tab, onTabChange, avatarStatus }: TopBarProps) => (
  <NavTopBar
    variant="details"
    liveUsers={LIVE_USERS}
    tabs={<Tabs withDetails={mobile} value={tab} onChange={onTabChange} />}
    breakpoint={mobile ? "mobile" : "desktop"}
    hideOnScroll={hideOnScroll}
  >
    <NavTopBarLeftElements onBack={noop} onActions={onActions} actionsPressed={actionsPressed}>
      <NavTopBarTitle title={JOB_ID} slotLeft={<AvatarJob size="md" status={avatarStatus} />} />
    </NavTopBarLeftElements>
  </NavTopBar>
);

// ---- job context menu (the ellipsis next to the title) ---------------------

// Simulated download: the processing toast resolves into the success one
// (the designed error toast would take its place on a real failure).
const downloadPdf = () => {
  const id = toast({ type: "processing", title: "Downloading PDF..." });
  window.setTimeout(() => toast.update(id, { type: "success", title: "PDF downloaded" }), 2000);
};

const JobContextMenuItems = ({ onClose }: { onClose: () => void }) => (
  <MenuItemGroup>
    <MenuItem
      label="Copy URL"
      slotLeft={slot("link")}
      onClick={() => {
        onClose();
        void copyText(window.location.href, "Job URL");
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
    <MenuItem label="Send job summary" slotLeft={slot("paper-plane")} onClick={onClose} />
  </MenuItemGroup>
);

// Handlers shared by the action-bar buttons and its overflow menu.
interface JobActions {
  onStart: () => void;
  onSchedule: () => void;
  onPause: () => void;
  onResume: () => void;
  onChangeActive: () => void;
  onChangePause: () => void;
  onComplete: () => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onReschedule: () => void;
  onUnschedule: () => void;
  onCancel: () => void;
}

// The primary-actions row: overflow ellipsis on the LEFT, then a full-width
// primary button (Figma). The buttons depend on the job's state:
//   upcoming/pastDue → Start job    unscheduled → Schedule
//   active           → Pause + Complete   (cancelled hides the whole bar)
const ActionButtons = ({
  status,
  onMenu,
  menuPressed,
  actions,
}: {
  status: JobStatus;
  onMenu: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  menuPressed: boolean;
  actions: JobActions;
}) => {
  const ellipsis = (
    <IconButton icon="ellipsis" size="lg" variant="ghost" aria-label="More actions" isPressed={menuPressed} noDebounce onClick={onMenu} />
  );
  if (status === "unscheduled") {
    return (
      <>
        {ellipsis}
        <Button size="lg" variant="solid" className={styles.grow} onClick={actions.onSchedule}>
          Schedule job
        </Button>
      </>
    );
  }
  if (status === "active") {
    return (
      <>
        {ellipsis}
        <Button size="lg" variant="subtle" className={styles.grow} onClick={actions.onPause}>
          Pause job
        </Button>
        <Button size="lg" variant="solid" className={styles.grow} onClick={actions.onComplete}>
          Complete job
        </Button>
      </>
    );
  }
  if (status === "quickPaused" || status === "onHold") {
    // Paused / on hold → just Resume (no Complete while paused).
    return (
      <>
        {ellipsis}
        <Button size="lg" variant="solid" className={styles.grow} onClick={actions.onResume}>
          Resume job
        </Button>
      </>
    );
  }
  // upcoming / pastDue
  return (
    <>
      {ellipsis}
      <Button size="lg" variant="solid" className={styles.grow} onClick={actions.onStart}>
        Start job
      </Button>
    </>
  );
};

// The action-bar overflow menu — items depend on the job's state.
// IMPORTANT: call this as a FUNCTION ({jobActionMenuItems(...)}), not as a
// component — Menu's withGroupDividers can only see the MenuItemGroups when it
// receives the fragment itself; a component element hides them, and the
// between-group dividers silently disappear (Daniel caught this, 2026-07-21).
const jobActionMenuItems = ({ status, actions }: { status: JobStatus; actions: JobActions }) => {
  const cancel = (
    <MenuItemGroup>
      <MenuItem label="Cancel job" slotLeft={slot("ban")} danger onClick={actions.onCancel} />
    </MenuItemGroup>
  );
  if (status === "unscheduled") {
    return (
      <>
        <MenuItemGroup>
          <MenuItem label="Schedule job" slotLeft={slot("calendar-lines-pen")} onClick={actions.onSchedule} />
        </MenuItemGroup>
        {cancel}
      </>
    );
  }
  if (status === "active") {
    // Updated design (Figma 24057-16092): no Start/Stop-time-session item —
    // the session lives in the bar/pill now. Lifecycle actions + Reschedule.
    return (
      <>
        <MenuItemGroup>
          <MenuItem label="Change job active status" slotLeft={slot("circle-play")} onClick={actions.onChangeActive} />
          <MenuItem label="Pause job" slotLeft={slot("circle-pause")} onClick={actions.onPause} />
          <MenuItem label="Complete job" slotLeft={slot("circle-check")} onClick={actions.onComplete} />
        </MenuItemGroup>
        <MenuItemGroup>
          <MenuItem label="Reschedule job" slotLeft={slot("calendar-lines-pen")} onClick={actions.onReschedule} />
        </MenuItemGroup>
      </>
    );
  }
  // Paused / on hold (Figma 24096-19267): status actions, then Reschedule.
  // No Cancel item in this design.
  if (status === "quickPaused" || status === "onHold") {
    return (
      <>
        <MenuItemGroup>
          <MenuItem label="Change job pause status" slotLeft={slot("circle-pause")} onClick={actions.onChangePause} />
          <MenuItem label="Resume job" slotLeft={slot("circle-play")} onClick={actions.onResume} />
        </MenuItemGroup>
        <MenuItemGroup>
          <MenuItem label="Reschedule job" slotLeft={slot("calendar-lines-pen")} onClick={actions.onReschedule} />
        </MenuItemGroup>
      </>
    );
  }
  // Scheduled / upcoming / pastDue (Figma 24042-15254, updated 2026-07-21):
  // three single-item groups — Start / Unschedule / the danger Cancel.
  return (
    <>
      <MenuItemGroup>
        <MenuItem label="Start job" slotLeft={slot("circle-play")} onClick={actions.onStart} />
      </MenuItemGroup>
      <MenuItemGroup>
        <MenuItem label="Unschedule job" slotLeft={slot("calendar-xmark")} onClick={actions.onUnschedule} />
      </MenuItemGroup>
      <MenuItemGroup>
        <MenuItem label="Cancel job" slotLeft={slot("ban")} danger onClick={actions.onCancel} />
      </MenuItemGroup>
    </>
  );
};

// The mobile overflow menu's drawer header: the job avatar + id + status caption.
// The avatar is AvatarJob (the same wrench-glyph identity as the NavTopBar title)
// at size xl (36px) — the size the Figma drawer header uses.
const JobMenuHeader = ({ avatarStatus, caption }: { avatarStatus: BadgeJobStatusStatus; caption: string }) => (
  <DrawerHeader>
    <PopoverHeaderContent avatar={<AvatarJob size="xl" status={avatarStatus} />}>
      <PopoverHeaderText variant="titleCaption" title={JOB_ID} caption={caption} />
    </PopoverHeaderContent>
  </DrawerHeader>
);

/** A marked empty area — where real content lands in later slices. */
const Placeholder = ({ className }: { className?: string }) => (
  <div className={clsx(styles.placeholder, className)}>
    <span>Content</span>
  </div>
);

// ---- NavSidebar config (display only) ------------------------------------


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
    <NavSidebarItem icon="house">Home</NavSidebarItem>
    <NavSidebarItem icon={semanticIcons.estimate}>Estimates</NavSidebarItem>
    {/* The current page (a job's details) lives under Jobs — open + active. */}
    <NavSidebarItemGroup icon={semanticIcons.job} label="Jobs" defaultOpen>
      <NavSidebarItem type="stackItem">Job requests</NavSidebarItem>
      <NavSidebarItem type="stackItem" active>
        Jobs
      </NavSidebarItem>
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
  const menu = useAnchoredMenu(true, "end");
  return (
    <div className={styles.timerBar}>
      <div className={styles.timerRow}>
        <div className={styles.timerInfo}>
          <span className={clsx(styles.timerAvatar, !checkedIn && (jobActive ? styles.timerAvatarIdle : styles.timerAvatarNeutral))}>
            <Icon
              icon={checkedIn ? categoryIcon(category) : jobActive ? "warning" : "stopwatch"}
              pack={checkedIn || jobActive ? "solid" : "regular"}
              size={16}
            />
          </span>
          <span className={styles.timerText}>
            <span className={clsx(styles.timerClock, !checkedIn && styles.timerClockIdle)}>
              {checkedIn ? formatElapsed(elapsed) : "00:00"}
            </span>
            <span className={clsx(styles.timerLabel, !checkedIn && jobActive && styles.timerLabelIdle)}>
              {checkedIn ? category ?? "Tracking your time" : jobActive ? "Not tracking your time" : "Check in to track your time"}
            </span>
          </span>
        </div>
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
                label="My status"
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

// The mobile "Time tracker" dialog (Figma 24178-58902, 2026-07-27 update) —
// opened by tapping the active pill. Title header + close, body = the current
// STATUS caption + big red timer + a labeled "Status" SELECT showing the
// current status with its icon (a draft pick — opens the status list drawer);
// footer = Cancel, ghost "Check out" (→ the prompt) and solid "Update", which
// commits a status switch. Dismissing (scrim / X) with an unsaved pick shows
// the Dialog's standard "Discard changes?" prompt.
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
  // The select is a DRAFT — only Update commits (Figma annotation).
  const [draft, setDraft] = useState(category ?? "");
  const statusPop = useSelectPopover(true);
  useEffect(() => {
    if (open) setDraft(category ?? "");
  }, [open, category]);
  const dirty = draft !== (category ?? "");
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Time tracker"
      breakpoint="mobile"
      confirmOnDismiss={dirty}
      footer={
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="ghost" leftIcon="arrow-left-from-arc" onClick={onCheckOut}>
            Check out
          </Button>
          <Button
            size="lg"
            variant="solid"
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
        <Input label="Status">
          <SelectField
            value={draft !== "" ? draft : undefined}
            slotLeft={draft !== "" ? <Icon icon={categoryIcon(draft)} size={14} container="square" /> : undefined}
            open={statusPop.open}
            onClick={(e: ReactMouseEvent<HTMLDivElement>) => statusPop.toggle(e.currentTarget)}
          />
        </Input>
      </div>

      {/* Status picker — the drawer list titled "Status" (Figma 24353-26484). */}
      <SelectPopoverList pop={statusPop} mobile title="Status">
        <StatusItems
          current={draft !== "" ? draft : undefined}
          onPick={(status) => {
            setDraft(status);
            statusPop.close();
          }}
        />
      </SelectPopoverList>
    </Dialog>
  );
};

// The "Check in" dialog (Figma mobile 24194-74433 / desktop 24194-74815,
// 2026-07-27 update) — opened from the idle bar's "Check in" button and the
// idle pill. One empty "Status" SELECT over the four tech statuses (error
// "Choose Status"); confirming starts the session ("You're checked in").
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
  const statusPop = useSelectPopover(mobile);
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
        <Input label="Status">
          <SelectField
            value={status !== "" ? status : undefined}
            slotLeft={status !== "" ? <Icon icon={categoryIcon(status)} size={14} container="square" /> : undefined}
            isValid={!(showError && status === "")}
            errorMessage="Choose Status"
            open={statusPop.open}
            onClick={(e: ReactMouseEvent<HTMLDivElement>) => statusPop.toggle(e.currentTarget)}
          />
        </Input>
      </div>

      {/* Status picker — desktop inline card / mobile drawer (Figma 24353-26471 / -26484). */}
      <SelectPopoverList pop={statusPop} mobile={mobile} title="Status">
        <StatusItems
          current={status !== "" ? status : undefined}
          onPick={(s) => {
            setStatus(s);
            setShowError(false);
            statusPop.close();
          }}
        />
      </SelectPopoverList>
    </Dialog>
  );
};

// ---- shared shell state ----------------------------------------------------

// Owns the job lifecycle + scheduling + the two menus + all the job forms
// (Start / Cancel / Pause / Resume / Change status / Complete) and the time
// sessions (check-in/out + add/edit/delete). Both shells use it; only the
// anchored-menu mode (desktop card vs mobile drawer) and layout differ.
function useJobShell(isDesktop: boolean) {
  const menu = useAnchoredMenu(isDesktop); // top-bar ellipsis (Copy URL / …)
  const actionMenu = useAnchoredMenu(isDesktop); // action-bar ellipsis
  // This prototype has exactly two assignees — Lorne (the viewer) + Thiago.
  const [scheduling, setScheduling] = useState<Scheduling>(() => ({ ...defaultScheduling(), assignees: [1, 2] }));
  // The Service module's values — edited via ServiceForm; the Details panel's
  // Related module mirrors its "Recall to".
  const [serviceValues, setServiceValues] = useState<ServiceValues>(defaultServiceValues);
  // The job's equipment (ids into ServicePanel's pool) — lifted here so the
  // Service call form (Summary tab) reads the live Equipment-module list.
  const [equipmentIds, setEquipmentIds] = useState<number[]>(INITIAL_JOB_EQUIPMENT);
  const jobEquipment = EQUIPMENT_POOL.filter((e) => equipmentIds.includes(e.id));
  // The job's service location — lifted here because changing it also clears
  // the equipment (equipment belongs to a location); the Details panel clears
  // its own contacts + billing in the same confirm.
  const [location, setLocation] = useState<JobLocation>(DEFAULT_LOCATION);
  const changeLocation = (next: JobLocation) => {
    setLocation(next);
    setEquipmentIds([]);
  };
  // The location pool is state too — the New-location form appends to it.
  const [locations, setLocations] = useState<JobLocation[]>(LOCATIONS);
  const addLocation = (next: JobLocation) => setLocations((prev) => [...prev, next]);
  const [job, setJob] = useState<JobState>(defaultJob);
  const [startOpen, setStartOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  // Schedule flow: the "Schedule job" dialog (Figma 24222-20585 — the
  // Scheduling form with schedule copy), the plain "Unschedule job?" prompt
  // (unassigned job, Figma 24215-18742) and the assignees Unschedule dialog
  // (assigned job, Figma 24215-18740 / 24221-19652).
  const [scheduleOpen, setScheduleOpen] = useState(false);
  // "Reschedule job" (paused/on-hold menu) — the same form again (24226-20672).
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [unschedulePromptOpen, setUnschedulePromptOpen] = useState(false);
  const [unscheduleDialogOpen, setUnscheduleDialogOpen] = useState(false);
  // Lifecycle forms: Pause, Resume, Change active status, Change pause status,
  // and the "Time logged" (Complete) review.
  const [pauseOpen, setPauseOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [changeActiveOpen, setChangeActiveOpen] = useState(false);
  const [changePauseOpen, setChangePauseOpen] = useState(false);
  // Time-session form (add / edit) + which session it edits (none = add), and
  // the session queued for deletion (drives the confirm Prompt).
  const [sessionFormOpen, setSessionFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Session | undefined>();
  // Check-in state: a running session ticks `elapsed` once a second.
  const [checkedIn, setCheckedIn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  // Check-out flow: the confirm prompt (no Time review in this concept —
  // confirming logs the session directly).
  const [checkOutPromptOpen, setCheckOutPromptOpen] = useState(false);

  // The viewing tech (the logged-in user, "Lorne Riddle") — only their Timesheet
  // group gets the add-plus + row edit/delete, and the Complete review is theirs.
  const viewer = users.find((u) => u.id === 1) ?? users[0];

  const avatarStatus = displayStatus(job, scheduling);
  const caption = statusLabel(job, scheduling);
  const locked = job.status === "cancelled"; // cancelled → editing restricted
  // A tech can log time only while the job is actively being worked — NOT while
  // upcoming, unscheduled or cancelled (item 11).
  // Time tracking is SEPARATE from the job lifecycle (Daniel 2026-07-28,
  // Figma 24358-37516 / 24358-37529): the check in/out UI and the Timesheet
  // "+" show on every status EXCEPT Unscheduled and Cancelled (and Completed,
  // once that status exists in the prototype).
  const canTrackTime = job.status !== "unscheduled" && job.status !== "cancelled";
  const canAddSessions = canTrackTime;
  // The job's assignees — the Timesheet tab shows a group per assignee.
  const assigneeUsers = scheduling.assignees
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
  // Per-assignee sessions — only the viewer logs time in this prototype.
  const sessionsByUser: Record<number, Session[]> = { [viewer.id]: displaySessions };

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
  const startJob = (subStatus: string, reason: string, checkIn: boolean, status: string) => {
    const ts = formatStatusTimestamp(new Date());
    setJob({
      status: "active",
      subStatus: subStatus || undefined,
      statusMessage: reason || undefined,
      everStarted: true,
      startedAt: ts,
      activeAt: ts,
    });
    if (checkIn) beginSession(status || undefined);
  };
  const cancelJob = (reason: string) => {
    setCheckedIn(false);
    endActiveSession();
    setJob((j) => ({ ...j, status: "cancelled", statusMessage: reason, cancelledAt: formatStatusTimestamp(new Date()) }));
  };
  // Pause / hold: quick-pause or on-hold, with a sub-status + reason. Pausing
  // checks the user out (no time tracking while paused).
  const pauseJob = (type: string, subStatus: string, reason: string) => {
    setCheckedIn(false);
    endActiveSession();
    setJob((j) => ({
      ...j,
      status: type === "quick-pause" ? "quickPaused" : "onHold",
      subStatus: subStatus || undefined,
      statusMessage: reason || undefined,
      pausedAt: formatStatusTimestamp(new Date()),
    }));
  };
  // Resume back to active with a fresh sub-status (updates "Active on").
  // Like startJob (Figma 24096-19684): the form's "Check in" card decides
  // whether a session starts; the chosen status becomes its category.
  const doResume = (subStatus: string, reason: string, checkIn: boolean, status: string) => {
    setJob((j) => ({ ...j, status: "active", subStatus: subStatus || undefined, statusMessage: reason || undefined, activeAt: formatStatusTimestamp(new Date()) }));
    if (checkIn) beginSession(status || undefined);
  };
  // Change the active sub-status / status message (stays active).
  const doChangeActive = (subStatus: string, reason: string) =>
    setJob((j) => ({ ...j, subStatus: subStatus || undefined, statusMessage: reason || undefined }));
  // Change the pause Type / sub-status / reason (stays paused; keeps "Paused on").
  const doChangePause = (type: string, subStatus: string, reason: string) =>
    setJob((j) => ({ ...j, status: type === "quick-pause" ? "quickPaused" : "onHold", subStatus: subStatus || undefined, statusMessage: reason || undefined }));

  // Check-in — opens the Check in dialog (Figma 24194-74433); confirming
  // with a status starts the session.
  const [checkInOpen, setCheckInOpen] = useState(false);
  const checkIn = () => {
    actionMenu.close();
    setCheckInOpen(true);
  };
  const doCheckIn = (status: string) => {
    beginSession(status);
    toast({ type: "success", title: "You're checked in" });
  };
  // The running session's check-in status (drives the bar/pill identity).
  const activeCategory = sessions.find((sess) => sess.active)?.category;
  // Switching status (Figma 24192-73283): logs the running session and starts
  // a fresh one under the new status ("Your status updated" toast).
  const switchStatus = (status: string) => {
    if (status === activeCategory) return;
    endActiveSession();
    beginSession(status);
    toast({ type: "success", title: "Your status updated" });
  };

  // Ends the running session and logs it — no Time review in this concept.
  // The bar/pill fall back to their idle state (amber on an active job,
  // neutral otherwise).
  const doCheckOut = () => {
    setCheckedIn(false);
    endActiveSession();
    toast({ type: "success", title: "Time session saved" });
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
  const openAddSession = () => {
    setEditingSession(undefined);
    setSessionFormOpen(true);
  };
  const openEditSession = (session: Session) => {
    setEditingSession(session);
    setSessionFormOpen(true);
  };
  const confirmDeleteSession = () => {
    if (deleteTarget != null) setSessions((prev) => prev.filter((s) => s.id !== deleteTarget.id));
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
        ? prev.map((s) => (s.id === editingSession.id ? { ...s, ...fields } : s))
        : [...prev, { id: prev.reduce((mx, s) => Math.max(mx, s.id), 0) + 1, ...fields }],
    );
    // Figma toast 24105-15803 — same copy as check-out.
    toast({ type: "success", title: "Time session saved" });
  };

  // "Schedule job" dialog confirmed: apply the picked scheduling, the job
  // becomes Upcoming (the form itself shows toast 24049-13916).
  const confirmSchedule = (next: Scheduling) => {
    setScheduling(next);
    setJob({ status: "upcoming", everStarted: false });
  };
  // "Reschedule job" confirmed: new scheduling only — the job KEEPS its status
  // (the form shows toast 24226-20727, '"JOB-10001" rescheduled').
  const confirmReschedule = (next: Scheduling) => {
    setScheduling(next);
  };
  // Unschedule, shared tail: clears "Scheduled for" (date + time), optionally
  // the assignees too, and flips the job to Unscheduled.
  const applyUnschedule = (unassign: boolean) => {
    setScheduling((s) => ({ ...s, date: null, time: "", assignees: unassign ? [] : s.assignees }));
    setJob((j) => ({ ...j, status: "unscheduled", unscheduledAt: formatStatusTimestamp(new Date()) }));
    toast({
      type: "success",
      title: unassign ? `"${JOB_ID}" unscheduled and unassigned` : `"${JOB_ID}" unscheduled`,
    });
  };
  // "Unschedule job?" prompt confirmed (unassigned job — Figma toast 24106-16399).
  const confirmUnschedule = () => {
    setUnschedulePromptOpen(false);
    applyUnschedule(false);
  };

  const actions: JobActions = {
    onStart: () => {
      actionMenu.close();
      setStartOpen(true);
    },
    onSchedule: () => {
      actionMenu.close();
      setScheduleOpen(true);
    },
    onPause: () => {
      actionMenu.close();
      setPauseOpen(true);
    },
    onResume: () => {
      actionMenu.close();
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
    onReschedule: () => {
      actionMenu.close();
      setRescheduleOpen(true);
    },
    onUnschedule: () => {
      actionMenu.close();
      // Assigned job → the dialog (with the Unassign checkbox); unassigned →
      // the plain confirm prompt (Daniel's rule, item 5/6).
      if (scheduling.assignees.length > 0) setUnscheduleDialogOpen(true);
      else setUnschedulePromptOpen(true);
    },
    onCancel: () => {
      actionMenu.close();
      setCancelOpen(true);
    },
  };

  return {
    menu,
    actionMenu,
    scheduling,
    setScheduling,
    serviceValues,
    setServiceValues,
    equipmentIds,
    setEquipmentIds,
    jobEquipment,
    location,
    changeLocation,
    locations,
    addLocation,
    job,
    viewer,
    startOpen,
    setStartOpen,
    cancelOpen,
    setCancelOpen,
    scheduleOpen,
    setScheduleOpen,
    rescheduleOpen,
    setRescheduleOpen,
    confirmReschedule,
    unschedulePromptOpen,
    setUnschedulePromptOpen,
    unscheduleDialogOpen,
    setUnscheduleDialogOpen,
    confirmSchedule,
    confirmUnschedule,
    applyUnschedule,
    pauseOpen,
    setPauseOpen,
    resumeOpen,
    setResumeOpen,
    completeOpen,
    setCompleteOpen,
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
    checkInOpen,
    setCheckInOpen,
    doCheckIn,
    displaySessions,
    sessionsByUser,
    avatarStatus,
    caption,
    locked,
    assigneeUsers,
    canTrackTime,
    canAddSessions,
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
    <PauseJobForm open={s.pauseOpen} onClose={() => s.setPauseOpen(false)} onPause={s.pauseJob} mobile={mobile} />
    {/* Complete job — the 5-step flow (Equipment shares the live equipment list;
        the rest is a snapshot). Figma section 24106-16424. */}
    <CompleteJobForm
      open={s.completeOpen}
      onClose={() => s.setCompleteOpen(false)}
      equipmentIds={s.equipmentIds}
      onEquipmentIdsChange={s.setEquipmentIds}
      mobile={mobile}
    />
    {/* Schedule job dialog (Figma 24222-20585) — the Scheduling form with
        schedule copy; its own toast is the scheduled one (24049-13916). */}
    <SchedulingForm
      open={s.scheduleOpen}
      onClose={() => s.setScheduleOpen(false)}
      initial={s.scheduling}
      onSave={s.confirmSchedule}
      title="Schedule job"
      submitLabel="Schedule job"
      toastTitle={`"${JOB_ID}" scheduled`}
      mode="schedule"
      mobile={mobile}
    />
    {/* Reschedule job dialog (Figma 24226-20672) — same form, reschedule copy;
        the job keeps its current status. */}
    <SchedulingForm
      open={s.rescheduleOpen}
      onClose={() => s.setRescheduleOpen(false)}
      initial={s.scheduling}
      onSave={s.confirmReschedule}
      title="Reschedule job"
      submitLabel="Reschedule job"
      toastTitle={`"${JOB_ID}" rescheduled`}
      mode="schedule"
      mobile={mobile}
    />
    {/* Unschedule, UNASSIGNED job → plain confirm (Figma 24215-18742). */}
    <Prompt
      open={s.unschedulePromptOpen}
      title="Unschedule job?"
      body="Scheduled date and time will be cleared"
      actionLabel="Unschedule job"
      onAction={s.confirmUnschedule}
      onCancel={() => s.setUnschedulePromptOpen(false)}
      breakpoint={mobile ? "mobile" : "desktop"}
    />
    {/* Unschedule, ASSIGNED job → the dialog with the Unassign checkbox
        (Figma 24215-18740 / 24221-19652 / 24221-19892). */}
    <UnscheduleJobForm
      open={s.unscheduleDialogOpen}
      onClose={() => s.setUnscheduleDialogOpen(false)}
      assignees={s.scheduling.assignees}
      onUnschedule={s.applyUnschedule}
      mobile={mobile}
    />
    {/* Resume job (Figma 24096-19684): the Start-job form shape — sub-status,
        optional Resume reason, and the Check in card (no banner). */}
    <StartJobForm
      open={s.resumeOpen}
      onClose={() => s.setResumeOpen(false)}
      onStart={s.doResume}
      title="Resume job"
      submitLabel="Resume job"
      reasonLabel="Resume reason"
      toastTitle={`"${JOB_ID}" resumed`}
      mobile={mobile}
    />
    <SubStatusForm
      open={s.changeActiveOpen}
      onClose={() => s.setChangeActiveOpen(false)}
      title="Change active status"
      submitLabel="Change status"
      reasonLabel="Status message"
      toastTitle={`"${JOB_ID}" status changed`}
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
      initialReason={s.job.statusMessage ?? ""}
      onSubmit={s.doChangePause}
      mobile={mobile}
    />
    <SessionForm open={s.sessionFormOpen} onClose={() => s.setSessionFormOpen(false)} session={s.editingSession} onSave={s.saveSession} mobile={mobile} />
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
      actionIcon="trash"
      onAction={s.confirmDeleteSession}
      onCancel={() => s.setDeleteTarget(undefined)}
      breakpoint={mobile ? "mobile" : "desktop"}
    />
  </>
);

// ---- layouts --------------------------------------------------------------

const DesktopShell = () => {
  const s = useJobShell(true);
  // Desktop tabs switch the main content column; Details is the persistent
  // sidebar, so the tabs are Service / Timesheet / … (default Service).
  const [tab, setTab] = useState("service");
  return (
    <div className={styles.desktop}>
      <NavSidebar
        workspaces={[{ id: "1", name: "Workspace" }]}
        profileName="Lorne Riddle"
        profileEmail="email@address.com"
        profileMenu={profileMenu}
        onSearchClick={noop}
        bottomItems={bottomItems}
        createMenu={createMenu}
        breakpoint="desktop"
      >
        {navContent}
      </NavSidebar>
      <div className={styles.workArea}>
        <TopBar onActions={s.menu.onActions} actionsPressed={s.menu.open} avatarStatus={s.avatarStatus} tab={tab} onTabChange={setTab} />
        <div className={styles.contentRow}>
          <ScrollArea wrapperClassName={styles.mainArea} className={styles.mainAreaScroll}>
            {/* The main column is capped at 560px (Figma: never edge-to-edge) —
                the Service panel gets the same cap as the Placeholder. */}
            {tab === "service" ? (
              <div className={styles.mainContent}>
                <ServicePanel serviceValues={s.serviceValues} onServiceChange={s.setServiceValues} equipmentIds={s.equipmentIds} onEquipmentIdsChange={s.setEquipmentIds} />
              </div>
            ) : tab === "timesheet" ? (
              <div className={styles.mainContent}>
                <TimesheetPanel
                  assignees={s.assigneeUsers}
                  viewerId={s.viewer.id}
                  sessionsByUser={s.sessionsByUser}
                  onStopSession={s.actions.onCheckOut}
                  onSwitchStatus={s.switchStatus}
                  onEditSession={s.openEditSession}
                  onDeleteSession={s.setDeleteTarget}
                  onAddSession={s.openAddSession}
                  canAddSessions={s.canAddSessions}
                  started={false}
                />
              </div>
            ) : tab === "summary" ? (
              <div className={styles.mainContent}>
                <SummaryPanel jobEquipment={s.jobEquipment} />
              </div>
            ) : (
              <Placeholder className={styles.mainContent} />
            )}
          </ScrollArea>
          <Divider orientation="vertical" />
          <ScrollArea wrapperClassName={styles.sidebar} className={styles.sidebarScroll}>
            {/* Action bar + (while checked in) the active-session bar are PINNED
                together at the top of the sidebar — one block, like an extension of
                the action bar (Figma 24058-15415): buttons → divider → session bar →
                divider. A cancelled job hides the whole thing (editing restricted). */}
            {!s.locked && (
              <div className={styles.sidebarHeader}>
                <ActionBar placement="top">
                  <ActionButtons status={s.job.status} onMenu={s.actionMenu.onActions} menuPressed={s.actionMenu.open} actions={s.actions} />
                </ActionBar>
                {/* Time tracking is separate from the job lifecycle: the bar
                    shows on every status except Unscheduled / Cancelled, in
                    three states — running session, amber idle (active job) or
                    the neutral "Check in to track your time" idle. */}
                {s.canTrackTime && (
                  <>
                    <SessionBar
                      checkedIn={s.checkedIn}
                      jobActive={s.job.status === "active"}
                      elapsed={s.elapsed}
                      category={s.activeCategory}
                      onCheckIn={s.actions.onCheckIn}
                      onCheckOut={s.actions.onCheckOut}
                      onSwitchStatus={s.switchStatus}
                    />
                    <Divider />
                  </>
                )}
              </div>
            )}
            <DetailsPanel scheduling={s.scheduling} onSchedulingChange={s.setScheduling} job={s.job} locked={s.locked} recallTo={s.serviceValues.type === "recall" ? s.serviceValues.recallTo : null} location={s.location} onLocationChange={s.changeLocation} locations={s.locations} onAddLocation={s.addLocation} equipmentCount={s.jobEquipment.length} />
          </ScrollArea>
        </div>
      </div>
      {/* The top-bar context menu card: below the ellipsis, left-aligned, 4px gap. */}
      {s.menu.pos != null && (
        <div ref={s.menu.cardRef} className={styles.contextMenu} style={{ left: s.menu.pos.left, top: s.menu.pos.top }}>
          <Menu open={s.menu.open} onClose={s.menu.close} breakpoint="desktop">
            <JobContextMenuItems onClose={s.menu.close} />
          </Menu>
        </div>
      )}
      {/* The action-bar overflow menu card. */}
      {!s.locked && s.actionMenu.pos != null && (
        <div ref={s.actionMenu.cardRef} className={styles.contextMenu} style={{ left: s.actionMenu.pos.left, top: s.actionMenu.pos.top }}>
          <Menu open={s.actionMenu.open} onClose={s.actionMenu.close} breakpoint="desktop">
            {jobActionMenuItems({ status: s.job.status, actions: s.actions })}
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

const MobileShell = () => {
  const s = useJobShell(false);
  // The Details tab (the desktop right sidebar) is the only tab with real
  // content so far; the others keep the placeholder.
  const [tab, setTab] = useState("details");
  // The active pill opens the session drawer (mobile only).
  const [sessionDrawerOpen, setSessionDrawerOpen] = useState(false);
  return (
    <div className={styles.mobile}>
      <ScrollArea wrapperClassName={styles.mobileScroll} className={styles.mobileScrollInner}>
        <TopBar mobile hideOnScroll onActions={s.menu.onActions} actionsPressed={s.menu.open} tab={tab} onTabChange={setTab} avatarStatus={s.avatarStatus} />
        {/* Swipe-to-switch-tabs listens ONLY here (the tab content) — not on
            the NavTopBar or the ActionBar (Daniel, 2026-07-22). */}
        {/* Real-time swipe pager: drag the content to pull the next tab in. */}
        <SwipePager
          tab={tab}
          onTabChange={setTab}
          render={(t) =>
            t === "details" ? (

          <DetailsPanel mobile scheduling={s.scheduling} onSchedulingChange={s.setScheduling} job={s.job} locked={s.locked} recallTo={s.serviceValues.type === "recall" ? s.serviceValues.recallTo : null} location={s.location} onLocationChange={s.changeLocation} locations={s.locations} onAddLocation={s.addLocation} equipmentCount={s.jobEquipment.length} />
            ) : t === "service" ? (
              <ServicePanel mobile serviceValues={s.serviceValues} onServiceChange={s.setServiceValues} equipmentIds={s.equipmentIds} onEquipmentIdsChange={s.setEquipmentIds} />
            ) : t === "timesheet" ? (
          <TimesheetPanel
            assignees={s.assigneeUsers}
            viewerId={s.viewer.id}
            sessionsByUser={s.sessionsByUser}
            onStopSession={s.actions.onCheckOut}
            onSwitchStatus={s.switchStatus}
            onEditSession={s.openEditSession}
            onDeleteSession={s.setDeleteTarget}
            onAddSession={s.openAddSession}
            canAddSessions={s.canAddSessions}
            started={false}
            mobile
          />
            ) : t === "summary" ? (
              <SummaryPanel mobile jobEquipment={s.jobEquipment} />
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
      {!s.locked && (
        <ActionBar placement="bottom">
          <ActionButtons status={s.job.status} onMenu={s.actionMenu.onActions} menuPressed={s.actionMenu.open} actions={s.actions} />
        </ActionBar>
      )}
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
        open={s.menu.open}
        onClose={s.menu.close}
        header={<JobMenuHeader avatarStatus={s.avatarStatus} caption={s.caption} />}
        breakpoint="mobile"
      >
        <JobContextMenuItems onClose={s.menu.close} />
      </Menu>
      <Menu
        open={s.actionMenu.open}
        onClose={s.actionMenu.close}
        header={<JobMenuHeader avatarStatus={s.avatarStatus} caption={s.caption} />}
        breakpoint="mobile"
      >
        {jobActionMenuItems({ status: s.job.status, actions: s.actions })}
      </Menu>
      <StartJobForm open={s.startOpen} onClose={() => s.setStartOpen(false)} onStart={s.startJob} mobile />
      <CancelJobForm open={s.cancelOpen} onClose={() => s.setCancelOpen(false)} scheduling={s.scheduling} onCancel={s.cancelJob} mobile />
      <JobForms s={s} mobile />
      <Toaster breakpoint="mobile" />
    </div>
  );
};

export default function JobDetails({ breakpoint = "auto" }: JobDetailsProps) {
  const isDesktop = useIsDesktop(breakpoint);
  return isDesktop ? <DesktopShell /> : <MobileShell />;
}
