// DS migration — SNAPSHOT for the "Job Details" file (N0cgcrhj7KhBovYXySJpqZ)
// Written 2026-10-04. Run with use_figma BEFORE the library update is accepted.
// Replace __PAGE_IDS__ with an array of page ids (one or two per call).
//
// This file differs from snapshot.js (the View-file RESTORE) because most of
// the work here is a REBUILD. It records three things:
//
//   A) groups + rows — the semantic content of every OLD ItemGroup and OLD
//      ListItem, recorded by MEANING (title / caption / avatar / right slot),
//      not by layer path, because the layers they live on are deleted by the
//      update and the new build keeps the same values in different places.
//      Anchored on the ItemGroup instance id, which is stable.
//   B) lostOverrides — every other override the update breaks, keyed on
//      (top-level instance id + layer name path + child index), for the
//      ordinary rule-mapped restore.
//   C) annotatedNodes — every annotation on the page.
//
// Stored as chunked text layers in a locked frame parked right of the content,
// because setPluginData is not available in the MCP sandbox.

const PAGE_IDS = __PAGE_IDS__;
const FRAME_NAME = '⚙ DS snapshot (jd1)';
const CHUNK = 40000;

const OLD = {
  listItem: '24753:151433',
  itemGroup: '24753:151529',
  groupLabel: '24731:27140',
  chip: '24753:157212',
};

const CONTENT = new Set([
  'componentProperties', 'characters', 'mainComponent', 'visible', 'opacity',
  'boundVariables', 'reactions', 'fills', 'strokes',
  'fillStyleId', 'strokeStyleId', 'textStyleId', 'effectStyleId',
]);

function clone(v) { try { return JSON.parse(JSON.stringify(v)); } catch (e) { return null; } }
function plainName(raw) { const s = String(raw); const i = s.lastIndexOf('#'); return i > 0 ? s.slice(0, i) : s; }
function namePath(node, stopId) {
  const names = []; const idx = []; let n = node; let g = 0;
  while (n && n.id !== stopId && g++ < 80) {
    names.unshift(n.name);
    idx.unshift(n.parent && 'children' in n.parent ? n.parent.children.indexOf(n) : -1);
    n = n.parent;
  }
  return { names, idx };
}

// ---------------------------------------------------------------- published
const published = new Map();
async function publishedOf(key) {
  if (published.has(key)) return published.get(key);
  let node = null, kind = null;
  try { node = await figma.importComponentSetByKeyAsync(key); kind = 'SET'; }
  catch (e1) {
    try { node = await figma.importComponentByKeyAsync(key); kind = 'COMP'; }
    catch (e2) { published.set(key, null); return null; }
  }
  const paths = new Set(); const slotPaths = new Set();
  const walk = (n, trail) => {
    if (!('children' in n)) return;
    for (const c of n.children) {
      const t = trail.concat([c.name]); const s = t.join(' / ');
      paths.add(s);
      if (c.type === 'SLOT') slotPaths.add(s);
      if (c.type !== 'INSTANCE') walk(c, t);
    }
  };
  if (kind === 'SET') { for (const v of node.children) walk(v, []); } else { walk(node, []); }
  const defs = new Map(); const slotProps = new Set();
  try {
    const d = node.componentPropertyDefinitions;
    for (const k of Object.keys(d)) { defs.set(k, d[k].variantOptions || null); if (d[k].type === 'SLOT') slotProps.add(plainName(k)); }
  } catch (e) { /* empty */ }
  const info = { name: node.name, kind, paths, slotPaths, defs, slotProps, key };
  published.set(key, info);
  return info;
}
function isSlotPrefix(pub, p) {
  for (let i = 1; i <= p.length; i++) if (pub.slotPaths.has(p.slice(0, i).join(' / '))) return true;
  return pub.slotProps.has(p[0]);
}
const ownerCache = new Map();
async function ownerOf(inst) {
  if (ownerCache.has(inst.id)) return ownerCache.get(inst.id);
  const mc = await inst.getMainComponentAsync();
  let r = null;
  if (mc) {
    const set = mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : null;
    const o = set || mc;
    r = { id: o.id, name: o.name, key: o.key, remote: !!mc.remote };
  }
  ownerCache.set(inst.id, r);
  return r;
}

