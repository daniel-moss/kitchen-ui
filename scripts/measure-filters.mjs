// Measure the Filters prototype in a real browser — the checks that caught every
// regression while it was built. Run it after any change to the filter UI.
//
//   npm run storybook            (in another terminal — must be on :6006)
//   node scripts/measure-filters.mjs
//   node scripts/measure-filters.mjs widths      (one section only)
//
// Sections: widths · placement · stability · menu · estimates · invoices ·
// creditnotes · bills · pos · series · vendors · clients · labor · products ·
// charges (other + discounts + tax rates) · amount · freeform
//
// It drives headless Chrome over CDP, like scripts/screenshot.mjs. It never
// touches the Storybook you already have running — it only reads from it.

import { spawn } from "node:child_process";

const CHROME = process.env.CHROME_BIN ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const STORYBOOK = process.env.STORYBOOK_URL ?? "http://localhost:6006";
const PORT = 9280;
const ONLY = (process.argv[2] ?? "").toLowerCase();
const JOBS_STORY = "prototypes-filters--desktop";
const ESTIMATES_STORY = "prototypes-filters--desktop-estimates";
const INVOICES_STORY = "prototypes-filters--desktop-invoices";
const CREDIT_NOTES_STORY = "prototypes-filters--desktop-credit-notes";
const BILLS_STORY = "prototypes-filters--desktop-bills";
const POS_STORY = "prototypes-filters--desktop-p-os";
const SERIES_STORY = "prototypes-filters--desktop-series";
const VENDORS_STORY = "prototypes-filters--desktop-vendors";
const CLIENTS_STORY = "prototypes-filters--desktop-clients";
const LABOR_STORY = "prototypes-filters--desktop-labor";
const PRODUCTS_STORY = "prototypes-filters--desktop-products";
const OTHER_STORY = "prototypes-filters--desktop-other";
const DISCOUNTS_STORY = "prototypes-filters--desktop-discounts";
const TAX_RATES_STORY = "prototypes-filters--desktop-tax-rates";

// Every filter row in the Jobs menu, with the width its list should open at.
// Address opens a dialog instead of a list, so it has none.
const EXPECTED_WIDTHS = {
  Address: null,
  Assignee: 208,
  // 276 since 2026-09-16 — the Clients-list build widened the CLIENTS table
  // ("Lighthouse Cannery Kitchen" is what the card hugs to now; it was 209
  // over the original eight names).
  Client: 276,
  // "Received" since 2026-09-14 (was "Date received").
  Received: 208,
  // 216 — its header chips ("at least" / "at most" / "is") are what the card
  // hugs to, wider than the 208 floor. The Figma node draws 218.
  "Est. duration": 216,
  Labels: 222,
  "Last modified": 208,
  Location: 384,
  Priority: 208,
  "Scheduled for": 208,
  Service: 291,
  Source: 231,
  // 256 since the Status rows became the SUB-STATUS names where they exist
  // (2026-09-14) — "Waiting for client approval" is what the card hugs to.
  Status: 256,
  "Status changed": 208,
  Type: 208,
};

const ESTIMATE_FILTERS = [
  "Address",
  "Client",
  "Down payment",
  "Expires",
  "Issued",
  "Labels",
  "Last modified",
  "Location",
  "Seen",
  "Service",
  "Status",
  "Status changed",
  "Total",
];

// The Invoices menu's thirteen rows — node 14320:66224, alphabetical.
const INVOICE_FILTERS = [
  "Address",
  "Amount due",
  "Client",
  "Due date",
  "Issued",
  "Labels",
  "Last modified",
  "Location",
  "Seen",
  "Service",
  "Status",
  "Status changed",
  "Total",
];

// The Credit notes menu's rows — node 14759-68604, alphabetical. Type is
// CLOSED-phase only (Daniel, 2026-09-14), so the open menu has six rows.
const CREDIT_NOTE_FILTERS_OPEN = ["Client", "Issued", "Labels", "Last modified", "Status", "Total"];
const CREDIT_NOTE_FILTERS_CLOSED = [...CREDIT_NOTE_FILTERS_OPEN, "Type"];

// The Bills menu's rows — node 14817-83613, alphabetical. Status changed is
// CLOSED-phase only (Daniel, 2026-09-15), so the open menu has eight rows and
// the closed one keeps it in its alphabetical slot between Status and Total.
const BILL_FILTERS_OPEN = [
  "Billing vendor",
  "Due date",
  "Issued",
  "Labels",
  "Last modified",
  "Received",
  "Status",
  "Total",
];
const BILL_FILTERS_CLOSED = [...BILL_FILTERS_OPEN.slice(0, 7), "Status changed", "Total"];

// The POs menu's sixteen rows — node 14824-29890, alphabetical. The SAME
// menu on both phases (Status changed is on both — Daniel, 2026-09-15).
// Shipping split into carrier + method and Est. arrival joined later the
// same day.
const PO_FILTERS_MENU = [
  "Amount",
  "Associated estimates",
  "Associated invoices",
  "Associated jobs",
  "Est. arrival",
  "Issued",
  "Items",
  "Labels",
  "Last modified",
  "Payment terms",
  "Purchasing vendor",
  "Seen",
  "Shipping carrier",
  "Shipping method",
  "Status",
  "Status changed",
];

// The Series menu's ten rows — node 14759-74313, alphabetical. Recurrence
// joined on 2026-09-14, when Daniel drew its section (14831-29459).
const SERIES_FILTERS = [
  "Address",
  "Client",
  "Created at",
  "Location",
  "Open jobs",
  "Recurrence",
  "Series end",
  "Series start",
  "Service",
  "Type",
];

// The Vendors menu's nine rows — the menu node in section 14831-31010,
// alphabetical (Daniel fixed the Bills via / Billing address swap
// 2026-09-15; Created at joined 2026-09-16).
const VENDOR_FILTERS_MENU = [
  "Billing address",
  "Bills via",
  "Commitments",
  "Created at",
  "Current POs",
  "Labels",
  "Last modified",
  "Payables",
  "Payment terms",
];

const MENU_WIDTH = 208; // the documented floor — node 14310-59652

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- CDP plumbing -----------------------------------------------------------
const chrome = spawn(CHROME, [
  "--headless",
  "--disable-gpu",
  `--remote-debugging-port=${PORT}`,
  "--window-size=1400,900",
  "--force-color-profile=srgb",
  "about:blank",
]);
process.on("exit", () => chrome.kill());

let wsUrl;
for (let i = 0; i < 40 && !wsUrl; i++) {
  try {
    const targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
    wsUrl = targets.find((t) => t.type === "page")?.webSocketDebuggerUrl;
  } catch {
    /* retry */
  }
  if (!wsUrl) await sleep(250);
}
if (!wsUrl) {
  console.error("Chrome debug port never came up.");
  process.exit(1);
}

let msgId = 0;
const pending = new Map();
const ws = new WebSocket(wsUrl);
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
};
await new Promise((r) => (ws.onopen = r));
const send = (method, params = {}) =>
  new Promise((res) => {
    const id = ++msgId;
    pending.set(id, res);
    ws.send(JSON.stringify({ id, method, params }));
  });
const js = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) return { ERR: r.exceptionDetails.text };
  return r?.result?.value;
};
await send("Page.enable");
await send("Runtime.enable");

try {
  await fetch(`${STORYBOOK}/index.json`);
} catch {
  console.error(`Cannot reach ${STORYBOOK} — start Storybook first (npm run storybook).`);
  process.exit(1);
}

// ---- helpers ----------------------------------------------------------------
const load = async (story) => {
  await send("Page.navigate", { url: `${STORYBOOK}/iframe.html?id=${story}&viewMode=story` });
  await sleep(1900);
};
const openMenu = async () => {
  await js(`[...document.querySelectorAll("button")].find(b => b.textContent.trim() === "Filters")?.click()`);
  await sleep(650);
};
// A real row contains no other matching element; a CONTAINER node — whose
// text is every label joined — does. Filtering structurally replaced the old
// length cap (2026-09-16): the cap was 24, then 40, and the Tax rates menu
// broke it anyway, because four short labels joined ("LabelsLast
// modifiedSubtypeTax rate", 33) still fit under it. Nothing about a menu's
// wording can defeat this version.
const menuRows = () =>
  js(`JSON.stringify((() => {
        const all = [...document.querySelectorAll('[class*="filtersMenu"] [class*="item"]')];
        return all
          .filter(el => !all.some(other => other !== el && el.contains(other)))
          .map(el => el.textContent.trim())
          .filter(Boolean);
      })())`);
const hoverRow = async (name) => {
  await js(`(() => {
    const rows = [...document.querySelectorAll('[class*="filtersMenu"] [class*="item"]')];
    const row = rows.find(r => r.textContent.trim() === ${JSON.stringify(name)});
    if (!row) return "missing";
    row.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    row.dispatchEvent(new PointerEvent("pointerenter", { bubbles: false }));
    return "ok";
  })()`);
  await sleep(700);
};
const subList = () =>
  js(`(() => {
    const sub = document.querySelector('[class*="filtersSub"]');
    if (sub == null) return null;
    const card = sub.querySelector('[class*="card"]') ?? sub.firstElementChild;
    const box = card.getBoundingClientRect();
    const titles = [...card.querySelectorAll('[class*="title"]')];
    return JSON.stringify({
      width: Math.round(box.width),
      left: Math.round(box.left),
      right: Math.round(box.right),
      clipped: titles.filter(t => t.scrollWidth > t.clientWidth + 1).length,
      offscreen: box.left < 0 || box.right > window.innerWidth,
    });
  })()`);
const clickSubRow = async (text) => {
  await js(`(() => {
    const items = [...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
      .filter(el => /_item_/.test(el.className));
    const row = items.find(r => r.textContent.trim() === ${JSON.stringify(text)});
    if (row) row.click();
    return 1;
  })()`);
  await sleep(800);
};
const rowRect = (name) =>
  js(`(() => {
    const rows = [...document.querySelectorAll('[class*="filtersMenu"] [class*="item"]')];
    const row = rows.find(r => r.textContent.trim() === ${JSON.stringify(name)});
    if (!row) return null;
    const b = row.getBoundingClientRect();
    return JSON.stringify({ left: Math.round(b.left), right: Math.round(b.right) });
  })()`);
const typeInto = async (selector, text) => {
  await js(`(() => {
    const input = ${selector};
    if (input == null) return 0;
    input.focus();
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    set.call(input, ${JSON.stringify(text)});
    input.dispatchEvent(new Event("input", { bubbles: true }));
    return 1;
  })()`);
  await sleep(320);
};

