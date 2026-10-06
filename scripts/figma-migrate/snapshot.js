// DS migration — STEP 1: snapshot  (v3, 2026-10-03 redo)
//
// Run with use_figma BEFORE accepting the library update. Replace __PAGE_IDS__
// with an array of page ids. Several pages per call do work (it is the same
// file-load each time), but keep heavy pages (2,000+ instances) in groups of
// one or two — the MCP connection drops on long calls. Every pass is
// idempotent: it replaces that page's snapshot frame, so a retry is safe.
//
// Records CONTENT ONLY — the set the restore is allowed to write:
//   component property values (where all copy and all icon names live),
//   annotations, variable bindings, prototype reactions, fills / strokes and
//   style ids, and visibility.
//
// Deliberately NOT recorded (see restore.js for the long version):
//   - width / height / size — derived from content, and writing them back means
//     resize(), which forces FIXED sizing and destroys hug/fill.
//   - name — cosmetic noise.
//   - every layout field (padding, itemSpacing, axis sizing, align, grow …) —
//     also derived, and restoring layout is out of scope for this migration.
//   Anything not captured is COUNTED in `fieldsNotCaptured`, never silently
//   dropped, so the report says what was passed over.
//
// Also skipped: overrides whose owning component is LOCAL to the design file.
// A library update only replaces REMOTE components, so a local owner's layer
// ids do not change and its overrides cannot break. On the table pages this is
// most of the volume (TextCell, LinkCell, BadgesCell are all local). Counted as
// `localOwnerSkipped`.
//
// Each override entry is stored twice over:
//   fullPath + fullIdx — from the stable top-level instance down to the layer.
//                        The index is part of the key: identically-named
//                        siblings are everywhere.
//   owner / self       — indexes into `comps`, the page's component legend.
//                        `owner` is the component that DEFINES where the layer
//                        sits (restore.js looks its rule up by key); `self` is
//                        the layer's own component when it is an instance.
//
// The snapshot is written as chunked text layers inside a locked frame named
// "⚙ DS snapshot (dsmig1)", parked to the right of the page content, so the data
// never travels through chat. (pluginData is not available via the MCP sandbox.)
// Delete each page's frame as soon as that page's restore is checked — the v1
// snapshots pushed this file to 95% memory.

const PAGE_IDS = __PAGE_IDS__;
const FRAME_NAME = '⚙ DS snapshot (dsmig1)';
const CHUNK = 40000;

// The only fields the restore knows how to write back.
//
// `annotations` is deliberately NOT here: the dedicated sweep at the end of the
// page records every annotation with its own path, and recording them as
// override values as well meant storing ~60 empty `annotations: []` arrays per
// page and risking writing one of those over an annotation added later.
const CONTENT = new Set([
  'componentProperties', 'characters', 'mainComponent', 'visible', 'opacity',
  'boundVariables', 'reactions', 'fills', 'strokes',
  'fillStyleId', 'strokeStyleId', 'textStyleId', 'effectStyleId',
]);

function clone(v) {
  try { return JSON.parse(JSON.stringify(v)); } catch (e) { return null; }
}

// Figma suffixes a non-variant property name with "#<id>", so strip only the
// LAST "#..." segment. Splitting on the first "#" is wrong and dangerous: the
// Icon component has three distinct properties named `iconName`, `iconName#`
// and `iconName##`, which all collapse to "iconName" under a naive split and
// then overwrite each other.
function plainName(rawKey) {
  const s = String(rawKey);
  const i = s.lastIndexOf('#');
  return i > 0 ? s.slice(0, i) : s;
}

// `plain` is NOT stored — restore.js recomputes it with the same rule.
//
// `defaults` (the owning component's componentPropertyDefinitions) drops every
// property that is still sitting at its default. `componentProperties` reports
// the CURRENT value of every property, overridden or not, so without this the
// snapshot carries mostly values nobody customised — on the Jobs page that was
// most of its 355 KB. It is also the correct behaviour, not just smaller: a
// property at the old default should adopt the NEW default after the update,
// which is the whole point of accepting it.
function serializeProps(props, defaults, stats) {
  const out = {};
  if (!props) return out;
  for (const raw of Object.keys(props)) {
    const p = props[raw];
    const def = defaults ? defaults[raw] : undefined;
    if (def !== undefined && JSON.stringify(def) === JSON.stringify(p.value)) {
      if (stats) stats.atDefault++;
      continue;
    }
    out[raw] = { type: p.type, value: p.value };
  }
  return out;
}

