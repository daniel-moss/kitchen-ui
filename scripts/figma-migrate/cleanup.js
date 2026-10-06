// DS migration — STEP 4: remove the snapshot frames.
//
// Run with use_figma after restore.js has run and its report has been checked.
// Replace __PAGE_IDS__ with an array of page ids. Ten pages per call is fine —
// the work per page is one node removal, so only the page switch costs.
//
// Do this page by page as each page's restore is checked, rather than leaving
// the whole snapshot in the file: on the first attempt the frames held 6.6 MB
// of text and pushed the file to 95% memory.
//
// The frames are the only thing these scripts leave behind. Everything else the
// restore needs is in the file's version history.

const PAGE_IDS = __PAGE_IDS__;
const FRAME_NAME = '⚙ DS snapshot (dsmig1)';

const results = [];
for (const pageId of PAGE_IDS) {
  const page = await figma.getNodeByIdAsync(pageId);
  if (!page || page.type !== 'PAGE') { results.push({ pageId, error: 'not a page' }); continue; }
  await figma.setCurrentPageAsync(page);

  const removed = [];
  let bytes = 0;
  for (const c of page.children.slice()) {
    if (c.name === FRAME_NAME) {
      if ('children' in c) for (const t of c.children) if (t.type === 'TEXT') bytes += t.characters.length;
      removed.push(c.id);
      c.locked = false;
      c.remove();
    }
  }
  results.push({ page: page.name.replace(/\s+/g, ' ').trim(), removed, count: removed.length, charsFreed: bytes });
}
return { pages: results, totalFrames: results.reduce((n, r) => n + (r.count || 0), 0), totalCharsFreed: results.reduce((n, r) => n + (r.charsFreed || 0), 0) };
