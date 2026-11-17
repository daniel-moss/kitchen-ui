import { ReactNode, useMemo, useState } from "react";

import AvatarDiscount from "../../../components/Avatar/AvatarDiscount";
import AvatarLaborRate from "../../../components/Avatar/AvatarLaborRate";
import AvatarLive from "../../../components/Avatar/AvatarLive";
import AvatarOther from "../../../components/Avatar/AvatarOther";
import AvatarProduct from "../../../components/Avatar/AvatarProduct";
import Button from "../../../components/Button/Button";
import Counter from "../../../components/Counter/Counter";
import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import EmptyState from "../../../components/EmptyState/EmptyState";
import { Icon } from "../../../components/Icon/Icon";
import IconButton from "../../../components/IconButton/IconButton";
import ItemGroup from "../../../components/ItemGroup/ItemGroup";
import ItemTextBlock from "../../../components/ItemText/ItemText/ItemTextBlock";
import ListItem from "../../../components/ListItem/ListItem";
import Menu from "../../../components/Menu/Menu";
import MenuItem from "../../../components/Menu/MenuItem";
import MenuItemGroup from "../../../components/Menu/MenuItemGroup";
import Prompt from "../../../components/Prompt/Prompt";
import { toast } from "../../../components/Toast/Toaster";
import HoverTooltip from "../../../components/Tooltip/HoverTooltip";
import ValueDisplay from "../../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../../components/ValueDisplay/ValueDisplayGroup";
import { JobChargeLines, useOptionalAppStore } from "../../../app/store/AppStore";
import {
  chargesOf,
  COMPANY,
  DISCOUNT_ITEMS,
  DISCOUNT_SUBTYPES,
  discountsOf,
  editingLocksOf,
  inventoryLocationOf,
  LABOR_ITEMS,
  LABOR_SUBTYPES,
  OTHER_ITEMS,
  OTHER_SUBTYPES,
  PRODUCT_ITEMS,
  PRODUCT_SUBTYPES,
} from "../../../data/db";
import type { Charge, ChargeItem, Job, LaborItem, ProductItem } from "../../../data/db";
import type { User } from "../../../data/users";
import { usersById } from "../../../data/users";
import { Breakpoint } from "../../../hooks/useIsDesktop";
import { joinWithSeparator } from "../../../utils/textSeparator";
import DiscountSelectList from "../../Discount/DiscountSelectList/DiscountSelectList";
import LaborRatePanel from "../../LaborRatePanel/LaborRatePanel";
import LaborRateSelectList from "../../LaborRateSelectList/LaborRateSelectList";
import OtherChargeSelectList from "../../OtherCharge/OtherChargeSelectList/OtherChargeSelectList";
import { LOCATION_TYPE_ICON, locationTitle } from "../../Product/NewProductForm/InventoryLevelsField";
import ProductSelectList from "../../Product/ProductSelectList/ProductSelectList";
import { useAnchoredMenu } from "../../shared/anchoredMenu";

import { LineEquipment, LineEquipmentProvider } from "./lineEquipment";
import { noop } from "../shared";

import {
  AttributionRows,
  discountAmount,
  formatAmount,
  laborAmount,
  negative,
  otherAmount,
  productAmount,
  serviceDates,
  subtypeName,
} from "./lineDisplay";
import DiscountLineForm from "./LineForms/DiscountLineForm";
import LaborLineForm from "./LineForms/LaborLineForm";
import OtherLineForm from "./LineForms/OtherLineForm";
import ProductLineForm from "./LineForms/ProductLineForm";
import ProfitabilityModule from "./ProfitabilityModule";
import SubtotalModule from "./SubtotalModule";

import styles from "./ChargesSegment.module.scss";

