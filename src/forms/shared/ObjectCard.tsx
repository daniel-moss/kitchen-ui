import { ReactNode } from "react";

import Card from "../../components/Card/Card";
import ListItem from "../../components/ListItem/ListItem";
import ListItemSlotIcon from "../../components/ListItem/ListItemSlotIcon";

export interface ObjectCardProps {
  /** The object's avatar (AvatarEquipment, AvatarLocation…). */
  avatar?: ReactNode;
  /** The object's name — a string, or the caller's truncating element. */
  title: ReactNode;
  caption?: ReactNode;
  /** Opens the object. Without it the row is not interactive. */
  onClick?: () => void;
  className?: string;
}

// The picked object, shown as a card under its select field (Figma DS file
// 29019-62714): a Card with --size-1 (4px) padding wrapping the object's
// ListItem row (36px avatar, title + caption, chevron). The SAME card the
// read-only preview uses for an object answer (ValueDisplay `objectCard`).
//
// The CARD owns the interaction (Daniel, 2026-08-06): a ListItem inside a Card
// is always STATIC — the card takes the click and the hover/press states.
export default function ObjectCard({ avatar, title, caption, onClick, className }: ObjectCardProps) {
  return (
    <Card padding="var(--size-1)" className={className} style={{ width: "100%" }} onClick={onClick}>
      <ListItem
        variant="titleCaption"
        title={title}
        caption={caption}
        avatar={avatar}
        slotRight={<ListItemSlotIcon icon="angle-right" />}
        isClickable={false}
      />
    </Card>
  );
}
