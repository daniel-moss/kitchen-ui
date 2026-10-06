// DS migration — STEP 3: restore  (v3, 2026-10-03 redo — reads a v3 snapshot)
//
// Run with use_figma, ONE CALL PER PAGE, AFTER accepting the library update.
// Replace __PAGE_ID__, and __RULES__ with the `rules` object from rules.json.
//
// Set DRY_RUN = true first. It reports what it would write, what it cannot find
// and what is unrecoverable, without touching the file. Then run with false.
//
// Order of writes matters and is fixed:
//   1. variant properties   (switching a variant rebuilds everything under it)
//   2. other properties     (TEXT / BOOLEAN / INSTANCE_SWAP; SLOT is skipped)
//   3. sub-layer overrides
//   4. annotations
//
// Where a layer's value is driven by a component property, the property is set
// on the owning instance rather than the layer, because a property always wins
// over a direct layer write.
//
// CONTENT ONLY. Never size, never name, never layout — the v1 restore wrote
// width/height back with resize(), which forces FIXED sizing and turned hugging
// Chips and SelectLists into fixed ones on all ten pages it touched.

const PAGE_IDS = __PAGE_IDS__;
const DRY_RUN = true;
const RULES = __RULES__;
const FRAME_NAME = '⚙ DS snapshot (dsmig1)';

// Per-page state. The helpers below read these at call time, so each page
// reassigns them before its pass. Three pages per call is comfortable; every
// pass is idempotent (it only re-asserts recorded values and never deletes), so
// a retry after a dropped connection is always safe.
let page = null;
let snapshot = null;
let COMPS = [];
let report = null;

function compAt(i) { return i >= 0 && COMPS[i] ? COMPS[i] : null; }
function keyAt(i) { const c = compAt(i); return c ? c.key : null; }
function nameAt(i) { const c = compAt(i); return c ? c.name : null; }
function ruleAt(i) { const k = keyAt(i); return k ? RULES[k] : null; }

function freshReport() {
  return {
  page: page.name.replace(/\s+/g, ' ').trim(),
  dryRun: DRY_RUN,
  snapshotTakenAt: snapshot.takenAt,
  instances: { found: 0, missing: 0, componentChanged: 0 },
  props: { written: 0, unchanged: 0, noSuchProperty: [], slotSkipped: 0 },
  entries: { applied: 0, alreadyCorrect: 0, viaRule: 0, viaIndex: 0, lifted: 0, unrecoverable: [], unmatched: [], indexFallback: [] },
  annotations: { applied: 0, alreadyCorrect: 0, unmatched: 0, viaNodeId: 0 },
  fieldsFailed: {},
  mutatedNodeIds: [],
  samples: [],
  };
}

function note(bucket, text) {
  if (bucket.length < 40 && bucket.indexOf(text) === -1) bucket.push(text);
}

// A readable sample of the intended writes — counts alone are not something
// anyone can approve. Deduplicated, so 46 identical chip writes show once.
function sample(text) {
  if (report.samples.length < 30 && report.samples.indexOf(text) === -1) report.samples.push(text);
}

// Strip only the LAST "#<id>" segment. The Icon component has three separate
// properties named `iconName`, `iconName#` and `iconName##`; splitting on the
// first "#" merges them and writes one component's value into another.
function plainOf(rawKey) {
  const s = String(rawKey);
  const i = s.lastIndexOf('#');
  return i > 0 ? s.slice(0, i) : s;
}

// Reading an annotation gives BOTH `label` and `labelMarkdown`; writing one
// back with both is rejected ("Only one of label or labelMarkdown should be
// given"). Keep the markdown when there is any, and strip everything the
// setter does not accept.
function sanitizeAnnotations(list) {
  return (list || []).map((a) => {
    const o = {};
    if (a.labelMarkdown) o.labelMarkdown = a.labelMarkdown;
    else if (a.label !== undefined && a.label !== null) o.label = a.label;
    if (a.properties && a.properties.length) o.properties = a.properties.map((p) => ({ type: p.type }));
    if (a.categoryId) o.categoryId = a.categoryId;
    return o;
  });
}

// Writing `label` makes Figma fill in `labelMarkdown` on the way back out, so
// comparing the sanitised objects would report a difference forever. Compare on
// the text itself, whichever field carries it.
function annotationKey(list) {
  return JSON.stringify((list || []).map((a) => ({
    t: a.labelMarkdown || a.label || '',
    p: (a.properties || []).map((x) => x.type),
    c: a.categoryId || null,
  })));
}

