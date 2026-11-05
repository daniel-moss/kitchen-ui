import ChargeTypeModules from "../ChargeTypeModules";
import { ChargeLinesOptions, useChargeLines } from "../chargeLines";

// ---------------------------------------------------------------------------
// CONCEPT 3 (Figma "Job Details" Page — Next Update, 27942-67997): the
// same one-module-per-type layout as Concept 2 (../ChargeTypeModules), with its
// own rows: not an accordion, a chevron on the right, and draggable within the
// type when it holds 2+ lines, as in Concept 1. A click opens the line's side
// panel (../LinePanels). The plus buttons open the shared SelectLists.
// ---------------------------------------------------------------------------

export type ChargesConcept3Props = Omit<ChargeLinesOptions, "readOnly" | "rowStyle" | "linesOpen">;

export default function ChargesConcept3(props: ChargesConcept3Props) {
  return <ChargeTypeModules {...useChargeLines({ ...props, rowStyle: "draggable" })} lineGap={false} />;
}
