import { MouseEvent, useEffect, useState } from "react";

import AvatarJob from "../../components/Avatar/AvatarJob";
import Button from "../../components/Button/Button";
import Card from "../../components/Card/Card";
import Dialog from "../../components/Dialog/Dialog";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import TextField from "../../components/Fields/TextField/TextField";
import { Icon } from "../../components/Icon/Icon";
import Input from "../../components/Input/Input";
import { IconPack } from "../../components/Icon/Icon.types";
import IconButton from "../../components/IconButton/IconButton";
import ListItem from "../../components/ListItem/ListItem";
import ListItemSlotIcon from "../../components/ListItem/ListItemSlotIcon";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import SelectListFooter from "../../components/SelectList/SelectListFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import { JOB_REASON_FOR_CALL, JOB_RECALL_TO, JOB_SERVICE, JOB_TECH_INSTRUCTIONS } from "./jobData";
import MenuItem from "../../components/Menu/MenuItem";
import { SelectPopoverList, useSelectPopover } from "../../forms/shared/selectPopover";
import { noop, slot } from "./shared";

import styles from "./ServiceForm.module.scss";

// ---- field data (per the "New Job" form fields documentation) ---------------

// Priorities (doc node 23833:15488, in order). Urgent is the only tinted icon.
interface Priority {
  value: string;
  icon: string;
  pack: IconPack;
  color?: string;
}
export const PRIORITIES: Priority[] = [
  { value: "No priority", icon: "hyphen", pack: "regular", color: "var(--gray-a9)" },
  { value: "Low", icon: "duotone-solid-priority-low", pack: "custom-duotone" },
  { value: "Medium", icon: "duotone-solid-priority-medium", pack: "custom-duotone" },
  { value: "High", icon: "solid-priority-high", pack: "custom" },
  { value: "Urgent", icon: "fire", pack: "solid", color: "var(--orange-9)" },
];
const priorityByValue = (v: string) => PRIORITIES.find((p) => p.value === v);

/** The priority value with its icon (SelectField value / list rows). Only the
 * ICON is tinted (Urgent orange, No-priority gray) — the label keeps the row's
 * default text color (node 23833:15488). */
const PriorityValue = ({ priority }: { priority: Priority }) => (
  <span className={styles.priority}>
    <span className={styles.priorityIcon} style={priority.color != null ? { color: priority.color } : undefined}>
      {/* square container: every priority glyph occupies the same 14×14 box */}
      <Icon icon={priority.icon} pack={priority.pack} size={14} container="square" />
    </span>
    {priority.value}
  </span>
);

// Demo services with their default priorities (doc: priority pre-fills from
// the service's default; A→Z sorting is the doc's list rule).
const INITIAL_SERVICES: { name: string; defaultPriority: string }[] = [
  { name: "Cooler maintenance", defaultPriority: "Low" },
  { name: JOB_SERVICE, defaultPriority: "Medium" }, // "Refrigeration repair"
  { name: "Standard labor", defaultPriority: "No priority" },
];

// Finalized jobs for the Recall-to list (doc: only Finalized jobs of the
// service location, sorted by status change). The demo job recalls JOB-10002.
const RECALL_JOBS = [JOB_RECALL_TO, "JOB-10003", "JOB-10004", "JOB-10005", "JOB-10006"].map((id) => ({
  id,
  title: `${id} ・ Standard labor`,
  caption: "Finalized on Jan 1, 2025 by Lorne R.",
}));

// Hint copies (doc nodes 23834:13338 / 23833:25459 — exact copy, incl. the
// design's "priotity" typo in the pre-filled help text below).
const TECH_INSTRUCTIONS_HINT =
  "Notes specific to this service. e.g. 'Ask client about replacing the unit.' or 'Make sure to collect payment on site.'";
const DEFAULT_PRIORITY_HINT =
  "When this service is selected, the priority is filled in with this value. It can still be changed.";
const PRIORITY_PREFILLED_HELP = "Pre-filled based on service's default priotity";

// ---- "New service" dialog (doc nodes 23833:15113 / 23833:15313) -------------