// Resolve a name path under a root.
//
// CRITICAL: identically-named siblings are everywhere — a menu group holds ten
// layers called MenuItem, a select list holds nine called SelectListItem. Taking
// the first match by name sends every one of those entries to the FIRST sibling,
// which both invents false differences and overwrites that first row with other
// rows' values. That bug corrupted six pages before it was caught. So the
// recorded child index is the primary key, never a fallback, and an ambiguous
// step fails instead of guessing.
//
// `mode`:
//   'exact'   — the recorded slot must still carry the recorded name; a name
//               that matches several siblings without index agreement fails.
//   'byIndex' — trust the recorded slot even if the layer was renamed. Only
//               ever used behind the identity check in resolveTarget.
function resolvePath(root, names, idx, mode) {
  let node = root;
  for (let i = 0; i < names.length; i++) {
    if (!('children' in node)) return null;
    const kids = node.children;
    const want = names[i];
    const at = idx && idx[i] >= 0 && idx[i] < kids.length ? kids[idx[i]] : null;

    if (mode === 'byIndex') {
      if (!at) return null;
      node = at;
      continue;
    }

    if (at && at.name === want) { node = at; continue; }

    const hits = [];
    for (const c of kids) if (c.name === want) hits.push(c);
    if (hits.length === 1) { node = hits[0]; continue; }
    return null; // zero matches, or several and the index does not agree
  }
  return node;
}

// The instance that owns a given component property on this node, walking up
// until an instance actually declares a property with that plain name.
function ownerForProperty(node, propPlainName) {
  let n = node;
  while (n) {
    if (n.type === 'INSTANCE') {
      const props = n.componentProperties || {};
      for (const raw of Object.keys(props)) {
        if (plainOf(raw) === propPlainName) return { inst: n, raw };
      }
    }
    n = n.parent;
  }
  return null;
}

// Match recorded property values to the instance's current property keys by
// plain name + type, which is what survives a rebuild.
// `rule` may carry `propRenames` (old plain name → new plain name, or null to
// drop) and `propValues` (new plain name → value map, `*` as the catch-all),
// for the case where a rebuild renamed a property or changed its vocabulary.
function mapProps(inst, recorded, rule, label) {
  const current = inst.componentProperties || {};
  const byPlain = {};
  for (const raw of Object.keys(current)) {
    const p = current[raw];
    byPlain[p.type + '|' + plainOf(raw)] = { raw, type: p.type, value: p.value };
  }
  const renames = (rule && rule.propRenames) || {};
  const valueMaps = (rule && rule.propValues) || {};
  const variants = {};
  const others = {};
  const missing = [];
  const seen = {};
  let matched = 0;
  for (const oldRaw of Object.keys(recorded)) {
    const r = recorded[oldRaw];
    if (r.type === 'SLOT') { report.props.slotSkipped++; continue; }
    const recordedPlain = plainOf(oldRaw);
    const plain = Object.prototype.hasOwnProperty.call(renames, recordedPlain) ? renames[recordedPlain] : recordedPlain;
    if (plain === null) continue; // deliberately dropped
    const hit = byPlain[r.type + '|' + plain];
    if (!hit) { missing.push(recordedPlain + ' (' + r.type + ')'); continue; }
    matched++;
    let value = r.value;
    const vm = valueMaps[plain];
    if (vm) value = Object.prototype.hasOwnProperty.call(vm, String(value)) ? vm[String(value)] : (Object.prototype.hasOwnProperty.call(vm, '*') ? vm['*'] : value);
    if (JSON.stringify(hit.value) === JSON.stringify(value)) { report.props.unchanged++; continue; }
    sample((label || '?') + ' · ' + plain + ': ' + JSON.stringify(hit.value) + ' → ' + JSON.stringify(value));
    if (r.type === 'VARIANT') variants[hit.raw] = value;
    else others[hit.raw] = value;
    seen[plain] = true;
  }

  // `propDefaults` asserts a value for a property the snapshot does NOT carry.
  // It exists for the case where the update INVENTS a value: a property the old
  // component did not have at all, or one whose old value equalled the old
  // default and was therefore not recorded. Chip is exactly this — see
  // rules.json for the measurement.
  const defaults = (rule && rule.propDefaults) || {};
  for (const plain of Object.keys(defaults)) {
    if (seen[plain]) continue;
    const want = defaults[plain];
    const hit = byPlain['VARIANT|' + plain] || byPlain['BOOLEAN|' + plain] || byPlain['TEXT|' + plain];
    if (!hit) continue;
    if (JSON.stringify(hit.value) === JSON.stringify(want)) continue;
    sample((label || '?') + ' · ' + plain + ' (asserted): ' + JSON.stringify(hit.value) + ' → ' + JSON.stringify(want));
    if (hit.type === 'VARIANT') variants[hit.raw] = want;
    else others[hit.raw] = want;
  }
  return { variants, others, missing, matched };
}

