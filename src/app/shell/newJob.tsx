import { ReactNode, createContext, useCallback, useContext, useState } from "react";

import NewJobForm from "../../modules/NewJobSeriesForm/Job/NewJobForm";
import { Breakpoint } from "../../hooks/useIsDesktop";

// ONE "New job" form for the whole app.
//
// The form is a focus Dialog that portals to <body>, so a single instance can
// serve every entry point — and it has to be a single instance, because the
// entry points are far apart in the tree: the sidebar's Create menu (rendered
// by App), the Jobs list's "New" button (inside JobsPage's top bar) and the
// mobile bottom bar's Create (inside every page's own shell). A context is
// cheaper than threading a callback through fifteen pages.

const NewJobContext = createContext<() => void>(() => {});

/** Opens the app's "New job" form. Safe to call from anywhere inside the app. */
export const useNewJob = () => useContext(NewJobContext);

export function NewJobProvider({ breakpoint = "auto", children }: { breakpoint?: Breakpoint; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  // Stable, so a memoised consumer (the Jobs table's top bar) does not re-render
  // on every app render.
  const openNewJob = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  return (
    <NewJobContext.Provider value={openNewJob}>
      {children}
      <NewJobForm
        open={open}
        onClose={close}
        // The form closes itself on Create and on "Save as draft" and shows its
        // own toast; the draft toast's "Edit" action reopens it.
        onEditDraft={openNewJob}
        breakpoint={breakpoint}
      />
    </NewJobContext.Provider>
  );
}
