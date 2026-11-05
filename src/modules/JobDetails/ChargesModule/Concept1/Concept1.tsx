import clsx from "clsx";

import Counter from "../../../../components/Counter/Counter";
import DisplayModule from "../../../../components/DisplayModule/DisplayModule";
import { Divider } from "../../../../components/Divider/Divider";
import EmptyState from "../../../../components/EmptyState/EmptyState";
import GroupLabel from "../../../../components/GroupLabel/GroupLabel";
import IconButton from "../../../../components/IconButton/IconButton";
import ItemGroup from "../../../../components/ItemGroup/ItemGroup";
import HoverTooltip from "../../../../components/Tooltip/HoverTooltip";
import { formatCurrency } from "../../../../app/listData";
import { ChargeLinesOptions, ChargeTypeView, useChargeLines } from "../chargeLines";

import styles from "./Concept1.module.scss";

// ---------------------------------------------------------------------------
// CONCEPT 1 — ONE "Charges" module (the layout of the live Summary-tab module,
// Figma 23825-12772 / 27083-29090) with FOUR groups that are always shown —
// Labor rates, Products, Other charges, Discounts — each an ItemGroup headed
// by a GroupLabel (its total as the caption, a plus on the
// right), then a medium divider and the subtotal row.
//
// Since 2026-11-03 (Daniel) the lines, the SelectLists and the edit forms are
// the SHARED ones (../chargeLines) — exactly Concept 2's. Concept 1's own:
// this layout, and its rows ("clickable"): a click opens the line's edit form,
// a group with 2+ lines drags to reorder, and a Delete IconButton replaces the
// "More actions" menu — no accordion, no details. It is NOT the module the
// Job Details page renders: the page keeps the original (../../ChargesTab.tsx),
// which this concept was copied from and no longer follows.
// ---------------------------------------------------------------------------

export type ChargesConcept1Props = Omit<ChargeLinesOptions, "rowStyle" | "linesOpen">;

// One charges group. An empty group shows no amount — a "$0.00" in its
// caption says nothing.
function ChargesGroup({ title, addLabel, empty, count, total, items, onAdd, onReorder, isLast, readOnly }: ChargeTypeView & { isLast: boolean; readOnly: boolean }) {
  return (
    <ItemGroup
      label={
        <GroupLabel
          variant="primary"
          label={title}
          caption={count > 0 ? formatCurrency(total) : undefined}
          slotRight={
            readOnly ? undefined : (
              <HoverTooltip text={addLabel}>
                <IconButton icon="plus" variant="ghost" size="md" aria-label={addLabel} onClick={onAdd} />
              </HoverTooltip>
            )
          }
        />
      }
      divider={!isLast}
      onReorder={onReorder}
    >
      {count === 0 ? <EmptyState caption={empty} /> : items}
    </ItemGroup>
  );
}

export default function ChargesConcept1(props: ChargesConcept1Props) {
  const readOnly = props.readOnly ?? false;
  // Concept 1's rows: click to edit, drag to reorder, a Delete button.
  const { types, subtotal, overlays } = useChargeLines({ ...props, rowStyle: "clickable" });
  const count = types.reduce((acc, type) => acc + type.count, 0);

  return (
    <>
      <DisplayModule
        title="Charges"
        titleSlotRight={count > 0 ? <Counter value={count} /> : undefined}
        bodyPadded={false}
        content={
          <div className={styles.body}>
            {types.map((type, index) => (
              <ChargesGroup key={type.kind} {...type} isLast={index === types.length - 1} readOnly={readOnly} />
            ))}

            {/* Footer (Figma): a medium divider, then the subtotal row. Nothing
                charged yet reads as a placeholder. */}
            <Divider contrast="medium" />
            <div className={styles.footer}>
              <span className={styles.footerLabel}>Subtotal (before tax)</span>
              <span className={clsx(styles.footerValue, subtotal === 0 && styles.footerValueEmpty)}>{formatCurrency(subtotal)}</span>
            </div>
          </div>
        }
      />
      {overlays}
    </>
  );
}