let failures = 0;
const report = (ok, label, detail) => {
  if (!ok) failures++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}${detail == null ? "" : "  " + detail}`);
};
const run = (name) => ONLY === "" || ONLY === name;

// ---- widths: every list opens at its documented width, nothing clipped ------
if (run("widths")) {
  console.log("\nwidths — each list's own width, and no truncated labels");
  await load(JOBS_STORY);
  await openMenu();
  for (const [name, expected] of Object.entries(EXPECTED_WIDTHS)) {
    await hoverRow(name);
    const raw = await subList();
    if (expected == null) {
      report(raw == null, `${name} opens no list (dialog only)`);
      continue;
    }
    if (raw == null) {
      report(false, `${name}`, "no list opened");
      continue;
    }
    const list = JSON.parse(raw);
    report(list.width === expected, `${name} ${list.width}px`, list.width === expected ? "" : `expected ${expected}`);
    if (list.clipped > 0) report(false, `${name} truncation`, `${list.clipped} label(s) clipped`);
  }
}

// ---- placement: 4px from its row, on screen, not over the menu -------------
if (run("placement")) {
  console.log("\nplacement — 4px from the row, on screen");
  await load(JOBS_STORY);
  await openMenu();
  // the order matters: a wide list after a narrow one is what used to misplace
  for (const name of ["Priority", "Labels", "Est. duration", "Location", "Type", "Labels", "Priority"]) {
    await hoverRow(name);
    const listRaw = await subList();
    const rowRaw = await rowRect(name);
    if (listRaw == null || rowRaw == null) {
      report(false, name, "no list");
      continue;
    }
    const list = JSON.parse(listRaw);
    const row = JSON.parse(rowRaw);
    // the list opens to the LEFT of the row here (the menu sits at the screen edge)
    const gap = row.left - list.right;
    report(gap === 4 && !list.offscreen, `${name} gap ${gap}px`, list.offscreen ? "OFFSCREEN" : "");
  }
}

// ---- stability: a list must not resize while its own search filters rows ----
if (run("stability")) {
  console.log("\nstability — width holds while typing in the list's search");
  await load(JOBS_STORY);
  await openMenu();
  for (const [name, term] of [
    ["Service", "walk"],
    ["Source", "direct"],
    ["Client", "wild"],
    ["Labels", "war"],
  ]) {
    await hoverRow(name);
    const widths = [];
    const read = async () => {
      const raw = await subList();
      return raw == null ? null : JSON.parse(raw).width;
    };
    widths.push(await read());
    for (let i = 1; i <= term.length; i++) {
      await typeInto(`document.querySelector('[class*="filtersSub"] input')`, term.slice(0, i));
      widths.push(await read());
    }
    const stable = new Set(widths.filter((w) => w != null)).size === 1;
    report(stable, `${name} typing "${term}"`, JSON.stringify(widths));
  }
}

// ---- menu: the documented 208 floor, held while typing ---------------------
if (run("menu")) {
  console.log("\nmenu — 208px floor, steady while typing");
  await load(JOBS_STORY);
  await openMenu();
  const menuWidth = () =>
    js(`(() => {
      const card = document.querySelector('[class*="filtersMenu"]')?.firstElementChild;
      return card == null ? null : Math.round(card.getBoundingClientRect().width);
    })()`);
  const opened = await menuWidth();
  report(opened === MENU_WIDTH, `opens at ${opened}px`, opened === MENU_WIDTH ? "" : `expected ${MENU_WIDTH}`);
  const seen = [opened];
  for (const q of ["t", "ty", "typ", "type"]) {
    await typeInto(`document.querySelector('[class*="filtersMenu"] input')`, q);
    seen.push(await menuWidth());
  }
  report(new Set(seen).size === 1, "width while typing", JSON.stringify(seen));
  // and the no-match state
  await typeInto(`document.querySelector('[class*="filtersMenu"] input')`, "zzzz");
  const empty = await js(`(() => {
    const card = document.querySelector('[class*="filtersMenu"]')?.firstElementChild;
    return card == null ? "" : card.textContent.replace(/\\s+/g, " ").trim();
  })()`);
  report(String(empty).includes("No matches"), "no-match state", JSON.stringify(empty));
}

// ---- estimates: the seven shared filters, and they filter ------------------
if (run("estimates")) {
  console.log("\nestimates — its filters, and they apply");
  await load(ESTIMATES_STORY);
  const before = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await openMenu();
  const rows = JSON.parse(await menuRows());
  report(
    JSON.stringify(rows) === JSON.stringify(ESTIMATE_FILTERS),
    "menu lists them all",
    JSON.stringify(rows),
  );
  await hoverRow("Client");
  await js(`(() => {
    const rows = [...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')];
    const row = rows.find(r => r.textContent.trim() === "Wildwood Kitchen");
    if (row) row.click();
    return 1;
  })()`);
  await sleep(800);
  const after = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(after > 0 && after < before, `Client = Wildwood Kitchen`, `${before} → ${after} rows`);

  // Down payment — the estimates' own multi-select (node 14293-45032): four
  // rows in the node's order, at the 208px floor, and it filters.
  await load(ESTIMATES_STORY);
  const dpBefore = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await openMenu();
  await hoverRow("Down payment");
  const dpList = JSON.parse(await subList());
  const dpRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .map(r => r.textContent.trim()).filter(t => t && t.length < 24))`),
  );
  report(
    JSON.stringify(dpRows) === JSON.stringify(["Not required", "Paid", "Partially paid", "Not paid"]),
    "Down payment rows",
    JSON.stringify(dpRows),
  );
  report(dpList.width === MENU_WIDTH, "Down payment list width", `${dpList.width}px`);
  await js(`(() => {
    const rows = [...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')];
    const row = rows.find(r => r.textContent.trim() === "Partially paid");
    if (row) row.click();
    return 1;
  })()`);
  await sleep(800);
  const dpAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(dpAfter > 0 && dpAfter < dpBefore, "Down payment = Partially paid", `${dpBefore} → ${dpAfter} rows`);

  // A chip's CONDITION list must actually apply — the amount kinds wrote their
  // condition to a dead key once (2026-09-12, the `duration` → `amount` rename;
  // TypeScript could not see it because the writer returns a generic). Money
  // stands in for both amount kinds here.
  await load(ESTIMATES_STORY);
  await openMenu();
  await hoverRow("Total");
  await clickSubRow("$1,000");
  const atLeastRows = await js(`Math.max(0, document.querySelectorAll('[role="row"]').length - 1)`);
  await js(`(() => {
    const box = [...document.querySelectorAll('[class*="_box_"]')].find(b => b.textContent.trim() === "at least");
    if (box) box.click();
    return 1;
  })()`);
  await sleep(600);
  await js(`(() => {
    const row = [...document.querySelectorAll('[class*="_item_"]')].find(r => r.textContent.trim() === "at most");
    if (row) row.click();
    return 1;
  })()`);
  await sleep(800);
  const atMostRows = await js(`Math.max(0, document.querySelectorAll('[role="row"]').length - 1)`);
  const chipCondition = await js(
    `[...document.querySelectorAll('[class*="_box_"]')].map(b => b.textContent.trim()).join(" ")`,
  );
  report(
    atMostRows !== atLeastRows && /at most/.test(chipCondition),
    "Total chip: at least → at most applies",
    `${atLeastRows} → ${atMostRows} rows, chip "${chipCondition}"`,
  );

  // The three built on 2026-09-12: Expires (forward windows, no condition
  // header), Issued (the shared past presets) and Total (the MONEY kind).
  for (const [filter, rows, pick] of [
    ["Expires", ["Expired", "Today", "Tomorrow", "Next 3 days", "Next 7 days", "Next 14 days", "Next 30 days"], "Expired"],
    ["Issued", ["1 day ago", "3 days ago", "1 week ago", "1 month ago", "3 months ago", "6 months ago", "1 year ago"], "1 month ago"],
    ["Total", ["$100", "$250", "$500", "$1,000", "$1,500", "$2,500", "$5,000", "$10,000"], "$1,000"],
    ["Seen", ["Seen", "Not seen"], "Not seen"],
  ]) {
    await load(ESTIMATES_STORY);
    const before = await js(`document.querySelectorAll('[role="row"]').length - 1`);
    await openMenu();
    await hoverRow(filter);
    const listed = JSON.parse(
      await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
          .map(r => r.textContent.trim()).filter(t => t && t.length < 24))`),
    );
    report(
      rows.every((row) => listed.includes(row)),
      `${filter} rows`,
      JSON.stringify(listed),
    );
    await js(`(() => {
      const items = [...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')];
      const row = items.find(r => r.textContent.trim() === ${JSON.stringify(pick)});
      if (row) row.click();
      return 1;
    })()`);
    await sleep(800);
    const after = await js(`document.querySelectorAll('[role="row"]').length - 1`);
    report(after >= 0 && after < before, `${filter} = ${pick}`, `${before} → ${after} rows`);
  }
}

// ---- invoices: its thirteen filters, and they apply -------------------------
if (run("invoices")) {
  console.log("\ninvoices — its filters, and they apply");
  await load(INVOICES_STORY);
  await openMenu();
  const rows = JSON.parse(await menuRows());
  report(
    JSON.stringify(rows) === JSON.stringify(INVOICE_FILTERS),
    "menu lists them all",
    JSON.stringify(rows),
  );

  // Status — the invoices' own (node 14320-63153): the open phase's four
  // badge statuses, Overdue included (the derived one), and it applies.
  await hoverRow("Status");
  const statusRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .map(r => r.textContent.trim()).filter(t => t && t.length < 24))`),
  );
  report(
    JSON.stringify(statusRows) === JSON.stringify(["Draft", "Unsent", "Outstanding", "Overdue"]),
    "Status rows (open)",
    JSON.stringify(statusRows),
  );
  const stBefore = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await clickSubRow("Overdue");
  const stAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(stAfter > 0 && stAfter < stBefore, "Status = Overdue", `${stBefore} → ${stAfter} rows`);

  // Due date — the shared FORWARD-window template (node 14320-66655):
  // "Overdue" first (the past row, added to the node 2026-09-14), the six
  // future windows, NO absence row — over "Custom...", and it applies.
  await load(INVOICES_STORY);
  const ddBefore = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await openMenu();
  await hoverRow("Due date");
  const ddRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .map(r => r.textContent.trim()).filter(t => t && t.length < 24))`),
  );
  report(
    JSON.stringify(ddRows.filter((r) => !r.startsWith("Custom"))) ===
      JSON.stringify(["Overdue", "Today", "Tomorrow", "Next 3 days", "Next 7 days", "Next 14 days", "Next 30 days"]),
    "Due date rows (Overdue first, no absence)",
    JSON.stringify(ddRows),
  );
  // The "Overdue" WINDOW is a DATE question, not the status: it lists every
  // open invoice whose `dueAt` has passed, stale Pending ones included —
  // production's own `is_overdue` annotation (date-only), and exactly how the
  // estimates' "Expired" row relates to the Expired status. With the current
  // data: 10 = the 9 the Overdue STATUS holds + 1 pending row whose date ran
  // out before it was sent.
  await clickSubRow("Overdue");
  const ddOverdue = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(ddOverdue === 10, "Due date = Overdue (the window ⊇ the status slice)", `${ddBefore} → ${ddOverdue} rows`);
  await load(INVOICES_STORY);
  await openMenu();
  await hoverRow("Due date");
  await clickSubRow("Next 30 days");
  const ddAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(ddAfter > 0 && ddAfter < ddBefore, "Due date = Next 30 days", `${ddBefore} → ${ddAfter} rows`);
  // A WINDOW value is a complete answer — its chip renders without the
  // condition box (the section's own annotation).
  const ddChip = await js(
    `[...document.querySelectorAll('[class*="_box_"]')].map(b => b.textContent.trim()).join("|")`,
  );
  report(
    /Due date/.test(ddChip) && /Next 30 days/.test(ddChip) && !/after|before|within/.test(ddChip),
    "Due date chip has no condition box",
    JSON.stringify(ddChip),
  );

  // Amount due — the third AMOUNT filter (node 14787-82892): the money
  // presets, and it applies over `total − amountPaid`.
  await load(INVOICES_STORY);
  const adBefore = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await openMenu();
  await hoverRow("Amount due");
  const adRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .map(r => r.textContent.trim()).filter(t => t && t.length < 24))`),
  );
  report(
    ["$100", "$250", "$500", "$1,000", "$1,500", "$2,500", "$5,000", "$10,000"].every((row) => adRows.includes(row)),
    "Amount due rows",
    JSON.stringify(adRows),
  );
  await clickSubRow("$1,000");
  const adAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(adAfter > 0 && adAfter < adBefore, "Amount due at least $1,000", `${adBefore} → ${adAfter} rows`);

  // A locked view: Pending's fixed Status chip (the Views section's
  // annotation — "'Draft' and 'Unsent' are selected").
  await load(INVOICES_STORY);
  await js(`[...document.querySelectorAll('[class*="viewBar"] [role="tab"]')].find(t => t.textContent.trim() === "Pending")?.click()`);
  await sleep(700);
  const lockedChip = await js(
    `[...document.querySelectorAll('[class*="_box_"]')].map(b => b.textContent.trim()).join("|")`,
  );
  report(
    /Status/.test(lockedChip) && /is any of/.test(lockedChip) && /2 statuses/.test(lockedChip),
    "Pending locks Status [Draft, Unsent]",
    JSON.stringify(lockedChip),
  );
}