// Variable bindings have to travel as variable KEYS: a library update changes
// variable ids, but keys are stable.
async function serializeBoundVariables(node) {
  const bv = node.boundVariables;
  if (!bv) return null;
  const out = {};
  for (const field of Object.keys(bv)) {
    const entry = bv[field];
    const list = Array.isArray(entry) ? entry : [entry];
    const resolved = [];
    for (const alias of list) {
      if (!alias || !alias.id) { resolved.push(null); continue; }
      try {
        const v = await figma.variables.getVariableByIdAsync(alias.id);
        resolved.push(v ? { key: v.key, name: v.name } : null);
      } catch (e) { resolved.push(null); }
    }
    out[field] = Array.isArray(entry) ? resolved : resolved[0];
  }
  return Object.keys(out).length ? out : null;
}

async function readFields(node, fields, skipped, defaultsOf, stats) {
  const values = {};
  for (const f of fields) {
    if (!CONTENT.has(f)) { skipped[f] = (skipped[f] || 0) + 1; continue; }
    try {
      if (f === 'annotations') {
        if ('annotations' in node) values.annotations = clone(node.annotations) || [];
      } else if (f === 'characters') {
        if ('characters' in node) values.characters = node.characters;
      } else if (f === 'componentProperties') {
        if (node.type === 'INSTANCE') {
          const props = serializeProps(node.componentProperties, await defaultsOf(node), stats);
          if (Object.keys(props).length) values.componentProperties = props;
        }
      } else if (f === 'mainComponent') {
        if (node.type === 'INSTANCE') {
          const mc = await node.getMainComponentAsync();
          values.mainComponent = mc ? { key: mc.key, name: mc.name } : null;
        }
      } else if (f === 'boundVariables') {
        const bv = await serializeBoundVariables(node);
        if (bv) values.boundVariables = bv;
      } else if (f === 'reactions') {
        if ('reactions' in node) values.reactions = clone(node.reactions) || [];
      } else if (f === 'fills' || f === 'strokes') {
        if (f in node && node[f] !== figma.mixed) values[f] = clone(node[f]);
      } else if (f === 'fillStyleId' || f === 'strokeStyleId' || f === 'textStyleId' || f === 'effectStyleId') {
        if (f in node && node[f] !== figma.mixed) values[f] = node[f];
      } else if (f === 'visible' || f === 'opacity') {
        if (f in node) values[f] = node[f];
      }
    } catch (e) {
      skipped[f + '(error)'] = (skipped[f + '(error)'] || 0) + 1;
    }
  }
  return values;
}

function namePath(node, stopId) {
  const names = [];
  const idx = [];
  let n = node;
  let guard = 0;
  while (n && n.id !== stopId && guard++ < 60) {
    names.unshift(n.name);
    idx.unshift(n.parent && 'children' in n.parent ? n.parent.children.indexOf(n) : -1);
    n = n.parent;
  }
  return { names, idx };
}

function topInstanceOf(node) {
  let top = null;
  let n = node;
  while (n && n.type !== 'PAGE') {
    if (n.type === 'INSTANCE') top = n;
    n = n.parent;
  }
  return top;
}

// ------------------------------------------------------------------ one page

