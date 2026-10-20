// Top-down survival survey (read-only). Side Panel page.
const page = await figma.getNodeByIdAsync('21874:10859');
await figma.setCurrentPageAsync(page);
const LAYOUT = new Set(['width','height','name','x','y','layoutSizingHorizontal','layoutSizingVertical','primaryAxisSizingMode','counterAxisSizingMode','relativeTransform','constraints','layoutAlign','layoutGrow','layoutPositioning','minWidth','maxWidth','minHeight','maxHeight','textAutoResize','itemSpacing','paddingLeft','paddingRight','paddingTop','paddingBottom','counterAxisAlignItems','primaryAxisAlignItems','layoutMode','size']);

const pubCache = {};
function pathsOf(root) { // path -> 'K:<key>' | type
  const res = {};
  function walk(node, trail) {
    if (!('children' in node)) return;
    for (const c of node.children) {
      const t = trail.concat([c.name]); const p = t.join(' / ');
      if (c.type === 'INSTANCE') { res[p] = res[p] || 'I'; }
      else { res[p] = c.type; if (c.type !== 'SLOT') walk(c, t); }
    }
  }
  walk(root, []);
  return res;
}
async function pub(key) {
  if (key in pubCache) return pubCache[key];
  let n = null;
  try { n = await figma.importComponentSetByKeyAsync(key); } catch (e) { try { n = await figma.importComponentByKeyAsync(key); } catch (e2) {} }
  if (!n) return (pubCache[key] = null);
  const u = {};
  const vs = n.type === 'COMPONENT_SET' ? n.children : [n];
  for (const v of vs) Object.assign(u, pathsOf(v));
  return (pubCache[key] = u);
}
const mainKey = {};
async function ownerKey(inst) {
  if (inst.id in mainKey) return mainKey[inst.id];
  const mc = await inst.getMainComponentAsync();
  let k = null, nm = null;
  if (mc) { const o = mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : mc; k = o.key; nm = o.name; }
  return (mainKey[inst.id] = { k, nm, remote: mc && mc.remote });
}
// Classify node n relative to its designer-placed top instance.
// returns {top, verdict:'survive'|'break'|'frozen'|'slot', at}
async function classify(n) {
  // collect chain up to a designer placement
  const segs = []; let trail = []; let cur = n;
  while (cur && cur.type !== 'PAGE') {
    const p = cur.parent;
    if (!p || p.type === 'PAGE') break;
    if (p.type === 'SLOT') break;
    if (p.type === 'INSTANCE') { segs.push({ owner: p, path: [cur.name].concat(trail), child: cur }); trail = []; cur = p; continue; }
    trail = [cur.name].concat(trail); cur = p;
  }
  // cur is the top-most instance (designer placed on canvas) or a frame
  const top = segs.length ? segs[segs.length - 1].owner : (n.type === 'INSTANCE' ? n : null);
  return { segs, top };
}
async function verdict(n) {
  const { segs, top } = await classify(n);
  let sl = (top || n).parent; while (sl && sl.type !== 'PAGE' && sl.type !== 'SLOT') sl = sl.parent;
  if (sl && sl.type === 'SLOT') {
    const sv = await verdict(sl);
    if (sv.v === 'break') return { v: 'break', top: sv.top, at: 'SLOT LOST in ' + sv.at };
    if (sv.v === 'frozen') return sv;
  }
  if (!top) return { v: 'local' };
  const topInfo = await ownerKey(top);
  if (!topInfo.remote) return { v: 'local', top };
  if (!(await pub(topInfo.k))) return { v: 'frozen', top, at: topInfo.nm };
  // segs nearest-first; walk top-down
  const chain = segs.filter(s => s.child).reverse();
  for (const s of chain) {
    const oi = await ownerKey(s.owner);
    const P = await pub(oi.k);
    if (!P) return { v: 'break', top, at: oi.nm + ' (deleted part)' };
    const p = s.path.join(' / ');
    // every prefix: a SLOT on the way means designer content
    let slot = false;
    for (let i = 1; i < s.path.length; i++) if (P[s.path.slice(0, i).join(' / ')] === 'SLOT') slot = true;
    if (slot) return { v: 'survive', top };
    if (!(p in P)) return { v: 'break', top, at: oi.nm + ' › ' + p };
  }
  return { v: 'survive', top };
}

