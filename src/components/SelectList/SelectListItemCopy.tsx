import clsx from "clsx";

import ItemText from "../ItemText/ItemText/ItemText";
import ItemTextBlock from "../ItemText/ItemText/ItemTextBlock";

import styles from "./SelectListItemCopy.module.scss";
import { SelectListItemCopyProps } from "./SelectListItemCopy.types";

// SelectListItemCopy — the text block of a SelectListItem: the label, an
// optional tag to its right (label truncates first), and an optional caption
// below. Built on ItemText, the shared row-text component, so the type styles,
// colors, slots and truncation rules are defined once — see Figma "ItemText".
//
// This file serves the DEFAULT variant only — the object variant draws its own
// title/caption inside SelectListItem — and the default variant's label is
// `bodyRegular` (Inter Regular 14/20, `body/400 compact` in the node), the same
// weight a MenuItem uses. Only the OBJECT variant's title is Medium, which is
// what ItemTextBlock defaults to, so the override here is deliberate: without
// it a plain option renders heavier than the design and heavier than the
// "Custom…" MenuItem that can sit in the same list's footer.
export default function SelectListItemCopy({ label, caption, tag, className, ...rest }: SelectListItemCopyProps) {
  return (
    <div className={clsx(styles.copy, className)} {...rest}>
      <ItemText
        variant={caption != null ? "titleCaption" : "title"}
        title={label}
        titleStyle="bodyRegular"
        caption={caption}
        right={tag != null ? <ItemTextBlock align="right" variant="tag" tag={tag} /> : undefined}
      />
    </div>
  );
}
