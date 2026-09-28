import { usersById } from "../users";
import { historyOf } from "./jobHistory";
import { Job } from "./types";

// THE FILES ON A JOB — what the tech photographed and filed on the visit.
//
// Added 2026-09-28. The module used to show the same six files on all 78 jobs
// — Image.png, Document.pdf, Video.mp4, Spreadsheet.xls, Document.doc,
// Audio.wav — each captioned "Added on Jan 1, 2025 by Lorne R."
//
// DERIVED from the job, like its history and its charges: a job nobody has
// worked has no files, and a job that has been worked has the photographs and
// the report its own tech filed, on the day they were there.

/** The DS `AvatarFileType` values this module uses. */
export type JobFileKind = "image" | "pdf" | "video" | "word" | "spreadsheet" | "audio";

export interface JobFile {
  id: number;
  name: string;
  kind: JobFileKind;
  size: string;
  /** "Added on Aug 19, 2026 by Ismaeel L." — the row's caption. */
  meta: string;
  visibility: "public" | "private";
}

/**
 * What a visit produces. The nameplate and the before/after photographs are
 * what a tech is actually asked for; the report is what the office sends on.
 */
const PUBLIC_FILES: { name: string; kind: JobFileKind; size: string }[] = [
  { name: "Nameplate.jpg", kind: "image", size: "2.1 MB" },
  { name: "Before.jpg", kind: "image", size: "3.4 MB" },
  { name: "After.jpg", kind: "image", size: "3.1 MB" },
  { name: "Service report.pdf", kind: "pdf", size: "412 KB" },
];

/** Internal — the office's own working files, not shown to the client. */
const PRIVATE_FILES: { name: string; kind: JobFileKind; size: string }[] = [
  { name: "Parts quote.pdf", kind: "pdf", size: "168 KB" },
  { name: "Site notes.docx", kind: "word", size: "94 KB" },
];

const shortDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** "Ismaeel L." — the way every caption in the app names a person. */
function shortName(userId: number | undefined): string {
  const user = userId == null ? undefined : usersById.get(userId);
  if (user == null) return "Someone";
  return `${user.firstName} ${user.lastName.charAt(0)}.`;
}

/**
 * The job's files.
 *
 * A job that has not been worked has NONE — there is nothing to photograph
 * before the visit, and an empty module is the honest state. A finished job
 * also carries the internal files; one still in progress has only what the
 * tech has filed so far.
 */
export function filesOf(job: Job): JobFile[] {
  const history = historyOf(job);
  const started = history.transitions.some((t) => t.status === "active");
  if (!started) return [];

  const finished = ["completed", "finalized"].includes(job.status);
  const visit = history.sessions[0]?.start ?? job.scheduledFor ?? job.receivedAt;
  const by = shortName(job.assigneeIds[0]);
  const meta = `Added on ${shortDate(new Date(visit))} by ${by}`;

  // Mid-visit there is no report yet, and the office has filed nothing.
  const pub = finished ? PUBLIC_FILES : PUBLIC_FILES.filter((file) => file.kind === "image").slice(0, 2);
  const priv = finished ? PRIVATE_FILES : [];

  let id = 0;
  return [
    ...pub.map((file) => ({ ...file, id: ++id, meta, visibility: "public" as const })),
    ...priv.map((file) => ({ ...file, id: ++id, meta, visibility: "private" as const })),
  ];
}
