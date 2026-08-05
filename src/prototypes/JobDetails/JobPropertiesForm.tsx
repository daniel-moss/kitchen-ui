import { MouseEvent, useEffect, useState } from "react";
import clsx from "clsx";

import Avatar from "../../components/Avatar/Avatar";
import AvatarUser from "../../components/Avatar/AvatarUser";
import Button from "../../components/Button/Button";
import CheckboxItem from "../../components/Checkbox/CheckboxItem";
import Dialog from "../../components/Dialog/Dialog";
import DateField from "../../components/Fields/DateField/DateField";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextField from "../../components/Fields/TextField/TextField";
import Input from "../../components/Input/Input";
import MenuItem from "../../components/Menu/MenuItem";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import SelectListFooter from "../../components/SelectList/SelectListFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";
import { User, users } from "../../data/users";
import { SelectPopoverList, useSelectPopover } from "../../forms/shared/selectPopover";
import { JOB_ID, JOB_SOURCE_ID, staffSelectLabel } from "./jobData";
import { slot } from "./shared";

import styles from "./JobPropertiesForm.module.scss";

// ---- field data (per the "Job Properties" fields documentation) -------------

/** A company branch — the list rows show name over address (node 23810-17758). */
export interface Branch {
  name: string;
  address: string;
}
// Sorted A→Z per the list's annotation; the demo job sits at Headquarters.
export const BRANCHES: Branch[] = [
  { name: "Downtown", address: "39293 Gainsborough Dr, Palmdale, CA 93551" },
  { name: "Headquarters", address: "4922 Golden Rd, Pleasanton, CA 94566" },
  { name: "Suburbs", address: "934 Macon Rd, Mountain View, CA 94035" },
];

/**
 * A job source. `requireSourceId` is set per source by the New-source form's
 * checkbox — it decides whether the job's "Source ID" field exists at all.
 * `hasAvatar` marks an INTEGRATION, which carries a logo; "Direct" and any
 * source someone creates by hand have none (Daniel, 2026-08-03).
 */
export interface JobSource {
  name: string;
  requireSourceId: boolean;
  hasAvatar?: boolean;
}
// Figma 23811-12328. "Direct" is the built-in source: it is always FIRST, has
// no logo, and needs no ID. The three integrations follow A→Z, each with a
// logo — a source ID is what an integration gives you.
export const JOB_SOURCES: JobSource[] = [
  { name: "Direct (Phone, email, etc.)", requireSourceId: false },
  { name: "Corrigo", requireSourceId: true, hasAvatar: true },
  { name: "Ecotrak", requireSourceId: true, hasAvatar: true },
  { name: "ServiceChannel", requireSourceId: true, hasAvatar: true },
];

/** The built-in source — pinned to the top of the list, never re-sorted. */
const DIRECT_SOURCE = JOB_SOURCES[0].name;

/** "Direct" first, everything else A→Z (a created source sorts in). */
export const sortSources = (list: JobSource[]): JobSource[] => [
  ...list.filter((s) => s.name === DIRECT_SOURCE),
  ...list.filter((s) => s.name !== DIRECT_SOURCE).sort((a, b) => a.name.localeCompare(b.name)),
];

/** The source's logo, or nothing for "Direct" / a hand-made source. */
export const sourceAvatar = (sources: JobSource[], name: string) =>
  sources.find((s) => s.name === name)?.hasAvatar === true ? <Avatar type="object" content="image" size="xs" /> : undefined;

/** The users the "Received by" list offers (the 9 in node 23813-14792, A→Z). */
const RECEIVED_BY_USERS: User[] = users
  .filter((u) => u.id <= 9)
  .sort((a, b) => a.name.localeCompare(b.name));

// The module writes the date in full ("January 1, 2026"); the FIELD writes it
// as weekday + day ("Monday, January 1"), per its node. Two different formats
// for one value — both are what the design shows.
const FIELD_DATE = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" });
export const MODULE_DATE = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });

const DATE_RECEIVED_HINT = "When did you first hear from the customer about this request?";

// ---- the values -------------------------------------------------------------

export interface JobProperties {
  jobId: string;
  branch: string;
  source: string;
  sourceId: string;
  dateReceived: Date | null;
  /** The user id of who received the job. */
  receivedBy: number;
}

export const defaultJobProperties = (): JobProperties => ({
  jobId: JOB_ID,
  branch: "Headquarters",
  source: "ServiceChannel",
  sourceId: JOB_SOURCE_ID,
  dateReceived: new Date(2026, 0, 1),
  receivedBy: 3, // Amy Lowery
});

/** Whether the job's source asks for a Source ID (drives the field + the module row). */
export const sourceRequiresId = (sources: JobSource[], source: string) =>
  sources.find((s) => s.name === source)?.requireSourceId ?? false;

// ---- "New source" dialog (Figma 23812-13108) --------------------------------

const NewSourceForm = ({
  open,
  onClose,
  onCreate,
  mobile,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (source: JobSource) => void;
  mobile: boolean;
}) => {
  const [name, setName] = useState("");
  const [requireSourceId, setRequireSourceId] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (open) return;
    setName("");
    setRequireSourceId(false);
    setShowErrors(false);
  }, [open]);

  // The field is labelled just "Name" (doc updated 2026-08-03, node
  // 23982-18523) and is required — "Enter Name" comes from the label.
  const create = () => {
    if (name.trim() === "") {
      setShowErrors(true);
      return;
    }
    onCreate({ name: name.trim(), requireSourceId });
    // Detailed toast — the created source's name is the caption (node
    // 17181-58594; it was the compact variant before the doc update).
    toast({ type: "success", variant: "detailed", title: "Job source created", caption: name.trim() });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New source"
      breakpoint={mobile ? "mobile" : "desktop"}
      confirmOnDismiss={name !== "" || requireSourceId}
      footer={
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="solid" onClick={create}>
            Create
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.form}>
        <Input label="Name">
          <TextField value={name} onChange={(e) => setName(e.target.value)} isValid={!(showErrors && name.trim() === "")} />
        </Input>
        {/* Decides whether jobs from this source must carry a Source ID. */}
        <CheckboxItem
          variant="card"
          label="Require source ID"
          checked={requireSourceId}
          onChange={(e) => setRequireSourceId(e.target.checked)}
        />
      </div>
    </Dialog>
  );
};

// ---- the "Job properties" edit form -----------------------------------------

interface JobPropertiesFormProps {
  open: boolean;
  onClose: () => void;
  initial: JobProperties;
  /** Commits the edited values — the Job properties module re-renders from them. */
  onSave: (next: JobProperties) => void;
  /** The workspace's job sources — shell state, so a created one stays known to
   *  the module (it decides the Source ID row and the logo). */
  sources: JobSource[];
  /** Adds a source to the workspace pool; the form then selects it. */
  onCreateSource: (source: JobSource) => void;
  /** Job IDs already in use — the "already exists" error (demo set). */
  takenJobIds?: string[];
  mobile?: boolean;
}

/**
 * The "Job properties" edit form (Figma 21136-58187). Six fields in three
 * rows of two (one column on mobile, same reading order):
 *
 *   Job ID          | Branch
 *   Source          | Source ID
 *   Date received   | Received by
 *
 * Every field is required. Source ID only EXISTS while the picked source
 * requires one (Daniel, 2026-08-03) — its row partner then goes full width,
 * which is how the doc's "Default" frame renders a lone field.
 *
 * Created at / Created by / Last modified are system values: they show in the
 * module but are not editable here.
 */
