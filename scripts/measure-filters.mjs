// Measure the Filters prototype in a real browser — the checks that caught every
// regression while it was built. Run it after any change to the filter UI.
//
//   npm run storybook            (in another terminal — must be on :6006)
//   node scripts/measure-filters.mjs
//   node scripts/measure-filters.mjs widths      (one section only)
//
// Sections: widths · placement · stability · menu · estimates
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

// Every filter row in the Jobs menu, with the width its list should open at.
// Address opens a dialog instead of a list, so it has none.
const EXPECTED_WIDTHS = {
  Address: null,
  Assignee: 208,
  Client: 209,
  "Date received": 208,
  Duration: 208,
  Labels: 222,
  "Last modified": 208,
  Location: 384,
  Priority: 208,
  "Scheduled for": 208,
  Service: 291,
  Source: 231,
  Status: 208,
  "Status changed": 208,
  Type: 208,
};

const ESTIMATE_FILTERS = ["Address", "Client", "Labels", "Last modified", "Location", "Service", "Status changed"];

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
const menuRows = () =>
  js(`JSON.stringify([...document.querySelectorAll('[class*="filtersMenu"] [class*="item"]')]
        .map(r => r.textContent.trim()).filter(t => t && t.length < 24))`);
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
  for (const name of ["Priority", "Labels", "Duration", "Location", "Type", "Labels", "Priority"]) {
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
  report(String(empty).includes("No matching options"), "no-match state", JSON.stringify(empty));
}

// ---- estimates: the seven shared filters, and they filter ------------------
if (run("estimates")) {
  console.log("\nestimates — the seven filters, and they apply");
  await load(ESTIMATES_STORY);
  const before = await js(`document.querySelectorAll('[role="row"]').length - 1`);
  await openMenu();
  const rows = JSON.parse(await menuRows());
  report(
    JSON.stringify(rows) === JSON.stringify(ESTIMATE_FILTERS),
    "menu lists the seven",
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
}

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) FAILED.\n`);
chrome.kill();
process.exit(failures === 0 ? 0 : 1);
