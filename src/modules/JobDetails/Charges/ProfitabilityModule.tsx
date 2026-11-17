import { Fragment, ReactNode } from "react";

import { Divider } from "../../../components/Divider/Divider";
import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import HintTrigger from "../../../components/Hint/HintTrigger";
import HoverHint from "../../../components/Hint/HoverHint";
import { Icon } from "../../../components/Icon/Icon";
import ItemText from "../../../components/ItemText/ItemText/ItemText";
import ItemTextBlock from "../../../components/ItemText/ItemText/ItemTextBlock";
import { ItemTextLineColor } from "../../../components/ItemText/ItemText/ItemTextLine.types";
import type { JobChargeLines } from "../../../app/store/AppStore";
import type { Charge } from "../../../data/db";

import {
  discountAmount,
  formatAmount,
  laborAmount,
  laborCost,
  otherAmount,
  otherCost,
  productAmount,
  productCost,
  round3,
} from "./lineDisplay";

import styles from "./ProfitabilityModule.module.scss";

// "Profitability" — the module under the Subtotal in the Job Details Charges
// segment (Figma 21823-86710, Daniel 2026-11-14). Three boxes: Profitability
// (percent + amount), Cost and Subtotal, each with a HintTrigger whose hint
// breaks the number down per charge type.
//
//   Profitability = Subtotal − Cost
//   Percent       = MARGIN: Profitability / Subtotal × 100, up to 1 decimal
//                   (was markup, Profitability / Cost — switched 2026-11-17
//                   after the CEO's user-test feedback; SAMPro shows margin)
//   Cost          = the sum of every line's cost (discounts have none)
//   Subtotal      = Labor rates + Products + Other charges + Discounts
//
// States: profit (arrow up-right, success), loss (arrow down-left, error — the
// percent carries NO minus, the amount does; a loss margin can pass 100%),
// zero ("0%" / "$0.00" strong, no arrow), no subtotal ("N/A" — a Subtotal of
// $0 or less leaves nothing to divide by) and no lines at all (every value
// placeholder). A job with no cost is a real 100% margin, not N/A.

type Kind = "labor" | "product" | "other" | "discount";

interface TypeSum {
  kind: Kind;
  label: string;
  count: number;
  price: number;
  cost: number;
}

const sum = (list: Charge[], amount: (charge: Charge) => number) => round3(list.reduce((acc, charge) => acc + amount(charge), 0));

function typeSums(lines: JobChargeLines): TypeSum[] {
  return [
    { kind: "labor", label: "Labor rates", count: lines.labor.length, price: sum(lines.labor, (c) => laborAmount(c.labor!)), cost: sum(lines.labor, (c) => laborCost(c.labor!)) },
    { kind: "product", label: "Products", count: lines.products.length, price: sum(lines.products, (c) => productAmount(c.product!)), cost: sum(lines.products, (c) => productCost(c.product!)) },
    { kind: "other", label: "Other charges", count: lines.other.length, price: sum(lines.other, (c) => otherAmount(c.other!)), cost: sum(lines.other, (c) => otherCost(c.other!)) },
    { kind: "discount", label: "Discounts", count: lines.discounts.length, price: sum(lines.discounts, (c) => discountAmount(c.discount!)), cost: 0 },
  ];
}

// The hint rows' 14px type icons (the pricebook type icons).
const ICON: Record<Kind, string> = {
  labor: "toolbox",
  product: "box-taped",
  other: "receipt",
  discount: "badge-percent",
};

/** A profit reads with its sign: "+$100.00" success, "−$100.00" error, "$0.00" strong. */
function signed(value: number): { text: string; color: ItemTextLineColor } {
  const v = round3(value);
  if (v > 0) return { text: `+${formatAmount(v)}`, color: "success" };
  if (v < 0) return { text: formatAmount(v), color: "error" };
  return { text: formatAmount(0), color: "strong" };
}

