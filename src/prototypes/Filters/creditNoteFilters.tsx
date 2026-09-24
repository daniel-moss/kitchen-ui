import { BadgeCreditNoteStatusStatus, STATUS } from "../../components/Badge/BadgeCreditNoteStatus";
import { Icon } from "../../components/Icon/Icon";
import { CREDIT_NOTE_LABELS } from "../../data/db";

import { FilterDef } from "./filterDefs";
import {
  clientTemplate,
  issuedTemplate,
  labelsTemplate,
  lastModifiedTemplate,
  totalTemplate,
} from "./filterTemplates";
import { CREDIT_NOTE_TYPES, CreditNoteRow, clientOf } from "./creditNotesData";

// The CREDIT NOTES list's filter registry — ONE entry per row of its Filters
// menu (node 14759-68604 on Daniel's Credit Notes page 14759-68515, read
// 2026-09-14), in the menu's alphabetical order: Client, Issued, Labels, Last
// modified, Status, Total, Type.
//
// TWO kinds of entry, the standing Figma split:
//   - STATUS (section 14759-68590) and TYPE (14759-71943) are
//     object-specific — the page's own "Object-Specific Filters" section —
//     and are written out below;
//   - the other FIVE are shared TEMPLATES (14267-23337), handed the one thing
//     that differs: how to read a CREDIT NOTE.
//
// Compared to the sibling lists, the SHORT menu is the object's own shape: a
// credit note has no location and no service (it belongs to the client
// directly), no due date, and no Seen column — so Location address, Location,
// Service, Due date, Seen, Amount due and Status changed simply have nothing
// to read.

// ---- Status (object-specific) ----------------------------------------------

/**
 * The statuses each PHASE offers, read off the two list nodes (Open
 * 14759-68592: Draft · Unsent, Closed 14759-68594: Issued · Voided) in their
 * order.
 *
 * They are the same sets the view tabs group by — see `BRANCHES` in
 * CreditNotesPage.tsx, whose views partition exactly these lists. Both come
 * from the same design; if one changes, change the other.
 */
export const CREDIT_NOTE_PHASE_STATUSES: Record<CreditNotesPhase, BadgeCreditNoteStatusStatus[]> = {
  open: ["draft", "unsent"],
  closed: ["issued", "voided"],
};

/** The two branches (phases) the Credit notes page switches between. */
export type CreditNotesPhase = "open" | "closed";

/**
 * Status — the Credit notes list's own filter (Figma section 14759-68590, a
 * Multi-Select Filter — pattern documentation 14038-14033). The invoices
 * shape exactly: the DS `SelectListHeader` in its CHIPS-ONLY variant ("is" /
 * "is not", `dsHeader`), NO search on either phase — two rows need none —
 * and rows that are a checkbox, the status icon and the label, with no count.
 *
 * The icons, their colors and the labels all come from BadgeCreditNoteStatus's
 * own STATUS map — the same source the table's badges use, so a status can
 * never be spelled or coloured two ways. The nodes agree with it row for row
 * (read 2026-09-14): Draft gray-a9 circle-dashed · Unsent violet-a9
 * circle-dashed · Issued jade-a9 circle-check · Voided gray-a9 circle-xmark.
 * Only the ICON is coloured — the label stays --text-strong, body-400.
 *
 * The menu row's own icon is a plain `circle-dashed` with NO rotation — the
 * settled rule (Daniel, 2026-09-12). FLAGGED: this menu node still draws the
 * icon turned 180°, like the Jobs one used to; built without it, per the rule.
 */
function statusFilter(phase: CreditNotesPhase): FilterDef<CreditNoteRow> {
  return {
    id: "status",
    noun: { one: "status", many: "statuses" },
    label: "Status",
    icon: "circle-dashed",
    hideCounts: true,
    dsHeader: true,
    options: CREDIT_NOTE_PHASE_STATUSES[phase].map((key) => ({
      id: key,
      label: STATUS[key].label,
      slotLeft: (
        <Icon
          icon={STATUS[key].icon}
          pack="solid"
          size={14}
          container="square"
          style={{ color: `var(--${STATUS[key].scheme}-a9)` }}
        />
      ),
    })),
    // The stored status IS the badge status here — nothing is clock-derived.
    matches: (creditNote, { ids }) => ids.includes(creditNote.status),
  };
}

