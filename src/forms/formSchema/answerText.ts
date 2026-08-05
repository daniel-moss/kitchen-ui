import {
  FormAnswerValue,
  FormAnswers,
  FormDateTimeAnswer,
  FormDurationAnswer,
  FormFieldSchema,
  FormMediaAnswer,
  FormModuleSchema,
  FormOption,
  FormSchema,
  PreviewAnswer,
  PreviewModule,
} from "./schema.types";

// The input → preview mapping (Figma "Mapping / Input -> Preview" 24469-37438).
// Every rule below comes from that frame's annotations or from Daniel's
// answers on 2026-08-05:
//   • prefix / suffix are APPENDED to the value ("Prefix Value Suffix")
//   • help text and the "(optional)" tag are never previewed
//   • an empty optional answer is not previewed at all (a required answer
//     cannot be empty — the form cannot be submitted)
//   • a TextArea is shown in full (no truncation)
//   • multi-answers are joined ", " in the FORM'S OPTION ORDER
//   • a date ALWAYS carries the year in the preview ("Monday, January 1, 2026"
//     — a preview-only exception to the app-wide date rule)
//   • a duration drops empty parts ("2 hr", "30 min", "2 hr 30 min")

/** "Monday, January 1, 2026" — the preview's date format. */
const PREVIEW_DATE = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const asText = (value: FormAnswerValue): string => (typeof value === "string" ? value.trim() : "");

const asList = (value: FormAnswerValue): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const asFiles = (value: FormAnswerValue): FormMediaAnswer[] =>
  Array.isArray(value)
    ? value.filter((item): item is FormMediaAnswer => typeof item === "object" && item != null && "name" in item)
    : [];

const asObject = <T>(value: FormAnswerValue): T | null =>
  typeof value === "object" && value != null && !Array.isArray(value) && !(value instanceof Date) ? (value as T) : null;

const toDate = (value: FormAnswerValue): Date | null => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/** An option's display text (`label`, or the raw `value`). */
export const optionLabel = (options: FormOption[] | undefined, value: string): string => {
  const option = options?.find((o) => o.value === value);
  return option?.label ?? value;
};

/**
 * The picked options joined ", " — in the ORDER THE FORM LISTS THEM, not the
 * order they were picked (Daniel, 2026-08-05). Values the option list does not
 * know keep their own order at the end.
 */
const joinOptions = (options: FormOption[], values: string[]): string => {
  const known = options.filter((o) => values.includes(o.value)).map((o) => o.label ?? o.value);
  const unknown = values.filter((v) => !options.some((o) => o.value === v));
  return [...known, ...unknown].join(", ");
};

/** Is this field asked at all? A hidden (unrevealed) field is never previewed. */
export const isFieldVisible = (field: FormFieldSchema, answers: FormAnswers): boolean =>
  field.visibleWhen == null || field.visibleWhen(answers);

/**
 * One field's previewed value, or `null` when there is nothing to show (empty
 * answer). Media fields always return `null` — files are not text; they come
 * out of `buildFormPreview` as a `media` answer instead.
 */
export function answerText(field: FormFieldSchema, answers: FormAnswers): string | null {
  const raw = answers[field.key];

  switch (field.type) {
    case "text": {
      const value = asText(raw);
      if (value === "") return null;
      // Prefix and suffix are part of the answer in the preview.
      return [field.prefix, value, field.suffix].filter((part) => part != null && part !== "").join(" ");
    }

    case "textArea": {
      // Shown in full — "No truncation in preview mode".
      const value = asText(raw);
      return value === "" ? null : value;
    }

    case "select": {
      const value = asText(raw);
      if (value === "") return null;
      const label = optionLabel(field.options, value);
      return field.suffix ? `${label} ${field.suffix}` : label;
    }

    case "radio": {
      const value = asText(raw);
      return value === "" ? null : optionLabel(field.options, value);
    }

    case "multiSelect":
    case "checkbox": {
      const values = asList(raw);
      return values.length === 0 ? null : joinOptions(field.options, values);
    }

    case "chips": {
      if (field.multiple) {
        const values = asList(raw);
        return values.length === 0 ? null : joinOptions(field.options, values);
      }
      const value = asText(raw);
      return value === "" ? null : optionLabel(field.options, value);
    }

    case "date": {
      const date = toDate(raw);
      return date == null ? null : PREVIEW_DATE.format(date);
    }

    case "dateTime": {
      const answer = asObject<FormDateTimeAnswer>(raw);
      const date = toDate(answer?.date ?? null);
      if (date == null) return null;
      const time = (answer?.time ?? "").trim();
      // No time picked yet — the date alone is still a real answer.
      return time === "" ? PREVIEW_DATE.format(date) : `${PREVIEW_DATE.format(date)} at ${time}`;
    }

    case "duration": {
      const answer = asObject<FormDurationAnswer>(raw);
      const hours = parseInt(String(answer?.hours ?? ""), 10) || 0;
      const minutes = parseInt(String(answer?.minutes ?? ""), 10) || 0;
      const parts = [];
      if (hours > 0) parts.push(`${hours} hr`);
      if (minutes > 0) parts.push(`${minutes} min`);
      return parts.length === 0 ? null : parts.join(" ");
    }

    case "media":
      return null;
  }
}

/** One field as a preview answer, or `null` when it is hidden or empty. */
function previewAnswer(field: FormFieldSchema, module: FormModuleSchema, answers: FormAnswers): PreviewAnswer | null {
  if (!isFieldVisible(field, answers)) return null;
  // A label-less field is labelled by its module's title (Daniel, 2026-08-05).
  const label = field.label ?? module.title ?? "";

  if (field.type === "media") {
    const files = asFiles(answers[field.key]);
    return files.length === 0 ? null : { key: field.key, label, kind: "media", files };
  }

  const value = answerText(field, answers);
  return value == null ? null : { key: field.key, label, kind: "text", value };
}

/**
 * The whole form as preview data: every answered, visible field in schema
 * order, grouped by module. A module whose answers are all hidden or empty is
 * dropped entirely (Daniel, 2026-08-05).
 */
export function buildFormPreview(schema: FormSchema, answers: FormAnswers): PreviewModule[] {
  return schema.modules
    .map((module) => ({
      id: module.id,
      title: module.title,
      caption: module.caption,
      answers: module.fields.flatMap((field) => {
        const answer = previewAnswer(field, module, answers);
        return answer == null ? [] : [answer];
      }),
    }))
    .filter((module) => module.answers.length > 0);
}
