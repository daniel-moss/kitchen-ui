// DS migration — REBUILD for the "Job Details" file (N0cgcrhj7KhBovYXySJpqZ)
// Written 2026-10-04, AFTER the library update was accepted.
// Replace __PAGE_ID__ and set DRY_RUN. One page per call.
//
// Reads the `jd1` snapshot frame back off the page and rebuilds what the update
// deleted. This is not restore.js: the old row nodes no longer exist (verified —
// 0 of 8 recorded row ids resolved on Check In / Out after the update), so rows
// are CREATED inside the new ItemGroup's `bodyList` slot and their values
// written as nested-instance property overrides.
//
// Live structure this targets (read off the file after the update, not assumed):
//   ItemGroup  header|divider|view|isAccordion|open|isTruncated|isExpanded
//     Header / GroupLabel          variant|slotRight
//       Content                    counter|caption          (#️⃣ GroupLabelContentPrimary)
//         Label                    ↳ label#25327:0|slotLeft (#️⃣ GroupLabelContentPrimaryLabel)
//     bodyList (SLOT)              <- rows go here, as bare ListItem instances
//       ListItem                   isClickable|isDraggable|isAccordion|size|state|…
//         Body                     slotLeft|slotRight       (#️⃣ ListItemBody)
//           Slot Left / AvatarPicker   variant|size
//             Avatar<Type> / Avatar    content|shape|↳ characters|↳ character|↳ count
//               Icon                   iconName#2002:0
//           ItemText                   textRight
//             Text Left / Text Right   variant|align        (#️⃣ ItemTextBlock)
//               Title / Caption        ↳ label#30726:1|textStyle|color  (#️⃣ ItemTextLine)
//           Slot Right                 slots                (#️⃣ ListItemBodySlotRight)
//             Slot 1                   instance             (#️⃣ ListItemBodySlotRightInstance)
//
// Write order is fixed: variant properties that rebuild a subtree go FIRST
// (Body.slotLeft/slotRight, ItemText.textRight, AvatarPicker.variant), then the
// values under them, then annotations. A variant switch recreates children, so
// resolve children AFTER the switch, never before.

const DRY_RUN = true;
const PAGE_ID = '__PAGE_ID__';
const LISTITEM_KEY = 'cf991cac0139ddf5075933229014e5d92458d906';
const FRAME_NAME = '⚙ DS snapshot (jd1)';

const plan = [];      // human-readable write log
const problems = [];  // anything that could not be resolved
let writes = 0;

function note(what) { plan.push(what); }
function fail(what) { problems.push(what); }

function childByName(node, name) {
  if (!node || !('children' in node)) return null;
  for (const c of node.children) if (c.name === name) return c;
  return null;
}
function findByName(node, name) {
  if (!node || !('findAll' in node)) return null;
  const hits = node.findAll((x) => x.name === name);
  return hits.length ? hits[0] : null;
}
async function setProps(node, props, label) {
  const clean = {};
  for (const k of Object.keys(props)) if (props[k] !== null && props[k] !== undefined) clean[k] = props[k];
  if (!Object.keys(clean).length) return true;
  const shown = Object.keys(clean).map((k) => k + '=' + (typeof clean[k] === 'object' ? '<var>' : clean[k])).join(', ');
  note(label + ' :: ' + shown);
  if (DRY_RUN) return true;
  try { node.setProperties(clean); writes++; return true; }
  catch (e) { fail(label + ' :: setProperties failed — ' + (e && e.message ? e.message : String(e))); return false; }
}

