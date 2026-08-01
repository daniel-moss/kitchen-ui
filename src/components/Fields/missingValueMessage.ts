import { ReactNode } from "react";

// DS rule (Daniel, 2026-07-22): a field's DEFAULT missing-value message is
// derived from its label — "[Verb] [Label]", label starting uppercase:
//   InputGroup / TextArea → "Provide [Label]"
//   SelectField / DateField → "Choose [Label]"
//   TextField → "Enter [Label]"
//   MediaField → "Add [Label]"
// Only string labels qualify — a label-less field has NO default; its message
// must come from the designs (the errorMessage prop).
export type MissingValueVerb = "Provide" | "Choose" | "Enter" | "Add";

export const missingValueMessage = (verb: MissingValueVerb, label: ReactNode): string | undefined =>
  typeof label === "string" && label.length > 0 ? `${verb} ${label.charAt(0).toUpperCase()}${label.slice(1)}` : undefined;
