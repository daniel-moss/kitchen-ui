export const DEFAULT_DEBOUNCE_TIME = 250;

// Leading-edge debounce: the handler fires immediately on the first call, then
// further calls are ignored until `wait` ms pass with no calls. This keeps the
// double-click / double-submit guard but responds instantly — unlike a trailing
// debounce, which delays every single click by `wait` ms.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function debounce<T extends (...args: any) => any>(func: T, wait = DEFAULT_DEBOUNCE_TIME) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return function executedFunction(...args: Parameters<T>) {
    const callNow = timeout === undefined;

    // Restart the cooldown on every call, so a burst of clicks stays blocked.
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = undefined;
    }, wait);

    if (callNow) func(...args);
  };
}
