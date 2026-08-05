import { ReactNode } from "react";

export interface SidePanelNavigationProps {
  /**
   * The object-level tabs — `TabItem` children, one per sub-section. This row
   * is always rendered; it scrolls horizontally when the tabs do not fit.
   */
  children: ReactNode;
  /** Selected sub-section (controlled). */
  value?: string;
  /** Uncontrolled initial sub-section. */
  defaultValue?: string;
  /** Called with the newly-selected sub-section value. */
  onChange?: (value: string) => void;

  /**
   * The top-level tabs — `TabItem` children. Passing them turns the navigation
   * multilevel: a second row appears ABOVE the sub-sections, and each top
   * section owns its own set of sub-sections (the consumer swaps `children`).
   * Used rarely — see the Location side panel.
   */
  topLevel?: ReactNode;
  /** Selected top-level section (controlled). */
  topLevelValue?: string;
  /** Uncontrolled initial top-level section. */
  topLevelDefaultValue?: string;
  /** Called with the newly-selected top-level section value. */
  onTopLevelChange?: (value: string) => void;

  className?: string;
}
