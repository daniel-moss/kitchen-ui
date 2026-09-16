// Semantic icon-name tokens for React. Mirrors src/styles/variables/icons-semantic.css
// (the CSS string vars used by the HTML `--glyph: var(--bill)` pattern). Our
// `Icon` takes a name and builds a `.g-<name>` class, so it needs these as JS
// values. Keep this in sync with icons-semantic.css.
//
// Source: the Figma Design System "Icons" variable collection (updated
// 2026-09-16 — Daniel reorganised it into objects/ views/ priority/ progress/
// groups, deleted the status icon trio (statuses are dots now) and the bare
// `client` token, and renamed job-request/job-series to request/series).
//
// [custom pack]: timelineView, priorityNone, priorityLow, priorityMedium and
// priorityHigh live only in the kit custom font — render them with
// pack="custom". Without it the Icon falls back to the classic font, which has
// no glyph at that codepoint, and the row shows a blank box.
export const semanticIcons = {
  // navigation & app chrome
  menu: "bars",
  dropdown: "angles-up-down",
  contextMenu: "ellipsis",
  contactSupport: "headset",
  settings: "gear",
  helpCenter: "circle-question",
  whatIsNew: "bullhorn",
  requestFeature: "circle-info",
  logOut: "arrow-right-from-bracket",
  delete: "trash-can",

  // files
  private: "lock",
  public: "globe",

  // objects
  home: "house",
  estimate: "clock",
  request: "wrench-simple",
  job: "wrench-simple",
  /** A newly created job (Figma objects/job-new, added 2026-09-16). */
  jobNew: "sparkle",
  /** A recall job (Figma objects/job-recall, added 2026-09-16). */
  jobRecall: "clock-rotate-left",
  series: "layer-group",
  invoice: "circle-dollar",
  creditNote: "circle-dollar",
  purchaseOrder: "shopping-basket",
  bill: "file-invoice-dollar",
  vendor: "store",
  // Each client type has its own icon since 2026-09-16 (generic no longer
  // shares the business glyph — Figma objects/client-generic = buildings).
  clientGeneric: "buildings",
  clientBusiness: "building",
  clientIndividual: "building-user",
  /** The client's industry sector (Daniel added the token 2026-09-16). */
  clientIndustry: "industry",
  /** The client's credit limit (Daniel added the token 2026-09-16). */
  creditLimit: "gauge-high",
  pricebook: "tag",
  labor: "tag",
  product: "box-taped",
  other: "tag",
  discount: "tag",
  taxRate: "percent",
  equipment: "cube",
  location: "location-dot",
  user: "user",
  reports: "chart-mixed",
  warranty: "shield-halved",
  visit: "calendar",
  label: "tag",

  // views
  tableView: "table",
  cardsView: "grid-2",
  timelineView: "solid-timeline-view", // [custom pack]

  // priority
  priorityNone: "solid-priority-none", // [custom pack]
  // Figma stores low/medium as duotone layer pairs ("…-low#"/"…-low##");
  // our single-font rendering maps them to the one glyph class.
  priorityLow: "duotone-solid-priority-low", // [custom pack]
  priorityMedium: "duotone-solid-priority-medium", // [custom pack]
  priorityHigh: "solid-priority-high", // [custom pack]
  priorityUrgent: "fire",

  // progress
  progress0: "circle-dashed",
  progress25: "circle-quarter-stroke",
  progress50: "circle-half-stroke",
  progress75: "circle-three-quarters-stroke",
} as const;

export type SemanticIcon = keyof typeof semanticIcons;
