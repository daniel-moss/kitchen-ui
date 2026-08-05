import { YES_NO_OPTIONS } from "./options";
import { FormSchema } from "./schema.types";

// The "Hot Side - Repair" form as data (Figma 23920-13390). Unlike Service
// call, this form has NO modules — one flat field list, so the schema holds a
// single title-less module and the preview renders the answers without a
// FormModule wrapper (not covered by the mapping frames — flagged to Daniel).
//
// Ten fields are "(optional)" per the node. The design typo "Thermostate" is
// fixed per Daniel.

export const HOT_SIDE_REPAIR_SCHEMA: FormSchema = {
  id: "hot-side-repair",
  name: "Hot Side - Repair",
  modules: [
    {
      id: "fields",
      fields: [
        { key: "checkIn", type: "text", label: "Who did you check-in with?", helpText: "Name and title" },
        { key: "equipmentName", type: "text", label: "Equipment name", helpText: "Customer, equipment ID" },
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
        // "Issues found" is ONE labelled pair in the form (a TextArea + a
        // MediaField, both required). As schema data it is two fields sharing
        // the label; how the preview groups the pair is still open — it is
        // blocked on the ValueDisplay media update either way.
        { key: "issuesText", type: "textArea", label: "Issues found" },
        { key: "issuesMedia", type: "media", label: "Issues found" },
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
        {
          key: "standaloneQuote",
          type: "radio",
          label: "Will a STAND ALONE quote be submitted for a separate issue?",
          options: YES_NO_OPTIONS,
          orientation: "horizontal",
        },
      ],
    },
  ],
};