// ---------------------------------------------------------------------------
// THE JOB DETAILS "CHARGES" SEGMENT (Summary → Charges) — Figma "Job Details"
// Page — Next Update, 29380-42876 (Daniel's handoff, 2026-11-13). Based on
// Concept 2, with his adjustments:
//
//   - one DisplayModule per charge type: Counter + the type's total in the
//     header ("$0.00" in the placeholder color when empty), a "Re-order"
//     IconButton (2+ lines only) and a plus;
//   - every line is an accordion ListItem, collapsed by default, with a ⋯
//     context menu (Edit, View pricebook item, Delete — 2026-11-16); open, it
//     shows the Edit Button (filling), then its details 12px below;
//   - "Re-order" switches the module to re-order mode: the rows turn into
//     draggable, non-clickable rows (no Delete since 2026-11-14), and a "Done"
//     Button replaces the header's buttons. ONE module at a time, and entering
//     it collapses the open rows (Daniel);
//   - "View pricebook item" opens the labor rate's side panel; products, other
//     charges and discounts have no side panel yet, so it is inactive there
//     (Daniel);
//   - every amount shows 2 to 3 decimals (`formatAmount`, Daniel);
//   - a line SOMEONE ELSE is editing is locked, in every module (Figma
//     "Shared Behavior", 29733-54808, 2026-11-16): their live avatar before
//     the ⋯, no Edit in the body, only "View pricebook item" in the menu.
//     The demo's locks live in the database (`editingLocksOf`).
//
// The lines are SAVED in the app store (in memory, like every demo edit), so
// leaving the job and coming back keeps them. In a story outside the demo app
// they are kept locally. The concepts keep their own frozen copy of all this
// in ../ChargesModule — the two never follow each other.
// ---------------------------------------------------------------------------

type Kind = "labor" | "product" | "other" | "discount";

/** Which list in `JobChargeLines` holds a kind. */
const LIST_OF: Record<Kind, keyof JobChargeLines> = { labor: "labor", product: "products", other: "other", discount: "discounts" };

/** The job's lines as the database derives them (db/jobCharges). */
function seedLines(job: Job): JobChargeLines {
  const groups = chargesOf(job);
  const itemsOf = (key: string) => groups.find((group) => group.key === key)?.items ?? [];
  return {
    labor: itemsOf("labor").filter((charge) => charge.labor != null),
    products: itemsOf("products").filter((charge) => charge.product != null),
    other: itemsOf("other").filter((charge) => charge.other != null),
    discounts: discountsOf(job).filter((charge) => charge.discount != null),
  };
}

/** The saved lines (the app store) — or local ones, in a story of its own. */
function useSavedLines(job: Job, initial?: JobChargeLines): [JobChargeLines, (update: (lines: JobChargeLines) => JobChargeLines) => void] {
  const store = useOptionalAppStore();
  const seed = useMemo(() => initial ?? seedLines(job), [job, initial]);
  const [local, setLocal] = useState(seed);
  if (store == null) return [local, setLocal];
  const lines = store.chargeLines[job.id] ?? seed;
  return [lines, (update) => store.setChargeLines(job.id, update(lines))];
}

let nextLineId = 0;
/** A new line a form hands back. */
const newCharge = (title: string, line: Partial<Charge>): Charge => ({
  id: `new-${++nextLineId}`,
  title,
  caption: "",
  total: "",
  unit: "",
  ...line,
});

// ---- one line ------------------------------------------------------------------

interface LineRowProps {
  title: string;
  caption?: string;
  avatar: ReactNode;
  right: ReactNode;
  /** The open row's details. */
  details: ReactNode;
  /** Re-order mode: a draggable, non-clickable row. */
  reorder: boolean;
  /** Injected by ItemGroup on the lifted drag copy — passed on to the ListItem. */
  isDragging?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  /** Opens the pricebook item. Unset → "View pricebook item" is inactive. */
  onPricebook?: () => void;
  /** Finalized / Cancelled job: no Edit, no Delete. */
  readOnly: boolean;
  /** Drawer (mobile) or anchored card (desktop) for the context menu. */
  mobile: boolean;
  /** Another user is editing this line — it is locked for the viewer. */
  editingBy?: User;
}

/**
 * One line (Figma 29380-42961 / -43262 / -43445 / -43604, 2026-11-16): the
 * row's right slot holds a ⋯ IconButton whose Menu has Edit, View pricebook
 * item and Delete; the open body has only the Edit Button, then the details.
 */
function LineRow(props: LineRowProps) {
  const { title, caption, avatar, right, isDragging } = props;
  if (props.reorder) {
    // No Delete here any more (Daniel, 2026-11-14) — a line is deleted from
    // its menu, outside re-order mode.
    const variant = caption != null ? ("titleCaption" as const) : ("title" as const);
    return <ListItem variant={variant} title={title} caption={caption} avatar={avatar} right={right} isDraggable isDragging={isDragging} />;
  }
  return <MenuLineRow {...props} />;
}

