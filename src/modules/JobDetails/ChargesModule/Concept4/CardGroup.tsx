import { ReactNode } from "react";

import EmptyState from "../../../../components/EmptyState/EmptyState";
import GroupLabel from "../../../../components/GroupLabel/GroupLabel";
import IconButton from "../../../../components/IconButton/IconButton";
import ItemGroup from "../../../../components/ItemGroup/ItemGroup";
import HoverTooltip from "../../../../components/Tooltip/HoverTooltip";
import { formatCurrency } from "../../../../app/listData";

import styles from "./Concept4.module.scss";

// CONCEPT 4's group (Figma 28284-40931): a GroupLabel that collapses its cards, its
// total as the caption and a plus. The cards drag to reorder with 2+ of them, from
// the grip or a long press anywhere, and never in the public view.

interface CardGroupProps {
  title: string;
  /** The plus's name: "Add labor rate". */
  addLabel: string;
  /** The empty state: "No labor rates". */
  empty: string;
  count: number;
  total: number;
  /** The plus — opens the type's SelectList. */
  onAdd: () => void;
  onReorder: (from: number, to: number) => void;
  isPublic: boolean;
  /** The cards. ItemGroup needs them as its direct children. */
  children: ReactNode;
}

/** A card drags only with another to pass (the 2+ lines rule), never in public. */
export const canDragCards = (count: number, isPublic: boolean) => !isPublic && count > 1;

/** The list with one item moved. */
export const moved = <T,>(list: T[], from: number, to: number) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

export default function CardGroup({ title, addLabel, empty, count, total, onAdd, onReorder, isPublic, children }: CardGroupProps) {
  return (
    <ItemGroup
      className={styles.group}
      isAccordion
      defaultOpen
      onReorder={canDragCards(count, isPublic) ? onReorder : undefined}
      label={
        <GroupLabel
          variant="primary"
          label={title}
          // An empty group shows no amount — a "$0.00" says nothing.
          caption={count > 0 ? formatCurrency(total) : undefined}
          slotRight={
            isPublic ? undefined : (
              <HoverTooltip text={addLabel}>
                <IconButton icon="plus" variant="ghost" size="md" aria-label={addLabel} onClick={onAdd} />
              </HoverTooltip>
            )
          }
        />
      }
    >
      {count === 0 ? <EmptyState caption={empty} /> : children}
    </ItemGroup>
  );
}