// The top-down survival test (see IMPACT-job-details.md "Correction to the
// method"). Returns {v, at, breakOwnerId}.
async function verdictFor(node) {
  const chain = [];
  let n = node.parent;
  while (n && n.type !== 'PAGE') { if (n.type === 'INSTANCE') chain.push(n); n = n.parent; }
  if (node.type === 'INSTANCE') chain.unshift(node);
  let placedByDesigner = true;
  for (let j = chain.length - 1; j >= 0; j--) {
    const cur = chain[j];
    const ow = await ownerOf(cur);
    const pub = ow ? await publishedOf(ow.key) : null;
    if (!pub) {
      if (placedByDesigner) return { v: 'frozen', at: ow ? ow.name : '?' };
      return { v: 'LOST', at: (ow ? ow.name : '?') + ' (component gone)', breakOwnerId: ow ? ow.id : null };
    }
    if (j === 0) break;
    const child = chain[j - 1];
    const p = namePath(child, cur.id).names;
    if (isSlotPrefix(pub, p)) { placedByDesigner = true; continue; }
    placedByDesigner = false;
    if (!pub.paths.has(p.join(' / '))) return { v: 'LOST', at: pub.name + ' → ' + p.join(' / '), breakOwnerId: ow.id };
  }
  const anchor = chain.length ? chain[0] : null;
  if (!anchor) return { v: 'safe' };
  if (anchor.id === node.id) return { v: 'safe(self)' };
  const ow = await ownerOf(anchor);
  const pub = ow ? await publishedOf(ow.key) : null;
  if (!pub) return { v: 'frozen', at: ow ? ow.name : '?' };
  const p = namePath(node, anchor.id).names;
  if (!p.length) return { v: 'safe(self)' };
  if (pub.paths.has(p.join(' / '))) return { v: 'safe' };
  if (isSlotPrefix(pub, p)) return { v: 'safe(slot)' };
  return { v: 'LOST', at: pub.name + ' → ' + p.join(' / '), breakOwnerId: ow.id };
}

// ------------------------------------------------------- semantic row reader
const varKeyCache = new Map();
async function varKeyOf(alias) {
  if (!alias || !alias.id) return null;
  if (varKeyCache.has(alias.id)) return varKeyCache.get(alias.id);
  let r = null;
  try { const v = await figma.variables.getVariableByIdAsync(alias.id); if (v) r = { key: v.key, name: v.name }; }
  catch (e) { /* ignore */ }
  varKeyCache.set(alias.id, r);
  return r;
}
// A TEXT component property's variable binding lives on the PROPERTY ENTRY,
// not on node.boundVariables — this cost one wrong conclusion on 2026-10-04.
async function propBinding(inst, rawKey) {
  const e = (inst.componentProperties || {})[rawKey];
  if (!e || !e.boundVariables) return null;
  for (const k of Object.keys(e.boundVariables)) {
    const r = await varKeyOf(e.boundVariables[k].id ? e.boundVariables[k] : null);
    if (r) return r;
  }
  return null;
}
async function fillVarName(n) {
  const bv = n.boundVariables;
  if (bv && bv.fills && bv.fills[0]) { const r = await varKeyOf(bv.fills[0]); return r ? r.name : null; }
  return null;
}
const COLOR_BY_VAR = {
  'alias/text/text-strong': 'strong',
  'alias/text/text-subtle': 'subtle',
  'alias/text/text-placeholder': 'placeholder',
  'alias/text/text-warning': 'warning',
  'alias/text/text-error': 'error',
};
function firstVisible(node, name) {
  const hits = node.findAll((x) => x.name === name && x.visible !== false);
  return hits.length ? hits[0] : null;
}
// one text line of the old build -> {text, color}
async function readLine(block, name) {
  if (!block) return null;
  const part = firstVisible(block, name);
  if (!part || part.type !== 'INSTANCE') return null;
  const props = part.componentProperties || {};
  let text = null;
  for (const raw of Object.keys(props)) {
    if (props[raw].type === 'TEXT' && typeof props[raw].value === 'string') { text = props[raw].value; break; }
  }
  const t = part.findAll((x) => x.type === 'TEXT')[0];
  if (text == null && t) text = t.characters;
  const varName = t ? await fillVarName(t) : null;
  return { text: text, color: COLOR_BY_VAR[varName] || 'strong', fillVar: varName };
}
const AVATAR_VARIANT_MAP = {
  genericObject: 'generic', user: 'user', live: 'live', day: 'day', other: 'other',
  labor: 'labor', product: 'product', warning: 'warning', equipment: 'equipment',
};
const SLOT_RIGHT_MAP = {
  iconButton: 'iconButton', iconOpen: 'open', iconButtonContextMenu: 'iconButton',
  iconButtonRemove: 'iconButton', liveUserAvatar: 'avatar',
};
async function readIcon(scope) {
  if (!scope) return null;
  for (const ic of scope.findAll((x) => x.type === 'INSTANCE')) {
    const ow = await ownerOf(ic);
    if (!ow || ow.name !== 'Icon') continue;
    const p = ic.componentProperties || {};
    // `rotation` matters: the in-progress status icon is circle-half-stroke
    // turned 180°, and leaving it out lost that on every such row.
    return {
      iconName: p['iconName#2002:0'] ? p['iconName#2002:0'].value : null,
      iconVar: await propBinding(ic, 'iconName#2002:0'),
      pack: p.pack ? p.pack.value : null,
      style: p.style ? p.style.value : null,
      size: p.size ? p.size.value : null,
      rotation: p.rotation ? p.rotation.value : null,
      fill: await paintRecord(ic.findAll((x) => x.type === 'TEXT' && x.name === 'icon')[0]),
    };
  }
  return null;
}