export default function JobPropertiesForm({
  open,
  onClose,
  initial,
  onSave,
  sources,
  onCreateSource,
  takenJobIds = [],
  mobile = false,
}: JobPropertiesFormProps) {
  const [jobId, setJobId] = useState(initial.jobId);
  const [branch, setBranch] = useState(initial.branch);
  const [source, setSource] = useState(initial.source);
  const [sourceId, setSourceId] = useState(initial.sourceId);
  const [dateReceived, setDateReceived] = useState<Date | null>(initial.dateReceived);
  const [receivedBy, setReceivedBy] = useState(initial.receivedBy);
  const [showErrors, setShowErrors] = useState(false);
  const [newSourceOpen, setNewSourceOpen] = useState(false);

  const branchPop = useSelectPopover(mobile);
  const sourcePop = useSelectPopover(mobile);
  const receivedByPop = useSelectPopover(mobile);

  // A fresh open resets the draft to the saved values.
  useEffect(() => {
    if (!open) return;
    setJobId(initial.jobId);
    setBranch(initial.branch);
    setSource(initial.source);
    setSourceId(initial.sourceId);
    setDateReceived(initial.dateReceived);
    setReceivedBy(initial.receivedBy);
    setShowErrors(false);
    setNewSourceOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => {
    if (open) return;
    branchPop.close();
    sourcePop.close();
    receivedByPop.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ONE branch in the list ⇒ it is picked for you and the field is read-only
  // (node 17181-56399), so the label carries "(read-only)".
  const singleBranch = BRANCHES.length === 1;
  const needsSourceId = sources.find((s) => s.name === source)?.requireSourceId ?? false;
  const receiver = users.find((u) => u.id === receivedBy);

  const createSource = (created: JobSource) => {
    onCreateSource(created);
    setSource(created.name);
    // A source that needs an ID starts empty — the user fills the new field.
    if (created.requireSourceId) setSourceId("");
    sourcePop.close();
  };

  // Two Job ID errors (node 19156-118485): empty, and already taken. The
  // Figma copy for the empty case reads "Enter Jon ID" — a typo, corrected.
  const jobIdTaken = jobId.trim() !== "" && takenJobIds.includes(jobId.trim()) && jobId.trim() !== initial.jobId;
  const jobIdError = showErrors && (jobId.trim() === "" || jobIdTaken);

  const dirty =
    jobId !== initial.jobId ||
    branch !== initial.branch ||
    source !== initial.source ||
    (needsSourceId && sourceId !== initial.sourceId) ||
    dateReceived?.getTime() !== initial.dateReceived?.getTime() ||
    receivedBy !== initial.receivedBy;

  const save = () => {
    if (
      jobId.trim() === "" ||
      jobIdTaken ||
      branch === "" ||
      source === "" ||
      (needsSourceId && sourceId.trim() === "") ||
      dateReceived == null
    ) {
      setShowErrors(true);
      return;
    }
    onSave({
      jobId: jobId.trim(),
      branch,
      source,
      // A source that needs no ID drops the value with the field.
      sourceId: needsSourceId ? sourceId.trim() : "",
      dateReceived,
      receivedBy,
    });
    toast({ type: "success", title: '"Job properties" module updated' });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Job properties"
      breakpoint={mobile ? "mobile" : "desktop"}
      confirmOnDismiss={dirty}
      footer={
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="solid" onClick={save}>
            Save
          </Button>
        </PopoverFooter>
      }
    >
      <div className={clsx(styles.form, mobile && styles.mobile)}>
        <div className={styles.row}>
          <Input label="Job ID">
            <TextField
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              isValid={!jobIdError}
              errorMessage={jobIdTaken ? "Job with this ID already exists" : undefined}
            />
          </Input>
          <Input label="Branch" labelCondition={singleBranch ? "readOnly" : undefined}>
            <SelectField
              value={branch || undefined}
              readOnly={singleBranch || undefined}
              isValid={!(showErrors && branch === "")}
              open={branchPop.open}
              onClick={singleBranch ? undefined : (e: MouseEvent<HTMLDivElement>) => branchPop.toggle(e.currentTarget)}
            />
          </Input>
        </div>

        <div className={styles.row}>
          <Input label="Source">
            <SelectField
              value={source || undefined}
              // Only an integration carries a logo — "Direct" and any created
              // source show none.
              slotLeft={sourceAvatar(sources, source)}
              isValid={!(showErrors && source === "")}
              open={sourcePop.open}
              onClick={(e: MouseEvent<HTMLDivElement>) => sourcePop.toggle(e.currentTarget)}
            />
          </Input>
          {/* Only exists while the source asks for one; Source then fills the row. */}
          {needsSourceId && (
            <Input label="Source ID">
              <TextField
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                isValid={!(showErrors && sourceId.trim() === "")}
              />
            </Input>
          )}
        </div>

        <div className={styles.row}>
          <Input label="Date received" labelHintContent={DATE_RECEIVED_HINT}>
            <DateField
              value={dateReceived}
              onDateChange={setDateReceived}
              formatValue={(d) => FIELD_DATE.format(d)}
              isValid={!(showErrors && dateReceived == null)}
              breakpoint={mobile ? "mobile" : "desktop"}
            />
          </Input>
          <Input label="Received by">
            <SelectField
              value={receiver?.name}
              slotLeft={receiver != null ? <AvatarUser size="xs" imageSrc={receiver.avatar} /> : undefined}
              open={receivedByPop.open}
              onClick={(e: MouseEvent<HTMLDivElement>) => receivedByPop.toggle(e.currentTarget)}
            />
          </Input>
        </div>
      </div>

      {/* Branch — name over address, searchable by either (node 23810-17758). */}
      <SelectPopoverList
        pop={branchPop}
        mobile={mobile}
        title="Branch"
        searchable
        searchPlaceholder="Search by branch name or address"
      >
        <SelectListItemGroup>
          {BRANCHES.map((b) => (
            <SelectListItem
              key={b.name}
              label={b.name}
              caption={b.address}
              searchText={`${b.name} ${b.address}`}
              selected={b.name === branch}
              onClick={() => {
                setBranch(b.name);
                branchPop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      {/* Source — searchable, with an "Add source" footer → New source. */}
      <SelectPopoverList
        pop={sourcePop}
        mobile={mobile}
        title="Source"
        searchable
        searchPlaceholder="Search by source name..."
        noResultsCaption="Try a different search or add a new source"
        footer={
          <SelectListFooter>
            <MenuItem
              label="Add source"
              slotLeft={slot("plus")}
              onClick={() => {
                sourcePop.close();
                setNewSourceOpen(true);
              }}
            />
          </SelectListFooter>
        }
      >
        <SelectListItemGroup>
          {sortSources(sources).map((s) => (
            <SelectListItem
              key={s.name}
              label={s.name}
              slotLeft={s.hasAvatar === true ? <Avatar type="object" content="image" size="xs" /> : undefined}
              selected={s.name === source}
              onClick={() => {
                setSource(s.name);
                // Moving to a source that needs an ID starts that field empty
                // unless we are returning to the saved one.
                if (s.requireSourceId) setSourceId(s.name === initial.source ? initial.sourceId : "");
                sourcePop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      {/* Received by — every user, A→Z, searchable by name. */}
      <SelectPopoverList
        pop={receivedByPop}
        mobile={mobile}
        title="Received by"
        searchable
        searchPlaceholder="Search by user name..."
      >
        <SelectListItemGroup>
          {RECEIVED_BY_USERS.map((u) => (
            <SelectListItem
              key={u.id}
              label={staffSelectLabel(u)}
              slotLeft={<AvatarUser size="xs" imageSrc={u.avatar} />}
              selected={u.id === receivedBy}
              onClick={() => {
                setReceivedBy(u.id);
                receivedByPop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      <NewSourceForm open={newSourceOpen} onClose={() => setNewSourceOpen(false)} onCreate={createSource} mobile={mobile} />
    </Dialog>
  );
}
