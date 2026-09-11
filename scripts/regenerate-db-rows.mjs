// One-off: run the Filters prototype's seeded generators (copied VERBATIM
// from jobsData.ts / estimatesData.ts) against a given TODAY anchor and print
// the rows as db.ts literals.
//
// Usage: node dump-db-rows.mjs <jobs|estimates> <ISO-today>  (e.g. 2026-09-04)
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
      statusChangedAt: dayAt(statusChangedOffset, int(8, 17)),
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

  const STATE_MIX = [
    ...Array(5).fill("Sent"),
    ...Array(4).fill("Pending"),
    ...Array(3).fill("Approved"),
    ...Array(2).fill("Won"),
    "Lost", "Cancelled",
  ];

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

    return {
      id: `EST-${2207 + index}`,
      locationId: location.id,
      serviceId: service.id,
      serviceName: service.name,
      status: state,
      isDraft,
      conversionPath,
      labelIds,
      total,
      issuedAt: dayAt(issuedOffset, int(8, 17), pick([0, 15, 30, 45])),
      dueAt: dayAt(dueOffset, 17),
      downPayment,
      statusChangedAt: dayAt(statusChangedOffset, int(8, 17)),
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
    if (e.status === "Pending" && e.isDraft) parts.push(`isDraft: true`);
    if (e.status === "Approved" || e.status === "Won") parts.push(`conversionPath: ${q(e.conversionPath)}`);
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

if (kind === "jobs") dumpJobs();
else if (kind === "estimates") dumpEstimates();
else {
  console.error("usage: node dump-db-rows.mjs <jobs|estimates> <YYYY-MM-DD>");
  process.exit(1);
}
