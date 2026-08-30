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
import PopoverHeaderContent from "../../components/Popover/PopoverHeaderContent";
import PopoverHeaderText from "../../components/Popover/PopoverHeaderText";
import Prompt from "../../components/Prompt/Prompt";
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
import TimesheetPanel, { formatHrMin, Session } from "./TimesheetPanel";
import { copyText, noop, slot, useAnchoredMenu } from "./shared";

import styles from "./JobDetails.module.scss";

// Job Details — prototype shell (slice 1). Desktop: SidebarNav + TopBarNav
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
  <TopBarNav
    variant="details"
    liveUsers={LIVE_USERS}
    tabs={<Tabs withDetails={mobile} value={tab} onChange={onTabChange} />}
    breakpoint={mobile ? "mobile" : "desktop"}
  >
    <TopBarNavLeftElements onBack={noop} onActions={onActions} actionsPressed={actionsPressed}>
      <TopBarNavTitle title={JOB_ID} slotLeft={<AvatarJob size="xl" status={avatarStatus} />} />
    </TopBarNavLeftElements>
  </TopBarNav>
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
          Schedule
        </Button>
      </>
    );
  }
  if (status === "active") {
    return (
      <>
        {ellipsis}
        <Button size="lg" variant="subtle" className={styles.grow} onClick={actions.onPause}>
          Pause
        </Button>
        <Button size="lg" variant="solid" className={styles.grow} onClick={actions.onComplete}>
          Complete
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
          Resume
        </Button>
      </>
    );
  }
  // upcoming / pastDue
  return (
    <>
      {ellipsis}
      <Button size="lg" variant="solid" className={styles.grow} onClick={actions.onStart}>
        Start
      </Button>
    </>
  );
};

// The action-bar overflow menu — items depend on the job's state.
const JobActionMenuItems = ({ status, checkedIn, elapsed, actions }: { status: JobStatus; checkedIn: boolean; elapsed: number; actions: JobActions }) => {
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
    // With a running session the first item becomes "Stop time session" (red,
    // with the live timer on the right — Figma 24058-15520); otherwise "Check in".
    const firstItem = checkedIn ? (
      <MenuItem
        label={<span className={styles.stopSession}>Stop time session</span>}
        slotLeft={<Icon icon="circle-stop" pack="solid" container="square" className={styles.stopSession} />}
        slotRight={<span className={styles.stopTimer}>{formatElapsed(elapsed)}</span>}
        onClick={actions.onCheckOut}
      />
    ) : (
      <MenuItem label="Start time session" slotLeft={slot("stopwatch")} onClick={actions.onCheckIn} />
    );
    return (
      <>
        <MenuItemGroup>{firstItem}</MenuItemGroup>
        <MenuItemGroup>
          <MenuItem label="Change active status" slotLeft={slot("pen")} onClick={actions.onChangeActive} />
          <MenuItem label="Pause" slotLeft={slot("circle-pause")} onClick={actions.onPause} />
        </MenuItemGroup>
        <MenuItemGroup>
          <MenuItem label="Reschedule" slotLeft={slot("calendar-lines-pen")} onClick={actions.onReschedule} />
          <MenuItem label="Complete" slotLeft={slot("circle-check")} onClick={actions.onComplete} />
        </MenuItemGroup>
      </>
    );
  }
  if (status === "quickPaused" || status === "onHold") {
    return (
      <>
        <MenuItemGroup>
          <MenuItem label="Change pause status" slotLeft={slot("pen")} onClick={actions.onChangePause} />
          <MenuItem label="Resume" slotLeft={slot("circle-play")} onClick={actions.onResume} />
        </MenuItemGroup>
        {cancel}
      </>
    );
  }
  // upcoming / pastDue
  return (
    <>
      <MenuItemGroup>
        <MenuItem label="Start job" slotLeft={slot("circle-play")} onClick={actions.onStart} />
        <MenuItem label="Unschedule" slotLeft={slot("calendar-xmark")} onClick={actions.onUnschedule} />
      </MenuItemGroup>
      {cancel}
    </>
  );
};

// The mobile overflow menu's drawer header: the job avatar + id + status caption.
// The avatar is AvatarJob (the same wrench-glyph identity as the TopBarNav title)
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
}

