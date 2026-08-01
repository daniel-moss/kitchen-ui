import { MouseEvent as ReactMouseEvent, useEffect, useState } from "react";

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
import Prompt from "../../components/Prompt/Prompt";
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
import DetailsPanel from "./DetailsPanel";
import { JOB_ID } from "./jobData";
import { defaultJob, displayStatus, formatStatusTimestamp, JobState, JobStatus, statusLabel } from "./jobState";
import PauseJobForm from "./PauseJobForm";
import { defaultScheduling, Scheduling } from "./SchedulingForm";
import ServicePanel from "./ServicePanel";
import SummaryPanel from "./SummaryPanel";
import SessionForm, { Meridiem, SessionDraft } from "./SessionForm";
import StartJobForm from "./StartJobForm";
import SubStatusForm from "./SubStatusForm";
import TimeReviewForm, { TimeReviewResult } from "./TimeReviewForm";
import TimesheetPanel, { ceil15Min, fmtClockMin, formatHrMin, parseClockMin, Session } from "./TimesheetPanel";
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
          <MenuItem label="Schedule" slotLeft={slot("calendar-check")} onClick={actions.onSchedule} />
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
  active: boolean;
  endLabel?: string;
  endDateLabel?: string;
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

// The DESKTOP session bar (Figma 24178-58242 active / 24178-58685 idle) —
// pinned under the action bar whenever the job is ACTIVE. With a running
// session: solid-tomato stopwatch avatar (pulsing), red elapsed + "Tracked",
// ghost "Check out" (arrow-left-from-arc). Without: amber warning avatar,
// "00:00" placeholder + amber "You're not tracking time", ghost "Check in"
// (arrow-right-from-arc).
const SessionBar = ({
  checkedIn,
  elapsed,
  onCheckIn,
  onCheckOut,
}: {
  checkedIn: boolean;
  elapsed: number;
  onCheckIn: () => void;
  onCheckOut: () => void;
}) => (
  <div className={styles.timerBar}>
    <div className={styles.timerRow}>
      <div className={styles.timerInfo}>
        <span className={clsx(styles.timerAvatar, !checkedIn && styles.timerAvatarIdle)}>
          <Icon icon={checkedIn ? "stopwatch" : "warning"} pack="solid" size={16} />
        </span>
        <span className={styles.timerText}>
          <span className={clsx(styles.timerClock, !checkedIn && styles.timerClockIdle)}>
            {checkedIn ? formatElapsed(elapsed) : "00:00"}
          </span>
          <span className={clsx(styles.timerLabel, !checkedIn && styles.timerLabelIdle)}>
            {checkedIn ? "Tracking your time" : "Not tracking your time"}
          </span>
        </span>
      </div>
      <Button
        size="lg"
        variant="ghost"
        leftIcon={checkedIn ? "arrow-left-from-arc" : "arrow-right-to-arc"}
        onClick={checkedIn ? onCheckOut : onCheckIn}
      >
        {checkedIn ? "Check out" : "Check in"}
      </Button>
    </div>
  </div>
);

// The MOBILE session pill (Figma 24178-58264 active / 24181-59172 idle) —
// floats 12px above the action bar, left-aligned, only while the job is
// ACTIVE. Running session: tomato pill with the live time (tap → the session
// drawer). No session: amber warning "Check in" pill (tap starts a session).
const SessionPill = ({ checkedIn, elapsed, onClick }: { checkedIn: boolean; elapsed: number; onClick: () => void }) => (
  <button
    type="button"
    className={clsx(styles.pill, checkedIn ? styles.pillActive : styles.pillIdle)}
    aria-label={checkedIn ? "Active time session" : "Check in"}
    onClick={onClick}
  >
    <Icon icon={checkedIn ? "stopwatch" : "warning"} pack="solid" />
    <span className={clsx(styles.pillLabel, checkedIn && styles.pillTime)}>
      {checkedIn ? formatElapsed(elapsed) : "Check in"}
    </span>
  </button>
);

