import { MouseEvent, useState } from "react";

import AvatarJob from "../../../components/Avatar/AvatarJob";
import { AvatarJobStatus } from "../../../components/Avatar/AvatarJob.types";
import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import SelectField from "../../../components/Fields/SelectField/SelectField";
import TextArea from "../../../components/Fields/TextArea/TextArea";
import FormModule from "../../../components/FormModule/FormModule";
import { Icon } from "../../../components/Icon/Icon";
import Input from "../../../components/Input/Input";
import ItemGroup from "../../../components/ItemGroup/ItemGroup";
import ListItem from "../../../components/ListItem/ListItem";
import ListItemSlotIcon from "../../../components/ListItem/ListItemSlotIcon";
import MenuItem from "../../../components/Menu/MenuItem";
import SelectListFooter from "../../../components/SelectList/SelectListFooter";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import { SERVICES } from "../../../data/db";
import { Service } from "../../../data/db/types";
import { joinWithSeparator } from "../../../utils/textSeparator";
import { SelectPopoverList, useSelectPopover } from "../../shared/selectPopover";

import NewServiceForm from "../../NewServiceForm/NewServiceForm";
import { jobCaption, PRIORITY_OPTIONS, priorityOf, similarJobs } from "./newJobData";
import { ServiceDetailsModuleProps } from "./ServiceDetailsModule.types";
import styles from "./ServiceDetailsModule.module.scss";

// The "Details" module of the Service step (Figma 17204-60160). The first
// field is the labeled "Reason for call" TextArea — it also gates "Save as
// draft". Picking a service reveals Similar
// jobs (open jobs at this location for the same service, 3 max + "Show N
// more") and Priority, pre-filled from the service's default with a help
// text that disappears once the user changes it. The job rows would open
// the Job Details page in a new tab — out of scope, so they stay static.

const TECH_HINT =
  "Notes specific to this service. e.g. 'Ask client about replacing the unit.' or " +
  "'Make sure to collect payment on site.'";

// Services created in the flow — module scope, like sources and labels.
const sessionServices: Service[] = [];

const allServices = (): Service[] => [...SERVICES, ...sessionServices];

/** Resolve a picked service's name (db or session-created) — e.g. for the Type module's recall match. */
export const serviceNameOf = (serviceId: string | null): string | undefined =>
  serviceId != null ? allServices().find((row) => row.id === serviceId)?.name : undefined;

/** Resolve the whole picked service record (db or session-created) — e.g. for the Schedule step's duration pre-fill. */
export const serviceOf = (serviceId: string | null): Service | undefined =>
  serviceId != null ? allServices().find((row) => row.id === serviceId) : undefined;

