// The Job Details page's local re-exports. `noop`, `slot` and `copyText` moved
// to the modules tier on 2026-09-28 (the shared FilesModule and the Equipment
// side panel use them too); the anchored-menu helper moved there earlier, when
// the form preview panel needed it. Re-exported here so every import inside
// this page keeps working.
export { useAnchoredMenu } from "../shared/anchoredMenu";
export type { AnchoredMenuPos } from "../shared/anchoredMenu";
export { copyText, noop, slot } from "../shared/helpers";
