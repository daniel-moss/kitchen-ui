import { createContext } from "react";

import { TabItemSize } from "./TabItem.types";

/**
 * A container's DEFAULT TabGroup size (e.g. TopBarNav's bars are specced
 * with lg tabs). TabGroup falls back to it when the consumer sets no `size`.
 * Context, not prop cloning — a consumer's wrapper component around the
 * TabGroup would swallow a cloned prop (the SidebarNav lesson).
 */
export const TabGroupDefaultSizeContext = createContext<TabItemSize | null>(null);