async function applyProps(inst, recorded, label, rule) {
  const { variants, others, missing } = mapProps(inst, recorded, rule, label);
  for (const m of missing) note(report.props.noSuchProperty, label + ' → ' + m);
  const count = Object.keys(variants).length + Object.keys(others).length;
  if (!count) return 0;
  if (!DRY_RUN) {
    if (Object.keys(variants).length) inst.setProperties(variants);
    if (Object.keys(others).length) inst.setProperties(others);
    report.mutatedNodeIds.push(inst.id);
  }
  report.props.written += count;
  return count;
}

async function loadFontsOf(node) {
  try {
    const segs = node.getStyledTextSegments(['fontName']);
    for (const s of segs) await figma.loadFontAsync(s.fontName);
  } catch (e) {
    if (node.fontName && node.fontName !== figma.mixed) await figma.loadFontAsync(node.fontName);
  }
}

// A value driven by a component property must be written as the PROPERTY on the
// owning instance — a direct layer write is overwritten by the property value.
async function writeThroughProperty(node, field, value) {
  const ref = node.componentPropertyReferences && node.componentPropertyReferences[field];
  if (!ref) return null;
  const owner = ownerForProperty(node, plainOf(ref));
  if (!owner) return null;
  const current = owner.inst.componentProperties[owner.raw];
  if (current && JSON.stringify(current.value) === JSON.stringify(value)) return 'same';
  if (!DRY_RUN) { owner.inst.setProperties({ [owner.raw]: value }); report.mutatedNodeIds.push(owner.inst.id); }
  return 'written';
}