/** A line outside re-order mode — its own component, as it owns the menu's state. */
function MenuLineRow({ title, caption, avatar, right, details, onEdit, onDelete, onPricebook, readOnly, mobile, editingBy }: LineRowProps) {
  const menu = useAnchoredMenu(!mobile);
  // Someone else editing the line locks it (Figma "Locked", 29733-54353): no
  // Edit in the body, and the menu keeps only "View pricebook item".
  const canEdit = !readOnly && editingBy == null;
  const item = (label: string, icon: string, onClick: (() => void) | undefined, danger = false) => {
    const shared = {
      label,
      slotLeft: <Icon icon={icon} container="square" />,
      disabled: onClick == null,
      onClick: () => {
        menu.close();
        onClick?.();
      },
    };
    return danger ? <MenuItem {...shared} danger /> : <MenuItem {...shared} />;
  };
  const menuBody = (
    <>
      <MenuItemGroup>
        {canEdit && item("Edit", "pen", onEdit)}
        {item("View pricebook item", "arrow-up-right", onPricebook)}
      </MenuItemGroup>
      {canEdit && <MenuItemGroup>{item("Delete", "trash-can", onDelete, true)}</MenuItemGroup>}
    </>
  );
  const menuButton = (
    <IconButton
      icon="ellipsis"
      variant="ghost"
      size="md"
      aria-label={`${title} actions`}
      isPressed={menu.open}
      noDebounce
      onClick={menu.onActions}
    />
  );
  return (
    <>
      <ListItem
        variant={caption != null ? "titleCaption" : "title"}
        title={title}
        caption={caption}
        avatar={avatar}
        right={right}
        slotRight={
          editingBy == null ? (
            menuButton
          ) : (
            <>
              {/* The editor's live avatar, before the menu; hover names them (Figma 29733-54750). */}
              <HoverTooltip text={`${editingBy.firstName} ${editingBy.lastName.charAt(0)}. is editing...`}>
                <AvatarLive size="lg" content="image" color="amber" imageSrc={editingBy.avatar} />
              </HoverTooltip>
              {menuButton}
            </>
          )
        }
        isAccordion
      >
        <div className={styles.menuLineBody}>
          {canEdit && (
            <Button size="lg" variant="subtle" leftIcon="pen" isFullWidth onClick={onEdit}>
              Edit
            </Button>
          )}
          {details}
        </div>
      </ListItem>
      {/* Mobile: the drawer is titled with the line's name (Figma annotation). */}
      {mobile ? (
        <Menu open={menu.open} onClose={menu.close} title={title} breakpoint="mobile">
          {menuBody}
        </Menu>
      ) : (
        menu.pos != null && (
          <div ref={menu.cardRef} className={styles.anchoredMenu} style={{ top: menu.pos.top, left: menu.pos.left, right: menu.pos.right }}>
            <Menu open={menu.open} onClose={menu.close} breakpoint="desktop">
              {menuBody}
            </Menu>
          </div>
        )
      )}
    </>
  );
}

// ---- one type module -----------------------------------------------------------

interface TypeModuleProps {
  title: string;
  /** The plus's tooltip — "Add labor rate", "Add product"… */
  addLabel: string;
  empty: string;
  count: number;
  total: number;
  rows: ReactNode[];
  reorder: boolean;
  readOnly: boolean;
  onAdd: () => void;
  onStartReorder: () => void;
  onDone: () => void;
  onReorder: (from: number, to: number) => void;
}

function TypeModule({ title, addLabel, empty, count, total, rows, reorder, readOnly, onAdd, onStartReorder, onDone, onReorder }: TypeModuleProps) {
  const slotRight = readOnly ? undefined : reorder ? (
    <Button size="md" variant="ghost" onClick={onDone}>
      Done
    </Button>
  ) : (
    <>
      {/* "Only shown if there are more than 1 line-item on the list." */}
      {count > 1 && (
        <HoverTooltip text="Re-order">
          <IconButton icon="arrow-up-arrow-down" variant="ghost" size="md" aria-label="Re-order" onClick={onStartReorder} />
        </HoverTooltip>
      )}
      <HoverTooltip text={addLabel}>
        <IconButton icon="plus" variant="ghost" size="md" aria-label={addLabel} onClick={onAdd} />
      </HoverTooltip>
    </>
  );
  return (
    <DisplayModule
      title={title}
      titleSlotRight={count > 0 ? <Counter value={count} /> : undefined}
      textRight={<ItemTextBlock align="right" variant="title" title={formatAmount(total)} titleColor={count === 0 ? "placeholder" : undefined} />}
      slotRight={slotRight}
      bodyPadded={false}
      content={
        count === 0 ? (
          <EmptyState caption={empty} />
        ) : (
          <ItemGroup className={styles.lineGroup} onReorder={reorder ? onReorder : undefined}>
            {rows}
          </ItemGroup>
        )
      }
    />
  );
}