const NewServiceForm = ({
  open,
  onClose,
  onCreate,
  mobile,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, defaultPriority: string) => void;
  mobile: boolean;
}) => {
  const [name, setName] = useState("");
  const [priority, setPriority] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const priorityPop = useSelectPopover(mobile);

  useEffect(() => {
    if (open) return;
    setName("");
    setPriority("");
    setShowErrors(false);
    priorityPop.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Both fields are required (no "(optional)") — "Enter Name" /
  // "Choose Default priority" come from the component defaults.
  const create = () => {
    if (name.trim() === "" || priority === "") {
      setShowErrors(true);
      return;
    }
    onCreate(name.trim(), priority);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New service"
      breakpoint={mobile ? "mobile" : "desktop"}
      confirmOnDismiss={name !== "" || priority !== ""}
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
        <Input label="Default priority" labelHintContent={DEFAULT_PRIORITY_HINT}>
          <SelectField
            value={priority !== "" ? <PriorityValue priority={priorityByValue(priority)!} /> : undefined}
            isValid={!(showErrors && priority === "")}
            open={priorityPop.open}
            onClick={(e: MouseEvent<HTMLDivElement>) => priorityPop.toggle(e.currentTarget)}
          />
        </Input>
      </div>

      <SelectPopoverList pop={priorityPop} mobile={mobile} title="Default priority">
        <SelectListItemGroup>
          {PRIORITIES.map((p) => (
            <SelectListItem
              key={p.value}
              label={<PriorityValue priority={p} />}
              selected={p.value === priority}
              onClick={() => {
                setPriority(p.value);
                priorityPop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </Dialog>
  );
};

// ---- the "Service" edit form ------------------------------------------------

/** The Service module's values — owned by ServicePanel, edited here. */
export interface ServiceValues {
  reason: string;
  type: string; // "new" | "recall"
  recallTo: string | null;
  service: string;
  priority: string;
  tech: string;
}

// Type defaults to "new" (2026-07-28): a recall job has a PARENT, which locks
// the Location module's edit — the default job stays parent-free so the
// change-location flow is demoable; picking a recall in the Service form
// hides the pencil live.
export const defaultServiceValues = (): ServiceValues => ({
  reason: JOB_REASON_FOR_CALL,
  type: "new",
  recallTo: null,
  service: JOB_SERVICE,
  priority: "Medium",
  tech: JOB_TECH_INSTRUCTIONS,
});

interface ServiceFormProps {
  open: boolean;
  onClose: () => void;
  initial: ServiceValues;
  /** Commits the edited values — the Service module re-renders from them. */
  onSave: (next: ServiceValues) => void;
  mobile?: boolean;
}

// "Service" edit form — plain fields (no FormModule), per the "New Job" form
// fields documentation (node 17204-60160): Reason for call (required TextArea),
// Type (required CARD radios New/Recall), Recall to (required select when
// Recall — Finalized-jobs list + selected-job Card with a Remove button),
// Service (required searchable select + "Add service" footer → New service
// dialog), Priority (shown once a Service is picked; PRE-FILLS from the
// service's default with a help text that disappears when adjusted), and
// optional Tech instructions with a hint.
export default function ServiceForm({ open, onClose, initial, onSave, mobile = false }: ServiceFormProps) {
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [reason, setReason] = useState(initial.reason);
  const [type, setType] = useState(initial.type);
  const [recallTo, setRecallTo] = useState<string | null>(initial.recallTo);
  const [service, setService] = useState(initial.service);
  const [priority, setPriority] = useState(initial.priority);
  const [tech, setTech] = useState(initial.tech);
  const [showErrors, setShowErrors] = useState(false);
  const [newServiceOpen, setNewServiceOpen] = useState(false);

  const recallPop = useSelectPopover(mobile);
  const servicePop = useSelectPopover(mobile);
  const priorityPop = useSelectPopover(mobile);

  // A fresh open resets the draft to the saved values.
  useEffect(() => {
    if (!open) return;
    setReason(initial.reason);
    setType(initial.type);
    setRecallTo(initial.recallTo);
    setService(initial.service);
    setPriority(initial.priority);
    setTech(initial.tech);
    setShowErrors(false);
    setNewServiceOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => {
    if (open) return;
    recallPop.close();
    servicePop.close();
    priorityPop.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const serviceDefault = services.find((s) => s.name === service)?.defaultPriority;
  // The pre-filled help text shows only while the priority IS the service's
  // default; adjusting the priority removes it (doc node 21162:48794).
  const priorityPrefilled = service !== "" && priority === serviceDefault;

  const pickService = (name: string) => {
    setService(name);
    // Pre-fill the priority from the service's default.
    const def = services.find((s) => s.name === name)?.defaultPriority;
    if (def != null) setPriority(def);
    servicePop.close();
  };

  // "Add service" (list footer / empty state): creates the service, selects it
  // and pre-fills its default priority (passed directly — the `services` state
  // is stale inside this handler).
  const createService = (name: string, defaultPriority: string) => {
    setServices((prev) => [...prev, { name, defaultPriority }].sort((a, b) => a.name.localeCompare(b.name)));
    setService(name);
    setPriority(defaultPriority);
    servicePop.close();
  };

  const recallJob = RECALL_JOBS.find((j) => j.id === recallTo);

  // Dirty = any value differs from the saved ones → the Dialog warns before
  // discarding (close X / scrim).
  const dirty =
    reason !== initial.reason ||
    type !== initial.type ||
    recallTo !== initial.recallTo ||
    service !== initial.service ||
    priority !== initial.priority ||
    tech !== initial.tech;

  const save = () => {
    if (reason.trim() === "" || type === "" || (type === "recall" && recallTo == null) || service === "") {
      setShowErrors(true);
      return;
    }
    onSave({ reason: reason.trim(), type, recallTo: type === "recall" ? recallTo : null, service, priority, tech });
    toast({ type: "success", title: '"Service" module updated' });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Service"
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
      <div className={styles.form}>
        <Input label="Reason for call">
          <TextArea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            isValid={!(showErrors && reason.trim() === "")}
          />
        </Input>

        {/* Type — vertical CARD radios with icons (updated doc 23940:6129:
            sparkle = New, clock-rotate-left = Recall). Selecting Recall
            EXPANDS the card: the Recall-to picker + the chosen job's Card live
            INSIDE its content slot (23939:21239), like BillingForm's
            "different client" card. preventDefault keeps clicks inside the
            picker from re-toggling the radio (the whole card is a <label>). */}
        <Input label="Type">
          <RadioGroup value={type} onChange={setType} isValid={!(showErrors && type === "")}>
            <RadioItem value="new" variant="card" label="New" icon="sparkle" iconPack="regular" />
            <RadioItem
              value="recall"
              variant="card"
              label="Recall"
              icon="clock-rotate-left"
              iconPack="regular"
              content={
                <div className={styles.recall} onClick={(e) => e.preventDefault()}>
                  <Input label="Recall to">
                    <SelectField
                      value={recallJob?.title}
                      isValid={!(showErrors && recallTo == null)}
                      open={recallPop.open}
                      onClick={(e: MouseEvent<HTMLDivElement>) => recallPop.toggle(e.currentTarget)}
                    />
                  </Input>
                  {recallJob != null && (
                    // The chosen job's Card opens the job page in a new tab
                    // per the doc annotation (display-only here). Only the
                    // CARD is clickable — the ListItem inside is static
                    // (Daniel, 2026-07-29).
                    <Card padding={4} onClick={noop}>
                      <ListItem
                        variant="titleCaption"
                        title={recallJob.title}
                        caption={recallJob.caption}
                        avatar={<AvatarJob size="xl" status="finalized" />}
                        slotRight={<ListItemSlotIcon icon="arrow-up-right" />}
                      />
                    </Card>
                  )}
                </div>
              }
            />
          </RadioGroup>
        </Input>

        <Input label="Service">
          <SelectField
            value={service || undefined}
            isValid={!(showErrors && service === "")}
            open={servicePop.open}
            onClick={(e: MouseEvent<HTMLDivElement>) => servicePop.toggle(e.currentTarget)}
          />
        </Input>

        {/* Priority — only once a Service is picked (doc annotation). */}
        {service !== "" && (
          <Input label="Priority" helpText={priorityPrefilled ? PRIORITY_PREFILLED_HELP : undefined}>
            <SelectField
              value={<PriorityValue priority={priorityByValue(priority) ?? PRIORITIES[0]} />}
              open={priorityPop.open}
              onClick={(e: MouseEvent<HTMLDivElement>) => priorityPop.toggle(e.currentTarget)}
            />
          </Input>
        )}

        <Input label="Tech instructions" labelCondition="optional" labelHintContent={TECH_INSTRUCTIONS_HINT}>
          <TextArea value={tech} onChange={(e) => setTech(e.target.value)} />
        </Input>
      </div>

      {/* Recall-to: Finalized jobs, searchable by ID or service name. */}
      <SelectPopoverList
        pop={recallPop}
        mobile={mobile}
        title="Recall to"
        searchable
        searchPlaceholder="Search by ID or service name..."
      >
        <SelectListItemGroup>
          {RECALL_JOBS.map((j) => (
            <SelectListItem
              key={j.id}
              variant="object"
              label={j.title}
              caption={j.caption}
              avatar={<AvatarJob size="xl" status="finalized" />}
              selected={j.id === recallTo}
              onClick={() => {
                setRecallTo(j.id);
                recallPop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      {/* Service list: searchable A→Z + "Add service" footer → New service. */}
      <SelectPopoverList
        pop={servicePop}
        mobile={mobile}
        title="Service"
        searchable
        searchPlaceholder="Search by service name..."
        noResultsCaption="Try a different search or add a new service"
        footer={
          <SelectListFooter>
            <MenuItem
              label="Add service"
              slotLeft={slot("plus")}
              onClick={() => {
                servicePop.close();
                setNewServiceOpen(true);
              }}
            />
          </SelectListFooter>
        }
      >
        <SelectListItemGroup>
          {[...services]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((s) => (
              <SelectListItem key={s.name} label={s.name} selected={s.name === service} onClick={() => pickService(s.name)} />
            ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      {/* Priority list (icons per option). */}
      <SelectPopoverList pop={priorityPop} mobile={mobile} title="Priority">
        <SelectListItemGroup>
          {PRIORITIES.map((p) => (
            <SelectListItem
              key={p.value}
              label={<PriorityValue priority={p} />}
              selected={p.value === priority}
              onClick={() => {
                setPriority(p.value);
                priorityPop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      <NewServiceForm open={newServiceOpen} onClose={() => setNewServiceOpen(false)} onCreate={createService} mobile={mobile} />
    </Dialog>
  );
}