async function writeField(node, field, value, label, rule) {
  try {
    if (field === 'annotations') {
      const want = sanitizeAnnotations(value);
      if (annotationKey(node.annotations) === annotationKey(want)) return false;
      if (!DRY_RUN) { node.annotations = want; report.mutatedNodeIds.push(node.id); }
      return true;
    }
    if (field === 'characters' || field === 'visible') {
      const through = await writeThroughProperty(node, field, value);
      if (through) return through === 'written';
      if (!(field in node) || node[field] === value) return false;
      if (!DRY_RUN) {
        if (field === 'characters') await loadFontsOf(node);
        node[field] = value;
        report.mutatedNodeIds.push(node.id);
      }
      return true;
    }
    if (field === 'componentProperties') {
      if (node.type !== 'INSTANCE') return false;
      return (await applyProps(node, value, label, rule)) > 0;
    }
    if (field === 'mainComponent') {
      if (node.type !== 'INSTANCE' || !value || !value.key) return false;
      const current = await node.getMainComponentAsync();
      if (current && current.key === value.key) return false;
      if (!DRY_RUN) {
        const comp = await figma.importComponentByKeyAsync(value.key);
        node.swapComponent(comp);
        report.mutatedNodeIds.push(node.id);
      }
      return true;
    }
    if (field === 'boundVariables') {
      let any = false;
      for (const f of Object.keys(value)) {
        const entry = value[f];
        const list = Array.isArray(entry) ? entry : [entry];

        // Colour bindings cannot go through setBoundVariable — Figma rejects it
        // with "fills and strokes variable bindings must be set on the paint".
        // They have to be bound on the paint object, which setBoundVariableForPaint
        // returns as a NEW paint that must be reassigned.
        if (f === 'fills' || f === 'strokes') {
          if (!(f in node) || node[f] === figma.mixed) continue;
          const bound = node.boundVariables && node.boundVariables[f];
          const paints = JSON.parse(JSON.stringify(node[f]));
          let touched = false;
          for (let i = 0; i < list.length; i++) {
            const v = list[i];
            if (!v || !v.key || !paints[i]) continue;
            // Already bound to something on this paint slot — leave it alone.
            if (bound && bound[i] && bound[i].id) continue;
            if (!DRY_RUN) {
              const variable = await figma.variables.importVariableByKeyAsync(v.key);
              paints[i] = figma.variables.setBoundVariableForPaint(paints[i], 'color', variable);
            }
            touched = true;
          }
          if (touched) { if (!DRY_RUN) { node[f] = paints; report.mutatedNodeIds.push(node.id); } any = true; }
          continue;
        }

        const bound = node.boundVariables && node.boundVariables[f];
        for (const v of list) {
          if (!v || !v.key) continue;
          if (bound && (Array.isArray(bound) ? bound.length : bound.id)) continue; // already bound
          if (!DRY_RUN) {
            const variable = await figma.variables.importVariableByKeyAsync(v.key);
            node.setBoundVariable(f, variable);
            report.mutatedNodeIds.push(node.id);
          }
          any = true;
        }
      }
      return any;
    }
    if (field === 'reactions') {
      if (!('reactions' in node)) return false;
      if (JSON.stringify(node.reactions) === JSON.stringify(value)) return false;
      if (!DRY_RUN) { await node.setReactionsAsync(value); report.mutatedNodeIds.push(node.id); }
      return true;
    }
    if (field === 'fillStyleId' || field === 'strokeStyleId' || field === 'textStyleId' || field === 'effectStyleId') {
      if (!(field in node) || node[field] === figma.mixed || node[field] === value) return false;
      if (!DRY_RUN) {
        if (field === 'fillStyleId') await node.setFillStyleIdAsync(value);
        else if (field === 'strokeStyleId') await node.setStrokeStyleIdAsync(value);
        else if (field === 'textStyleId') await node.setTextStyleIdAsync(value);
        else await node.setEffectStyleIdAsync(value);
        report.mutatedNodeIds.push(node.id);
      }
      return true;
    }
    if (field === 'fills' || field === 'strokes' || field === 'opacity') {
      if (!(field in node) || node[field] === figma.mixed) return false;
      if (JSON.stringify(node[field]) === JSON.stringify(value)) return false;
      if (!DRY_RUN) { node[field] = value; report.mutatedNodeIds.push(node.id); }
      return true;
    }
    return false; // size / name / layout are never written
  } catch (e) {
    const k = field + ': ' + String(e && e.message ? e.message : e).slice(0, 80);
    report.fieldsFailed[k] = (report.fieldsFailed[k] || 0) + 1;
    return false;
  }
}

// --------------------------------------------------------------- apply rules

// The path a rule points at, or null when the rule says the layer is gone.
// Returns undefined when no rule applies. `collapse` and `renames` COMPOSE: a
// deleted owner drops its own segment from the path AND may rename what is
// underneath it.
//
// It returns indexes as well as names. The PREFIX of a remapped path still
// describes the same nodes as the original, so its recorded indexes are still
// valid and must be carried — without them the walk hits a parent holding ten
// layers called `Chip`, finds the name ambiguous and gives up. Only the renamed
// tail gets -1 (resolve by unique name).
function rulePath(entry, rule) {
  if (!rule) return undefined;
  const ownerPathKey = entry.ownerPath.join(' / ');
  const prefixLen = entry.fullPath.length - entry.ownerPath.length;
  let prefix = entry.fullPath.slice(0, prefixLen);
  let prefixIdx = entry.fullIdx ? entry.fullIdx.slice(0, prefixLen) : [];
  let tail = entry.ownerPath;
  let tailIdx = entry.fullIdx ? entry.fullIdx.slice(prefixLen) : [];
  const hasRename = rule.renames && Object.prototype.hasOwnProperty.call(rule.renames, ownerPathKey);
  if (!rule.collapse && !hasRename) return undefined;
  if (rule.collapse) {
    // The owner component itself is gone, so its own segment leaves the path.
    prefix = prefix.slice(0, -1);
    prefixIdx = prefixIdx.slice(0, -1);
  }
  if (hasRename) {
    const to = rule.renames[ownerPathKey];
    if (to === null) return null; // no successor — report, never guess
    tail = to === '' ? [] : to.split(' / ');
    tailIdx = tail.map(() => -1);
  }
  return { path: prefix.concat(tail), idx: prefixIdx.concat(tailIdx) };
}