// The MOBILE session drawer (Figma 24178-58902) — opened by tapping the active
// pill. Drag-handle header, centered "Tracking your time" + big red timer in
// the body; the full-width subtle "Check out" button sits in a PopoverFooter
// and triggers the check-out prompt.
const SessionDrawer = ({
  open,
  elapsed,
  onClose,
  onCheckOut,
}: {
  open: boolean;
  elapsed: number;
  onClose: () => void;
  onCheckOut: () => void;
}) => (
  <Popover
    drawer
    open={open}
    onClose={onClose}
    header={<DrawerHeader variant="dragHandle" />}
    footer={
      <PopoverFooter stretch>
        <Button size="lg" variant="subtle" isFullWidth leftIcon="arrow-left-from-arc" onClick={onCheckOut}>
          Check out
        </Button>
      </PopoverFooter>
    }
  >
    <div className={styles.sessionDrawerBody}>
      <div className={styles.sessionDrawerValue}>
        <span className={styles.sessionDrawerCaption}>Tracking your time</span>
        <span className={styles.sessionDrawerClock}>{formatElapsedFull(elapsed)}</span>
      </div>
    </div>
  </Popover>
);

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
  const [job, setJob] = useState<JobState>(defaultJob);
  const [startOpen, setStartOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  // Lifecycle forms: Pause, Resume, Change active status, Change pause status,
  // and the "Time logged" (Complete) review.
  const [pauseOpen, setPauseOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [changeActiveOpen, setChangeActiveOpen] = useState(false);
  const [changePauseOpen, setChangePauseOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  // Time-session form (add / edit) + which session it edits (none = add), and
  // the session queued for deletion (drives the confirm Prompt).
  const [sessionFormOpen, setSessionFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Session | undefined>();
  // Check-in state: a running session ticks `elapsed` once a second.
  const [checkedIn, setCheckedIn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  // Check-out flow: the confirm prompt, then the "Time review" form over the
  // just-ended session (its 15-min-rounded start/end + identity).
  const [checkOutPromptOpen, setCheckOutPromptOpen] = useState(false);
  const [review, setReview] = useState<{ sessionId: number; startMin: number; endMin: number; month: string; day: string } | null>(null);

  // The viewing tech (the logged-in user, "Lorne Riddle") — only their Timesheet
  // group gets the add-plus + row edit/delete, and the Complete review is theirs.
  const viewer = users.find((u) => u.id === 1) ?? users[0];

  const avatarStatus = displayStatus(job, scheduling);
  const caption = statusLabel(job, scheduling);
  const locked = job.status === "cancelled"; // cancelled → editing restricted
  // A tech can log time only while the job is actively being worked — NOT while
  // upcoming, unscheduled or cancelled (item 11).
  const canAddSessions = job.status === "active" || job.status === "quickPaused" || job.status === "onHold";
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
      prev.map((s) => (s.active ? { ...s, active: false, endLabel: TIME_FMT.format(now), endDateLabel: FULL_DATE_FMT.format(now), durationSec: dur } : s)),
    );
  };

  // Starts a fresh time session (no toast — callers decide the feedback).
  const beginSession = () => {
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
        active: true,
        durationSec: 0,
      },
    ]);
  };

  // Called by the Start/Cancel dialogs on submit. The "…on" timestamps are the
  // real moment of the click. Starting the job also starts a time session
  // automatically (silent — the start flow has its own feedback).
  const startJob = (subStatus: string, reason: string) => {
    const ts = formatStatusTimestamp(new Date());
    setJob({
      status: "active",
      subStatus: subStatus || undefined,
      statusMessage: reason || undefined,
      everStarted: true,
      startedAt: ts,
      activeAt: ts,
    });
    beginSession();
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
  // Resuming also starts a time session (the dialog's banner promises it),
  // silent like startJob.
  const doResume = (subStatus: string, reason: string) => {
    setJob((j) => ({ ...j, status: "active", subStatus: subStatus || undefined, statusMessage: reason || undefined, activeAt: formatStatusTimestamp(new Date()) }));
    beginSession();
  };
  // Change the active sub-status / status message (stays active).
  const doChangeActive = (subStatus: string, reason: string) =>
    setJob((j) => ({ ...j, subStatus: subStatus || undefined, statusMessage: reason || undefined }));
  // Change the pause Type / sub-status / reason (stays paused; keeps "Paused on").
  const doChangePause = (type: string, subStatus: string, reason: string) =>
    setJob((j) => ({ ...j, status: type === "quick-pause" ? "quickPaused" : "onHold", subStatus: subStatus || undefined, statusMessage: reason || undefined }));

  // Check-in / check-out — a running time session (viewer's).
  const checkIn = () => {
    actionMenu.close();
    beginSession();
    toast({ type: "success", title: "Time is logging" });
  };
  // "Check out" (bar / pill drawer / Timesheet row) opens the confirm prompt
  // first (Figma 24184-59897); the session keeps running until it's confirmed.
  const checkOut = () => {
    actionMenu.close();
    setCheckOutPromptOpen(true);
  };
  // Prompt confirmed: stop the session and open the "Time review" form over
  // its 15-min-rounded range (11:28 -> 11:30, 2:56 -> 3:00 — always up, like
  // the Timesheet rounding).
  const confirmCheckOut = () => {
    const active = sessions.find((sess) => sess.active);
    setCheckOutPromptOpen(false);
    setCheckedIn(false);
    endActiveSession();
    if (active == null) return;
    const now = new Date();
    const startRaw = parseClockMin(active.startLabel) ?? 0;
    const startMin = ceil15Min(startRaw);
    const endMin = Math.max(startMin, ceil15Min(now.getHours() * 60 + now.getMinutes()));
    setReview({ sessionId: active.id, startMin, endMin, month: active.month, day: active.day });
  };
  // "Save" in the Time review: replace the single logged session with the
  // Travelling / Working split (zero-length sides are dropped; an untouched
  // knob keeps one uncategorized session with the rounded range).
  const saveTimeReview = ({ startMin, endMin, travelMin }: TimeReviewResult) => {
    setSessions((prev) =>
      prev.flatMap((sess) => {
        if (review == null || sess.id !== review.sessionId) return [sess];
        const totalMin = (((endMin - startMin) % 1440) + 1440) % 1440;
        // The split rows carry same-day clock times — pin the end date to the
        // start date so the cross-day warning can never fire on them.
        const base = { ...sess, active: false, endDateLabel: sess.dateLabel };
        if (travelMin == null) {
          return [{ ...base, startLabel: fmtClockMin(startMin), endLabel: fmtClockMin(endMin), durationSec: totalMin * 60 }];
        }
        const splitMin = (startMin + travelMin) % 1440;
        const parts: StoredSession[] = [];
        if (travelMin > 0)
          parts.push({ ...base, startLabel: fmtClockMin(startMin), endLabel: fmtClockMin(splitMin), durationSec: travelMin * 60, category: "Travelling" });
        if (totalMin - travelMin > 0)
          parts.push({
            ...base,
            id: travelMin > 0 ? prev.reduce((mx, x) => Math.max(mx, x.id), 0) + 1 : base.id,
            startLabel: fmtClockMin(splitMin),
            endLabel: fmtClockMin(endMin),
            durationSec: (totalMin - travelMin) * 60,
            category: "Working",
          });
        return parts;
      }),
    );
    setReview(null);
    toast({ type: "success", title: "Time session logged" });
  };
  // "Don't save my time": the tracked session is discarded entirely.
  const discardTimeReview = () => {
    if (review != null) setSessions((prev) => prev.filter((sess) => sess.id !== review.sessionId));
    setReview(null);
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
      startLabel: clockToLabel(draft.startClock, draft.startMeridiem),
      month: MONTH_FMT.format(draft.startDate).toUpperCase(),
      day: String(draft.startDate.getDate()),
      dateLabel: FULL_DATE_FMT.format(draft.startDate),
      active: false,
      endLabel: clockToLabel(draft.endClock, draft.endMeridiem),
      endDateLabel: FULL_DATE_FMT.format(draft.endDate),
      durationSec: Math.max(0, Math.round((endDt.getTime() - startDt.getTime()) / 1000)),
    };
    setSessions((prev) =>
      editingSession != null
        ? prev.map((s) => (s.id === editingSession.id ? { ...s, ...fields } : s))
        : [...prev, { id: prev.reduce((mx, s) => Math.max(mx, s.id), 0) + 1, ...fields }],
    );
    toast({ type: "success", title: "Time session logged" });
  };

  const actions: JobActions = {
    onStart: () => {
      actionMenu.close();
      setStartOpen(true);
    },
    onSchedule: () => {
      actionMenu.close();
      setJob({ status: "upcoming", everStarted: false });
      toast({ type: "success", title: `"${JOB_ID}" scheduled` });
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
    onComplete: () => {
      actionMenu.close();
      setCompleteOpen(true);
    },
    onCheckIn: checkIn,
    onCheckOut: checkOut,
    onReschedule: () => {
      actionMenu.close();
      toast({ type: "success", title: `"${JOB_ID}" rescheduled` });
    },
    onUnschedule: () => {
      actionMenu.close();
      setJob((j) => ({ ...j, status: "unscheduled", unscheduledAt: formatStatusTimestamp(new Date()) }));
      toast({ type: "success", title: `"${JOB_ID}" unscheduled` });
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
    job,
    viewer,
    startOpen,
    setStartOpen,
    cancelOpen,
    setCancelOpen,
    pauseOpen,
    setPauseOpen,
    resumeOpen,
    setResumeOpen,
    changeActiveOpen,
    setChangeActiveOpen,
    changePauseOpen,
    setChangePauseOpen,
    completeOpen,
    setCompleteOpen,
    sessionFormOpen,
    setSessionFormOpen,
    editingSession,
    deleteTarget,
    setDeleteTarget,
    checkedIn,
    elapsed,
    checkOutPromptOpen,
    setCheckOutPromptOpen,
    confirmCheckOut,
    review,
    setReview,
    saveTimeReview,
    discardTimeReview,
    displaySessions,
    sessionsByUser,
    avatarStatus,
    caption,
    locked,
    assigneeUsers,
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
    <SubStatusForm
      open={s.resumeOpen}
      onClose={() => s.setResumeOpen(false)}
      title="Resume job"
      submitLabel="Resume job"
      reasonLabel="Resume reason"
      toastTitle={`"${JOB_ID}" resumed`}
      banner="Resuming a job starts tracking your time. You can always pause a job, if you need to."
      onSubmit={s.doResume}
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
    <CompleteJobForm
      open={s.completeOpen}
      onClose={() => s.setCompleteOpen(false)}
      viewer={s.viewer}
      sessions={s.displaySessions}
      onStopSession={s.actions.onCheckOut}
      onEditSession={s.openEditSession}
      onDeleteSession={s.setDeleteTarget}
      onAddSession={s.openAddSession}
      mobile={mobile}
    />
    <SessionForm open={s.sessionFormOpen} onClose={() => s.setSessionFormOpen(false)} session={s.editingSession} onSave={s.saveSession} mobile={mobile} />
    {/* Check-out confirm (Figma 24184-59897) — the danger action stops the
        session and opens the Time review form. Same copy on both breakpoints
        (Daniel; the mobile node drops "still" — intentional single copy). */}
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
    {/* "Time review" (Figma 24184-61522 / 62305): distribute the tracked time
        between Travelling and Working. Dismissing keeps the single session. */}
    {s.review != null && (
      <TimeReviewForm
        open
        onClose={() => s.setReview(null)}
        startMin={s.review.startMin}
        endMin={s.review.endMin}
        month={s.review.month}
        day={s.review.day}
        onSave={s.saveTimeReview}
        onDiscard={s.discardTimeReview}
        mobile={mobile}
      />
    )}
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
                <ServicePanel />
              </div>
            ) : tab === "timesheet" ? (
              <div className={styles.mainContent}>
                <TimesheetPanel
                  assignees={s.assigneeUsers}
                  viewerId={s.viewer.id}
                  sessionsByUser={s.sessionsByUser}
                  onStopSession={s.actions.onCheckOut}
                  onEditSession={s.openEditSession}
                  onDeleteSession={s.setDeleteTarget}
                  onAddSession={s.openAddSession}
                  canAddSessions={s.canAddSessions}
                  started={false}
                />
              </div>
            ) : tab === "summary" ? (
              <div className={styles.mainContent}>
                <SummaryPanel />
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
                {/* The session bar shows on ACTIVE status only (Daniel's rule) —
                    in both its states: running session or "Check in". */}
                {s.job.status === "active" && (
                  <>
                    <SessionBar checkedIn={s.checkedIn} elapsed={s.elapsed} onCheckIn={s.actions.onCheckIn} onCheckOut={s.actions.onCheckOut} />
                    <Divider />
                  </>
                )}
              </div>
            )}
            <DetailsPanel scheduling={s.scheduling} onSchedulingChange={s.setScheduling} job={s.job} locked={s.locked} />
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
        {tab === "details" ? (
          <DetailsPanel mobile scheduling={s.scheduling} onSchedulingChange={s.setScheduling} job={s.job} locked={s.locked} />
        ) : tab === "service" ? (
          <ServicePanel mobile />
        ) : tab === "timesheet" ? (
          <TimesheetPanel
            assignees={s.assigneeUsers}
            viewerId={s.viewer.id}
            sessionsByUser={s.sessionsByUser}
            onStopSession={s.actions.onCheckOut}
            onEditSession={s.openEditSession}
            onDeleteSession={s.setDeleteTarget}
            onAddSession={s.openAddSession}
            canAddSessions={s.canAddSessions}
            started={false}
            mobile
          />
        ) : tab === "summary" ? (
          <SummaryPanel mobile />
        ) : (
          <Placeholder className={styles.mobileContent} />
        )}
      </ScrollArea>
      {/* The session pill floats 12px above the action bar, on ACTIVE status
          only (Daniel's rule). Running session: tap opens the session drawer;
          otherwise: tap checks in. A zero-height anchor keeps it glued to the
          action bar's top edge regardless of the safe-area inset. */}
      {s.job.status === "active" && (
        <div className={styles.pillAnchor}>
          <SessionPill
            checkedIn={s.checkedIn}
            elapsed={s.elapsed}
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
