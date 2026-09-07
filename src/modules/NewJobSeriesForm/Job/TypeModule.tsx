import { MouseEvent } from "react";

import AvatarJob from "../../../components/Avatar/AvatarJob";
import { AvatarJobStatus } from "../../../components/Avatar/AvatarJob.types";
import Button from "../../../components/Button/Button";
import Card from "../../../components/Card/Card";
import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import SelectField from "../../../components/Fields/SelectField/SelectField";
import FormModule from "../../../components/FormModule/FormModule";
import IconButton from "../../../components/IconButton/IconButton";
import Input from "../../../components/Input/Input";
import ItemGroup from "../../../components/ItemGroup/ItemGroup";
import ListItem from "../../../components/ListItem/ListItem";
import ListItemSlotIcon from "../../../components/ListItem/ListItemSlotIcon";
import RadioGroup from "../../../components/Radio/RadioGroup";
import RadioItem from "../../../components/Radio/RadioItem";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import HoverTooltip from "../../../components/Tooltip/HoverTooltip";
import { JOBS, jobsOf } from "../../../data/db";
import { Job } from "../../../data/db/types";
import { joinWithSeparator } from "../../../utils/textSeparator";
import { SelectPopoverList, useSelectPopover } from "../../shared/selectPopover";

import { jobCaption } from "./newJobData";
import { TypeModuleProps } from "./TypeModule.types";
import styles from "./TypeModule.module.scss";

// The "Type" module of the "New Job" form (Figma 24087-26056). Possible
// recalls sit ABOVE the New/Recall radios (the node's order): finalized jobs
// at the location from the last 90 days that match the picked service and/or
// equipment — "Set as recall" flips the type, fills "Recall to" and merges
// the job's equipment into the picks. The same candidates feed the "Recall
// to" list when Recall is picked by hand. Rows would open the Job Details
// page — clickable no-ops here, like Similar jobs.

const RECALL_WINDOW_DAYS = 90;

/**
 * Finalized jobs at the location within the window, latest first. The db has
 * no status-change date, so `scheduledFor` stands in for it (flagged).
 */
const recallCandidates = (locationId: string): Job[] => {
  const cutoff = Date.now() - RECALL_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return jobsOf(locationId)
    .filter((job) => job.status === "finalized")
    .filter((job) => job.scheduledFor == null || new Date(job.scheduledFor).getTime() >= cutoff)
    .sort((a, b) => (b.scheduledFor ?? "").localeCompare(a.scheduledFor ?? ""));
};