// A fallback match is only accepted when the candidate is still the same KIND of
// node: same node type, and for an instance the same main component. Without
// that check, a blind index fallback writes one layer's values onto whatever now
// sits in that slot — exactly the restructured case where it is most likely to
// be a different component.
async function sameIdentity(node, entry) {
  if (!node || node.type !== entry.type) return false;
  if (node.type !== 'INSTANCE') return true;
  const wantKey = keyAt(entry.self === undefined ? -1 : entry.self);
  if (!wantKey) return true;
  const mc = await node.getMainComponentAsync();
  if (!mc) return false;
  const set = mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : null;
  return (set ? set.key : mc.key) === wantKey;
}

// Rules are a FALLBACK, never an override. A rule derived from the library's
// variant union can be wrong for the variant an instance actually uses — the
// `#️⃣ ActionBar: Button → Primary` rule was, and it broke paths that already
// resolved. So: the recorded path first, then the rule, then the guarded index.
//
// Every step passes `entry.fullIdx`, because the index is what distinguishes
// identically-named siblings. Dropping it is what corrupted six pages.
async function resolveTarget(inst, entry, rule) {
  const exact = resolvePath(inst, entry.fullPath, entry.fullIdx, 'exact');
  if (exact) return { node: exact, via: 'original' };

  const mapped = rulePath(entry, rule);
  if (mapped === null) return { node: null, via: 'ruleSaysGone' };
  if (mapped) {
    const byRule = resolvePath(inst, mapped.path, mapped.idx, 'exact');
    if (byRule) return { node: byRule, via: 'rule', path: mapped.path };
  }

  const byIndex = resolvePath(inst, entry.fullPath, entry.fullIdx, 'byIndex');
  if (byIndex && (await sameIdentity(byIndex, entry))) return { node: byIndex, via: 'index' };
  return { node: null, via: 'unmatched' };
}

// componentProperties first (a variant switch rebuilds everything under it),
// annotations last.
const FIELD_ORDER = ['componentProperties', 'mainComponent', 'characters', 'visible',
  'fills', 'strokes', 'fillStyleId', 'strokeStyleId', 'textStyleId', 'effectStyleId',
  'opacity', 'boundVariables', 'reactions', 'annotations'];
function orderedFields(values) {
  const keys = Object.keys(values);
  return FIELD_ORDER.filter((f) => keys.indexOf(f) !== -1);
}

// ------------------------------------------------------------------ the pass

