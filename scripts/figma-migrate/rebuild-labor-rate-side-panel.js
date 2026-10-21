// Rebuild DisplayModules on the "Labor Rate" Side Panel page from the snapshot
// (snapshot-labor-rate-side-panel.js). Replace __IDS__ with a JSON array of
// DisplayModule ids and __DRY__ with true/false (true = throw at the end, so
// nothing is committed and the error carries the report).
// Header: title + 0, 1 or 2 IconButtons (copy / pen) + their annotations.
// Body: parked copies cloned back with the slot padding/gap. EmptyState copies
// are BUILT fresh (a cloned EmptyState came back internally broken on Contact)
// with every recorded property copied top-down.
// Icons: DS tokens are bound by key; literals stay BOUND to a local variable
// named after the icon (an unbound literal reverts) — DS Icon Fixer finishes it.
const IDS = __IDS__;
const DRY = __DRY__;
const page = await figma.getNodeByIdAsync('0:1'); await figma.setCurrentPageAsync(page);
const strip = k => k.replace(/#[^#]*$/, '');
const base = k => strip(k).replace(/^[^A-Za-z]+/, '');
function setP(inst, want, kind) { const P = {}; for (const [k, v] of Object.entries(inst.componentProperties)) { const b = base(k); if (!(b in want)) continue; if (kind === 'text' && v.type !== 'TEXT') continue; if (kind === 'variant' && v.type !== 'VARIANT') continue; if (v.value === want[b]) continue; P[k] = want[b]; } if (Object.keys(P).length) inst.setProperties(P); return Object.keys(P).length; }
const find = (n, name) => n.findOne(x => x.type === 'INSTANCE' && x.name === name);
const kidsI = n => n.children.filter(c => c.type === 'INSTANCE');
for (const s of ['Regular', 'Medium', 'Semi Bold']) await figma.loadFontAsync({ family: 'Inter', style: s });
const data = await figma.getNodeByIdAsync('3048:5527');
const rec = JSON.parse(data.children.map(t => t.characters).join(''));
// local icon-name variables
const COL = '⚙ icon names — migration 2026-10-21';
let col = (await figma.variables.getLocalVariableCollectionsAsync()).find(c => c.name === COL);
if (!col) col = figma.variables.createVariableCollection(COL);
const mode = col.modes[0].modeId;
const lvars = {}; for (const id of col.variableIds) { const x = await figma.variables.getVariableByIdAsync(id); if (x) lvars[x.name] = x; }
function lv(name) { if (!lvars[name]) { const x = figma.variables.createVariable(name, col, 'STRING'); x.setValueForMode(mode, name); x.scopes = ['TEXT_CONTENT']; lvars[name] = x; } return lvars[name]; }
const dsVar = {}; async function dv(key) { if (!dsVar[key]) dsVar[key] = await figma.variables.importVariableByKeyAsync(key); return dsVar[key]; }
async function icon(iconInst, name, key) { const t = iconInst.findOne(n => n.type === 'TEXT'); t.setBoundVariable('characters', key ? await dv(key) : lv(name)); return name; }
const annOf = (a, keepProps) => a.map(x => { const r = { labelMarkdown: x.labelMarkdown || x.label }; if (x.categoryId) r.categoryId = x.categoryId; if (keepProps && x.properties) r.properties = x.properties; return r; });
function fp(nodes) { let t = 0, tl = 0, inst = 0, ann = 0, pl = 0; for (const n of nodes) { const all = [n, ...('findAll' in n ? n.findAll(() => true) : [])]; for (const x of all) { if (x.type === 'TEXT') { t++; tl += x.characters.length; } if (x.type === 'INSTANCE') { inst++; pl += JSON.stringify(Object.values(x.componentProperties).map(v => v.value)).length; } if (x.annotations) ann += x.annotations.length; } } return [t, tl, inst, ann, pl]; }

// ---- an EmptyState built fresh from the parked copy's component, props copied top-down
async function freshCopy(src, slot) {
  const m = await src.getMainComponentAsync();
  const n = m.createInstance(); slot.appendChild(n);
  async function copy(a, b) {
    const P = {}; for (const [k, v] of Object.entries(a.componentProperties)) if (v.type === 'VARIANT' && b.componentProperties[k] && b.componentProperties[k].value !== v.value) P[k] = v.value;
    if (Object.keys(P).length) b.setProperties(P);
    const b2 = await figma.getNodeByIdAsync(b.id);
    const Q = {}; for (const [k, v] of Object.entries(a.componentProperties)) if (v.type !== 'VARIANT' && b2.componentProperties[k] && b2.componentProperties[k].value !== v.value) Q[k] = v.value;
    if (Object.keys(Q).length) b2.setProperties(Q);
    if (a.annotations && a.annotations.length) b2.annotations = annOf(a.annotations, true);
    const ai = a.findAll(x => x.type === 'INSTANCE'), bi = b2.findAll(x => x.type === 'INSTANCE');
    // direct nested instances only; recurse
    const ad = ai.filter(x => { let p = x.parent; while (p && p.type !== 'INSTANCE') p = p.parent; return p && p.id === a.id; });
    const bd = bi.filter(x => { let p = x.parent; while (p && p.type !== 'INSTANCE') p = p.parent; return p && p.id === b2.id; });
    for (let k = 0; k < ad.length && k < bd.length; k++) if (ad[k].name === bd[k].name) await copy(ad[k], bd[k]);
  }
  await copy(src, n);
  return n;
}

const report = [];
for (const id of IDS) {
  const R = rec.dms.find(d => d.id === id);
  const dm = await figma.getNodeByIdAsync(id);
  const log = { id, ann: 0 };
  // ---- header
  const flat = []; (function f(list, pre) { for (const [p, x] of list) { flat.push([pre + p, x]); if (x.sub && x.sub.c) f(x.sub.c, pre + p + '>'); } })(R.cap.c || [], '');
  const title = flat.find(([p, x]) => x.n === '#️⃣ Title' && x.p && x.p['↳ title'])[1].p['↳ title'];
  const icons = flat.filter(([p, x]) => x.n === 'Icon' && x.p && x.p.iconName).map(([p, x]) => {
    const btn = flat.filter(([q, y]) => y.n === 'IconButton' && p.startsWith(q + '.')).pop();
    return { name: x.p.iconName, key: x.pv && x.pv.iconName, ann: btn && btn[1].ann };
  });
  const header = kidsI(dm).find(c => c.name === 'Header');
  const content = find(header, 'Content');
  setP(content, { slotRight: icons.length ? 'true' : 'false' }, 'variant');
  setP(find(await figma.getNodeByIdAsync(header.id), 'Title'), { label: title }, 'text');
  log.title = title; log.icons = [];
  if (icons.length) {
    const sr = kidsI(await figma.getNodeByIdAsync(content.id)).find(c => c.name === 'Slot Right');
    setP(sr, { slots: String(icons.length) }, 'variant');
    const slots = kidsI(await figma.getNodeByIdAsync(sr.id));
    for (let k = 0; k < icons.length; k++) {
      setP(slots[k], { instance: 'iconButton' }, 'variant');
      const ib = find(await figma.getNodeByIdAsync(slots[k].id), 'IconButton');
      log.icons.push(await icon(find(ib, 'Icon'), icons[k].name, icons[k].key));
      if (icons[k].ann) { ib.annotations = annOf(icons[k].ann); log.ann++; }
    }
  }
  if (R.ann && R.ann.length && !(dm.annotations || []).length) { dm.annotations = annOf(R.ann); log.dmAnn = 'rewritten'; log.ann++; }
  // ---- body
  const body = dm.children.find(c => c.type === 'SLOT' && c.name === 'body');
  for (const c of [...body.children]) c.remove();
  [body.paddingTop, body.paddingRight, body.paddingBottom, body.paddingLeft] = R.pad; body.itemSpacing = R.gap;
  const box = await figma.getNodeByIdAsync(R.box);
  log.body = [];
  const made = [];
  for (let k = 0; k < box.children.length; k++) {
    const c = box.children[k];
    const m = c.type === 'INSTANCE' ? await c.getMainComponentAsync() : null;
    const setName = m ? (m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent.name : m.name) : c.type;
    const n = setName === 'EmptyState' ? await freshCopy(c, body) : (() => { const x = c.clone(); body.appendChild(x); return x; })();
    try { n.layoutSizingHorizontal = R.sizing[k][0]; } catch (e) {}
    made.push(n.id);
    log.body.push((setName === 'EmptyState' ? 'fresh ' : 'clone ') + c.name);
  }
  const fresh = await figma.getNodeByIdAsync(id);
  const madeNodes = []; for (const x of made) madeNodes.push(await figma.getNodeByIdAsync(x));
  const parked = []; for (const c of box.children) parked.push(await figma.getNodeByIdAsync(c.id));
  log.fp = JSON.stringify(fp(madeNodes)) === JSON.stringify(fp(parked)) ? 'equal' : [fp(parked), fp(madeNodes)];
  log.readBack = fresh.findAllWithCriteria({ types: ['TEXT'] }).filter(t => t.visible).map(t => t.characters + (t.boundVariables && t.boundVariables.characters ? '[b]' : '')).join('|');
  log.annCount = fresh.findAll(n => n.annotations && n.annotations.length).length + ((fresh.annotations || []).length ? 1 : 0);
  report.push(log);
}
if (DRY) throw new Error('DRY ' + JSON.stringify(report));
return report;
