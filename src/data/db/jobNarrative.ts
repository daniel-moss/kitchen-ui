import { Job } from "./types";

// THE WORDS AND THE TIMELINE OF A JOB — the two things the Job Details page
// needs that the job tables do not carry.
//
// Added 2026-09-26, when the real Job Details design moved into the app and
// every job was showing the same demo paragraph. This module is ADDITIVE: it
// does not change `Job` or any exported array, so nothing that already reads
// the database is affected.
//
// The prose is keyed by SERVICE, not by job. A workspace has a few dozen kinds
// of work and hundreds of jobs, so the same kind of call reads the same way —
// which is truer to life than 78 invented paragraphs, and keeps the demo
// content reviewable.

interface Narrative {
  /** Why the client called — the words the office took down. */
  reason: string;
  /** What the tech should know before arriving. */
  tech: string;
  /** What was actually done — the work summary, written after the visit. */
  summary?: string;
}

const GENERIC: Narrative = {
  reason:
    "The kitchen manager reported the unit is not performing as expected and asked for someone to take a look. " +
    "Please diagnose the fault, let the office know what you find, and call in before ordering any parts.",
  tech:
    "Check in with the kitchen manager on arrival and work around the prep window where you can. " +
    "Photograph the nameplate and any error codes before making changes.",
  summary:
    "Diagnosed the fault, carried out the repair and tested the unit before leaving. " +
    "Advised the kitchen manager on what was found and what to watch for.",
};

