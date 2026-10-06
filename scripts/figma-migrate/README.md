# DS migration helper — keep content and annotations across a breaking library update

When a library component is rebuilt (layers deleted and re-created, properties
re-added), Figma cannot match the old overrides to the new structure, so
instances in design files reset: text, icons, hidden layers, swaps and
annotations are lost.

These scripts measure what the update will break, record it **before** the
update, and put it back **after**. They are not node scripts — they are Plugin
API code, run through the `use_figma` MCP tool with the design file open.

## Why it can work

- The **instance node id is stable** across a library update. The instance is
  not re-created, only its contents are.
- Layer ids *inside* an instance are derived from the main component, so they
  change. The restore therefore matches by **layer name path plus the recorded
  child index** — the index is part of the key, because identically-named
  siblings are everywhere.
- `instance.overrides` reports exactly which nodes and which fields were
  customised.
- **`importComponentSetByKeyAsync` resolves the PUBLISHED component** — the
  version the file is about to receive — while the file's own instances still
  show the old one. That difference is the measurement, and it is what lets the
  snapshot record only the overrides the update can actually break.
- Annotations are not overrides, so they get their own sweep.

## Files

| File | What it is |
|---|---|
| `measure.js` | step 0 — the published structure (paths + property definition ids) of a batch of component keys, read-only |
| `snapshot.js` | step 1 — record what is at risk, before the update. Takes a list of page ids |
| `rules.json` | the rename / restructure mapping. Only verified rules are loaded; guesses are parked in `_retired` |
| `restore.js` | step 3 — re-apply after the update; run with `DRY_RUN = true` first |
| `cleanup.js` | step 4 — delete the snapshot frames, page by page |
| `IMPACT.md` | the measured report for the 2026-10 update |
| `observed-keys.json` | the component keys in use in the design file |
| `ds-paths.json` | the first attempt's path dump. Superseded by the measurement in IMPACT.md |
| `snapshot-job-details.js` | the 2026-10-04 **rebuild** snapshot — records row/group content semantically, not by path |
| `rebuild-job-details.js` | re-creates rows inside the new `bodyList` slot and writes their values |
| `rules-job-details.json` | the Job Details mapping spec, incl. the Font Awesome icon-write workaround |
| `IMPACT-job-details.md` | the Job Details measured report |

**Two different jobs.** `snapshot.js` / `restore.js` handle a RESTORE (layers
renamed, nodes still exist). `snapshot-job-details.js` / `rebuild-job-details.js`
handle a REBUILD (the component's parts were deleted, so the content must be
re-created). Read the skill's first section before choosing.

`observed-keys.json`, `rules.json` and `IMPACT.md` are **per update**. Treat the
ones in the repo as the 2026-10 example and rebuild them for a new one.

There is also a skill — `/figma-library-migration` — that runs this whole
procedure from the start.

## The steps

0. **Measure** (`measure.js`, read-only). Per component key: the union of child
   layer paths, stopping at nested-instance boundaries, and the **raw** property
   definition keys. A raw key carries the definition id (`↳ label#31300:0`), so a
   property deleted and re-added under the same name shows up as a different key
   — which is exactly when every instance's value falls back to the default. A
   key that resolves to neither a set nor a component is either gone from the
   library or not in it at all. Write the findings into `IMPACT.md`.

1. **`snapshot.js`** — run **before** accepting the update. It does the same
   measurement live, per owning component, and records only the at-risk
   overrides plus every annotation. The data is stored inside Figma as chunked
   text layers in a locked frame named `⚙ DS snapshot (dsmig1)`, parked to the
   right of the page content, so it never travels through chat. Pages with
   nothing to record get no frame at all, and any older frame is removed first.

   Storage is text layers because `setPluginData` is not available through the
   MCP sandbox. **Keep it small and delete it page by page** — on the first
   attempt an unfiltered 6.6 MB snapshot pushed the file to 95% memory.

2. **Accept the library update in Figma.** Mark a version in the file history
   first, so there is a way back.

3. **`restore.js`** — reads the snapshot back out of the frame and re-applies
   it. Run with `DRY_RUN = true` first: it reports what it would write, what it
   cannot find, what is ambiguous and every index fallback it used, without
   touching the file. Fix `rules.json` only with rules read off live structure,
   then run for real, one page per call.

4. **`cleanup.js`** — remove each page's frame as soon as that page's restore has
   been checked.

## What the restore writes — and what it never writes

Writes: component property values (where all copy and all icons live),
annotations, variable bindings, prototype reactions, fills / strokes and style
ids, visibility.

**Never** `width`/`height` (writing them means `resize()`, which forces FIXED
sizing — it turned hugging Chips into fixed-width ones across ten pages on the
first attempt), never `name`, and no layout field. Those are derived from
content, not intent. Anything not captured is counted in `fieldsNotCaptured`, so
the report says what was passed over.

## Order of writes in the restore

Variant properties first (switching a variant rebuilds everything under it),
then the other properties, then sub-layer overrides, then annotations.

Where a layer's value is driven by a component property, the restore sets the
**property** on the owning instance, not `characters` on the layer — a property
always wins over a direct layer write. Same for `visible` (BOOLEAN) and
`mainComponent` (INSTANCE_SWAP).

## How a target is resolved

The recorded path first, then a rule, then the child index — in that order, and
never the other way round. A rule derived from a library's variant union can be
wrong for the variant an instance actually uses, which is why it is only ever a
fallback. The index fallback is accepted only when the candidate is the same
node type and, for an instance, the same main component; every use of it is
logged in the report.

## If a file was already updated

The content is still in the file's version history. Restore that version into a
**duplicate** file, run `snapshot.js` there, copy the snapshot across, and run
`restore.js` on the real file.

## Known limits

- `SLOT` properties cannot be written with `setProperties` (Figma throws
  `cannotSetSlotProperty`). Recorded and reported, not re-created.
- A layer both renamed and moved cannot be matched automatically. Reported
  instead of guessed.
- Detached instances are out of scope — they are plain frames and the update
  does not touch them.
- A font the library uses may not be loadable in this environment ("Font Awesome
  7 Pro" was not), which makes TEXT writes on those layers fail. It did not
  matter in the 2026-10 run because the values travel as properties.
