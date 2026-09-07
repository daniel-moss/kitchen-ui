import { MouseEvent, useState } from "react";

import AvatarUser from "../../../components/Avatar/AvatarUser";
import DateField from "../../../components/Fields/DateField/DateField";
import SelectField from "../../../components/Fields/SelectField/SelectField";
import TextField from "../../../components/Fields/TextField/TextField";
import FormModule from "../../../components/FormModule/FormModule";
import { Icon } from "../../../components/Icon/Icon";
import Input from "../../../components/Input/Input";
import MenuItem from "../../../components/Menu/MenuItem";
import SelectListFooter from "../../../components/SelectList/SelectListFooter";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import { BRANCHES, COMPANY, JOB_SOURCES, JOBS } from "../../../data/db";
import { JobSource } from "../../../data/db/types";
import { SelectPopoverList, useSelectPopover } from "../../shared/selectPopover";

import { JobPropertiesModuleProps } from "./JobPropertiesModule.types";
import NewSourceForm from "./NewSourceForm";
import { CURRENT_USER, locationAddress, usersSorted } from "./newJobData";
import styles from "./JobPropertiesModule.module.scss";

// The "Job Properties" module of the "New Job" form (Figma 17166-48347).
// Conditional fields: Job ID shows only when the company's custom-ID mode is
// "manual"; Source ID shows only when the picked source requires one. One
// branch would auto-select and turn the field read-only; several start empty.
// Date received auto-populates with the current day; Received by defaults to
// the current user (Lorne Riddle plays "you").

const DATE_HINT = "When did you first hear from the customer about this request?";

// Sources created in the flow — module scope so they survive step switches
// and form reopens (a reload starts fresh), like the dismissed tips.
const sessionSources: JobSource[] = [];

/** db sources + the ones created this session. */
const allSources = (): JobSource[] => [...JOB_SOURCES, ...sessionSources];

/** The source list label: "Name (ABBR)" when an abbreviation exists. */
const sourceLabel = (source: JobSource) => (source.prefix ? `${source.name} (${source.prefix})` : source.name);

/** True when the typed Job ID collides with an existing job. */
export const isJobIdDuplicate = (jobId: string): boolean =>
  jobId.trim() !== "" && JOBS.some((job) => job.id.toLowerCase() === jobId.trim().toLowerCase());

/** The step-validation rule for this module (Next gating). */
export const isJobPropertiesValid = (value: JobPropertiesModuleProps["value"]): boolean => {
  const source = allSources().find((row) => row.id === value.sourceId);
  return (
    (COMPANY.jobCustomIdGenerationMode !== "manual" || (value.jobId.trim() !== "" && !isJobIdDuplicate(value.jobId))) &&
    value.branchId != null &&
    (source?.requiresId !== true || value.sourceRef.trim() !== "") &&
    value.dateReceived != null &&
    value.receivedById != null
  );
};