// ---- credit notes: its filters, and they apply ------------------------------
if (run("creditnotes")) {
  console.log("\ncredit notes — its filters, and they apply");
  await load(CREDIT_NOTES_STORY);
  await openMenu();
  const rows = JSON.parse(await menuRows());
  report(
    JSON.stringify(rows) === JSON.stringify(CREDIT_NOTE_FILTERS_OPEN),
    "open menu — six rows, no Type",
    JSON.stringify(rows),
  );

  // Status — the list's own (node 14759-68590): the open phase's two badge
  // statuses, and it applies.
  await hoverRow("Status");
  // The `/_item_/` class filter (clickSubRow's own): with only two short rows
  // the plain `[class*="item"]` selector also catches the group wrapper,
  // whose text is the rows' concatenation.
  const statusRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()).filter(t => t && t.length < 24))`),
  );
  report(
    JSON.stringify(statusRows) === JSON.stringify(["Draft", "Unsent"]),
    "Status rows (open)",
    JSON.stringify(statusRows),
  );
  const stBefore = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await clickSubRow("Unsent");
  const stAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(stAfter > 0 && stAfter < stBefore, "Status = Unsent", `${stBefore} → ${stAfter} rows`);

  // Type — the list's second own filter (node 14759-71943), CLOSED phase
  // only since 2026-09-14: the three production types in the design's
  // casing, bare multi-select rows at the 208 floor.
  await load(CREDIT_NOTES_STORY);
  await js(`[...document.querySelectorAll('[class*="topBar"] [role="tab"]')].find(t => t.textContent.trim() === "Closed")?.click()`);
  await sleep(700);
  const tpBefore = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await openMenu();
  const closedRows = JSON.parse(await menuRows());
  report(
    JSON.stringify(closedRows) === JSON.stringify(CREDIT_NOTE_FILTERS_CLOSED),
    "closed menu — Type as the seventh row",
    JSON.stringify(closedRows),
  );
  await hoverRow("Type");
  const typeRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .map(r => r.textContent.trim()).filter(t => t && t.length < 24))`),
  );
  report(
    JSON.stringify(typeRows) === JSON.stringify(["Pre-payment", "Post-payment", "Mixed"]),
    "Type rows",
    JSON.stringify(typeRows),
  );
  const tpList = JSON.parse(await subList());
  report(tpList.width === MENU_WIDTH, "Type list width", `${tpList.width}px`);
  await clickSubRow("Pre-payment");
  const tpAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(tpAfter > 0 && tpAfter < tpBefore, "Type = Pre-payment (closed)", `${tpBefore} → ${tpAfter} rows`);

  // A locked view: Issued's fixed Status chip. (The Pending view is GONE —
  // Daniel, 2026-09-14: the open branch IS draft + unsent, so Pending listed
  // exactly what All did. The open phase holds one "All" view now.)
  await load(CREDIT_NOTES_STORY);
  const openViews = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="viewBar"] [role="tab"]')].map(t => t.textContent.trim()))`),
  );
  report(JSON.stringify(openViews) === JSON.stringify(["All"]), "open phase has only the All view", JSON.stringify(openViews));
  await js(`[...document.querySelectorAll('[class*="topBar"] [role="tab"]')].find(t => t.textContent.trim() === "Closed")?.click()`);
  await sleep(700);
  await js(`[...document.querySelectorAll('[class*="viewBar"] [role="tab"]')].find(t => t.textContent.trim() === "Issued")?.click()`);
  await sleep(700);
  const lockedChip = await js(
    `[...document.querySelectorAll('[class*="_box_"]')].map(b => b.textContent.trim()).join("|")`,
  );
  report(
    /Status/.test(lockedChip) && /Issued/.test(lockedChip),
    "Issued locks Status [Issued]",
    JSON.stringify(lockedChip),
  );
}

// ---- bills: its filters, and they apply --------------------------------------
if (run("bills")) {
  console.log("\nbills — its filters, and they apply");
  await load(BILLS_STORY);
  await openMenu();
  const rows = JSON.parse(await menuRows());
  report(
    JSON.stringify(rows) === JSON.stringify(BILL_FILTERS_OPEN),
    "open menu — eight rows, no Status changed",
    JSON.stringify(rows),
  );

  // Status — the list's own (node 14817-83584): the open phase's three badge
  // statuses (no Unsent — Daniel, 2026-09-15), and it applies on the DERIVED
  // Overdue.
  await hoverRow("Status");
  const statusRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()).filter(t => t && t.length < 24))`),
  );
  report(
    JSON.stringify(statusRows) === JSON.stringify(["Draft", "Outstanding", "Overdue"]),
    "Status rows (open)",
    JSON.stringify(statusRows),
  );
  const stBefore = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await clickSubRow("Overdue");
  const stAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(stAfter > 0 && stAfter < stBefore, "Status = Overdue (derived)", `${stBefore} → ${stAfter} rows`);

  // Billing vendor — the list's second own filter (node 14817-88125): a
  // Client-shaped multi-select with a "Vendor..." search over the ten VENDORS
  // rows, and it applies.
  await load(BILLS_STORY);
  const vnBefore = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await openMenu();
  await hoverRow("Billing vendor");
  const vendorRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()).filter(t => t && t.length < 40))`),
  );
  report(
    // Twelve since 2026-09-15 — the Vendors list brought two more inactive
    // vendors, and the all-vendors rule lists them here too.
    vendorRows.length === 12 && vendorRows[0] === "Alameda Welding & Fabrication",
    "Billing vendor rows (twelve, A to Z)",
    JSON.stringify(vendorRows),
  );
  await clickSubRow("Pacific Refrigeration Parts");
  const vnAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(vnAfter > 0 && vnAfter < vnBefore, "Billing vendor = Pacific Refrigeration Parts", `${vnBefore} → ${vnAfter} rows`);

  // The CLOSED menu adds Status changed in its alphabetical slot — the
  // column-and-filter phase rule (Daniel, 2026-09-15).
  await load(BILLS_STORY);
  await js(`[...document.querySelectorAll('[class*="topBar"] [role="tab"]')].find(t => t.textContent.trim() === "Closed")?.click()`);
  await sleep(700);
  await openMenu();
  const closedRows = JSON.parse(await menuRows());
  report(
    JSON.stringify(closedRows) === JSON.stringify(BILL_FILTERS_CLOSED),
    "closed menu — Status changed between Status and Total",
    JSON.stringify(closedRows),
  );

  // A locked view: the DRAFT view (renamed from production's "Pending" —
  // Daniel, 2026-09-15: one status, so the status names the tab) locks
  // Draft alone — no Unsent anywhere.
  await load(BILLS_STORY);
  const openViews = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="viewBar"] [role="tab"]')].map(t => t.textContent.trim()))`),
  );
  report(
    JSON.stringify(openViews) === JSON.stringify(["All", "Draft", "Outstanding", "Overdue"]),
    "open views — Draft, not Pending",
    JSON.stringify(openViews),
  );
  await js(`[...document.querySelectorAll('[class*="viewBar"] [role="tab"]')].find(t => t.textContent.trim() === "Draft")?.click()`);
  await sleep(700);
  const lockedChip = await js(
    `[...document.querySelectorAll('[class*="_box_"]')].map(b => b.textContent.trim()).join("|")`,
  );
  report(
    /Status/.test(lockedChip) && /Draft/.test(lockedChip) && !/Unsent/.test(lockedChip),
    "Draft locks Status [Draft] alone",
    JSON.stringify(lockedChip),
  );
}

