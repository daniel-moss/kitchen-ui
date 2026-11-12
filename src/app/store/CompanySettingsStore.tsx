import { createContext, ReactNode, useCallback, useContext, useLayoutEffect, useMemo, useState } from "react";

import { COMPANY, CompanySettings } from "../../data/db";

// The SERVICE COMPANY'S SETTINGS, editable at run time (Daniel, 2026-11-12):
// a company has many settings with no UI of their own, and the "Demo
// settings" page is where they are switched so the Demo can show each case —
// sub-statuses on or off, no accounting integration, and so on.
//
// HOW IT REACHES THE APP. About twenty files read `COMPANY` from the database
// directly, many of them outside React (a toast's copy, a form's validation).
// Rather than thread a context through all of them, this store WRITES the
// chosen settings INTO that one `COMPANY` object. Every reader keeps reading
// the same thing it always read; it simply holds the demo's values now.
// Readers that used to copy a setting into a module-level constant at load
// time became small functions, so they read it when they are used.
//
// SAVED IN THE BROWSER (localStorage), unlike the rest of the store — a
// deliberate exception to the "a reload is the reset button" rule
// (AppStore.tsx). Settings describe WHICH company the demo is showing, not a
// mess left by the last session, so they have to survive a reload. The page's
// "Reset to defaults" button is their reset. Jobs and every other edit still
// live in memory only.
//
// SCOPED TO THE DEMO. The database's own values are copied aside as
// `COMPANY_DEFAULTS` the moment this file loads, and the provider puts them
// back when the Demo unmounts — so the module stories Storybook shows next
// (which read `COMPANY` too) always see the database as written.

const STORAGE_KEY = "kitchen-ui:demo-company-settings";

/** The database's own settings, before anything changed them. */
export const COMPANY_DEFAULTS: CompanySettings = structuredClone(COMPANY);

/** Writes `settings` into the shared `COMPANY` object — every key, so a cleared optional really clears. */
function applyToCompany(settings: CompanySettings) {
  for (const key of Object.keys(COMPANY) as (keyof CompanySettings)[]) delete COMPANY[key];
  Object.assign(COMPANY, structuredClone(settings));
}

/**
 * The saved settings, checked against the defaults. Only known keys are kept,
 * so a setting renamed or removed later cannot leak back in from an old save.
 * A missing or broken save (private window, blocked storage) gives the defaults.
 */
function readSaved(): CompanySettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw == null) return structuredClone(COMPANY_DEFAULTS);
    const saved = JSON.parse(raw) as Partial<CompanySettings>;
    // A save holds the WHOLE settings, so an optional key it lacks was cleared
    // on purpose and must stay cleared. Required keys it lacks (a setting
    // added after the save) come from the defaults.
    const merged = { ...COMPANY_DEFAULTS } as Record<string, unknown>;
    for (const key of OPTIONAL_KEYS) delete merged[key];
    for (const key of Object.keys(saved) as (keyof CompanySettings)[]) {
      if (key in COMPANY_DEFAULTS || OPTIONAL_KEYS.includes(key)) merged[key] = saved[key];
    }
    merged.subStatuses = { ...COMPANY_DEFAULTS.subStatuses, ...saved.subStatuses };
    return structuredClone(merged) as unknown as CompanySettings;
  } catch {
    return structuredClone(COMPANY_DEFAULTS);
  }
}

/** The optional settings — absent from the defaults when the database leaves them unset. */
const OPTIONAL_KEYS: (keyof CompanySettings)[] = [
  "logo",
  "phone",
  "phoneExtension",
  "quickbooksDefaultCogsAccountId",
  "quickbooksDefaultAssetAccountId",
];

function save(settings: CompanySettings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage blocked: the change still applies for this visit.
  }
}

function clearSaved() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

/** Equal values, whatever order the keys were written in. */
const sortedJson = (value: unknown): string =>
  JSON.stringify(value, (_key, v) =>
    v != null && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
const sameSettings = (a: CompanySettings, b: CompanySettings) => sortedJson(a) === sortedJson(b);

interface CompanySettingsValue {
  settings: CompanySettings;
  /** Changes some settings. `undefined` clears an optional one. */
  update: (patch: Partial<CompanySettings>) => void;
  /** Back to the database's own settings, and forgets the saved ones. */
  reset: () => void;
  /** Nothing differs from the database. */
  isDefault: boolean;
}

const CompanySettingsContext = createContext<CompanySettingsValue | null>(null);

export function CompanySettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CompanySettings>(() => {
    const initial = readSaved();
    // Applied HERE, during the first render, so the children's very first
    // render already reads the demo's settings.
    applyToCompany(initial);
    return initial;
  });

  // Keeps COMPANY in step, and gives the database its own values back when the
  // Demo unmounts (see "SCOPED TO THE DEMO" above).
  useLayoutEffect(() => {
    applyToCompany(settings);
    return () => applyToCompany(COMPANY_DEFAULTS);
  }, [settings]);

  const update = useCallback((patch: Partial<CompanySettings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      for (const key of Object.keys(next) as (keyof CompanySettings)[]) if (next[key] === undefined) delete next[key];
      // Applied now, not after the render, so a reader outside React that runs
      // before the effect (a toast, a validation) already sees the change.
      applyToCompany(next);
      save(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    clearSaved();
    applyToCompany(COMPANY_DEFAULTS);
    setSettings(structuredClone(COMPANY_DEFAULTS));
  }, []);

  const isDefault = sameSettings(settings, COMPANY_DEFAULTS);
  const value = useMemo(() => ({ settings, update, reset, isDefault }), [settings, update, reset, isDefault]);

  return <CompanySettingsContext.Provider value={value}>{children}</CompanySettingsContext.Provider>;
}

/** The demo's company settings and the means to change them. Inside the Demo only. */
export function useCompanySettings(): CompanySettingsValue {
  const value = useContext(CompanySettingsContext);
  if (value == null) throw new Error("useCompanySettings must be used inside CompanySettingsProvider");
  return value;
}
