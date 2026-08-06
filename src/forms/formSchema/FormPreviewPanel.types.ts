import { ReactNode } from "react";

import { SidePanelBreakpoint } from "../../components/SidePanel/SidePanel.types";

import { FormAnswers, FormMediaAnswer, FormSchema } from "./schema.types";

export interface FormPreviewPanelProps {
  /** Controls the open/close animation and mounting. */
  open: boolean;
  onClose: () => void;
  /** The form as data. */
  schema: FormSchema;
  /** The submitted answers, keyed by field key. */
  answers: FormAnswers;
  /**
   * Panel title — the form's name on the job (a copy can be renamed, so the
   * caller passes it). Defaults to the schema's name.
   */
  title?: string;
  /**
   * The header's ⋯ menu items — the SAME menu the form's row shows (Daniel,
   * 2026-08-06). The panel owns the button and the anchored card / drawer; the
   * caller only supplies the items and calls `close` from each one. The button
   * renders only when this is set.
   */
  headerMenu?: (close: () => void) => ReactNode;
  /** Opens a file. Not built yet — the design opens a File side panel. */
  onFilePreview?: (file: FormMediaAnswer) => void;
  breakpoint?: SidePanelBreakpoint;
}