// the `context-menu` icon variable travels by KEY, because the update changed ids
const varCache = new Map();
async function importVar(key) {
  if (!key) return null;
  if (varCache.has(key)) return varCache.get(key);
  let v = null;
  try { v = await figma.variables.importVariableByKeyAsync(key); }
  catch (e) { fail('variable import failed for ' + key.slice(0, 10) + ' — ' + (e && e.message ? e.message : String(e))); }
  varCache.set(key, v);
  return v;
}
// An Icon instance: bind iconName to the recorded VARIABLE when there was one
// (the binding travels by key, because the update changed variable ids), else
// write the literal name.
//
// The intent is logged BEFORE the node is resolved, so a dry run shows the icon
// writes too — the first version returned early when `scope` was null in dry
// mode and silently hid every icon from the report, including the
// `context-menu` bindings, which are the ones most worth reviewing.
async function writeIcon(scope, rec, label) {
  if (!rec) return;
  const props = {};
  if (rec.iconVar && rec.iconVar.key) {
    note(label + ' / Icon :: iconName -> variable "' + rec.iconVar.name + '" (value "' + rec.iconName + '")');
    const v = await importVar(rec.iconVar.key);
    if (v) props['iconName#2002:0'] = figma.variables.createVariableAlias(v);
    else if (rec.iconName) props['iconName#2002:0'] = rec.iconName;
  } else if (rec.iconName) {
    note(label + ' / Icon :: iconName = "' + rec.iconName + '" (literal)');
    props['iconName#2002:0'] = rec.iconName;
  }
  if (rec.style) props.style = rec.style;
  if (rec.size) props.size = rec.size;
  if (rec.pack) props.pack = rec.pack;
  if (DRY_RUN) return;
  const icon = findByName(scope, 'Icon');
  if (!icon || icon.type !== 'INSTANCE') { fail(label + ' :: no Icon instance found'); return; }
  try { icon.setProperties(props); writes++; }
  catch (e) { fail(label + ' / Icon :: setProperties failed — ' + (e && e.message ? e.message : String(e))); }
}

