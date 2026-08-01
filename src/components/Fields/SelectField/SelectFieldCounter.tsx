import { MouseEvent } from "react";
import clsx from "clsx";

import { Icon } from "../../Icon/Icon";
import HoverTooltip from "../../Tooltip/HoverTooltip";

import styles from "./SelectFieldCounter.module.scss";
import { SelectFieldCounterProps } from "./SelectFieldCounter.types";

// SelectFieldCounter — the pill shown in a multi-select field's filled state:
// the count of selected options plus a × button to clear the selection. Read-only
// shows an outlined number with no ×. See Figma "SelectField › Counter".
export default function SelectFieldCounter({ count, onClear, readOnly = false, className }: SelectFieldCounterProps) {
  return (
    <span className={clsx(styles.counter, readOnly && styles.readOnly, className)}>
      <span className={styles.count}>{count}</span>
      {!readOnly && (
        <HoverTooltip text="Clear all">
          <button
            type="button"
            className={styles.clear}
            aria-label="Clear selection"
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              onClear?.();
            }}
          >
            <Icon icon="xmark" pack="regular" size={12} />
          </button>
        </HoverTooltip>
      )}
    </span>
  );
}
