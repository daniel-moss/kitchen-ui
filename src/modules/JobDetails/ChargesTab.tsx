import { ReactNode, useState } from "react";
import clsx from "clsx";

import Avatar from "../../components/Avatar/Avatar";
import Counter from "../../components/Counter/Counter";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import GroupLabel from "../../components/GroupLabel/GroupLabel";
import IconButton from "../../components/IconButton/IconButton";
import ListItem from "../../components/ListItem/ListItem";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import ItemTextBlock from "../../components/ItemText/ItemText/ItemTextBlock";
import { noop } from "./shared";

import styles from "./ChargesTab.module.scss";

// ---------------------------------------------------------------------------
// The "Charges" sub-tab (Figma desktop 23825-12772 / mobile 24161-53121):
// a Charges line-item list module + a Profitability stat module + a Technician
// utilization stat module. Hints skipped (Daniel); module buttons are
// display-only.
//
// The lines come from the JOB (2026-09-28) — see db/jobCharges.ts. They used to
// be one hardcoded set, so an ice-machine descale billed for walk-in cooler
// parts on every one of the 78 jobs.
// ---------------------------------------------------------------------------

// The line-item shapes live with the data now (db/jobCharges.ts) — re-exported
// here so the components that already import them from this file still can.
export type { Charge, ChargeGroup } from "../../data/db";
import type { ChargeGroup } from "../../data/db";

// One charges group (static — the accordion was removed, Daniel 2026-07-27).
// Drag reorder is enabled only when the group holds more than one line item
// (Daniel's rule) — a single row has nothing to reorder.
function ChargesGroup({ group, isLast }: { group: ChargeGroup; isLast: boolean }) {
  const [items, setItems] = useState(group.items);
  const draggable = items.length > 1;

  const reorder = (from: number, to: number) =>
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  return (
    <ItemGroup
      label={
        <GroupLabel
          variant="primary"
          label={group.label}
          caption={group.subtotal}
          slotRight={
            <IconButton
              icon="plus"
              variant="ghost"
              size="md"
              aria-label={`Add ${group.label.toLowerCase()} charge`}
              onClick={noop}
            />
          }
        />
      }
      isAccordion={false}
      divider={!isLast}
      onReorder={draggable ? reorder : undefined}
    >
      {items.map((it) => {
        const common = {
          variant: "titleCaption" as const,
          title: it.title,
          caption: it.caption,
          captionLines: 1 as const,
          avatar: <Avatar shape="square" content="icon" icon={group.icon} size="xl" />,
          right: <ItemTextBlock align="right" variant="titleCaption" title={it.total} caption={it.unit} />,
          slotRight: <IconButton icon="ellipsis" variant="ghost" size="md" aria-label="More actions" onClick={noop} />,
        };
        // Drag is on only for multi-item groups (a single row has nothing to reorder).
        return draggable ? <ListItem key={it.id} {...common} isDraggable /> : <ListItem key={it.id} {...common} />;
      })}
    </ItemGroup>
  );
}

// A stat module (Profitability / Technician utilization): a DisplayModule whose
// body is a big "Value" box + a two-row "value group". Prototype-local layout
// (not a DS component). Desktop = 2 columns; mobile = stacked.
function StatModule({
  title,
  mobile,
  valueBox,
  rows,
}: {
  title: string;
  mobile: boolean;
  valueBox: ReactNode;
  rows: ReactNode;
}) {
  return (
    <DisplayModule
      title={title}
      content={
        <div className={clsx(styles.stat, mobile ? styles.statMobile : styles.statDesktop)}>
          {valueBox}
          <div className={styles.rows}>{rows}</div>
        </div>
      }
    />
  );
}

// A stat row inside a value group (label left, value right).
function StatRow({ label, value, small = false }: { label: string; value: string; small?: boolean }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={small ? styles.rowValueSm : styles.rowValue}>{value}</span>
    </div>
  );
}

// Profitability from the job's own charges (2026-09-28 — it used to read a
// fixed $1,000 cost against a $1,500 total on every job). Cost is the
// company's share of what it billed: a demo-level 62%, which is a believable
// margin for field service and keeps the two numbers consistent with the
// lines above them.
const COST_RATIO = 0.62;
const money = (n: number) => `$${n.toFixed(2)}`;

export default function ChargesTab({ mobile = false, groups, subtotal }: { mobile?: boolean; groups: ChargeGroup[]; subtotal: string }) {
  const total = Number(subtotal.slice(1).replace(/,/g, "")) || 0;
  const cost = Math.round(total * COST_RATIO * 100) / 100;
  const profit = Math.round((total - cost) * 100) / 100;
  const margin = total === 0 ? 0 : Math.round((profit / total) * 100);
  return (
    <>
      {/* Charges list — line items grouped by Labor / Products / Other. */}
      <DisplayModule
        title="Charges"
        titleSlotRight={<Counter value={groups.reduce((n, g) => n + g.items.length, 0)} />}
        content={
          <div className={styles.chargesBody}>
            {groups.map((g, i) => (
              <ChargesGroup key={g.key} group={g} isLast={i === groups.length - 1} />
            ))}
            <div className={styles.subtotalWrap}>
              <div className={styles.subtotalBox}>
                <span className={styles.subtotalLabel}>Subtotal:</span>
                <span className={styles.subtotalValue}>{subtotal}</span>
              </div>
            </div>
          </div>
        }
      />

      {/* Profitability — hints skipped. */}
      <StatModule
        title="Profitability"
        mobile={mobile}
        valueBox={
          <div className={styles.valueBox}>
            <div className={styles.valueTitle}>
              <span className={styles.valueLabel}>Profitability</span>
            </div>
            <div className={clsx(styles.valueMain, styles.success)}>
              <div className={styles.mainValue}>
                <i className={clsx("g-arrow-up-right", styles.mainIcon)} aria-hidden="true" />
                <span className={styles.bigNumber}>{margin}%</span>
              </div>
              <span className={styles.mainSecondary}>+{money(profit)}</span>
            </div>
          </div>
        }
        rows={
          <>
            <StatRow label="Cost" value={money(cost)} />
            <StatRow label="Total" value={subtotal} />
          </>
        }
      />

      {/* Technician utilization — hints skipped. */}
      <StatModule
        title="Technician utilization"
        mobile={mobile}
        valueBox={
          <div className={styles.valueBox}>
            <div className={styles.valueTitle}>
              <span className={styles.valueLabel}>Utilization</span>
            </div>
            <div className={clsx(styles.valueMain, styles.success)}>
              <div className={styles.mainValue}>
                <span className={styles.bigNumber}>1</span>
              </div>
              <span className={styles.mainSecondary}>Optimal</span>
            </div>
          </div>
        }
        rows={
          <>
            <StatRow label="Billed time" value="3 hr" small />
            <StatRow label="Tracked time" value="3 hr" small />
          </>
        }
      />
    </>
  );
}
