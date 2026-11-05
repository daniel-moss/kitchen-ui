import type { Job } from "../../../data/db";

import Concept1 from "./Concept1/Concept1";
import Concept2 from "./Concept2/Concept2";
import Concept3 from "./Concept3/Concept3";
import Concept4 from "./Concept4/Concept4";

// One Charges concept — what the Job Details page shows in place of its own Charges
// module when a user-testing build asks for it (prototypes/JobDetailsCharges). Every
// concept starts with NO lines (Daniel, 2026-11-05): the customer adds their own.

export type ChargesConceptNumber = 1 | 2 | 3 | 4;

interface ChargesConceptProps {
  concept: ChargesConceptNumber;
  job: Job;
  mobile: boolean;
}

export default function ChargesConcept({ concept, job, mobile }: ChargesConceptProps) {
  const empty = { job, groups: [], mobile };

  if (concept === 1) return <Concept1 {...empty} />;
  if (concept === 2) return <Concept2 {...empty} />;
  if (concept === 3) return <Concept3 {...empty} />;
  return <Concept4 job={job} labor={[]} products={[]} other={[]} discounts={[]} mobile={mobile} />;
}
