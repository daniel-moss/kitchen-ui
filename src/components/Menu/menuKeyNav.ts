// Shared arrow-key navigation for menus (the root Menu card and each MenuItem
// sub-menu card). Moves focus over the focusable menu items inside `container`,
// skipping disabled ones. Returns true if it handled the key (so the caller can
// preventDefault). With nothing focused yet, ArrowDown enters at the top and
// ArrowUp at the bottom.
const ITEM_SELECTOR =
  '[role="menuitem"]:not([aria-disabled="true"]),[role="menuitemcheckbox"]:not([aria-disabled="true"])';

export function moveMenuFocus(container: HTMLElement, key: string): boolean {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(key)) return false;
  const items = Array.from(container.querySelectorAll<HTMLElement>(ITEM_SELECTOR));
  if (items.length === 0) return false;
  const current = items.indexOf(document.activeElement as HTMLElement);
  const next =
    key === "ArrowDown"
      ? Math.min(current + 1, items.length - 1)
      : key === "ArrowUp"
        ? current === -1
          ? items.length - 1
          : Math.max(current - 1, 0)
        : key === "Home"
          ? 0
          : items.length - 1;
  items[next]?.focus();
  return true;
}

export function firstMenuItem(container: HTMLElement): HTMLElement | null {
  return container.querySelector<HTMLElement>(ITEM_SELECTOR);
}