// ---- Type (object-specific) -------------------------------------------------

/**
 * Type — the Credit notes list's second object-specific filter (Figma section
 * 14759-71943, a Multi-Select Filter), and CLOSED-phase only since later on
 * 2026-09-14 (Daniel: "The same for the filter. It should be only shown on
 * the 'closed' views") — an open credit note has no type yet, so on the open
 * phase the filter could never match. FLAGGED: the menu node (14759-68604)
 * still draws ONE menu with the Type row — the open phase's menu here has
 * six rows.
 *
 * Unlike the Jobs list's single-select Type, this one is an ordinary
 * multi-select: the node draws checkbox rows and its chips write "is any of"
 * / "N types" (14759-71954).
 *
 * The rows are the three production `CreditNoteType` values in the design's
 * casing — Pre-payment · Post-payment · Mixed — as bare checkbox rows: no
 * icons and no counts (desktop node 14759-71944). The header is the
 * chips-only `SelectListHeader` ("is" / "is not"), no search.
 *
 * The icon is `shapes` — the category metaphor, Daniel's established Type
 * icon (picked for the Jobs Type on 2026-09-03); this menu node draws it too
 * (re-read 2026-09-14, after it replaced the placeholder `diamonds-4`).
 *
 * A row with NO type (a draft or unsent note — production computes the type
 * at issue time) matches no option, and falls under every "is not" — the
 * Service template's rule for its null rows.
 */
function typeFilter(): FilterDef<CreditNoteRow> {
  return {
    id: "type",
    noun: { one: "type", many: "types" },
    label: "Type",
    icon: "shapes",
    hideCounts: true,
    dsHeader: true,
    options: CREDIT_NOTE_TYPES.map((type) => ({ id: type.id, label: type.label })),
    matches: (creditNote, { ids }) => creditNote.type != null && ids.includes(creditNote.type),
  };
}

// ---- the registry ----------------------------------------------------------

/**
 * ONE registry per BRANCH, the other pages' rule: only the Status filter
 * differs between them — the open phase's two statuses or the closed phase's
 * two. Everything else is the same object on both.
 *
 * The menu lists them alphabetically, the order its own node draws
 * (14759-68604): Client, Issued, Labels, Last modified, Status, Total — and
 * Type on the CLOSED phase alone (see `typeFilter`).
 */
const buildCreditNoteFilters = (phase: CreditNotesPhase): FilterDef<CreditNoteRow>[] => [
  // A credit note has its OWN client (production `external_client`) — the one
  // list whose client link is direct, with no location in between.
  clientTemplate((creditNote) => clientOf(creditNote).id),

  issuedTemplate((creditNote) => creditNote.issuedAt),

  // Credit notes carry their OWN label table (production `CreditNoteLabel` —
  // see CREDIT_NOTE_LABELS in the db), which is exactly the parameter the
  // template takes. The matching rules are the shared ones, unchanged.
  labelsTemplate(CREDIT_NOTE_LABELS, (creditNote) => creditNote.labelIds),

  lastModifiedTemplate((creditNote) => creditNote.lastModifiedAt),
  statusFilter(phase),
  totalTemplate((creditNote) => creditNote.total),
  // Last in the menu — and only where a credit note can HAVE a type.
  ...(phase === "closed" ? [typeFilter()] : []),
];

export const CREDIT_NOTE_FILTERS: Record<CreditNotesPhase, FilterDef<CreditNoteRow>[]> = {
  open: buildCreditNoteFilters("open"),
  closed: buildCreditNoteFilters("closed"),
};
