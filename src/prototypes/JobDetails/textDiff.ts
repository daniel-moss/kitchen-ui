// Word-level text diff for the Activity tab's long-text update logs (Figma
// 24489-50029). Instead of stacking the old paragraph above the new one, the
// log shows ONE merged paragraph: removed words struck through, added words on
// an amber highlight, everything else plain.
//
// PROTOTYPE-LOCAL like the rest of the update-log work — no DS component and no
// dependency; this is the classic LCS diff plus one cleanup pass.

export type DiffKind = "equal" | "removed" | "added";

export interface DiffRun {
  kind: DiffKind;
  text: string;
}

/**
 * Above this many LCS cells the diff stops looking for the smallest edit and
 * just says "all this went, all that came" — which is the honest reading of a
 * full rewrite anyway. Only the CHANGED middle is measured (the shared head
 * and tail are trimmed first), so a normal edit never comes close: this is a
 * ceiling on memory, ~4MB, not a limit on the text length.
 */
const MAX_CELLS = 1_000_000;

/**
 * An unchanged run of at most this many symbols, sitting between two edits, is
 * swallowed by them. At symbol level such a leftover is an accident of the
 * alphabet, not something the writer changed around.
 */
const NOISE_FLOOR = 4;

/**
 * Split into single characters (Daniel, 2026-08-04 — per-symbol highlights).
 * `Array.from` splits by CODE POINT, so a symbol like "°" or an emoji stays
 * one unit instead of breaking into surrogate halves.
 */
function tokenize(text: string): string[] {
  return Array.from(text);
}

/** Longest common subsequence of two token lists, as a table of lengths. */
function lcsTable(a: string[], b: string[]): Uint32Array {
  const w = b.length + 1;
  const table = new Uint32Array((a.length + 1) * w);
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i * w + j] =
        a[i] === b[j] ? table[(i + 1) * w + j + 1] + 1 : Math.max(table[(i + 1) * w + j], table[i * w + j + 1]);
    }
  }
  return table;
}

/** Append `text` to the run list, merging it into the last run of the same kind. */
function push(runs: DiffRun[], kind: DiffKind, text: string) {
  if (text === "") return;
  const last = runs[runs.length - 1];
  if (last != null && last.kind === kind) last.text += text;
  else runs.push({ kind, text });
}

/**
 * Push a changed run with its outer whitespace left OUTSIDE the mark. Tokens
 * carry their trailing space, so without this the strikethrough and the amber
 * highlight would each run one space too far and the two marks would touch.
 */
function pushMarked(runs: DiffRun[], kind: "removed" | "added", text: string) {
  if (text === "") return;
  const [, lead, core, trail] = /^(\s*)([\s\S]*?)(\s*)$/.exec(text) ?? [];
  push(runs, "equal", lead ?? "");
  push(runs, kind, core ?? "");
  push(runs, "equal", trail ?? "");
}

/** An unchanged stretch, or one edit (what went out, what came in). */
type Segment = { equal: string } | { removed: string; added: string };

const isEqual = (s: Segment): s is { equal: string } => "equal" in s;

/**
 * How good a place this is to start or end a mark. A symbol diff can put the
 * boundary anywhere, so of all the EQUIVALENT placements we pick the one a
 * reader would have chosen: at a space, at a line break, after punctuation —
 * not in the middle of a word. (The scale is diff-match-patch's, simplified.)
 */
function boundaryScore(left: string, right: string): number {
  if (left === "" || right === "") return 5; // the very start / end of the text
  if (/\n/.test(left) || /\n/.test(right)) return 4;
  if (/\s/.test(left) !== /\s/.test(right)) return 3; // one side is a space
  if (/[.,;:!?]/.test(left) || /[.,;:!?]/.test(right)) return 2;
  return 0;
}

/** Both boundaries of an edit sitting between `before` and `after`. */
function placementScore(before: string, removed: string, added: string, after: string): number {
  const body = added !== "" ? added : removed;
  if (body === "") return 0;
  return (
    boundaryScore(before.slice(-1), body.slice(0, 1)) + boundaryScore(body.slice(-1), after.slice(0, 1))
  );
}

/** How far an edit may be slid looking for a better boundary. */
const MAX_SHIFT = 60;

/**
 * Slide one edit along the text to its best-reading position, WITHOUT changing
 * what the diff says. An edit can be rotated one symbol at a time whenever
 * every non-empty side starts (or ends) with the symbol it would swap with —
 * the text as a whole stays identical, only the marks move.
 *
 * This is what turns "holding t[-e][+he te]mperature" into
 * "holding [+the ]temperature": both are the same edit, one is readable.
 */
