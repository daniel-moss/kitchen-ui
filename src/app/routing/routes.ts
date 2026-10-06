import { Page } from "../shell/appShell";

// WHERE THE APP IS, as a value — and the URL hash it maps to.
//
// The hash, not a query param or a path: Storybook owns the query string
// (`?id=app--demo&viewMode=story`) and serves the app from one URL, so the
// hash is the only part the app can own. It also means ONE story id serves
// every deep link, and the browser's back button works for free:
//
//   …/iframe.html?id=app--demo&viewMode=story#/jobs
//   …/iframe.html?id=app--demo&viewMode=story#/jobs/JOB-1070
//   …/iframe.html?id=app--demo&viewMode=story#/clients/bayside-grill
//
// A route is parsed from the hash, never stored twice. Nothing in the app
// keeps its own copy of "which page am I on".

/** An object type that has (or will have) a details page of its own. */
export type ObjectType =
  | "job"
  | "series"
  | "estimate"
  | "invoice"
  | "creditNote"
  | "po"
  | "bill"
  | "vendor"
  | "client";

/**
 * A place in the app: a list (including the mobile Menu page), or one
 * object's details.
 *
 * Object routes PARSE today even though their pages are not built yet — the
 * app falls back to the list. That is deliberate: the URL shape is settled
 * now, so adding a details page later is additive and never invalidates a
 * link.
 */
export type Route = { kind: "list"; page: Page } | { kind: "object"; object: ObjectType; id: string };

export const DEFAULT_ROUTE: Route = { kind: "list", page: "jobs" };

/** The URL name of each list. Readable, kebab-case, stable — these are links. */
const SLUG_OF_PAGE: Record<Page, string> = {
  menu: "menu",
  jobs: "jobs",
  series: "series",
  estimates: "estimates",
  invoices: "invoices",
  creditNotes: "credit-notes",
  pos: "purchase-orders",
  bills: "bills",
  vendors: "vendors",
  clients: "clients",
  labor: "labor",
  products: "products",
  other: "other",
  discounts: "discounts",
  taxRates: "tax-rates",
};

const PAGE_OF_SLUG: Record<string, Page> = Object.fromEntries(
  Object.entries(SLUG_OF_PAGE).map(([page, slug]) => [slug, page as Page]),
) as Record<string, Page>;

/**
 * Which object a list holds, i.e. which lists take a second path segment.
 * A list with no entry here has no object page — `#/labor/anything` is just
 * the Labor list.
 */
const OBJECT_OF_PAGE: Partial<Record<Page, ObjectType>> = {
  jobs: "job",
  series: "series",
  estimates: "estimate",
  invoices: "invoice",
  creditNotes: "creditNote",
  pos: "po",
  bills: "bill",
  vendors: "vendor",
  clients: "client",
};

const PAGE_OF_OBJECT: Record<ObjectType, Page> = Object.fromEntries(
  Object.entries(OBJECT_OF_PAGE).map(([page, object]) => [object, page as Page]),
) as Record<ObjectType, Page>;

/** The list a route belongs to — what the sidebar and bottom bar mark active. */
export function listOfRoute(route: Route): Page {
  return route.kind === "list" ? route.page : PAGE_OF_OBJECT[route.object];
}

/**
 * Reads a hash into a route. Returns null for an empty or unrecognised hash,
 * so the caller can decide the fallback rather than being handed a guess.
 */
export function parseHash(hash: string): Route | null {
  // Drop the leading "#" and "/", and anything after a "?" — a query on the
  // hash is for options like `?concept=b`, never for the place itself.
  const path = hash.replace(/^#\/?/, "").split("?")[0];
  if (path === "") return null;

  const [slug, rawId] = path.split("/");
  const page = PAGE_OF_SLUG[slug];
  if (page == null) return null;

  if (rawId == null || rawId === "") return { kind: "list", page };

  const object = OBJECT_OF_PAGE[page];
  // A second segment on a list that holds no objects is not an error — the
  // list is still the right place to land.
  if (object == null) return { kind: "list", page };

  return { kind: "object", object, id: decodeURIComponent(rawId) };
}

/**
 * The OPTIONS on the hash — everything after the "?", which `parseHash`
 * deliberately ignores. They qualify the place without being part of it:
 * today the only one is `view`, the Jobs list's selected view, which rides
 * along so Back lands where you left even after a RELOAD (Daniel,
 * 2026-10-06 — the view lived in React state alone, so refreshing on a job
 * and pressing Back dropped you on "All").
 */
export function parseHashQuery(hash: string): URLSearchParams {
  return new URLSearchParams(hash.split("?")[1] ?? "");
}

/**
 * Writes a route as a hash. Always starts "#/", so it replaces cleanly.
 * `query` entries with no value are left out, so passing `undefined` simply
 * drops the option rather than writing "?view=undefined".
 */
export function formatHash(route: Route, query?: Record<string, string | undefined>): string {
  const path =
    route.kind === "list"
      ? `#/${SLUG_OF_PAGE[route.page]}`
      : `#/${SLUG_OF_PAGE[PAGE_OF_OBJECT[route.object]]}/${encodeURIComponent(route.id)}`;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) if (value != null && value !== "") params.set(key, value);
  const search = params.toString();
  return search === "" ? path : `${path}?${search}`;
}
