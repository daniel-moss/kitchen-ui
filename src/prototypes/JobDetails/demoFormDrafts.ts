import { HotSideDraft, MediaItem } from "./HotSideRepairForm";
import { ServiceCallDraft } from "./ServiceCallForm";

// Demo answers for the two schema-backed forms, so the job opens with completed
// forms whose PREVIEW can be shown right away (Daniel, 2026-08-06). Both point
// at equipment the job really has (equipment.tsx INITIAL_JOB_EQUIPMENT = 1 + 5):
// the Service call is about the walk-in cooler — the job's reported issue — and
// the Hot Side - Repair about the gas-heat air handler, which is the unit with
// burners, a pilot and gas pressure.
//
// The demo photos carry no object URL (nothing was really picked), so their
// cards show the file-type placeholder and Download does nothing — flagged.

const photo = (name: string, size: number): MediaItem => ({ name, type: "image", size });
const video = (name: string, size: number): MediaItem => ({ name, type: "video", size });

export const DEMO_SERVICE_CALL_DRAFT: ServiceCallDraft = {
  equipmentId: 5, // Walk-in Cooler ・ True Manufacturing
  voltage: "208V",
  phase: "Single phase",
  gas: "Natural gas",
  warranty: "Yes",
  warrantyCovered: "Compressor and sealed-system parts are covered until March 2027. Labor is not covered.",
  verifiedMfg: "Yes",
  csiSticker: "No",
  operationalOnArrival: "No",
  diagnosisSteps:
    "Measured the box temperature at 48 °F, inspected the condenser coil and fan, took suction and discharge pressures, and checked the door seal with a paper test.",
  confirmedIssue:
    "Yes. The condenser fan motor bearing is failing and the door gasket is torn along the hinge side, so the unit runs constantly and still climbs above 45 °F overnight.",
  repairCompleted: "Yes",
  repairsCompleted: "Replaced the condenser fan motor and blade, cleaned the condenser coil and re-seated the door hinge.",
  partsInstalled: "Condenser fan motor, fan blade, mounting bracket.",
  maintenanced: "Yes. The coil was cleaned, the drain line flushed and the interior wiped down after the repair.",
  fullyOperational: "No",
  repairsRequired: "The door gasket is torn along the hinge side and has to be replaced before the box can hold temperature overnight.",
  partsNeeded: "Door gasket (T-23F-2) and gasket adhesive.",
  techs: "1",
  hours: "1",
  minutes: "30",
  payment: "Check",
  notes: "The kitchen manager asked to schedule the gasket replacement before the morning prep, ideally between 6 and 8 AM.",
};

export const DEMO_HOT_SIDE_DRAFT: HotSideDraft = {
  checkIn: "Marta Reyes, kitchen manager",
  equipmentId: 1, // Air Handler ・ American Range
  reportedIssue: "No heat — the burner lights and drops out after a few seconds.",
  operatingOnArrival: "No",
  temperature: "63 °F",
  issuesText:
    "The flame sensor is coated and the pilot assembly is corroded, so the ignition module loses the flame signal and locks out about five seconds after each start.",
  actionsTaken:
    "Cleaned the flame sensor, replaced the pilot assembly and the thermocouple, then ran three ignition cycles and confirmed the flame held on each one.",
  safetyConcerns: "The gas line fitting behind the unit shows old sealant and should be re-sealed on the next visit.",
  functioningOnDeparture: "Yes",
  needReturn: "No",
  partsPicture: "Yes",
  checkOut: "Marta Reyes, kitchen manager",
  media: {
    dateTag: [photo("Date tag.jpg", 1_260_000)],
    wideShot: [photo("Unit and surroundings.jpg", 3_640_000)],
    controlPanel: [photo("Control panel.jpg", 2_180_000), photo("Error code E4.jpg", 1_940_000)],
    amperage: [photo("Amperage reading.jpg", 2_050_000)],
    gasSupply: [photo("Gas supply connection.jpg", 2_310_000)],
    burnerFlame: [photo("Burner flame before.jpg", 2_780_000)],
    thermostatVsActual: [photo("Thermostat vs actual.jpg", 1_720_000)],
    gasPressure: [photo("Inlet pressure.jpg", 1_880_000), photo("Manifold pressure.jpg", 1_910_000)],
    solenoid: [photo("Pilot and ignitor.jpg", 2_430_000)],
    issuesMedia: [photo("Corroded pilot assembly.jpg", 3_120_000), photo("Coated flame sensor.jpg", 2_660_000)],
    postFlame: [photo("Burner flame after.jpg", 2_540_000)],
    postElectrical: [photo("Voltage after service.jpg", 1_990_000)],
    finalVideo: [video("Final recap.mp4", 18_400_000)],
  },
};
