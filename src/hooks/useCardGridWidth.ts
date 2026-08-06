import { RefObject, useLayoutEffect, useState } from "react";

/** The file-card grid constants (Figma: CardFile 106–184px, `--size-3` gap). */
export const CARD_GRID_GAP = 12; // --size-3
export const CARD_MIN_WIDTH = 106;
export const CARD_MAX_WIDTH = 184;

/**
 * The shared file-card grid rule: the column count is how many cards fit at
 * their MIN width, and then every card takes the resulting width (capped at the
 * MAX). One measured width for all of them is what makes a short last row keep
 * the first row's card width — a plain wrapping flex row would stretch that row
 * instead, and a CSS grid could not share a width across sibling groups.
 *
 * Used by ItemGroup's cards view and ValueDisplay's `files` value, so both lay
 * file cards out identically.
 *
 * @param containerRef the wrapping flex row (its own padding is excluded)
 * @param count how many cards drive the column count — pass a bigger number
 *   when sibling groups must share one width (ItemGroup's `cardCountBasis`)
 * @param enabled skip measuring when the view is not showing cards
 * @returns the uniform card width, or null until the container is measured
 */
export function useCardGridWidth(
  containerRef: RefObject<HTMLElement | null>,
  count: number,
  enabled = true,
): number | null {
  const [width, setWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!enabled || el == null || count <= 0) return undefined;
    const compute = () => {
      const cs = getComputedStyle(el);
      const inner = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (inner <= 0) return;
      const cols = Math.max(
        1,
        Math.min(count, Math.floor((inner + CARD_GRID_GAP) / (CARD_MIN_WIDTH + CARD_GRID_GAP))),
      );
      setWidth(Math.min(CARD_MAX_WIDTH, Math.floor((inner - (cols - 1) * CARD_GRID_GAP) / cols)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, count, enabled]);

  return width;
}
