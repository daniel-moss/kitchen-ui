import { createContext, useContext } from "react";

/** How many chips of the surrounding ChipGroup can be selected at once. */
export type ChipSelectionMode = "single" | "multiple";

// ChipGroup hands its selection mode down so each Chip can announce itself
// correctly: "multiple" is a toggle button (`aria-pressed`), "single" is one
// option of a radio group (`role="radio"` + `aria-checked`). A Chip outside a
// group is a toggle.
//
// It travels by CONTEXT rather than by cloning because `aria-pressed` is the
// component's own attribute — it is not in ChipProps, so the group cannot
// clone it away.
export const ChipSelectionModeContext = createContext<ChipSelectionMode>("multiple");

export const useChipSelectionMode = () => useContext(ChipSelectionModeContext);
