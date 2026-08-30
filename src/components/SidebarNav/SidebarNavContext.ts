import { createContext } from "react";

import { Breakpoint } from "../../hooks/useIsDesktop";

// A SidebarNav container (group, later the sidebar itself) sets the breakpoint
// once; items inside inherit it unless they set their own. Context (not prop
// cloning) so it reaches items through fragments and wrappers.
export const SidebarNavBreakpointContext = createContext<Breakpoint | null>(null);
