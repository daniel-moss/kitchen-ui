import { createContext } from "react";

import { Breakpoint } from "../../hooks/useIsDesktop";

// A NavSidebar container (group, later the sidebar itself) sets the breakpoint
// once; items inside inherit it unless they set their own. Context (not prop
// cloning) so it reaches items through fragments and wrappers.
export const NavSidebarBreakpointContext = createContext<Breakpoint | null>(null);