// ---- the segment ---------------------------------------------------------------

/** Which line form is open — the pricebook item and, on an edit, the line. */
type LineForm =
  | { kind: "labor"; item: LaborItem; chargeId?: string }
  | { kind: "product"; item: ProductItem; chargeId?: string }
  | { kind: "other"; item: ChargeItem; chargeId?: string }
  | { kind: "discount"; item: ChargeItem; chargeId?: string };

/** What the Delete prompt and toast call a line. */
const NOUN: Record<Kind, string> = { labor: "labor rate", product: "product", other: "charge", discount: "discount" };

export interface ChargesSegmentProps {
  /** The job the charges belong to — its date, equipment and assignees. */
  job: Job;
  /** Mobile: lists, forms and prompts are drawers. */
  mobile?: boolean;
  /** Finalized / Cancelled job: no plus, no re-order, no Edit or Delete. */
  readOnly?: boolean;
  /** The pricebook rates the Labor rates plus lists (the app's store). Default the database's. */
  laborRates?: LaborItem[];
  /** The "Labor rates" list's footer action — the app's "New labor rate" form. */
  onAddLaborRate?: () => void;
  /**
   * DRAFT mode (2026-11-14, the "Hold job" Detailed flow's Charges step): the
   * caller holds the lines and receives every change, instead of the saved
   * lines changing at once — so cancelling the flow drops the edits. Unset =
   * the saved lines (the Charges tab).
   */
  lines?: JobChargeLines;
  onLinesChange?: (lines: JobChargeLines) => void;
  /** The Profitability module under the Subtotal. Default true; the Hold flow's step hides it (Daniel). */
  showProfitability?: boolean;
  /**
   * Lines another user is editing right now: line id → that user's id
   * (`src/data/users`). Each one is LOCKED for the viewer, in every module
   * (Figma "Shared Behavior" → "Locked Editing", 29733-56399): the editor's
   * live avatar sits before the ⋯, the body has no Edit, and the menu has
   * only "View pricebook item". Default: the job's locks in the database
   * (`editingLocksOf`).
   */
  editingLocks?: Record<string, number>;
  /**
   * The job's LIVE equipment and how to add a piece to it (Job Details). The
   * forms' "Equipment attribution" lists it, with an "Add equipment" action
   * when `onCreate` is set. Unset → the job's equipment in the database, no
   * action. See ./lineEquipment.
   */
  lineEquipment?: LineEquipment;
  /**
   * The lines the segment STARTS with, in place of the ones the database
   * derives for the job — a user-testing build sets its own (see
   * prototypes/JobDetailsLineItems). Unset = the database's lines.
   */
  initialLines?: JobChargeLines;
}

/**
 * A "Charges only" user-testing build (prototypes/JobDetailsLineItems): the
 * Job Details page opens on Summary → Charges with these lines and locks, and
 * the page cannot leave it.
 */
export interface ChargesTestSetup {
  lines: JobChargeLines;
  /** Line id → the id of the user editing it (see `editingLocks`). */
  editingLocks: Record<string, number>;
}

/** A job's charge lines as the Charges segment starts them — saved, else derived. Exported for draft callers. */
export function useJobChargeLines(job: Job): JobChargeLines {
  return useSavedLines(job)[0];
}

