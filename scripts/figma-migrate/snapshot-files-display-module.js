// Semantic snapshot of the 7 DisplayModules on the "Files" DisplayModule page
// (file C6rO8SKXF9OVZyO7mTgRtE). A REBUILD: the old #️⃣ Body (header + body
// slot) is deleted, and the rows / groups / cards inside are rebuilt too — so
// this records the FULL VISIBLE STATE of each module as a flat list, not a
// diff against the old mains. Replace __DRY__ with true/false before running.
const DRY = __DRY__;
const PAGE = '1950:34790';
const TAG = '⚙ DS snapshot (files-dm)';
const DM_KEY = null; // resolved by set name below
const strip = k => k.replace(/#[^#]*$/, '');
const varKey = {};
async function vk(id) { if (!(id in varKey)) { const v = await figma.variables.getVariableByIdAsync(id); varKey[id] = v ? v.key : null; } return varKey[id]; }
function anns(n) { return (n.annotations || []).map(a => { const r = {}; if (a.labelMarkdown) r.labelMarkdown = a.labelMarkdown; else if (a.label) r.label = a.label; if (a.properties && a.properties.length) r.properties = a.properties; if (a.categoryId) r.categoryId = a.categoryId; return r; }); }
async function setOf(i) { const m = await i.getMainComponentAsync(); if (!m) return null; const s = m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m; return { m, s }; }

// One entry per meaningful node, keyed by index path from the DisplayModule.
async function record(dm) {
  const nodes = [];
  async function walk(n, path) {
    if (n.visible === false) return;
    const e = { p: path.join('.'), t: n.type, n: n.name };
    let keep = false;
    if (n.type === 'INSTANCE') {
      const so = await setOf(n);
      if (so) { e.c = so.s.name; e.k = so.s.key; e.v = so.m.name; }
      const P = {}, PV = {};
      for (const [k, v] of Object.entries(n.componentProperties)) {
        if (v.type === 'VARIANT') continue;
        P[strip(k)] = v.value;
        if (v.boundVariables && v.boundVariables.value) PV[strip(k)] = await vk(v.boundVariables.value.id);
      }
      if (Object.keys(P).length) e.pr = P;
      if (Object.keys(PV).length) e.pv = PV;
      keep = true;
    }
    if (n.type === 'TEXT') {
      e.tx = n.characters;
      const f = n.fills && n.fills[0];
      if (f && f.boundVariables && f.boundVariables.color) e.fv = await vk(f.boundVariables.color.id);
      keep = true;
    }
    if (n.type === 'SLOT') {
      e.pad = [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft];
      e.gap = n.itemSpacing;
      e.kids = n.children.length;
      keep = true;
    }
    if (n.annotations && n.annotations.length) { e.ann = anns(n); keep = true; }
    if (keep) nodes.push(e);
    if (n.type === 'TEXT' || !('children' in n)) return;
    for (let i = 0; i < n.children.length; i++) await walk(n.children[i], path.concat([i]));
  }
  await walk(dm, []);
  return nodes;
}
function namePath(n) { const p = []; let c = n; while (c && c.type !== 'PAGE') { p.unshift(c.name); c = c.parent; } return p.join(' / '); }

const page = await figma.getNodeByIdAsync(PAGE);
await figma.setCurrentPageAsync(page);
for (const c of [...page.children]) if (c.name === TAG) { c.locked = false; c.remove(); }
const rec = { v: 1, pageId: PAGE, dms: [], ann: [] };
const dmIds = new Set();
for (const i of page.findAllWithCriteria({ types: ['INSTANCE'] })) {
  const so = await setOf(i);
  if (!so || so.s.name !== 'DisplayModule') continue;
  dmIds.add(i.id);
  const parent = i.parent;
  rec.dms.push({ id: i.id, path: namePath(i), v: so.m.name, k: so.s.key, parent: parent.id, idx: parent.children.findIndex(c => c.id === i.id), sizing: [i.layoutSizingHorizontal, i.layoutSizingVertical], w: i.width, nodes: await record(i) });
}
// Annotations anywhere else on the page (outside the modules) — for the count check.
for (const n of page.findAll(n => 'annotations' in n && n.annotations && n.annotations.length > 0)) {
  let p = n, inDm = false; while (p && p.type !== 'PAGE') { if (dmIds.has(p.id)) { inDm = true; break; } p = p.parent; }
  if (!inDm) rec.ann.push({ id: n.id, t: n.type, path: namePath(n), ann: anns(n) });
}

// Sanity: counts per module, and do the captured values VARY?
const stats = rec.dms.map(d => {
  const rows = d.nodes.filter(x => x.c === 'ListItem Template');
  const cards = d.nodes.filter(x => x.c === 'CardFile');
  const titleTexts = d.nodes.filter(x => x.t === 'TEXT' && x.n === 'Title').map(x => x.tx);
  return { id: d.id, path: d.path.split(' / ').slice(-2).join(' / '), v: d.v, nodes: d.nodes.length, rows: rows.length, cards: cards.length, groupLabels: d.nodes.filter(x => x.c === 'GroupLabel').map(x => x.pr && x.pr.label || '?'), ann: d.nodes.filter(x => x.ann).length, distinctTexts: new Set(d.nodes.filter(x => x.t === 'TEXT').map(x => x.tx)).size };
});
const json = JSON.stringify(rec);
const res = { dms: rec.dms.length, annOutside: rec.ann.length, bytes: json.length, stats };
if (DRY) throw new Error('DRY ' + JSON.stringify(res));

let maxX = 0; for (const c of page.children) maxX = Math.max(maxX, c.x + c.width);
const root = figma.createAutoLayout('VERTICAL', { name: TAG, itemSpacing: 0 });
page.appendChild(root); root.x = maxX + 20000; root.y = 0;
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
for (let o = 0, n = 0; o < json.length; o += 40000, n++) { const t = figma.createText(); t.name = 'chunk ' + n; t.characters = json.slice(o, o + 40000); t.resize(400, t.height); t.textAutoResize = 'HEIGHT'; root.appendChild(t); }
root.locked = true;
// Read back and compare.
const back = root.children.map(t => t.characters).join('');
res.root = root.id; res.chunks = root.children.length; res.readBackOk = back === json;
return res;
