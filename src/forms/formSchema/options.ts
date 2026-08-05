import { FormFieldSchema, FormOption, FormSchema } from "./schema.types";

/** Option sets and lookups shared by the schemas and the forms built from them. */

/** The Yes / No answer used by most questionnaire fields. */
export const YES_NO_OPTIONS: FormOption[] = [{ value: "Yes" }, { value: "No" }];

/** Plain string list of an option set — for rows and chips that map over values. */
export const optionValues = (options: FormOption[]): string[] => options.map((o) => o.value);

/** Every field of a schema, flattened, keyed by field key. */
export const fieldMap = (schema: FormSchema): Record<string, FormFieldSchema> =>
  Object.fromEntries(schema.modules.flatMap((module) => module.fields.map((field) => [field.key, field])));