async function restorePage(pageId) {
page = await figma.getNodeByIdAsync(pageId);
if (!page || page.type !== 'PAGE') return { pageId, error: 'not a page' };
await figma.setCurrentPageAsync(page);

let holder = null;
for (const c of page.children) if (c.name === FRAME_NAME) holder = c;
if (!holder) return { page: page.name.replace(/\s+/g, ' ').trim(), skipped: 'no snapshot frame on this page' };

const parts = [];
for (const t of holder.children) {
  if (t.type === 'TEXT' && /^dsmig1_\d+$/.test(t.name)) parts.push([Number(t.name.split('_')[1]), t.characters]);
}
parts.sort((a, b) => a[0] - b[0]);
snapshot = JSON.parse(parts.map((p) => p[1]).join(''));
if (snapshot.version !== 3) return { page: page.name, error: 'snapshot version ' + snapshot.version + ' — this is the v3 restore' };
COMPS = snapshot.comps || [];
report = freshReport();

for (const rec of snapshot.instances) {
  const inst = await figma.getNodeByIdAsync(rec.id);
  if (!inst || inst.type !== 'INSTANCE') { report.instances.missing++; continue; }
  report.instances.found++;

  const mc = await inst.getMainComponentAsync();
  const set = mc && mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : null;
  const nowKey = mc ? (set ? set.key : mc.key) : null;
  const wasKey = keyAt(rec.comp);
  if (wasKey && nowKey && nowKey !== wasKey) report.instances.componentChanged++;

  // 1 + 2: the instance's own properties.
  if (Object.keys(rec.props).length) {
    await applyProps(inst, rec.props, nameAt(rec.comp) || rec.name, ruleAt(rec.comp));
  }

  // 3: sub-layer overrides.
  for (const entry of rec.entries) {
    const ownerRule = ruleAt(entry.owner);
    const selfRule = ruleAt(entry.self === undefined ? -1 : entry.self);
    const label = nameAt(entry.owner) || rec.name;

    if (entry.root) {
      for (const f of orderedFields(entry.values)) {
        const wrote = await writeField(inst, f, entry.values[f], label, ruleAt(rec.comp));
        if (wrote) report.entries.applied++; else report.entries.alreadyCorrect++;
      }
      continue;
    }

    // The wrapper that held these properties is gone: write them to the
    // instance that replaced it (Chip's deleted `#️⃣ Content`).
    const lift = ownerRule && ownerRule.liftProps &&
      ownerRule.liftProps.indexOf(entry.ownerPath.join(' / ')) !== -1 &&
      entry.values.componentProperties;
    if (lift) {
      const ownerPrefixLen = entry.fullPath.length - entry.ownerPath.length;
      const ownerNode = ownerPrefixLen > 0
        ? resolvePath(inst, entry.fullPath.slice(0, ownerPrefixLen), entry.fullIdx.slice(0, ownerPrefixLen), 'exact')
        : inst;
      if (ownerNode && ownerNode.type === 'INSTANCE') {
        const n = await applyProps(ownerNode, entry.values.componentProperties, label + ' (lifted)', ownerRule);
        report.entries.lifted++;
        if (n) report.entries.applied++; else report.entries.alreadyCorrect++;
        // Anything else recorded on the dead wrapper has no home — report it.
        const rest = orderedFields(entry.values).filter((f) => f !== 'componentProperties');
        if (rest.length) note(report.entries.unrecoverable, label + ' → ' + entry.ownerPath.join(' / ') + ' [' + rest.join(',') + ']');
        continue;
      }
    }

    const target = await resolveTarget(inst, entry, ownerRule);
    if (!target.node) {
      const where = label + ' → ' + entry.ownerPath.join(' / ') + ' [' + orderedFields(entry.values).join(',') + ']';
      if (target.via === 'ruleSaysGone') note(report.entries.unrecoverable, where);
      else note(report.entries.unmatched, where);
      continue;
    }
    if (target.via === 'rule') report.entries.viaRule++;
    if (target.via === 'index') {
      report.entries.viaIndex++;
      note(report.entries.indexFallback, label + ' → ' + entry.fullPath.join(' / ') + ' ⇒ ' + target.node.name);
    }

    for (const f of orderedFields(entry.values)) {
      const wrote = await writeField(target.node, f, entry.values[f], label, selfRule);
      if (wrote) {
        report.entries.applied++;
        if (f !== 'componentProperties') sample(label + ' · ' + f + ' on ' + target.node.name + ' (' + target.via + ')');
      } else report.entries.alreadyCorrect++;
    }
  }
}

// 4: annotations recorded by the direct sweep (covers plain frames and text).
for (const a of snapshot.annotatedNodes) {
  let node = null;
  if (a.topInstanceId) {
    const inst = await figma.getNodeByIdAsync(a.topInstanceId);
    if (inst) node = a.path.length ? resolvePath(inst, a.path, a.pathIdx, 'exact') : inst;
  }
  // Fall back to the node's own recorded id. A layer the update did not
  // re-create still has it — slot content in particular, whose path can no
  // longer be walked because the slot is now a SLOT node with no children to
  // traverse. A stale id simply resolves to nothing.
  if (!node) node = await figma.getNodeByIdAsync(a.nodeId);
  if (!node || !('annotations' in node)) {
    report.annotations.unmatched++;
    note(report.entries.unmatched, 'annotation on ' + a.nodeName + ' → ' + a.path.join(' / '));
    continue;
  }
  const want = sanitizeAnnotations(a.annotations);
  if (annotationKey(node.annotations) === annotationKey(want)) { report.annotations.alreadyCorrect++; continue; }
  try {
    if (!DRY_RUN) { node.annotations = want; report.mutatedNodeIds.push(node.id); }
    report.annotations.applied++;
  } catch (e) {
    const k = 'annotations: ' + String(e && e.message ? e.message : e).slice(0, 80);
    report.fieldsFailed[k] = (report.fieldsFailed[k] || 0) + 1;
  }
}

report.mutatedNodeIds = Array.from(new Set(report.mutatedNodeIds)).slice(0, 20);
return report;
}

const results = [];
for (const id of PAGE_IDS) results.push(await restorePage(id));
return { dryRun: DRY_RUN, pages: results };
