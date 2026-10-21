const DRY = __DRY__;
const PAGE = '0:1';
const TAG = '⚙ DS snapshot (dsmig-labor)';
const strip = k => k.replace(/#[^#]*$/, '');
async function setOf(i){ const m = await i.getMainComponentAsync(); if(!m) return null; const s = m.parent && m.parent.type==='COMPONENT_SET' ? m.parent : m; return {m, s}; }
function defDefaults(s){ try { const d = s.componentPropertyDefinitions; const o={}; for (const [k,v] of Object.entries(d)) o[k]=v.defaultValue; return o; } catch(e){ return {}; } }
function paintSig(p){ if (!Array.isArray(p)) return "mixed"; return JSON.stringify(p.map(x=>({t:x.type,c:x.color,o:x.opacity,v:x.boundVariables&&x.boundVariables.color&&x.boundVariables.color.id}))); }
const varKey = {};
async function vk(id){ if (!(id in varKey)) { const v = await figma.variables.getVariableByIdAsync(id); varKey[id] = v ? v.key : null; } return varKey[id]; }
async function paints(p){ const o=[]; if (!Array.isArray(p)) return "mixed"; for (const x of p) { const r={type:x.type}; if (x.color) r.color=x.color; if (x.opacity!==undefined) r.opacity=x.opacity; if (x.visible===false) r.visible=false; if (x.boundVariables&&x.boundVariables.color) r.vkey = await vk(x.boundVariables.color.id); o.push(r);} return o; }
function anns(n){ return (n.annotations||[]).map(a=>{ const r={}; if (a.labelMarkdown) r.labelMarkdown=a.labelMarkdown; else if (a.label) r.label=a.label; if (a.properties&&a.properties.length) r.properties=a.properties; if (a.categoryId) r.categoryId=a.categoryId; return r; }); }
async function propVars(inst){ const o = {}; for (const [k,v] of Object.entries(inst.componentProperties)) { if (v.boundVariables && v.boundVariables.value) { const key = await vk(v.boundVariables.value.id); if (key) o[strip(k)] = key; } } return o; }
async function cap(inst){
  const so = await setOf(inst); if(!so) return null;
  const defs = defDefaults(so.s);
  const P = {};
  for (const [k,v] of Object.entries(inst.componentProperties)) { if (v.type==='VARIANT') continue; if (v.value !== defs[k]) P[strip(k)] = v.value; }
  const out = {k: so.s.key, n: so.s.name.replace('#️⃣ ',''), v: so.m.name};
  if (Object.keys(P).length) out.p = P;
  const pv = await propVars(inst); if (Object.keys(pv).length) out.pv = pv;
  const kids = [];
  async function walk(a, b, path){
    const ac = 'children' in a ? a.children : [], bc = 'children' in b ? b.children : [];
    for (let i=0;i<ac.length;i++){
      const x = ac[i], y = bc[i]; const pth = path.concat([i]);
      if (!y || y.name!==x.name || y.type!==x.type) { kids.push([pth.join('.'), {mismatch:x.name, t:x.type}]); continue; }
      const r = {};
      if (x.type==='SLOT') { if (x.children.length) kids.push([pth.join('.'), {n:x.name, slot:x.children.length}]); continue; }
      if (x.visible !== y.visible) r.vis = x.visible;
      if (x.type==='TEXT' && x.characters!==y.characters && !(x.componentPropertyReferences && x.componentPropertyReferences.characters)) r.tx = x.characters;
      if ('fills' in x && x.type!=='INSTANCE' && paintSig(x.fills)!==paintSig(y.fills)) r.fill = await paints(x.fills);
      if (x.annotations && x.annotations.length) r.ann = anns(x);
      if (x.type==='INSTANCE') {
        const xs = await setOf(x), ys = await setOf(y);
        if (!xs || !ys || xs.s.key!==ys.s.key || xs.m.id!==ys.m.id) { r.n = x.name; r.sub = await cap(x); kids.push([pth.join('.'), r]); continue; }
        const dp = {};
        for (const [k,v] of Object.entries(x.componentProperties)) { const yv = y.componentProperties[k]; if (!yv || yv.value!==v.value) dp[strip(k)] = v.value; }
        if (Object.keys(dp).length) r.p = dp;
        const pv2 = await propVars(x); if (Object.keys(pv2).length) r.pv = pv2;
      }
      if (Object.keys(r).length) kids.push([pth.join('.'), Object.assign({n:x.name}, r)]);
      if (x.visible) await walk(x, y, pth);
    }
  }
  await walk(inst, so.m, []);
  if (kids.length) out.c = kids;
  return out;
}
async function full(inst){
  const out = [];
  async function walk(n, path){
    if (!('children' in n)) return;
    for (let i=0;i<n.children.length;i++){
      const x = n.children[i]; const pth = path.concat([i]);
      if (!x.visible) continue;
      const r = {i: pth.join('.'), n: x.name, t: x.type};
      if (x.type==='TEXT') { r.tx = x.characters; if (x.boundVariables && x.boundVariables.characters) r.txv = await vk(x.boundVariables.characters.id); const f = await paints(x.fills); if (f !== 'mixed' && f.some(p=>p.vkey)) r.fill = f.map(p=>p.vkey||null); if (x.textStyleId && typeof x.textStyleId==='string') { const st = await figma.getStyleByIdAsync(x.textStyleId); if (st) r.style = st.key; } }
      if (x.type==='INSTANCE') { const so = await setOf(x); if (so) { r.c = so.s.name; r.k = so.s.key; r.v = so.m.name; } r.p = Object.fromEntries(Object.entries(x.componentProperties).map(([k,v])=>[strip(k), v.value])); const pv = await propVars(x); if (Object.keys(pv).length) r.pv = pv; }
      if (x.type!=='INSTANCE' && x.type!=='TEXT' && 'fills' in x) { const f = await paints(x.fills); if (f !== 'mixed' && f.some(p=>p.type==='IMAGE')) r.img = (x.fills||[]).filter(p=>p.type==='IMAGE').map(p=>p.imageHash); }
      if (x.annotations && x.annotations.length) r.ann = anns(x);
      out.push(r);
      if (x.type!=='SLOT' || true) await walk(x, pth);
    }
  }
  await walk(inst, []);
  return out;
}
function fp(nodes){ let t=0,tl=0,inst=0,ann=0,pl=0; for (const n of nodes){ const all=[n,...('findAll' in n?n.findAll(()=>true):[])]; for (const x of all){ if(x.type==='TEXT'){t++;tl+=x.characters.length;} if(x.type==='INSTANCE'){inst++;pl+=JSON.stringify(Object.values(x.componentProperties).map(v=>v.value)).length;} if(x.annotations) ann+=x.annotations.length; } } return [t,tl,inst,ann,pl]; }
function idxPath(n, stop){ const p = []; let c = n; while (c && c !== stop && c.parent) { p.unshift(c.parent.children.findIndex(x => x.id === c.id)); c = c.parent; } return p; }
function namePath(n, stop){ const p = []; let c = n; while (c && c !== stop && c.type !== 'PAGE') { p.unshift(c.name); c = c.parent; } return p.join(' / '); }

const DMNAME = 'DisplayModule';
const FULL = ['Input', 'Toast', 'AlertBanner', 'MenuItem', 'PopoverFooter', 'Menu', 'EmptyState', 'SelectList'];
const EXTRA = ['AlertBanner', 'Toast', 'MenuItem', 'Menu', 'SidePanel', 'SelectListItem', 'PopoverFooter', 'SelectListHeader', 'ListItemGroup', 'ListItem', 'ListItem Template', 'TextInput', 'SelectInput', 'DateInput', 'TextArea Dialog', 'TextArea', 'Dialog', 'Prompt', 'SelectList', 'IconButton', '#️⃣ ActionBar', 'Input', 'EmptyState'];
const page = await figma.getNodeByIdAsync(PAGE);
await figma.setCurrentPageAsync(page);
for (const c of [...page.children]) if (c.name === TAG) { c.locked = false; c.remove(); }
let maxX = 0; for (const c of page.children) maxX = Math.max(maxX, c.x + c.width);
const root = figma.createAutoLayout('HORIZONTAL', {name: TAG, itemSpacing: 200});
page.appendChild(root); root.x = maxX + 20000; root.y = 0;
const rec = {v: 3, pageId: PAGE, dms: [], extra: [], ann: []};
const bodySlots = new Set();
const all = page.findAllWithCriteria({types: ['INSTANCE']});
// 1. DisplayModules: record + clone bodies
for (const i of all) {
  const so = await setOf(i); if (!so || !so.m.remote || so.s.name !== DMNAME) continue;
  const slot = i.findOne(n => n.type === 'SLOT' && n.name === 'body');
  if (slot) bodySlots.add(slot.id);
  const kids = slot ? [...slot.children] : [];
  const r = {id: i.id, path: namePath(i), v: so.m.name, ann: anns(i), cap: await cap(i), slotW: slot ? slot.width : null, gap: slot ? slot.itemSpacing : null, pad: slot ? [slot.paddingTop, slot.paddingRight, slot.paddingBottom, slot.paddingLeft] : null, hdrTexts: i.findAllWithCriteria({types: ['TEXT']}).filter(t => t.visible && !(slot && (function(){ let p=t.parent; while(p && p!==i){ if(p===slot) return true; p=p.parent;} return false; })())).map(t => [t.name, t.characters]), kids: kids.length, fp: fp(kids)};
  if (kids.length) {
    const box = figma.createAutoLayout('VERTICAL', {name: 'dm:' + i.id});
    root.appendChild(box);
    box.counterAxisSizingMode = 'FIXED'; box.resize(slot.width, box.height); box.primaryAxisSizingMode = 'AUTO';
    box.itemSpacing = slot.itemSpacing || 0;
    const sizing = [];
    for (const k of kids) { const c = k.clone(); box.appendChild(c); sizing.push([k.layoutSizingHorizontal, k.layoutSizingVertical]); try { c.layoutSizingHorizontal = k.layoutSizingHorizontal; } catch(e) {} }
    r.sizing = sizing; r.box = box.id;
  }
  rec.dms.push(r);
}
for (const d of rec.dms) if (d.box) { const b = await figma.getNodeByIdAsync(d.box); const ch = []; for (const c of b.children) ch.push(await figma.getNodeByIdAsync(c.id)); d.fpCopy = fp(ch); }
const inBody = n => { let p = n.parent; while (p && p.type !== 'PAGE') { if (p.type === 'SLOT' && bodySlots.has(p.id)) return true; p = p.parent; } return false; };
const boxOf = n => { let p = n; while (p && p.parent && p.parent !== root) p = p.parent; return p && p.parent === root ? p : null; };
// 2. Extras: originals outside bodies + copies inside the parking boxes
const scan = [...all.filter(i => !inBody(i)), ...root.findAllWithCriteria({types: ['INSTANCE']})];
const seenOwner = new Set();
for (const i of scan) {
  const so = await setOf(i); if (!so || !so.m.remote) continue;
  if (!EXTRA.includes(so.s.name)) continue;
  if (so.s.name === 'IconButton' && /_state=default/.test(so.m.name)) continue;
  const box = boxOf(i);
  if (so.s.name === 'Menu' && box) continue;
  const r = {kind: so.s.name, id: i.id, v: so.m.name, path: namePath(i, box ? root : null)};
  if (box) { r.box = box.name; r.idx = idxPath(i, box); }
  if (['Toast', 'MenuItem', 'Menu', 'Dialog', 'Prompt', 'SidePanel', 'SelectListItem', 'PopoverFooter', 'SelectListHeader', 'ListItemGroup', 'ListItem', 'ListItem Template', 'TextInput', 'SelectInput', 'DateInput', 'TextArea Dialog', 'TextArea', '#️⃣ ActionBar'].includes(so.s.name)) r.cap = await cap(i);
  if (['Input', 'TextInput', 'DateInput', 'TextArea', 'Toast', 'MenuItem', 'PopoverFooter', 'EmptyState', 'SelectList'].includes(so.s.name)) r.texts = i.findAllWithCriteria({types: ['TEXT']}).filter(t => t.visible).map(t => [t.name, t.characters]);
  if (FULL.includes(so.s.name)) r.full = await full(i);
  r.props = Object.fromEntries(Object.entries(i.componentProperties).map(([k, v]) => [strip(k), v.value]));
  rec.extra.push(r);
}
// 3. Annotations on everything outside the bodies (copies carry their own)
for (const n of page.findAll(n => 'annotations' in n && n.annotations && n.annotations.length > 0)) {
  if (inBody(n) || boxOf(n)) continue;
  let top = n, p = n.parent; while (p && p.type !== 'PAGE') { if (p.type === 'INSTANCE') top = p; if (p.type === 'SLOT') break; p = p.parent; }
  rec.ann.push({id: n.id, ownerName: top.name, t: n.type, name: n.name, top: top.id, idx: idxPath(n, top), path: namePath(n), ann: anns(n)});
}
await figma.loadFontAsync({family: 'Inter', style: 'Regular'});
const json = JSON.stringify(rec);
const data = figma.createAutoLayout('VERTICAL', {name: 'data'});
root.insertChild(0, data);
for (let o = 0, n = 0; o < json.length; o += 40000, n++) { const t = figma.createText(); t.name = 'chunk ' + n; t.characters = json.slice(o, o + 40000); t.resize(400, t.height); t.textAutoResize = 'HEIGHT'; data.appendChild(t); }
root.locked = true;
const kinds = {}; for (const e of rec.extra) { const k = e.kind + (e.box ? ' (copy)' : ''); kinds[k] = (kinds[k] || 0) + 1; }
const fpBad = rec.dms.filter(d => d.kids && JSON.stringify(d.fp) !== JSON.stringify(d.fpCopy)).map(d => [d.id, d.fp, d.fpCopy]);
// reader sanity: do captured values VARY?
const titles = rec.dms.map(d => JSON.stringify(d.cap.c || []).match(/"↳ title":"([^"]*)"/)).map(m => m && m[1]);
const res = {root: root.id, dms: rec.dms.length, withBody: rec.dms.filter(d => d.kids).length, copies: rec.dms.reduce((a, d) => a + d.kids, 0), fpBad, kinds, ann: rec.ann.length, annInCopies: rec.dms.reduce((a, d) => a + d.fp[3], 0), bytes: json.length, chunks: data.children.length, distinctTitles: [...new Set(titles)].length, titles: titles.slice(0, 33), toasts: rec.extra.filter(e => e.kind === 'Toast' && !e.box).map(e => e.texts.map(x=>x[1]).join('|')), inputs: rec.extra.filter(e => e.kind === 'Input').map(e => e.texts.map(x=>x[1]).join('|')), selectLists: rec.extra.filter(e => e.kind === 'SelectList').map(e => e.texts.map(x=>x[1]).slice(0,3).join('|')), hdr: rec.dms.map(d => d.hdrTexts.map(x => x[1]).join('|')), pads: rec.dms.map(d => [d.pad, d.gap])};
if (DRY) throw new Error('DRY ' + JSON.stringify(res));
return res;
