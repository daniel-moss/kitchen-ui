import { Dispatch, SetStateAction, useState } from "react";

import type { Charge, Job } from "../../../../data/db";
import { discountAmount, laborAmount, otherAmount, productAmount } from "../lineDisplay";
import SubtotalModule from "../SubtotalModule";

import DiscountsGroup from "./DiscountsGroup";
import LaborRatesGroup from "./LaborRatesGroup";
import OtherChargesGroup from "./OtherChargesGroup";
import ProductsGroup from "./ProductsGroup";

import styles from "./Concept4.module.scss";

// CONCEPT 4 — line items as Cards (Figma 28284-40930, Daniel, 2026-11-05): Labor
// rates, Products, Other charges and Discounts, 16px apart, then the subtotal. Each
// group owns its list and form (./useCardLines); the lines live here, for the
// subtotal. They are state, so a story reload starts over.

interface ChargesConcept4Props {
  job: Job;
  /** The labor lines, one card each. Left out: no Labor rates group. */
  labor?: Charge[];
  /** The product lines, one card each. Left out: no Products group. */
  products?: Charge[];
  /** The other charge lines, one card each. Left out: no Other charges group. */
  other?: Charge[];
  /** The discount lines, one card each. Left out: no Discounts group. */
  discounts?: Charge[];
  /** False: the company does not use subtypes. Default true. */
  hasSubtypes?: boolean;
  /** The customer's view: no plus, no drag — see `LineCard`. */
  isPublic?: boolean;
  mobile?: boolean;
}

/** What each group takes. */
export interface ChargesGroupProps {
  job: Job;
  lines: Charge[];
  setLines: Dispatch<SetStateAction<Charge[]>>;
  hasSubtypes: boolean;
  isPublic: boolean;
  mobile: boolean;
}

export default function ChargesConcept4({ job, labor, products, other, discounts, hasSubtypes = true, isPublic = false, mobile = false }: ChargesConcept4Props) {
  const [laborLines, setLaborLines] = useState(labor ?? []);
  const [productLines, setProductLines] = useState(products ?? []);
  const [otherLines, setOtherLines] = useState(other ?? []);
  const [discountLines, setDiscountLines] = useState(discounts ?? []);
  const sum = (lines: Charge[], amount: (charge: Charge) => number) => lines.reduce((acc, charge) => acc + amount(charge), 0);
  // Discounts can take it below zero — allowed for now (Daniel, 2026-11-03).
  const subtotal =
    sum(laborLines, (charge) => laborAmount(charge.labor!)) +
    sum(productLines, (charge) => productAmount(charge.product!)) +
    sum(otherLines, (charge) => otherAmount(charge.other!)) +
    sum(discountLines, (charge) => discountAmount(charge.discount!));

  const group = { job, hasSubtypes, isPublic, mobile };
  return (
    <div className={styles.groups}>
      {labor != null && <LaborRatesGroup {...group} lines={laborLines} setLines={setLaborLines} />}
      {products != null && <ProductsGroup {...group} lines={productLines} setLines={setProductLines} />}
      {other != null && <OtherChargesGroup {...group} lines={otherLines} setLines={setOtherLines} />}
      {discounts != null && <DiscountsGroup {...group} lines={discountLines} setLines={setDiscountLines} />}
      <SubtotalModule subtotal={subtotal} />
    </div>
  );
}
