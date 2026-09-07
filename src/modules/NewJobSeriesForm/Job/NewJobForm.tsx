import { useEffect, useState } from "react";

import Button from "../../../components/Button/Button";
import Dialog from "../../../components/Dialog/Dialog";
import { Divider } from "../../../components/Divider/Divider";
import HoverHint from "../../../components/Hint/HoverHint";
import StepItem from "../../../components/StepItemGroup/StepItem";
import StepItemGroup from "../../../components/StepItemGroup/StepItemGroup";
import { toast } from "../../../components/Toast/Toaster";
import useIsDesktop from "../../../hooks/useIsDesktop";
import { clientById, locationById } from "../../../data/db";

import { BRANCHES, equipmentById, JOB_FORMS } from "../../../data/db";

import AssigneesModule from "./AssigneesModule";
import BillingIntentionModule, { isBillingValid } from "./BillingIntentionModule";
import { BillingSelection } from "./BillingIntentionModule.types";
import EquipmentModule, { equipmentRowOf } from "./EquipmentModule";
import { ManagedFile } from "../../AddFilesForm/files";

import FilesModule from "./FilesModule";
import FormsModule from "./FormsModule";
import { FormPick } from "./FormsModule.types";
import JobContactsModule from "./JobContactsModule";
import { JobContactsSelection, SelectedContact } from "./JobContactsModule.types";
import JobPropertiesModule, { isJobPropertiesValid } from "./JobPropertiesModule";
import { JobProperties } from "./JobPropertiesModule.types";
import LabelsModule from "./LabelsModule";
import ScheduleDetailsModule, { isScheduleValid } from "./ScheduleDetailsModule";
import { ScheduleSelection } from "./ScheduleDetailsModule.types";
import ServiceDetailsModule, { serviceNameOf } from "./ServiceDetailsModule";
import { ServiceDetails } from "./ServiceDetailsModule.types";
import TypeModule from "./TypeModule";
import { JobTypeSelection } from "./TypeModule.types";
import LocationModule from "./LocationModule";
import { SelectedLocation } from "./LocationModule.types";
import { CURRENT_USER } from "./newJobData";
import styles from "./NewJobForm.module.scss";
import { NewJobFormProps } from "./NewJobForm.types";

// "New Job" Form — the three-step job creation flow (Figma «"New Job" Form —
// Next Update»; the series flow is deferred). This is the SHELL: Dialog
// `focus` owns the header, the step stack, and the action bar (Cancel/Back ·
// Save as draft · Next/Create); the step bodies are placeholders that the
// real modules replace one by one.
//
// Behavior (from the Figma dev notes):
// - No jumping forward: only "Next" advances. Completed steps ARE clickable
//   to go back (Daniel, 2026-09-07).
// - "Save as draft" exists on the Service step only; disabled until "Reason
//   for call" is filled, with a Hint explaining why.
// - Dismissing warns (Prompt) only while the form holds unsaved changes.

const STEPS = ["Details", "Service", "Schedule"] as const;

// The Job properties defaults (the dev notes): today, the current user,
// Direct source, and the lone branch when there is exactly one.
const defaultJobProps = (): JobProperties => ({
  jobId: "",
  branchId: BRANCHES.length === 1 ? BRANCHES[0].id : null,
  sourceId: "direct",
  sourceRef: "",
  dateReceived: new Date(),
  receivedById: CURRENT_USER.id,
});

const NO_CONTACTS: JobContactsSelection = { reporter: null, siteSupervisor: null };

// "Schedule now" is selected by default (the dev note on the radios).
const defaultSchedule = (): ScheduleSelection => ({ mode: "now", date: null, time: null, durationMinutes: null });

const defaultServiceDetails = (): ServiceDetails => ({
  serviceId: null,
  priority: null,
  priorityAdjusted: false,
  techInstructions: "",
});

