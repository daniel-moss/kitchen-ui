// DS Icon Fixer — a private development plugin, run inside Daniel's own Figma
// app (where the Font Awesome 7 Pro font is installed).
//
// Why it exists: scripts run through the Figma MCP execute in Figma's cloud,
// which cannot see fonts installed on the Mac. So they cannot set the DS
// Icon's `name` property (a TEXT property on a Font Awesome text layer) and
// write the glyph name — or bind its token — onto the TEXT LAYER instead.
// That looks right but leaves the property on its default ("diamonds-4"), and
// the layer edit wins, so changing the property does nothing.
//
// This plugin moves each such layer edit onto the `name` property: a token
// binding becomes a binding of the property, a plain name becomes the
// property's value. Then the layer edit is cleared, so the property is in
// control again. Any other edit on the icon (component properties, the glyph
// layer's colour) is kept; anything it does not know how to keep makes it SKIP
// that icon and list it.
//
// Scope: the selection if there is one, otherwise the current page.

figma.showUI(__html__, { width: 420, height: 520 });

// The Icon's main name property is `iconName#<id>` — NOT `iconName#` /
// `iconName##` (the duotone ones), which carry an extra `#` before the id.
function nameKey(icon) {
  return Object.keys(icon.componentProperties).find(function (k) { return /^iconName#\d/.test(k); });
}

// Fields a fix knows how to carry across the reset. Anything else = skip.
var TEXT_OK = ['characters', 'boundVariables', 'styledTextSegments', 'fills'];
var SELF_OK = ['componentProperties'];

async function isDsIcon(node) {
  if (node.type !== 'INSTANCE') return false;
  var main = await node.getMainComponentAsync();
  if (!main) return false;
  var set = main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent : main;
  return set.name === 'Icon' && !!nameKey(node);
}

function glyphLayer(icon) {
  return icon.findOne(function (n) { return n.type === 'TEXT'; });
}

async function collect() {
  var roots = figma.currentPage.selection.length ? figma.currentPage.selection : [figma.currentPage];
  var seen = {}, icons = [];
  for (var r = 0; r < roots.length; r++) {
    var root = roots[r];
    var list = root.type === 'INSTANCE' ? [root] : [];
    if ('findAllWithCriteria' in root) list = list.concat(root.findAllWithCriteria({ types: ['INSTANCE'] }));
    for (var i = 0; i < list.length; i++) {
      var n = list[i];
      if (seen[n.id]) continue;
      seen[n.id] = true;
      if (await isDsIcon(n)) icons.push(n);
    }
  }
  return icons;
}

// What one icon needs. Returns null when it is already healthy.
async function plan(icon) {
  var key = nameKey(icon);
  var text = glyphLayer(icon);
  if (!text) return null;
  var overrides = icon.overrides || [];
  var textOv = overrides.find(function (o) { return o.id === text.id; });
  if (!textOv || textOv.overriddenFields.indexOf('characters') === -1 && textOv.overriddenFields.indexOf('boundVariables') === -1) return null;
  var p = { icon: icon, key: key, text: text, label: '' };
  var bound = text.boundVariables && text.boundVariables.characters;
  var v = bound ? await figma.variables.getVariableByIdAsync(bound.id) : null;
  if (v && v.remote) {
    // A DS token (from the library) — bind the property to it.
    p.alias = bound.id;
    p.label = text.characters + ' → token ' + v.name;
  } else if (bound) {
    // A LOCAL helper variable (a migration workaround), not a DS token: the
    // property gets the plain name, so the helper can be deleted afterwards.
    p.literal = text.characters;
    p.label = text.characters + ' → name (was a local helper variable)';
  } else {
    p.literal = text.characters;
    p.label = text.characters + ' → name';
  }
  // Safety: only edits we can carry across.
  var bad = [];
  for (var i = 0; i < overrides.length; i++) {
    var o = overrides[i];
    var ok = o.id === text.id ? TEXT_OK : o.id === icon.id ? SELF_OK : [];
    var extra = o.overriddenFields.filter(function (f) { return ok.indexOf(f) === -1; });
    if (extra.length) bad.push((o.id === icon.id ? 'icon' : o.id === text.id ? 'glyph' : 'layer') + ': ' + extra.join(', '));
  }
  if (bad.length) p.skip = bad.join('; ');
  p.keepFills = textOv.overriddenFields.indexOf('fills') !== -1 ? clonePaints(text.fills) : null;
  return p;
}

function clonePaints(paints) { return JSON.parse(JSON.stringify(paints)); }

function where(node) {
  var parts = [], n = node.parent;
  while (n && n.type !== 'PAGE' && parts.length < 3) { parts.unshift(n.name); n = n.parent; }
  return parts.join(' / ');
}

async function apply(p) {
  var icon = p.icon, key = p.key;
  // Keep the icon's own component-property values (and their bindings) and
  // its variant, so the reset loses nothing but the glyph-layer edit.
  var props = {};
  var cp = icon.componentProperties;
  Object.keys(cp).forEach(function (k) {
    if (k === key || cp[k].type === 'VARIANT') return;
    props[k] = cp[k].boundVariables && cp[k].boundVariables.value ? { type: 'VARIABLE_ALIAS', id: cp[k].boundVariables.value.id } : cp[k].value;
  });
  var variants = Object.assign({}, icon.variantProperties || {});
  var fonts = p.text.getRangeAllFontNames(0, Math.max(1, p.text.characters.length));
  for (var i = 0; i < fonts.length; i++) await figma.loadFontAsync(fonts[i]);

  icon.resetOverrides();

  var now = icon.variantProperties || {};
  var drift = {};
  Object.keys(variants).forEach(function (k) { if (now[k] !== variants[k]) drift[k] = variants[k]; });
  if (Object.keys(drift).length) icon.setProperties(drift);
  props[key] = p.alias ? { type: 'VARIABLE_ALIAS', id: p.alias } : p.literal;
  icon.setProperties(props);
  if (p.keepFills) glyphLayer(icon).fills = p.keepFills;

  // Read back.
  var t = glyphLayer(icon);
  var after = icon.componentProperties[key];
  var good = p.alias ? !!(after.boundVariables && after.boundVariables.value && after.boundVariables.value.id === p.alias) : after.value === p.literal;
  var stillEdited = (icon.overrides || []).some(function (o) { return o.id === t.id && o.overriddenFields.indexOf('characters') !== -1; });
  if (!good) throw new Error('the name property did not take the value');
  if (stillEdited) throw new Error('the glyph layer is still edited');
}

async function run(fix) {
  var icons = await collect();
  var plans = [];
  for (var i = 0; i < icons.length; i++) { var p = await plan(icons[i]); if (p) plans.push(p); }
  var fixed = 0, skipped = [], failed = [], todo = [];
  for (var j = 0; j < plans.length; j++) {
    var q = plans[j];
    var line = q.label + '   (' + where(q.icon) + ')';
    if (q.skip) { skipped.push(line + ' — has other edits: ' + q.skip); continue; }
    if (!fix) { todo.push(line); continue; }
    try { await apply(q); fixed++; } catch (e) { failed.push(line + ' — ' + (e && e.message ? e.message : e)); }
  }
  figma.ui.postMessage({ type: 'report', fix: fix, scope: figma.currentPage.selection.length ? 'selection' : 'page "' + figma.currentPage.name + '"', icons: icons.length, healthy: icons.length - plans.length, todo: todo, fixed: fixed, skipped: skipped, failed: failed });
}

figma.ui.onmessage = function (msg) {
  if (msg.type === 'check') run(false).catch(function (e) { figma.ui.postMessage({ type: 'error', message: String(e) }); });
  if (msg.type === 'fix') run(true).catch(function (e) { figma.ui.postMessage({ type: 'error', message: String(e) }); });
  if (msg.type === 'close') figma.closePlugin();
};
