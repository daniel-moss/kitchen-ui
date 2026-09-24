import { createContext } from "react";

import { FilterChipOrientation } from "./FilterChip.types";

// A FilterChipGroup publishes its `orientation` once; the FilterChips inside
// inherit it unless they set their own. Context (not prop cloning) so it
// reaches chips through fragments and wrappers — the SidebarNav pattern.
// (Was FilterChipBreakpointContext until 2026-09-18, when the Figma component
// replaced the chip's breakpoint with the group's orientation.)
export const FilterChipOrientationContext = createContext<FilterChipOrientation | null>(null);