// ---- pos: its fourteen filters, and they apply -------------------------------
if (run("pos")) {
  console.log("\npos — its filters, and they apply");
  await load(POS_STORY);
  await openMenu();
  const rows = JSON.parse(await menuRows());
  report(
    JSON.stringify(rows) === JSON.stringify(PO_FILTERS_MENU),
    "menu lists all sixteen",
    JSON.stringify(rows),
  );

  // Status — the list's own (node 14817-91233): the open phase's seven
  // display statuses, production's relabeling included (Unstocked / Unpaid),
  // and it applies on the stored status.
  await hoverRow("Status");
  const statusRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()).filter(t => t && t.length < 24))`),
  );
  report(
    JSON.stringify(statusRows) ===
      JSON.stringify(["Draft", "Unsent", "Sent", "Acknowledged", "In transit", "Unstocked", "Unpaid"]),
    "Status rows (open)",
    JSON.stringify(statusRows),
  );
  const stBefore = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await clickSubRow("Sent");
  const stAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(stAfter > 0 && stAfter < stBefore, "Status = Sent applies", `${stBefore} → ${stAfter} rows`);

  // Shipping carrier — ALL presets + the customs in use, "No carrier"
  // leading (the section's annotation), and it applies.
  await load(POS_STORY);
  const shBefore = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await openMenu();
  await hoverRow("Shipping carrier");
  const carrierRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()).filter(t => t && t.length < 40))`),
  );
  report(
    carrierRows[0] === "No carrier" &&
      carrierRows.includes("FedEx") &&
      carrierRows.includes("Sendle") &&
      carrierRows.includes("Local courier") &&
      carrierRows.includes("Presidio van") &&
      carrierRows.length === 22,
    "Shipping carrier rows — all 19 presets + 2 customs under No carrier",
    JSON.stringify(carrierRows),
  );
  await clickSubRow("No carrier");
  const shAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(shAfter > 0 && shAfter < shBefore, "Shipping carrier = No carrier applies", `${shBefore} → ${shAfter} rows`);

  // Shipping method — the same shape over the four presets + customs.
  await load(POS_STORY);
  const smBefore = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await openMenu();
  await hoverRow("Shipping method");
  const methodRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()).filter(t => t && t.length < 40))`),
  );
  report(
    JSON.stringify(methodRows) ===
      JSON.stringify(["No method", "2 Day Air", "Ground", "Next Day Air", "Next Day Early AM", "Same day"]),
    "Shipping method rows — 4 presets + the custom, A to Z",
    JSON.stringify(methodRows),
  );
  await clickSubRow("Ground");
  const smAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(smAfter > 0 && smAfter < smBefore, "Shipping method = Ground applies", `${smBefore} → ${smAfter} rows`);

  // Est. arrival — the forward-window Timeframe (section 14951-37533): "No
  // arrival date" over "Late" over the shared future windows; a window pick
  // applies and its chip has no condition box.
  await load(POS_STORY);
  const eaBefore = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await openMenu();
  await hoverRow("Est. arrival");
  const eaRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()))`),
  );
  report(
    JSON.stringify(eaRows) ===
      JSON.stringify([
        "No arrival date",
        "Late",
        "Today",
        "Tomorrow",
        "Next 3 days",
        "Next 7 days",
        "Next 14 days",
        "Next 30 days",
        "Custom...",
      ]),
    "Est. arrival rows",
    JSON.stringify(eaRows),
  );
  await clickSubRow("Late");
  const eaAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(eaAfter > 0 && eaAfter < eaBefore, "Est. arrival = Late applies", `${eaBefore} → ${eaAfter} rows`);
  const eaChip = await js(
    `[...document.querySelectorAll('[class*="_box_"]')].map(b => b.textContent.trim()).join("|")`,
  );
  report(
    /Est. arrival/.test(eaChip) && /Late/.test(eaChip) && !/after|before/.test(eaChip),
    "Late chip has no condition box",
    JSON.stringify(eaChip),
  );

  // Payment terms — the vendors' values in use, led by "No terms" (the
  // template's renamed absence row, 2026-09-15)
  // (node 14944-4762), worded like the column, and it applies.
  await load(POS_STORY);
  const ptBefore = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await openMenu();
  await hoverRow("Payment terms");
  const termRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()).filter(t => t && t.length < 24))`),
  );
  report(
    JSON.stringify(termRows) ===
      JSON.stringify(["No terms", "Same Day", "Net 15", "Net 30", "Net 45", "Net 60"]),
    "Payment terms rows (values in use)",
    JSON.stringify(termRows),
  );
  await clickSubRow("Net 30");
  const ptAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(ptAfter > 0 && ptAfter < ptBefore, "Payment terms = Net 30 applies", `${ptBefore} → ${ptAfter} rows`);

  // Associated jobs — presence, not identity (node 14944-6209): two rows,
  // single-select, NO conditions — the chip renders without a condition box.
  await load(POS_STORY);
  const ajBefore = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await openMenu();
  await hoverRow("Associated jobs");
  const ajRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()).filter(t => t && t.length < 24))`),
  );
  report(JSON.stringify(ajRows) === JSON.stringify(["None", "Has any"]), "Associated jobs rows", JSON.stringify(ajRows));
  await clickSubRow("None");
  const ajAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(ajAfter > 0 && ajAfter < ajBefore, "Associated jobs = None applies", `${ajBefore} → ${ajAfter} rows`);
  const ajChip = await js(
    `[...document.querySelectorAll('[class*="_box_"]')].map(b => b.textContent.trim()).join("|")`,
  );
  report(
    /Associated jobs/.test(ajChip) && /None/.test(ajChip) && !/\|is\|/.test(ajChip),
    "Associated chip has no condition box",
    JSON.stringify(ajChip),
  );

  // Items — the COUNT kind over the line-item count (node 14854-31182): the
  // shared None + ladder, and it applies.
  await load(POS_STORY);
  const itBefore = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await openMenu();
  await hoverRow("Items");
  const itemRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()))`),
  );
  report(
    JSON.stringify(itemRows.filter((r) => !r.startsWith("Custom"))) ===
      JSON.stringify(["None", "1", "2", "5", "10", "20", "50"]),
    "Items rows (None over the 1 → 50 ladder)",
    JSON.stringify(itemRows),
  );
  await clickSubRow("5");
  const itAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(itAfter > 0 && itAfter < itBefore, "Items at least 5", `${itBefore} → ${itAfter} rows`);

  // The views — production's nine tabs (node 14817-88570), and a locked
  // single-status view wears the RELABELED badge: Delivered locks Unstocked.
  await load(POS_STORY);
  const openViews = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="viewBar"] [role="tab"]')].map(t => t.textContent.trim()))`),
  );
  report(
    JSON.stringify(openViews) === JSON.stringify(["All", "Pending", "Open", "In transit", "Delivered", "Stocked"]),
    "open views",
    JSON.stringify(openViews),
  );
  await js(`[...document.querySelectorAll('[class*="viewBar"] [role="tab"]')].find(t => t.textContent.trim() === "Delivered")?.click()`);
  await sleep(700);
  const lockedChip = await js(
    `[...document.querySelectorAll('[class*="_box_"]')].map(b => b.textContent.trim()).join("|")`,
  );
  report(
    /Status/.test(lockedChip) && /Unstocked/.test(lockedChip),
    "Delivered locks Status [Unstocked]",
    JSON.stringify(lockedChip),
  );

  // The keyword search matches the ASSOCIATED ids — the deliberate
  // deviation from production's `keywords` (the identity half of the
  // Associated question; the filters stay presence-only).
  await load(POS_STORY);
  const allRows = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await js(`[...document.querySelectorAll('[class*="viewBar"] button')].find(b => /Search/.test(b.textContent))?.click()`);
  await sleep(300);
  await typeInto(`document.querySelector('[class*="viewBar"] input')`, "JOB-1201");
  await sleep(700);
  const found = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(found > 0 && found < allRows, "search finds associated JOB-1201", `${allRows} → ${found} rows`);

  // The CLOSED menu is the SAME fourteen — Status changed is on BOTH phases
  // (Daniel, 2026-09-15), unlike Bills.
  await load(POS_STORY);
  await js(`[...document.querySelectorAll('[class*="topBar"] [role="tab"]')].find(t => t.textContent.trim() === "Closed")?.click()`);
  await sleep(700);
  await openMenu();
  const closedRows = JSON.parse(await menuRows());
  report(
    JSON.stringify(closedRows) === JSON.stringify(PO_FILTERS_MENU),
    "closed menu — the same sixteen (Status changed on both phases)",
    JSON.stringify(closedRows),
  );
}

// ---- series: nine filters, the count kind, the derived phase ----------------
if (run("series")) {
  console.log("\nseries — its filters, and they apply");
  await load(SERIES_STORY);
  await openMenu();
  const rows = JSON.parse(await menuRows());
  report(
    JSON.stringify(rows) === JSON.stringify(SERIES_FILTERS),
    "menu lists all ten",
    JSON.stringify(rows),
  );

  // Open jobs — the first COUNT filter (node 14767-79379): the six number
  // presets over "Custom...", and it applies over `openJobsCount`.
  const ojBefore = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await hoverRow("Open jobs");
  const ojRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()))`),
  );
  report(
    JSON.stringify(ojRows.filter((r) => !r.startsWith("Custom"))) ===
      JSON.stringify(["None", "1", "2", "5", "10", "20", "50"]),
    "Open jobs rows (None over the 1 → 50 ladder)",
    JSON.stringify(ojRows),
  );
  await clickSubRow("5");
  const ojAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(ojAfter > 0 && ojAfter < ojBefore, "Open jobs at least 5", `${ojBefore} → ${ojAfter} rows`);

  // "None" — the COMPLETE row: exactly zero open jobs, the condition does
  // not apply, and its chip renders without the condition box (the window
  // rule on the amount kinds).
  await load(SERIES_STORY);
  await openMenu();
  await hoverRow("Open jobs");
  await clickSubRow("None");
  const ojNone = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(ojNone === 4, "Open jobs = None (exactly zero)", `${ojBefore} → ${ojNone} rows`);
  const ojChip = await js(
    `[...document.querySelectorAll('[class*="_box_"]')].map(b => b.textContent.trim()).join("|")`,
  );
  report(
    /Open jobs/.test(ojChip) && /None/.test(ojChip) && !/at least|at most/.test(ojChip),
    "None chip has no condition box",
    JSON.stringify(ojChip),
  );

  // Type — single-select Upfront / Rolling (node 14759-74546), and it applies.
  await load(SERIES_STORY);
  const tpBefore = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await openMenu();
  await hoverRow("Type");
  const typeRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()))`),
  );
  report(
    JSON.stringify(typeRows) === JSON.stringify(["Upfront", "Rolling"]),
    "Type rows",
    JSON.stringify(typeRows),
  );
  await clickSubRow("Upfront");
  const tpAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(tpAfter > 0 && tpAfter < tpBefore, "Type = Upfront", `${tpBefore} → ${tpAfter} rows`);

  // Recurrence — the frequency multi-select (node 14831-29459), and it
  // applies.
  await load(SERIES_STORY);
  const rcBefore = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await openMenu();
  await hoverRow("Recurrence");
  const rcRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()))`),
  );
  report(
    JSON.stringify(rcRows) === JSON.stringify(["Daily", "Weekly", "Monthly", "Yearly"]),
    "Recurrence rows",
    JSON.stringify(rcRows),
  );
  await clickSubRow("Weekly");
  const rcAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(rcAfter > 0 && rcAfter < rcBefore, "Recurrence = Weekly", `${rcBefore} → ${rcAfter} rows`);

  // Series end — forward windows led by the ABSENCE row (node 14831-30000):
  // "No end date" lists the open-ended (rolling) series, and a window chip
  // carries no condition box.
  await load(SERIES_STORY);
  const seBefore = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await openMenu();
  await hoverRow("Series end");
  const seRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()))`),
  );
  report(
    JSON.stringify(seRows.filter((r) => !r.startsWith("Custom"))) ===
      JSON.stringify(["No end date", "Today", "Tomorrow", "Next 3 days", "Next 7 days", "Next 14 days", "Next 30 days"]),
    "Series end rows (No end date first, no past row)",
    JSON.stringify(seRows),
  );
  await clickSubRow("No end date");
  const seAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(seAfter === 11, "Series end = No end date (the open-ended series)", `${seBefore} → ${seAfter} rows`);
  const seChip = await js(
    `[...document.querySelectorAll('[class*="_box_"]')].map(b => b.textContent.trim()).join("|")`,
  );
  report(
    /Series end/.test(seChip) && /No end date/.test(seChip) && !/after|before|within/.test(seChip),
    "Series end chip has no condition box",
    JSON.stringify(seChip),
  );

  // The DERIVED phase: closed = the end has passed (production is_closed).
  await load(SERIES_STORY);
  const openCount = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await js(`[...document.querySelectorAll('[class*="topBar"] [role="tab"]')].find(t => t.textContent.trim() === "Closed")?.click()`);
  await sleep(700);
  const closedCount = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(openCount === 18 && closedCount === 6, "derived phases (18 open / 6 closed)", `${openCount} open, ${closedCount} closed`);
}