function slide(before: string, removed: string, added: string, after: string) {
  let best = { before, removed, added, after };
  let bestScore = placementScore(before, removed, added, after);

  const canRotate = (side: string, symbol: string, at: 0 | -1) =>
    side === "" || (at === 0 ? side.slice(0, 1) : side.slice(-1)) === symbol;

  // Left: take the last symbol of the text before the edit and push it through.
  let current = { before, removed, added, after };
  for (let step = 0; step < MAX_SHIFT; step++) {
    const symbol = current.before.slice(-1);
    if (symbol === "" || (current.removed === "" && current.added === "")) break;
    if (!canRotate(current.removed, symbol, -1) || !canRotate(current.added, symbol, -1)) break;
    current = {
      before: current.before.slice(0, -1),
      removed: current.removed === "" ? "" : symbol + current.removed.slice(0, -1),
      added: current.added === "" ? "" : symbol + current.added.slice(0, -1),
      after: symbol + current.after,
    };
    const score = placementScore(current.before, current.removed, current.added, current.after);
    if (score > bestScore) {
      bestScore = score;
      best = current;
    }
  }

  // Right: the mirror image.
  current = { before, removed, added, after };
  for (let step = 0; step < MAX_SHIFT; step++) {
    const symbol = current.after.slice(0, 1);
    if (symbol === "" || (current.removed === "" && current.added === "")) break;
    if (!canRotate(current.removed, symbol, 0) || !canRotate(current.added, symbol, 0)) break;
    current = {
      before: current.before + symbol,
      removed: current.removed === "" ? "" : current.removed.slice(1) + symbol,
      added: current.added === "" ? "" : current.added.slice(1) + symbol,
      after: current.after.slice(1),
    };
    const score = placementScore(current.before, current.removed, current.added, current.after);
    if (score > bestScore) {
      bestScore = score;
      best = current;
    }
  }

  return best;
}

/**
 * `before` → `after` as a list of runs, in reading order. A replacement comes
 * out as the removed run FIRST and the added run right after it, which is how
 * the design reads ("~~45°F~~ 50°F").
 *
 * An empty side is not a special case: filling an empty field is all-added and
 * clearing one is all-removed, which is what Daniel asked for (2026-08-04).
 */
