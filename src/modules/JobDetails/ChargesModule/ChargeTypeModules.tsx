import { ReactNode } from "react";

import Counter from "../../../components/Counter/Counter";
import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import EmptyState from "../../../components/EmptyState/EmptyState";
import IconButton from "../../../components/IconButton/IconButton";
import ItemGroup from "../../../components/ItemGroup/ItemGroup";
import ItemTextBlock from "../../../components/ItemText/ItemText/ItemTextBlock";
import HoverTooltip from "../../../components/Tooltip/HoverTooltip";
import { formatCurrency } from "../../../app/listData";

import { ChargeTypeView } from "./chargeLines";
import SubtotalModule from "./SubtotalModule";

import styles from "./ChargeTypeModules.module.scss";

// The layout Concepts 2 and 3 share: one DisplayModule PER charge
// type — its header carries the line count, the type's total and the plus —
// then a body-only module with the subtotal. Only their rows differ.

// One charge type: count + total in the header (the total stays at "$0.00"
// when empty, the docs' Empty frames), a plus on the right, then its rows.
function TypeModule({ title, addLabel, empty, count, total, items, onAdd, onReorder, lineGap }: ChargeTypeView & { lineGap: boolean }) {
  return (
    <DisplayModule
      title={title}
      titleSlotRight={count > 0 ? <Counter value={count} /> : undefined}
      textRight={<ItemTextBlock align="right" variant="title" title={formatCurrency(total)} />}
      slotRight={
        <HoverTooltip text={addLabel}>
          <IconButton icon="plus" variant="ghost" size="md" aria-label={addLabel} onClick={onAdd} />
        </HoverTooltip>
      }
      bodyPadded={false}
      content={
        count === 0 ? (
          <EmptyState caption={empty} />
        ) : (
          <ItemGroup className={lineGap ? styles.lineGroup : undefined} onReorder={onReorder}>
            {items}
          </ItemGroup>
        )
      }
    />
  );
}

interface ChargeTypeModulesProps {
  types: ChargeTypeView[];
  subtotal: number;
  /** The SelectLists and forms from `useChargeLines`. */
  overlays: ReactNode;
  /**
   * Concept 2's override: the rows 4px apart. False keeps ItemGroup's own
   * spacing (Concept 3, Daniel 2026-11-04). Default true.
   */
  lineGap?: boolean;
}

export default function ChargeTypeModules({ types, subtotal, overlays, lineGap = true }: ChargeTypeModulesProps) {
  return (
    <div className={styles.stack}>
      {types.map((type) => (
        <TypeModule key={type.kind} {...type} lineGap={lineGap} />
      ))}
      <SubtotalModule subtotal={subtotal} />
      {overlays}
    </div>
  );
}