export default function TypeModule({
  value,
  onChange,
  onAddEquipment,
  onPrefillContacts,
  locationId,
  serviceName,
  equipmentIds,
  mobile,
}: TypeModuleProps) {
  const recallPop = useSelectPopover(mobile);

  const candidates = locationId ? recallCandidates(locationId) : [];
  const possible = candidates.filter(
    (job) =>
      (serviceName != null && job.serviceName === serviceName) ||
      job.equipmentIds.some((id) => equipmentIds.includes(id)),
  );
  const recallJob = value.recallJobId ? JOBS.find((job) => job.id === value.recallJobId) : undefined;

  // "Set as recall" (and picking in the list): flips the type, fills the
  // job, merges its equipment and pre-fills the empty contact fields.
  // Selecting another job simply replaces the previous pick.
  const setAsRecall = (job: Job) => {
    onChange({ type: "recall", recallJobId: job.id });
    onAddEquipment(job.equipmentIds);
    onPrefillContacts?.(job);
  };

  const jobRow = (job: Job, slotRight: React.ReactNode) => (
    <ListItem
      key={job.id}
      variant="titleCaption"
      title={joinWithSeparator(job.id, job.serviceName)}
      caption={jobCaption(job)}
      avatar={<AvatarJob size="xl" status={job.status as AvatarJobStatus} />}
      isClickable
      onClick={() => {}}
      slotRight={slotRight}
    />
  );

  return (
    <>
      <FormModule title="Type">
        <div className={styles.stack}>
          {possible.length > 0 && (
            <DisplayModule
              title="Possible recalls"
              caption="Match the selected service and/or the equipment"
              bodyPadded={false}
              content={
                <ItemGroup truncateAfter={3}>
                  {possible.map((job) =>
                    jobRow(
                      job,
                      <>
                        {value.recallJobId === job.id ? (
                          // text-success label + icon, non-interactive (the node).
                          <Button size="lg" variant="ghost" leftIcon="circle-check" className={styles.selectedButton}>
                            Selected
                          </Button>
                        ) : mobile ? (
                          // The button turns into an IconButton on mobile.
                          <HoverTooltip text="Set as recall">
                            <IconButton
                              icon="clock-rotate-left"
                              variant="subtle"
                              size="lg"
                              aria-label={`Set ${job.id} as recall`}
                              onClick={() => setAsRecall(job)}
                            />
                          </HoverTooltip>
                        ) : (
                          <Button
                            size="lg"
                            variant="subtle"
                            leftIcon="clock-rotate-left"
                            onClick={() => setAsRecall(job)}
                          >
                            Set as recall
                          </Button>
                        )}
                        <ListItemSlotIcon icon="arrow-up-right" />
                      </>,
                    ),
                  )}
                </ItemGroup>
              }
            />
          )}

          <RadioGroup
            value={value.type ?? undefined}
            onChange={(next) =>
              onChange({ type: next as "new" | "recall", recallJobId: next === "recall" ? value.recallJobId : null })
            }
          >
            <RadioItem value="new" icon="sparkle" iconPack="regular" label="New" />
            <RadioItem
              value="recall"
              icon="clock-rotate-left"
              iconPack="regular"
              label="Recall"
              content={
                value.type === "recall" ? (
                  <div className={styles.recallContent}>
                    <Input label="Recall to">
                      <SelectField
                        value={recallJob ? joinWithSeparator(recallJob.id, recallJob.serviceName) : undefined}
                        open={recallPop.open}
                        onClick={(event: MouseEvent<HTMLDivElement>) => recallPop.toggle(event.currentTarget)}
                      />
                    </Input>
                    {recallJob && (
                      // The whole CARD is the interactive surface (a no-op
                      // here); the row inside stays static but keeps its
                      // open-in-tab icon (Daniel, 2026-09-08).
                      <Card padding={4} onClick={() => {}}>
                        <ListItem
                          variant="titleCaption"
                          title={joinWithSeparator(recallJob.id, recallJob.serviceName)}
                          caption={jobCaption(recallJob)}
                          avatar={<AvatarJob size="xl" status={recallJob.status as AvatarJobStatus} />}
                          slotRight={<ListItemSlotIcon icon="arrow-up-right" />}
                        />
                      </Card>
                    )}
                  </div>
                ) : undefined
              }
            />
          </RadioGroup>
        </div>
      </FormModule>

      {/* The "Recall to" list (Figma 17209-66960): the same candidates. A
          location with none shows the empty state (23832-13192) — no action,
          just the explanation. */}
      <SelectPopoverList
        pop={recallPop}
        mobile={mobile}
        title="Recall to"
        searchable={candidates.length > 0}
        searchPlaceholder="Job..."
        noResultsCaption="Try a different search"
        state={candidates.length === 0 ? "empty" : "default"}
        emptyState={{
          icon: "wrench-simple",
          title: "No jobs here yet",
          caption: "No finalized jobs related to selected location",
        }}
      >
        <SelectListItemGroup>
          {candidates.map((job) => (
            <SelectListItem
              key={job.id}
              variant="object"
              label={joinWithSeparator(job.id, job.serviceName)}
              caption={jobCaption(job)}
              avatar={<AvatarJob size="xl" status={job.status as AvatarJobStatus} />}
              searchText={`${job.id} ${job.serviceName}`}
              selected={value.recallJobId === job.id}
              onClick={() => setAsRecall(job)}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </>
  );
}