// ---- vendors: its filters, and they apply ------------------------------------
// The expected row counts are hand-derived from the db literals (see
// vendorsData's formulas): 9 active / 3 inactive vendors; Bayview and
// Peninsula bill via someone; per-vendor aggregates as of seed 20260917.
if (run("vendors")) {
  console.log("\nvendors — its filters, and they apply");
  await load(VENDORS_STORY);
  await openMenu();
  const rows = JSON.parse(await menuRows());
  report(
    JSON.stringify(rows) === JSON.stringify(VENDOR_FILTERS_MENU),
    "menu lists all nine",
    JSON.stringify(rows),
  );

  // Bills via — "Same vendor" leads (the absence row: production's null
  // default_billing_vendor), then EVERY vendor A to Z, deactivated included
  // (node 14963-43879).
  await hoverRow("Bills via");
  const bvRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()).filter(t => t && t.length < 40))`),
  );
  report(
    bvRows.length === 13 && bvRows[0] === "Same vendor" && bvRows[1] === "Alameda Welding & Fabrication",
    "Bills via rows (Same vendor over twelve vendors)",
    JSON.stringify(bvRows),
  );
  await clickSubRow("Same vendor");
  const bvAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(bvAfter === 7, "Bills via = Same vendor (7 of 9 bill directly)", `9 → ${bvAfter} rows`);

  // Current POs — the COUNT kind over the derived count (the five open
  // statuses). Only Sequoia holds five current orders.
  await load(VENDORS_STORY);
  await openMenu();
  await hoverRow("Current POs");
  const cpRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()))`),
  );
  report(
    // The list's OWN ladder — node 14947-34881, updated 2026-09-15: denser
    // low steps, no 50 (a vendor holds a handful of open orders).
    JSON.stringify(cpRows.filter((r) => !r.startsWith("Custom"))) ===
      JSON.stringify(["None", "1", "2", "3", "4", "5", "10", "15", "20"]),
    "Current POs rows (the list's own denser ladder)",
    JSON.stringify(cpRows),
  );
  await clickSubRow("5");
  const cpAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(cpAfter === 1, "Current POs at least 5 (Sequoia alone)", `9 → ${cpAfter} rows`);

  // Commitments — the MONEY kind over Daniel's five-status sum (NOT
  // production's sent/delivered/stocked set). Five vendors sit at or above
  // $2,500.
  await load(VENDORS_STORY);
  await openMenu();
  await hoverRow("Commitments");
  const cmRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()))`),
  );
  report(
    JSON.stringify(cmRows.filter((r) => !r.startsWith("Custom"))) ===
      JSON.stringify(["$100", "$250", "$500", "$1,000", "$1,500", "$2,500", "$5,000", "$10,000"]),
    "Commitments rows (the eight money presets)",
    JSON.stringify(cmRows),
  );
  await clickSubRow("$2,500");
  const cmAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(cmAfter === 5, "Commitments at least $2,500 (the five-status sum)", `9 → ${cmAfter} rows`);

  // Payables — the other derived money: outstanding bills where the vendor
  // is the BILLING vendor. Seven of the nine sit at or above $1,000
  // (Embarcadero holds $125, Golden Gate nothing).
  await load(VENDORS_STORY);
  await openMenu();
  await hoverRow("Payables");
  await clickSubRow("$1,000");
  const pyAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(pyAfter === 7, "Payables at least $1,000", `9 → ${pyAfter} rows`);

  // Payment terms — the vendor's OWN value here (no linked vendor to read):
  // the values in use over the "No terms" lead, and the absence row
  // finds Mission Electric alone on the active phase.
  await load(VENDORS_STORY);
  await openMenu();
  await hoverRow("Payment terms");
  const vtRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()).filter(t => t && t.length < 24))`),
  );
  report(
    JSON.stringify(vtRows) ===
      JSON.stringify(["No terms", "Same Day", "Net 15", "Net 30", "Net 45", "Net 60"]),
    "Payment terms rows (values in use)",
    JSON.stringify(vtRows),
  );
  await clickSubRow("No terms");
  const vtAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(vtAfter === 1, "Payment terms = No terms (Mission Electric)", `9 → ${vtAfter} rows`);

  // The phases — the one `isActive` flag: 9 active / 3 inactive, one "All"
  // view each (the Figma Views section 14831-30343).
  await load(VENDORS_STORY);
  const activeCount = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  const activeViews = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="viewBar"] [role="tab"]')].map(t => t.textContent.trim()))`),
  );
  await js(`[...document.querySelectorAll('[class*="topBar"] [role="tab"]')].find(t => t.textContent.trim() === "Inactive")?.click()`);
  await sleep(700);
  const inactiveCount = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(
    activeCount === 9 && inactiveCount === 3 && JSON.stringify(activeViews) === JSON.stringify(["All"]),
    "phases (9 active / 3 inactive, one All view)",
    `${activeCount} active, ${inactiveCount} inactive, views ${JSON.stringify(activeViews)}`,
  );
}

// ---- clients: its filters, and they apply ------------------------------------
// The expected row counts are hand-derived from the db literals (see
// clientsData's formulas): 11 active / 3 inactive clients; Ferry and Marisol
// carry no industry; Ferry and North Point bill themselves; Marisol has no
// location; Mission alone has no payment-terms default on the active phase.
if (run("clients")) {
  console.log("\nclients — its filters, and they apply");
  await load(CLIENTS_STORY);
  await openMenu();
  const rows = JSON.parse(await menuRows());
  const CLIENT_FILTERS_MENU = [
    "Available invoice credit",
    "Billing address",
    "Bills to",
    "Created at",
    "Credit limit",
    "Default estimate expiration",
    "Default payment terms",
    "Default tax rate",
    "Industry",
    "Labels",
    "Last modified",
    "Locations",
    "Outstanding balance",
    "Type",
  ];
  report(
    JSON.stringify(rows) === JSON.stringify(CLIENT_FILTERS_MENU),
    "menu lists all fourteen",
    JSON.stringify(rows),
  );

  // Type — single-select Business / Individual (the Jobs Type arrangement).
  await hoverRow("Type");
  await clickSubRow("Individual");
  const tyAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(tyAfter === 2, "Type is Individual (Ferry + Marisol)", `11 → ${tyAfter} rows`);

  // Industry — multi-select over the FIXED enum, "No industry" leading (the
  // field is optional in production).
  await load(CLIENTS_STORY);
  await openMenu();
  await hoverRow("Industry");
  const inRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()).filter(t => t && t.length < 24))`),
  );
  report(
    JSON.stringify(inRows) ===
      JSON.stringify(["No industry", "Commercial", "Government", "Industrial", "Residential"]),
    "Industry rows (No industry over the fixed four)",
    JSON.stringify(inRows),
  );
  await clickSubRow("No industry");
  const inAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(inAfter === 2, "Industry = No industry (Ferry + Marisol)", `11 → ${inAfter} rows`);

  // Bills to — "Same client" and "Location" lead (the intention's own two
  // values), then EVERY client A to Z, deactivated included (node
  // 14970-59620: "The list contains all the existing clients").
  await load(CLIENTS_STORY);
  await openMenu();
  await hoverRow("Bills to");
  const btRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()).filter(t => t && t.length < 40))`),
  );
  report(
    btRows.length === 16 &&
      btRows[0] === "Same client" &&
      btRows[1] === "Location" &&
      btRows[2] === "Anchor Line Seafood Co.",
    "Bills to rows (Same client · Location over fourteen clients)",
    JSON.stringify(btRows),
  );
  await clickSubRow("Same client");
  const btAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(btAfter === 2, "Bills to = Same client (Ferry + North Point)", `11 → ${btAfter} rows`);

  // Credit limit — the MONEY kind led by the first ABSENT row: "No credit
  // limit" lists the clients with NO limit configured (not a $0 limit).
  await load(CLIENTS_STORY);
  await openMenu();
  await hoverRow("Credit limit");
  const clRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()))`),
  );
  report(
    JSON.stringify(clRows.filter((r) => !r.startsWith("Custom"))) ===
      JSON.stringify(["No credit limit", "$100", "$250", "$500", "$1,000", "$1,500", "$2,500", "$5,000", "$10,000"]),
    "Credit limit rows (the absent row over the eight presets)",
    JSON.stringify(clRows),
  );
  await clickSubRow("No credit limit");
  const clAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(clAfter === 6, "Credit limit = No credit limit (six unlimited actives)", `11 → ${clAfter} rows`);

  // Available invoice credit — production's credit_balance, stored on the
  // client. Three actives hold $250 or more (North Point / Gateway / Anchor
  // Line).
  await load(CLIENTS_STORY);
  await openMenu();
  await hoverRow("Available invoice credit");
  await clickSubRow("$250");
  const acAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(acAfter === 3, "Available invoice credit at least $250", `11 → ${acAfter} rows`);

  // Outstanding balance — derived from the invoices the production
  // endpoint's way (status outstanding, total − paid, by location owner).
  // The four 2026-09-16 clients have no invoices at all; every original
  // active carries something outstanding.
  await load(CLIENTS_STORY);
  await openMenu();
  await hoverRow("Outstanding balance");
  await clickSubRow("No balance");
  const obAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(obAfter === 4, "Outstanding balance = No balance (the four new clients)", `11 → ${obAfter} rows`);

  // Locations — the COUNT kind over the location count, the Current POs
  // ladder; "None" finds the client with no site yet.
  await load(CLIENTS_STORY);
  await openMenu();
  await hoverRow("Locations");
  const loRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()))`),
  );
  report(
    JSON.stringify(loRows.filter((r) => !r.startsWith("Custom"))) ===
      JSON.stringify(["None", "1", "2", "3", "4", "5", "10", "15", "20"]),
    "Locations rows (None over the denser ladder)",
    JSON.stringify(loRows),
  );
  await clickSubRow("None");
  const loAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(loAfter === 1, "Locations = None (Marisol's Kitchen Truck)", `11 → ${loAfter} rows`);

  // Default payment terms — the CLIENTS-OWN section (15047-67829): the
  // values in use over the "No default" lead ("No terms" is the shared
  // template's word; on a client an empty field falls back to the company
  // default).
  await load(CLIENTS_STORY);
  await openMenu();
  await hoverRow("Default payment terms");
  const ptRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()).filter(t => t && t.length < 24))`),
  );
  report(
    JSON.stringify(ptRows) ===
      JSON.stringify(["No default", "Same Day", "Net 15", "Net 30", "Net 45", "Net 60"]),
    "Default payment terms rows (No default over the values in use)",
    JSON.stringify(ptRows),
  );
  await clickSubRow("No default");
  const ptAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(ptAfter === 1, "Default payment terms = No default (Mission Taqueria)", `11 → ${ptAfter} rows`);

  // Default estimate expiration — the same values-in-use shape, worded in
  // days.
  await load(CLIENTS_STORY);
  await openMenu();
  await hoverRow("Default estimate expiration");
  const eeRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()).filter(t => t && t.length < 24))`),
  );
  report(
    JSON.stringify(eeRows) === JSON.stringify(["No default", "7 days", "14 days", "30 days"]),
    "Default estimate expiration rows (values in use)",
    JSON.stringify(eeRows),
  );

  // Default tax rate — "No default" over every workspace rate A to Z; the
  // exempt rate finds the city-run grill on the active phase.
  await load(CLIENTS_STORY);
  await openMenu();
  await hoverRow("Default tax rate");
  await clickSubRow("Tax exempt");
  const trAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(trAfter === 1, "Default tax rate = Tax exempt (Civic Center Grill)", `11 → ${trAfter} rows`);

  // The phases — the one `isActive` flag: 11 active / 3 inactive, one "All"
  // view each (the Figma Views section 14947-35515).
  await load(CLIENTS_STORY);
  const activeCount = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  const activeViews = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="viewBar"] [role="tab"]')].map(t => t.textContent.trim()))`),
  );
  await js(`[...document.querySelectorAll('[class*="topBar"] [role="tab"]')].find(t => t.textContent.trim() === "Inactive")?.click()`);
  await sleep(700);
  const inactiveCount = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(
    activeCount === 11 && inactiveCount === 3 && JSON.stringify(activeViews) === JSON.stringify(["All"]),
    "phases (11 active / 3 inactive, one All view)",
    `${activeCount} active, ${inactiveCount} inactive, views ${JSON.stringify(activeViews)}`,
  );
}