export default function NewJobForm({
  open,
  onClose,
  onCreated,
  onSavedAsDraft,
  onEditDraft,
  breakpoint = "auto",
}: NewJobFormProps) {
  const [step, setStep] = useState(0);
  const isDesktop = useIsDesktop(breakpoint);
  // The Service step's "Reason for call" — lifted here because the action
  // bar's Save-as-draft gate reads it.
  const [reasonForCall, setReasonForCall] = useState("");
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails>(defaultServiceDetails);
  const [showServiceErrors, setShowServiceErrors] = useState(false);
  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const [billing, setBilling] = useState<BillingSelection>({ intention: null, billingClientId: null });
  const [jobProps, setJobProps] = useState<JobProperties>(defaultJobProps);
  const [labels, setLabels] = useState<string[]>([]);
  const [equipmentIds, setEquipmentIds] = useState<string[]>([]);
  const [jobType, setJobType] = useState<JobTypeSelection>({ type: null, recallJobId: null });
  const [contacts, setContacts] = useState<JobContactsSelection>(NO_CONTACTS);
  const [formPicks, setFormPicks] = useState<FormPick[]>([]);
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [schedule, setSchedule] = useState<ScheduleSelection>(defaultSchedule);
  const [assignees, setAssignees] = useState<number[]>([]);
  const [showScheduleErrors, setShowScheduleErrors] = useState(false);
  // Flipped by a blocked "Next"; the fields then show their errors live.
  const [showDetailsErrors, setShowDetailsErrors] = useState(false);
  // Anything filled = dismissing warns.
  const isDirty = location != null;

  const detailsValid = location != null && isBillingValid(billing) && isJobPropertiesValid(jobProps);

  // Picking a location auto-populates the billing intention: the location's
  // default wins, then the client's, then "Bill to this location". Changing
  // the location re-populates.
  const applyLocation = (next: SelectedLocation) => {
    // A blocked "Next" before any location only complained about the
    // location. Picking one reveals the other modules — they start CLEAN,
    // not pre-invalid; the next "Next" judges them fresh.
    if (location == null) setShowDetailsErrors(false);
    // A location change clears the data that belongs to the old location —
    // the "Change location?" Prompt warned about it (equipment for now; the
    // job contacts join when their module lands).
    if (location != null && next.id !== location.id) {
      setEquipmentIds([]);
      setJobType({ type: null, recallJobId: null });
      setContacts(NO_CONTACTS);
    }
    setLocation(next);
    const dbLocation = next.id ? locationById(next.id) : undefined;
    const dbClient = next.clientId ? clientById(next.clientId) : undefined;
    const intention = dbLocation?.defaultBillingIntention ?? dbClient?.defaultBillingIntention ?? "location";
    setBilling({
      intention,
      billingClientId: intention === "differentClient" ? (dbLocation?.defaultBillingClientId ?? null) : null,
    });
  };

  // A closed form reopens fresh.
  useEffect(() => {
    if (!open) {
      setStep(0);
      setLocation(null);
      setBilling({ intention: null, billingClientId: null });
      setJobProps(defaultJobProps());
      setLabels([]);
      setEquipmentIds([]);
      setJobType({ type: null, recallJobId: null });
      setContacts(NO_CONTACTS);
      setFormPicks([]);
      setFiles([]);
      setSchedule(defaultSchedule());
      setAssignees([]);
      setShowScheduleErrors(false);
      setShowDetailsErrors(false);
      setReasonForCall("");
      setServiceDetails(defaultServiceDetails());
      setShowServiceErrors(false);
    }
  }, [open]);

  // "Next" validates the current step: a blocked step shows its errors and
  // stays (the missing-value states across the modules are the signal).
  const serviceValid = reasonForCall.trim() !== "" && serviceDetails.serviceId != null;

  // Forms required by the picked service or equipment auto-JOIN the picks
  // (public, not removable) and leave again when their trigger goes away.
  useEffect(() => {
    const required: FormPick[] = JOB_FORMS.flatMap((form) => {
      if (serviceDetails.serviceId != null && form.requiredForServiceIds?.includes(serviceDetails.serviceId)) {
        return [
          {
            key: `required-${form.id}`,
            formId: form.id,
            requiredFor: serviceNameOf(serviceDetails.serviceId),
            visibility: "public" as const,
          },
        ];
      }
      const trigger = equipmentIds
        .map((id) => equipmentById(id) ?? equipmentRowOf(id))
        .find((row) => row != null && form.requiredForEquipmentCategories?.includes(row.category));
      if (trigger) {
        return [
          { key: `required-${form.id}`, formId: form.id, requiredFor: trigger.displayName, visibility: "public" as const },
        ];
      }
      return [];
    });
    setFormPicks((current) => {
      const kept = current.filter(
        (pick) => pick.requiredFor == null || required.some((row) => row.formId === pick.formId),
      );
      const missing = required.filter((row) => !kept.some((pick) => pick.requiredFor != null && pick.formId === row.formId));
      return missing.length > 0 || kept.length !== current.length ? [...kept, ...missing] : current;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceDetails.serviceId, equipmentIds.join(",")]);

  const next = () => {
    if (step === 0 && !detailsValid) {
      setShowDetailsErrors(true);
      return;
    }
    if (step === 1 && !serviceValid) {
      setShowServiceErrors(true);
      return;
    }
    setStep((current) => Math.min(STEPS.length - 1, current + 1));
  };

  const saveDraft = () => {
    onClose();
    toast({
      type: "success",
      title: "Job saved as draft",
      cta: { children: "Edit", leftIcon: "pen", onClick: () => onEditDraft?.() },
    });
    onSavedAsDraft?.();
  };

  // "Create" validates the Schedule step the way "Next" validates the others:
  // a blocked Create shows the missing-value errors and stays.
  const create = () => {
    if (!isScheduleValid(schedule)) {
      setShowScheduleErrors(true);
      return;
    }
    onClose();
    toast({ type: "success", title: "Job created" });
    onCreated?.();
  };

  const stepGroup = (
    <StepItemGroup>
      {STEPS.map((label, index) => (
        <StepItem
          key={label}
          label={label}
          progress={index === step ? "current" : index < step ? "completed" : "incompleted"}
          onClick={index < step ? () => setStep(index) : undefined}
        />
      ))}
    </StepItemGroup>
  );

  // "Save as draft" — Service step only. While disabled, hovering (or, on
  // mobile, tapping) explains what unlocks it.
  const draftDisabled = reasonForCall.trim() === "";
  const draftButton = (
    <Button size="lg" variant="ghost" isDisabled={draftDisabled} onClick={saveDraft}>
      Save as draft
    </Button>
  );
  const secondaryAction =
    step === 1 ? (
      draftDisabled ? (
        <HoverHint caption='Provide "Reason for call" to save as draft' position="top" align="center">
          {draftButton}
        </HoverHint>
      ) : (
        draftButton
      )
    ) : undefined;

  return (
    <Dialog
      type="focus"
      open={open}
      onClose={onClose}
      title="New job"
      breakpoint={breakpoint}
      stepGroup={stepGroup}
      currentStep={step}
      stepCount={STEPS.length}
      onBack={() => setStep((current) => Math.max(0, current - 1))}
      onNext={next}
      onFinish={create}
      finalActionLabel="Create"
      secondaryAction={secondaryAction}
      confirmOnDismiss={isDirty}
    >
      <div className={styles.column}>
        {step === 0 ? (
          <>
            <LocationModule
              value={location}
              onChange={applyLocation}
              wouldClear={[
                ...(equipmentIds.length > 0 ? ["Equipment"] : []),
                ...(contacts.reporter ? ["Job reporter"] : []),
                ...(contacts.siteSupervisor ? ["Site supervisor"] : []),
              ]}
              isValid={!(showDetailsErrors && location == null)}
              mobile={!isDesktop}
            />
            {/* The rest of the Details modules show up only once a location
                is selected (the dev note on the Form frame). */}
            {location && (
              <>
                <Divider />
                <BillingIntentionModule
                  value={billing}
                  onChange={setBilling}
                  location={location}
                  showErrors={showDetailsErrors}
                  mobile={!isDesktop}
                />
                <Divider />
                <JobPropertiesModule
                  value={jobProps}
                  onChange={setJobProps}
                  showErrors={showDetailsErrors}
                  mobile={!isDesktop}
                />
                <Divider />
                <LabelsModule value={labels} onChange={setLabels} mobile={!isDesktop} />
              </>
            )}
          </>
        ) : step === 1 ? (
          <>
            <ServiceDetailsModule
              reason={reasonForCall}
              onReasonChange={setReasonForCall}
              value={serviceDetails}
              onChange={setServiceDetails}
              locationId={location?.id}
              showErrors={showServiceErrors}
              mobile={!isDesktop}
            />
            <Divider />
            <EquipmentModule
              value={equipmentIds}
              onChange={setEquipmentIds}
              locationId={location?.id}
              locationLabel={location ? (location.name ?? location.address) : undefined}
              mobile={!isDesktop}
            />
            <Divider />
            <TypeModule
              value={jobType}
              onChange={setJobType}
              onAddEquipment={(ids) => setEquipmentIds((current) => [...current, ...ids.filter((id) => !current.includes(id))])}
              onPrefillContacts={(job) => {
                // Empty fields only — never overwrite silently (the dev notes).
                const from = (contact?: { name?: string; phone?: string; email?: string }): SelectedContact | null =>
                  contact ? { name: contact.name, phone: contact.phone, email: contact.email } : null;
                setContacts((current) => ({
                  reporter: current.reporter ?? from(job.reporter),
                  siteSupervisor: current.siteSupervisor ?? from(job.pointOfContact),
                }));
              }}
              locationId={location?.id}
              serviceName={serviceNameOf(serviceDetails.serviceId)}
              equipmentIds={equipmentIds}
              mobile={!isDesktop}
            />
            <Divider />
            <JobContactsModule
              value={contacts}
              onChange={setContacts}
              locationId={location?.id}
              clientId={location?.clientId}
              billingClientId={billing.intention === "differentClient" ? billing.billingClientId : null}
              mobile={!isDesktop}
            />
            <Divider />
            <FormsModule value={formPicks} onChange={setFormPicks} mobile={!isDesktop} />
            <Divider />
            <FilesModule value={files} onChange={setFiles} mobile={!isDesktop} />
          </>
        ) : (
          <>
            <ScheduleDetailsModule
              value={schedule}
              onChange={setSchedule}
              showErrors={showScheduleErrors}
              mobile={!isDesktop}
            />
            <Divider />
            <AssigneesModule value={assignees} onChange={setAssignees} mobile={!isDesktop} />
          </>
        )}
      </div>
    </Dialog>
  );
}
