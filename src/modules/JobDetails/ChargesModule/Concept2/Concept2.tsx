import ChargeTypeModules from "../ChargeTypeModules";
import { ChargeLinesOptions, useChargeLines } from "../chargeLines";

// ---------------------------------------------------------------------------
// CONCEPT 2 (Figma "Job Details" Page — Next Update, 27402-31061): one module
// per charge type (../ChargeTypeModules), with accordion rows — a row opens to
// show its details and has the "More actions" menu. The lines, lists and forms
// are the shared ones (../chargeLines).
// ---------------------------------------------------------------------------

export type ChargesConcept2Props = Omit<ChargeLinesOptions, "readOnly" | "rowStyle">;

export default function ChargesConcept2(props: ChargesConcept2Props) {
  return <ChargeTypeModules {...useChargeLines(props)} />;
}
