import { FileType } from "../../components/Card/CardFile.types";

/**
 * A form described as DATA — the single source of truth for a questionnaire.
 * The same schema feeds the form (labels, options, order, reveals) and its
 * read-only preview (Figma "Mapping / Input -> Preview" 24469-37438 and
 * "Mapping / FormModuleGroup -> Preview" 24470-39311).
 */

/** One option of a choice field. `label` defaults to `value`. */
export interface FormOption {
  value: string;
  /** Display text; omit when it is the same as `value`. */
  label?: string;
}

/** A duration answer — the InputGroup's hours + minutes parts. */
export interface FormDurationAnswer {
  hours?: string | number;
  minutes?: string | number;
}

/** A date + time answer. `time` is the display time ("12:00 PM"). */
export interface FormDateTimeAnswer {
  date?: string | Date | null;
  time?: string;
}

/** One picked file (the CardFile props of a MediaField answer). */
export interface FormMediaAnswer {
  name: string;
  type: FileType;
  src?: string;
}

/** Everything an answer can be. Which one applies is decided by the field type. */
export type FormAnswerValue =
  | string
  | string[]
  | Date
  | FormDurationAnswer
  | FormDateTimeAnswer
  | FormMediaAnswer[]
  | null
  | undefined;

/** The answers of one form — flat, keyed by field key. */
export type FormAnswers = Record<string, FormAnswerValue>;

interface FormFieldBase {
  /** Unique key — also the answers key and the form's `data-qid`. */
  key: string;
  /**
   * The field label. Omit when the module title IS the label (Service call's
   * "Additional / Daily notes") — the preview then labels the answer with the
   * module title (Daniel, 2026-08-05).
   */
  label?: string;
  /**
   * Optional field. The form shows the "(optional)" tag; the preview DROPS the
   * tag and hides the answer completely when it is empty.
   */
  optional?: boolean;
  /** Help text under the label. Form only — never shown in the preview. */
  helpText?: string;
  /**
   * Reveal condition. A field whose condition is false is not asked, so it is
   * never previewed (Service call's Resolution / Quote details reveals).
   */
  visibleWhen?: (answers: FormAnswers) => boolean;
}

/** Single-line text. `prefix` / `suffix` are APPENDED to the previewed value. */
export interface FormTextFieldSchema extends FormFieldBase {
  type: "text";
  prefix?: string;
  suffix?: string;
  /** Numeric soft keyboard (form only). */
  keyboard?: "numeric";
}

/** Multi-line text. The preview shows it in full — no truncation. */
export interface FormTextAreaSchema extends FormFieldBase {
  type: "textArea";
}

/**
 * Single-select. `options` may be omitted for a picker fed by live data (the
 * Service call equipment list) — the answer then carries the display text.
 */
export interface FormSelectSchema extends FormFieldBase {
  type: "select";
  options?: FormOption[];
  /** Appended to the previewed value ("Value Suffix"). */
  suffix?: string;
}

/** Multi-select. Previewed as the picked options joined in OPTION order. */
export interface FormMultiSelectSchema extends FormFieldBase {
  type: "multiSelect";
  options: FormOption[];
}

/** Radio group — one option. */
export interface FormRadioSchema extends FormFieldBase {
  type: "radio";
  options: FormOption[];
  /** Form only. */
  orientation?: "horizontal" | "vertical";
}

/** Checkbox group — previewed as the ticked options joined in OPTION order. */
export interface FormCheckboxSchema extends FormFieldBase {
  type: "checkbox";
  options: FormOption[];
}

/** A row of Chips. `multiple` makes it a multi-select. */
export interface FormChipsSchema extends FormFieldBase {
  type: "chips";
  options: FormOption[];
  multiple?: boolean;
}

/** Date only — previewed as "Monday, January 1, 2026". */
export interface FormDateSchema extends FormFieldBase {
  type: "date";
}

/** Date + time — previewed as "Monday, January 1, 2026 at 12:00 PM". */
export interface FormDateTimeSchema extends FormFieldBase {
  type: "dateTime";
}

/** Hours + minutes — previewed as "2 hr 30 min" (empty parts are dropped). */
export interface FormDurationSchema extends FormFieldBase {
  type: "duration";
}

/** File upload — previewed as CardFile tiles. */
export interface FormMediaSchema extends FormFieldBase {
  type: "media";
  /** `accept` of the file input (form only). */
  accept?: string;
}

export type FormFieldSchema =
  | FormTextFieldSchema
  | FormTextAreaSchema
  | FormSelectSchema
  | FormMultiSelectSchema
  | FormRadioSchema
  | FormCheckboxSchema
  | FormChipsSchema
  | FormDateSchema
  | FormDateTimeSchema
  | FormDurationSchema
  | FormMediaSchema;

export interface FormModuleSchema {
  id: string;
  /**
   * The module title. Omit for a FLAT form (Hot Side - Repair has no modules) —
   * the preview then renders the answers without a FormModule wrapper.
   */
  title?: string;
  caption?: string;
  /** Form-only "(optional)" condition on the title — dropped in the preview. */
  optional?: boolean;
  /**
   * Form-only guidance banner (an AlertBanner) — never shown in the preview
   * (Figma annotation: "Is not being shown in the preview").
   */
  banner?: string;
  fields: FormFieldSchema[];
}

export interface FormSchema {
  id: string;
  /** The form template's name. */
  name: string;
  modules: FormModuleSchema[];
}

// ---- the preview model (what buildFormPreview returns) ----------------------

/** One previewed answer — a label with either text or files. */
export type PreviewAnswer =
  | { key: string; label: string; kind: "text"; value: string }
  | { key: string; label: string; kind: "media"; files: FormMediaAnswer[] };

/** One previewed module. Modules with no answers are dropped before this. */
export interface PreviewModule {
  id: string;
  title?: string;
  caption?: string;
  answers: PreviewAnswer[];
}
