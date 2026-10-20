// Rebuild DisplayModules on the "Warranty" Side Panel page from the snapshot.
// Header: title + right slot of 1-2 IconButtons (copy / pen), their annotations.
// Body: clones of the parked copies, original sizing, slot padding + gap.
const IDS = __IDS__;
const page = await figma.getNodeByIdAsync('18594:94275'); await figma.setCurrentPageAsync(page);
const base = k => k.replace(/#[^#]*$/, '').replace(/^[^A-Za-z]+/, '');
function setP(inst, want, kind) { const P = {}; for (const [k, v] of Object.entries(inst.componentProperties)) { const b = base(k); if (!(b in want)) continue; if (kind === 'text' && v.type !== 'TEXT') continue; if (kind === 'variant' && v.type !== 'VARIANT') continue; P[k] = want[b]; } if (Object.keys(P).length) inst.setProperties(P); return Object.keys(P).length; }
const kids = n => n.children.filter(c => c.type === 'INSTANCE');
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' }); await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
const data = await figma.getNodeByIdAsync('22143:1896');
const rec = JSON.parse(data.children.map(t => t.characters).join(''));
let col = (await figma.variables.getLocalVariableCollectionsAsync()).find(c => c.name === '⚙ scratch icon');
if (!col) col = figma.variables.createVariableCollection('⚙ scratch icon');
let v = null; for (const id of col.variableIds) { const x = await figma.variables.getVariableByIdAsync(id); if (x && x.name === 'icon') v = x; }
if (!v) { v = figma.variables.createVariable('icon', col, 'STRING'); v.scopes = ['TEXT_CONTENT']; }
const mode = col.modes[0].modeId;
async function writeIcon(iconInst, name) { const t = iconInst.findOne(n => n.type === 'TEXT'); if (t.characters === name) return 'same'; v.setValueForMode(mode, name); t.setBoundVariable('characters', v); t.setBoundVariable('characters', null); const t2 = await figma.getNodeByIdAsync(t.id); return t2.characters; }
const annOf = a => a.map(x => { const r = { labelMarkdown: x.labelMarkdown || x.label }; if (x.categoryId) r.categoryId = x.categoryId; return r; });
const report = [];
for (const id of IDS) {
  const R = rec.dms.find(d => d.id === id);
  const dm = await figma.getNodeByIdAsync(id);
  const r = { id };
  const hdrRec = (R.cap.c || []).filter(x => x[0] !== '0.2');
  const flat = []; (function f(list) { for (const [p, x] of list) { flat.push(x); if (x.sub && x.sub.c) f(x.sub.c); } })(hdrRec);
  const title = flat.find(x => x.n === '#️⃣ Title').p['↳ title'];
  const icons = flat.filter(x => x.n === 'Icon').map(x => x.p.iconName);
  const btnAnn = flat.filter(x => x.n === 'IconButton' && x.ann);
  // map annotation to the button by its order in the record (IconButton entry precedes its Icon)
  const order = []; for (const x of flat) { if (x.n === 'IconButton' && x.ann) order.push({ ann: x.ann }); if (x.n === 'Icon') { const last = order[order.length - 1]; if (last && !last.icon) last.icon = x.p.iconName; } }
  // ---- header
  const header = kids(dm).find(c => c.name === 'Header');
  const content = header.findOne(n => n.type === 'INSTANCE' && n.name === 'Content');
  setP(content, { slotRight: icons.length ? 'true' : 'false' }, 'variant');
  const tl = header.findOne(n => n.type === 'INSTANCE' && n.name === 'Title');
  setP(tl, { label: title }, 'text');
  r.icons = [];
  if (icons.length) {
    const sr = kids(content).find(c => c.name === 'Slot Right');
    setP(sr, { slots: String(icons.length) }, 'variant');
    const slots = kids(sr);
    for (let k = 0; k < icons.length; k++) {
      setP(slots[k], { instance: 'iconButton' }, 'variant');
      const ib = (await figma.getNodeByIdAsync(slots[k].id)).findOne(n => n.type === 'INSTANCE' && n.name === 'IconButton') || slots[k];
      const ic = ib.findOne(n => n.type === 'INSTANCE' && n.name === 'Icon');
      r.icons.push(await writeIcon(ic, icons[k]));
      const a = order.find(o => o.icon === icons[k]);
      if (a) { ib.annotations = annOf(a.ann); r.ann = (r.ann || 0) + 1; }
    }
  }
  if (R.ann && R.ann.length && !(dm.annotations || []).length) { dm.annotations = annOf(R.ann); r.dmAnn = 'rewritten'; }
  // ---- body
  const body = dm.children.find(c => c.type === 'SLOT' && c.name === 'body');
  for (const c of [...body.children]) c.remove();
  [body.paddingTop, body.paddingRight, body.paddingBottom, body.paddingLeft] = R.pad; body.itemSpacing = R.gap;
  const box = await figma.getNodeByIdAsync(R.box);
  const copies = box.children.map((c, k) => { const n = c.clone(); body.appendChild(n); try { n.layoutSizingHorizontal = R.sizing[k][0]; } catch (e) {} return n; });
  r.body = copies.length;
  report.push(r);
}
return report;
