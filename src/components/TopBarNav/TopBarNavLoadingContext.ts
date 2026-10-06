import { createContext } from "react";

/**
 * TopBarNav's loading flag, read by the parts it does not render itself —
 * TopBarNavTitle draws a placeholder instead of the title and drops its avatar,
 * TopBarNavLeftElements drops the context-menu button and keeps the back
 * button. Context, not prop cloning: the title arrives as `children`, often
 * wrapped in a consumer's own component, which would swallow a cloned prop
 * (the SidebarNav lesson).
 */
export const TopBarNavLoadingContext = createContext<boolean>(false);
