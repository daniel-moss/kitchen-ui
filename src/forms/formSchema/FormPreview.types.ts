import { FormAnswers, FormSchema } from "./schema.types";

export interface FormPreviewProps {
  /** The form as data — the same schema the form itself is built from. */
  schema: FormSchema;
  /** The submitted answers, keyed by field key. */
  answers: FormAnswers;
  className?: string;
}
