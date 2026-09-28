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

## Still open

Edits made in the Equipment side panel (General details, Notes) update the
panel while it is open but do NOT write back into the job's equipment list.
