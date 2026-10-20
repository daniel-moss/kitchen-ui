// Rebuild one or more DisplayModules on the "Files" DisplayModule page from the
// semantic snapshot (snapshot-files-display-module.js). Replace __IDS__ with a
// JSON array of DisplayModule ids. Idempotent per module: the body slot is
// emptied first, then the header and body are written from the record.
//
// Header: title + counter, right slot = SegmentedControl (list / cards — the
// old TabGroup, swapped on Daniel's instruction 2026-10-19) + the plus
// IconButton. Body: ItemGroup per recorded group (ListItemGroup → ItemGroup),
// GroupLabel label + icon, rows from ListItem Template variant=file, cards from
// CardFile, empty states from EmptyState Template. Icons are written with the
// scratch-variable bind/unbind workaround (Font Awesome is not in the sandbox).
const IDS = __IDS__;
const ITEMGROUP = '6e2a7e317ec0905fd4e8e8fb43ca97dd72102fc9';
const LI_TEMPLATE = '6143ddf12ee6dcdc5799980cd14c3969c89b1b10';
const page = await figma.getNodeByIdAsync('1950:34790'); await figma.setCurrentPageAsync(page);
const base = k => k.replace(/#[^#]*$/, '').replace(/^[^A-Za-z]+/, '');
function setP(inst, want, kind) { const P = {}; for (const [k, v] of Object.entries(inst.componentProperties)) { const b = base(k); if (!(b in want)) continue; if (kind === 'text' && v.type !== 'TEXT') continue; if (kind === 'variant' && v.type !== 'VARIANT') continue; P[k] = want[b]; } if (Object.keys(P).length) inst.setProperties(P); return Object.keys(P).length; }
const find = (n, name, pred) => n.findOne(x => x.type === 'INSTANCE' && x.name === name && (!pred || pred(x)));
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' }); await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
const root = page.children.find(c => c.name === '⚙ DS snapshot (files-dm)');
const rec = JSON.parse(root.children.map(t => t.characters).join(''));
// scratch variable for icon literals
let col = (await figma.variables.getLocalVariableCollectionsAsync()).find(c => c.name === '⚙ scratch icon');
if (!col) col = figma.variables.createVariableCollection('⚙ scratch icon');
let v = null; for (const id of col.variableIds) { const x = await figma.variables.getVariableByIdAsync(id); if (x && x.name === 'icon') v = x; }
if (!v) v = figma.variables.createVariable('icon', col, 'STRING');
const mode = col.modes[0].modeId;
const localVars = {};
for (const id of col.variableIds) { const x = await figma.variables.getVariableByIdAsync(id); if (x) localVars[x.name] = x; }
function localVar(name) { if (!localVars[name]) { const x = figma.variables.createVariable(name, col, 'STRING'); x.setValueForMode(mode, name); x.scopes = ['TEXT_CONTENT']; localVars[name] = x; } return localVars[name]; }
function writeIcon(iconInst, name) { const t = iconInst.findOne(n => n.type === 'TEXT'); if (t.characters === name) return; v.setValueForMode(mode, name); t.setBoundVariable('characters', v); t.setBoundVariable('characters', null); }
const ctxMenu = await figma.variables.importVariableByKeyAsync('2a26be01d8dd87c040a7af72aaf6933ccf61b220');
const igSet = await figma.importComponentSetByKeyAsync(ITEMGROUP);
const liSet = await figma.importComponentSetByKeyAsync(LI_TEMPLATE);
const liFile = liSet.children.find(x => x.name === 'variant=file');
const pick = (set, want) => set.children.find(c => Object.entries(want).every(([k, val]) => c.variantProperties[k] === val));
const annOf = a => a.map(x => { const r = { labelMarkdown: x.labelMarkdown || x.label }; if (x.categoryId) r.categoryId = x.categoryId; return r; });
const report = [];

for (const id of IDS) {
  const R = rec.dms.find(d => d.id === id);
  const dm = await figma.getNodeByIdAsync(id);
  const N = R.nodes;
  const r = { id, rows: 0, cards: 0, empties: 0, groups: 0, ann: 0 };
  // ---- header
  const header = dm.children.find(c => c.name === 'Header');
  const content = find(header, 'Content');
  setP(content, { slotRight: 'true' }, 'variant');
  const title = find(header, 'Title');
  setP(title, { slotRight: 'true' }, 'variant');
  setP(title, { label: N.find(x => x.t === 'TEXT' && x.n === 'Title').tx }, 'text');
  setP(title.children.find(c => c.name === 'Slot Right'), { variant: 'counter' }, 'variant');
  const cRec = N.find(x => x.c === 'Counter');
  const cVal = Object.entries(cRec.pr).find(([k]) => base(k) === 'value')[1];
  setP(find(header, 'Counter', x => x.children.some(c => c.type === 'TEXT')), { value: String(cVal) }, 'text');
  const sr = content.children.find(c => c.name === 'Slot Right');
  setP(sr, { slots: '2' }, 'variant');
  setP(sr.children.find(c => c.name === 'Slot 2'), { instance: 'segmentedControl' }, 'variant');
  setP(sr.children.find(c => c.name === 'Slot 1'), { instance: 'iconButton' }, 'variant');
  // Cards View shows the cards segment selected (the old frame left "list" on).
  const isCards = N.some(x => x.c === 'CardFile');
  const seg = find(header, 'SegmentedControl');
  setP(seg, { selected: isCards ? '2' : '1' }, 'variant');
  const s1 = find(header, 'Segment 1'), s2 = find(header, 'Segment 2');
  setP(find(s1, 'Icon'), { style: isCards ? 'regular' : 'solid' }, 'variant');
  setP(find(s2, 'Icon'), { style: isCards ? 'solid' : 'regular' }, 'variant');
  // The SELECTED segment's icon is solid, and on a solid segment icon an
  // unbound literal reverts to the placeholder — so that one stays BOUND to a
  // local variable holding the name; the regular one takes a plain literal.
  const segIcon = (s, name, solid) => { const ic = find(find(header, s), 'Icon'); if (solid) ic.findOne(n => n.type === 'TEXT').setBoundVariable('characters', localVar(name)); else { ic.findOne(n => n.type === 'TEXT').setBoundVariable('characters', null); writeIcon(ic, name); } };
  segIcon('Segment 1', 'list-ul', !isCards);
  // grid-2 is the DS `views/cards-view` token (the old tab was bound to it).
  find(find(header, 'Segment 2'), 'Icon').findOne(n => n.type === 'TEXT').setBoundVariable('characters', await figma.variables.importVariableByKeyAsync('d412f08620396239072b507ded25cbf99809dda1'));
  const ib = find(header, 'IconButton');
  const disabled = N.some(x => x.c === 'IconButton' && /_state=disabled/.test(x.v));
  setP(ib, { state: disabled ? 'disabled' : 'default' }, 'variant');
  writeIcon(find(find(header, 'IconButton'), 'Icon'), 'plus');
  // header annotations: TabGroup → SegmentedControl, plus IconButton
  for (const x of N.filter(x => x.ann)) {
    if (x.c === 'TabGroup') { find(header, 'SegmentedControl').annotations = annOf(x.ann); r.ann++; }
    else if (x.c === 'IconButton' && !x.p.includes('.2.')) { find(header, 'IconButton').annotations = annOf(x.ann); r.ann++; }
  }
  // ---- body
  const body = dm.children.find(c => c.type === 'SLOT' && c.name === 'body');
  for (const c of [...body.children]) c.remove();
  const bRec = N.find(x => x.t === 'SLOT' && x.n === 'body' && x.p.split('.').length <= 2);
  [body.paddingTop, body.paddingRight, body.paddingBottom, body.paddingLeft] = bRec.pad; body.itemSpacing = bRec.gap;
  if (bRec.ann) { body.annotations = annOf(bRec.ann); r.ann++; }
  const bp = bRec.p + '.';
  const depth = p => p.split('.').length;
  const tops = N.filter(x => x.p.startsWith(bp) && depth(x.p) === depth(bp) && x.t === 'INSTANCE');
  const under = (p) => N.filter(x => x.p.startsWith(p + '.'));
  const textIn = (p, name) => (under(p).find(x => x.t === 'TEXT' && x.n === name) || {}).tx;
  async function addEmpty(slot, x) {
    const set = await figma.importComponentSetByKeyAsync(x.k);
    const es = set.children.find(c => c.name === x.v).createInstance(); slot.appendChild(es); es.layoutSizingHorizontal = 'FILL';
    const t = es.findOne(n => n.type === 'INSTANCE' && Object.entries(n.componentProperties || {}).some(([k, v2]) => base(k) === 'caption' && v2.type === 'TEXT'));
    setP(t, { caption: textIn(x.p, 'Caption') }, 'text'); r.empties++;
  }
  for (let gi = 0; gi < tops.length; gi++) {
    const g = tops[gi];
    if (g.c === 'EmptyState Template') { await addEmpty(body, g); continue; }
    // ItemGroup / ListItemGroup → new ItemGroup
    const kids = under(g.p).filter(x => ['ListItem Template', 'CardFile', 'EmptyState Template'].includes(x.c));
    const cards = kids.some(x => x.c === 'CardFile');
    const ig = pick(igSet, { header: 'true', isAccordion: 'false', open: 'false', view: cards ? 'cards' : 'list', isTruncated: 'false', isExpanded: 'false', divider: gi < tops.length - 1 ? 'true' : 'false' }).createInstance();
    body.appendChild(ig); ig.layoutSizingHorizontal = 'FILL'; r.groups++;
    const gl = find(ig, 'Label', x => Object.keys(x.componentProperties).some(k => base(k) === 'label'));
    setP(gl, { slotLeft: 'true' }, 'variant');
    setP(gl, { label: textIn(g.p, 'Label') }, 'text');
    const glIconRec = under(g.p).find(x => x.c === 'Icon');
    setP(find(gl, 'Slot Left'), { instance: 'icon' }, 'variant');
    // The recorded icon was BOUND to a DS token (public / private): bind it
    // again by key; only an unbound icon gets a literal.
    const glIcon = find(find(ig, 'Label', x => Object.keys(x.componentProperties).some(k => base(k) === 'label')), 'Icon');
    if (glIconRec.pv && glIconRec.pv.iconName) glIcon.findOne(n => n.type === 'TEXT').setBoundVariable('characters', await figma.variables.importVariableByKeyAsync(glIconRec.pv.iconName));
    else writeIcon(glIcon, glIconRec.pr.iconName);
    if (g.ann) { ig.annotations = annOf(g.ann); r.ann++; }
    const slot = ig.findOne(n => n.type === 'SLOT' && n.name === (cards ? 'bodyCards' : 'bodyList'));
    for (const c of [...slot.children]) c.remove();
    for (const x of kids) {
      if (x.c === 'EmptyState Template') { await addEmpty(slot, x); continue; }
      if (x.c === 'CardFile') {
        const comp = await figma.importComponentByKeyAsync(x.k).catch(() => null) || (await figma.importComponentSetByKeyAsync(x.k)).defaultVariant;
        const cf = comp.createInstance(); slot.appendChild(cf); r.cards++;
        const nameTx = textIn(x.p, 'File name'); const tn = cf.findOne(n => n.type === 'TEXT' && n.name === 'File name'); if (tn && nameTx && tn.characters !== nameTx) tn.characters = nameTx;
        const a = under(x.p).find(y => y.ann && y.c === 'IconButton'); if (a) { find(cf, 'IconButton').annotations = annOf(a.ann); r.ann++; }
        continue;
      }
      // a file row
      const row = liFile.createInstance(); slot.appendChild(row); row.layoutSizingHorizontal = 'FILL'; r.rows++;
      const li = find(row, 'ListItem');
      const liRec = under(x.p).find(y => y.c === 'ListItem');
      const vp = Object.fromEntries(liRec.v.split(', ').map(s => s.split('=')));
      setP(li, { isClickable: vp.isClickable, isDraggable: vp.isDraggable }, 'variant');
      // Right slot: the template defaults to a chevron; file rows carry the
      // context-menu IconButton, its glyph BOUND to the DS `context-menu` token.
      setP(find(row, 'Slot 1'), { instance: 'iconButton' }, 'variant');
      find(find(row, 'IconButton'), 'Icon').findOne(n => n.type === 'TEXT').setBoundVariable('characters', ctxMenu);
      const ap = find(row, 'AvatarPicker'); if (ap) setP(ap, { variant: 'file' }, 'variant');
      const af = find(row, 'AvatarFile'); const afRec = under(x.p).find(y => y.c === 'AvatarFile');
      if (af && afRec) setP(af, { type: afRec.v.match(/type=([^,]+)/)[1] }, 'variant');
      setP(find(row, 'Title', y => Object.keys(y.componentProperties).some(k => base(k) === 'label')), { label: textIn(x.p, 'Title') }, 'text');
      setP(find(row, 'Caption', y => Object.keys(y.componentProperties).some(k => base(k) === 'label')), { label: textIn(x.p, 'Caption') }, 'text');
      if (x.ann) { row.annotations = annOf(x.ann); r.ann++; }
      const ibA = under(x.p).find(y => y.ann && y.t === 'INSTANCE' && y.c !== 'ListItem Template');
      if (ibA) { find(row, 'IconButton').annotations = annOf(ibA.ann); r.ann++; }
    }
  }
  report.push(r);
}
return report;
