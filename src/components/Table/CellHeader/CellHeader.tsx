import { KeyboardEvent } from "react";

import clsx from "clsx";

import { Icon } from "../../Icon/Icon";
import { SkeletonTypography } from "../../SkeletonTypography/SkeletonTypography";
import TruncatingText from "../../Tooltip/TruncatingText";
import styles from "./CellHeader.module.scss";
import { CellDataType, CellHeaderProps, CellSortOrder } from "./CellHeader.types";

// The icon shown on a sortable column that the table is NOT currently sorted
// by. It is always visible, so sortability never has to be discovered by
// clicking.
const NEUTRAL_SORT_ICON = "arrow-up-arrow-down";

const SORT_ICONS: Record<CellDataType, Record<CellSortOrder, string>> = {
  alphabetical: { ascending: "arrow-down-a-z", descending: "arrow-up-z-a" },
  numerical: { ascending: "arrow-down-1-9", descending: "arrow-up-9-1" },
  timing: { ascending: "arrow-down-short-wide", descending: "arrow-up-wide-short" },
  other: { ascending: "arrow-down-short-wide", descending: "arrow-up-wide-short" },
};

/**
 * One column header in a table header row.
 *
 * Like `CellBody`, it owns its horizontal padding, its alignment and the pinned
 * boundary — never its height or the divider, which belong to `TableRow`.
 *
 * Sortability is the axis that decides everything interactive: a sortable
 * header is clickable, focusable, shows hover and pressed states, and always
 * carries a sort icon. A non-sortable header has none of that.
 */
export function CellHeader({
  label,
  align = "left",
  width,
  isSortable = false,
  dataType = "other",
  sortOrder,
  isPinned = false,
  pinnedOffset = 0,
  isLastPinned = false,
  isLoading = false,
  onClick,
  className,
}: CellHeaderProps) {
  const isSorted = isSortable && sortOrder !== undefined;
  const sortIcon = sortOrder ? SORT_ICONS[dataType][sortOrder] : NEUTRAL_SORT_ICON;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      role="columnheader"
      aria-sort={isSortable ? (sortOrder ?? "none") : undefined}
      tabIndex={isSortable && !isLoading ? 0 : undefined}
      onClick={isSortable && !isLoading ? onClick : undefined}
      onKeyDown={isSortable && !isLoading ? handleKeyDown : undefined}
      className={clsx(
        styles.header,
        styles[align],
        {
          [styles.sortable]: isSortable && !isLoading,
          [styles.sorted]: isSorted,
          [styles.pinned]: isPinned,
          [styles.lastPinned]: isLastPinned,
        },
        className,
      )}
      style={{
        ...(width === undefined ? undefined : { width, minWidth: width }),
        // The sticky offset — where this cell freezes while the table scrolls.
        ...(isPinned ? { left: pinnedOffset } : undefined),
      }}
    >
      {isLoading ? (
        <SkeletonTypography variant="captionMD" className={styles.skeleton} />
      ) : (
        <>
          {isPinned && <Icon icon="thumbtack" pack="solid" size={10} className={styles.pinIcon} />}
          <span className={styles.content}>
            <TruncatingText text={label} className={styles.label} />
            {isSortable && <Icon icon={sortIcon} size={12} className={styles.sortIcon} />}
          </span>
        </>
      )}
    </div>
  );
}
