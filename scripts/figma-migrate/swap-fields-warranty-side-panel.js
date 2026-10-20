// Swap retired TextInput / DateInput / TextArea wrappers to the new Input.
// Copies the old Label + the live inner field top-down by index path, then
// forces the recorded (pre-update) texts, compares visible texts with the
// snapshot and removes the old wrapper only when they match.
const IDS = __IDS__;
const page = await figma.getNodeByIdAsync('18594:94275'); await figma.setCurrentPageAsync(page);
const strip = k => k.replace(/#[^#]*$/, '');
const data = await figma.getNodeByIdAsync('22143:1896');
const rec = JSON.parse(data.children.map(t => t.characters).join(''));
const set = await figma.importComponentSetByKeyAsync('926311e076417e68d279140f1185642d471bad5b');
const variant = set.children.find(c => c.name === 'header=true');
for (const s of ['Regular', 'Medium', 'Semi Bold']) await figma.loadFontAsync({ family: 'Inter', style: s });
const col = (await figma.variables.getLocalVariableCollectionsAsync()).find(c => c.name === '⚙ icon names — migration 2026-10-20');
const mode = col.modes[0].modeId;
const vars = {}; for (const id of col.variableIds) { const x = await figma.variables.getVariableByIdAsync(id); vars[x.name] = x; }
function lv(n) { if (!vars[n]) { const x = figma.variables.createVariable(n, col, 'STRING'); x.setValueForMode(mode, n); x.scopes = ['TEXT_CONTENT']; vars[n] = x; } return vars[n]; }
const FIELD = { TextInput: 'textField', DateInput: 'dateField', TextArea: 'textArea' };
const ICONISH = /^(Icon|FAIcon|icon)$/;
async function setOf(i) { const m = await i.getMainComponentAsync(); return m && (m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m); }
// copy instance props (variants first), then recurse by index
async function copy(a, b, log) {
  if (a.type === 'INSTANCE' && b.type === 'INSTANCE') {
    const sa = await setOf(a), sb = await setOf(b);
    if (!sa || !sb || sa.key !== sb.key) { log.push('key≠ ' + a.name); return; }
    const pa = a.componentProperties, pb = b.componentProperties;
    const V = {}, T = {};
    for (const [k, v] of Object.entries(pa)) { if (!(k in pb) || pb[k].value === v.value) continue; if (v.type === 'VARIANT') V[k] = v.value; else if (v.type === 'BOOLEAN') V[k] = v.value; else if (v.type === 'TEXT' && !/iconName/.test(k)) T[k] = v.value; }
    if (Object.keys(V).length) b.setProperties(V);
    if (Object.keys(T).length) b.setProperties(T);
    b = await figma.getNodeByIdAsync(b.id);
  }
  if (a.type === 'TEXT' && b.type === 'TEXT') {
    const icon = a.parent && ICONISH.test(a.parent.name) || ICONISH.test(a.name);
    if (a.characters !== b.characters) { if (icon) b.setBoundVariable('characters', lv(a.characters)); else if (!(b.componentPropertyReferences && b.componentPropertyReferences.characters)) b.characters = a.characters; }
    return;
  }
  const ac = 'children' in a ? a.children : [], bc = 'children' in b ? b.children : [];
  for (let i = 0; i < ac.length; i++) { if (!bc[i]) { log.push('missing child ' + ac[i].name); continue; } if (bc[i].name !== ac[i].name) log.push('name≠ ' + ac[i].name + '/' + bc[i].name); await copy(ac[i], bc[i], log); }
}
const out = [];
for (const id of IDS) {
  const old = await figma.getNodeByIdAsync(id);
  const R = rec.extra.find(e => e.id === id);
  const kind = R.kind;
  const log = [];
  const inst = variant.createInstance();
  const parent = old.parent; const idx = parent.children.findIndex(c => c.id === old.id);
  parent.insertChild(idx, inst);
  inst.layoutSizingHorizontal = old.layoutSizingHorizontal; inst.layoutSizingVertical = old.layoutSizingVertical;
  // field type first (rebuilds the subtree)
  const fieldPart = inst.findOne(n => n.type === 'INSTANCE' && n.name === '#️⃣ Field');
  fieldPart.setProperties({ field: FIELD[kind] });
  // header: label / helpText booleans from the old wrapper, then the Label
  const hdr = inst.findOne(n => n.type === 'INSTANCE' && n.name === '#️⃣ Header');
  const op = Object.fromEntries(Object.entries(old.componentProperties).map(([k, v]) => [strip(k), v.value]));
  const hp = {}; for (const k of Object.keys(hdr.componentProperties)) { const b = strip(k); if (b in op) hp[k] = op[b]; } hdr.setProperties(hp);
  const oldLabel = old.findOne(n => n.type === 'INSTANCE' && n.name === 'Label');
  const newLabel = (await figma.getNodeByIdAsync(inst.id)).findOne(n => n.type === 'INSTANCE' && n.name === 'Label');
  await copy(oldLabel, newLabel, log);
  // the live inner field: old wrapper's 2nd child ↔ new #️⃣ Field's only child
  const oldField = old.children.find(c => c.type === 'INSTANCE' && c.name !== '#️⃣ Header');
  const newField = (await figma.getNodeByIdAsync(fieldPart.id)).children.find(c => c.type === 'INSTANCE');
  await copy(oldField, newField, log);
  // force the PRE-UPDATE texts (the update reset some values inside the frozen wrapper)
  const want = R.texts.map(x => x[1]);
  const fresh = await figma.getNodeByIdAsync(inst.id);
  const valueNodes = fresh.findAllWithCriteria({ types: ['TEXT'] }).filter(t => t.visible);
  const now = valueNodes.map(t => t.characters);
  if (now.length === want.length) for (let k = 0; k < now.length; k++) if (now[k] !== want[k]) {
    const t = valueNodes[k]; const owner = t.parent;
    const ref = t.componentPropertyReferences && t.componentPropertyReferences.characters;
    if (ref) { let o = t.parent; while (o && !(o.type === 'INSTANCE' && o.componentProperties[ref])) o = o.parent; if (o) o.setProperties({ [ref]: want[k] }); }
    else if (ICONISH.test(owner.name) || ICONISH.test(t.name)) t.setBoundVariable('characters', lv(want[k]));
    else t.characters = want[k];
    log.push('forced ' + now[k] + ' → ' + want[k]);
  }
  const final = (await figma.getNodeByIdAsync(inst.id)).findAllWithCriteria({ types: ['TEXT'] }).filter(t => t.visible).map(t => t.characters);
  const ok = JSON.stringify(final) === JSON.stringify(want);
  if (ok) old.remove();
  out.push({ id, kind, newId: inst.id, ok, want: want.map(s => s.slice(0, 30)), final: final.map(s => s.slice(0, 30)), log });
}
return out;