/** The margin: profit ÷ subtotal × 100, up to 1 decimal, no sign (the arrow carries it). */
function formatPercent(profit: number, subtotal: number): string {
  const p = Math.round((Math.abs(profit) / subtotal) * 1000) / 10;
  return `${p.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
}

const COLOR_CLASS: Record<ItemTextLineColor, string> = {
  strong: styles.strong,
  subtle: styles.subtle,
  placeholder: styles.placeholder,
  success: styles.success,
  warning: styles.warning,
  error: styles.error,
};

// ---- the hints ----------------------------------------------------------------
//
// Figma 2026-11-17 redesign: every hint is a 16px-padded column, 16px between
// its parts — the copy (heading/h3 title + caption, 4px apart), then one
// 20px ItemText row per type. Figma draws the rows as ListItemBody, but the
// code's ListItemBody forces a 40px row; ItemText is the part it wraps, so
// the rows use it directly. A type with no lines reads "N/A" (placeholder).

const N_A = "N/A";

function HintBody({ title, caption, children }: { title: string; caption: string; children: ReactNode }) {
  return (
    <div className={styles.hintBody}>
      <div className={styles.copy}>
        <span className={styles.copyTitle}>{title}</span>
        <span className={styles.copyCaption}>{caption}</span>
      </div>
      {children}
    </div>
  );
}

const typeIcon = (kind: Kind) => <Icon icon={ICON[kind]} size={14} container="square" />;
const arrowIcon = (profit: number) => (profit === 0 ? undefined : <Icon icon={profit > 0 ? "arrow-up-right" : "arrow-down-left"} size={14} container="fixedHeight" />);

/**
 * A type's margin with its amount, e.g. "25% ($200.00)". The amount carries no
 * sign — the arrow and the color do (Daniel, 2026-11-17). A $0 price leaves
 * nothing to divide by: "N/A ($100.00)", still colored by the profit.
 */
function typeMargin(s: TypeSum): { text: string; color: ItemTextLineColor; profit: number } {
  if (s.count === 0) return { text: N_A, color: "placeholder", profit: 0 };
  const profit = round3(s.price - s.cost);
  const color = signed(profit).color;
  const amount = formatAmount(Math.abs(profit));
  const percent = s.price > 0 ? formatPercent(profit, s.price) : N_A;
  return { text: `${percent} (${amount})`, color, profit };
}

/** "↳ Cost" / "↳ Price" under a type: Regular, 12px in. */
function SubRow({ label, value, empty }: { label: string; value: number; empty: boolean }) {
  return (
    <ItemText
      title={label}
      titleStyle="bodyRegular"
      titleSlotLeft={<Icon icon="arrow-turn-down-right" size={14} container="square" />}
      right={<ItemTextBlock align="right" title={empty ? N_A : formatAmount(value)} titleStyle="bodyRegular" titleColor={empty ? "placeholder" : "strong"} />}
    />
  );
}

function ProfitabilityHint({ sums }: { sums: TypeSum[] }) {
  const types = sums.filter((s) => s.kind !== "discount");
  const discounts = sums.find((s) => s.kind === "discount")!;
  const discount = discounts.count === 0 ? { text: N_A, color: "placeholder" as const } : signed(discounts.price);
  return (
    <HintBody title="Profitability breakdown" caption="The difference between what the job was charged and what it cost the company.">
      {types.map((s) => {
        const m = typeMargin(s);
        return (
          <Fragment key={s.kind}>
            <div className={styles.typeBlock}>
              <ItemText
                title={s.label}
                titleSlotLeft={typeIcon(s.kind)}
                right={<ItemTextBlock align="right" title={m.text} titleColor={m.color} titleSlotLeft={arrowIcon(m.profit)} />}
              />
              <div className={styles.subRows}>
                <SubRow label="Cost" value={s.cost} empty={s.count === 0} />
                <SubRow label="Price" value={s.price} empty={s.count === 0} />
              </div>
            </div>
            <Divider contrast="medium" />
          </Fragment>
        );
      })}
      <ItemText
        title={discounts.label}
        titleSlotLeft={typeIcon("discount")}
        right={<ItemTextBlock align="right" title={discount.text} titleColor={discount.color} />}
      />
    </HintBody>
  );
}

function BreakdownHint({ title, caption, sums, value }: { title: string; caption: string; sums: TypeSum[]; value: (s: TypeSum) => number }) {
  return (
    <HintBody title={title} caption={caption}>
      {sums.map((s) => (
        <ItemText
          key={s.kind}
          title={s.label}
          titleSlotLeft={typeIcon(s.kind)}
          right={<ItemTextBlock align="right" title={s.count === 0 ? N_A : formatAmount(value(s))} titleColor={s.count === 0 ? "placeholder" : "strong"} />}
        />
      ))}
    </HintBody>
  );
}

// ---- the module ---------------------------------------------------------------

function BoxTitle({ label, hint, width, mobile }: { label: string; hint: ReactNode; width: number; mobile: boolean }) {
  return (
    <div className={styles.boxTitle}>
      <span className={styles.boxLabel}>{label}</span>
      <HoverHint content={hint} position="bottom" width={width} breakpoint={mobile ? "mobile" : "desktop"}>
        <HintTrigger />
      </HoverHint>
    </div>
  );
}

export interface ProfitabilityModuleProps {
  lines: JobChargeLines;
  mobile?: boolean;
}

export default function ProfitabilityModule({ lines, mobile = false }: ProfitabilityModuleProps) {
  const sums = typeSums(lines);
  const hasLines = sums.some((s) => s.count > 0);
  const subtotal = round3(sums.reduce((acc, s) => acc + s.price, 0));
  const cost = round3(sums.reduce((acc, s) => acc + s.cost, 0));
  const profit = round3(subtotal - cost);

  // The big percent and the amount next to it.
  const amount = hasLines ? signed(profit) : { text: formatAmount(0), color: "placeholder" as const };
  // The margin needs a positive Subtotal to divide by. With lines but no
  // Subtotal (Figma "No Subtotal", e.g. a fully discounted job) the percent
  // reads "N/A" yet keeps the loss's arrow and color.
  const hasMargin = hasLines && subtotal > 0;
  const percentText = hasMargin ? formatPercent(profit, subtotal) : "N/A";
  const percentColor: ItemTextLineColor = hasLines ? amount.color : "placeholder";
  const arrow = hasLines && profit !== 0 ? (profit > 0 ? "arrow-up-right" : "arrow-down-left") : null;
  const valueColor: ItemTextLineColor = hasLines ? "strong" : "placeholder";

  const profitabilityBox = (
    <div className={styles.mainBox}>
      <BoxTitle label="Profitability" width={360} mobile={mobile} hint={<ProfitabilityHint sums={sums} />} />
      <div className={styles.mainValues}>
        <div className={styles.percentRow}>
          {/* 28px is outside the Icon scale (8–24): sized by style, as Figma
              draws a plain 28px glyph here. */}
          {arrow != null && <Icon icon={arrow} className={COLOR_CLASS[percentColor]} style={{ fontSize: 28, height: 28 }} />}
          <span className={`${styles.percent} ${COLOR_CLASS[percentColor]}`}>{percentText}</span>
        </div>
        <span className={`${styles.value} ${COLOR_CLASS[amount.color]}`}>{amount.text}</span>
      </div>
    </div>
  );

  const costBox = (
    <div className={styles.box}>
      <BoxTitle label="Cost" width={320} mobile={mobile} hint={<BreakdownHint title="Cost breakdown" caption="What the job cost the company" sums={sums.filter((s) => s.kind !== "discount")} value={(s) => s.cost} />} />
      <span className={`${styles.value} ${COLOR_CLASS[valueColor]}`}>{formatAmount(cost)}</span>
    </div>
  );

  const subtotalBox = (
    <div className={styles.box}>
      <BoxTitle label="Subtotal" width={320} mobile={mobile} hint={<BreakdownHint title="Subtotal breakdown" caption="What the job was charged" sums={sums} value={(s) => s.price} />} />
      <span className={`${styles.value} ${COLOR_CLASS[valueColor]}`}>{formatAmount(subtotal)}</span>
    </div>
  );

  return (
    <DisplayModule
      title="Profitability"
      content={
        mobile ? (
          <div className={styles.stack}>
            {profitabilityBox}
            {costBox}
            {subtotalBox}
          </div>
        ) : (
          // The desktop column can be narrow (a small window): below 440px the
          // side-by-side boxes squeeze their labels away, so they stack like
          // on mobile (not drawn in Figma).
          <div className={styles.container}>
            <div className={styles.row}>
              {profitabilityBox}
              <div className={styles.group}>
                {costBox}
                {subtotalBox}
              </div>
            </div>
          </div>
        )
      }
    />
  );
}
