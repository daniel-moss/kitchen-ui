import { ReactNode } from "react";

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
  /**
   * A VIDEO's poster frame — the card tile is an `<img>`, so the video file
   * itself cannot be the thumbnail. Without it a video gets the placeholder.
   */
  poster?: string;
  /** File size in bytes — the file menu shows it next to "Download". */
  size?: number;
}

/**
 * A picked OBJECT (equipment, location, client…). The preview shows it as a
 * card with a ListItem, so the caller supplies the object's own DS avatar.
 */
export interface FormObjectAnswer {
  title: string;
  caption?: string;
  /** The object's avatar element (AvatarEquipment, AvatarLocation…). */
  avatar?: ReactNode;
}

/**
 * A text answer that carries an icon or avatar in front of it (Figma
 * "SelectField / Single-select + Icon / + Avatar"). The element is the
 * caller's — the schema never invents an icon.
 */
export interface FormTextAnswer {
  text: string;
  /** Icon (14px) or avatar (xs) shown in front of the value. */
  slotLeft?: ReactNode;
}

/** Everything an answer can be. Which one applies is decided by the field type. */
export type FormAnswerValue =
  | string
  | string[]
  | Date
  | FormDurationAnswer
  | FormDateTimeAnswer
  | FormTextAnswer
  | FormObjectAnswer
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
 * Single-select. `options` may be omitted for a picker fed by live data — the
 * answer then carries the display text (optionally with an icon or avatar in
 * front of it, as a `FormTextAnswer`).
 */
export interface FormSelectSchema extends FormFieldBase {
  type: "select";
  options?: FormOption[];
  /** Appended to the previewed value ("Value Suffix"). */
  suffix?: string;
}

/**
 * A select that picks an OBJECT (equipment, location…). The preview shows it
 * as a card with the object's avatar, title and caption instead of plain text
 * (Figma "SelectField (object)").
 */
export interface FormObjectSelectSchema extends FormFieldBase {
  type: "objectSelect";
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
  | FormObjectSelectSchema
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
   * The STEP this module belongs to, for a form built as a stepper (PM - HVAC).
   * The preview groups the modules by step and puts the step's name above its
   * content as a heading (Figma "Mapping / Step -> Preview" 24631-58494).
   * Omit for a form with no steps.
   */
  step?: string;
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

/**
 * One previewed answer. `kind` is the ValueDisplay kind the mapping picks for
 * the field type (Figma "Mapping / Input -> Preview" 24469-37438):
 * `longText` for a TextArea, `files` for a MediaField, `objectCard` for an
 * object select, `shortText` for everything else.
 */
export type PreviewAnswer =
  | { key: string; label: string; kind: "shortText"; value: string; slotLeft?: ReactNode }
  | { key: string; label: string; kind: "longText"; value: string }
  | { key: string; label: string; kind: "files"; files: FormMediaAnswer[] }
  | { key: string; label: string; kind: "objectCard"; object: FormObjectAnswer };

/** One previewed module. Modules with no answers are dropped before this. */
export interface PreviewModule {
  id: string;
  /** The step this module belongs to (stepper forms only). */
  step?: string;
  title?: string;
  caption?: string;
  answers: PreviewAnswer[];
}

/**
 * One previewed STEP of a stepper form (Figma "Mapping / Step -> Preview"
 * 24631-58494): the step's name over the modules it holds. A step whose modules
 * are all empty is dropped, exactly like an empty module.
 */
export interface PreviewStep {
  title: string;
  modules: PreviewModule[];
}
