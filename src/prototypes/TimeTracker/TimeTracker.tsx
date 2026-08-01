import { ReactNode, useEffect, useState } from "react";

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
import NavTopBar from "../../components/NavTopBar/NavTopBar";
import NavTopBarLeftElements from "../../components/NavTopBar/NavTopBarLeftElements";
import NavTopBarTitle from "../../components/NavTopBar/NavTopBarTitle";
import Prompt from "../../components/Prompt/Prompt";
import ScrollArea from "../../components/ScrollArea/ScrollArea";
import TabGroup from "../../components/Tabs/TabGroup";
import TabItem from "../../components/Tabs/TabItem";
import Toaster, { toast } from "../../components/Toast/Toaster";
import { users } from "../../data/users";
import ActionBar from "../TimeTrackerConcept6/ActionBar";
import DetailsPanel from "../TimeTrackerConcept6/DetailsPanel";
import ServicePanel from "../TimeTrackerConcept6/ServicePanel";
import StartJobForm from "../TimeTrackerConcept6/StartJobForm";
import TimesheetPanel, { formatHrMin, Session } from "../TimeTrackerConcept6/TimesheetPanel";
import { defaultScheduling } from "../TimeTrackerConcept6/SchedulingForm";
import { displayStatus, formatStatusTimestamp, JobState, statusLabel } from "../TimeTrackerConcept6/jobState";
import { JOB_ID } from "../TimeTrackerConcept6/jobData";
import { noop, slot } from "../TimeTrackerConcept6/shared";
import ChangePauseStatusForm from "../TimeTrackerConcept6/ChangePauseStatusForm";
import CompleteJobForm from "../TimeTrackerConcept6/CompleteJobForm";
import PauseJobForm from "../TimeTrackerConcept6/PauseJobForm";
import SessionForm, { Meridiem, SessionDraft } from "../TimeTrackerConcept6/SessionForm";
import SubStatusForm from "../TimeTrackerConcept6/SubStatusForm";

import styles from "./TimeTracker.module.scss";

// ---- config ----------------------------------------------------------------

export interface TimeTrackerConfig {
  /** Does this prototype have the check-in / check-out feature? */
  hasCheckIn: boolean;
  /** The state the prototype opens in. "active" = the job is already started
   *  (e.g. by another assignee, prototype ③). */
  initialStatus: "upcoming" | "active";
  /** Whose perspective this is — the viewing technician. Their group gets the
   *  check-in sessions + the add plus, and the Complete review is theirs. */
  viewerId: number;
}

// upcoming / active / quick-paused / on-hold — a subset of the shared JobStatus.
type TTStatus = "upcoming" | "active" | "quickPaused" | "onHold";

// Two live collaborators in the top bar (demo photos).
const LIVE_USERS: AvatarGroupItem[] = [users[0], users[1]].map((u) => ({
  kind: "live",
  content: "image",
  imageSrc: u.avatar,
  name: u.name,
}));

// Demo timestamp for a job that opens already-started (prototype ③) — Lorne
// scheduled + started it on Jul 17.
const STARTED_TS = "Jul 17 at 8:00 AM";

// Demo: the first assignee (Lorne) already logged time on Jul 17 (prototype ③,
// seen from the second assignee's perspective). Total = 6 hr.
const LORNE_PRELOGGED: Session[] = [
  { id: 901, startLabel: "8:00 AM", month: "JUL", day: "17", dateLabel: "July 17, 2026", active: false, endLabel: "10:30 AM", endDateLabel: "July 17, 2026", durationSec: 9000, timerLabel: "2 hr 30 min" },
  { id: 902, startLabel: "11:00 AM", month: "JUL", day: "17", dateLabel: "July 17, 2026", active: false, endLabel: "1:00 PM", endDateLabel: "July 17, 2026", durationSec: 7200, timerLabel: "2 hr" },
  { id: 903, startLabel: "2:00 PM", month: "JUL", day: "17", dateLabel: "July 17, 2026", active: false, endLabel: "3:30 PM", endDateLabel: "July 17, 2026", durationSec: 5400, timerLabel: "1 hr 30 min" },
];

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

// A session as stored in state (live values are derived at render from `elapsed`).
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

// ---- small pieces ----------------------------------------------------------

const Tabs = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <TabGroup value={value} onChange={onChange}>
    <TabItem value="details">Details</TabItem>
    <TabItem value="service">Service</TabItem>
    <TabItem value="timesheet">Timesheet</TabItem>
    <TabItem value="summary">Summary</TabItem>
    <TabItem value="activity">Activity</TabItem>
  </TabGroup>
);

