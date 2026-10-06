// DS migration — STEP 0: measure the published (NEW) structure of every
// component the design file uses.  (added 2026-10-03 for the redo)
//
// Read-only. Run with use_figma against the DESIGN file, in batches of about a
// dozen keys — `importComponentSetByKeyAsync` resolves the PUBLISHED version,
// which is the version the file is about to receive, while the file's own
// instances still show the old one. That difference is the whole measurement.
//
// Replace __KEYS__ with an array of component keys.
//
// Two gotchas baked in:
//   - A component SET fails `importComponentByKeyAsync`. Try the set call FIRST
//     or you wrongly conclude the component was deleted (this produced a false
//     "266 overrides lost" on the first pass).
//   - Never read `componentPropertyDefinitions` off a variant; read it from the
//     SET. Key import gives shallow structure, which is all the override paths
//     need — they stop at the first nested instance anyway.
//
// For each key it returns:
//   paths     — the union of child name paths across variants, stopping at
//               nested-instance boundaries. An override path missing from this
//               list will not resolve after the update.
//   propDefs  — the property definition RAW keys ("↳ label#31300:0"). The raw
//               key carries the definition id, so a property that was deleted
//               and re-added under the same name shows up as a different raw
//               key — which is exactly the case where every instance's value
//               falls back to the default.
//   null      — the key resolves to nothing: the component is gone from the
//               library and every override it owns is unrecoverable.

const KEYS = __KEYS__;

function paths(root) {
  const res = new Set();
  function walk(node, trail) {
    if (!('children' in node)) return;
    for (const c of node.children) {
      const t = trail.concat([c.name]);
      res.add(t.join(' / '));
      if (c.type !== 'INSTANCE') walk(c, t); // stop at nested instances
    }
  }
  walk(root, []);
  return Array.from(res).sort();
}

function defsOf(owner) {
  try {
    const defs = owner.componentPropertyDefinitions;
    const out = {};
    for (const k of Object.keys(defs)) {
      out[k] = defs[k].type + (defs[k].variantOptions ? '[' + defs[k].variantOptions.join('|') + ']' : '');
    }
    return out;
  } catch (e) {
    return { _error: String(e && e.message ? e.message : e).slice(0, 60) };
  }
}

const out = {};
for (const key of KEYS) {
  let node = null;
  let kind = null;
  try {
    node = await figma.importComponentSetByKeyAsync(key);
    kind = 'COMPONENT_SET';
  } catch (e1) {
    try {
      node = await figma.importComponentByKeyAsync(key);
      kind = 'COMPONENT';
    } catch (e2) {
      out[key] = null; // gone from the library
      continue;
    }
  }
  const union = new Set();
  if (kind === 'COMPONENT_SET') {
    for (const v of node.children) for (const p of paths(v)) union.add(p);
  } else {
    for (const p of paths(node)) union.add(p);
  }
  out[key] = {
    name: node.name,
    kind,
    variants: kind === 'COMPONENT_SET' ? node.children.length : 1,
    paths: Array.from(union).sort(),
    propDefs: defsOf(node),
  };
}
return out;
