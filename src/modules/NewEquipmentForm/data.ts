import { EQUIPMENT_LABELS } from "../../data/db";

export { EQUIPMENT_CATEGORIES, EQUIPMENT_TYPES, OWNERSHIP_TYPES } from "../../data/db";

// Demo data for the New-equipment form.
//
// The category / type / ownership lists moved into the demo database on
// 2026-09-28 (the Equipment side panel reads the same lists) — re-exported
// here so this form's imports did not have to change.

/**
 * The labels the form offers. Reads the db's EQUIPMENT_LABELS since 2026-09-28
 * — the pool used to be a hand-written list that had drifted into CLIENT label
 * names ("Pending onboarding", "Trial", "Third-party billing"), which an
 * equipment never carries. The form still lets the user create new ones on the
 * fly; those live only in the form's session.
 */
export const LABEL_POOL: string[] = EQUIPMENT_LABELS.map((label) => label.name);
