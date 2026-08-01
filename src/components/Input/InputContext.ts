import { createContext, useContext } from "react";

// Provided by Input around its field. A STRING label flows down so the field
// can derive label-based copy without repeating the label prop:
//   - the default missing-value message ("Enter/Choose/Provide [Label]"),
//   - TextArea's clear-Prompt copy ("Clear [label]?"),
//   - DateField's mobile picker label.
export interface InputContextValue {
  /** The Input's label, when it is a plain string. */
  label?: string;
}

const InputContext = createContext<InputContextValue>({});

export const InputProvider = InputContext.Provider;

/** The nearest Input's string label — undefined outside an Input (or when the label is not a string). */
export function useInputLabel(): string | undefined {
  return useContext(InputContext).label;
}