// The mobile menu drawer header: job avatar + id + status caption.
const MenuHeader = ({ avatarStatus, caption }: { avatarStatus: BadgeJobStatusStatus; caption: string }) => (
  <DrawerHeader>
    <PopoverHeaderContent avatar={<AvatarJob size="xl" status={avatarStatus} />}>
      <PopoverHeaderText variant="titleCaption" title={JOB_ID} caption={caption} />
    </PopoverHeaderContent>
  </DrawerHeader>
);

// The top-bar ellipsis menu (next to the title) — generic job actions (stubs).
const TopMenuItems = ({ onClose }: { onClose: () => void }) => {
  const stub = (title: string) => () => {
    onClose();
    toast({ type: "success", title });
  };
  return (
    <MenuItemGroup>
      <MenuItem label="Copy URL" slotLeft={slot("link")} onClick={stub("Job URL copied")} />
      <MenuItem label="Download PDF" slotLeft={slot("download")} onClick={stub("PDF downloaded")} />
      <MenuItem label="Send job summary" slotLeft={slot("paper-plane")} onClick={onClose} />
    </MenuItemGroup>
  );
};

// The check-in Timer Bar — the SECOND bottom bar (prototype-local; no DS timer
// bar yet). Divider on top, running clock left, "Check out" right.
const TimerBar = ({ elapsed, onCheckOut }: { elapsed: number; onCheckOut: () => void }) => (
  <div className={styles.timerBar}>
    <Divider />
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
      <Button size="lg" variant="ghost" leftIcon="arrow-left-to-bracket" onClick={onCheckOut}>
        Check out
      </Button>
    </div>
  </div>
);

// ---- the prototype ---------------------------------------------------------

