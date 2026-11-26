// The field list a several-fields log names in its sentence (DS doc "Cases" ›
// "Several fields changed"):
//  · up to three names: "Priority", "Priority and Technician",
//    "Priority, Scheduled for and Technician";
//  · more than three: the first two, then the count of the rest —
//    "Priority, Technician and 3 more".
// Commas separate the names and "and" comes before the last one (no comma
// before "and"). The names come in FORM order — pass them that way.

/** How many names the list shows before it starts counting. */
export const MAX_LISTED_FIELDS = 3;

export function formatFieldList(names: string[]): string {
  if (names.length <= MAX_LISTED_FIELDS) return joinWithAnd(names);
  return joinWithAnd([...names.slice(0, 2), `${names.length - 2} more`]);
}

function joinWithAnd(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}