// ------------------------------------------------------------------ one row
async function buildRow(slot, rec, listItemSet, rowLabel) {
  let li = null;
  if (DRY_RUN) {
    note(rowLabel + ' :: CREATE ListItem in bodyList');
  } else {
    try {
      li = listItemSet.defaultVariant.createInstance();
      slot.appendChild(li);
      writes++;
    } catch (e) { fail(rowLabel + ' :: could not create/append ListItem — ' + (e && e.message ? e.message : String(e))); return; }
  }

  // 1) the row's own variants
  await setProps(li, {
    isClickable: rec.listItem.isClickable,
    isDraggable: rec.listItem.isDraggable,
    isAccordion: rec.listItem.isAccordion,
    open: 'false', state: 'default', size: 'default', slotBottom: 'false', isLoading: 'false',
  }, rowLabel);

  // 2) Body — slot flags first, they rebuild everything under them
  const body = DRY_RUN ? null : childByName(li, 'Body');
  if (!DRY_RUN && !body) { fail(rowLabel + ' :: no Body child'); return; }
  const wantRight = rec.right ? 'true' : 'false';
  await setProps(body, { slotLeft: rec.avatar ? 'true' : 'false', slotRight: wantRight }, rowLabel + ' / Body');

  // 3) the avatar
  if (rec.avatar) {
    const slotLeft = DRY_RUN ? null : findByName(body, 'Slot Left');
    const picker = DRY_RUN ? null : findByName(slotLeft, 'AvatarPicker');
    if (!DRY_RUN && !picker) fail(rowLabel + ' :: no AvatarPicker');
    await setProps(picker, { variant: rec.avatar.newVariant, size: rec.avatar.size || 'xl' }, rowLabel + ' / AvatarPicker');
    // the Avatar<Type> wrapper is swapped by the variant, so look it up now
    const base = DRY_RUN ? null : (picker ? picker.findAll((x) => x.type === 'INSTANCE' && x.name === 'Avatar')[0] : null);
    if (!DRY_RUN && !base) {
      fail(rowLabel + ' :: no base Avatar under AvatarPicker variant=' + rec.avatar.newVariant);
    } else {
      const ap = { size: rec.avatar.size || 'xl' };
      if (rec.avatar.content) ap.content = rec.avatar.content;
      if (rec.avatar.shape) ap.shape = rec.avatar.shape;
      if (rec.avatar.content === 'letters') {
        if (rec.avatar.letters) ap['↳ characters#23418:89'] = rec.avatar.letters;
        if (rec.avatar.character) ap['↳ character#23418:0'] = rec.avatar.character;
      }
      if (rec.avatar.content === 'counter' && rec.avatar.count) ap['↳ count#2529:2'] = rec.avatar.count;
      await setProps(base, ap, rowLabel + ' / Avatar');
      if (rec.avatar.content === 'icon' && rec.avatar.icon) await writeIcon(base, rec.avatar.icon, rowLabel + ' / Avatar');
      // an image avatar carries its picture as a paint on a rectangle
      if (rec.avatar.imageFills || rec.avatar.imageFillStyleId) {
        const layerName = rec.avatar.imageFromLayer || 'Avatar';
        note(rowLabel + ' / Avatar :: re-apply image paint onto "' + layerName + '"');
        if (!DRY_RUN) {
          const rect = base.findAll((x) => x.type === 'RECTANGLE' && x.name === layerName)[0]
            || base.findAll((x) => x.type === 'RECTANGLE')[0];
          if (!rect) fail(rowLabel + ' :: no rectangle to carry the avatar image');
          else {
            try {
              if (rec.avatar.imageFillStyleId) await rect.setFillStyleIdAsync(rec.avatar.imageFillStyleId);
              else rect.fills = rec.avatar.imageFills;
              writes++;
            } catch (e) { fail(rowLabel + ' :: image paint failed — ' + (e && e.message ? e.message : String(e))); }
          }
        }
      }
    }
  }

  // 4) the text — textRight first, it adds/removes the right block
  const itemText = DRY_RUN ? null : findByName(body, 'ItemText');
  if (!DRY_RUN && !itemText) fail(rowLabel + ' :: no ItemText');
  const hasRight = !!(rec.titleRight && rec.titleRight.text != null);
  await setProps(itemText, { textRight: hasRight ? 'true' : 'false' }, rowLabel + ' / ItemText');

  async function writeBlock(blockName, align, titleRec, captionRec) {
    const block = DRY_RUN ? null : findByName(itemText, blockName);
    if (!DRY_RUN && !block) { fail(rowLabel + ' :: no ' + blockName); return; }
    const variant = (captionRec && captionRec.text != null) ? 'titleCaption' : 'title';
    await setProps(block, { variant: variant, align: align }, rowLabel + ' / ' + blockName);
    if (titleRec && titleRec.text != null) {
      const t = DRY_RUN ? null : childByName(block, 'Title');
      if (!DRY_RUN && !t) fail(rowLabel + ' :: no ' + blockName + ' / Title');
      await setProps(t, { '↳ label#30726:1': titleRec.text, textStyle: 'bodyMedium', color: titleRec.color || 'strong' }, rowLabel + ' / ' + blockName + ' / Title');
    }
    if (captionRec && captionRec.text != null) {
      const c = DRY_RUN ? null : childByName(block, 'Caption');
      if (!DRY_RUN && !c) fail(rowLabel + ' :: no ' + blockName + ' / Caption');
      await setProps(c, { '↳ label#30726:1': captionRec.text, textStyle: 'caption', color: captionRec.color || 'subtle' }, rowLabel + ' / ' + blockName + ' / Caption');
    }
  }
  await writeBlock('Text Left', 'left', rec.titleLeft, rec.captionLeft);
  if (hasRight) await writeBlock('Text Right', 'right', rec.titleRight, rec.captionRight);

  // 5) the right slot
  if (rec.right) {
    const sr = DRY_RUN ? null : findByName(body, 'Slot Right');
    if (!DRY_RUN && !sr) fail(rowLabel + ' :: no Slot Right');
    await setProps(sr, { slots: '1' }, rowLabel + ' / Slot Right');
    const s1 = DRY_RUN ? null : findByName(sr, 'Slot 1');
    await setProps(s1, { instance: rec.right.newInstance }, rowLabel + ' / Slot 1');
    // `open` draws its own chevron; only the button variants carry an icon
    if (rec.right.newInstance !== 'open' && rec.right.icon) {
      await writeIcon(DRY_RUN ? null : s1, rec.right.icon, rowLabel + ' / Slot 1');
    }
  }

  // 6) annotations recorded on the row itself
  if (rec.annotations && rec.annotations.length) {
    note(rowLabel + ' :: re-apply ' + rec.annotations.length + ' annotation(s)');
    if (!DRY_RUN && li) {
      try { li.annotations = rec.annotations.map(stripLabel); writes++; }
      catch (e) { fail(rowLabel + ' :: annotation write failed — ' + (e && e.message ? e.message : String(e))); }
    }
  }
}