const BY_SERVICE: Record<string, Narrative> = {
  "Walk-in cooler repair": {
    reason:
      "Walk-in cooler is not holding temperature. Kitchen staff reported it climbing above 45°F overnight, and product " +
      "is at risk of spoiling. The compressor is running constantly and the door gasket looks worn.",
    tech:
      "Check in with the kitchen manager at the back entrance before starting — the front is closed during prep. " +
      "Bring the low-temp refrigeration kit and a spare door gasket for a 48-inch walk-in.",
    summary:
      "Diagnosed the walk-in cooler and found a worn door gasket letting warm air in, with the compressor running continuously as a result. Replaced the gasket, recovered and recharged the refrigerant, and cleaned the condenser coil. Confirmed the box holding 38°F on a full cycle before leaving.",
  },
  "Walk-in cooler compressor replacement": {
    reason:
      "The walk-in cooler compressor has failed and the unit will not hold temperature. Product has been moved to the " +
      "reach-ins, so the kitchen needs this back before the weekend.",
    tech: "Confirm the model on the nameplate before you leave the shop — the replacement has to match the refrigerant.",
    summary:
      "Replaced the failed compressor, evacuated and recharged the system, and replaced the filter drier. Ran the unit through two full cycles and confirmed it pulling down to temperature. Recommended a condenser clean every quarter to protect the new compressor.",
  },
  "Walk-in freezer door repair": {
    reason: "The walk-in freezer door is not sealing and there is heavy frost build-up around the frame.",
    tech: "Bring a spare gasket and a hinge kit. Check the closer tension while you are in there.",
    summary:
      "Replaced the freezer door gasket and fitted a new hinge kit. Adjusted the closer so the door seats on its own. Frost build-up around the frame should clear over the next day or two.",
  },
  "Walk-in freezer door assembly": {
    reason: "The freezer door assembly is failing — the latch no longer catches and the door drifts open.",
    tech: "The full assembly is on the van. Check the frame for square before fitting.",
    summary:
      "Fitted the replacement door assembly and checked the frame for square before hanging it. Verified the latch engages and the seal is even all round.",
  },
  "Freezer door seal replacement": {
    reason:
      "The freezer door seal is split along the hinge side and the unit is icing up. Staff have been wedging the door " +
      "shut, which is making it worse.",
    tech: "Measure the existing gasket before pulling it — the two freezers on site are different sizes.",
    summary:
      "Replaced the split freezer door gasket and checked the seal along the full frame. Advised staff to stop wedging the door, which is what tore the old one.",
  },
  "Grill hood cleaning": {
    reason:
      "Scheduled hood cleaning. Grease build-up in the canopy and filters is due for removal, and the kitchen wants the " +
      "certificate for their compliance file.",
    tech: "Work after service, and lay drop sheets over the cook line. Leave the certificate with the manager on the way out.",
    summary:
      "Cleaned the canopy, filters and accessible ductwork, and degreased the cook line below. Left the compliance certificate with the kitchen manager.",
  },
  "Hood deep cleaning": {
    reason: "Deep clean requested ahead of an inspection — the last clean was six months ago.",
    tech: "Allow extra time for the ductwork. Photograph the before and after for the report.",
    summary:
      "Deep-cleaned the canopy, filters and full duct run ahead of the inspection. Photographed before and after for the report.",
  },
  "Hood cleaning estimate visit": {
    reason: "The client asked for a quote to take over their hood cleaning contract.",
    tech: "Measure the canopy runs and count the filters. No work on this visit.",
    summary:
      "Measured the canopy runs and counted the filters for a cleaning quote. No work carried out on this visit.",
  },
  "Ice machine descale": {
    reason:
      "Ice production has dropped and the cubes are coming out cloudy. The machine is overdue for a descale and the " +
      "water filter has not been changed this year.",
    tech: "Bring a replacement water filter. The machine is in the back corridor, so you will need the service key from the office.",
    summary:
      "Descaled the ice machine and flushed the water supply line, then replaced the inline filter. Cycled the unit and confirmed clear cubes and normal production. Recommended a follow-up descale in six months.",
  },
  "Espresso machine descale": {
    reason: "The espresso machine is slow to come up to pressure and the baristas report scale in the group heads.",
    tech: "Descale before opening — the machine is in use from 7am.",
    summary:
      "Descaled the group heads and boiler and replaced both group gaskets. Brought the machine back up to pressure and confirmed a steady extraction before opening.",
  },
  "Dishwasher inspection": {
    reason:
      "Routine dishwasher inspection. Staff have mentioned spotting on glassware and a longer cycle time than usual.",
    tech: "Check the rinse temperature and the detergent dosing while you are on site.",
    summary:
      "Inspected the dishwasher and found the rinse temperature running low and the detergent dosing set under spec. Adjusted both and confirmed a clean rinse across two cycles. No parts needed.",
  },
  "Dishwasher rinse-aid line replacement": {
    reason: "The rinse-aid line is perished and leaking into the cabinet.",
    tech: "Bring the full line kit. Isolate the chemical supply before you start.",
    summary:
      "Isolated the chemical supply and replaced the perished rinse-aid line and fittings. Primed the new line and confirmed correct dosing.",
  },
  "Combi oven quarterly maintenance": {
    reason: "Quarterly maintenance visit under the service contract.",
    tech: "Run the cleaning cycle and check the door seal and steam generator. Log the readings on the contract sheet.",
    summary:
      "Ran the cleaning cycle, replaced the door seal and checked the steam generator. Logged the readings on the contract sheet.",
  },
  "Combi oven quarterly service": {
    reason: "Quarterly service under the contract — no faults reported.",
    tech: "Standard service schedule. Leave the sheet with the head chef.",
    summary:
      "Carried out the quarterly service schedule and replaced the door seal. No faults found.",
  },
  "Combi oven annual contract": {
    reason: "Annual contract visit. The full service schedule is due, including the descale and a calibration check.",
    tech: "Allow half a day. The oven is out of use from 2pm for you.",
    summary:
      "Completed the annual service: descaled the steam generator, replaced the door seal and recalibrated the probes. Everything within spec.",
  },
  "Grease trap service": {
    reason: "Scheduled grease trap pump-out. The kitchen has noticed a smell from the floor drain near the wash-up.",
    tech: "Access is through the yard. Bring the manifest — the client needs a copy for their records.",
    summary:
      "Pumped out the grease trap and cleared the floor drain near the wash-up. Left a copy of the manifest with the manager.",
  },
  "Steam table thermostat swap": {
    reason: "The steam table is overshooting its set point and holding food too hot on the far wells.",
    tech: "Replacement thermostat is on the van. Check the calibration on all wells before you leave.",
    summary:
      "Replaced the faulty well thermostat and recalibrated all wells against a test probe. Holding temperatures now even across the table.",
  },
  "Fryer service and calibration": {
    reason: "The fryer is running hot and oil life has dropped. Staff report the thermostat reading does not match the oil.",
    tech: "Service after the oil has cooled. Calibrate against your own probe, not the panel.",
    summary:
      "Serviced the fryer, replaced the filter pads and calibrated the thermostat against a test probe — it was reading 15°F under. Checked the high-limit and the drain valve.",
  },
  "Fryer preventive maintenance": {
    reason: "Preventive maintenance visit — no fault reported.",
    tech: "Standard PM schedule. Check the high-limit and the drain valve.",
    summary:
      "Completed the preventive maintenance schedule, replaced the filter pads and checked the high-limit and drain valve. No faults found.",
  },
  "Prep fridge compressor service": {
    reason: "The prep fridge is cycling constantly and the compressor is running hot.",
    tech: "Check the condenser coil first — the unit sits against the wall and collects dust.",
    summary:
      "Found the condenser coil packed with dust and the fan motor failing. Cleaned the coil and replaced the motor. The unit is cycling normally again.",
  },
  "Reach-in cooler diagnostic": {
    reason: "The reach-in cooler is not holding its set point. The kitchen wants a diagnosis before committing to a repair.",
    tech: "Diagnostic only on this visit — quote anything you find.",
    summary:
      "Diagnosed the reach-in cooler and traced the fault to a failing evaporator fan. Quoted the repair; no work carried out on this visit.",
  },
  "Range burner repair": {
    reason: "Two burners on the range will not light reliably and one is burning yellow.",
    tech: "Bring burner heads and a spare thermocouple for a six-burner range.",
    summary:
      "Replaced two burner heads and a thermocouple. All six burners now light first time and burn clean.",
  },
  "Range pilot relight": {
    reason: "The range pilots went out after a gas interruption and staff cannot relight them.",
    tech: "Check the gas supply is fully restored before relighting.",
    summary:
      "Confirmed the gas supply was fully restored and relit all pilots. Checked each burner before leaving.",
  },
  "Proofer thermostat replacement": {
    reason: "The proofer is running cold and dough is not rising on schedule.",
    tech: "Replacement thermostat is on the van. Verify the humidity setting after fitting.",
    summary:
      "Replaced the proofer thermostat and verified the humidity setting. Holding temperature steady on test.",
  },
  "Proofer thermostat + calibration": {
    reason: "The proofer thermostat has failed and the unit needs recalibrating afterwards.",
    tech: "Allow time for a full calibration cycle after the swap.",
    summary:
      "Replaced the thermostat and ran a full calibration cycle. Temperature and humidity now both within spec.",
  },
  "Kitchen build-out consultation": {
    reason: "The client is planning a second kitchen and asked for a walk-through to scope the equipment needs.",
    tech: "Consultation only — bring the equipment catalogue and take measurements of the space.",
    summary:
      "Walked the proposed space, took measurements and scoped the equipment needed. Quote to follow.",
  },
};

