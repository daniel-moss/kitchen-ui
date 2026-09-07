export type FormVisibility = "public" | "private";

/** One picked form instance — duplicates get their own keys. */
export interface FormPick {
  key: string;
  formId: string;
  /** Set on auto-added required picks: the service/equipment name shown in
   *  the `Required for "X"` caption. Required picks cannot be removed. */
  requiredFor?: string;
  /** Public = visible to the client; new picks start public. */
  visibility: FormVisibility;
  /** A renamed copy keeps its own name. */
  customName?: string;
}

export interface FormsModuleProps {
  /** ALL picks (required + manual), in display order per group. */
  value: FormPick[];
  onChange: (picks: FormPick[]) => void;
  /** Mobile presentation (drawer list and menus). */
  mobile: boolean;
}
