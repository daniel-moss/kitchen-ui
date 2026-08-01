import { ReactNode } from "react";

export interface FormModuleGroupProps {
  /**
   * Two or more FormModules. They are stacked --size-8 (32px) apart with a low Divider
   * between each consecutive pair (the divider is inserted automatically).
   */
  children: ReactNode;
  className?: string;
}