export default function TimeTracker({ config }: { config: TimeTrackerConfig }) {
  const [status, setStatus] = useState<TTStatus>(config.initialStatus);
  const [subStatus, setSubStatus] = useState<string | undefined>();
  const [checkedIn, setCheckedIn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [tab, setTab] = useState("details");
  const [topMenuOpen, setTopMenuOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  // Status-change forms: Resume, Change active status, Change pause status.
  const [resumeOpen, setResumeOpen] = useState(false);
  const [changeActiveOpen, setChangeActiveOpen] = useState(false);
  const [changePauseOpen, setChangePauseOpen] = useState(false);
  // The "Time logged" (Complete) review form.
  const [completeOpen, setCompleteOpen] = useState(false);
  // The "Time session" form (add / edit) + which session it is editing (none = add).
  const [sessionFormOpen, setSessionFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | undefined>();
  // The session queued for deletion (drives the confirm Prompt).
  const [deleteTarget, setDeleteTarget] = useState<Session | undefined>();
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  // Timestamps: startedAt = FIRST start (set once); activeAt = LAST activation
  // (start OR resume); pausedAt = when quick-paused / put on hold. A job that
  // opens already-started (prototype ③) seeds started/active with a demo value.
  const startedAlready = config.initialStatus === "active";
  const [startedAt, setStartedAt] = useState<string | undefined>(startedAlready ? STARTED_TS : undefined);
  const [activeAt, setActiveAt] = useState<string | undefined>(startedAlready ? STARTED_TS : undefined);
  const [pausedAt, setPausedAt] = useState<string | undefined>();
  // Logged time sessions (check-in → check-out) for the viewing tech.
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  // Time Tracker jobs always have exactly two assignees: Lorne + Thiago. An
  // already-started job (③) was scheduled + started on Jul 17.
  const [scheduling, setScheduling] = useState(() => {
    const base = { ...defaultScheduling(), assignees: [users[0].id, users[1].id] };
    return config.initialStatus === "active" ? { ...base, date: new Date(2026, 6, 17), time: "8:00 AM" } : base;
  });
  // The viewing technician (whose perspective this prototype is) — ① / ② = Lorne,
  // ③ = Thiago. Their group holds the check-in sessions + the add plus.
  const viewer = users.find((u) => u.id === config.viewerId) ?? users[0];

  // Tick the check-in clock once a second while checked in.
  useEffect(() => {
    if (!checkedIn) return;
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(t);
  }, [checkedIn]);

  const assigneeUsers = scheduling.assignees
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is (typeof users)[number] => u != null);

  // TTStatus is a subset of JobStatus, so it maps straight onto the JobState the
  // reused DetailsPanel + shared status helpers expect.
  const panelJob: JobState = {
    status,
    subStatus,
    statusMessage,
    everStarted: status !== "upcoming",
    startedAt,
    activeAt,
    pausedAt,
  };
  const avatarStatus = displayStatus(panelJob, scheduling);
  const caption = statusLabel(panelJob, scheduling);

  // Sessions with live values: the active one's timer / duration come from `elapsed`.
  const displaySessions: Session[] = sessions.map((s) => {
    const durationSec = s.active ? elapsed : s.durationSec;
    return { ...s, durationSec, timerLabel: s.active ? formatElapsed(elapsed) : formatHrMin(durationSec) };
  });

  // Sessions per assignee: the viewer's live ones, plus (prototype ③) the first
  // assignee's pre-logged time so the Timesheet shows Lorne already worked.
  const sessionsByUser: Record<number, Session[]> = { [viewer.id]: displaySessions };
  if (startedAlready && users[0].id !== viewer.id) sessionsByUser[users[0].id] = LORNE_PRELOGGED;

  const closeActionMenu = () => setActionMenuOpen(false);
  const stub = (title: string) => () => {
    closeActionMenu();
    toast({ type: "success", title });
  };

  // Ends the running session (check-out / pause): stamp its end time + duration.
  const endActiveSession = () => {
    const now = new Date();
    const dur = elapsed;
    setSessions((prev) =>
      prev.map((s) => (s.active ? { ...s, active: false, endLabel: TIME_FMT.format(now), endDateLabel: FULL_DATE_FMT.format(now), durationSec: dur } : s)),
    );
  };

  // Core transitions (Start / Pause / Resume / Check in / Check out are real;
  // everything else is a display-only stub for now).
  const startJob = (ss: string, reason: string) => {
    const ts = formatStatusTimestamp(new Date());
    setStatus("active");
    setSubStatus(ss || undefined);
    setStatusMessage(reason || undefined);
    setStartedAt((prev) => prev ?? ts); // "Started on" = first start only
    setActiveAt(ts); // "Active on" updates on every activation
  };
  const pauseJob = (type: string, ss: string, reason: string) => {
    setStatus(type === "quick-pause" ? "quickPaused" : "onHold");
    setSubStatus(ss || undefined);
    setStatusMessage(reason || undefined);
    setPausedAt(formatStatusTimestamp(new Date()));
    setCheckedIn(false); // pausing checks the user out (no time tracking while paused)
    endActiveSession();
  };
  // Resume / Change active status / Change pause status all open a form; the
  // commit happens in the form's submit handler below.
  const openResume = () => {
    closeActionMenu();
    setResumeOpen(true);
  };
  const openChangeActive = () => {
    closeActionMenu();
    setChangeActiveOpen(true);
  };
  const openChangePause = () => {
    closeActionMenu();
    setChangePauseOpen(true);
  };
  // Resume the job back to active with a fresh sub-status (updates "Active on").
  const doResume = (ss: string, reason: string) => {
    setStatus("active");
    setSubStatus(ss || undefined);
    setStatusMessage(reason || undefined);
    setActiveAt(formatStatusTimestamp(new Date()));
  };
  // Change the active sub-status / status message (stays active).
  const doChangeActive = (ss: string, reason: string) => {
    setSubStatus(ss || undefined);
    setStatusMessage(reason || undefined);
  };
  // Change the pause Type / sub-status / reason (stays paused; keeps "Paused on").
  const doChangePause = (type: string, ss: string, reason: string) => {
    setStatus(type === "quick-pause" ? "quickPaused" : "onHold");
    setSubStatus(ss || undefined);
    setStatusMessage(reason || undefined);
  };
  const checkIn = () => {
    closeActionMenu();
    const now = new Date();
    setElapsed(0);
    setCheckedIn(true);
    // Check-in starts a new time session.
    setSessions((prev) => [
      ...prev,
      {
        id: prev.reduce((max, s) => Math.max(max, s.id), 0) + 1, // unique even after deletes

        startLabel: TIME_FMT.format(now),
        month: MONTH_FMT.format(now).toUpperCase(),
        day: String(now.getDate()),
        dateLabel: FULL_DATE_FMT.format(now),
        active: true,
        durationSec: 0,
      },
    ]);
    toast({ type: "success", title: "Checked in" });
  };
  const checkOut = () => {
    closeActionMenu();
    setCheckedIn(false);
    endActiveSession();
    // Checking out logs the finished time session.
    toast({ type: "success", title: "Time session logged" });
  };
  // Time-session actions (the Timesheet plus + the ended-row menu).
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
  const openStart = () => {
    closeActionMenu();
    setStartOpen(true);
  };
  const openPause = () => {
    closeActionMenu();
    setPauseOpen(true);
  };
  // Complete → review logged time first (the toast fires on Confirm in the form).
  const openComplete = () => {
    closeActionMenu();
    setCompleteOpen(true);
  };

  // First bar buttons: ellipsis (context menu) + the state's primary actions.
  const ellipsis = (
    <IconButton
      icon="ellipsis"
      size="lg"
      variant="ghost"
      aria-label="More actions"
      isPressed={actionMenuOpen}
      noDebounce
      onClick={() => setActionMenuOpen(true)}
    />
  );
  let actionButtons: ReactNode;
  if (status === "upcoming") {
    actionButtons = (
      <>
        {ellipsis}
        <Button size="lg" variant="solid" className={styles.grow} onClick={openStart}>
          Start
        </Button>
      </>
    );
  } else if (status === "active") {
    actionButtons = (
      <>
        {ellipsis}
        <Button size="lg" variant="subtle" className={styles.grow} onClick={openPause}>
          Pause
        </Button>
        <Button size="lg" variant="solid" className={styles.grow} onClick={openComplete}>
          Complete
        </Button>
      </>
    );
  } else {
    // Paused (quick-pause / on-hold): just Resume (solid) — no Complete.
    actionButtons = (
      <>
        {ellipsis}
        <Button size="lg" variant="solid" className={styles.grow} onClick={openResume}>
          Resume
        </Button>
      </>
    );
  }

  // Action-bar context menu — per state (and per prototype: check-in only when
  // the feature is on).
  const checkInItem =
    config.hasCheckIn && status === "active" ? (
      <MenuItemGroup>
        <MenuItem
          label={checkedIn ? "Check out" : "Check in"}
          slotLeft={slot(checkedIn ? "arrow-left-to-bracket" : "arrow-right-to-bracket")}
          onClick={checkedIn ? checkOut : checkIn}
        />
      </MenuItemGroup>
    ) : null;

  let actionMenuItems: ReactNode;
  if (status === "upcoming") {
    actionMenuItems = (
      <>
        <MenuItemGroup>
          <MenuItem label="Start" slotLeft={slot("circle-play")} onClick={openStart} />
          <MenuItem label="Unschedule" slotLeft={slot("calendar-xmark")} onClick={stub(`"${JOB_ID}" unscheduled`)} />
        </MenuItemGroup>
        <MenuItemGroup>
          <MenuItem label="Cancel" slotLeft={slot("ban")} danger onClick={stub(`"${JOB_ID}" cancelled`)} />
        </MenuItemGroup>
      </>
    );
  } else if (status === "active") {
    actionMenuItems = (
      <>
        {checkInItem}
        <MenuItemGroup>
          <MenuItem label="Change active status" slotLeft={slot("pen")} onClick={openChangeActive} />
          <MenuItem label="Pause" slotLeft={slot("circle-pause")} onClick={openPause} />
        </MenuItemGroup>
        <MenuItemGroup>
          <MenuItem label="Reschedule" slotLeft={slot("calendar-lines-pen")} onClick={stub(`"${JOB_ID}" rescheduled`)} />
          <MenuItem label="Complete" slotLeft={slot("circle-check")} onClick={openComplete} />
        </MenuItemGroup>
      </>
    );
  } else {
    actionMenuItems = (
      <>
        {checkInItem}
        <MenuItemGroup>
          <MenuItem label="Change pause status" slotLeft={slot("pen")} onClick={openChangePause} />
          <MenuItem label="Resume" slotLeft={slot("circle-play")} onClick={openResume} />
        </MenuItemGroup>
        <MenuItemGroup>
          <MenuItem label="Reschedule" slotLeft={slot("calendar-lines-pen")} onClick={stub(`"${JOB_ID}" rescheduled`)} />
        </MenuItemGroup>
      </>
    );
  }

  return (
    <div className={styles.mobile}>
      <ScrollArea wrapperClassName={styles.scroll} className={styles.scrollInner}>
        <NavTopBar
          variant="details"
          liveUsers={LIVE_USERS}
          tabs={<Tabs value={tab} onChange={setTab} />}
          breakpoint="mobile"
          hideOnScroll
        >
          <NavTopBarLeftElements onBack={noop} onActions={() => setTopMenuOpen(true)} actionsPressed={topMenuOpen}>
            <NavTopBarTitle title={JOB_ID} slotLeft={<AvatarJob size="md" status={avatarStatus} />} />
          </NavTopBarLeftElements>
        </NavTopBar>

        {tab === "details" ? (
          <DetailsPanel mobile scheduling={scheduling} onSchedulingChange={setScheduling} job={panelJob} locked={false} />
        ) : tab === "service" ? (
          <ServicePanel mobile />
        ) : tab === "timesheet" ? (
          <TimesheetPanel
            assignees={assigneeUsers}
            viewerId={viewer.id}
            sessionsByUser={sessionsByUser}
            onStopSession={checkOut}
            onEditSession={openEditSession}
            onDeleteSession={setDeleteTarget}
            onAddSession={openAddSession}
            canAddSessions={status !== "upcoming"}
            started={false}
            mobile
          />
        ) : (
          <div className={styles.placeholder}>Content</div>
        )}
      </ScrollArea>

      {/* Second bar (check-in timer) sits above the first bar, only when checked in. */}
      {checkedIn && <TimerBar elapsed={elapsed} onCheckOut={checkOut} />}

      {/* First bar — the action bar. */}
      <ActionBar placement="bottom">{actionButtons}</ActionBar>

      {/* Top-bar ellipsis menu (generic actions). */}
      <Menu
        open={topMenuOpen}
        onClose={() => setTopMenuOpen(false)}
        header={<MenuHeader avatarStatus={avatarStatus} caption={caption} />}
        breakpoint="mobile"
      >
        <TopMenuItems onClose={() => setTopMenuOpen(false)} />
      </Menu>

      {/* Action-bar context menu (state-dependent, incl. Check in/out). */}
      <Menu
        open={actionMenuOpen}
        onClose={closeActionMenu}
        header={<MenuHeader avatarStatus={avatarStatus} caption={caption} />}
        breakpoint="mobile"
      >
        {actionMenuItems}
      </Menu>

      <StartJobForm open={startOpen} onClose={() => setStartOpen(false)} onStart={startJob} mobile />
      <PauseJobForm open={pauseOpen} onClose={() => setPauseOpen(false)} onPause={pauseJob} mobile />

      {/* Status-change forms (Resume / Change active / Change pause). */}
      <SubStatusForm
        open={resumeOpen}
        onClose={() => setResumeOpen(false)}
        title="Resume job"
        submitLabel="Resume"
        reasonLabel="Resume reason"
        toastTitle={`"${JOB_ID}" resumed`}
        onSubmit={doResume}
        mobile
      />
      <SubStatusForm
        open={changeActiveOpen}
        onClose={() => setChangeActiveOpen(false)}
        title="Change active status"
        submitLabel="Change status"
        reasonLabel="Status message"
        toastTitle={`"${JOB_ID}" status changed`}
        initialSubStatus={subStatus ?? ""}
        initialReason={statusMessage ?? ""}
        onSubmit={doChangeActive}
        mobile
      />
      <ChangePauseStatusForm
        open={changePauseOpen}
        onClose={() => setChangePauseOpen(false)}
        initialType={status === "onHold" ? "on-hold" : "quick-pause"}
        initialSubStatus={subStatus ?? ""}
        initialReason={statusMessage ?? ""}
        onSubmit={doChangePause}
        mobile
      />

      {/* Complete review form ("Time logged") — Confirm fires the completed toast. */}
      <CompleteJobForm
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        viewer={viewer}
        sessions={displaySessions}
        onStopSession={checkOut}
        onEditSession={openEditSession}
        onDeleteSession={setDeleteTarget}
        onAddSession={openAddSession}
        mobile
      />

      {/* Time-session form (add / edit) + the delete-confirm prompt. */}
      <SessionForm open={sessionFormOpen} onClose={() => setSessionFormOpen(false)} session={editingSession} onSave={saveSession} mobile />
      <Prompt
        open={deleteTarget != null}
        title="Delete time session?"
        body="Time session will be permanently deleted. This action can not be undone."
        actionLabel="Delete"
        actionVariant="danger"
        actionIcon="trash"
        onAction={confirmDeleteSession}
        onCancel={() => setDeleteTarget(undefined)}
        breakpoint="mobile"
      />
      <Toaster breakpoint="mobile" />
    </div>
  );
}
