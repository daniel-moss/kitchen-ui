import { ReactNode } from "react";

import AvatarDiscount from "../../../components/Avatar/AvatarDiscount";
import AvatarLaborRate from "../../../components/Avatar/AvatarLaborRate";
import AvatarOther from "../../../components/Avatar/AvatarOther";
import AvatarProduct from "../../../components/Avatar/AvatarProduct";
import { Divider } from "../../../components/Divider/Divider";
import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import HintTrigger from "../../../components/Hint/HintTrigger";
import HoverHint from "../../../components/Hint/HoverHint";
import { Icon } from "../../../components/Icon/Icon";
import ItemGroup from "../../../components/ItemGroup/ItemGroup";
import ItemTextBlock from "../../../components/ItemText/ItemText/ItemTextBlock";
import { ItemTextLineColor } from "../../../components/ItemText/ItemText/ItemTextLine.types";
import ListItem from "../../../components/ListItem/ListItem";
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
//   Percent       = Profitability / Cost × 100, up to 1 decimal
//   Cost          = the sum of every line's cost (discounts have none)
//   Subtotal      = Labor rates + Products + Other charges + Discounts
//
// States: profit (arrow up-right, success), loss (arrow down-left, error — the
// percent carries NO minus, the amount does), zero ("0%" / "$0.00" strong, no
// arrow), no cost ("N/A" — the percent cannot be calculated) and no lines at
// all (every value placeholder).

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

const AVATAR: Record<Kind, ReactNode> = {
  labor: <AvatarLaborRate size="xl" />,
  product: <AvatarProduct size="xl" />,
  other: <AvatarOther size="xl" />,
  discount: <AvatarDiscount size="xl" />,
};

// The compact rows' 14px icons — the same glyphs the avatars draw.
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

/** Profit ÷ cost × 100, up to 1 decimal, no sign (the arrow carries it). */
function formatPercent(profit: number, cost: number): string {
  const p = Math.round((Math.abs(profit) / cost) * 1000) / 10;
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

function HintCopy({ title, caption, compact }: { title: string; caption: string; compact?: boolean }) {
  return (
    <div className={compact ? styles.copyCompact : styles.copy}>
      <span className={styles.copyTitle}>{title}</span>
      <span className={styles.copyCaption}>{caption}</span>
    </div>
  );
}

function HintTotal({ label, value, color }: { label: string; value: string; color: ItemTextLineColor }) {
  return (
    <div className={styles.total}>
      <span className={styles.totalLabel}>{label}</span>
      <span className={COLOR_CLASS[color]}>{value}</span>
    </div>
  );
}

function ProfitabilityHint({ sums, profit }: { sums: TypeSum[]; profit: number }) {
  const total = signed(profit);
  return (
    <>
      <HintCopy title="Profitability = Subtotal − Cost" caption="The difference between what the job was charged and what it cost the company." />
      <ItemGroup>
        {sums.map((s) => {
          // A type with no lines: a placeholder "$0.00" and no caption.
          if (s.count === 0) {
            return <ListItem key={s.kind} avatar={AVATAR[s.kind]} title={s.label} right={<ItemTextBlock align="right" title={formatAmount(0)} titleColor="placeholder" />} />;
          }
          // Discounts have no cost — the row shows only what they take off.
          if (s.kind === "discount") {
            const v = signed(s.price);
            return <ListItem key={s.kind} avatar={AVATAR[s.kind]} title={s.label} right={<ItemTextBlock align="right" title={v.text} titleColor={v.color} />} />;
          }
          const v = signed(s.price - s.cost);
          return (
            <ListItem
              key={s.kind}
              avatar={AVATAR[s.kind]}
              title={s.label}
              right={<ItemTextBlock align="right" variant="titleCaption" title={v.text} titleColor={v.color} caption={`${formatAmount(s.price)} − ${formatAmount(s.cost)}`} />}
            />
          );
        })}
      </ItemGroup>
      <Divider contrast="high" padding="0 var(--size-4)" />
      <HintTotal label="Profitability" value={total.text} color={total.color} />
    </>
  );
}

function BreakdownHint({ title, caption, sums, value }: { title: string; caption: string; sums: TypeSum[]; value: (s: TypeSum) => number }) {
  const total = round3(sums.reduce((acc, s) => acc + value(s), 0));
  return (
    <>
      <HintCopy compact title={title} caption={caption} />
      <ItemGroup>
        {sums.map((s) => (
          <ListItem
            key={s.kind}
            size="compact"
            title={s.label}
            titleSlotLeft={<Icon icon={ICON[s.kind]} size={14} container="square" />}
            right={<ItemTextBlock align="right" title={formatAmount(value(s))} titleColor={s.count === 0 ? "placeholder" : "strong"} />}
          />
        ))}
      </ItemGroup>
      <Divider contrast="high" padding="var(--size-1) var(--size-4) 0" />
      <HintTotal label={title} value={formatAmount(total)} color="strong" />
    </>
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
  const percentText = !hasLines || cost === 0 ? "N/A" : formatPercent(profit, cost);
  const percentColor: ItemTextLineColor = !hasLines || cost === 0 ? "placeholder" : amount.color;
  const arrow = hasLines && cost !== 0 && profit !== 0 ? (profit > 0 ? "arrow-up-right" : "arrow-down-left") : null;
  const valueColor: ItemTextLineColor = hasLines ? "strong" : "placeholder";

  const profitabilityBox = (
    <div className={styles.mainBox}>
      <BoxTitle label="Profitability" width={360} mobile={mobile} hint={<ProfitabilityHint sums={sums} profit={profit} />} />
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
      <BoxTitle label="Cost" width={320} mobile={mobile} hint={<BreakdownHint title="Cost" caption="What the job cost the company" sums={sums.filter((s) => s.kind !== "discount")} value={(s) => s.cost} />} />
      <span className={`${styles.value} ${COLOR_CLASS[valueColor]}`}>{formatAmount(cost)}</span>
    </div>
  );

  const subtotalBox = (
    <div className={styles.box}>
      <BoxTitle label="Subtotal" width={320} mobile={mobile} hint={<BreakdownHint title="Subtotal" caption="What the job was charged" sums={sums} value={(s) => s.price} />} />
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
