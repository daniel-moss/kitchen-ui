import EmptyState from "../../components/EmptyState/EmptyState";
import { Breakpoint } from "../../hooks/useIsDesktop";
import { semanticIcons } from "../../styles/semanticIcons";

import { Page } from "../shell/appShell";
import { useJob } from "../store/AppStore";

import JobDetails from "../../modules/JobDetails/JobDetails";

// The route's adapter: it turns `#/jobs/<id>` into the real Job Details page.
//
// The page itself knows nothing about routing — it takes the job record it
// should show. This file is the only thing between the two, so the page stays
// exactly the design it is and can still be opened from a story on its own.
//
// The PAGE moved to src/modules/JobDetails on 2026-09-28: the app and the
// prototype had a copy each, 76 of the 94 files byte-identical, and they were
// already drifting. This adapter is all the app keeps of its own.
export interface JobDetailsRouteProps {
  /** The job id, straight from the route. */
  id: string;
  breakpoint?: Breakpoint;
  /** Back to a list — used when the id names nothing. */
  onNavigate: (next: Page) => void;
  /** Opens ANOTHER job in the same tab — the "Recall to" link uses it. */
  onOpenJob: (id: string) => void;
}

export default function JobDetailsRoute({ id, breakpoint = "auto", onNavigate, onOpenJob }: JobDetailsRouteProps) {
  // From the STORE, so an edit made here is the one the list shows.
  const record = useJob(id);

  // A link can name a job that is not in the database — a stale bookmark, or a
  // hand-typed id. That is a normal state, not a crash.
  if (record == null) {
    return (
      <EmptyState
        icon={semanticIcons.job}
        title="This job does not exist"
        caption={`Nothing in the database has the id "${id}".`}
        primaryAction={{ label: "Back to jobs", onClick: () => onNavigate("jobs") }}
      />
    );
  }

  return <JobDetails record={record} breakpoint={breakpoint} onBack={() => onNavigate("jobs")} onOpenJob={onOpenJob} />;
}
