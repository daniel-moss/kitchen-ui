import { ToastCta, ToastProps, ToastVariant } from "./Toast.types";

// The toast store — a tiny module-level store (our own, no toast library):
// `toast()` adds an entry, the mounted <Toaster> subscribes and renders.
//
// It lives in its OWN module on purpose: when it lived inside Toaster.tsx,
// every HMR edit of the Toaster re-ran the module and split the store in two
// (the app's `toast()` wrote to one instance while the mounted Toaster
// listened to another — toasts then only appeared on the next unrelated
// re-render). Keep this file small and stable.

export interface ToastEntry {
  id: number;
  props: ToastProps;
  /** Exit animation is running; removed for real after the exit duration. */
  closing: boolean;
}

/** A partial update — e.g. resolve a processing toast into a success. */
export type ToastPatch = Partial<Omit<ToastProps, "variant" | "caption" | "secondaryCta">> & {
  variant?: ToastVariant;
  caption?: ToastProps["title"];
  secondaryCta?: ToastCta;
};

let nextId = 0;
let entries: ToastEntry[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getEntries = () => entries;

/** Internal (Toaster): drop an entry after its exit transition. */
export const removeToast = (id: number) => {
  entries = entries.filter((e) => e.id !== id);
  emit();
};

function showToast(props: ToastProps): number {
  const id = ++nextId;
  entries = [...entries, { id, props, closing: false }];
  emit();
  return id;
}

/**
 * Show a toast (a <Toaster> must be mounted). Returns the toast id.
 * `toast.update(id, patch)` changes a shown toast — resolving a `processing`
 * toast into another type starts its auto-dismiss timer. `toast.dismiss(id?)`
 * dismisses one toast, or all without an id.
 */
export const toast = Object.assign(showToast, {
  update(id: number, patch: ToastPatch) {
    entries = entries.map((e) => (e.id === id ? { ...e, props: { ...e.props, ...patch } as ToastProps } : e));
    emit();
  },
  dismiss(id?: number) {
    entries = entries.map((e) => (id == null || e.id === id ? { ...e, closing: true } : e));
    emit();
  },
});
