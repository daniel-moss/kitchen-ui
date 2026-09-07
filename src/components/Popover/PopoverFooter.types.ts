import { ReactNode } from "react";

interface PopoverFooterBaseProps {
  /**
   * The trailing buttons, pushed to the right edge (Secondary, then Primary).
   * Priority increases left → right; the rightmost is the primary action and
   * the only required one. The secondary is `subtle` by default (`ghost` is
   * also allowed). All buttons the lg size. Max 3 actions total, including
   * the left slot.
   */
  children: ReactNode;
  className?: string;
}

// slotLeft and stretch are mutually exclusive (the Figma component models
// them as ONE `layout` choice: default / slotLeft / fullWidth) — the union
// makes the invalid combination fail to compile.
export type PopoverFooterProps = PopoverFooterBaseProps &
  (
    | {
        /**
         * The left slot, pinned to the far left: a low-priority ghost Button
         * (typically Cancel) or a display-only `PopoverFooterText`. Not
         * available together with `stretch`.
         */
        slotLeft?: ReactNode;
        /** @deprecated Old name for `slotLeft` — kept so existing callers compile. */
        leadingButton?: ReactNode;
        stretch?: never;
      }
    | {
        slotLeft?: never;
        leadingButton?: never;
        /**
         * Full-width layout (Figma `layout=fullWidth`): the buttons stay on
         * one row and share the width equally. Not available together with
         * `slotLeft`. Default false.
         */
        stretch?: boolean;
      }
  );