export default function ServiceDetailsModule({
  reason,
  onReasonChange,
  value,
  onChange,
  locationId,
  showErrors = false,
  mobile,
}: ServiceDetailsModuleProps) {
  const servicePop = useSelectPopover(mobile);
  const priorityPop = useSelectPopover(mobile);
  const [newServiceOpen, setNewServiceOpen] = useState(false);

  const services = allServices().sort((a, b) => a.name.localeCompare(b.name));
  const service = value.serviceId ? allServices().find((row) => row.id === value.serviceId) : undefined;
  const matches = service && locationId ? similarJobs(locationId, service.name) : [];
  const priorityDef = priorityOf(value.priority);

  // Picking a service pre-fills the priority from its default (the help
  // text returns until the user adjusts it again).
  const pickService = (row: Service) =>
    onChange({ ...value, serviceId: row.id, priority: row.defaultPriority, priorityAdjusted: false });

  const priorityIcon = (option: 1 | 2 | 3 | 4 | null) => {
    const def = priorityOf(option);
    return (
      <Icon
        icon={def.icon}
        pack={def.pack}
        size={14}
        container="square"
        className={def.isUrgent ? styles.urgent : undefined}
      />
    );
  };

  return (
    <>
      <FormModule title="Details">
        <div className={styles.fields}>
          <Input label="Reason for call">
            <TextArea
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              isValid={!(showErrors && reason.trim() === "")}
            />
          </Input>

          <Input label="Service">
            <SelectField
              value={service?.name}
              open={servicePop.open}
              isValid={!(showErrors && value.serviceId == null)}
              onClick={(event: MouseEvent<HTMLDivElement>) => servicePop.toggle(event.currentTarget)}
            />
          </Input>

          {service && matches.length > 0 && (
            <DisplayModule
              title="Similar jobs"
              bodyPadded={false}
              content={
                <ItemGroup truncateAfter={3}>
                  {matches.map((job) => (
                    // Clickable (hover/press affordance) but a no-op: the row
                    // would open the Job Details page in a new tab — out of
                    // scope (Daniel, 2026-09-08). arrow-up-right = the copy
                    // doc's "opens in a separate tab" slot icon.
                    <ListItem
                      key={job.id}
                      variant="titleCaption"
                      title={joinWithSeparator(job.id, job.serviceName)}
                      caption={jobCaption(job)}
                      avatar={<AvatarJob size="xl" status={job.status as AvatarJobStatus} />}
                      slotRight={<ListItemSlotIcon icon="arrow-up-right" />}
                      isClickable
                      onClick={() => {}}
                    />
                  ))}
                </ItemGroup>
              }
            />
          )}

          {service && (
            <Input
              label="Priority"
              helpText={value.priorityAdjusted ? undefined : "Pre-filled based on the service default priority"}
            >
              <SelectField
                value={priorityDef.label}
                slotLeft={priorityIcon(value.priority)}
                open={priorityPop.open}
                onClick={(event: MouseEvent<HTMLDivElement>) => priorityPop.toggle(event.currentTarget)}
              />
            </Input>
          )}

          <Input label="Tech instructions" labelCondition="optional" labelHintContent={TECH_HINT}>
            <TextArea
              value={value.techInstructions}
              onChange={(event) => onChange({ ...value, techInstructions: event.target.value })}
            />
          </Input>
        </div>
      </FormModule>

      {/* The Service list (Figma 17205-67348): A→Z, search, "Add service". */}
      <SelectPopoverList
        pop={servicePop}
        mobile={mobile}
        title="Service"
        searchable={services.length > 0}
        searchPlaceholder="Service..."
        noResultsCaption="Try a different search or add a new service"
        state={services.length === 0 ? "empty" : "default"}
        emptyState={{
          icon: "wrench-simple",
          title: "No services here yet",
          caption: "Add service to see it here",
          actionLabel: "Add service",
          onAction: () => {
            servicePop.close();
            setNewServiceOpen(true);
          },
        }}
        footer={
          services.length > 0 ? (
            <SelectListFooter>
              <MenuItem
                label="Add service"
                slotLeft={<Icon icon="plus" pack="regular" size={14} container="square" />}
                onClick={() => {
                  servicePop.close();
                  setNewServiceOpen(true);
                }}
              />
            </SelectListFooter>
          ) : undefined
        }
      >
        <SelectListItemGroup>
          {services.map((row) => (
            <SelectListItem
              key={row.id}
              variant="default"
              label={row.name}
              selected={value.serviceId === row.id}
              onClick={() => pickService(row)}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      {/* The Priority list (the "Priority Options" doc, 23833-15685). */}
      <SelectPopoverList pop={priorityPop} mobile={mobile} title="Priority">
        <SelectListItemGroup>
          {PRIORITY_OPTIONS.map((option) => (
            <SelectListItem
              key={priorityOf(option).label}
              variant="default"
              label={priorityOf(option).label}
              slotLeft={priorityIcon(option)}
              selected={value.priority === option}
              onClick={() => onChange({ ...value, priority: option, priorityAdjusted: true })}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      <NewServiceForm
        open={newServiceOpen}
        onClose={() => setNewServiceOpen(false)}
        onCreated={(created) => {
          sessionServices.push(created);
          pickService(created);
        }}
        breakpoint={mobile ? "mobile" : "desktop"}
      />
    </>
  );
}