// elapsed seconds → "M:SS" / "MM:SS" / "H:MM:SS"
const formatElapsed = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};

// The check-in Timer Bar — the mobile SECOND bottom bar (above the action bar),
// shown only while checked in. Divider on top, running clock left, "Check out"
// right. (Prototype-local; no DS timer bar yet — flagged to Daniel.)
const TimerBar = ({ elapsed, onCheckOut, topDivider = true }: { elapsed: number; onCheckOut: () => void; topDivider?: boolean }) => (
  <div className={styles.timerBar}>
    {topDivider && <Divider />}
    <div className={styles.timerRow}>
      <div className={styles.timerInfo}>
        <span className={styles.timerAvatar}>
          <Icon icon="circle-small" pack="solid" size={16} />
        </span>
        <span className={styles.timerText}>
          <span className={styles.timerClock}>{formatElapsed(elapsed)}</span>
          <span className={styles.timerLabel}>Active session</span>
        </span>
      </div>
      <Button size="lg" variant="ghost" leftIcon="circle-stop" leftIconPack="solid" leftIconClassName={styles.stopIcon} onClick={onCheckOut}>
        Stop
      </Button>
    </div>
  </div>
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

  // Called by the Start/Cancel dialogs on submit. The "…on" timestamps are the
  // real moment of the click.
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
  const doResume = (subStatus: string, reason: string) =>
    setJob((j) => ({ ...j, status: "active", subStatus: subStatus || undefined, statusMessage: reason || undefined, activeAt: formatStatusTimestamp(new Date()) }));
  // Change the active sub-status / status message (stays active).
  const doChangeActive = (subStatus: string, reason: string) =>
    setJob((j) => ({ ...j, subStatus: subStatus || undefined, statusMessage: reason || undefined }));
  // Change the pause Type / sub-status / reason (stays paused; keeps "Paused on").
  const doChangePause = (type: string, subStatus: string, reason: string) =>
    setJob((j) => ({ ...j, status: type === "quick-pause" ? "quickPaused" : "onHold", subStatus: subStatus || undefined, statusMessage: reason || undefined }));

  // Check-in / check-out — a running time session (viewer's).
  const checkIn = () => {
    actionMenu.close();
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
    toast({ type: "success", title: "Time is logging" });
  };
  const checkOut = () => {
    actionMenu.close();
    setCheckedIn(false);
    endActiveSession();
    toast({ type: "success", title: "Time session logged" });
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
      submitLabel="Resume"
      reasonLabel="Resume reason"
      toastTitle={`"${JOB_ID}" resumed`}
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
      <SidebarNav
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
      </SidebarNav>
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
                {s.checkedIn && (
                  <>
                    <TimerBar elapsed={s.elapsed} onCheckOut={s.actions.onCheckOut} topDivider={false} />
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
            <JobActionMenuItems status={s.job.status} checkedIn={s.checkedIn} elapsed={s.elapsed} actions={s.actions} />
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
      {/* Second bar (check-in timer) sits above the action bar, only while checked in. */}
      {!s.locked && s.checkedIn && <TimerBar elapsed={s.elapsed} onCheckOut={s.actions.onCheckOut} />}
      {!s.locked && (
        <ActionBar placement="bottom">
          <ActionButtons status={s.job.status} onMenu={s.actionMenu.onActions} menuPressed={s.actionMenu.open} actions={s.actions} />
        </ActionBar>
      )}
      <Menu
        open={s.menu.open}
        onClose={s.menu.close}
        drawerHeader={<JobMenuHeader avatarStatus={s.avatarStatus} caption={s.caption} />}
        breakpoint="mobile"
      >
        <JobContextMenuItems onClose={s.menu.close} />
      </Menu>
      <Menu
        open={s.actionMenu.open}
        onClose={s.actionMenu.close}
        drawerHeader={<JobMenuHeader avatarStatus={s.avatarStatus} caption={s.caption} />}
        breakpoint="mobile"
      >
        <JobActionMenuItems status={s.job.status} checkedIn={s.checkedIn} elapsed={s.elapsed} actions={s.actions} />
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
