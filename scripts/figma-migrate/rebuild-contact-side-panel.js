// Rebuild DisplayModules on the "Contact" Side Panel page from the snapshot
// (snapshot-contact-side-panel.js). Replace __IDS__ with a JSON array of
// DisplayModule ids and __DRY__ with true/false (true = throw at the end, so
// nothing is committed and the error carries the report).
// Header: title + optional one IconButton (pen / plus) + its annotation.
// Body: parked copies cloned back, EXCEPT retired ListItemGroups, which become
// a new ItemGroup (header=false) with rows BUILT from the recorded visible state.
// Icons: DS tokens are bound by key; literals stay BOUND to a local variable
// named after the icon (an unbound literal reverts) — DS Icon Fixer finishes it.
const IDS = __IDS__;
const DRY = __DRY__;
const page = await figma.getNodeByIdAsync('21874:10859'); await figma.setCurrentPageAsync(page);
const strip = k => k.replace(/#[^#]*$/, '');
const base = k => strip(k).replace(/^[^A-Za-z]+/, '');
function setP(inst, want, kind) { const P = {}; for (const [k, v] of Object.entries(inst.componentProperties)) { const b = base(k); if (!(b in want)) continue; if (kind === 'text' && v.type !== 'TEXT') continue; if (kind === 'variant' && v.type !== 'VARIANT') continue; if (v.value === want[b]) continue; P[k] = want[b]; } if (Object.keys(P).length) inst.setProperties(P); return Object.keys(P).length; }
const find = (n, name) => n.findOne(x => x.type === 'INSTANCE' && x.name === name);
const kidsI = n => n.children.filter(c => c.type === 'INSTANCE');
for (const s of ['Regular', 'Medium', 'Semi Bold']) await figma.loadFontAsync({ family: 'Inter', style: s });
const data = await figma.getNodeByIdAsync('24063:4436');
const rec = JSON.parse(data.children.map(t => t.characters).join(''));
// local icon-name variables
const COL = '⚙ icon names — migration 2026-10-20';
let col = (await figma.variables.getLocalVariableCollectionsAsync()).find(c => c.name === COL);
if (!col) col = figma.variables.createVariableCollection(COL);
const mode = col.modes[0].modeId;
const lvars = {}; for (const id of col.variableIds) { const x = await figma.variables.getVariableByIdAsync(id); if (x) lvars[x.name] = x; }
function lv(name) { if (!lvars[name]) { const x = figma.variables.createVariable(name, col, 'STRING'); x.setValueForMode(mode, name); x.scopes = ['TEXT_CONTENT']; lvars[name] = x; } return lvars[name]; }
const dsVar = {}; async function dv(key) { if (!dsVar[key]) dsVar[key] = await figma.variables.importVariableByKeyAsync(key); return dsVar[key]; }
async function icon(iconInst, name, key) { const t = iconInst.findOne(n => n.type === 'TEXT'); t.setBoundVariable('characters', key ? await dv(key) : lv(name)); return name; }
const annOf = (a, keepProps) => a.map(x => { const r = { labelMarkdown: x.labelMarkdown || x.label }; if (x.categoryId) r.categoryId = x.categoryId; if (keepProps && x.properties) r.properties = x.properties; return r; });
// components
const liveLI = await figma.getNodeByIdAsync('23816:5234');
const liSet = (await liveLI.getMainComponentAsync()).parent;
const pick = (set, want) => set.children.find(c => { const vp = Object.fromEntries(c.name.split(', ').map(s => s.split('='))); return Object.entries(want).every(([k, v]) => vp[k] === v); });
const igSet = await figma.importComponentSetByKeyAsync('6e2a7e317ec0905fd4e8e8fb43ca97dd72102fc9');
const igVar = pick(igSet, { header: 'false', isAccordion: 'false', open: 'false', view: 'list', isTruncated: 'false', isExpanded: 'false', divider: 'false' });
const AV = { genericObject: 'generic', labor: 'laborRate' };
const RIGHT = { iconButton: 'iconButton', iconButtonContextMenu: 'iconButton', iconOpen: 'open', liveUserAvatar: 'avatar' };

// ---- one row from a recorded group's visible-state list
async function buildRow(slot, F, p, row, log) {
  const under = F.filter(x => x.i.startsWith(p + '.'));
  const clickable = /isClickable=true/.test(row.v);
  const loading = under.some(x => x.c === 'SkeletonTypography');
  const rsIdx = under.filter(x => x.c === '#️⃣ Slot Right Instance');
  const inRight = x => rsIdx.some(r => x.i.startsWith(r.i + '.'));
  const avPart = under.find(x => x.c === '#️⃣ Avatar' && /^variant=/.test(x.v || '') && !inRight(x));
  const avIcon = avPart && under.find(x => x.c === 'Icon' && x.i.startsWith(avPart.i + '.'));
  const avIconTx = avIcon && under.find(x => x.t === 'TEXT' && x.i.startsWith(avIcon.i + '.'));
  const txt = n => (under.find(x => x.t === 'TEXT' && x.n === n && !inRight(x)) || {}).tx;
  const title = txt('Title'), caption = txt('Caption'), tag = txt('Tag');
  const v = pick(liSet, { isClickable: loading ? 'false' : String(clickable), isDraggable: 'false', isAccordion: 'false', open: 'false', state: 'default', size: 'default', slotBottom: 'false', isLoading: String(loading) });
  const li = v.createInstance(); slot.appendChild(li); li.layoutSizingHorizontal = 'FILL';
  const body = find(li, 'Body');
  setP(body, { slotLeft: avPart ? 'true' : 'false', slotRight: rsIdx.length ? 'true' : 'false' }, 'variant');
  const out = { id: li.id, title, caption, loading, clickable };
  if (avPart && !loading) {
    const ap = find(li, 'AvatarPicker');
    const want = avPart.v.replace('variant=', ''); setP(ap, { variant: AV[want] || want }, 'variant');
    out.avatar = AV[want] || want;
    if (!loading && avIconTx) { const ic = find(find(li, 'AvatarPicker'), 'Icon'); if (ic) out.avIcon = await icon(ic, avIconTx.tx, avIcon.pv && avIcon.pv.iconName); }
  }
  const tl = find(li, 'Text Left');
  setP(tl, { variant: (title && caption) ? 'titleCaption' : 'title' }, 'variant');
  const T = find(li, 'Title'); if (T) { if (loading) setP(T, { isLoading: 'true' }, 'variant'); else if (title) setP(T, { label: title }, 'text'); }
  if (caption) setP(find(li, 'Caption'), { label: caption }, 'text');
  // the old "Text Right variant=tag" → ItemText textRight + Text Right variant=tag
  if (tag) { setP(find(li, 'ItemText'), { textRight: 'true' }, 'variant'); setP(find(await figma.getNodeByIdAsync(li.id), 'Text Right'), { variant: 'tag' }, 'variant'); setP(find(await figma.getNodeByIdAsync(li.id), 'Tag'), { label: tag }, 'text'); out.tag = tag; }
  // annotations on the text lines go back onto the same kind of node (the line's Label TEXT)
  for (const x of under.filter(y => y.t === 'TEXT' && y.ann && !inRight(y))) {
    const line = find(await figma.getNodeByIdAsync(li.id), x.n);
    const lab = line && line.findOne(n => n.type === 'TEXT');
    if (lab) { lab.annotations = annOf(x.ann, true); log.ann++; } else out.lostAnn = (out.lostAnn || 0) + 1;
  }
  if (rsIdx.length) {
    const sr = find(li, 'Slot Right'); setP(sr, { slots: String(rsIdx.length) }, 'variant');
    const slots = kidsI(await figma.getNodeByIdAsync(sr.id));
    out.right = [];
    for (let k = 0; k < rsIdx.length; k++) {
      const R = rsIdx[k]; const type = R.v.replace('instance=', ''); const s = slots[k];
      setP(s, { instance: RIGHT[type] || type }, 'variant');
      const s2 = await figma.getNodeByIdAsync(s.id);
      const ru = under.filter(x => x.i.startsWith(R.i + '.'));
      if (RIGHT[type] === 'iconButton') {
        const ibR = ru.find(x => x.c === 'IconButton'); const st = ((ibR && ibR.v) || '').match(/_state=([a-z]+)/); const ib = find(s2, 'IconButton') || s2;
        if (st && st[1] !== 'default') setP(ib, { state: st[1] }, 'variant');
        const icR = ru.find(x => x.c === 'Icon'); const icT = ru.find(x => x.t === 'TEXT');
        let nm = icT && icT.tx;
        if (st && st[1] === 'loading') nm = '(loading)';
        else { const ic = find(await figma.getNodeByIdAsync(ib.id), 'Icon'); nm = await icon(ic, icT.tx, icR.pv && icR.pv.iconName); }
        if (ibR && ibR.ann) { ib.annotations = annOf(ibR.ann); log.ann++; }
        out.right.push(nm + (st && st[1] !== 'default' ? '/' + st[1] : ''));
      } else if (RIGHT[type] === 'open') {
        const icT = ru.find(x => x.t === 'TEXT'); const ic = find(s2, 'Icon'); const cur = ic.findOne(n => n.type === 'TEXT').characters;
        if (icT && icT.tx !== cur) await icon(ic, icT.tx, null);
        out.right.push('open:' + (icT && icT.tx));
      } else if (RIGHT[type] === 'avatar') {
        const ap = find(s2, 'AvatarPicker'); setP(ap, { variant: 'live' }, 'variant');
        out.right.push('avatar:live'); out.liveRec = ru.filter(x => x.t === 'INSTANCE').map(x => x.c + ' ' + x.v + ' ' + JSON.stringify(x.p)).concat(ru.filter(x => x.img).map(x => 'img ' + x.n + ' ' + x.img));
      }
    }
  }
  for (const x of [row, ...under.filter(y => y.ann && (y.c === 'ListItem'))]) if (x.ann) { li.annotations = annOf(x.ann); log.ann++; }
  return out;
}

// ---- a retired ListItemGroup copy → ItemGroup
async function buildGroup(bodySlot, G, log) {
  const F = G.full;
  const ig = igVar.createInstance(); bodySlot.appendChild(ig); ig.layoutSizingHorizontal = 'FILL';
  const slot = ig.findOne(n => n.type === 'SLOT' && n.name === 'bodyList');
  for (const c of [...slot.children]) c.remove();
  const items = F.find(x => x.t === 'SLOT' && x.n === 'items');
  const depth = items.i.split('.').length + 1;
  const direct = F.filter(x => x.i.startsWith(items.i + '.') && x.i.split('.').length === depth);
  const rows = [];
  for (const x of direct) {
    if (x.c === 'ListItem') rows.push(await buildRow(slot, F, x.i, x, log));
    else if (x.c === 'Divider') { const set = await figma.importComponentSetByKeyAsync(x.k); const d = pick(set, Object.fromEntries(x.v.split(', ').map(s => s.split('=')))).createInstance(); slot.appendChild(d); d.layoutSizingHorizontal = 'FILL'; rows.push('— divider ' + x.v); }
    else rows.push('?? ' + x.c + ' ' + x.n);
  }
  return { ig: ig.id, rows };
}

const report = [];
for (const id of IDS) {
  const R = rec.dms.find(d => d.id === id);
  const dm = await figma.getNodeByIdAsync(id);
  const log = { id, ann: 0 };
  // ---- header
  const flat = []; (function f(list) { for (const [p, x] of list) { flat.push(x); if (x.sub && x.sub.c) f(x.sub.c); } })(R.cap.c || []);
  const title = flat.find(x => x.n === '#️⃣ Title' && x.p && x.p['↳ title']).p['↳ title'];
  const hIcon = flat.find(x => x.n === 'Icon' && x.p && x.p.iconName);
  const hBtn = flat.find(x => x.n === 'IconButton');
  const header = kidsI(dm).find(c => c.name === 'Header');
  const content = find(header, 'Content');
  setP(content, { slotRight: hIcon ? 'true' : 'false' }, 'variant');
  setP(find(header, 'Title'), { label: title }, 'text');
  log.title = title;
  if (hIcon) {
    const sr = kidsI(await figma.getNodeByIdAsync(content.id)).find(c => c.name === 'Slot Right');
    setP(sr, { slots: '1' }, 'variant');
    const s1 = kidsI(await figma.getNodeByIdAsync(sr.id))[0];
    setP(s1, { instance: 'iconButton' }, 'variant');
    const ib = find(await figma.getNodeByIdAsync(s1.id), 'IconButton');
    log.hIcon = await icon(find(ib, 'Icon'), hIcon.p.iconName, hIcon.pv && hIcon.pv.iconName);
    if (hBtn && hBtn.ann) { ib.annotations = annOf(hBtn.ann); log.ann++; }
  }
  log.dmAnnNow = (dm.annotations || []).length; log.dmAnnRec = (R.ann || []).length;
  if (R.ann && R.ann.length && !(dm.annotations || []).length) { dm.annotations = annOf(R.ann); log.dmAnn = 'rewritten'; log.ann++; }
  // ---- body
  const body = dm.children.find(c => c.type === 'SLOT' && c.name === 'body');
  for (const c of [...body.children]) c.remove();
  [body.paddingTop, body.paddingRight, body.paddingBottom, body.paddingLeft] = R.pad; body.itemSpacing = R.gap;
  const box = await figma.getNodeByIdAsync(R.box);
  log.body = [];
  for (let k = 0; k < box.children.length; k++) {
    const c = box.children[k];
    const G = rec.extra.find(e => e.kind === 'ListItemGroup' && e.box === 'dm:' + id && e.idx.join('.') === String(k));
    if (G) { log.body.push(await buildGroup(body, G, log)); continue; }
    const n = c.clone(); body.appendChild(n); try { n.layoutSizingHorizontal = R.sizing[k][0]; } catch (e) {}
    log.body.push('clone ' + c.name);
  }
  const fresh = await figma.getNodeByIdAsync(id);
  log.readBack = fresh.findAllWithCriteria({ types: ['TEXT'] }).filter(t => t.visible).map(t => t.characters + (t.boundVariables && t.boundVariables.characters ? '[b]' : ''));
  log.annCount = fresh.findAll(n => n.annotations && n.annotations.length).length + ((fresh.annotations || []).length ? 1 : 0);
  report.push(log);
}
if (DRY) throw new Error('DRY ' + JSON.stringify(report));
return report;
