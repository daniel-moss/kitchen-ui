# Job Details — the page, shared

The Job Details page lives here, once. Before 2026-09-28 there were two copies
— `src/prototypes/JobDetails/` and `src/app/jobDetails/` — and **76 of their 94
files were byte-identical** while the other 18 had already drifted apart in two
days (Daniel: "otherwise everything starts drifting very fast").

## Who uses it

| Consumer | What it is |
|---|---|
| `src/app/jobDetails/JobDetailsRoute.tsx` | The app's route adapter — turns `#/jobs/<id>` into `<JobDetails record={…} />`. The **only** file the app keeps. |
| The eight `*.stories.tsx` here | The Storybook entries, under **`Modules/Job Details`** |

The WHOLE-PAGE story is gone (2026-09-28). **App → Demo** shows the same page,
responsive, with real navigation across all 78 jobs — verified at 390px: the
"Details" tab comes first and the ActionBar pins to the bottom, exactly what
the standalone Mobile story drew. The eight sub-stories stay: a form or a
drawer on its own, at each breakpoint, is something the app cannot easily show.

The section was renamed from `Prototypes/Job Details` at the same time, which
changed those story ids (`prototypes-…` → `modules-…`). Safe: the published
user-testing build uses different ids (`prototypes-job-details-forms--*`, a
separate static bundle), and links to the main Storybook were never frozen.

## Which version won

The APP's, following the rule Daniel set for the database the same day: the
demo app is the canonical one. It was ahead everywhere — it had moved the
page's hardcoded demo data into the database (`jobFiles`, `jobCharges`,
`jobHistory`, `jobNarrative`), so an ice-machine descale no longer bills for
walk-in cooler parts, and all 78 jobs no longer show the same six files.

Two things were carried over from the prototype side afterwards:

- `ServicePanel.tsx` — the equipment row opens the **Equipment side panel**.
- `FilesModule.tsx` — it renders the shared `src/modules/FilesModule` instead
  of a third copy of the same module; what stays here is the job's data and
  its handlers.

## Prototypes now holds only Filters

Which is right: Filters is the one thing still genuinely a prototype, and it
goes away with its own database copy when its user test ends.

## Layering

Nothing here imports from `src/app`. The page needs the Jobs list's row shape,
which is why `Job`, `jobRow`, `JOB_ROWS` and `jobRowById` moved to
`src/modules/shared/jobRow.ts` — the list builds those rows, this page consumes
them, and `src/app/jobsData.ts` re-exports them so its own imports were
untouched.

## Job actions on every status (2026-10-27)

Read off Figma 24575-152369 (the "Workflow" page, every status). All of it
lives in `ActionButtons`, `DoneButtons` and `jobActionMenuItems` in
`JobDetails.tsx`. Menus: the STATUS actions first (solid icons in their
status colour), then a last group that always ends with **Download PDF**.
`⟋` marks the group divider.

| Status | Bar | Overflow menu |
|---|---|---|
| Upcoming / past due | ghost **Actions** · solid **Start** | Unschedule · Cancel (danger) ⟋ Download PDF |
| Unscheduled | ghost **Actions** · solid **Schedule** | Cancel (danger) ⟋ Download PDF |
| Active | ghost **Actions** · solid **Complete** | Change active status (if the company has active sub-statuses) · Pause · Hold · Reschedule ⟋ Download PDF |
| Paused | ghost **Actions** · solid **Resume** | Change pause status · Hold · Reschedule ⟋ Download PDF |
| On hold | ghost **Actions** · solid **Resume** | Change hold status · Reschedule ⟋ Send summary · Download PDF |
| Completed | ghost **Actions** · solid **Mark as ⌄** · solid **Create ⌄** — all three share the mobile row equally | Change completed status (solid orange `circle-check`; opens nothing yet) · Resume ⟋ desktop: Create recall · Send summary · Download PDF / mobile: Send summary · Create recall · Download PDF |
| Completed + a DRAFT invoice or estimate | desktop: ghost **Actions** · ghost **Create recall** · ghost **Send summary** / mobile: ghost **Actions** · ghost **Send summary** | Change completed status · Resume ⟋ desktop: Download PDF / mobile: Create recall · Download PDF |
| Finalized | ghost **Send summary** · ghost **Create recall** · ghost **Download PDF** (mobile: an icon button) | — none |
| Cancelled | ghost **Download PDF** | — none |

