import clsx from "clsx";
import { MouseEvent, ReactNode, useRef } from "react";

import AvatarUser from "../../../../components/Avatar/AvatarUser";
import Card from "../../../../components/Card/Card";
import { Divider } from "../../../../components/Divider/Divider";
import { Icon } from "../../../../components/Icon/Icon";
import ItemText from "../../../../components/ItemText/ItemText/ItemText";
import ItemTextBlock from "../../../../components/ItemText/ItemText/ItemTextBlock";
import ValueDisplay from "../../../../components/ValueDisplay/ValueDisplay";
import { equipmentById } from "../../../../data/db";
import { users } from "../../../../data/users";
import { subtypeName } from "../lineDisplay";

import styles from "./Concept4.module.scss";

// CONCEPT 4's card — what every line type's card shares (Figma 28284-40930; Daniel,
// 2026-11-05). The whole card opens the edit form.
//
//   Header   grip (2+ cards) · avatar · name + subtype · the Amount on the right,
//            with how it adds up under it. The subtype shows when the company uses
//            subtypes and at least one exists; none picked reads "No subtype".
//   Row 1    the type's numbers.
//   Row 2    the type's own first value, then Equipment and Technician — those two
//            only when they are set, closing up. Never an empty value.
//   Text     the description, only when there is one.
//
// A label sits ABOVE its value (ItemText): side by side, horizontal ValueDisplays
// put a value closer to the next label than to its own.

/** What the group hands every card, whatever its type. */
export interface LineCardProps {
  title: string;
  /** Opens the edit form. Not used in the public view, where nothing opens. */
  onClick?: () => void;
  /** The list has 2+ cards, so this one drags: the grip shows. */
  draggable?: boolean;
  /**
   * The lifted copy of a dragged card. ItemGroup clones its DIRECT child for it
   * and injects this prop, so a type's card has to pass it on.
   */
  isDragging?: boolean;
  /** False: the company does not use subtypes. Default true. */
  hasSubtypes?: boolean;
  /** The customer's view: no cost or subtype, no grip, nothing opens. */
  isPublic?: boolean;
}

interface LineCardOwnProps extends LineCardProps {
  /** The type's object avatar, xl. */
  avatar: ReactNode;
  /** The type's subtypes, and the line's. */
  subtypes: { id: string; name: string }[];
  subtypeId: string | null;
  /** The Amount, as formatted text. */
  amount: string;
  /** How the Amount adds up. No caption: the Amount alone. */
  amountCaption?: string;
  /** Each row's columns: 3, or 2 for a discount, which has no cost. Default 3. */
  columns?: 2 | 3;
  /** Row 1: the type's `Detail`s. */
  numbers: ReactNode;
  /** Row 2's first value: a labor rate's dates, a product's location. */
  lead?: ReactNode;
  equipmentId?: string;
  technicianId?: number;
  description: string;
}

/** One labelled value. */
export function Detail({ label, value, slotLeft, lines }: { label: string; value: string; slotLeft?: ReactNode; lines?: "wrap" }) {
  return <ItemText variant="captionTitle" caption={label} title={value} titleStyle="bodyRegular" titleSlotLeft={slotLeft} titleLines={lines} />;
}

// ItemGroup starts a drag from the grip at once, or after a 250ms press anywhere.
const LONG_PRESS_MS = 250;

export default function LineCard({
  title,
  onClick,
  draggable = false,
  isDragging = false,
  hasSubtypes = true,
  isPublic = false,
  avatar,
  subtypes,
  subtypeId,
  amount,
  amountCaption,
  columns = 3,
  numbers,
  lead,
  equipmentId,
  technicianId,
  description,
}: LineCardOwnProps) {
  // The release of a drag also fires a click, which must not open the form.
  // ItemGroup only swallows that click for ListItems and for its "cards" view,
  // and this list is its plain view — so the card tells them apart itself.
  const press = useRef<{ at: number; onGrip: boolean } | null>(null);
  const click = (event: MouseEvent<HTMLElement>) => {
    const started = press.current;
    press.current = null;
    if (started != null && (started.onGrip || Date.now() - started.at >= LONG_PRESS_MS)) {
      event.stopPropagation();
      return;
    }
    onClick?.();
  };

  const showSubtype = !isPublic && hasSubtypes && subtypes.length > 0;
  const subtype = subtypeName(subtypes, subtypeId);
  const equipment = equipmentId != null ? equipmentById(equipmentId)?.displayName : undefined;
  const tech = technicianId != null ? users.find((user) => user.id === technicianId) : undefined;
  const hasNames = lead != null || equipment != null || tech != null;

  return (
    <Card
      padding="var(--size-4)"
      dragging={isDragging}
      onClick={isPublic ? undefined : click}
      onPointerDownCapture={(event) => {
        press.current = { at: Date.now(), onGrip: (event.target as Element).closest("[data-listitem-handle]") != null };
      }}
      className={isPublic ? styles.staticCard : undefined}
      bodyClassName={isPublic ? styles.staticBody : undefined}
    >
      <div className={styles.body}>
        <div className={styles.header}>
          {draggable && (
            <span className={styles.grip} data-listitem-handle="" aria-hidden="true">
              <Icon icon={isDragging ? "arrows-up-down" : "grip-dots-vertical"} pack={isDragging ? "regular" : "solid"} size={14} container="square" />
            </span>
          )}
          {avatar}
          <ItemText
            className={styles.name}
            variant={showSubtype ? "titleCaption" : "title"}
            title={title}
            caption={subtype ?? "No subtype"}
            captionColor={subtype != null ? "subtle" : "placeholder"}
            right={<ItemTextBlock align="right" variant={amountCaption != null ? "titleCaption" : "title"} title={amount} caption={amountCaption} />}
          />
        </div>

        <Divider contrast="low" />

        <div className={styles.details}>
          <div className={clsx(styles.detailsRow, columns === 2 && styles.twoColumns)}>{numbers}</div>
          {hasNames && (
            <div className={clsx(styles.detailsRowNames, columns === 2 && styles.twoColumns)}>
              {lead != null && <div className={styles.lead}>{lead}</div>}
              {equipment != null && <Detail label="Equipment" value={equipment} />}
              {tech != null && <Detail label="Technician" value={tech.name} slotLeft={<AvatarUser size="xs" imageSrc={tech.avatar} />} />}
            </div>
          )}
        </div>

        {description !== "" && (
          <>
            <Divider contrast="low" />
            <ValueDisplay label="Description" orientation="vertical" value={description} />
          </>
        )}
      </div>
    </Card>
  );
}
