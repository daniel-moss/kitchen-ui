import { YES_NO_OPTIONS } from "./options";
import { FormOption, FormSchema } from "./schema.types";

// The "Ice Machine - Repair" form as data (Figma "WCE / Ice Machine - Repair /
// Edit" 24564-137511). Like Hot Side - Repair it has NO modules — one flat
// field list, so the schema holds a single title-less module and the preview
// renders the answers without a FormModule wrapper.
//
// Two fields are SELECTS rather than the Yes/No radios their wording suggests
// (Daniel confirmed that is intended, 2026-08-06) — their option lists are
// mine, approved by him:

/** "Is water flow normal from spray jets or flow tube?" — a diagnostic reading. */
const WATER_FLOW_OPTIONS: FormOption[] = [{ value: "Normal" }, { value: "Reduced" }, { value: "No flow" }];

/** Refrigerants used in commercial ice machines — current, replacement and legacy. */
const REFRIGERANT_OPTIONS: FormOption[] = [
  { value: "R-290" },
  { value: "R-404A" },
  { value: "R-134a" },
  { value: "R-448A" },
  { value: "R-449A" },
  { value: "R-513A" },
  { value: "R-22" },
  { value: "Other" },
];

export const ICE_MACHINE_REPAIR_SCHEMA: FormSchema = {
  id: "ice-machine-repair",
  name: "Ice Machine - Repair",
  modules: [
    {
      id: "fields",
      fields: [
        { key: "checkIn", type: "text", label: "Who did you check-in with?", helpText: "Name and title" },
        { key: "equipment", type: "objectSelect", label: "Equipment" },
        { key: "reportedIssue", type: "text", label: "What was the reported issue?" },
        {
          key: "operatingOnArrival",
          type: "radio",
          label: "Was the unit operating properly on arrival?",
          options: YES_NO_OPTIONS,
          orientation: "horizontal",
        },
        { key: "dateTag", type: "media", label: "Date tag", accept: "image/*" },
        {
          key: "wideShot",
          type: "media",
          label: "Take a wide-shot of the unit and surrounding area",
          accept: "image/*",
        },
        { key: "errorCodes", type: "text", label: "Are there any error codes displayed?" },
        {
          key: "binSwitch",
          type: "radio",
          label: "Is the bin switch or float switch in normal or proper position?",
          options: YES_NO_OPTIONS,
          orientation: "horizontal",
        },
        {
          key: "scaleOrGrowth",
          type: "radio",
          label: "Is there any evidence of scale or biological growth present?",
          options: YES_NO_OPTIONS,
          orientation: "horizontal",
        },
        {
          key: "unusualNoise",
          type: "radio",
          label: "Was there unusual noise (grinding, buzzing, rattling)?",
          options: YES_NO_OPTIONS,
          orientation: "horizontal",
        },
        {
          key: "waterFlow",
          type: "select",
          label: "Is water flow normal from spray jets or flow tube?",
          options: WATER_FLOW_OPTIONS,
        },
        { key: "refrigerantType", type: "select", label: "Refrigerant type", options: REFRIGERANT_OPTIONS },
        // "Issues found" is TWO fields with the SAME label (as in Hot Side -
        // Repair): the note and its photos/videos, each required, each
        // previewed as its own answer.
        { key: "issuesText", type: "textArea", label: "Issues found", helpText: "Describe the issue" },
        { key: "issuesMedia", type: "media", label: "Issues found", helpText: "Provide photos or videos" },
        { key: "actionsTaken", type: "textArea", label: "What actions were taken to address the issue?" },
        { key: "iceProduction1", type: "media", label: "Document 1st post-service ice production", accept: "image/*" },
        { key: "iceProduction2", type: "media", label: "Document 2nd post-service ice production", accept: "image/*" },
        { key: "iceProduction3", type: "media", label: "Document 3rd post-service ice production", accept: "image/*" },
        { key: "oldCompressorTag", type: "media", label: "OLD compressor tag", optional: true, accept: "image/*" },
        { key: "newCompressorTag", type: "media", label: "NEW compressor tag", optional: true, accept: "image/*" },
        {
          key: "portsCapped",
          type: "radio",
          label: "Were all service ports capped upon departure?",
          options: YES_NO_OPTIONS,
          orientation: "horizontal",
        },
        {
          key: "operatingOnDeparture",
          type: "radio",
          label: "Was the equipment operating upon departure?",
          options: YES_NO_OPTIONS,
          orientation: "horizontal",
        },
        { key: "finalVideo", type: "media", label: "Final video recap", accept: "video/*" },
        { key: "checkOut", type: "text", label: "Who did you check-out with?", helpText: "Name and title" },
        {
          key: "partsPicture",
          type: "radio",
          label: "Did you take pictures of parts needed?",
          options: YES_NO_OPTIONS,
          orientation: "horizontal",
        },
      ],
    },
  ],
};
