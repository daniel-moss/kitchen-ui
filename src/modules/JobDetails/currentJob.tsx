import { createContext, ReactNode, useContext } from "react";

// WHICH JOB THE PAGE IS SHOWING.
//
// The page was a prototype of one screen, so it read a module-level `JOB_ID`
// constant — a dozen places (the title, the context-menu header, every toast,
// the activity log) simply imported it. In the app the page serves all 78
// jobs, so the id has to come from the render rather than from the module.
//
// A context rather than prop-drilling: the places that need the id are leaves
// — a toast inside a form inside a drawer — and threading an id through five
// components to name a toast would be worse than the constant it replaces.

const CurrentJobIdContext = createContext<string | null>(null);

export const CurrentJobIdProvider = ({ id, children }: { id: string; children: ReactNode }) => (
  <CurrentJobIdContext.Provider value={id}>{children}</CurrentJobIdContext.Provider>
);

/**
 * The id of the job on screen. Falls back to the prototype's original job so a
 * form rendered on its own — a Storybook story for one drawer — still has a
 * name to print, instead of throwing.
 */
export function useCurrentJobId(): string {
  return useContext(CurrentJobIdContext) ?? "JOB-1201";
}