export default function JobPropertiesModule({ value, onChange, showErrors = false, mobile }: JobPropertiesModuleProps) {
  const sourcePop = useSelectPopover(mobile);
  const branchPop = useSelectPopover(mobile);
  const receivedPop = useSelectPopover(mobile);
  const [newSourceOpen, setNewSourceOpen] = useState(false);

  const sources = allSources();
  const source = sources.find((row) => row.id === value.sourceId);
  const branch = value.branchId ? BRANCHES.find((row) => row.id === value.branchId) : undefined;
  const receivedBy = value.receivedById != null ? usersSorted().find((u) => u.id === value.receivedById) : undefined;

  const showJobId = COMPANY.jobCustomIdGenerationMode === "manual";
  const showSourceRef = source?.requiresId === true;
  const singleBranch = BRANCHES.length === 1;

  // The duplicate check is live (the node's second error message); the
  // missing-value errors wait for `showErrors`.
  const jobIdDuplicate = isJobIdDuplicate(value.jobId);

  const set = (patch: Partial<typeof value>) => onChange({ ...value, ...patch });

  const sourceField = (
    <Input label="Source">
      <SelectField
        value={source?.name}
        open={sourcePop.open}
        onClick={(event: MouseEvent<HTMLDivElement>) => sourcePop.toggle(event.currentTarget)}
      />
    </Input>
  );

  return (
    <>
      <FormModule title="Job properties">
        <div className={styles.fields}>
          {showJobId && (
            <Input label="Job ID">
              <TextField
                value={value.jobId}
                onChange={(event) => set({ jobId: event.target.value })}
                maxLength={15}
                isValid={!jobIdDuplicate && !(showErrors && value.jobId.trim() === "")}
                errorMessage={jobIdDuplicate ? "Job with this ID already exists" : undefined}
              />
            </Input>
          )}

          <Input label="Branch">
            <SelectField
              value={branch?.name}
              open={branchPop.open}
              readOnly={singleBranch || undefined}
              isValid={!(showErrors && value.branchId == null)}
              onClick={singleBranch ? undefined : (event: MouseEvent<HTMLDivElement>) => branchPop.toggle(event.currentTarget)}
            />
          </Input>

          {/* Source alone fills the row; with a required Source ID they
              share it side by side on desktop (the 2026-09-07 layout). */}
          {showSourceRef ? (
            <div className={mobile ? styles.fields : styles.row}>
              {sourceField}
              <Input label="Source ID">
                <TextField
                  value={value.sourceRef}
                  onChange={(event) => set({ sourceRef: event.target.value })}
                  maxLength={15}
                  isValid={!(showErrors && value.sourceRef.trim() === "")}
                />
              </Input>
            </div>
          ) : (
            sourceField
          )}

          <div className={mobile ? styles.fields : styles.row}>
            <Input label="Date received" labelHintContent={DATE_HINT}>
              <DateField
                value={value.dateReceived}
                onDateChange={(date) => set({ dateReceived: date })}
                breakpoint={mobile ? "mobile" : "desktop"}
                isValid={!(showErrors && value.dateReceived == null)}
              />
            </Input>
            <Input label="Received by">
              <SelectField
                value={receivedBy?.name}
                slotLeft={receivedBy ? <AvatarUser size="xs" imageSrc={receivedBy.avatar} /> : undefined}
                open={receivedPop.open}
                isValid={!(showErrors && value.receivedById == null)}
                onClick={(event: MouseEvent<HTMLDivElement>) => receivedPop.toggle(event.currentTarget)}
              />
            </Input>
          </div>
        </div>
      </FormModule>

      {/* The Source list (Figma 17181-58570): A→Z is not applied — the node
          keeps Direct first, then the integrations; created sources append. */}
      <SelectPopoverList
        pop={sourcePop}
        mobile={mobile}
        title="Source"
        searchable
        searchPlaceholder="Source..."
        noResultsCaption="Try a different search or add a new source"
        footer={
          <SelectListFooter>
            <MenuItem
              label="Add source"
              slotLeft={<Icon icon="plus" pack="regular" size={14} container="square" />}
              onClick={() => {
                sourcePop.close();
                setNewSourceOpen(true);
              }}
            />
          </SelectListFooter>
        }
      >
        <SelectListItemGroup>
          {sources.map((row) => (
            <SelectListItem
              key={row.id}
              variant="default"
              label={sourceLabel(row)}
              selected={value.sourceId === row.id}
              onClick={() => set({ sourceId: row.id, sourceRef: "" })}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      {/* The Branch list (Figma 17181-55806): name + address, A→Z, no
          search (Daniel, 2026-09-08). */}
      <SelectPopoverList pop={branchPop} mobile={mobile} title="Branch">
        <SelectListItemGroup>
          {[...BRANCHES]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((row) => (
              <SelectListItem
                key={row.id}
                variant="default"
                label={row.name}
                caption={locationAddress(row)}
                searchText={`${row.name} ${locationAddress(row)}`}
                selected={value.branchId === row.id}
                onClick={() => set({ branchId: row.id })}
              />
            ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      {/* The Received-by list (Figma 17181-53603): the techs pool, A→Z. */}
      <SelectPopoverList
        pop={receivedPop}
        mobile={mobile}
        title="Received by"
        searchable
        searchPlaceholder="User..."
        noResultsCaption="Try a different search"
      >
        <SelectListItemGroup>
          {usersSorted().map((user) => (
            <SelectListItem
              key={user.id}
              variant="default"
              label={user.name}
              slotLeft={<AvatarUser size="xs" imageSrc={user.avatar} />}
              selected={value.receivedById === user.id}
              onClick={() => set({ receivedById: user.id })}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      <NewSourceForm
        open={newSourceOpen}
        onClose={() => setNewSourceOpen(false)}
        onCreated={(created) => {
          sessionSources.push(created);
          set({ sourceId: created.id, sourceRef: "" });
        }}
        breakpoint={mobile ? "mobile" : "desktop"}
      />
    </>
  );
}
