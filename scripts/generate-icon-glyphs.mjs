// Regenerates src/styles/icons-glyphs.css from a Font Awesome kit web
// download (the folder holding metadata/icons.json). Codepoint rendering is
// the DS rule — name-ligatures silently fail in Safari — so every icon NAME
// (and every alias) gets a `.g-<name>{--glyph:"\XXXX"}` class.
//
//   node scripts/generate-icon-glyphs.mjs ~/Downloads/kit-ca85bd147f-web
//
// The kit's custom icons (style "custom" in icons.json) come through like
// any other name. Aliases never overwrite a real icon's name.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const kitDir = process.argv[2];
if (!kitDir) {
  console.error("Usage: node scripts/generate-icon-glyphs.mjs <kit folder>");
  process.exit(1);
}

const icons = JSON.parse(readFileSync(join(kitDir, "metadata", "icons.json"), "utf8"));

const glyphs = new Map(); // name -> unicode
// Canonical names first, so an alias can never shadow a real icon.
for (const [name, meta] of Object.entries(icons)) {
  if (meta.unicode) glyphs.set(name, meta.unicode);
}
for (const [, meta] of Object.entries(icons)) {
  if (!meta.unicode) continue;
  for (const alias of meta.aliases?.names ?? []) {
    if (!glyphs.has(alias)) glyphs.set(alias, meta.unicode);
  }
}

const header = `/* Kitchen UI - icon glyph codepoints (auto-generated from Font Awesome 7).
 * SAFARI-SAFE icon rendering. Name-ligatures (writing the icon name as text content)
 * resolve inconsistently in Safari/CoreText - some glyphs silently fail. Render glyphs
 * by codepoint instead: put a .g-<name> class on an .icon element (its ::before emits
 * var(--glyph)). Classic regular+solid share these codepoints (pick weight with
 * .icon--solid); brand icons also need .icon--brand.
 * Usage:  <i class="icon icon--14 g-arrow-left"></i>
 * For single-file prototypes, grep this file for the .g-<name> lines you use and
 * inline just those.
 * Regenerate: node scripts/generate-icon-glyphs.mjs <kit folder> */
`;

const lines = [...glyphs.entries()]
  .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  .map(([name, unicode]) => `.g-${name}{--glyph:"\\${unicode}"}`);

writeFileSync("src/styles/icons-glyphs.css", `${header}\n${lines.join("\n")}\n`);
console.log(`Wrote ${lines.length} glyph classes.`);