async function snapshotPage(pageId) {
  const page = await figma.getNodeByIdAsync(pageId);
  if (!page || page.type !== 'PAGE') return { pageId, error: 'not a page' };
  await figma.setCurrentPageAsync(page);

  // The 40-character component key and its name would repeat on every entry.
  // One legend per page + a small integer per entry keeps the snapshot small.
  const comps = [];
  const compIndex = new Map();
  async function compRef(inst) {
    const mc = await inst.getMainComponentAsync();
    if (!mc) return -1;
    const set = mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : null;
    const key = set ? set.key : mc.key;
    if (compIndex.has(key)) return compIndex.get(key);
    const i = comps.length;
    comps.push({ key, name: set ? set.name : mc.name, remote: mc.remote });
    compIndex.set(key, i);
    return i;
  }

  // ------------------------------------------------- the at-risk measurement
  //
  // `importComponentSetByKeyAsync` resolves the PUBLISHED component — the
  // version this file is about to receive — while the file's own instances still
  // show the old one. So the snapshot can ask, per override, whether the update
  // can actually break it, and record only those. Everything else would restore
  // as a no-op, and storing it is what pushed this file to 95% memory on the
  // first attempt.
  //
  // An override is AT RISK when any of these holds:
  //   - its owning component no longer resolves (deleted from the library),
  //   - its layer path is absent from the published component's path union,
  //     and the path does not start in one of that component's SLOTs (slot
  //     content lives in the instance, so the update does not touch it),
  //   - it carries component properties and any recorded RAW property key is
  //     absent from the published definitions — the raw key carries the
  //     definition id, so this is exactly the "deleted and re-added, every
  //     instance falls back to the default" case,
  //   - a recorded VARIANT value is no longer one of that property's options.
  // A key that fails to import is treated as at risk UNLESS its main component
  // is local to this file, because a local component cannot be imported by key
  // and is never touched by a library update.
  const published = new Map();
  async function publishedOf(key) {
    if (published.has(key)) return published.get(key);
    let node = null;
    let kind = null;
    try { node = await figma.importComponentSetByKeyAsync(key); kind = 'SET'; }
    catch (e1) {
      try { node = await figma.importComponentByKeyAsync(key); kind = 'COMP'; }
      catch (e2) { published.set(key, null); return null; }
    }
    const paths = new Set();
    const walk = (n, trail) => {
      if (!('children' in n)) return;
      for (const c of n.children) {
        const t = trail.concat([c.name]);
        paths.add(t.join(' / '));
        if (c.type !== 'INSTANCE') walk(c, t); // stop at nested instances
      }
    };
    if (kind === 'SET') { for (const v of node.children) walk(v, []); } else { walk(node, []); }
    const defs = new Map();
    const slots = new Set();
    try {
      const d = node.componentPropertyDefinitions;
      for (const k of Object.keys(d)) {
        defs.set(k, d[k].variantOptions || null);
        if (d[k].type === 'SLOT') slots.add(plainName(k));
      }
    } catch (e) { /* leave empty: the property test then reports at risk */ }
    const info = { name: node.name, paths, defs, slots };
    published.set(key, info);
    return info;
  }

  // Will this layer still be where the override says it is?
  async function pathAtRisk(ownerComp, ownerPath) {
    if (!ownerComp) return true;
    if (!ownerComp.remote) return false; // local owner — the update cannot touch it
    const pub = await publishedOf(ownerComp.key);
    if (!pub) return true; // the owning component is gone from the library
    if (!ownerPath.length) return false; // the instance's own node id is stable
    if (pub.paths.has(ownerPath.join(' / '))) return false;
    if (pub.slots.has(ownerPath[0])) return false; // slot content lives in the instance
    return true;
  }

  // The subset of recorded property values the update would reset.
  async function riskyPropsOf(props, selfKey) {
    const out = {};
    if (!props || !Object.keys(props).length) return out;
    const pub = selfKey ? await publishedOf(selfKey) : null;
    if (!pub) return props; // cannot verify — keep all of them
    for (const raw of Object.keys(props)) {
      const p = props[raw];
      if (!pub.defs.has(raw)) { out[raw] = p; continue; } // id changed, or gone
      const opts = pub.defs.get(raw);
      if (p.type === 'VARIANT' && opts && opts.indexOf(String(p.value)) === -1) out[raw] = p;
    }
    return out;
  }

  // Property defaults of the component an instance comes from, cached. Read off
  // the component SET when there is one — reading componentPropertyDefinitions
  // from a variant throws. A failure just means no filtering.
  const defaultsCache = new Map();
  async function defaultsOf(inst) {
    const mc = await inst.getMainComponentAsync();
    if (!mc) return null;
    const set = mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : null;
    const owner = set || mc;
    if (defaultsCache.has(owner.id)) return defaultsCache.get(owner.id);
    let map = null;
    try {
      const defs = owner.componentPropertyDefinitions;
      map = {};
      for (const k of Object.keys(defs)) map[k] = defs[k].defaultValue;
    } catch (e) { map = null; }
    defaultsCache.set(owner.id, map);
    return map;
  }
  const propStats = { atDefault: 0 };

  const allInstances = page.findAllWithCriteria({ types: ['INSTANCE'] });
  const records = new Map(); // top-level instance id -> record
  const skipped = {};
  const seenOverride = new Set();
  let entryCount = 0;
  let slotProps = 0;
  let localOwnerSkipped = 0;
  let localPropsSkipped = 0;
  let safeSkipped = 0;
  const atRiskPairs = {};

  async function recordFor(top) {
    if (records.has(top.id)) return records.get(top.id);
    const ref = await compRef(top);
    const comp = ref >= 0 ? comps[ref] : null;
    // Properties of a LOCAL component cannot break: the update does not touch
    // its property definitions.
    let props = {};
    if (comp && comp.remote) {
      props = await riskyPropsOf(serializeProps(top.componentProperties, await defaultsOf(top), propStats), comp.key);
      for (const k of Object.keys(props)) if (props[k].type === 'SLOT') slotProps++;
    } else if (comp) {
      localPropsSkipped++;
    }
    const rec = {
      id: top.id,
      name: top.name,
      comp: ref,
      props,
      where: namePath(top, page.id).names,
      entries: [],
    };
    records.set(top.id, rec);
    return rec;
  }

  for (const inst of allInstances) {
    const top = topInstanceOf(inst) || inst;
    for (const o of inst.overrides) {
      if (seenOverride.has(o.id)) continue;
      seenOverride.add(o.id);
      const node = await figma.getNodeByIdAsync(o.id);
      if (!node) continue;

      if (node.id === top.id) {
        // Override on the top-level instance itself. Its node id is stable, so
        // only its property VALUES can be reset — and those are already covered
        // by `rec.props`, which is filtered the same way.
        continue;
      }

      // The owner is the nearest ancestor instance STRICTLY above the node —
      // the component whose structure defines where this layer sits.
      let owner = null;
      let p = node.parent;
      while (p && p.type !== 'PAGE') {
        if (p.type === 'INSTANCE') { owner = p; break; }
        p = p.parent;
      }
      const ownerRef = owner ? await compRef(owner) : -1;
      const ownerComp = ownerRef >= 0 ? comps[ownerRef] : null;
      if (ownerComp && !ownerComp.remote) { localOwnerSkipped++; continue; }

      const values = await readFields(node, o.overriddenFields, skipped, defaultsOf, propStats);
      if (!Object.keys(values).length) continue;

      const ownerPath = owner ? namePath(node, owner.id).names : [];
      // The node's OWN component, when it is an instance. Three uses: property
      // renames belong to this component, a fallback match is only accepted
      // when the candidate's key still agrees with it, and the property test
      // below asks what the published version of THIS component declares.
      const selfRef = node.type === 'INSTANCE' ? await compRef(node) : -1;
      const selfKey = selfRef >= 0 ? comps[selfRef].key : null;

      // Keep only what the update can actually break. A broken PATH takes the
      // whole entry with it; an intact path means only property values can
      // reset, so only those are kept.
      let keep = null;
      if (await pathAtRisk(ownerComp, ownerPath)) {
        keep = values;
      } else if (values.componentProperties) {
        const risky = await riskyPropsOf(values.componentProperties, selfKey);
        if (Object.keys(risky).length) keep = { componentProperties: risky };
      }
      if (!keep) { safeSkipped++; continue; }

      const label = (ownerComp ? ownerComp.name : '?') + ' → ' + ownerPath.join(' / ');
      atRiskPairs[label] = (atRiskPairs[label] || 0) + 1;

      const rec = await recordFor(top);
      const full = namePath(node, top.id);
      rec.entries.push({
        root: false,
        fullPath: full.names,
        fullIdx: full.idx,
        owner: ownerRef,
        self: selfRef,
        ownerPath,
        type: node.type,
        values: keep,
      });
      entryCount++;
    }
  }

  // Drop records that ended up with nothing worth restoring.
  for (const [id, rec] of Array.from(records.entries())) {
    if (!rec.entries.length && !Object.keys(rec.props).length) records.delete(id);
  }

  // Annotations also show up as an override field, but sweeping for them
  // directly catches the ones on plain frames and text outside any instance.
  const annotated = page.findAll((n) => 'annotations' in n && n.annotations.length > 0);
  const annotations = [];
  for (const node of annotated) {
    const top = topInstanceOf(node);
    const rel = top ? namePath(node, top.id) : namePath(node, page.id);
    annotations.push({
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      topInstanceId: top ? top.id : null,
      path: rel.names,
      pathIdx: rel.idx,
      annotations: clone(node.annotations) || [],
    });
  }

  const categories = await figma.annotations.getAnnotationCategoriesAsync();
  const snapshot = {
    version: 3,
    takenAt: new Date().toISOString(),
    pageId: page.id,
    pageName: page.name,
    annotationCategories: categories.map((c) => ({ id: c.id, label: c.label })),
    comps,
    instances: Array.from(records.values()),
    annotatedNodes: annotations,
  };

  const json = JSON.stringify(snapshot);
  const chunks = [];
  for (let i = 0; i < json.length; i += CHUNK) chunks.push(json.slice(i, i + CHUNK));

  // Also the leftover sweep: any older snapshot frame on this page goes, so a
  // stale one can never be read back by the restore.
  const removedStale = [];
  for (const old of page.children.slice()) {
    if (old.name === FRAME_NAME) { old.locked = false; removedStale.push(old.id); old.remove(); }
  }

  // Nothing to restore on this page — do not leave a frame behind at all.
  if (!records.size && !annotations.length) {
    return {
      pageId: page.id,
      pageName: page.name.replace(/\s+/g, ' ').trim(),
      skipped: 'nothing to snapshot',
      instancesTotal: allInstances.length,
      localOwnerSkipped,
      removedStale,
    };
  }

  let right = 0;
  let topY = 0;
  for (const c of page.children) {
    if ('x' in c) { right = Math.max(right, c.x + c.width); topY = Math.min(topY, c.y); }
  }

  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  const holder = figma.createAutoLayout('VERTICAL', { name: FRAME_NAME, itemSpacing: 8 });
  page.appendChild(holder);
  holder.x = right + 2000;
  holder.y = topY;
  holder.paddingLeft = 16; holder.paddingRight = 16;
  holder.paddingTop = 16; holder.paddingBottom = 16;

  const header = figma.createText();
  holder.appendChild(header);
  header.name = 'dsmig1_meta';
  header.characters =
    'DS migration snapshot — do not edit or delete until restore.js has run.\n' +
    'page: ' + page.name + '\ntaken: ' + snapshot.takenAt + '\n' +
    chunks.length + ' chunk(s), ' + json.length + ' bytes';

  for (let i = 0; i < chunks.length; i++) {
    const t = figma.createText();
    holder.appendChild(t);
    t.resize(600, 40);
    t.textAutoResize = 'HEIGHT';
    t.fontSize = 6;
    t.characters = chunks[i];
    t.name = 'dsmig1_' + i;
  }
  holder.locked = true;

  return {
    pageId: page.id,
    pageName: page.name.replace(/\s+/g, ' ').trim(),
    snapshotFrameId: holder.id,
    bytes: json.length,
    chunks: chunks.length,
    instancesTotal: allInstances.length,
    topLevelInstancesRecorded: records.size,
    overrideEntries: entryCount,
    componentsSeen: comps.length,
    remoteComponents: comps.filter((c) => c.remote).length,
    annotatedNodes: annotations.length,
    annotatedInsideInstances: annotations.filter((a) => a.topInstanceId).length,
    slotProperties: slotProps,
    propsAtDefaultSkipped: propStats.atDefault,
    localOwnerSkipped,
    localPropsSkipped,
    safeSkipped,
    atRiskPairs,
    componentsResolved: published.size,
    componentsUnresolved: Array.from(published.keys()).filter((k) => !published.get(k)).map((k) => k.slice(0, 8)),
    removedStale,
    fieldsNotCaptured: skipped,
  };
}

const results = [];
for (const id of PAGE_IDS) results.push(await snapshotPage(id));
return { pages: results, createdNodeIds: results.map((r) => r.snapshotFrameId).filter(Boolean) };