**Create recall hides once the job HAS a recall job** (the node's annotation),
in the bar and in the menu. `hasRecall` is seeded from the db (`recallOf`)
and turns on after "Create recall".

**The draft-child bar** (Figma 27348-25428): the system already sees the
invoice or estimate, but cannot finalize the job while it is a draft, so
"Mark as" and "Create" hide; the "Actions" menu stays (Figma 27348-28420 /
27348-28422, 2026-10-27). `hasDraftChild` is seeded from the db (a
`draft` invoice or estimate with this `jobId`); "Create invoice" / "Create
estimate" turn it on, standing in for saving a draft, since no form opens yet.

**Every Download PDF opens the "Download PDF" form** (Figma 24592-39416,
rebuilt 2026-10-27; `"Download PDF" Form/DownloadPdfForm.tsx`): one RadioGroup
— Private (`lock`) / Public (`globe`) cards, nothing picked, "Choose version"
on Download. A job made from an estimate (an estimate with this `jobId` and
status `jobbed`) adds "Include parent estimate PDF" under the picked card:
off by default, and it keeps its tick when you switch cards. Toasts
"Downloading..." → "Downloaded" ("Couldn't download" on a failure).

**Copy URL is NOT in the bar or the menu** (Figma 21136-58234, 2026-10-27): it is the
ghost `link` IconButton in TopBarNav's title right slot (`titleAction`), before the
live users, on every status, both breakpoints and the public view. Tooltip "Copy job
link"; toasts "Job's link copied" / "Couldn't copy the job's link".

Two rules worth keeping:

- **The overflow trigger is a LABELLED ghost button on every status**, never an
  icon-only ellipsis. `ActionButtons.actionsButton()` builds the one version,
  and on MOBILE it stretches like every other button — including the
  completed job's three-button row, where the node draws it hugging at 96px
  and Daniel chose the even split instead (2026-10-06).
- **"Mark as" and "Create" are NOT repeated in the overflow menu.** Each has
  its own bar button with its own menu, and one definition of the items
  (`markAsMenuItems` / `createMenuItems`) feeds it.

A completed job's Mark-as confirmations (Figma 24567-139607 / 24567-140732)
carry the same leading icon as their menu item — `circle-dollar` / `clock`.

## Who may touch time, and when (2026-10-06)

Three separate gates, all in `useJobShell`. They were one before, which is why
the wrong things appeared and disappeared together.

| Gate | What it controls | Rule |
|---|---|---|
| `canTrackTime` | the desktop SessionBar and the mobile SessionPill — the viewer's OWN stopwatch | **the viewer must be an ASSIGNEE** (Daniel, 2026-10-06), the job must not be unscheduled or cancelled, and a completed / finalized job keeps it only while a session is still running (so it can be closed) |
| `canManageTimesheet` | the "+" and the row menus on EVERY tech's group — an admin correcting somebody's sheet | `VIEWER_IS_ADMIN` and the job is not closed. It does NOT follow `canTrackTime`: office work on a job you are not assigned to is still allowed |
| `timesheetFrozen` | takes the "+" and the row menus away from EVERYONE | the job is **finalized or cancelled**. Even full permissions do not re-open it (Daniel, 2026-10-06) — a closed job's timesheet is a record, not a working document |

`timesheetFrozen` wins over both of the others; it reaches `TimesheetPanel` as
`readOnly`.

**CLOSED means the jobs list's Closed PHASE — finalized or cancelled.**
"Completed" is an OPEN status (it sits under Open, waiting to be invoiced or
estimated) and its timesheet is still editable: correcting the hours is
exactly what happens between completing a job and billing it. My first
reading swept Completed in with the other two; Daniel narrowed it on
2026-10-06.

**The top bar's live users never include YOU** (Daniel, 2026-10-06). The demo
is Lorne Riddle's screen, and "live users" means the people you are sharing
the job with — your own face there is like being shown yourself. `VIEWER_ID`
is filtered out of `liveUsersFor`. Nothing changes on screen today (Lorne is
on no ACTIVE job), but the moment he is assigned to one he would have
appeared.

**Consequence worth knowing:** Lorne Riddle is an assignee on only five of the
78 jobs (JOB-1072, 1085, 1097, 1099, 1105), and three of those are closed — so
the time tracker bar appears on **JOB-1099** and almost nowhere else. If the
demo needs to show time tracking, Lorne has to be assigned to more jobs.

NOT gated: the check-out review (`TimesheetForm`), which still offers add /
edit / delete. It is a step of the check-out itself — you reach it by closing
a session, and it asks you to correct what was just logged.

## "Scheduled on" is not "Scheduled for" (2026-10-06)

Two different dates, and they are meant to differ (Daniel): **Scheduled on**
is when somebody BOOKED the visit, **Scheduled for** is the visit. Every job
used to print the same hardcoded `STATUS_TS` ("Jan 1, 2026 at 12:00 PM") for
the first one. `seedJobState` now reads the job's own history — the transition
into `upcoming`, which is minutes to hours after the job arrived — and
scheduling a job live stamps the current moment. `STATUS_TS` survives only as
a defensive fallback.

## Dates on the Timesheet tab: full on desktop, compact on mobile (2026-10-06)

One rule, three places. Desktop gets the long weekday form, MOBILE the short
one — every row there has a duration beside it and no space for the long
words. **The weekday and the year show on both.**

| Place | Desktop | Mobile |
|---|---|---|
| Session row caption (`TimesheetPanel`) | Monday, January 1, 2027 | Mon, Jan 1, 2027 |
| Work timeline legend (`TimeCharts`) | Monday, January 1, 2027 | Mon, Jan 1, 2027 |
| Time session dialog, Start/End date (`SessionForm`) | Monday, January 1, 2027 (Figma 24105-15788 annotates it "Full format with the weekday") | Mon, Jan 1, 2027 |

**One pair everywhere**: the weekday and the year on both breakpoints, only
the words shorten. The helpers are `weekdayDate` / `shortWeekdayDate` in
`modules/shared/dates.ts`, not here: `TimesheetPanel` already imports
`TimeCharts`, so a helper in the panel would be a cycle. They take a display
LABEL ("September 11, 2026") **or a `Date`**, and hand back anything they
cannot parse.

The **Signature** module's "Date" row is the third caller (Daniel,
2026-10-06): it had its own formatter that dropped the year in the current
year, so every signature in the demo read "Friday, September 11". It is
`weekdayDate` now.

