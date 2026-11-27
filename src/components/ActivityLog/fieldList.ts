// The field list a several-fields log names in its sentence (DS doc "Cases" ›
// "Several fields changed"):
//  · up to three names, commas only: "Priority", "Priority, Technician",
//    "Priority, Scheduled for, Technician";
//  · more than three: the first two, then "and" + the count of the rest —
//    "Priority, Technician and 3 more".
// "And" comes only before the count (Daniel, 2026-11-27 — names used to end
// "… and Technician"). The names come in FORM order — pass them that way.

/** How many names the list shows before it starts counting. */
export const MAX_LISTED_FIELDS = 3;

export function formatFieldList(names: string[]): string {
  if (names.length <= MAX_LISTED_FIELDS) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`;
}
