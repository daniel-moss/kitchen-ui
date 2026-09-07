import { FormAnswers, FormMediaAnswer } from "../../modules/formSchema/schema.types";
import { Equipment, EquipmentAvatar, equipmentCaption, equipmentLabel } from "./equipment";
import { HotSideDraft } from "./HotSideRepairForm";
import { HvacPmStepDraft } from "./HvacPmStepForm";
import { IceMachineDraft } from "./IceMachineRepairForm";
import { MediaItem } from "./mediaItem";
import { ServiceCallDraft } from "./ServiceCallForm";

// Turns a filled form draft into the flat answers the schema preview reads.
// The keys match the schema's field keys, NOT the draft's field names (the
// draft stores an equipment id and split hour/minute strings).

const objectAnswer = (equipment?: Equipment) =>
  equipment == null
    ? undefined
    : {
        title: equipmentLabel(equipment),
        caption: equipmentCaption(equipment),
        avatar: <EquipmentAvatar equipment={equipment} />,
      };

const files = (items: MediaItem[] | undefined): FormMediaAnswer[] | undefined =>
  items == null || items.length === 0 ? undefined : items;

export const serviceCallAnswers = (draft: ServiceCallDraft, equipment: Equipment[]): FormAnswers => ({
  equipment: objectAnswer(equipment.find((e) => e.id === draft.equipmentId)),
  voltage: draft.voltage,
  phase: draft.phase,
  gas: draft.gas,
  warranty: draft.warranty,
  warrantyCovered: draft.warrantyCovered,
  verifiedMfg: draft.verifiedMfg,
  csiSticker: draft.csiSticker,
  operationalOnArrival: draft.operationalOnArrival,
  diagnosisSteps: draft.diagnosisSteps,
  confirmedIssue: draft.confirmedIssue,
  repairCompleted: draft.repairCompleted,
  repairsCompleted: draft.repairsCompleted,
  partsInstalled: draft.partsInstalled,
  maintenanced: draft.maintenanced,
  fullyOperational: draft.fullyOperational,
  repairsRequired: draft.repairsRequired,
  partsNeeded: draft.partsNeeded,
  techs: draft.techs,
  time: { hours: draft.hours, minutes: draft.minutes },
  payment: draft.payment,
  notes: draft.notes,
});

export const hotSideAnswers = (draft: HotSideDraft, equipment: Equipment[]): FormAnswers => ({
  checkIn: draft.checkIn,
  equipment: objectAnswer(equipment.find((e) => e.id === draft.equipmentId)),
  reportedIssue: draft.reportedIssue,
  operatingOnArrival: draft.operatingOnArrival,
  temperature: draft.temperature,
  issuesText: draft.issuesText,
  actionsTaken: draft.actionsTaken,
  safetyConcerns: draft.safetyConcerns,
  functioningOnDeparture: draft.functioningOnDeparture,
  needReturn: draft.needReturn,
  partsPicture: draft.partsPicture,
  checkOut: draft.checkOut,
  // Every MediaField answer, keyed exactly like the schema's media fields.
  ...Object.fromEntries(Object.entries(draft.media).map(([key, items]) => [key, files(items)])),
});

/**
 * The stepper draft as flat answers. Its checklist answers are already keyed
 * "<section>:<question>" like the schema's fields, so each one only splits into
 * its two fields: the OK / Issue choice and the "#note" the Issue card reveals.
 */
export const hvacPmAnswers = (draft: HvacPmStepDraft): FormAnswers => ({
  ...Object.fromEntries(
    Object.entries(draft.answers).flatMap(([key, answer]) => [
      [key, answer.choice],
      [`${key}#note`, answer.issueNote],
    ]),
  ),
  repair: draft.repair,
  repairs: draft.repairs,
  parts: draft.parts,
  techs: draft.techs,
  time: { hours: draft.hours, minutes: draft.minutes },
  notes: draft.notes,
});

export const iceMachineAnswers = (draft: IceMachineDraft, equipment: Equipment[]): FormAnswers => ({
  checkIn: draft.checkIn,
  equipment: objectAnswer(equipment.find((e) => e.id === draft.equipmentId)),
  reportedIssue: draft.reportedIssue,
  operatingOnArrival: draft.operatingOnArrival,
  errorCodes: draft.errorCodes,
  binSwitch: draft.binSwitch,
  scaleOrGrowth: draft.scaleOrGrowth,
  unusualNoise: draft.unusualNoise,
  waterFlow: draft.waterFlow,
  refrigerantType: draft.refrigerantType,
  issuesText: draft.issuesText,
  actionsTaken: draft.actionsTaken,
  portsCapped: draft.portsCapped,
  operatingOnDeparture: draft.operatingOnDeparture,
  checkOut: draft.checkOut,
  partsPicture: draft.partsPicture,
  ...Object.fromEntries(Object.entries(draft.media).map(([key, items]) => [key, files(items)])),
});