export default function ChargesSegment({
  job,
  mobile = false,
  readOnly = false,
  laborRates = LABOR_ITEMS,
  onAddLaborRate = noop,
  lines: draftLines,
  onLinesChange,
  showProfitability = true,
  editingLocks = editingLocksOf(job),
  lineEquipment,
  initialLines,
}: ChargesSegmentProps) {
  const segment = (
    <ChargesSegmentBody
      job={job}
      initialLines={initialLines}
      mobile={mobile}
      readOnly={readOnly}
      laborRates={laborRates}
      onAddLaborRate={onAddLaborRate}
      lines={draftLines}
      onLinesChange={onLinesChange}
      showProfitability={showProfitability}
      editingLocks={editingLocks}
    />
  );
  return lineEquipment != null ? <LineEquipmentProvider value={lineEquipment}>{segment}</LineEquipmentProvider> : segment;
}

function ChargesSegmentBody({
  job,
  mobile,
  readOnly,
  laborRates,
  onAddLaborRate,
  lines: draftLines,
  onLinesChange,
  showProfitability,
  editingLocks,
  initialLines,
}: Required<Pick<ChargesSegmentProps, "job" | "mobile" | "readOnly" | "laborRates" | "onAddLaborRate" | "showProfitability" | "editingLocks">> &
  Pick<ChargesSegmentProps, "lines" | "onLinesChange" | "initialLines">) {
  const saved = useSavedLines(job, initialLines);
  const [lines, setLines]: [JobChargeLines, (update: (lines: JobChargeLines) => JobChargeLines) => void] =
    draftLines != null ? [draftLines, (update) => onLinesChange?.(update(draftLines))] : saved;
  const breakpoint: Breakpoint = mobile ? "mobile" : "desktop";

  // ONE module in re-order mode at a time (Daniel, 2026-11-13).
  const [reorderKind, setReorderKind] = useState<Kind | null>(null);

  const [listOpen, setListOpen] = useState<Kind | null>(null);
  const [form, setForm] = useState<LineForm | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const openForm = (next: LineForm) => {
    setForm(next);
    setFormOpen(true);
  };
  const [ratePanel, setRatePanel] = useState<LaborItem | null>(null);

  const setList = (kind: Kind, update: (list: Charge[]) => Charge[]) =>
    setLines((current) => ({ ...current, [LIST_OF[kind]]: update(current[LIST_OF[kind]]) }));

  /** "Add" puts a new line at the end; "Save" puts the edited one back in its place. */
  const commit = (kind: Kind, title: string, patch: Partial<Charge>) =>
    setList(kind, (list) =>
      form?.chargeId == null ? [...list, newCharge(title, patch)] : list.map((charge) => (charge.id === form.chargeId ? { ...charge, ...patch } : charge)),
    );
  const editing = <T,>(list: Charge[], pick: (charge: Charge) => T | undefined) =>
    form?.chargeId == null ? null : (pick(list.find((charge) => charge.id === form.chargeId)!) ?? null);

  const reorderList = (kind: Kind) => (from: number, to: number) =>
    setList(kind, (list) => {
      const next = [...list];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  // Delete asks first. Kept after the answer, so the prompt closes with its text in place.
  const [deleting, setDeleting] = useState<{ kind: Kind; charge: Charge } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const askDelete = (kind: Kind, charge: Charge) => () => {
    setDeleting({ kind, charge });
    setDeleteOpen(true);
  };
  const confirmDelete = () => {
    if (deleting == null) return;
    setDeleteOpen(false);
    const { kind, charge } = deleting;
    // Re-order mode has nothing left to order once one line remains.
    if (lines[LIST_OF[kind]].length <= 2 && reorderKind === kind) setReorderKind(null);
    setList(kind, (list) => list.filter((row) => row.id !== charge.id));
    const noun = NOUN[kind];
    toast({ type: "success", title: `${noun.charAt(0).toUpperCase()}${noun.slice(1)} deleted` });
  };

  /** What every row of a kind shares. The row key carries the mode, so entering or leaving re-order mode remounts the rows — collapsed. */
  const rowKey = (kind: Kind, charge: Charge) => `${charge.id}-${reorderKind === kind ? "reorder" : "list"}`;
  const rowProps = (kind: Kind, charge: Charge) => ({
    title: charge.title,
    reorder: reorderKind === kind,
    readOnly,
    mobile,
    onDelete: askDelete(kind, charge),
    // Shared by every module: a line someone else is editing is locked.
    editingBy: editingLocks[charge.id] != null ? usersById.get(editingLocks[charge.id]) : undefined,
  });

  // ---- the rows, per type ----

  const laborRows = lines.labor.map((charge) => {
    const labor = charge.labor!;
    const hourly = labor.type === "hourly";
    const perHour = (n: number) => (hourly ? `${formatAmount(n)}/hr` : formatAmount(n));
    const dates = serviceDates(labor);
    const rate = laborRates.find((row) => row.id === charge.laborRateId) ?? LABOR_ITEMS.find((row) => row.id === charge.laborRateId);
    return (
      <LineRow
        key={rowKey("labor", charge)}
        {...rowProps("labor", charge)}
        caption={dates.text}
        avatar={<AvatarLaborRate size="xl" />}
        // Hourly: the Amount over "Price × Hours". Flat: the Price alone.
        right={
          hourly ? (
            <ItemTextBlock align="right" variant="titleCaption" title={formatAmount(laborAmount(labor))} caption={`${perHour(labor.price)} × ${labor.hours} hr`} />
          ) : (
            <ItemTextBlock align="right" variant="title" title={formatAmount(labor.price)} />
          )
        }
        onEdit={() => rate != null && openForm({ kind: "labor", item: rate, chargeId: charge.id })}
        onPricebook={rate != null ? () => setRatePanel(rate) : undefined}
        details={
          <ValueDisplayGroup>
            {/* The demo company has subtypes enabled, so the row always shows. */}
            <ValueDisplay label="Subtype" value={subtypeName(LABOR_SUBTYPES, labor.subtypeId)} />
            <ValueDisplay label={dates.plural ? "Service dates" : "Service date"} value={dates.text} />
            <ValueDisplay label="Type" value={hourly ? "Hourly" : "Flat"} />
            <ValueDisplay label="Cost" value={perHour(labor.cost)} />
            <ValueDisplay label="Price" value={perHour(labor.price)} />
            {hourly && <ValueDisplay label="Hours" value={`${labor.hours} hr`} />}
            {hourly && <ValueDisplay label="Amount" value={formatAmount(laborAmount(labor))} />}
            <AttributionRows job={job} equipmentId={labor.equipmentId} technicianId={labor.technicianId} />
            <ValueDisplay label="Description" orientation="vertical" value={labor.description} lineLimit={4} />
          </ValueDisplayGroup>
        }
      />
    );
  });

  const productRows = lines.products.map((charge) => {
    const product = charge.product!;
    const item = PRODUCT_ITEMS.find((row) => row.id === charge.productId);
    const location = inventoryLocationOf(product.inventoryLocationId);
    return (
      <LineRow
        key={rowKey("product", charge)}
        {...rowProps("product", charge)}
        // "No Manufacturer" / "No Part #" for a missing part, like the Products list.
        caption={joinWithSeparator(product.manufacturer || "No Manufacturer", product.partNumber || "No Part #")}
        // The product's photo when it has one, like the Products list, else the icon.
        avatar={item?.imageUrl != null ? <AvatarProduct size="xl" content="image" imageSrc={item.imageUrl} /> : <AvatarProduct size="xl" />}
        right={
          <ItemTextBlock align="right" variant="titleCaption" title={formatAmount(productAmount(product))} caption={`${formatAmount(product.price)} × ${product.quantity}`} />
        }
        onEdit={() => item != null && openForm({ kind: "product", item, chargeId: charge.id })}
        details={
          <ValueDisplayGroup>
            <ValueDisplay label="Manufacturer" value={product.manufacturer} />
            <ValueDisplay label="Part #" value={product.partNumber} />
            <ValueDisplay label="Subtype" value={subtypeName(PRODUCT_SUBTYPES, product.subtypeId)} />
            {/* "Only shown if a product is marked Inventory." */}
            {location != null && (
              <ValueDisplay label="Inventory" value={locationTitle(location)} slotLeft={<Icon icon={LOCATION_TYPE_ICON[location.type]} size={14} />} />
            )}
            <ValueDisplay label="Cost" value={formatAmount(product.cost)} />
            <ValueDisplay label="Price" value={formatAmount(product.price)} />
            <ValueDisplay label="Quantity" value={String(product.quantity)} />
            <ValueDisplay label="Amount" value={formatAmount(productAmount(product))} />
            <AttributionRows job={job} equipmentId={product.equipmentId} technicianId={product.technicianId} />
            <ValueDisplay label="Description" orientation="vertical" value={product.description} lineLimit={4} />
          </ValueDisplayGroup>
        }
      />
    );
  });

  const otherRows = lines.other.map((charge) => {
    const other = charge.other!;
    const item = OTHER_ITEMS.find((row) => row.id === charge.otherChargeId);
    return (
      <LineRow
        key={rowKey("other", charge)}
        {...rowProps("other", charge)}
        avatar={<AvatarOther size="xl" />}
        right={<ItemTextBlock align="right" variant="titleCaption" title={formatAmount(otherAmount(other))} caption={`${formatAmount(other.price)} × ${other.quantity}`} />}
        onEdit={() => item != null && openForm({ kind: "other", item, chargeId: charge.id })}
        details={
          <ValueDisplayGroup>
            <ValueDisplay label="Subtype" value={subtypeName(OTHER_SUBTYPES, other.subtypeId)} />
            <ValueDisplay label="Cost" value={formatAmount(other.cost)} />
            <ValueDisplay label="Price" value={formatAmount(other.price)} />
            <ValueDisplay label="Quantity" value={String(other.quantity)} />
            <ValueDisplay label="Amount" value={formatAmount(otherAmount(other))} />
            <AttributionRows job={job} equipmentId={other.equipmentId} technicianId={other.technicianId} />
            <ValueDisplay label="Description" orientation="vertical" value={other.description} lineLimit={4} />
          </ValueDisplayGroup>
        }
      />
    );
  });

  const discountRows = lines.discounts.map((charge) => {
    const discount = charge.discount!;
    const item = DISCOUNT_ITEMS.find((row) => row.id === charge.discountId);
    return (
      <LineRow
        key={rowKey("discount", charge)}
        {...rowProps("discount", charge)}
        avatar={<AvatarDiscount size="xl" />}
        right={
          <ItemTextBlock
            align="right"
            variant="titleCaption"
            title={formatAmount(discountAmount(discount))}
            // The node draws the unit WITHOUT a minus ("$150.00 × 1") under "−$150.00".
            caption={`${formatAmount(discount.discount)} × ${discount.quantity}`}
          />
        }
        onEdit={() => item != null && openForm({ kind: "discount", item, chargeId: charge.id })}
        details={
          <ValueDisplayGroup>
            <ValueDisplay label="Subtype" value={subtypeName(DISCOUNT_SUBTYPES, discount.subtypeId)} />
            <ValueDisplay label="Discount" value={formatAmount(negative(discount.discount))} />
            <ValueDisplay label="Quantity" value={String(discount.quantity)} />
            <ValueDisplay label="Amount" value={formatAmount(discountAmount(discount))} />
            <AttributionRows job={job} equipmentId={discount.equipmentId} technicianId={discount.technicianId} />
            <ValueDisplay label="Description" orientation="vertical" value={discount.description} lineLimit={4} />
          </ValueDisplayGroup>
        }
      />
    );
  });

  const totalOf = (list: Charge[], amount: (charge: Charge) => number) => list.reduce((acc, charge) => acc + amount(charge), 0);
  const laborTotal = totalOf(lines.labor, (charge) => laborAmount(charge.labor!));
  const productTotal = totalOf(lines.products, (charge) => productAmount(charge.product!));
  const otherTotal = totalOf(lines.other, (charge) => otherAmount(charge.other!));
  const discountTotal = totalOf(lines.discounts, (charge) => discountAmount(charge.discount!));

  const moduleProps = (kind: Kind, rows: ReactNode[], total: number) => ({
    count: rows.length,
    total,
    rows,
    readOnly,
    reorder: reorderKind === kind,
    onAdd: () => setListOpen(kind),
    onStartReorder: () => setReorderKind(kind),
    onDone: () => setReorderKind(null),
    onReorder: reorderList(kind),
  });

  return (
    // `data-charges-segment` marks the area a "Charges only" user test leaves usable.
    <div className={styles.stack} data-charges-segment>
      <TypeModule title="Labor rates" addLabel="Add labor rate" empty="No labor rates" {...moduleProps("labor", laborRows, laborTotal)} />
      <TypeModule title="Products" addLabel="Add product" empty="No products" {...moduleProps("product", productRows, productTotal)} />
      {/* "No charges", not "No other charges" (Daniel, 2026-11-13). */}
      <TypeModule title="Other charges" addLabel="Add charge" empty="No charges" {...moduleProps("other", otherRows, otherTotal)} />
      <TypeModule title="Discounts" addLabel="Add discount" empty="No discounts" {...moduleProps("discount", discountRows, discountTotal)} />
      {/* Discounts can take it below zero — allowed for now (Daniel, 2026-11-03). */}
      <SubtotalModule subtotal={laborTotal + productTotal + otherTotal + discountTotal} />
      {/* Below the Subtotal; both stay (Daniel, 2026-11-14). */}
      {showProfitability && <ProfitabilityModule lines={lines} mobile={mobile} />}

      {/* The four SelectLists. A pick opens the type's form with the item as the template. */}
      <LaborRateSelectList
        open={listOpen === "labor"}
        onClose={() => setListOpen(null)}
        rates={laborRates}
        onSelect={(item) => openForm({ kind: "labor", item })}
        onAddLaborRate={onAddLaborRate}
        useTaxes={COMPANY.useTaxes}
        breakpoint={breakpoint}
      />
      <ProductSelectList
        open={listOpen === "product"}
        onClose={() => setListOpen(null)}
        products={PRODUCT_ITEMS}
        onSelect={(item) => openForm({ kind: "product", item })}
        onAddProduct={noop}
        breakpoint={breakpoint}
      />
      <OtherChargeSelectList
        open={listOpen === "other"}
        onClose={() => setListOpen(null)}
        charges={OTHER_ITEMS}
        onSelect={(item) => openForm({ kind: "other", item })}
        onAddCharge={noop}
        breakpoint={breakpoint}
      />
      <DiscountSelectList
        open={listOpen === "discount"}
        onClose={() => setListOpen(null)}
        discounts={DISCOUNT_ITEMS}
        onSelect={(item) => openForm({ kind: "discount", item })}
        onAddDiscount={noop}
        breakpoint={breakpoint}
      />

      {/* The four line forms: Cancel + "Add" ("Save" on an edit). */}
      {form?.kind === "labor" && (
        <LaborLineForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          job={job}
          rate={form.item}
          line={editing(lines.labor, (charge) => charge.labor)}
          onSubmit={(line) => commit("labor", form.item.name, { labor: line, laborRateId: form.item.id })}
          onOpenRate={() => setRatePanel(form.item)}
          breakpoint={breakpoint}
        />
      )}
      {form?.kind === "product" && (
        <ProductLineForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          job={job}
          product={form.item}
          line={editing(lines.products, (charge) => charge.product)}
          onSubmit={(line) => commit("product", form.item.name, { product: line, productId: form.item.id })}
          breakpoint={breakpoint}
        />
      )}
      {form?.kind === "other" && (
        <OtherLineForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          job={job}
          charge={form.item}
          line={editing(lines.other, (charge) => charge.other)}
          onSubmit={(line) => commit("other", form.item.name, { other: line, otherChargeId: form.item.id })}
          breakpoint={breakpoint}
        />
      )}
      {form?.kind === "discount" && (
        <DiscountLineForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          job={job}
          discount={form.item}
          line={editing(lines.discounts, (charge) => charge.discount)}
          onSubmit={(line) => commit("discount", form.item.name, { discount: line, discountId: form.item.id })}
          breakpoint={breakpoint}
        />
      )}

      {/* "Delete [type]?" — Figma 29387-53391 and its three siblings. */}
      {deleting != null && (
        <Prompt
          open={deleteOpen}
          title={`Delete ${NOUN[deleting.kind]}?`}
          body={`Are you sure you want to delete ${deleting.charge.title}?`}
          actionLabel="Delete"
          actionVariant="danger"
          actionIcon="trash-can"
          onAction={confirmDelete}
          onCancel={() => setDeleteOpen(false)}
          breakpoint={breakpoint}
        />
      )}

      {/* Pricebook, and "Click here" in a labor form's Cost help: the rate's side panel. */}
      {ratePanel != null && (
        <LaborRatePanel
          open
          onClose={() => setRatePanel(null)}
          rate={ratePanel}
          requireSubtypes={COMPANY.requireSubtypes}
          useTaxes={COMPANY.useTaxes}
          breakpoint={breakpoint}
        />
      )}
    </div>
  );
}