// A paint plus its colour variable KEY (ids change across an update). Used for
// the status-avatar colours, which are direct overrides and were missed
// entirely by the first version of this reader.
async function paintRecord(node) {
  if (!node || !('fills' in node) || node.fills === figma.mixed || !node.fills || !node.fills.length) return null;
  const f = node.fills[0];
  let varRef = null;
  if (f.boundVariables && f.boundVariables.color) varRef = await varKeyOf(f.boundVariables.color);
  return { paint: clone(node.fills), variable: varRef };
}
async function readAvatar(slotLeft) {
  if (!slotLeft) return null;
  const wrapper = slotLeft.findAll((x) => x.type === 'INSTANCE' && x.visible !== false)[0];
  if (!wrapper) return null;
  const wp = wrapper.componentProperties || {};
  const oldVariant = wp.variant ? String(wp.variant.value) : null;
  // the Avatar<Type> instance, then the base Avatar inside it
  let typeComp = null, base = null;
  for (const inst of wrapper.findAll((x) => x.type === 'INSTANCE')) {
    const ow = await ownerOf(inst);
    if (!ow) continue;
    if (!typeComp && /^Avatar[A-Z]/.test(ow.name)) typeComp = { name: ow.name, props: {} };
    if (ow.name === 'Avatar' && !base) base = inst;
  }
  const out = {
    oldVariant: oldVariant,
    newVariant: AVATAR_VARIANT_MAP[oldVariant] || 'generic',
    typeComponent: typeComp ? typeComp.name : null,
    size: null, content: null, shape: null, letters: null, character: null, count: null,
    icon: null, imageFills: null, imageFillStyleId: null, imageFromLayer: null,
    typeProps: null, backgroundFill: null,
  };
  // The Avatar<Type> wrapper carries properties of its own — AvatarDay holds
  // `↳ day`, `↳ month` and `colorScheme`. Reading only the base Avatar lost
  // those on every day row (they all came back as the default "JAN 1").
  for (const inst of wrapper.findAll((x) => x.type === 'INSTANCE')) {
    const ow = await ownerOf(inst);
    if (!ow || !/^Avatar[A-Z]/.test(ow.name)) continue;
    const tp = inst.componentProperties || {};
    const rec = {};
    for (const k of Object.keys(tp)) if (tp[k].type !== 'SLOT') rec[k] = tp[k].value;
    out.typeProps = { component: ow.name, props: rec };
    break;
  }
  if (base) {
    const p = base.componentProperties || {};
    out.size = p.size ? p.size.value : null;
    out.content = p.content ? p.content.value : null;
    out.shape = p.shape ? p.shape.value : null;
    out.letters = p['↳ characters#23418:89'] ? p['↳ characters#23418:89'].value : null;
    out.character = p['↳ character#23418:0'] ? p['↳ character#23418:0'].value : null;
    out.count = p['↳ count#2529:2'] ? p['↳ count#2529:2'].value : null;
    out.icon = await readIcon(base);
    // The status avatars (form "In progress" / "Completed") carry amber / jade
    // as a DIRECT paint on the Background rectangle, not as a variant — the
    // first version only looked for image paints and lost every one of them.
    out.backgroundFill = await paintRecord(base.findAll((x) => x.type === 'RECTANGLE' && x.name === 'Background')[0]);
    // an image avatar keeps its picture as a paint on a rectangle inside
    for (const r of base.findAll((x) => x.type === 'RECTANGLE')) {
      const hasImage = r.fills && r.fills !== figma.mixed && r.fills.some((f) => f.type === 'IMAGE');
      const styled = r.fillStyleId && r.fillStyleId !== figma.mixed;
      if (hasImage || styled) {
        out.imageFills = r.fills !== figma.mixed ? clone(r.fills) : null;
        out.imageFillStyleId = styled ? r.fillStyleId : null;
        out.imageFromLayer = r.name;
        break;
      }
    }
  }
  return out;
}
async function readRow(li) {
  const tl = firstVisible(li, '#️⃣ Content Text Left');
  const tr = firstVisible(li, '#️⃣ Content Text Right');
  const sl = firstVisible(li, '#️⃣ Content Slot Left');
  const sr = firstVisible(li, '#️⃣ Slot Right Instance');
  const vp = li.componentProperties || {};
  const srProps = sr ? (sr.componentProperties || {}) : {};
  const oldInstance = srProps.instance ? String(srProps.instance.value) : null;
  return {
    id: li.id,
    h: Math.round(li.height),
    listItem: {
      isClickable: vp.isClickable ? String(vp.isClickable.value) : 'false',
      isDraggable: vp.isDraggable ? String(vp.isDraggable.value) : 'false',
      isAccordion: vp.isAccordion ? String(vp.isAccordion.value) : 'false',
    },
    titleLeft: await readLine(tl, '#️⃣ Title'),
    captionLeft: await readLine(tl, '#️⃣ Caption'),
    titleRight: (await readLine(tr, '#️⃣ Title/false')) || (await readLine(tr, '#️⃣ Title')),
    captionRight: await readLine(tr, '#️⃣ Caption'),
    avatar: await readAvatar(sl),
    right: sr ? {
      oldInstance: oldInstance,
      newInstance: SLOT_RIGHT_MAP[oldInstance] || 'iconButton',
      icon: await readIcon(sr),
    } : null,
    annotations: ('annotations' in li && li.annotations.length) ? clone(li.annotations) : null,
  };
}
// The group header. Read the CONTENT cluster and the RIGHT SLOT separately —
// reading "the first Icon in the GroupLabel" picks up the right slot's button
// (e.g. the "Add Time Session" plus) and silently loses the label's own icon.
async function readGroupLabel(group) {
  const gl = group.findAll((x) => x.type === 'INSTANCE' && x.name === 'GroupLabel')[0];
  if (!gl) return null;
  const p = gl.componentProperties || {};
  const out = { variants: {}, label: null, caption: null, counter: null, labelIcon: null, slotRight: null, avatar: null };
  for (const k of Object.keys(p)) if (p[k].type === 'VARIANT') out.variants[k] = String(p[k].value);

  const content = gl.findAll((x) => x.type === 'INSTANCE' && /GroupLabelContent(Primary|Secondary)$/.test(x.name))[0];
  const scope = content || gl;
  const labelPart = scope.findAll((x) => x.type === 'INSTANCE' && /Label/.test(x.name))[0];
  if (labelPart) {
    const lp = labelPart.componentProperties || {};
    for (const raw of Object.keys(lp)) if (lp[raw].type === 'TEXT') { out.label = lp[raw].value; break; }
  }
  if (out.label == null) { const t = scope.findAll((x) => x.type === 'TEXT' && x.characters)[0]; if (t) out.label = t.characters; }
  // MATCH THE REAL PART NAMES. These were written as exact 'Caption' / 'Counter'
  // while the old parts are '#️⃣ Caption' / '#️⃣ Counter', so every group header's
  // caption and counter was silently recorded as absent — and is now lost.
  // Never hardcode a part name: match loosely and verify against a live dump.
  const cap = scope.findAll((x) => /(^|\s)Caption$/.test(x.name) && x.visible !== false)[0];
  if (cap && cap.findAll) { const t = cap.findAll((x) => x.type === 'TEXT')[0]; if (t) out.caption = t.characters; }
  const cnt = scope.findAll((x) => /(^|\s)Counter$/.test(x.name) && x.visible !== false)[0];
  if (cnt && cnt.findAll) { const t = cnt.findAll((x) => x.type === 'TEXT')[0]; if (t) out.counter = t.characters; }
  // the header's own avatar (Timesheet groups are per-assignee) — also missed
  const av = scope.findAll((x) => x.type === 'INSTANCE' && /Avatar/.test(x.name) && x.visible !== false)[0];
  if (av) out.avatar = await readAvatar(av.parent && av.parent.type === 'SLOT' ? av.parent : (av.parent || av));
  // the label's own icon lives in the content cluster, not in the right slot
  if (content) {
    const ic = content.findAll((x) => x.name === 'Icon' && x.visible !== false)[0];
    if (ic) out.labelIcon = await readIcon(ic.type === 'INSTANCE' ? ic.parent : ic);
  }
  // the right slot: its component, its variant values and its icon
  const sr = gl.findAll((x) => /Slot ?Right/i.test(x.name) && x.visible !== false)[0];
  if (sr) {
    const inner = sr.findAll((x) => x.type === 'INSTANCE')[0];
    const ow = inner ? await ownerOf(inner) : null;
    const ip = inner ? (inner.componentProperties || {}) : {};
    const variants = {};
    for (const k of Object.keys(ip)) if (ip[k].type === 'VARIANT') variants[k] = String(ip[k].value);
    out.slotRight = { component: ow ? ow.name : null, variants: variants, icon: await readIcon(sr) };
  }
  return out;
}