// ---- labor: its filters, and they apply --------------------------------------
// The expected row counts are hand-derived from the db literals (LABOR_ITEMS):
// 35 active-phase rows (27 confirmed "active" + 8 review) / 5 inactive; 14
// actives carry no est. duration (6 catalog + all 8 review), 9 no subtype
// (2 catalog + 7 review), 15 are taxable, 17 hourly.
if (run("labor")) {
  console.log("\nlabor — its filters, and they apply");
  await load(LABOR_STORY);
  await openMenu();
  const rows = JSON.parse(await menuRows());
  const LABOR_FILTERS_ACTIVE = [
    "Cost",
    "Est. duration",
    "Labels",
    "Last modified",
    "Rate",
    "Status",
    "Subtype",
    "Taxability",
    "Unit type",
  ];
  report(
    JSON.stringify(rows) === JSON.stringify(LABOR_FILTERS_ACTIVE),
    "active menu — nine rows, Status between Rate and Subtype",
    JSON.stringify(rows),
  );

  // Status — SINGLE-select (the 2026-09-16 decision), the two circle-small
  // dot rows, and it applies.
  await hoverRow("Status");
  const statusRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()).filter(t => t && t.length < 24))`),
  );
  report(
    JSON.stringify(statusRows) === JSON.stringify(["Review", "Active"]),
    "Status rows (Review · Active)",
    JSON.stringify(statusRows),
  );
  await clickSubRow("Review");
  const stAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(stAfter === 8, "Status is Review (the minted inbox)", `35 → ${stAfter} rows`);

  // Est. duration — the list's OWN filter (15339:20649): the ABSENT "No est.
  // duration" over the four hour presets, and it applies.
  await load(LABOR_STORY);
  await openMenu();
  await hoverRow("Est. duration");
  const duRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()))`),
  );
  report(
    JSON.stringify(duRows.filter((r) => !r.startsWith("Custom"))) ===
      JSON.stringify(["No est. duration", "1 hour", "2 hours", "3 hours", "4 hours"]),
    "Est. duration rows (the absent row over the four presets)",
    JSON.stringify(duRows),
  );
  await clickSubRow("No est. duration");
  const duAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(duAfter === 14, "Est. duration = No est. duration", `35 → ${duAfter} rows`);

  // Subtype — multi-select with a search, "No subtype" leading.
  await load(LABOR_STORY);
  await openMenu();
  await hoverRow("Subtype");
  const subRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()).filter(t => t && t.length < 28))`),
  );
  report(
    JSON.stringify(subRows) ===
      JSON.stringify([
        "No subtype",
        "Cleaning & sanitation",
        "Diagnostics",
        "Emergency service",
        "Installation",
        "Preventive maintenance",
        "Repair",
      ]),
    "Subtype rows (No subtype over the six, A to Z)",
    JSON.stringify(subRows),
  );
  await clickSubRow("No subtype");
  const subAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(subAfter === 9, "Subtype = No subtype", `35 → ${subAfter} rows`);

  // Taxability + Unit type — the two single-selects, and they apply.
  await load(LABOR_STORY);
  await openMenu();
  await hoverRow("Taxability");
  await clickSubRow("Taxable");
  const txAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(txAfter === 15, "Taxability is Taxable", `35 → ${txAfter} rows`);
  await load(LABOR_STORY);
  await openMenu();
  await hoverRow("Unit type");
  await clickSubRow("Hourly");
  const utAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(utAfter === 17, "Unit type is Hourly", `35 → ${utAfter} rows`);

  // Rate + Cost — the two money filters over the shared ladder.
  await load(LABOR_STORY);
  await openMenu();
  await hoverRow("Rate");
  await clickSubRow("$250");
  const raAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(raAfter === 9, "Rate at least $250", `35 → ${raAfter} rows`);
  await load(LABOR_STORY);
  await openMenu();
  await hoverRow("Cost");
  await clickSubRow("$100");
  const coAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(coAfter === 2, "Cost at least $100 (hood cleaning + compressor)", `35 → ${coAfter} rows`);

  // The views and the phases: Active holds All · Review · Confirmed, the
  // Confirmed view's FIXED chip reads "Status is Active" (the tab named
  // "Confirmed", the status named "Active" — Daniel's decision); Inactive
  // holds one All of 5 rows and its menu has NO Status row.
  await load(LABOR_STORY);
  const activeCount = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  const activeViews = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="viewBar"] [role="tab"]')].map(t => t.textContent.trim()))`),
  );
  report(
    activeCount === 35 && JSON.stringify(activeViews) === JSON.stringify(["All", "Review", "Confirmed"]),
    "active phase (35 rows; All · Review · Confirmed)",
    `${activeCount} rows, views ${JSON.stringify(activeViews)}`,
  );
  await js(`[...document.querySelectorAll('[class*="viewBar"] [role="tab"]')].find(t => t.textContent.trim() === "Confirmed")?.click()`);
  await sleep(700);
  const lockedChip = await js(
    `[...document.querySelectorAll('[class*="_box_"]')].map(b => b.textContent.trim()).join("|")`,
  );
  const confirmedCount = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(
    /Status/.test(lockedChip) && /Active/.test(lockedChip) && confirmedCount === 27,
    'Confirmed locks "Status is Active" (27 rows)',
    `${confirmedCount} rows, chip ${JSON.stringify(lockedChip)}`,
  );
  await js(`[...document.querySelectorAll('[class*="topBar"] [role="tab"]')].find(t => t.textContent.trim() === "Inactive")?.click()`);
  await sleep(700);
  const inactiveCount = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await openMenu();
  const inactiveRows = JSON.parse(await menuRows());
  report(
    inactiveCount === 5 && JSON.stringify(inactiveRows) === JSON.stringify(LABOR_FILTERS_ACTIVE.filter((r) => r !== "Status")),
    "inactive phase (5 rows; menu without Status)",
    `${inactiveCount} rows, menu ${JSON.stringify(inactiveRows)}`,
  );
}


