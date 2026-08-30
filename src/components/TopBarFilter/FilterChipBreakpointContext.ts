import { createContext } from "react";

import { Breakpoint } from "../../hooks/useIsDesktop";

// A FilterChipGroup sets the resolved breakpoint once; the FilterChips inside
// inherit it unless they set their own. Context (not prop cloning) so it
// reaches chips through fragments and wrappers — the SidebarNav pattern.
export const FilterChipBreakpointContext = createContext<Breakpoint | null>(null);
