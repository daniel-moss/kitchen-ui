// Capture every Storybook story as a PNG for visual-regression checks.
//
// Usage:
//   npm run storybook          (in another terminal — must be on :6006)
//   npm run screenshot         → screenshots/<story-id>.png for every story
//   npm run screenshot listitem  → only stories whose id contains "listitem"
//
// Run it before and after a change and diff the folders (or use git to keep a
// blessed set). Requires Google Chrome and Node 21+ (built-in WebSocket).

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CHROME = process.env.CHROME_BIN ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const STORYBOOK = process.env.STORYBOOK_URL ?? "http://localhost:6006";
// fileURLToPath, not .pathname — the project path contains a non-ASCII char.
const OUT_DIR = fileURLToPath(new URL("../screenshots/", import.meta.url));
const FILTER = (process.argv[2] ?? "").toLowerCase();
const PORT = 9250;
const SETTLE_MS = 700; // fonts, mount transitions

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- fetch the story list from Storybook -----------------------------------
let index;
try {
  index = await (await fetch(`${STORYBOOK}/index.json`)).json();
} catch {
  console.error(`Cannot reach ${STORYBOOK} — start Storybook first (npm run storybook).`);
  process.exit(1);
}
const stories = Object.values(index.entries ?? index.stories ?? {})
  .filter((e) => (e.type ?? "story") === "story")
  .map((e) => e.id)
  .filter((id) => id.includes(FILTER));

if (stories.length === 0) {
  console.error(`No stories match "${FILTER}".`);
  process.exit(1);
}
console.log(`Capturing ${stories.length} stories → ${OUT_DIR}`);
mkdirSync(OUT_DIR, { recursive: true });

// ---- drive headless Chrome over CDP ----------------------------------------
const chrome = spawn(CHROME, [
  "--headless",
  "--disable-gpu",
  `--remote-debugging-port=${PORT}`,
  "--window-size=1000,900",
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
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
  }
};
await new Promise((r) => (ws.onopen = r));
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++msgId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
await send("Page.enable");

let done = 0;
for (const id of stories) {
  await send("Page.navigate", { url: `${STORYBOOK}/iframe.html?id=${id}&viewMode=story` });
  await sleep(SETTLE_MS);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  if (shot?.data) {
    writeFileSync(`${OUT_DIR}${id}.png`, Buffer.from(shot.data, "base64"));
    done++;
  } else {
    console.warn(`  failed: ${id}`);
  }
  if (done % 25 === 0) console.log(`  ${done}/${stories.length}`);
}
console.log(`Done — ${done}/${stories.length} captured.`);
chrome.kill();
process.exit(0);
