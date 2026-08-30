// Publish a prototype to the USER-TESTING repo
// (github.com/daniel-moss/roopairs-user-testing), the GitHub Pages site whose
// links go to customers:
//
//   https://daniel-moss.github.io/roopairs-user-testing/
//
// That repository holds the BUILT Storybook at its root — no source, no build
// step of its own. Publishing = build here, copy the output there, commit, push.
// Keeping it separate is the point: a design-system change in kitchen-ui can
// never move a prototype a customer is looking at. It only changes when this
// script runs.
//
// Usage:
//   node scripts/publish-prototypes.mjs            build + copy + commit
//   node scripts/publish-prototypes.mjs --push     … and push (the site updates)
//   node scripts/publish-prototypes.mjs --dry-run  show what would change, touch nothing
//   SKIP_BUILD=1 node scripts/publish-prototypes.mjs   reuse the existing storybook-share/
//
// ONE prototype into its OWN sub-folder — the safe way to add a build while
// clients are still testing what is already published:
//   node scripts/publish-prototypes.mjs --only JobDetailsForms --dir job-details-forms
// Nothing outside that sub-folder is touched, so every link already sent keeps
// serving exactly the same files. Without --dir the whole site is replaced.
//
// The clone lives next to kitchen-ui (../roopairs-user-testing) and is created on
// the first run. Override with PROTOTYPES_REPO=/some/path.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BUILD = resolve(ROOT, "storybook-share");
const REPO = process.env.PROTOTYPES_REPO ?? resolve(ROOT, "..", "roopairs-user-testing");
const REMOTE = "https://github.com/daniel-moss/roopairs-user-testing.git";
const SITE = "https://daniel-moss.github.io/roopairs-user-testing/";

const push = process.argv.includes("--push");
const dryRun = process.argv.includes("--dry-run");
/** The value after a flag, e.g. `--dir forms-user-testing`. */
const flag = (name) => {
  const i = process.argv.indexOf(name);
  return i === -1 ? undefined : process.argv[i + 1];
};
// One or more folders in src/prototypes/, comma-separated — a prototype that
// spans several folders ("Time Tracker" = TimeTracker + the Concept folders)
// is published as one build.
const only = flag("--only");
const subDir = flag("--dir"); // where it lands in the share repo ("" = the root)

for (const folder of only?.split(",").map((f) => f.trim()) ?? []) {
  if (!existsSync(resolve(ROOT, "src/prototypes", folder))) {
    throw new Error(`--only ${folder}: no such folder in src/prototypes/`);
  }
}
if (subDir != null && !/^[a-z0-9-]+$/.test(subDir)) {
  throw new Error(`--dir ${subDir}: use a plain lower-case folder name.`);
}

const run = (cmd, args, cwd = ROOT) => execFileSync(cmd, args, { cwd, encoding: "utf8" });
const runLive = (cmd, args, cwd = ROOT, env) =>
  execFileSync(cmd, args, { cwd, stdio: "inherit", env: { ...process.env, ...env } });

// ---- 1. the build ----------------------------------------------------------
// SHARE=1 keeps everything but src/prototypes out of the bundle (see
// .storybook/main.js) — no component library, no docs pages.
if (process.env.SKIP_BUILD === "1") {
  if (!existsSync(BUILD)) throw new Error(`SKIP_BUILD=1 but ${BUILD} does not exist — run the build first.`);
  console.log("Reusing the existing storybook-share/ build.");
} else {
  console.log(only == null ? "Building the share Storybook (all prototypes)…" : `Building the share Storybook (${only} only)…`);
  runLive("npm", ["run", "build-storybook:share"], ROOT, only == null ? {} : { SHARE_PROTOTYPE: only });
}

// ---- 2. the share repo -----------------------------------------------------
if (!existsSync(REPO)) {
  console.log(`Cloning the share repo into ${REPO}…`);
  if (dryRun) console.log("  (--dry-run: skipped)");
  else runLive("git", ["clone", REMOTE, REPO], dirname(REPO));
}
if (!dryRun && !existsSync(resolve(REPO, ".git"))) {
  throw new Error(`${REPO} is not a git clone of the share repo.`);
}

// Anything half-finished in the clone would be committed by the sync below.
const dirty = existsSync(resolve(REPO, ".git")) ? run("git", ["status", "--porcelain"], REPO).trim() : "";
if (dirty !== "" && !dryRun) {
  throw new Error(`${REPO} has uncommitted changes — sort them out first:\n${dirty}`);
}

// ---- 3. copy the build over the repo ---------------------------------------
// --delete so a prototype removed here disappears there too; .git is excluded
// or rsync would wipe the repo's history. With --dir the delete is scoped to
// that sub-folder, so the rest of the site — the builds clients are testing —
// is not touched at all.
const target = subDir == null ? `${REPO}/` : `${REPO}/${subDir}/`;
if (subDir != null && !dryRun) mkdirSync(target, { recursive: true });
console.log(dryRun ? "Changes this publish would make:" : `Copying the build into ${target}…`);
runLive("rsync", [
  "-a",
  ...(dryRun ? ["--dry-run", "--itemize-changes"] : []),
  "--delete",
  "--exclude",
  ".git/",
  `${BUILD}/`,
  target,
]);

// GitHub Pages runs Jekyll unless this file exists, and Jekyll drops folders
// whose name starts with "_" — half the Storybook bundle. Only written when it
// is MISSING: rewriting it would show up as a change outside the sub-folder.
if (!dryRun && !existsSync(resolve(REPO, ".nojekyll"))) writeFileSync(resolve(REPO, ".nojekyll"), "");

if (dryRun) {
  console.log("\n--dry-run: nothing was written, committed or pushed.");
  process.exit(0);
}

// ---- 4. commit (and push only when asked) ----------------------------------
const changed = run("git", ["status", "--porcelain"], REPO).trim();
if (changed === "") {
  console.log("\nThe published site already matches this build — nothing to do.");
  process.exit(0);
}
const stamp = new Date().toISOString().slice(0, 10);
const what = subDir == null ? "prototypes" : subDir;
runLive("git", ["add", "-A"], REPO);
runLive("git", ["commit", "-m", `Publish ${what} ${stamp}`], REPO);
console.log(`\nCommitted in ${REPO}.`);

const base = subDir == null ? SITE : `${SITE}${subDir}/`;
if (!push) {
  console.log("Not pushed. To publish it:\n  git -C " + REPO + " push");
  console.log(`\nOnce pushed, the links are:\n  ${base}`);
  console.log("  " + base + "iframe.html?id=<story-id>&viewMode=story   (one story, full screen)");
  process.exit(0);
}
runLive("git", ["push"], REPO);
console.log(`\nPushed. GitHub Pages redeploys in a minute or two:\n  ${base}`);
console.log("A single prototype, full screen:\n  " + base + "iframe.html?id=<story-id>&viewMode=story");