// ---- products: its filters, and they apply -----------------------------------
// The expected row counts are hand-derived from the db literals
// (PRODUCT_ITEMS): 50 active-phase rows (40 confirmed "active" + 10 review) /
// 8 inactive. Of the 50 actives: 26 tracked (full 12 · limited 7 · low 4 ·
// depleted 3) and 24 untracked, 13 with no subtype, 2 non-taxable (freight
// and the warranty part — a part sold to a client is taxable, so this one is
// lopsided on purpose), 12 with no manufacturer, 11 priced at $250 or more.
if (run("products")) {
  console.log("\nproducts — its filters, and they apply");
  await load(PRODUCTS_STORY);
  await openMenu();
  const rows = JSON.parse(await menuRows());
  const PRODUCT_FILTERS_ACTIVE = [
    "Cost",
    "Inventory",
    "Labels",
    "Last modified",
    "MFG",
    "MFG part #",
    "Price",
    "Status",
    "Stock",
    "Subtype",
    "Taxability",
  ];
  report(
    JSON.stringify(rows) === JSON.stringify(PRODUCT_FILTERS_ACTIVE),
    "active menu — eleven rows, Status between Price and Stock",
    JSON.stringify(rows),
  );

  // Inventory — SINGLE-select, the Tracked / Not tracked pair Daniel settled
  // (2026-09-16) over the node's first wording.
  await hoverRow("Inventory");
  const invRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()).filter(t => t && t.length < 24))`),
  );
  report(
    JSON.stringify(invRows) === JSON.stringify(["Tracked", "Not tracked"]),
    "Inventory rows (Tracked · Not tracked)",
    JSON.stringify(invRows),
  );
  await clickSubRow("Tracked");
  const invAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(invAfter === 26, "Inventory is Tracked", `50 → ${invAfter} rows`);

  // Stock — MULTI-select, the absence row leading WITHOUT an icon (Daniel
  // took the `minus` off on 2026-09-16) over the four levels, fullest first.
  await load(PRODUCTS_STORY);
  await openMenu();
  await hoverRow("Stock");
  const stockRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()).filter(t => t && t.length < 24))`),
  );
  report(
    JSON.stringify(stockRows) === JSON.stringify(["Not tracked", "Full", "Limited", "Low", "Depleted"]),
    "Stock rows (Not tracked over the four levels)",
    JSON.stringify(stockRows),
  );
  // The absence row draws no icon; the four levels each draw one. The row's
  // own left slot is only rendered when it HAS one (SelectListItemContent),
  // so counting `slotLeft` is what distinguishes them — a looser icon
  // selector also matches the checkbox and reads the same on every row.
  const stockIcons = await js(
    `JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.querySelectorAll('[class*="slotLeft"]').length))`,
  );
  report(
    JSON.stringify(JSON.parse(stockIcons)) === JSON.stringify([0, 1, 1, 1, 1]),
    "Stock — the absence row has no icon, the four levels do",
    stockIcons,
  );
  await clickSubRow("Not tracked");
  const stAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(stAfter === 24, "Stock is Not tracked", `50 → ${stAfter} rows`);

  // MFG — the FREEFORM kind with ONE field and NO label (both nodes draw the
  // Input with no header): the row OPENS THE DIALOG, there is no sub-list.
  await load(PRODUCTS_STORY);
  await openMenu();
  await js(`[...document.querySelectorAll('[role="menuitem"]')].find(r => r.textContent.trim() === "MFG")?.click()`);
  await sleep(700);
  const mfgFields = await js(`document.querySelectorAll('[class*="freeformCustomContent"] input').length`);
  // Input renders its header only when it HAS a label, so the absence of a
  // `labelRow` is the check. (The `<label>` element around the input is the
  // FIELD's own — every TextField wraps its input in one — so counting those
  // would never be zero.)
  const mfgLabelRows = await js(`document.querySelectorAll('[class*="freeformCustomContent"] [class*="labelRow"]').length`);
  report(
    mfgFields === 1 && mfgLabelRows === 0,
    "MFG — one field, drawn with no label header",
    `${mfgFields} inputs, ${mfgLabelRows} label rows`,
  );
  await typeInto(`document.querySelectorAll('[class*="freeformCustomContent"] input')[0]`, "kason");
  await js(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === "Apply" && !b.disabled)?.click()`);
  await sleep(700);
  const mfgAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  const mfgChip = await js(`[...document.querySelectorAll('[class*="_box_"]')].map(b => b.textContent.trim()).join("|")`);
  report(
    mfgAfter === 3 && /MFG/.test(mfgChip) && /contains/.test(mfgChip) && /kason/.test(mfgChip),
    "MFG contains 'kason' — case-insensitive, 3 rows",
    `50 → ${mfgAfter} rows, chip ${JSON.stringify(mfgChip)}`,
  );

  // Subtype + Taxability + Price — the promoted templates and the money one,
  // over the PRODUCT tables.
  await load(PRODUCTS_STORY);
  await openMenu();
  await hoverRow("Subtype");
  const subRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()).filter(t => t && t.length < 28))`),
  );
  report(
    JSON.stringify(subRows) ===
      JSON.stringify([
        "No subtype",
        "Chemicals & supplies",
        "Cooking equipment parts",
        "Electrical",
        "Filters & media",
        "Hardware & gaskets",
        "Plumbing",
        "Refrigeration parts",
      ]),
    "Subtype rows — the PRODUCT subtypes, not Labor's",
    JSON.stringify(subRows),
  );
  await clickSubRow("No subtype");
  const subAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(subAfter === 13, "Subtype = No subtype", `50 → ${subAfter} rows`);
  await load(PRODUCTS_STORY);
  await openMenu();
  await hoverRow("Price");
  await clickSubRow("$250");
  const prAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(prAfter === 11, "Price at least $250", `50 → ${prAfter} rows`);

  // The views and the phases: the Labor shape exactly — Active holds All ·
  // Review · Confirmed and the Confirmed view's FIXED chip reads "Status is
  // Active"; Inactive holds one All of 8 rows, its menu without Status.
  await load(PRODUCTS_STORY);
  const activeCount = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  const activeViews = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="viewBar"] [role="tab"]')].map(t => t.textContent.trim()))`),
  );
  report(
    activeCount === 50 && JSON.stringify(activeViews) === JSON.stringify(["All", "Review", "Confirmed"]),
    "active phase (50 rows; All · Review · Confirmed)",
    `${activeCount} rows, views ${JSON.stringify(activeViews)}`,
  );
  await js(`[...document.querySelectorAll('[class*="viewBar"] [role="tab"]')].find(t => t.textContent.trim() === "Review")?.click()`);
  await sleep(700);
  const reviewChip = await js(
    `[...document.querySelectorAll('[class*="_box_"]')].map(b => b.textContent.trim()).join("|")`,
  );
  const reviewCount = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(
    /Status/.test(reviewChip) && /Review/.test(reviewChip) && reviewCount === 10,
    'Review locks "Status is Review" (10 rows)',
    `${reviewCount} rows, chip ${JSON.stringify(reviewChip)}`,
  );
  await js(`[...document.querySelectorAll('[class*="topBar"] [role="tab"]')].find(t => t.textContent.trim() === "Inactive")?.click()`);
  await sleep(700);
  const inactiveCount = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await openMenu();
  const inactiveRows = JSON.parse(await menuRows());
  report(
    inactiveCount === 8 &&
      JSON.stringify(inactiveRows) === JSON.stringify(PRODUCT_FILTERS_ACTIVE.filter((r) => r !== "Status")),
    "inactive phase (8 rows; menu without Status)",
    `${inactiveCount} rows, menu ${JSON.stringify(inactiveRows)}`,
  );
}


// ---- other / discounts / tax rates: the three smaller pricebook lists -------
// Row counts hand-derived from the db literals. OTHER: 18 active (14 confirmed
// + 4 review) / 4 inactive; 5 actives have no subtype, 7 are taxable, 4 are
// priced at $250+, 5 cost $100+. DISCOUNTS: 16 active (13 + 3) / 3 inactive;
// 3 with no subtype, and the discount magnitudes run $0 to $2,500 — 7 are
// $100 or more, 3 are $500 or more. TAX RATES: 12 active (9 + 3) / 3
// inactive; 7 rates are 5% or more.
if (run("charges")) {
  console.log("\nother / discounts / tax rates — the three smaller pricebook lists");

  // --- OTHER ---
  await load(OTHER_STORY);
  await openMenu();
  const otherMenu = JSON.parse(await menuRows());
  const OTHER_FILTERS = ["Cost", "Labels", "Last modified", "Price", "Status", "Subtype", "Taxability"];
  const DISCOUNT_FILTERS = ["Discount", "Labels", "Last modified", "Status", "Subtype"];
  report(
    JSON.stringify(otherMenu) === JSON.stringify(OTHER_FILTERS),
    "other — seven rows, every one a shared template",
    JSON.stringify(otherMenu),
  );
  await hoverRow("Subtype");
  const otherSubtypes = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()).filter(t => t && t.length < 28))`),
  );
  report(
    JSON.stringify(otherSubtypes) ===
      JSON.stringify([
        "No subtype",
        "Disposal & recycling",
        "Equipment rental",
        "Permits & fees",
        "Subcontracted work",
        "Travel & mileage",
      ]),
    "other — its OWN subtypes, not Labor's or Products'",
    JSON.stringify(otherSubtypes),
  );
  await clickSubRow("No subtype");
  const otherSubAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(otherSubAfter === 5, "other — Subtype = No subtype", `18 → ${otherSubAfter} rows`);
  await load(OTHER_STORY);
  await openMenu();
  await hoverRow("Price");
  await clickSubRow("$250");
  const otherPriceAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(otherPriceAfter === 4, "other — Price at least $250", `18 → ${otherPriceAfter} rows`);
  await load(OTHER_STORY);
  await openMenu();
  await hoverRow("Taxability");
  await clickSubRow("Taxable");
  const otherTaxAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(otherTaxAfter === 7, "other — Taxability is Taxable", `18 → ${otherTaxAfter} rows`);
  await load(OTHER_STORY);
  const otherActive = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  const otherViews = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="viewBar"] [role="tab"]')].map(t => t.textContent.trim()))`),
  );
  report(
    otherActive === 18 && JSON.stringify(otherViews) === JSON.stringify(["All", "Review", "Confirmed"]),
    "other — active phase (18 rows; All · Review · Confirmed)",
    `${otherActive} rows, views ${JSON.stringify(otherViews)}`,
  );
  await js(`[...document.querySelectorAll('[class*="viewBar"] [role="tab"]')].find(t => t.textContent.trim() === "Review")?.click()`);
  await sleep(700);
  const otherReview = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  const otherChip = await js(`[...document.querySelectorAll('[class*="_box_"]')].map(b => b.textContent.trim()).join("|")`);
  report(
    otherReview === 4 && /Status/.test(otherChip) && /Review/.test(otherChip),
    'other — Review locks "Status is Review" (4 rows)',
    `${otherReview} rows, chip ${JSON.stringify(otherChip)}`,
  );
  await js(`[...document.querySelectorAll('[class*="topBar"] [role="tab"]')].find(t => t.textContent.trim() === "Inactive")?.click()`);
  await sleep(700);
  const otherInactive = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await openMenu();
  const otherInactiveMenu = JSON.parse(await menuRows());
  report(
    otherInactive === 4 &&
      JSON.stringify(otherInactiveMenu) === JSON.stringify(OTHER_FILTERS.filter((r) => r !== "Status")),
    "other — inactive phase (4 rows; menu without Status)",
    `${otherInactive} rows, menu ${JSON.stringify(otherInactiveMenu)}`,
  );

  // --- DISCOUNTS ---
  await load(DISCOUNTS_STORY);
  await openMenu();
  const discMenu = JSON.parse(await menuRows());
  report(
    JSON.stringify(discMenu) === JSON.stringify(DISCOUNT_FILTERS),
    "discounts — FIVE rows: Cost and Taxability pruned, Price renamed Discount",
    JSON.stringify(discMenu),
  );
  await hoverRow("Subtype");
  const discSubtypes = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()).filter(t => t && t.length < 28))`),
  );
  report(
    JSON.stringify(discSubtypes) ===
      JSON.stringify(["No subtype", "Goodwill", "Promotional", "Service agreement", "Volume"]),
    "discounts — its own subtypes",
    JSON.stringify(discSubtypes),
  );

  // The DISCOUNT filter — the sixth amount kind. Its values carry NO minus
  // (Daniel removed it after the review: a minus and a comparison word fight
  // each other), and they compare MAGNITUDES, so "at least $100" means a
  // discount of $100 or more. The minus lives in the COLUMN alone.
  await load(DISCOUNTS_STORY);
  await openMenu();
  await hoverRow("Discount");
  const discRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()))`),
  );
  report(
    JSON.stringify(discRows.filter((r) => !r.startsWith("Custom"))) ===
      JSON.stringify(["$100", "$200", "$300", "$400", "$500", "$1,000", "$2,000", "$3,000", "$4,000", "$5,000"]),
    "discounts — the DISCOUNT ladder, the node's ten presets, no minus",
    JSON.stringify(discRows),
  );
  await clickSubRow("$100");
  const discAtLeast100 = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  const discAmountChip = await js(`[...document.querySelectorAll('[class*="_box_"]')].map(b => b.textContent.trim()).join("|")`);
  report(
    discAtLeast100 === 7 && /Discount/.test(discAmountChip) && /\$100/.test(discAmountChip) && !/-\$100/.test(discAmountChip),
    'discounts — "at least $100" = a discount of $100 or more (7 of 16), chip carries NO minus',
    `16 → ${discAtLeast100} rows, chip ${JSON.stringify(discAmountChip)}`,
  );
  await load(DISCOUNTS_STORY);
  await openMenu();
  await hoverRow("Discount");
  await clickSubRow("$500");
  const discAtLeast500 = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(
    discAtLeast500 === 3,
    'discounts — "at least $500" narrows further (3 of 16)',
    `16 → ${discAtLeast500} rows`,
  );

  // The COLUMN is where the sign survives, drawn with the true MINUS SIGN
  // (U+2212), not the hyphen the currency formatter emits.
  await load(DISCOUNTS_STORY);
  // Counted with split, not a regex: a "$" inside a template-literal regex
  // collapses to the end-of-string anchor, which silently matched nothing.
  const discSigns = JSON.parse(
    await js(`(() => {
      const text = [...document.querySelectorAll('[role="row"]')].map(r => r.innerText).join("|");
      return JSON.stringify({
        minus: text.split("\u2212$").length - 1,
        hyphen: text.split("-$").length - 1,
      });
    })()`),
  );
  report(
    discSigns.minus > 0 && discSigns.hyphen === 0,
    "discounts — the Discount COLUMN keeps the sign, as a true minus (U+2212)",
    JSON.stringify(discSigns),
  );

  await load(DISCOUNTS_STORY);
  const discActive = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(discActive === 16, "discounts — active phase (16 rows)", `${discActive} rows`);
  await js(`[...document.querySelectorAll('[class*="viewBar"] [role="tab"]')].find(t => t.textContent.trim() === "Confirmed")?.click()`);
  await sleep(700);
  const discConfirmed = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  const discChip = await js(`[...document.querySelectorAll('[class*="_box_"]')].map(b => b.textContent.trim()).join("|")`);
  report(
    discConfirmed === 13 && /Status/.test(discChip) && /Active/.test(discChip),
    'discounts — Confirmed locks "Status is Active" (13 rows)',
    `${discConfirmed} rows, chip ${JSON.stringify(discChip)}`,
  );

  // --- TAX RATES ---
  await load(TAX_RATES_STORY);
  await openMenu();
  const taxMenu = JSON.parse(await menuRows());
  report(
    JSON.stringify(taxMenu) === JSON.stringify(["Labels", "Last modified", "Status", "Tax rate"]),
    "tax rates — FOUR rows, alphabetical (Subtype pruned; both flags closed)",
    JSON.stringify(taxMenu),
  );
  await hoverRow("Tax rate");
  const taxRows = JSON.parse(
    await js(`JSON.stringify([...document.querySelectorAll('[class*="filtersSub"] [class*="item"]')]
        .filter(el => /_item_/.test(el.className))
        .map(r => r.textContent.trim()))`),
  );
  report(
    JSON.stringify(taxRows.filter((r) => !r.startsWith("Custom"))) ===
      JSON.stringify(["0%", "1%", "2%", "3%", "4%", "5%", "10%", "15%", "20%"]),
    "tax rates — the PERCENT ladder, the node's nine rows",
    JSON.stringify(taxRows),
  );
  await clickSubRow("5%");
  const taxAfter = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  const taxChip = await js(`[...document.querySelectorAll('[class*="_box_"]')].map(b => b.textContent.trim()).join("|")`);
  report(
    taxAfter === 7 && /Tax rate/.test(taxChip) && /5%/.test(taxChip),
    "tax rates — Tax rate at least 5% (7 rows), and the chip prints the percent",
    `12 → ${taxAfter} rows, chip ${JSON.stringify(taxChip)}`,
  );
  await load(TAX_RATES_STORY);
  const taxActive = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  report(taxActive === 12, "tax rates — active phase (12 rows)", `${taxActive} rows`);
  await js(`[...document.querySelectorAll('[class*="topBar"] [role="tab"]')].find(t => t.textContent.trim() === "Inactive")?.click()`);
  await sleep(700);
  const taxInactive = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await openMenu();
  const taxInactiveMenu = JSON.parse(await menuRows());
  report(
    taxInactive === 3 &&
      JSON.stringify(taxInactiveMenu) === JSON.stringify(["Labels", "Last modified", "Tax rate"]),
    "tax rates — inactive phase (3 rows; menu without Status)",
    `${taxInactive} rows, menu ${JSON.stringify(taxInactiveMenu)}`,
  );
}


