import { MouseEvent } from "react";

import Badge from "../../../components/Badge/Badge";
import SelectField from "../../../components/Fields/SelectField/SelectField";
import FormModule from "../../../components/FormModule/FormModule";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import { JOB_LABELS } from "../../../data/db";
import { SelectPopoverList, useSelectPopover } from "../../shared/selectPopover";

import styles from "./LabelsModule.module.scss";

// The "Labels" module of the "New Job" form (Figma 17216-69650; behavior from
// the shared "Labels" Select List doc, file XBFKW2ThcuVxPbQQHw1XY2). An
// optional multi-select: the field carries the counter, the picked labels
// render as dismissible badges below it (wrapping), and an unmatched search
// offers "Create new label:". The badge row follows the layout-freeze rule —
// it syncs when the list closes, so the open card never drifts.

// Labels created in the flow — module scope, like the created sources.
const sessionLabels: string[] = [];

export interface LabelsModuleProps {
  value: string[];
  onChange: (labels: string[]) => void;
  mobile: boolean;
}

export default function LabelsModule({ value, onChange, mobile }: LabelsModuleProps) {
  const pop = useSelectPopover(mobile);

  const options = [...JOB_LABELS.map((row) => row.name), ...sessionLabels];

  const toggle = (name: string) =>
    onChange(value.includes(name) ? value.filter((row) => row !== name) : [...value, name]);

  const createLabel = (query: string) => {
    if (!options.includes(query)) sessionLabels.push(query);
    if (!value.includes(query)) onChange([...value, query]);
  };

  // Frozen while the list is open (the layout-freeze rule) — the badges sync
  // on close. The field's own counter keeps updating live.
  const shownLabels = pop.freeze(value);

  return (
    <>
      <FormModule title="Labels" titleCondition="optional">
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
                <Badge key={name} size="lg" isDismissable onDismiss={() => toggle(name)}>
                  {name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </FormModule>

      <SelectPopoverList
        pop={pop}
        mobile={mobile}
        title="Labels"
        multiSelect
        searchable
        searchPlaceholder="Label..."
        createFromSearch={{ label: "Create new label:", onCreate: createLabel }}
      >
        <SelectListItemGroup>
          {options.map((name) => (
            <SelectListItem
              key={name}
              variant="default"
              multiSelect
              label={name}
              selected={value.includes(name)}
              onClick={() => toggle(name)}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </>
  );
}