STILL CONDITIONAL-YEAR, flagged and not changed — all four print the year
only when the date is not in the current one, which the app-wide rule retired
on 2026-09-15:

| Where | Formatter |
|---|---|
| the ACTIVE session row's caption + the Complete-flow review | `weekdayDate` in `JobDetails.tsx` (a local one, same name) |
| the activity log's session moments ("Mon, Jan 1 at 11:30 AM") | `shortDate` / `sessionMoment` / `storedMoment` in `JobDetails.tsx` |
| the activity log's scheduling slot | `longSlotLabel` in `JobDetails.tsx` |
| the Scheduling form's MOBILE date field | `formatEditDate` in `SchedulingForm.tsx` |

## The company rounds time up (2026-10-06)

`COMPANY.roundsTimeUp` is a new per-company setting and it is **ON**. Every
duration on the Timesheet tab is rounded UP to the next 5 minutes, and that
is the CONDITION the exact-time tooltips need: *"If a company has a setting to
round up the time, we show a tooltip with the exact time by hovering"*
(Figma 24620-84353). A company that does not round hides nothing, so no
tooltip appears — which is why none of them showed before.

`JobDetails`' `roundTo5min` prop now defaults from it; a story can still pass
its own.

Three places got the tooltip, all through the one `ValueTooltip` (exported
from `TimeCharts`): a session row's total (Figma 21816-30643), and the two
charts' legend rows (24620-83257 / 24620-84353).

**`assigneeStats` rounds too.** The Assignees module's "Total tracked" read
4 hr 24 min beside a timesheet adding up to 4 hr 30 min — the same person, two
numbers. A RUNNING session is never rounded, in either place.

NOT built: the session row's **range** tooltip, the other half of
21816-30643. That node rounds the clock times as well ("11:30 AM → 2:30 PM"
revealing "11:27 AM → 2:25 AM"), but this build keeps the range as the ACTUAL
recorded times — a 2026-07-21 decision — so a tooltip there would repeat the
row. Rounding the range would also have to leave `sessionSpan`'s overlap
detection on the raw labels.

A warning session (≥ 10 h, cross-day, or two of one tech's sessions
overlapping) draws the DS `AvatarWarning` in all three cases. FLAGGED: no job
in the demo triggers any of them — the longest `durationMinutes` is 300, and
the generated sessions never cross midnight or overlap within one tech.

The dialog's **time input carries the mask as a placeholder — "00:00"**. The
DS `TextField` has had the prop all along (its JSDoc even names this case); it
was simply never passed.

FLAGGED: the **Scheduling** form's mobile date field (`formatEditDate` in
`SchedulingForm.tsx`) still drops the year in the current year — "Mon, Oct 6"
— so it reads differently from the Time session dialog one dialog over.
One line to align if that is wanted.

## The Summary tab's two text dialogs (2026-10-06)

