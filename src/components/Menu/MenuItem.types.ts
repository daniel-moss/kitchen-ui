import { HTMLAttributes, MouseEvent, ReactNode } from "react";

interface MenuItemBaseProps extends HTMLAttributes<HTMLDivElement> {
  /** The action title. Truncates to one line (ellipsis) when it doesn't fit. */
  label: ReactNode;
  /** Left slot — an Icon (`container="square"`) or an xs (20px) Avatar. */
  slotLeft?: ReactNode;
  /** Dimmed, non-interactive. */
  disabled?: boolean;
  className?: string;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
}

/** Caption below OR a tag to the right — never both. */
type MenuItemCopyProps =
  | { /** Subtle text below the title; wraps. Caption OR tag, never both. */ caption?: ReactNode; tag?: never }
  | { /** Subtle text at the row's right; the title truncates to give it room. Caption OR tag, never both. */ tag?: ReactNode; caption?: never };

/**
 * Danger (destructive) items color all copy + the left icon in error tones
 * and have NO right slot. Default items can carry a right slot — a chevron
 * (`angle-right`) or an icon; its clicks do not trigger onClick. The toggle
 * variant instead makes the WHOLE row the switch: clicking anywhere on the
 * MenuItem flips it (the ToggleSwitch on the right is just the visual).
 * `subMenu` makes the item a sub-menu trigger (chevron added automatically):
 * on desktop the sub-menu opens on hover, 4px beside the item; on mobile
 * (inside a Menu) tapping swaps the drawer content — back button + this
 * item's label as the title, so keep the label a string.
 */
type MenuItemKindProps =
  | { danger?: false; slotRight?: ReactNode; toggle?: never; checked?: never; defaultChecked?: never; onCheckedChange?: never; subMenu?: never; subMenuTitle?: never }
  | {
      danger?: false;
      /** The row is an on/off switch (role="menuitemcheckbox"). */
      toggle: true;
      /** Controlled on/off state. */
      checked?: boolean;
      /** Uncontrolled initial state. Default false. */
      defaultChecked?: boolean;
      onCheckedChange?: (checked: boolean) => void;
      slotRight?: never;
      subMenu?: never;
      subMenuTitle?: never;
    }
  | {
      danger?: false;
      /** Sub-menu content — MenuItemGroup elements. */
      subMenu: ReactNode;
      /** Mobile: the sub-drawer's title. Defaults to the item's label (e.g. "Create job" over "Job"). */
      subMenuTitle?: string;
      slotRight?: never;
      toggle?: never;
      checked?: never;
      defaultChecked?: never;
      onCheckedChange?: never;
    }
  | { danger: true; slotRight?: never; toggle?: never; checked?: never; defaultChecked?: never; onCheckedChange?: never; subMenu?: never; subMenuTitle?: never };

export type MenuItemProps = MenuItemBaseProps & MenuItemCopyProps & MenuItemKindProps;
