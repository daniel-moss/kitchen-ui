import clsx from "clsx";

import ItemText from "../ItemText/ItemText/ItemText";
import ItemTextBlock from "../ItemText/ItemText/ItemTextBlock";

import styles from "./SelectListItemCopy.module.scss";
import { SelectListItemCopyProps } from "./SelectListItemCopy.types";

// SelectListItemCopy — the text block of a SelectListItem: the label, an
// optional tag to its right (label truncates first), and an optional caption
// below. Built on ItemText, the shared row-text component, so the type styles,
// colors, slots and truncation rules are defined once — see Figma "ItemText".
// The label is `bodyMedium` (Inter Medium 14/20), as the SelectListItem node
// draws it; this file used to render it Regular.
export default function SelectListItemCopy({ label, caption, tag, className, ...rest }: SelectListItemCopyProps) {
  return (
    <div className={clsx(styles.copy, className)} {...rest}>
      <ItemText
        variant={caption != null ? "titleCaption" : "title"}
        title={label}
        caption={caption}
        right={tag != null ? <ItemTextBlock align="right" variant="tag" tag={tag} /> : undefined}
      />
    </div>
  );
}
