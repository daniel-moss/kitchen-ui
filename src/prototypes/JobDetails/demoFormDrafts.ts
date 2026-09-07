import { HotSideDraft, MediaItem } from "./HotSideRepairForm";
import { ServiceCallDraft } from "./ServiceCallForm";

// Demo answers for the two schema-backed forms, so the job opens with completed
// forms whose PREVIEW can be shown right away (Daniel, 2026-08-06). Both point
// at equipment the job really has (equipment.tsx INITIAL_JOB_EQUIPMENT —
// the database job's walk-in cooler + reach-in freezer):
// the Service call is about the walk-in cooler — the job's reported issue — and
// the Hot Side - Repair about the gas-heat air handler, which is the unit with
// burners, a pilot and gas pressure.
//
// The Hot Side photos and the recap video are REAL files (Daniel's, 2026-08-25),
// served from public/forms/hot-side-repair/ — so the cards show the picture, not
// the file-type placeholder. The path is relative on purpose (like the avatars),
// so it also resolves under GitHub Pages' sub-path.

const HOT_SIDE_MEDIA = "forms/hot-side-repair/";

/** A real demo photo: `file` is the name in public/forms/hot-side-repair/. */
const photo = (name: string, file: string, size: number): MediaItem => ({
  name,
  type: "image",
  src: HOT_SIDE_MEDIA + file,
  size,
});

/**
 * A real demo video. It needs a POSTER frame too — the card tile is an `<img>`,
 * so the mp4 cannot be its own thumbnail (the poster was cut from the video's
 * first frame).
 */
const video = (name: string, file: string, poster: string, size: number): MediaItem => ({
  name,
  type: "video",
  src: HOT_SIDE_MEDIA + file,
  poster: HOT_SIDE_MEDIA + poster,
  size,
});

// PM - HVAC has NO demo draft on purpose (Daniel, 2026-08-25): the row starts
// empty. Its preview exists, it is just reached by filling the form first.

export const DEMO_SERVICE_CALL_DRAFT: ServiceCallDraft = {
  equipmentId: "eq-wd-walkin", // Walk-in Cooler · True Manufacturing
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
  equipmentId: "eq-wd-reachin", // Reach-in Freezer · True Manufacturing
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
    dateTag: [photo("Data tag.jpg", "data-tag.jpg", 188_974)],
    wideShot: [photo("Unit and surroundings.jpg", "unit-and-surroundings.jpg", 188_189)],
    controlPanel: [
      photo("Control panel.jpg", "control-panel.jpg", 65_107),
      photo("Error code.jpg", "error-code.jpg", 167_340),
    ],
    amperage: [photo("Amperage reading.jpg", "amperage-reading.jpg", 39_996)],
    gasSupply: [photo("Gas supply connection.webp", "gas-supply-connection.webp", 73_238)],
    burnerFlame: [photo("Burner flame quality.jpg", "burner-flame-quality.jpg", 16_449)],
    thermostatVsActual: [photo("Thermostat vs actual temp.jpg", "thermostat-vs-actual-temp.jpg", 44_245)],
    gasPressure: [
      photo("Inlet pressure.jpg", "inlet-pressure.jpg", 23_262),
      photo("Manifold pressure.jpg", "manifold-pressure.jpg", 36_508),
    ],
    solenoid: [photo("Pilot and ignitor.jpg", "pilot-and-ignitor.jpg", 46_907)],
    issuesMedia: [
      photo("Corroded pilot assembly.webp", "corroded-pilot-assembly.webp", 45_422),
      photo("Coated flame sensor.webp", "coated-flame-sensor.webp", 36_952),
    ],
    postFlame: [photo("Burner flame after.jpg", "burner-flame-after.jpg", 42_512)],
    postElectrical: [photo("Voltage after service.webp", "voltage-after-service.webp", 32_058)],
    finalVideo: [video("Final video recap.mp4", "final-video-recap.mp4", "final-video-recap-poster.jpg", 1_010_617)],
  },
};
