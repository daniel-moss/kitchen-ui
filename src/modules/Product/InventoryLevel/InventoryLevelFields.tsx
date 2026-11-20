import CheckboxItem from "../../../components/Checkbox/CheckboxItem";
import TextField from "../../../components/Fields/TextField/TextField";
import Input from "../../../components/Input/Input";
import {
  decimalText,
  isBlank,
  isQuantityText,
  isSignedQuantityText,
  MAX_BIN,
  NO_SUGGESTIONS,
  numberOf,
  overLimitError,
} from "../NewProductForm/productRules";

import { StockFigures } from "./InventoryLevelCard";

import styles from "./InventoryLevelFields.module.scss";

// The edit fields of one inventory level — ONE build for the "Create" form's
// edit card and the side panel's edit Dialog (Figma 3187-42573). Moved here
// on 2026-11-18.
//
//   On hand        required · digits, dot and minus · 3 decimals · 4 digits ·
//                  "text" keyboard (the decimal pad has no minus)
//   On order       optional · no minus · empty = 0 · "decimal" keyboard
//   Set target     a card CheckboxItem holding Target (required, > 0) and
//                  Alert at (optional, lower than Target). Unchecking it keeps
//                  the two values while the form is open.
//   Bin location   optional · 50 characters, red in real time while over

/** The text the form holds while it is open. */
export interface LevelDraft {
  onHand: string;
  onOrder: string;
  hasTarget: boolean;
  target: string;
  alertAt: string;
  binLocation: string;
}

const asText = (value?: number) => (value == null ? "" : String(value));

/**
 * The draft a level opens with. A "Not stocked" location opens EMPTY — no "0"
 * in On hand — so the user types the first count.
 */
export const draftOf = (level?: StockFigures, { emptyOnHand = false } = {}): LevelDraft => ({
  onHand: level == null || emptyOnHand ? "" : asText(level.onHand),
  onOrder: level && level.onOrder !== 0 ? String(level.onOrder) : "",
  hasTarget: level?.target != null,
  target: asText(level?.target),
  alertAt: asText(level?.alertAt),
  binLocation: level?.binLocation ?? "",
});

/** The checks Save / Done runs. */
export const draftErrors = (draft: LevelDraft) => {
  const missingOnHand = isBlank(draft.onHand);
  const missingTarget = draft.hasTarget && isBlank(draft.target);
  const targetNotPositive = draft.hasTarget && !missingTarget && numberOf(draft.target) <= 0;
  const alertNotBelow =
    draft.hasTarget && !missingTarget && !isBlank(draft.alertAt) && numberOf(draft.alertAt) >= numberOf(draft.target);
  const binTooLong = overLimitError(draft.binLocation, MAX_BIN);
  return {
    missingOnHand,
    missingTarget,
    targetNotPositive,
    alertNotBelow,
    binTooLong,
    any: missingOnHand || missingTarget || targetNotPositive || alertNotBelow || binTooLong != null,
  };
};

/** The level a valid draft saves as. */
export const levelOf = (draft: LevelDraft): StockFigures => ({
  onHand: numberOf(draft.onHand),
  // "No value is treated as 0."
  onOrder: numberOf(draft.onOrder),
  // A level saved without a target carries none — the kept values only live
  // while the form is open.
  target: draft.hasTarget ? numberOf(draft.target) : undefined,
  alertAt: draft.hasTarget && !isBlank(draft.alertAt) ? numberOf(draft.alertAt) : undefined,
  binLocation: draft.binLocation.trim(),
});

/** True when the draft would save something different from `level`. */
export const draftChanged = (draft: LevelDraft, initial: LevelDraft) =>
  (Object.keys(draft) as (keyof LevelDraft)[]).some((key) => draft[key] !== initial[key]);

interface InventoryLevelFieldsProps {
  draft: LevelDraft;
  onChange: (draft: LevelDraft) => void;
  /** Turns the required / range errors on — after the first Save. */
  showErrors: boolean;
}

export default function InventoryLevelFields({ draft, onChange, showErrors }: InventoryLevelFieldsProps) {
  const errors = draftErrors(draft);
  const set = (patch: Partial<LevelDraft>) => onChange({ ...draft, ...patch });

  return (
    <div className={styles.fields}>
      <div className={styles.pair}>
        <Input label="On hand">
          <TextField
            value={draft.onHand}
            onChange={(event) => isSignedQuantityText(decimalText(event.target.value)) && set({ onHand: decimalText(event.target.value) })}
            placeholder="0"
            {...NO_SUGGESTIONS}
            isValid={!(showErrors && errors.missingOnHand)}
          />
        </Input>
        <Input label="On order" labelCondition="optional">
          <TextField
            value={draft.onOrder}
            onChange={(event) => isQuantityText(decimalText(event.target.value)) && set({ onOrder: decimalText(event.target.value) })}
            keyboard="decimal"
            placeholder="0"
          />
        </Input>
      </div>

      <CheckboxItem
        variant="card"
        icon="arrow-up-to-line"
        label="Set target"
        checked={draft.hasTarget}
        onChange={(event) => set({ hasTarget: event.target.checked })}
        content={
          <div className={styles.pair}>
            <Input label="Target">
              <TextField
                value={draft.target}
                onChange={(event) => isQuantityText(decimalText(event.target.value)) && set({ target: decimalText(event.target.value) })}
                keyboard="decimal"
                placeholder="0"
                isValid={!(showErrors && (errors.missingTarget || errors.targetNotPositive))}
                errorMessage={errors.targetNotPositive ? "Must be greater than 0" : undefined}
              />
            </Input>
            <Input label="Alert at" labelCondition="optional">
              <TextField
                value={draft.alertAt}
                onChange={(event) => isQuantityText(decimalText(event.target.value)) && set({ alertAt: decimalText(event.target.value) })}
                keyboard="decimal"
                placeholder="0"
                isValid={!(showErrors && errors.alertNotBelow)}
                errorMessage="Must be lower than Target"
              />
            </Input>
          </div>
        }
      />

      <Input label="Bin location" labelCondition="optional">
        <TextField
          value={draft.binLocation}
          onChange={(event) => set({ binLocation: event.target.value })}
          {...NO_SUGGESTIONS}
          isValid={errors.binTooLong == null}
          errorMessage={errors.binTooLong}
        />
      </Input>
    </div>
  );
}