const inst = page.findAllWithCriteria({ types: ['INSTANCE'] });
// designer-placed tops = instance whose nearest non-frame ancestor is page/frame or SLOT
const tops = [];
for (const i of inst) {
  let p = i.parent, isTop = true;
  while (p && p.type !== 'PAGE') { if (p.type === 'SLOT') break; if (p.type === 'INSTANCE') { isTop = false; break; } p = p.parent; }
  if (isTop) tops.push(i);
}
const agg = { tops: tops.length, ov: 0, layoutOnly: 0, survive: 0, break: 0, frozen: 0, annOnly: 0 };
const detail = {};
const byTop = {}, byBreak = {}, frozenBy = {}, fieldsBreak = {};
const slotLost = {}; const slotCache = {};
for (const t of tops) {
  const ti = await ownerKey(t);
  // slot-placed: does the slot itself survive?
  let s = t.parent; while (s && s.type !== 'PAGE' && s.type !== 'SLOT') s = s.parent;
  if (s && s.type === 'SLOT') {
    if (!(s.id in slotCache)) slotCache[s.id] = await verdict(s);
    const sv = slotCache[s.id];
    if (sv.v === 'break') {
      const own = (await ownerKey(sv.top)).nm;
      const e = slotLost[own] || (slotLost[own] = { slots: new Set(), kids: 0, ov: 0 });
      e.slots.add(s.id); e.kids++; e.ov += (t.overrides || []).length;
      continue;
    }
  }
  const b = byTop[ti.nm] || (byTop[ti.nm] = { n: 0, s: 0, b: 0, f: 0 }); b.n++;
  for (const o of (t.overrides || [])) {
    const fields = o.overriddenFields.filter(f => !LAYOUT.has(f));
    if (!fields.length) { agg.layoutOnly++; continue; }
    agg.ov++;
    const node = await figma.getNodeByIdAsync(o.id);
    if (!node) { agg.missing = (agg.missing || 0) + 1; continue; }
    const r = await verdict(node);
    if (r.v === 'survive' || r.v === 'local') { agg.survive++; b.s++; }
    else if (r.v === 'frozen') { agg.frozen++; b.f++; frozenBy[r.at] = (frozenBy[r.at] || 0) + 1; }
    else { agg.break++; b.b++; const dk = ti.nm + ' ⇒ ' + r.at.replace(/^(SLOT LOST in )+/, 'SLOT LOST in ') + ' [' + fields.join(',') + ']'; detail[dk] = (detail[dk] || 0) + 1; const k = r.at.split(' › ')[0]; byBreak[k] = (byBreak[k] || 0) + 1; for (const f of fields) fieldsBreak[f] = (fieldsBreak[f] || 0) + 1; }
  }
}
// annotations
const annNodes = page.findAll(n => 'annotations' in n && n.annotations && n.annotations.length > 0);
const ann = { total: annNodes.length, survive: 0, break: 0, frozen: 0, breakAt: {} };
for (const n of annNodes) {
  const r = await verdict(n);
  if (r.v === 'break') { ann.break++; const k = r.at.split(' › ')[0]; ann.breakAt[k] = (ann.breakAt[k] || 0) + 1; }
  else if (r.v === 'frozen') ann.frozen++; else ann.survive++;
}
const slotKids = {};
for (const sl of page.findAllWithCriteria({ types: ['SLOT'] })) { if (!sl.children.length) continue; const r = await verdict(sl); if (r.v !== 'break') continue; const own = r.top ? (await ownerKey(r.top)).nm : '?'; const k = own + ' › ' + sl.name; const e = slotKids[k] || (slotKids[k] = [0, 0]); e[0]++; e[1] += sl.children.length; }
const sortObj = o => Object.entries(o).sort((a, b) => b[1] - a[1]);
return { slotKids, detail: sortObj(detail).filter(x => !x[0].includes('SLOT LOST')), slotLostTotal: sortObj(detail).filter(x => x[0].includes('SLOT LOST')).reduce((a, x) => a + x[1], 0), slotLost: Object.entries(slotLost).map(([k, v]) => [k, v.slots.size, v.kids, v.ov]), agg, byBreak: sortObj(byBreak), frozenBy: sortObj(frozenBy), fieldsBreak: sortObj(fieldsBreak), ann, byTop: Object.entries(byTop).filter(([k, v]) => v.b || v.f).map(([k, v]) => [k, v.n, v.s, v.b, v.f]) };