// ---- amount: the Custom dialog's fields, per kind ---------------------------
// Two things this section guards:
//   - a SINGLE value carries no label (Daniel, 2026-09-16 — node 13923-24049
//     draws the Input with `header: false`), where a RANGE still labels From
//     and To. It retired the 2026-09-15 unit-word relabel;
//   - every AMOUNT kind is routed to the number dialog. `CustomDialog` falls
//     through to the DATE dialog, so a kind missing from that branch opens a
//     calendar under the filter's own title — which is exactly what `percent`
//     did on the day it arrived.
if (run("amount")) {
  console.log("\namount — the Custom dialog's fields, per kind");
  const openCustom = async (story, filter) => {
    await load(story);
    await openMenu();
    await hoverRow(filter);
    await js(`(() => {
      const rows = [...document.querySelectorAll('[class*="filtersSub"] *')]
        .filter(el => el.children.length === 0 && /^Custom/.test(el.textContent.trim()));
      let el = rows[0];
      for (let i = 0; i < 5 && el; i++) { el.click(); el = el.parentElement; }
      return rows.length;
    })()`);
    await sleep(1000);
  };
  const dialogShape = () =>
    js(`JSON.stringify({
      title: document.querySelector('[class*="popoverHeader"], [class*="dialog"] h2, [role="dialog"] h2')?.textContent?.trim() ?? "",
      inputs: document.querySelectorAll('[class*="moneyCustomContent"] input').length,
      labelRows: document.querySelectorAll('[class*="moneyCustomContent"] [class*="labelRow"]').length,
      suffixes: [...document.querySelectorAll('[class*="moneyCustomContent"]')].map(el => el.innerText.trim()).join("|"),
      calendar: document.body.innerText.includes("Mo") && document.body.innerText.includes("Su"),
    })`);

  // MONEY — the Labor list's Cost.
  await openCustom(LABOR_STORY, "Cost");
  const money = JSON.parse(await dialogShape());
  report(
    money.inputs === 1 && money.labelRows === 0 && !money.calendar,
    "money Custom — one field, NO label",
    JSON.stringify(money),
  );
  // …and a RANGE labels both ends.
  await js(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === "within")?.click()`);
  await sleep(600);
  const moneyRange = JSON.parse(await dialogShape());
  report(
    moneyRange.inputs === 2 && moneyRange.labelRows === 2 && /From/.test(moneyRange.suffixes) && /To/.test(moneyRange.suffixes),
    'money Custom — "within" labels From and To',
    JSON.stringify(moneyRange),
  );

  // PERCENT — the Tax rates list's own filter. The regression guard: this
  // opened the DATE dialog before `percent` was added to the router.
  await openCustom(TAX_RATES_STORY, "Tax rate");
  const percent = JSON.parse(await dialogShape());
  report(
    percent.inputs === 1 && percent.labelRows === 0 && !percent.calendar && /%/.test(percent.suffixes),
    "percent Custom — the NUMBER dialog (not the date one), one unlabelled field with %",
    JSON.stringify(percent),
  );

  // DURATION — the Labor list's Est. duration keeps its hr + min pair, and
  // its single value lost the "Duration" label with the same change.
  await openCustom(LABOR_STORY, "Est. duration");
  const duration = JSON.parse(
    await js(`JSON.stringify({
      inputs: document.querySelectorAll('[class*="amountCustomContent"] input').length,
      labelRows: document.querySelectorAll('[class*="amountCustomContent"] [class*="labelRow"]').length,
      calendar: document.body.innerText.includes("Mo") && document.body.innerText.includes("Su"),
    })`),
  );
  report(
    duration.labelRows === 0 && !duration.calendar,
    "duration Custom — the single value carries NO label",
    JSON.stringify(duration),
  );
}


// ---- freeform: the Address dialog (the FREEFORM kind), its fields and chip ---
// The 2026-09-16 reorganisation: "Address" the KIND became "Freeform" (its
// fields now come from the def), and Address / Billing address are filters
// built on it. This section fills the Jobs Address dialog and checks the
// five def-declared fields render, Apply gates and applies, and the chip
// words the value the address way.
if (run("freeform")) {
  console.log("\nfreeform — the Address dialog, its fields and the chip");
  await load(JOBS_STORY);
  const before = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await openMenu();
  // CLICK the Address row — a freeform filter's menu row opens the dialog
  // itself (no sub-list).
  await js(`[...document.querySelectorAll('[class*="filtersMenu"] [role="menuitem"], [class*="filtersCard"] [role="menuitem"], [role="menuitem"]')].find(r => r.textContent.trim() === "Address")?.click()`);
  await sleep(700);
  const fieldCount = await js(`document.querySelectorAll('[class*="freeformCustomContent"] input').length`);
  const bodyText = await js(`JSON.stringify(document.querySelector('[class*="freeformCustomContent"]')?.innerText ?? "")`);
  report(
    fieldCount === 5 &&
      ["Street address", "Suite, unit, etc.", "City", "State / Province", "Postal code"].every((l) => bodyText.includes(l)),
    "the dialog renders the def's five fields",
    `${fieldCount} inputs, ${bodyText}`,
  );
  const paired = await js(`document.querySelectorAll('[class*="freeformCustomRow"] input').length`);
  report(paired === 2, "State / Postal share a desktop row", `${paired} inputs in the half row`);
  const disabledBefore = await js(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === "Apply")?.disabled ?? null`);
  await typeInto(`document.querySelectorAll('[class*="freeformCustomContent"] input')[2]`, "San Francisco");
  const disabledAfter = await js(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === "Apply")?.disabled ?? null`);
  report(disabledBefore === true && disabledAfter === false, "Apply gates until a field is filled", `${disabledBefore} → ${disabledAfter}`);
  await js(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === "Apply" && !b.disabled)?.click()`);
  await sleep(700);
  const after = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  const chip = await js(`[...document.querySelectorAll('[class*="_box_"]')].map(b => b.textContent.trim()).join("|")`);
  report(
    after > 0 && after < before && /Address/.test(chip) && /contains/.test(chip) && /San Francisco/.test(chip),
    "applies and the chip words the address",
    `${before} → ${after} rows, chip ${JSON.stringify(chip)}`,
  );
}

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) FAILED.\n`);
chrome.kill();
process.exit(failures === 0 ? 0 : 1);
