// Shared job demo values, so the Job Details page and the Start / Cancel job
// forms show the SAME data (Daniel: the forms mirror the page's values).
// Type / Service / Reason for call are not surfaced on the page itself yet —
// they live here as the job's real demo values.

export const JOB_ID = "JOB-10001";
export const JOB_SOURCE_ID = "123456789";
// The job this one recalls to — shown as the Service module's "Recall to" link
// AND the "Recall to" row in the Details panel's Related module (same object).
export const JOB_RECALL_TO = "JOB-10002";
export const JOB_TYPE = "Repair";
export const JOB_SERVICE = "Refrigeration repair";

// The service-location street address (the forms show the full address; the
// Location module on the page shows the location name + a shorter caption).
export const JOB_LOCATION_ADDRESS = "123 Main Street, San Francisco, CA 94105";

// The "Reason for call" free text — long enough to exercise the Cancel form's
// clamp + "Show more".
export const JOB_REASON_FOR_CALL =
  "Walk-in cooler is not holding temperature. Kitchen staff reported it climbing above 45°F overnight, and product is at risk of spoiling. The compressor is running constantly and the door gasket looks worn. Please inspect the compressor, check the refrigerant charge, and replace the door seal if needed. The manager also mentioned a rattling noise from the condenser fan that started a few days ago, so please take a look at that while on site and let us know if any parts need to be ordered.";

export const JOB_TECH_INSTRUCTIONS =
  "Check in with the kitchen manager at the back entrance before starting — the front is closed during prep. Bring the low-temp refrigeration kit and a spare door gasket for a 48-inch walk-in. Photograph the compressor nameplate and any error codes before making changes. If parts are needed, call the office for approval before ordering; do not leave the unit running if it trips the breaker again.";