// Reading an annotation gives both `label` and `labelMarkdown`; writing both is
// rejected ("Only one of label or labelMarkdown should be given").
function stripLabel(a) {
  const out = {};
  for (const k of Object.keys(a)) {
    if (k === 'label' && a.labelMarkdown) continue;
    out[k] = a[k];
  }
  return out;
}

// ---------------------------------------------------------------- one group
async function buildGroup(rec, listItemSet, snap) {
  const node = await figma.getNodeByIdAsync(rec.id);
  const label = 'group "' + (rec.groupLabel && rec.groupLabel.label ? rec.groupLabel.label : rec.name) + '"';
  if (!node) { fail(label + ' :: id no longer resolves — ' + rec.id); return; }

  // 1) the group's own variants
  await setProps(node, {
    header: rec.header,
    divider: rec.divider,
    view: 'list',
    isAccordion: 'false', open: 'false', isTruncated: 'false', isExpanded: 'false',
  }, label);

  // 2) the header
  if (rec.header === 'true' && rec.groupLabel) {
    const gl = findByName(node, 'GroupLabel');
    if (!gl) fail(label + ' :: no GroupLabel');
    else {
      const gv = rec.groupLabel.variants || {};
      await setProps(gl, {
        variant: gv.variant || 'primary',
        slotRight: rec.groupLabel.slotRight ? 'true' : 'false',
      }, label + ' / GroupLabel');
      const content = findByName(gl, 'Content');
      if (!content) fail(label + ' :: no GroupLabel / Content');
      else {
        await setProps(content, {
          counter: rec.groupLabel.counter != null ? 'true' : 'false',
          caption: rec.groupLabel.caption != null ? 'true' : 'false',
        }, label + ' / Content');
        const lab = findByName(content, 'Label');
        if (!lab) fail(label + ' :: no Content / Label');
        else {
          await setProps(lab, {
            '↳ label#25327:0': rec.groupLabel.label,
            slotLeft: rec.groupLabel.labelIcon ? 'true' : 'false',
          }, label + ' / Label');
          if (rec.groupLabel.labelIcon) await writeIcon(lab, rec.groupLabel.labelIcon, label + ' / Label');
        }
        if (rec.groupLabel.counter != null) {
          const cn = findByName(content, 'Counter');
          if (cn) {
            const p = cn.type === 'INSTANCE' ? (cn.componentProperties || {}) : {};
            const key = Object.keys(p).filter((k) => p[k].type === 'TEXT')[0];
            if (key) await setProps(cn, { [key]: rec.groupLabel.counter }, label + ' / Counter');
            else note(label + ' / Counter :: value "' + rec.groupLabel.counter + '" (no TEXT property found)');
          }
        }
        if (rec.groupLabel.caption != null) {
          const cp = findByName(content, 'Caption');
          if (cp) {
            const p = cp.type === 'INSTANCE' ? (cp.componentProperties || {}) : {};
            const key = Object.keys(p).filter((k) => p[k].type === 'TEXT')[0];
            if (key) await setProps(cp, { [key]: rec.groupLabel.caption }, label + ' / Caption');
            else note(label + ' / Caption :: value "' + rec.groupLabel.caption + '" (no TEXT property found)');
          }
        }
      }
      // the header's right-hand button (e.g. "Add Time Session")
      if (rec.groupLabel.slotRight) {
        const sr = findByName(gl, 'Slot Right');
        if (!sr) fail(label + ' :: slotRight=true but no Slot Right node');
        else {
          const inner = sr.findAll((x) => x.type === 'INSTANCE')[0];
          const v = rec.groupLabel.slotRight.variants || {};
          if (inner && Object.keys(v).length) await setProps(inner, v, label + ' / Slot Right inner');
          if (rec.groupLabel.slotRight.icon) await writeIcon(sr, rec.groupLabel.slotRight.icon, label + ' / Slot Right');
          // An annotation that sat on the old header button belongs here now.
          //
          // Matching on the top-level instance ALONE is not enough: a Popover
          // can hold several ItemGroups under the same top instance, and the
          // loose test applied one annotation to two groups (caught on Check In
          // / Out, 11 recorded -> 12 present). The recorded `pathIdx` carries
          // the ItemGroup's own index among its siblings — require that too.
          const myIndex = (node.parent && 'children' in node.parent) ? node.parent.children.indexOf(node) : -1;
          const moved = (snap.annotatedNodes || []).filter((a) => {
            if (a.verdict !== 'LOST') return false;
            if (a.path.indexOf('GroupLabel') < 0) return false;
            if (!/SlotRight|Slot Right/i.test(a.path.join(' / '))) return false;
            if (!a.topInstanceId || rec.id.indexOf(a.topInstanceId) < 0) return false;
            const igPos = a.path.indexOf('ItemGroup');
            if (igPos < 0) return true;                 // nothing to disambiguate with
            return a.pathIdx[igPos] === myIndex;        // same slot among the siblings
          });
          for (const a of moved) {
            note(label + ' / Slot Right :: re-apply annotation "' + String(a.annotations[0] && (a.annotations[0].label || '')).slice(0, 50) + '"');
            if (!DRY_RUN && inner) {
              try { inner.annotations = a.annotations.map(stripLabel); writes++; }
              catch (e) { fail(label + ' :: header annotation failed — ' + (e && e.message ? e.message : String(e))); }
            }
          }
        }
      }
    }
  }

  // 3) the rows — clear the component's default slot content, then rebuild
  const slot = node.findAll((x) => x.type === 'SLOT' && x.name === 'bodyList')[0];
  if (!slot) { fail(label + ' :: no bodyList slot'); return; }
  const existing = slot.children.map((c) => c.name);
  note(label + ' :: bodyList currently holds [' + existing.join(', ') + '] — removing ' + existing.length);
  if (!DRY_RUN) {
    for (const c of slot.children.slice()) { try { c.remove(); writes++; } catch (e) { fail(label + ' :: could not remove ' + c.name + ' — ' + e.message); } }
  }
  const rows = (rec.rowIds || []).map((id) => (snap.rows || []).filter((r) => r.id === id)[0]).filter(Boolean);
  if (rows.length !== (rec.rowIds || []).length) fail(label + ' :: ' + ((rec.rowIds || []).length - rows.length) + ' recorded row id(s) missing from the snapshot');
  for (let i = 0; i < rows.length; i++) {
    await buildRow(slot, rows[i], listItemSet, label + ' row ' + (i + 1) + ' "' + (rows[i].titleLeft ? rows[i].titleLeft.text : '?') + '"');
  }
}