/** Why the client called, in the words of the office. */
export const reasonForCall = (job: Job): string => (BY_SERVICE[job.serviceName] ?? GENERIC).reason;

/** What the tech should know before arriving. */
export const techInstructions = (job: Job): string => (BY_SERVICE[job.serviceName] ?? GENERIC).tech;

/**
 * What was done — the work summary, written after the visit.
 *
 * Empty until the job has actually been worked: a summary of work that has not
 * happened is the kind of thing that makes a demo look fake.
 */
export function workSummary(job: Job): string {
  const done = ["completed", "finalized"].includes(job.status);
  return done ? draftSummary(job) : "";
}

/**
 * The same text, ungated — what the "generate" button writes into an empty
 * field. Writing the summary is part of COMPLETING the job, so the draft has
 * to exist before the job is finished.
 */
export const draftSummary = (job: Job): string =>
  (BY_SERVICE[job.serviceName] ?? GENERIC).summary ?? GENERIC.summary ?? "";

// ---- the timeline ----------------------------------------------------------

/**
 * The statuses that mean work has actually begun. Everything before these is
 * paperwork, so those jobs have no start.
 */
const STARTED = new Set(["active", "quickPaused", "onHoldExternal", "onHoldInternal", "completed", "finalized"]);

/**
 * When work first started, ISO — null until it does.
 *
 * DERIVED, not stored: a job that has started was worked at its scheduled
 * time, so that is the honest stamp. A job with no schedule (it was started
 * off the cuff) falls back to when its status last really changed.
 */
export function startedAt(job: Job): string | null {
  if (!STARTED.has(job.status)) return null;
  return job.scheduledFor ?? job.statusChangedAt ?? job.receivedAt;
}

/** When the job was completed or finalized, ISO — null until it is. */
export function completedAt(job: Job): string | null {
  if (job.status !== "completed" && job.status !== "finalized") return null;
  return job.statusChangedAt ?? job.scheduledFor ?? null;
}
