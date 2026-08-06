import { MouseEvent } from "react";

import { FormAnswers, FormMediaAnswer, FormSchema } from "./schema.types";

export interface FormPreviewProps {
  /** The form as data — the same schema the form itself is built from. */
  schema: FormSchema;
  /** The submitted answers, keyed by field key. */
  answers: FormAnswers;
  /**
   * The file card's ⋯ button. Without it the button is hidden (CardFile's own
   * rule), so the consumer owns the file menu.
   */
  onFileMenuClick?: (
    file: FormMediaAnswer,
    answerKey: string,
    index: number,
    event: MouseEvent<HTMLButtonElement>,
  ) => void;
  /** Which file card keeps its ⋯ pressed (while its menu is open). */
  openFileMenu?: { key: string; index: number } | null;
  className?: string;
}