// -------------------------------------------------------------------- page
async function snapshotPage(pageId) {
  const page = await figma.getNodeByIdAsync(pageId);
  if (!page || page.type !== 'PAGE') return { pageId, error: 'not a page' };
  await figma.setCurrentPageAsync(page);

  const all = page.findAllWithCriteria({ types: ['INSTANCE'] });

  // ---- A) the rebuild records
  const groups = [];
  const rows = [];
  const rowOwner = new Map(); // row id -> group id
  for (const inst of all) {
    const ow = await ownerOf(inst);
    if (!ow || ow.id !== OLD.itemGroup) continue;
    const p = inst.componentProperties || {};
    const dividerPart = inst.findAll((x) => x.name === '#️⃣ Divider' && x.type === 'INSTANCE')[0];
    let divider = 'false';
    if (dividerPart) {
      const dp = dividerPart.componentProperties || {};
      if (dp.divider) divider = String(dp.divider.value);
    }
    const kids = [];
    for (const li of inst.findAll((x) => x.type === 'INSTANCE')) {
      const lo = await ownerOf(li);
      if (lo && lo.id === OLD.listItem) { kids.push(li.id); rowOwner.set(li.id, inst.id); }
    }
    groups.push({
      id: inst.id,
      name: inst.name,
      where: namePath(inst, page.id).names.join(' / '),
      header: p.header ? String(p.header.value) : 'true',
      divider: divider,
      dividerPartPresent: !!dividerPart,
      groupLabel: await readGroupLabel(inst),
      rowIds: kids,
      annotations: ('annotations' in inst && inst.annotations.length) ? clone(inst.annotations) : null,
    });
  }
  for (const inst of all) {
    const ow = await ownerOf(inst);
    if (!ow || ow.id !== OLD.listItem) continue;
    const rec = await readRow(inst);
    rec.groupId = rowOwner.get(inst.id) || null;
    if (!rec.groupId) {
      // not inside an old ItemGroup — remember where it sits so the rebuild
      // can find the place again
      const fp = namePath(inst, page.id);
      rec.standaloneAt = { path: fp.names, idx: fp.idx };
    }
    rows.push(rec);
  }

  // ---- B) every other broken override
  const seen = new Set();
  const lostOverrides = [];
  const skippedForRebuild = {};
  const notCaptured = {};
  for (const inst of all) {
    for (const o of inst.overrides) {
      if (seen.has(o.id)) continue;
      seen.add(o.id);
      const node = await figma.getNodeByIdAsync(o.id);
      if (!node) continue;
      const fields = (o.overriddenFields || []).filter((f) => {
        if (CONTENT.has(f)) return true;
        notCaptured[f] = (notCaptured[f] || 0) + 1;
        return false;
      });
      if (!fields.length) continue;
      const r = await verdictFor(node);
      if (r.v !== 'LOST') continue;
      // the ListItem / ItemGroup chains are handled by (A)
      if (r.breakOwnerId === OLD.listItem || r.breakOwnerId === OLD.itemGroup || r.breakOwnerId === OLD.groupLabel) {
        skippedForRebuild[r.at] = (skippedForRebuild[r.at] || 0) + 1;
        continue;
      }
      // find the top-level instance: its node id is stable
      let top = null; let n = node;
      while (n && n.type !== 'PAGE') { if (n.type === 'INSTANCE') top = n; n = n.parent; }
      const full = namePath(node, top ? top.id : page.id);
      const values = {};
      for (const f of fields) {
        try {
          if (f === 'componentProperties') {
            if (node.type === 'INSTANCE') {
              const out = {};
              const props = node.componentProperties || {};
              for (const raw of Object.keys(props)) {
                const e = props[raw];
                const entry = { type: e.type, value: e.value };
                if (e.boundVariables) {
                  for (const k of Object.keys(e.boundVariables)) {
                    const vr = await varKeyOf(e.boundVariables[k]);
                    if (vr) entry.boundVar = vr;
                  }
                }
                out[raw] = entry;
              }
              if (Object.keys(out).length) values.componentProperties = out;
            }
          } else if (f === 'characters') { if ('characters' in node) values.characters = node.characters; }
          else if (f === 'mainComponent') { const ow2 = await ownerOf(node); values.mainComponent = ow2 ? { key: ow2.key, name: ow2.name } : null; }
          else if (f === 'boundVariables') {
            const bv = node.boundVariables; const out = {};
            if (bv) for (const field of Object.keys(bv)) {
              const e = bv[field]; const list = Array.isArray(e) ? e : [e]; const res = [];
              for (const a of list) res.push(await varKeyOf(a));
              out[field] = Array.isArray(e) ? res : res[0];
            }
            if (Object.keys(out).length) values.boundVariables = out;
          }
          else if (f === 'fills' || f === 'strokes') { if (f in node && node[f] !== figma.mixed) values[f] = clone(node[f]); }
          else if (f === 'reactions') { if ('reactions' in node) values.reactions = clone(node.reactions); }
          else if (f === 'visible' || f === 'opacity') { if (f in node) values[f] = node[f]; }
          else if (f in node && node[f] !== figma.mixed) values[f] = node[f];
        } catch (e) { notCaptured[f + '(err)'] = (notCaptured[f + '(err)'] || 0) + 1; }
      }
      if (!Object.keys(values).length) continue;
      lostOverrides.push({
        topId: top ? top.id : null,
        fullPath: full.names,
        fullIdx: full.idx,
        type: node.type,
        brokeAt: r.at,
        values: values,
      });
    }
  }

  // ---- C) annotations
  const annotated = page.findAll((n) => 'annotations' in n && n.annotations.length > 0);
  const annotatedNodes = [];
  for (const node of annotated) {
    let top = null; let n = node;
    while (n && n.type !== 'PAGE') { if (n.type === 'INSTANCE') top = n; n = n.parent; }
    const rel = namePath(node, top ? top.id : page.id);
    const r = await verdictFor(node);
    annotatedNodes.push({
      nodeId: node.id, nodeName: node.name, nodeType: node.type,
      topInstanceId: top ? top.id : null,
      path: rel.names, pathIdx: rel.idx,
      verdict: r.v,
      annotations: clone(node.annotations) || [],
    });
  }

  const categories = await figma.annotations.getAnnotationCategoriesAsync();
  const snapshot = {
    version: 'jd1',
    takenAt: new Date().toISOString(),
    pageId: page.id,
    pageName: page.name,
    annotationCategories: categories.map((c) => ({ id: c.id, label: c.label })),
    groups: groups,
    rows: rows,
    lostOverrides: lostOverrides,
    annotatedNodes: annotatedNodes,
  };

  const json = JSON.stringify(snapshot);
  const chunks = [];
  for (let i = 0; i < json.length; i += CHUNK) chunks.push(json.slice(i, i + CHUNK));

  const removedStale = [];
  for (const old of page.children.slice()) {
    if (old.name === FRAME_NAME) { old.locked = false; removedStale.push(old.id); old.remove(); }
  }

  const sanity = {
    pageId: page.id,
    pageName: page.name.replace(/\s+/g, ' ').trim(),
    instances: all.length,
    oldGroups: groups.length,
    oldRows: rows.length,
    rowsWithoutGroup: rows.filter((r) => !r.groupId).length,
    rowsMissingTitle: rows.filter((r) => !r.titleLeft || r.titleLeft.text == null).length,
    rowsWithRightText: rows.filter((r) => r.titleRight).length,
    rowsWithRightSlot: rows.filter((r) => r.right).length,
    rowsWithAvatar: rows.filter((r) => r.avatar).length,
    rowsWithImageAvatar: rows.filter((r) => r.avatar && r.avatar.imageFills).length,
    lostOverrides: lostOverrides.length,
    lostByCause: (() => { const m = {}; for (const l of lostOverrides) m[l.brokeAt] = (m[l.brokeAt] || 0) + 1; return m; })(),
    skippedForRebuild: skippedForRebuild,
    annotatedNodes: annotatedNodes.length,
    annotationsAtRisk: annotatedNodes.filter((a) => a.verdict === 'LOST').length,
    bytes: json.length,
    chunks: chunks.length,
    fieldsNotCaptured: notCaptured,
    removedStale: removedStale,
    // VARIANCE GUARD. If a field reads the same on every instance, the reader is
    // almost certainly picking a node that was never overridden and returning
    // the component default. This is exactly how 18 Timesheet group headers were
    // all recorded as "Thiago Cummings". Treat any warning here as a bug in the
    // reader, not as a fact about the design.
    varianceWarnings: (() => {
      const warn = [];
      const distinct = (arr) => Array.from(new Set(arr.filter((v) => v != null))).length;
      const labels = groups.map((g) => g.groupLabel && g.groupLabel.label);
      if (groups.length >= 3 && distinct(labels) === 1) warn.push('every group header label is "' + labels.filter(Boolean)[0] + '" — check readGroupLabel');
      const titles = rows.map((r) => r.titleLeft && r.titleLeft.text);
      if (rows.length >= 3 && distinct(titles) === 1) warn.push('every row title is identical — check readRow');
      const dayRows = rows.filter((r) => r.avatar && r.avatar.oldVariant === 'day');
      if (dayRows.length >= 2 && !dayRows.some((r) => r.avatar.typeProps)) warn.push(dayRows.length + ' day avatars captured with no typeProps — their date and colour will be lost');
      return warn;
    })(),
  };

  if (!groups.length && !rows.length && !lostOverrides.length && !annotatedNodes.length) {
    sanity.skipped = 'nothing to snapshot';
    return sanity;
  }

  let right = 0, topY = 0;
  for (const c of page.children) if ('x' in c) { right = Math.max(right, c.x + c.width); topY = Math.min(topY, c.y); }

  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  const holder = figma.createAutoLayout('VERTICAL', { name: FRAME_NAME, itemSpacing: 8 });
  page.appendChild(holder);
  holder.x = right + 2000; holder.y = topY;
  holder.paddingLeft = 16; holder.paddingRight = 16; holder.paddingTop = 16; holder.paddingBottom = 16;

  const header = figma.createText();
  holder.appendChild(header);
  header.name = 'jd1_meta';
  header.characters =
    'DS migration snapshot (jd1) — do not edit or delete until the rebuild has been checked.\n' +
    'page: ' + page.name + '\ntaken: ' + snapshot.takenAt + '\n' +
    chunks.length + ' chunk(s), ' + json.length + ' bytes\n' +
    groups.length + ' groups, ' + rows.length + ' rows, ' + lostOverrides.length + ' lost overrides, ' +
    annotatedNodes.length + ' annotated nodes';

  for (let i = 0; i < chunks.length; i++) {
    const t = figma.createText();
    holder.appendChild(t);
    t.resize(600, 40);
    t.textAutoResize = 'HEIGHT';
    t.fontSize = 6;
    t.characters = chunks[i];
    t.name = 'jd1_' + i;
  }
  holder.locked = true;

  sanity.snapshotFrameId = holder.id;
  return sanity;
}

const results = [];
for (const id of PAGE_IDS) results.push(await snapshotPage(id));
return { pages: results, createdNodeIds: results.map((r) => r.snapshotFrameId).filter(Boolean) };