// -------------------------------------------------------------------- main
const page = await figma.getNodeByIdAsync(PAGE_ID);
await figma.setCurrentPageAsync(page);
const holder = page.children.filter((c) => c.name === FRAME_NAME)[0];
if (!holder) return { error: 'no snapshot frame on this page' };
const parts = holder.children.filter((c) => /^jd1_\d+$/.test(c.name))
  .sort((a, b) => Number(a.name.split('_')[1]) - Number(b.name.split('_')[1]));
const snap = JSON.parse(parts.map((p) => p.characters).join(''));

const listItemSet = await figma.importComponentSetByKeyAsync(LISTITEM_KEY);

for (const g of snap.groups) await buildGroup(g, listItemSet, snap);

// standalone rows (not inside a recorded ItemGroup) are reported, not guessed
const standalone = (snap.rows || []).filter((r) => !r.groupId);
for (const r of standalone) {
  fail('standalone row "' + (r.titleLeft ? r.titleLeft.text : '?') + '" at ' + (r.standaloneAt ? r.standaloneAt.path.join(' / ') : '?') + ' — needs its own target, not handled on this page');
}

return {
  DRY_RUN: DRY_RUN,
  page: page.name.replace(/\s+/g, ' ').trim(),
  groups: snap.groups.length,
  rowsPlanned: snap.groups.reduce((a, g) => a + (g.rowIds || []).length, 0),
  standaloneRows: standalone.length,
  writesApplied: writes,
  problems: problems,
  plan: plan,
};
