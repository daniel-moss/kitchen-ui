import { MouseEvent, useState } from "react";

import Badge from "../../components/Badge/Badge";
import SelectField from "../../components/Fields/SelectField/SelectField";
import LabelsSelectList from "./LabelsSelectList";
import { useSelectPopover } from "./selectPopover";

import styles from "./LabelsField.module.scss";

// The "Labels" field of every form (Figma "Labels" SelectList file, Input
// 12844-7094): a multi-select SelectField with the counter ("3 · Labels
// selected", one pick shows its name), the picked labels as dismissible lg
// Badges under it — 12px below the field, 8px apart, wrapping — and the shared
// LabelsSelectList opening under the field (inline on desktop, drawer on
// mobile). The caller wraps it in its own `Input label="Labels"` or
// FormModule, so the label row stays the form's.
//
// SHARED since 2026-10-25 (Daniel: the updated Labels behaviour "should be
// used everywhere where there is a Labels input"). Six forms each carried
// their own copy of the field and the list until then.
//
// The badge row follows the layout-freeze rule: frozen while the list is
// open, synced when it closes — the card is fixed where it opened and must
// not drift. The field's counter keeps updating live.

export interface LabelsFieldProps {
  /** The picked labels, by name, in pick order. */
  value: string[];
  onChange: (labels: string[]) => void;
  /** The workspace's label pool, by name. Labels created here join it for as long as the field is mounted. */
  pool: string[];
  /** A label created from the search — for a caller that keeps a longer-lived pool. */
  onCreate?: (label: string) => void;
  mobile: boolean;
}

export default function LabelsField({ value, onChange, pool, onCreate, mobile }: LabelsFieldProps) {
  const pop = useSelectPopover(mobile);
  const [created, setCreated] = useState<string[]>([]);

  const shownLabels = pop.freeze(value);

  return (
    <div className={styles.stack}>
      <SelectField
        multiSelect
        count={value.length}
        value={value.length === 1 ? value[0] : undefined}
        multiSelectLabel="Labels selected"
        onClearSelection={() => onChange([])}
        open={pop.open}
        onClick={(event: MouseEvent<HTMLDivElement>) => pop.toggle(event.currentTarget)}
      />
      {shownLabels.length > 0 && (
        <div className={styles.badges}>
          {shownLabels.map((name) => (
            <Badge key={name} size="lg" isDismissable onDismiss={() => onChange(value.filter((row) => row !== name))}>
              {name}
            </Badge>
          ))}
        </div>
      )}

      <LabelsSelectList
        pop={pop}
        open={pop.open}
        onClose={pop.close}
        labels={value}
        pool={[...pool, ...created.filter((name) => !pool.includes(name))]}
        onCreate={(name) => {
          setCreated((prev) => [...prev, name]);
          onCreate?.(name);
        }}
        // Inline (desktop) this fires on every tick; the mobile drawer's
        // Apply closes it as well.
        onSave={(next) => {
          onChange(next);
          if (mobile) pop.close();
        }}
        breakpoint={mobile ? "mobile" : "desktop"}
      />
    </div>
  );
}
