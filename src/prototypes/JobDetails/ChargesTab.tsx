import { ReactNode, useState } from "react";
import clsx from "clsx";

import Avatar from "../../components/Avatar/Avatar";
import Counter from "../../components/Counter/Counter";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import GroupLabel from "../../components/GroupLabel/GroupLabel";
import IconButton from "../../components/IconButton/IconButton";
import ListItem from "../../components/ListItem/ListItem";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import ListItemTextRight from "../../components/ListItem/ListItemTextRight";
import { noop } from "./shared";

import styles from "./ChargesTab.module.scss";

// ---------------------------------------------------------------------------
// The "Charges" sub-tab (Figma desktop 23825-12772 / mobile 24161-53121):
// a Charges line-item list module + a Profitability stat module + a Technician
// utilization stat module. Realistic data for the walk-in cooler refrigeration
// job (jobData.ts). Hints skipped (Daniel); module buttons are display-only.
// ---------------------------------------------------------------------------

export type Charge = { id: string; title: string; caption: string; total: string; unit: string };
export type ChargeGroup = { key: string; label: string; icon: string; subtotal: string; items: Charge[] };

// Labor + Products have 2 lines each (drag reorder ON); Other has 1 (drag OFF).
// Exported — the Complete-job flow's Charges step reuses the same data (one
// source), rendered as a separate DisplayModule per group.
export const GROUPS: ChargeGroup[] = [
  {
    key: "labor",
    label: "Labor",
    icon: "tag",
    subtotal: "$330.00",
    items: [
      {
        id: "l1",
        title: "Diagnostic & inspection",
        caption: "Inspected the compressor, refrigerant charge, and door seal on the 48-inch walk-in.",
        total: "$110.00",
        unit: "$110.00 x 1 hr",
      },
      {
        id: "l2",
        title: "Compressor & refrigerant service",
        caption: "Recovered and recharged refrigerant, then verified the compressor cycling normally.",
        total: "$220.00",
        unit: "$110.00 x 2 hr",
      },
    ],
  },
  {
    key: "products",
    label: "Products",
    icon: "box-taped",
    subtotal: "$158.00",
    items: [
      {
        id: "p1",
        title: 'Walk-in door gasket, 48"',
        caption: "Magnetic replacement gasket for a 48-inch walk-in cooler door.",
        total: "$86.00",
        unit: "$86.00 x 1",
      },
      {
        id: "p2",
        title: "R-404A refrigerant",
        caption: "Low-temperature refrigerant, sold per pound.",
        total: "$72.00",
        unit: "$24.00 x 3",
      },
    ],
  },
  {
    key: "other",
    label: "Other",
    icon: "tag",
    subtotal: "$75.00",
    items: [
      {
        id: "o1",
        title: "Trip charge",
        caption: "Standard dispatch fee for an on-site service visit.",
        total: "$75.00",
        unit: "$75.00 x 1",
      },
    ],
  },
];

const SUBTOTAL = "$563.00";

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
      accordion={false}
      divider={!isLast}
      onReorder={draggable ? reorder : undefined}
    >
      {items.map((it) => {
        const common = {
          variant: "titleCaption" as const,
          title: it.title,
          caption: it.caption,
          captionLines: 1 as const,
          avatar: <Avatar type="object" content="icon" icon={group.icon} size="xl" />,
          right: <ListItemTextRight variant="titleCaption" title={it.total} caption={it.unit} />,
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

export default function ChargesTab({ mobile = false }: { mobile?: boolean }) {
  return (
    <>
      {/* Charges list — line items grouped by Labor / Products / Other. */}
      <DisplayModule
        title="Charges"
        titleSlotRight={<Counter value={GROUPS.reduce((n, g) => n + g.items.length, 0)} />}
        content={
          <div className={styles.chargesBody}>
            {GROUPS.map((g, i) => (
              <ChargesGroup key={g.key} group={g} isLast={i === GROUPS.length - 1} />
            ))}
            <div className={styles.subtotalWrap}>
              <div className={styles.subtotalBox}>
                <span className={styles.subtotalLabel}>Subtotal:</span>
                <span className={styles.subtotalValue}>{SUBTOTAL}</span>
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
                <span className={styles.bigNumber}>50%</span>
              </div>
              <span className={styles.mainSecondary}>+$500.00</span>
            </div>
          </div>
        }
        rows={
          <>
            <StatRow label="Cost" value="$1,000.00" />
            <StatRow label="Total" value="$1,500.00" />
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