"Notes to dispatcher(s)" (`NotesForm`) and "Work summary" (`WorkSummaryForm`)
are TEXT DIALOGS — a Dialog whose body is one TextArea — so they take the
pattern's two height rules: **12 rows minimum on desktop** (`textDialog
.tallField`, 264px), and **no minimum on mobile**, where the drawer fills the
screen (`fillHeight`) and the field fills the drawer (`.fillField`). Measured
264px desktop / 680px mobile. Figma 21820-75363 and 24273-81702.

They differ from the other text dialogs in one way that mattered: their body
has **no `Input`** — the dialog title IS the field's label — so the class goes
on a bare `<div>` carrier. That exposed a gap in the shared sheet:
`.fillField` stretched the carrier but its child stayed at 4 rows, because a
plain div is `display: block` and the child's `flex` did nothing. `.fillField`
now declares `display: flex; flex-direction: column` itself. No-op for the
`Input` carriers (EditNotesDialog, Cancel job), which already were flex
columns — Cancel job re-measured at 632px, unchanged.

**"Generate" is "Generate summary"** in both the Work summary module and its
dialog (Daniel, 2026-10-06). FLAGGED: the Complete-job flow's Summary step has
a third button with the same action and the same wand icon, still labelled
"Generate" / "No completed forms" (`CompleteJobForm.tsx`). Daniel named only
the two, so it was left alone.

## "On hold" is two badges (2026-10-06)

`displayStatus` returned `onHoldExternal` for EVERY held job, so changing the
reason from an external one to an internal one left the badge crimson
(Daniel, JOB-1208). The page has one `onHold` status but the DS has two
badges — brown for waiting on US, crimson for waiting on the client or a
supplier — and the SUB-STATUS is what says which. `displayStatus` now tests
`INTERNAL_ON_HOLD`, and the lifecycle chart (which already split the two and
therefore disagreed with the badge) reads its answer instead of repeating the
test. Verified: "Waiting for parts" → crimson-a11, "Parts on order" →
brown-a11.

## Still open

Edits made in the Equipment side panel (General details, Notes) update the
panel while it is open but do NOT write back into the job's equipment list.

The Resume-job dialog's **"Active status"** select (Figma 24567-140293) is
built but never shown: it renders only when the company configures ACTIVE
sub-statuses, and the demo company has them off by Daniel's 2026-09-28
decision. Same situation as the active menu's "Change job active status".

**The completed job's Mark-as / Create pair does not follow production yet.**
Production splits the whole completed phase on `is_job_walk` — see the
`completed-job-billing-actions` memory. The demo's `Job.type` is only
`"new" | "recall"`, so there is no job walk to split on.

## The PUBLIC view (2026-10-20)

Figma 26990-56723 — what a client sees from the job's link. It is the SAME page
in a read-only mode (`isPublicView` on `JobDetails`, threaded into
DetailsPanel / ServicePanel / SummaryPanel / FormsModule / FilesModule), not a
copy. Story: **Modules/Job/Details/Public View** (Desktop, Mobile; the job
and "Company has a logo" are controls). The action that opens it is not
designed yet.

| Area | Public rule |
|---|---|
| Top bar | no back, no live users; the title's Copy URL button + Download PDF only (the cancelled bar's button) |
| Tabs | Service, Summary (+ Details first on mobile) — no Timesheet, no Activity; no time tracking |
| Sidebar ORDER | Service company · Service location · Status · Billing intention · Job contacts · Scheduling · Assignees · Job properties · Related |
| Service company | NEW, public only: logo (or the name's first letter), branch caption if any, email (required) + phone (if any) as wrapping links with Copy — `ValueDisplay`'s new `href` |
| Service location / Billing | no edit, no "Open in maps"; the rows open nothing yet (Location / Client panels are not designed) |
| Scheduling / Assignees | no Est. duration; names only, no tracked time or status |
| Job properties | Job ID, Source, Source ID, Date received — no Branch (moved), no Received by (Daniel, 2026-10-20 — the node still draws it), no Created / Last modified |
| Job contacts | existing contacts only, no module without any; menu = Preview · Copy email · Copy phone; the Contact panel opens in its public view |
| Related | Created from (jobbed parent estimate) + Recall to only; no module without either |
| Service tab | no Priority, no Tech instructions; Equipment / Files only when not empty; Equipment rows end with a chevron and open the panel's public view |
| Summary | Tech work + Signature — no Charges (not designed); Forms = public COMPLETED forms, flat, chevron, preview without a menu; Work summary only when written; no Notes to dispatcher(s) |

Also on 2026-10-20, for BOTH views: Related shows **"Created from"** again
when the job was made from an estimate (`parentEstimateOf` — only a JOBBED
estimate is a parent; an estimate awaiting approval was written FOR the job),
and a parent estimate LOCKS the service location. The third parent, a series,
cannot be checked: the db does not link jobs to series yet.
