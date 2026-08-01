import { Children, Fragment, cloneElement, isValidElement, ReactElement, ReactNode } from "react";

// Fragments are unwrapped so consumers can pass groups inside <>...</> — a
// fragment would otherwise count as ONE child and swallow the divider prop.
function flattenGroups(children: ReactNode): ReactElement[] {
  return Children.toArray(children)
    .filter(isValidElement)
    .flatMap((el) =>
      el.type === Fragment ? flattenGroups((el.props as { children?: ReactNode }).children) : [el],
    );
}

// The menu/list divider rule: every group is followed by a divider except the
// last, which never has one. Applied to the group children (MenuItemGroup /
// SelectListItemGroup — fragments are looked through), overriding their own
// `divider` prop. Used by Menu, MenuItem (sub-menus), and SelectList.
export function withGroupDividers(children: ReactNode) {
  const groups = flattenGroups(children);
  return groups.map((group, i) =>
    cloneElement(group as ReactElement<{ divider?: boolean }>, {
      divider: i < groups.length - 1,
      // Flattened elements may repeat React's auto keys across levels —
      // re-key by final position (these are static lists).
      key: `group-${i}`,
    }),
  );
}
