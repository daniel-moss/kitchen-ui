// One-off: run the Filters prototype's seeded generators (copied VERBATIM
// from jobsData.ts / estimatesData.ts) against a given TODAY anchor and print
// the rows as db.ts literals.
//
// Usage: node dump-db-rows.mjs <jobs|estimates|invoices> <ISO-today>  (e.g. 2026-09-04)
//
// The reference arrays are inlined below — lengths and ORDER copied from
// db.ts exactly, because the seeded pick() sequence depends on them.

const [, , kind, todayIso] = process.argv;
const TODAY = new Date(`${todayIso}T09:00:00`);
const DAY_MS = 24 * 60 * 60 * 1000;

// Local-naive ISO ("2026-09-04T08:15:00") — the db.ts date style.
function localIso(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
}

function dayAt(offsetDays, hour = 9, minute = 0) {
  const d = new Date(TODAY.getTime() + offsetDays * DAY_MS);
  d.setHours(hour, minute, 0, 0);
  return localIso(d);
}

function makeRng(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- reference tables (id/order copied from db.ts) --------------------------
const SERVICES = [
  { id: "walk-in-cooler", name: "Walk-in cooler repair" },
  { id: "fryer-service", name: "Fryer service and calibration" },
  { id: "ice-machine", name: "Ice machine descale" },
  { id: "dishwasher", name: "Dishwasher inspection" },
  { id: "combi-oven", name: "Combi oven quarterly maintenance" },
  { id: "hood-cleaning", name: "Grill hood cleaning" },
  { id: "freezer-seal", name: "Freezer door seal replacement" },
  { id: "range-burner", name: "Range burner repair" },
  { id: "steam-table", name: "Steam table thermostat swap" },
  { id: "prep-fridge", name: "Prep fridge compressor service" },
  { id: "grease-trap", name: "Grease trap service" },
  { id: "espresso", name: "Espresso machine descale" },
];
const LOCATIONS = [
  { id: "wildwood-downtown", clientId: "wildwood" },
  { id: "wildwood-airport", clientId: "wildwood" },
  { id: "harbour-pier", clientId: "harbour" },
  { id: "harbour-marina", clientId: "harbour" },
  { id: "bayside-commissary", clientId: "bayside" },
  { id: "ferry-main", clientId: "ferry" },
  { id: "mission-24th", clientId: "mission" },
  { id: "northpoint-hotel", clientId: "northpoint" },
  { id: "northpoint-banquet", clientId: "northpoint" },
  { id: "sunset-judah", clientId: "sunset" },
  { id: "presidio-canteen", clientId: "presidio" },
];
const JOB_LABELS = [
  { id: "refrigeration" }, { id: "cooking" }, { id: "ventilation" }, { id: "warranty" },
  { id: "recurring" }, { id: "contract" }, { id: "compliance" }, { id: "priority-client" },
  { id: "quarterly" }, { id: "plumbing" },
];
const ESTIMATE_LABELS = [
  { id: "repair" }, { id: "replacement" }, { id: "preventive-plan" }, { id: "contract-renewal" },
  { id: "parts-only" }, { id: "labor-only" }, { id: "warranty-claim" }, { id: "budgetary" },
];
const INVOICE_LABELS = [
  { id: "progress-billing" }, { id: "final-bill" }, { id: "deposit-applied" }, { id: "contract-billing" },
  { id: "quarterly" }, { id: "parts-only" }, { id: "labor-only" }, { id: "collections" },
];
const SOURCES = [
  { id: "direct", prefix: null },
  { id: "service-channel", prefix: "SC" },
  { id: "corrigo", prefix: "COR" },
  { id: "ecotrak", prefix: "ECO" },
];
const TECHS = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((id) => ({ id }));

const q = (s) => JSON.stringify(s);

// ============================ JOBS (jobsData.ts) =============================
function dumpJobs() {
  const rand = makeRng(20260817);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const int = (min, max) => min + Math.floor(rand() * (max - min + 1));

  const STATUS_MIX = [
    ...Array(9).fill("upcoming"),
    ...Array(7).fill("unscheduled"),
    ...Array(5).fill("active"),
    ...Array(4).fill("pastDue"),
    ...Array(3).fill("completed"),
    ...Array(2).fill("quickPaused"),
    ...Array(2).fill("finalized"),
    "draft", "onHoldExternal", "onHoldInternal", "cancelled",
  ];
  const PRIORITY_MIX = [1, 2, 2, 3, 3, 3, 3, 4, 4, 4, null, null];
  const DURATION_MIX = [30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240, 300];

  function scheduleWindow(status) {
    switch (status) {
      case "unscheduled":
      case "draft":
        return null;
      case "pastDue":
        return [-9, -1];
      case "active":
      case "quickPaused":
        return [0, 0];
      case "completed":
      case "finalized":
        return [-21, -2];
      case "cancelled":
        return [-14, 5];
      case "onHoldExternal":
      case "onHoldInternal":
        return [-4, 12];
      default:
        return [0, 21];
    }
  }

  function makeJob(index) {
    const status = STATUS_MIX[index % STATUS_MIX.length];
    const service = pick(SERVICES);
    const location = pick(LOCATIONS);
    const source = pick(SOURCES);

    const window = scheduleWindow(status);
    const scheduledOffset = window == null ? null : int(window[0], window[1]);
    const scheduledFor = scheduledOffset == null ? null : dayAt(scheduledOffset, int(7, 17), pick([0, 15, 30, 45]));
    const durationMinutes = scheduledFor == null ? null : pick(DURATION_MIX);

    const receivedOffset = Math.min(-1, (scheduledOffset ?? 0) - int(1, 12));
    const statusChangedOffset = int(receivedOffset, 0);
    const lastModifiedOffset = int(statusChangedOffset, 0);
    // A date ONLY when the job really changed status (Daniel, 2026-09-12; the
    // rule lives on `Job.statusChangedAt` in the db types). The status a job is
    // born with is not a change, and neither is leaving Draft — so a draft
    // never has one, an unscheduled job has one only when it came back from a
    // schedule, and a scheduled job only when someone scheduled it later. From
    // Active on it always has one. The shares come from the seeded rng, so a
    // re-run against the same anchor keeps the same rows empty.
    const everChanged =
      status === "draft"
        ? false
        : status === "unscheduled"
          ? rand() < 1 / 3
          : status === "upcoming" || status === "pastDue"
            ? rand() < 1 / 2
            : true;

    const type = rand() < 0.22 ? "recall" : "new";

    const labelCount = int(0, 3);
    const labelIds = [];
    while (labelIds.length < labelCount) {
      const label = pick(JOB_LABELS).id;
      if (!labelIds.includes(label)) labelIds.push(label);
    }

    const assigneeCount = scheduledFor == null ? int(0, 1) : int(1, 3);
    const assigneeIds = [];
    while (assigneeIds.length < assigneeCount) {
      const tech = pick(TECHS).id;
      if (!assigneeIds.includes(tech)) assigneeIds.push(tech);
    }

    return {
      id: `JOB-${1043 + index}`,
      locationId: location.id,
      serviceId: service.id,
      serviceName: service.name,
      status,
      priority: PRIORITY_MIX[(index * 5) % PRIORITY_MIX.length],
      labelIds,
      type,
      sourceId: source.id,
      sourceRef: source.prefix == null ? null : `${source.prefix}-${int(1000, 9999)}`,
      assigneeIds,
      receivedAt: dayAt(receivedOffset, int(8, 16), pick([0, 15, 30, 45])),
      scheduledFor,
      durationMinutes,
      statusChangedAt: everChanged ? dayAt(statusChangedOffset, int(8, 17)) : null,
      lastModifiedAt: dayAt(lastModifiedOffset, int(8, 17)),
    };
  }

  const jobs = Array.from({ length: 64 }, (_, i) => makeJob(i)).sort((a, b) => {
    if (a.scheduledFor == null && b.scheduledFor == null) return a.id.localeCompare(b.id);
    if (a.scheduledFor == null) return 1;
    if (b.scheduledFor == null) return -1;
    return a.scheduledFor.localeCompare(b.scheduledFor);
  });

  for (const j of jobs) {
    const parts = [
      `id: ${q(j.id)}`,
      `locationId: ${q(j.locationId)}`,
      `serviceId: ${q(j.serviceId)}`,
      `serviceName: ${q(j.serviceName)}`,
      `status: ${q(j.status)}`,
    ];
    if (j.priority != null) parts.push(`priority: ${j.priority}`);
    if (j.scheduledFor != null) parts.push(`scheduledFor: ${q(j.scheduledFor)}`);
    if (j.durationMinutes != null) parts.push(`durationMinutes: ${j.durationMinutes}`);
    parts.push(`assigneeIds: [${j.assigneeIds.join(", ")}]`);
    parts.push(`equipmentIds: []`);
    parts.push(`labelIds: [${j.labelIds.map(q).join(", ")}]`);
    parts.push(`type: ${q(j.type)}`);
    parts.push(`sourceId: ${q(j.sourceId)}`);
    if (j.sourceRef != null) parts.push(`sourceRef: ${q(j.sourceRef)}`);
    parts.push(`receivedAt: ${q(j.receivedAt)}`);
    parts.push(`statusChangedAt: ${q(j.statusChangedAt)}`);
    parts.push(`lastModifiedAt: ${q(j.lastModifiedAt)}`);
    console.log(`  { ${parts.join(", ")} },`);
  }
}

// ========================= ESTIMATES (estimatesData.ts) ======================
function dumpEstimates() {
  const rand = makeRng(20260911);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const int = (min, max) => min + Math.floor(rand() * (max - min + 1));

  // The generator still thinks in production's STATE, because that is what
  // correlates an estimate's issue window, its down payment and how likely the
  // client is to have opened it — and because the seeded pick() sequence
  // depends on it, so changing it would change every generated row. The state
  // is never STORED any more (Daniel, 2026-09-11): `statusOf` below collapses
  // it, `isDraft` and the conversion path into the single `EstimateStatus` the
  // db now carries.
  const STATE_MIX = [
    ...Array(5).fill("Sent"),
    ...Array(4).fill("Pending"),
    ...Array(3).fill("Approved"),
    ...Array(2).fill("Won"),
    "Lost", "Cancelled",
  ];

  // state (+ isDraft / conversionPath) → the stored status. EXPIRED is not here:
  // it is derived from `dueAt` at render time, never stored.
  const statusOf = (state, isDraft, conversionPath) => {
    if (state === "Pending") return isDraft ? "draft" : "unsent";
    if (state === "Sent") return "awaitingApproval";
    if (state === "Approved" || state === "Won") return conversionPath;
    return state.toLowerCase(); // Lost / Cancelled
  };

  function issueWindow(state) {
    switch (state) {
      case "Pending":
        return [-12, -1];
      case "Sent":
        return [-40, -3];
      case "Approved":
        return [-45, -10];
      default:
        return [-90, -20];
    }
  }

  function makeEstimate(index) {
    const state = STATE_MIX[index % STATE_MIX.length];
    const service = pick(SERVICES);
    const location = pick(LOCATIONS);

    const window = issueWindow(state);
    const issuedOffset = int(window[0], window[1]);
    const dueOffset = issuedOffset + pick([14, 21, 30, 45]);

    const total = rand() < 0.35 ? int(180, 12600) : int(4, 250) * 50;

    const labelCount = int(0, 2);
    const labelIds = [];
    while (labelIds.length < labelCount) {
      const label = pick(ESTIMATE_LABELS).id;
      if (!labelIds.includes(label)) labelIds.push(label);
    }

    const required = rand() < 0.35;
    const downPayment = !required
      ? "notRequired"
      : state === "Approved" || state === "Won"
        ? pick(["paid", "paid", "partiallyPaid", "unpaid"])
        : "unpaid";

    const viewedChance = state === "Pending" ? 0 : state === "Cancelled" ? 0.4 : 0.7;
    const lastViewedAt =
      rand() < viewedChance ? dayAt(int(Math.min(issuedOffset + 1, 0), 0), int(8, 21), pick([0, 15, 30, 45])) : null;

    const statusChangedOffset = int(issuedOffset, 0);
    const lastModifiedOffset = int(statusChangedOffset, 0);

    const isDraft = state === "Pending" && rand() < 0.4;
    const conversionPath = pick(["unconverted", "unconverted", "jobbed", "jobbed", "invoiced"]);

    const status = statusOf(state, isDraft, conversionPath);
    // The jobs' rule, for estimates: a draft and an unsent estimate are both
    // sitting in their FIRST status, so neither has a status-change date.
    // Everything from "sent" on does — sending is a real transition, and an
    // estimate cannot go back to Unsent.
    const everChanged = status !== "draft" && status !== "unsent";

    return {
      id: `EST-${2207 + index}`,
      locationId: location.id,
      serviceId: service.id,
      serviceName: service.name,
      status,
      labelIds,
      total,
      issuedAt: dayAt(issuedOffset, int(8, 17), pick([0, 15, 30, 45])),
      dueAt: dayAt(dueOffset, 17),
      downPayment,
      statusChangedAt: everChanged ? dayAt(statusChangedOffset, int(8, 17)) : null,
      lastModifiedAt: dayAt(lastModifiedOffset, int(8, 17)),
      lastViewedAt,
    };
  }

  const estimates = Array.from({ length: 56 }, (_, i) => makeEstimate(i)).sort((a, b) =>
    a.dueAt === b.dueAt ? a.id.localeCompare(b.id) : a.dueAt.localeCompare(b.dueAt),
  );

  for (const e of estimates) {
    const parts = [
      `id: ${q(e.id)}`,
      `locationId: ${q(e.locationId)}`,
      `serviceId: ${q(e.serviceId)}`,
      `serviceName: ${q(e.serviceName)}`,
      `status: ${q(e.status)}`,
    ];
    parts.push(`labelIds: [${e.labelIds.map(q).join(", ")}]`);
    parts.push(`total: ${e.total}`);
    parts.push(`issuedAt: ${q(e.issuedAt)}`);
    parts.push(`dueAt: ${q(e.dueAt)}`);
    parts.push(`downPayment: ${q(e.downPayment)}`);
    parts.push(`statusChangedAt: ${q(e.statusChangedAt)}`);
    parts.push(`lastModifiedAt: ${q(e.lastModifiedAt)}`);
    if (e.lastViewedAt != null) parts.push(`lastViewedAt: ${q(e.lastViewedAt)}`);
    console.log(`  { ${parts.join(", ")} },`);
  }
}

// ========================= INVOICES (invoicesData.ts) ========================
function dumpInvoices() {
  const rand = makeRng(20260914);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const int = (min, max) => min + Math.floor(rand() * (max - min + 1));

  // The generator thinks in the DISPLAY status — one entry per badge — because
  // that is what correlates the issue window, the payment and the viewed
  // chance. OVERDUE is a generator-only value: it EMITS "outstanding" with a
  // dueAt already in the past, since the db never stores overdue (it is
  // derived from the clock, like the estimates' Expired).
  const STATUS_MIX = [
    ...Array(4).fill("paid"),
    ...Array(3).fill("outstanding"),
    ...Array(2).fill("overdue"),
    ...Array(2).fill("unsent"),
    "draft", "voided", "forgiven",
  ];

  // Production's payment terms — days from issue to due. 0 = due on receipt.
  const NET_MIX = [0, 15, 15, 30, 30, 30, 45, 60];

  function makeInvoice(index) {
    const kind = STATUS_MIX[index % STATUS_MIX.length];
    const status = kind === "overdue" ? "outstanding" : kind;
    const service = pick(SERVICES);
    const net = pick(NET_MIX);

    const total = rand() < 0.35 ? int(180, 12600) : int(4, 250) * 50;

    // The Bayside credit-limit story must stay BAYSIDE'S: Wildwood has a
    // 25,000 limit of its own, and enough large UNPAID invoices would push it
    // over too, firing the "credit limit reached" client issue all over the
    // demo's main world. So a large open invoice never lands on a Wildwood
    // location — small ones may.
    const isOpen = kind !== "paid" && kind !== "voided" && kind !== "forgiven";
    let location = pick(LOCATIONS);
    while (isOpen && total > 1500 && location.clientId === "wildwood") location = pick(LOCATIONS);

    // The issue window per display status. Outstanding must land its due date
    // in the future, overdue in the past — both derived from the net terms so
    // dueAt - issuedAt stays a real "Net N".
    let issuedOffset;
    switch (kind) {
      case "draft":
      case "unsent":
        issuedOffset = int(-14, -1);
        break;
      case "outstanding":
        issuedOffset = net === 0 ? 0 : int(-(net - 2), -1);
        break;
      case "overdue":
        issuedOffset = int(-net - 45, -net - 1);
        break;
      case "paid":
        issuedOffset = int(-90, -20);
        break;
      default: // voided / forgiven
        issuedOffset = int(-90, -30);
    }
    const dueOffset = issuedOffset + net;

    const labelCount = int(0, 2);
    const labelIds = [];
    while (labelIds.length < labelCount) {
      const label = pick(INVOICE_LABELS).id;
      if (!labelIds.includes(label)) labelIds.push(label);
    }

    // Partial payments: an estimate deposit copied over, or a first partial
    // payment — production sums InvoicePayments into amount_paid. A voided
    // invoice has none (production refuses to void one with real payments).
    let amountPaid = 0;
    if (kind === "paid") amountPaid = total;
    else if (kind === "outstanding" || kind === "overdue") {
      if (rand() < 0.25) amountPaid = Math.round(total * pick([0.25, 0.3, 0.5]));
    } else if (kind === "forgiven" && rand() < 0.3) {
      amountPaid = Math.round(total * pick([0.25, 0.5]));
    }

    // Draft and unsent sit in their FIRST status (production's pending), so no
    // transition yet; the client cannot have seen them either — production
    // stamps last_viewed when the PUBLIC invoice page is opened.
    const sentOffset = Math.min(issuedOffset + int(0, 2), 0);
    let statusChangedOffset = null;
    switch (kind) {
      case "draft":
      case "unsent":
        break;
      case "outstanding":
      case "overdue":
        statusChangedOffset = sentOffset;
        break;
      case "paid":
        statusChangedOffset = int(Math.min(issuedOffset + 2, 0), Math.min(dueOffset + 10, 0));
        break;
      default: // voided / forgiven
        statusChangedOffset = Math.min(issuedOffset + int(3, 30), 0);
    }

    const viewedChance =
      kind === "draft" || kind === "unsent" ? 0 : kind === "voided" ? 0.3 : kind === "forgiven" ? 0.6 : 0.75;
    const lastViewedAt =
      rand() < viewedChance ? dayAt(int(Math.min(sentOffset + 1, 0), 0), int(8, 21), pick([0, 15, 30, 45])) : null;

    const lastModifiedOffset = int(statusChangedOffset ?? issuedOffset, 0);

    return {
      id: `INV-${3108 + index}`,
      locationId: location.id,
      serviceId: service.id,
      serviceName: service.name,
      status,
      labelIds,
      total,
      amountPaid,
      issuedAt: dayAt(issuedOffset, int(8, 17), pick([0, 15, 30, 45])),
      dueAt: dayAt(dueOffset, 17),
      statusChangedAt: statusChangedOffset == null ? null : dayAt(statusChangedOffset, int(8, 17)),
      lastModifiedAt: dayAt(lastModifiedOffset, int(8, 17)),
      lastViewedAt,
    };
  }

  const invoices = Array.from({ length: 56 }, (_, i) => makeInvoice(i)).sort((a, b) =>
    a.dueAt === b.dueAt ? a.id.localeCompare(b.id) : a.dueAt.localeCompare(b.dueAt),
  );

  for (const inv of invoices) {
    const parts = [
      `id: ${q(inv.id)}`,
      `locationId: ${q(inv.locationId)}`,
      `serviceId: ${q(inv.serviceId)}`,
      `serviceName: ${q(inv.serviceName)}`,
      `status: ${q(inv.status)}`,
    ];
    parts.push(`labelIds: [${inv.labelIds.map(q).join(", ")}]`);
    parts.push(`total: ${inv.total}`);
    parts.push(`amountPaid: ${inv.amountPaid}`);
    parts.push(`issuedAt: ${q(inv.issuedAt)}`);
    parts.push(`dueAt: ${q(inv.dueAt)}`);
    parts.push(`statusChangedAt: ${inv.statusChangedAt == null ? "null" : q(inv.statusChangedAt)}`);
    parts.push(`lastModifiedAt: ${q(inv.lastModifiedAt)}`);
    if (inv.lastViewedAt != null) parts.push(`lastViewedAt: ${q(inv.lastViewedAt)}`);
    console.log(`  { ${parts.join(", ")} },`);
  }
}

// ====================== CREDIT NOTES (creditNotesData.ts) ====================
function dumpCreditNotes() {
  const rand = makeRng(20260915);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const int = (min, max) => min + Math.floor(rand() * (max - min + 1));

  const CLIENTS = ["wildwood", "harbour", "bayside", "ferry", "mission", "northpoint", "sunset", "presidio"];

  // Invoices a credit note may be written against — id + the invoice's CLIENT
  // (through its location), copied from db.ts. Older paid / outstanding rows
  // only, so a credit note's issue date can safely come after the invoice's.
  const INVOICE_REFS = [
    { id: "INV-3101", clientId: "harbour" },
    { id: "INV-3106", clientId: "wildwood" },
    { id: "INV-3108", clientId: "mission" },
    { id: "INV-3109", clientId: "northpoint" },
    { id: "INV-3111", clientId: "sunset" },
    { id: "INV-3113", clientId: "mission" },
    { id: "INV-3115", clientId: "northpoint" },
    { id: "INV-3122", clientId: "mission" },
    { id: "INV-3123", clientId: "harbour" },
    { id: "INV-3124", clientId: "bayside" },
    { id: "INV-3125", clientId: "presidio" },
    { id: "INV-3129", clientId: "harbour" },
    { id: "INV-3130", clientId: "harbour" },
    { id: "INV-3136", clientId: "presidio" },
    { id: "INV-3137", clientId: "bayside" },
    { id: "INV-3139", clientId: "harbour" },
    { id: "INV-3150", clientId: "wildwood" },
    { id: "INV-3151", clientId: "mission" },
    { id: "INV-3152", clientId: "sunset" },
    { id: "INV-3158", clientId: "ferry" },
  ];
  const CREDIT_NOTE_LABELS = [
    { id: "billing-error" }, { id: "goodwill" }, { id: "parts-return" },
    { id: "warranty" }, { id: "service-issue" }, { id: "contract-adjustment" },
  ];

  // The display statuses (production splits Pending into Draft/Unsent by
  // `is_draft`). No clock-derived status here — a credit note has no due date.
  const STATUS_MIX = [
    ...Array(6).fill("issued"),
    ...Array(2).fill("unsent"),
    ...Array(2).fill("voided"),
    "draft",
  ];

  function makeCreditNote(index) {
    const status = STATUS_MIX[index % STATUS_MIX.length];
    const closed = status === "issued" || status === "voided";

    // The invoice link is optional in production; a closed note usually has
    // one (its type was computed from the allocation at issue time).
    const linked = rand() < (closed ? 0.75 : 0.4);
    const invoice = linked ? pick(INVOICE_REFS) : null;
    const clientId = invoice == null ? pick(CLIENTS) : invoice.clientId;

    // Production computes the TYPE when the note is ISSUED (fully allocated =
    // pre_payment, none = post_payment, part = mixed; no invoice =
    // post_payment) — so only issued / voided rows carry one.
    const type = !closed ? null : invoice == null ? "postPayment" : pick(["prePayment", "prePayment", "postPayment", "mixed"]);

    const total = rand() < 0.3 ? int(120, 3600) : int(2, 72) * 25;

    const labelCount = int(0, 2);
    const labelIds = [];
    while (labelIds.length < labelCount) {
      const label = pick(CREDIT_NOTE_LABELS).id;
      if (!labelIds.includes(label)) labelIds.push(label);
    }

    const issuedOffset = status === "issued" ? int(-75, -2) : status === "voided" ? int(-80, -10) : int(-12, 0);
    const lastModifiedOffset = int(issuedOffset, 0);

    return {
      id: `CN-${4107 + index}`,
      clientId,
      invoiceId: invoice?.id ?? null,
      status,
      type,
      labelIds,
      total,
      issuedAt: dayAt(issuedOffset, int(8, 17), pick([0, 15, 30, 45])),
      lastModifiedAt: dayAt(lastModifiedOffset, int(8, 17)),
    };
  }

  const notes = Array.from({ length: 22 }, (_, i) => makeCreditNote(i)).sort((a, b) =>
    a.issuedAt === b.issuedAt ? a.id.localeCompare(b.id) : a.issuedAt.localeCompare(b.issuedAt),
  );

  for (const note of notes) {
    const parts = [`id: ${q(note.id)}`, `clientId: ${q(note.clientId)}`];
    if (note.invoiceId != null) parts.push(`invoiceId: ${q(note.invoiceId)}`);
    parts.push(`status: ${q(note.status)}`);
    if (note.type != null) parts.push(`type: ${q(note.type)}`);
    parts.push(`labelIds: [${note.labelIds.map(q).join(", ")}]`);
    parts.push(`total: ${note.total}`);
    parts.push(`issuedAt: ${q(note.issuedAt)}`);
    parts.push(`lastModifiedAt: ${q(note.lastModifiedAt)}`);
    console.log(`  { ${parts.join(", ")} },`);
  }
}

// ============================== BILLS (db.ts) ================================
function dumpBills() {
  const rand = makeRng(20260917);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const int = (min, max) => min + Math.floor(rand() * (max - min + 1));

  // Active vendors only (id/order copied from db.ts) — the deactivated
  // presidio-fire keeps a curated row instead. `code` prefixes the vendor's
  // own invoice number.
  const VENDOR_REFS = [
    { id: "pacific-refrigeration", code: "PRP" },
    { id: "golden-gate-supply", code: "GGS" },
    { id: "bayview-hood", code: "BH" },
    { id: "marin-equipment", code: "MKE" },
    { id: "embarcadero-plumbing", code: "EPS" },
    { id: "fogline-chemical", code: "FCS" },
    { id: "peninsula-parts", code: "PAP" },
    { id: "sequoia-hvac", code: "SEQ" },
    { id: "mission-electric", code: "MES" },
  ];
  const BILL_LABELS = [
    { id: "parts-order" }, { id: "consumables" }, { id: "equipment-purchase" },
    { id: "rush-order" }, { id: "warranty-replacement" }, { id: "monthly-account" },
    { id: "disputed" },
  ];

  // Display statuses; "overdue" is generator-only — it EMITS "outstanding"
  // with a past dueAt, since overdue is derived, never stored. No Unsent
  // (Daniel, 2026-09-15: a bill cannot be sent).
  const STATUS_MIX = [
    ...Array(5).fill("paid"),
    ...Array(3).fill("outstanding"),
    ...Array(2).fill("overdue"),
    "draft", "voided",
  ];
  const NET_MIX = [0, 15, 15, 30, 30, 30, 45, 60];

  function makeBill(index) {
    const kind = STATUS_MIX[index % STATUS_MIX.length];
    const status = kind === "overdue" ? "outstanding" : kind;
    const vendor = pick(VENDOR_REFS);
    const net = pick(NET_MIX);

    // Supplier money — smaller than the customer invoices; the occasional
    // equipment purchase runs bigger.
    const total = rand() < 0.25 ? int(60, 5200) : int(1, 96) * 25;

    let issuedOffset;
    switch (kind) {
      case "draft":
        issuedOffset = int(-10, -1);
        break;
      case "outstanding":
        issuedOffset = net === 0 ? 0 : int(-(net - 2), -1);
        break;
      case "overdue":
        issuedOffset = int(-net - 45, -net - 1);
        break;
      case "paid":
        issuedOffset = int(-90, -15);
        break;
      default: // voided
        issuedOffset = int(-90, -20);
    }
    const dueOffset = issuedOffset + net;
    // The bill arrives a few days after the vendor issues it, never in the
    // future — `date_received` is the user-entered arrival date.
    const receivedOffset = Math.min(issuedOffset + int(0, 4), 0);

    const labelCount = int(0, 2);
    const labelIds = [];
    while (labelIds.length < labelCount) {
      const label = pick(BILL_LABELS).id;
      if (!labelIds.includes(label)) labelIds.push(label);
    }

    // The jobs' rule: a draft is "not created yet" and a bill is BORN
    // outstanding (leaving Draft is not a change), so only paid / voided
    // carry a status-change date — mark-as-paid and void are real
    // transitions.
    let statusChangedOffset = null;
    if (kind === "paid") statusChangedOffset = int(Math.min(receivedOffset + 1, 0), Math.min(dueOffset + 10, 0));
    else if (kind === "voided") statusChangedOffset = Math.min(receivedOffset + int(2, 25), 0);

    const lastModifiedOffset = int(statusChangedOffset ?? receivedOffset, 0);

    return {
      id: `BILL-${6107 + index}`,
      vendorId: vendor.id,
      vendorInvoiceId: `${vendor.code}-${int(10000, 99999)}`,
      status,
      labelIds,
      total,
      receivedAt: dayAt(receivedOffset).slice(0, 10),
      issuedAt: dayAt(issuedOffset).slice(0, 10),
      dueAt: dayAt(dueOffset).slice(0, 10),
      statusChangedAt: statusChangedOffset == null ? null : dayAt(statusChangedOffset, int(8, 17)),
      lastModifiedAt: dayAt(lastModifiedOffset, int(8, 17)),
    };
  }

  const bills = Array.from({ length: 38 }, (_, i) => makeBill(i)).sort((a, b) =>
    a.dueAt === b.dueAt ? a.id.localeCompare(b.id) : a.dueAt.localeCompare(b.dueAt),
  );

  for (const bill of bills) {
    const parts = [
      `id: ${q(bill.id)}`,
      `vendorId: ${q(bill.vendorId)}`,
      `vendorInvoiceId: ${q(bill.vendorInvoiceId)}`,
      `status: ${q(bill.status)}`,
    ];
    parts.push(`labelIds: [${bill.labelIds.map(q).join(", ")}]`);
    parts.push(`total: ${bill.total}`);
    parts.push(`receivedAt: ${q(bill.receivedAt)}`);
    parts.push(`issuedAt: ${q(bill.issuedAt)}`);
    parts.push(`dueAt: ${q(bill.dueAt)}`);
    parts.push(`statusChangedAt: ${bill.statusChangedAt == null ? "null" : q(bill.statusChangedAt)}`);
    parts.push(`lastModifiedAt: ${q(bill.lastModifiedAt)}`);
    console.log(`  { ${parts.join(", ")} },`);
  }
}

// ========================= JOB SERIES (seriesData.ts) ========================
function dumpJobSeries() {
  const rand = makeRng(20260916);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const int = (min, max) => min + Math.floor(rand() * (max - min + 1));

  const FREQ_MIX = ["weekly", "weekly", "weekly", "weekly", "monthly", "monthly", "monthly", "daily", "yearly"];

  function makeSeries(index) {
    const service = pick(SERVICES);
    const location = pick(LOCATIONS);
    const frequency = FREQ_MIX[index % FREQ_MIX.length];

    // The PHASE is derived from the end date (production's is_closed):
    // roughly a third closed, and ~40% of the open ones open-ENDED — which
    // forces type=rolling (an upfront series needs an end).
    const shape = rand() < 0.33 ? "closed" : rand() < 0.4 ? "endless" : "openEnded";
    const type = shape === "endless" ? "rolling" : pick(["upfront", "upfront", "rolling"]);

    let startOffset;
    let endOffset = null;
    if (shape === "closed") {
      endOffset = int(-180, -10);
      startOffset = endOffset - int(90, 400);
    } else if (shape === "openEnded") {
      startOffset = int(-200, -5);
      endOffset = int(10, 240);
    } else {
      startOffset = int(-200, 20);
    }

    const interval =
      frequency === "weekly" ? pick([1, 1, 2]) : frequency === "monthly" ? pick([1, 1, 2, 3]) : 1;

    let weeklyRecurrence = null;
    if (frequency === "weekly") {
      const count = int(1, 3);
      weeklyRecurrence = [];
      while (weeklyRecurrence.length < count) {
        const day = int(0, 6);
        if (!weeklyRecurrence.includes(day)) weeklyRecurrence.push(day);
      }
      weeklyRecurrence.sort((a, b) => a - b);
    }
    const monthlyRecurrence = frequency === "monthly" ? pick(["sameDate", "sameDate", "sameDay"]) : null;

    // Production counts the jobs in flight — an upfront series has its whole
    // tail open, a rolling one at most the next visit, a closed one usually
    // nothing.
    const openJobsCount =
      shape === "closed" ? (rand() < 0.2 ? 1 : 0) : type === "upfront" ? int(1, 12) : int(0, 2);

    const createdOffset = startOffset - int(3, 30);
    const lastModifiedOffset = int(Math.min(createdOffset, 0), 0);

    return {
      id: `SER-${5107 + index}`,
      locationId: location.id,
      serviceId: service.id,
      serviceName: service.name,
      type,
      recurrenceStart: dayAt(startOffset, pick([7, 8, 9, 10]), pick([0, 30])),
      recurrenceEnd: endOffset == null ? null : dayAt(endOffset, 17),
      recurrenceInterval: interval,
      recurrenceFrequency: frequency,
      weeklyRecurrence,
      monthlyRecurrence,
      openJobsCount,
      createdAt: dayAt(createdOffset, int(8, 17), pick([0, 15, 30, 45])),
      lastModifiedAt: dayAt(lastModifiedOffset, int(8, 17)),
    };
  }

  const series = Array.from({ length: 18 }, (_, i) => makeSeries(i)).sort((a, b) =>
    a.recurrenceStart === b.recurrenceStart
      ? a.id.localeCompare(b.id)
      : a.recurrenceStart.localeCompare(b.recurrenceStart),
  );

  for (const s of series) {
    const parts = [
      `id: ${q(s.id)}`,
      `locationId: ${q(s.locationId)}`,
      `serviceId: ${q(s.serviceId)}`,
      `serviceName: ${q(s.serviceName)}`,
      `type: ${q(s.type)}`,
      `recurrenceStart: ${q(s.recurrenceStart)}`,
    ];
    if (s.recurrenceEnd != null) parts.push(`recurrenceEnd: ${q(s.recurrenceEnd)}`);
    parts.push(`recurrenceInterval: ${s.recurrenceInterval}`);
    parts.push(`recurrenceFrequency: ${q(s.recurrenceFrequency)}`);
    if (s.weeklyRecurrence != null) parts.push(`weeklyRecurrence: [${s.weeklyRecurrence.join(", ")}]`);
    if (s.monthlyRecurrence != null) parts.push(`monthlyRecurrence: ${q(s.monthlyRecurrence)}`);
    parts.push(`openJobsCount: ${s.openJobsCount}`);
    parts.push(`createdAt: ${q(s.createdAt)}`);
    parts.push(`lastModifiedAt: ${q(s.lastModifiedAt)}`);
    console.log(`  { ${parts.join(", ")} },`);
  }
}

// ======================= PURCHASE ORDERS (db.ts) =============================
function dumpPurchaseOrders() {
  const rand = makeRng(20260918);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const int = (min, max) => min + Math.floor(rand() * (max - min + 1));

  // Active vendors only (id/order copied from db.ts) — the deactivated
  // presidio-fire keeps a curated row instead.
  const VENDOR_IDS = [
    "pacific-refrigeration", "golden-gate-supply", "bayview-hood",
    "marin-equipment", "embarcadero-plumbing", "fogline-chemical",
    "peninsula-parts", "sequoia-hvac", "mission-electric",
  ];
  const PO_LABELS = [
    { id: "job-parts" }, { id: "stock-replenishment" }, { id: "emergency" },
    { id: "backordered" }, { id: "standing-order" }, { id: "warranty-claim" },
  ];
  // Carrier + method PAIRS (production stores the two enum fields
  // separately — the demo mirrors that since the 2026-09-15 split). One
  // entry is a fully CUSTOM pair — production's "Other + custom name"
  // mechanism — so the mass carries user-written values too. ONE rand call
  // per pick, like the string pool it replaced, so the seeded sequence for
  // every other field is unchanged.
  const SHIPPING_PAIRS = [
    { c: "fedex", m: "ground" },
    { c: "fedex", m: "two-day-air" },
    { c: "ups", m: "ground" },
    { c: "ups", m: "next-day-air" },
    { c: "usps", m: "ground" },
    { c: "ontrac", m: "ground" },
    { c: "dhl-express", m: "next-day-early-am" },
    { cOther: "Local courier", mOther: "Same day" },
  ];
  // The REAL id pools — an associated id must point at a row that exists.
  const JOB_IDS = [
    ...Array.from({ length: 64 }, (_, i) => `JOB-${1043 + i}`),
    ...Array.from({ length: 14 }, (_, i) => `JOB-${1201 + i}`),
  ];
  const ESTIMATE_IDS = Array.from({ length: 62 }, (_, i) => `EST-${2201 + i}`);
  const INVOICE_IDS = Array.from({ length: 63 }, (_, i) => `INV-${3101 + i}`);

  const pickSome = (list, count) => {
    const out = [];
    while (out.length < count) {
      const id = pick(list);
      if (!out.includes(id)) out.push(id);
    }
    return out.sort();
  };

  // The nine display statuses — nothing is derived, so each is emitted as
  // stored. Weighted toward the closed end like the other masses.
  const STATUS_MIX = [
    "paid", "paid", "paid", "paid", "paid", "paid",
    "unpaid", "unpaid", "unstocked", "unstocked",
    "inTransit", "inTransit", "sent", "sent", "acknowledged", "acknowledged",
    "unsent", "draft", "cancelled", "cancelled",
  ];

  function makePO(index) {
    const status = STATUS_MIX[index % STATUS_MIX.length];
    const vendorId = pick(VENDOR_IDS);

    let issuedOffset;
    switch (status) {
      case "draft": issuedOffset = int(-5, 0); break;
      case "unsent": issuedOffset = int(-6, 0); break;
      case "sent": issuedOffset = int(-8, 0); break;
      case "acknowledged": issuedOffset = int(-12, -1); break;
      case "inTransit": issuedOffset = int(-18, -3); break;
      case "unstocked": issuedOffset = int(-25, -4); break;
      case "unpaid": issuedOffset = int(-45, -10); break;
      case "cancelled": issuedOffset = int(-80, -10); break;
      default: issuedOffset = int(-100, -25); // paid
    }

    // A just-created draft can hold nothing yet.
    const itemCount = status === "draft" && rand() < 0.4 ? 0 : int(1, 12);
    const amount = itemCount === 0 ? 0 : itemCount * int(2, 18) * 25;

    // Draft/Unsent often have no shipping picked yet; a few orders anywhere
    // are picked up in person — null = the filters' "No carrier" / "No
    // method" rows.
    const shipping =
      status === "draft" || status === "unsent"
        ? rand() < 0.5 ? pick(SHIPPING_PAIRS) : null
        : rand() < 0.85 ? pick(SHIPPING_PAIRS) : null;

    const shipped = ["inTransit", "unstocked", "unpaid", "paid"].includes(status);
    const trackingNumber =
      shipped && shipping != null && rand() < 0.85 ? `1Z${int(100000000, 999999999)}` : null;

    // In transit: a real ETA, sometimes already past (the red cell).
    // Acknowledged: sometimes promised ahead. Arrived orders keep the old one.
    let etaOffset = null;
    if (status === "inTransit") etaOffset = int(-4, 10);
    else if (status === "acknowledged" && rand() < 0.5) etaOffset = int(2, 14);
    else if (shipped && status !== "inTransit" && rand() < 0.6) {
      etaOffset = Math.min(issuedOffset + int(3, 12), 0);
    }

    const labelCount = int(0, 2);
    const labelIds = [];
    while (labelIds.length < labelCount) {
      const label = pick(PO_LABELS).id;
      if (!labelIds.includes(label)) labelIds.push(label);
    }

    // ~40% of orders are pure stock replenishment — linked to nothing (the
    // Associated filters' "None"). The rest link to jobs, sometimes to the
    // estimates/invoices those jobs came from.
    const linked = rand() < 0.6;
    const associatedJobIds = linked ? pickSome(JOB_IDS, pick([1, 1, 1, 2, 2, 3])) : [];
    const associatedEstimateIds = linked && rand() < 0.45 ? pickSome(ESTIMATE_IDS, rand() < 0.8 ? 1 : 2) : [];
    const associatedInvoiceIds = linked && rand() < 0.35 ? pickSome(INVOICE_IDS, 1) : [];

    // The jobs' rule: born pending (Draft/Unsent write nothing); every later
    // status is a real transition and carries its date.
    let statusChangedOffset = null;
    switch (status) {
      case "sent": statusChangedOffset = issuedOffset + int(0, 1); break;
      case "acknowledged": statusChangedOffset = issuedOffset + int(1, 3); break;
      case "inTransit": statusChangedOffset = issuedOffset + int(2, 5); break;
      case "unstocked": statusChangedOffset = issuedOffset + int(3, 8); break;
      case "unpaid": statusChangedOffset = issuedOffset + int(4, 12); break;
      case "paid": statusChangedOffset = issuedOffset + int(10, 30); break;
      case "cancelled": statusChangedOffset = issuedOffset + int(1, 15); break;
      default: statusChangedOffset = null;
    }
    if (statusChangedOffset != null) statusChangedOffset = Math.min(statusChangedOffset, 0);

    // Seen = the VENDOR opened it, so never before it went out.
    const sentOut = !["draft", "unsent"].includes(status);
    const lastViewedOffset =
      sentOut && rand() < 0.6 ? Math.min(issuedOffset + int(0, 3), 0) : null;

    const lastModifiedOffset = int(statusChangedOffset ?? issuedOffset, 0);

    return {
      id: `PO-${7111 + index}`,
      vendorId,
      status,
      labelIds,
      itemCount,
      amount,
      shippingCarrierId: shipping == null ? null : (shipping.c ?? "other"),
      shippingCarrierOtherName: shipping?.cOther,
      shippingMethodId: shipping == null ? null : (shipping.m ?? "other"),
      shippingMethodOtherName: shipping?.mOther,
      trackingNumber,
      estimatedArrivalAt: etaOffset == null ? null : dayAt(etaOffset).slice(0, 10),
      issuedAt: dayAt(issuedOffset).slice(0, 10),
      associatedEstimateIds,
      associatedJobIds,
      associatedInvoiceIds,
      statusChangedAt: statusChangedOffset == null ? null : dayAt(statusChangedOffset, int(8, 17)),
      lastModifiedAt: dayAt(lastModifiedOffset, int(8, 17)),
      lastViewedAt: lastViewedOffset == null ? null : dayAt(lastViewedOffset, int(8, 17)),
    };
  }

  const orders = Array.from({ length: 38 }, (_, i) => makePO(i)).sort((a, b) =>
    a.issuedAt === b.issuedAt ? a.id.localeCompare(b.id) : a.issuedAt.localeCompare(b.issuedAt),
  );

  for (const po of orders) {
    const parts = [
      `id: ${q(po.id)}`,
      `vendorId: ${q(po.vendorId)}`,
      `status: ${q(po.status)}`,
      `labelIds: [${po.labelIds.map(q).join(", ")}]`,
      `itemCount: ${po.itemCount}`,
      `amount: ${po.amount}`,
      `shippingCarrierId: ${po.shippingCarrierId == null ? "null" : q(po.shippingCarrierId)}`,
      ...(po.shippingCarrierOtherName == null ? [] : [`shippingCarrierOtherName: ${q(po.shippingCarrierOtherName)}`]),
      `shippingMethodId: ${po.shippingMethodId == null ? "null" : q(po.shippingMethodId)}`,
      ...(po.shippingMethodOtherName == null ? [] : [`shippingMethodOtherName: ${q(po.shippingMethodOtherName)}`]),
      `trackingNumber: ${po.trackingNumber == null ? "null" : q(po.trackingNumber)}`,
      `estimatedArrivalAt: ${po.estimatedArrivalAt == null ? "null" : q(po.estimatedArrivalAt)}`,
      `issuedAt: ${q(po.issuedAt)}`,
      `associatedEstimateIds: [${po.associatedEstimateIds.map(q).join(", ")}]`,
      `associatedJobIds: [${po.associatedJobIds.map(q).join(", ")}]`,
      `associatedInvoiceIds: [${po.associatedInvoiceIds.map(q).join(", ")}]`,
      `statusChangedAt: ${po.statusChangedAt == null ? "null" : q(po.statusChangedAt)}`,
      `lastModifiedAt: ${q(po.lastModifiedAt)}`,
    ];
    if (po.lastViewedAt != null) parts.push(`lastViewedAt: ${q(po.lastViewedAt)}`);
    console.log(`  { ${parts.join(", ")} },`);
  }
}

if (kind === "jobs") dumpJobs();
else if (kind === "estimates") dumpEstimates();
else if (kind === "invoices") dumpInvoices();
else if (kind === "creditnotes") dumpCreditNotes();
else if (kind === "bills") dumpBills();
else if (kind === "jobseries") dumpJobSeries();
else if (kind === "purchaseorders") dumpPurchaseOrders();
else {
  console.error("usage: node dump-db-rows.mjs <jobs|estimates|invoices|creditnotes|bills|jobseries|purchaseorders> <YYYY-MM-DD>");
  process.exit(1);
}
