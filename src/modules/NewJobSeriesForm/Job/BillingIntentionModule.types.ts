import { BillingIntention } from "../../../data/db/types";

import { SelectedLocation } from "./LocationModule.types";

/** The job's billing choice. `billingClientId` only holds for "differentClient". */
export interface BillingSelection {
  intention: BillingIntention | null;
  billingClientId: string | null;
}

export interface BillingIntentionModuleProps {
  value: BillingSelection;
  onChange: (value: BillingSelection) => void;
  /** The picked service location — drives the rows and excludes its parent client from the billing list. */
  location: SelectedLocation;
  /**
   * Show the missing-value errors (no intention picked / no billing client
   * for "differentClient"). Default false — flipped by the step validation.
   */
  showErrors?: boolean;
  /** Mobile presentation (drawer lists). */
  mobile: boolean;
}
