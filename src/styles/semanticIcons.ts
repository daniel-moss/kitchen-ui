// Semantic icon-name tokens for React. Mirrors src/styles/variables/icons-semantic.css
// (the CSS string vars used by the HTML `--glyph: var(--bill)` pattern). Our
// `Icon` takes a name and builds a `.g-<name>` class, so it needs these as JS
// values. Keep this in sync with icons-semantic.css.
//
// [custom pack]: timelineView and priorityHigh live only in the kit custom font
// — render them with pack="custom".
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
  home: "house",

  // files
  filePrivate: "lock",
  filePublic: "globe",

  // statuses
  active: "circle-minus",
  review: "clock",
  inactive: "ban",

  // entities
  estimate: "clock",
  jobRequest: "wrench-simple",
  job: "wrench-simple",
  jobSeries: "layer-group",
  invoice: "circle-dollar",
  creditNote: "circle-dollar",
  purchaseOrder: "basket-shopping",
  bill: "file-invoice-dollar",
  vendor: "store",
  client: "building-user",
  clientBusiness: "building",
  clientIndividual: "user",
  pricebook: "tag",
  labor: "tag",
  product: "box-taped",
  other: "tag",
  discount: "tag",
  taxRate: "tag",
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
  priorityNone: "hyphen",
  priorityHigh: "solid-priority-high", // [custom pack]
  priorityUrgent: "fire",

  // progress
  progress0: "circle-dashed",
  progress25: "circle-quarter-stroke",
  progress50: "circle-half-stroke",
  progress75: "circle-three-quarters-stroke",
} as const;

export type SemanticIcon = keyof typeof semanticIcons;
