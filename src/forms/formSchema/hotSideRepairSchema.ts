import { YES_NO_OPTIONS } from "./options";
import { FormSchema } from "./schema.types";

// The "Hot Side - Repair" form as data (Figma 24461-33288 "Edit", preview
// 24467-36576). Unlike Service call, this form has NO modules — one flat field
// list, so the schema holds a single title-less module and the preview renders
// the answers without a FormModule wrapper.
//
// 2026-08-06 Figma update: "Equipment name" (text) became an OBJECT select,
// "Issues found" is now TWO fields sharing the label (a TextArea and a
// MediaField, each with its own help text — the Input pair was removed from the
// DS), and the "STAND ALONE quote" question is gone. Eleven fields are
// "(optional)". The design typo "Thermostate" stays fixed (Daniel).

export const HOT_SIDE_REPAIR_SCHEMA: FormSchema = {
  id: "hot-side-repair",
  name: "Hot Side - Repair",
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
        {
          key: "controlPanel",
          type: "media",
          label: "Control panel status and error codes",
          optional: true,
          accept: "image/*",
        },
        { key: "temperature", type: "text", label: "What was the temperature upon arrival?", optional: true },
        {
          key: "amperage",
          type: "media",
          label: "Amperage - voltage for heating elements or controls",
          optional: true,
          accept: "image/*",
        },
        { key: "gasSupply", type: "media", label: "Gas supply connection", optional: true, accept: "image/*" },
        { key: "burnerFlame", type: "media", label: "Burner flame quality", optional: true, accept: "image/*" },
        {
          key: "thermostatVsActual",
          type: "media",
          label: "Thermostat vs actual temp",
          optional: true,
          accept: "image/*",
        },
        {
          key: "gasPressure",
          type: "media",
          label: "Gas pressure readings for inlet and manifold",
          optional: true,
          accept: "image/*",
        },
        {
          key: "solenoid",
          type: "media",
          label: "Thermostat, pilot, ignitor and-or solenoid operation status",
          optional: true,
          accept: "image/*",
        },
        // "Issues found" is TWO fields with the SAME label (Daniel confirmed):
        // the note and its photos/videos, each required, each previewed as its
        // own answer.
        { key: "issuesText", type: "textArea", label: "Issues found", helpText: "Describe the issue" },
        { key: "issuesMedia", type: "media", label: "Issues found", helpText: "Provide photos or videos" },
        { key: "actionsTaken", type: "textArea", label: "What actions were taken to address the issue?" },
        {
          key: "postFlame",
          type: "media",
          label: "Document post-service flame, ignition, temperature holding performance",
          optional: true,
          accept: "image/*",
        },
        {
          key: "postElectrical",
          type: "media",
          label: "Document post-service electrical reading (voltage or amperage) taken",
          optional: true,
          accept: "image/*",
        },
        {
          key: "functioningOnDeparture",
          type: "radio",
          label: "Was the equipment functioning upon departure?",
          options: YES_NO_OPTIONS,
          orientation: "horizontal",
        },
        {
          key: "needReturn",
          type: "radio",
          label: "Do you need to return to complete the repair?",
          options: YES_NO_OPTIONS,
          orientation: "horizontal",
        },
        {
          key: "partsPicture",
          type: "radio",
          label: "Do you take picture of parts needed?",
          options: YES_NO_OPTIONS,
          orientation: "horizontal",
        },
        {
          key: "safetyConcerns",
          type: "textArea",
          label: "Note any safety or operational concerns with the equipment",
          optional: true,
        },
        { key: "finalVideo", type: "media", label: "Final video recap", accept: "video/*" },
        { key: "checkOut", type: "text", label: "Who did you check-out with?", helpText: "Name and title" },
      ],
    },
  ],
};