export function diffWords(before: string, after: string): DiffRun[] {
  const a = tokenize(before);
  const b = tokenize(after);

  // Shared head and tail first — a normal edit touches a few words, so this
  // usually leaves the LCS table tiny.
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head++;
  let tail = 0;
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++;

  const midA = a.slice(head, a.length - tail);
  const midB = b.slice(head, b.length - tail);

  // A rewrite too big to measure: one block out, one block in.
  if (midA.length * midB.length > MAX_CELLS) {
    const runs: DiffRun[] = [];
    push(runs, "equal", a.slice(0, head).join(""));
    pushMarked(runs, "removed", midA.join(""));
    pushMarked(runs, "added", midB.join(""));
    push(runs, "equal", a.slice(a.length - tail).join(""));
    return runs;
  }

  const table = lcsTable(midA, midB);
  const w = midB.length + 1;

  // Walk the table into alternating segments. Consecutive changes are collected
  // into ONE edit so a rewritten sentence reads as two blocks, not as a stutter
  // of alternating words.
  const segments: Segment[] = [];
  let equalBuffer = "";
  let i = 0;
  let j = 0;
  while (i < midA.length || j < midB.length) {
    if (i < midA.length && j < midB.length && midA[i] === midB[j]) {
      equalBuffer += midA[i];
      i++;
      j++;
      continue;
    }
    if (equalBuffer !== "") {
      segments.push({ equal: equalBuffer });
      equalBuffer = "";
    }
    let removed = "";
    let added = "";
    while (i < midA.length || j < midB.length) {
      if (i < midA.length && j < midB.length && midA[i] === midB[j]) break;
      if (j < midB.length && (i === midA.length || table[i * w + j + 1] >= table[(i + 1) * w + j])) {
        added += midB[j++];
      } else {
        removed += midA[i++];
      }
    }
    segments.push({ removed, added });
  }
  if (equalBuffer !== "") segments.push({ equal: equalBuffer });

  // Semantic cleanup. Per SYMBOL, two different sentences share letters all
  // over the place, so the raw LCS comes out as confetti — "4[5]0°F", a lone
  // "t" kept between two rewritten words. An unchanged scrap is swallowed when
  // EITHER test passes:
  //
  //   • it is at most NOISE_FLOOR symbols — at character level a two-letter
  //     leftover between two edits is never something the reader is meant to
  //     notice, whatever surrounds it;
  //   • or it is no longer than the edit on BOTH sides of it (scale-free, the
  //     diff-match-patch rule), which leaves a genuinely unchanged phrase
  //     between two edits alone.
  //
  // The floor is what makes it work: the scale-free test ALONE is blocked by a
  // one-symbol edit sitting in the middle of a rewrite ("…allows the u|se|[+r]
  // |t|ake a look…"), because nothing may merge past a neighbour smaller than
  // the scrap, so the whole region stays confetti.
  // It runs to a FIXED POINT, not in one pass: merging grows the edit around a
  // scrap, which can make an earlier scrap — skipped because its neighbour was
  // still small — mergeable after all. One pass leaves those behind.
  for (let merged = true; merged; ) {
    merged = false;
    for (let k = 1; k < segments.length - 1; k++) {
      const previous = segments[k - 1];
      const current = segments[k];
      const next = segments[k + 1];
      if (!isEqual(current) || isEqual(previous) || isEqual(next)) continue;
      const scrap = current.equal.length;
      const fitsBetween =
        scrap <= Math.max(previous.removed.length, previous.added.length) &&
        scrap <= Math.max(next.removed.length, next.added.length);
      if (scrap > NOISE_FLOOR && !fitsBetween) continue;
      // The scrap belongs to BOTH sides — it was in the old text and it is in
      // the new one.
      previous.removed += current.equal + next.removed;
      previous.added += current.equal + next.added;
      segments.splice(k, 2);
      merged = true;
      k--;
    }
  }

  // Put the shared head and tail back in, so every edit has an unchanged
  // neighbour on each side to slide against.
  segments.unshift({ equal: a.slice(0, head).join("") });
  segments.push({ equal: a.slice(a.length - tail).join("") });
  for (let k = 0; k < segments.length; k++) {
    if (isEqual(segments[k])) continue;
    // Both sides sharing a start or an end means that part never changed.
    const edit = segments[k] as { removed: string; added: string };
    let prefix = 0;
    while (prefix < edit.removed.length && prefix < edit.added.length && edit.removed[prefix] === edit.added[prefix]) {
      prefix++;
    }
    let suffix = 0;
    while (
      suffix < edit.removed.length - prefix &&
      suffix < edit.added.length - prefix &&
      edit.removed[edit.removed.length - 1 - suffix] === edit.added[edit.added.length - 1 - suffix]
    ) {
      suffix++;
    }
    const previous = segments[k - 1] as { equal: string };
    const next = segments[k + 1] as { equal: string };
    previous.equal += edit.removed.slice(0, prefix);
    next.equal = edit.removed.slice(edit.removed.length - suffix) + next.equal;
    edit.removed = edit.removed.slice(prefix, edit.removed.length - suffix);
    edit.added = edit.added.slice(prefix, edit.added.length - suffix);

    const placed = slide(previous.equal, edit.removed, edit.added, next.equal);
    previous.equal = placed.before;
    edit.removed = placed.removed;
    edit.added = placed.added;
    next.equal = placed.after;

    // Two rewritten sentences END the same way — with a full stop — so the
    // diff calls that stop unchanged and leaves it outside both marks. The
    // reader then sees a struck sentence missing its stop, a highlighted
    // sentence missing its stop, and one stop belonging to neither. Give a
    // COPY to each side: the rendered paragraph gains one character, and both
    // versions read as finished sentences (Daniel, 2026-08-04).
    // Only after a real REPLACEMENT, and only for a sentence terminator — a
    // comma after a swapped word stays shared.
    if (edit.removed !== "" && edit.added !== "") {
      const stop = /^[.!?]+/.exec(next.equal)?.[0];
      if (stop != null) {
        edit.removed += stop;
        edit.added += stop;
        next.equal = next.equal.slice(stop.length);
      }
    }
  }

  const runs: DiffRun[] = [];
  for (const segment of segments) {
    if (isEqual(segment)) {
      push(runs, "equal", segment.equal);
    } else {
      pushMarked(runs, "removed", segment.removed);
      pushMarked(runs, "added", segment.added);
    }
  }
  return runs;
}
