import { ReactNode, useRef, useState } from "react";

import AvatarDiscount from "../../../components/Avatar/AvatarDiscount";
import AvatarLaborRate from "../../../components/Avatar/AvatarLaborRate";
import AvatarOther from "../../../components/Avatar/AvatarOther";
import AvatarProduct from "../../../components/Avatar/AvatarProduct";
import { Icon } from "../../../components/Icon/Icon";
import Button from "../../../components/Button/Button";
import IconButton from "../../../components/IconButton/IconButton";
import ItemTextBlock from "../../../components/ItemText/ItemText/ItemTextBlock";
import ListItem from "../../../components/ListItem/ListItem";
import ListItemSlotIcon from "../../../components/ListItem/ListItemSlotIcon";
import HoverTooltip from "../../../components/Tooltip/HoverTooltip";
import ValueDisplay from "../../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../../components/ValueDisplay/ValueDisplayGroup";
import { formatCurrency } from "../../../app/listData";
import {
  COMPANY,
  DISCOUNT_ITEMS,
  DISCOUNT_SUBTYPES,
  LABOR_ITEMS,
  INVENTORY_LOCATIONS,
  LABOR_SUBTYPES,
  OTHER_ITEMS,
  OTHER_SUBTYPES,
  PRODUCT_ITEMS,
  PRODUCT_SUBTYPES,
} from "../../../data/db";
import type { Charge, ChargeGroup, ChargeItem, Job, LaborItem, ProductItem } from "../../../data/db";
import { LOCATION_TYPE_ICON, locationTitle } from "../../Product/NewProductForm/InventoryLevelsField";
import LaborRateSelectList from "../../LaborRateSelectList/LaborRateSelectList";
import DiscountSelectList from "../../Discount/DiscountSelectList/DiscountSelectList";
import OtherChargeSelectList from "../../OtherCharge/OtherChargeSelectList/OtherChargeSelectList";
import ProductSelectList from "../../Product/ProductSelectList/ProductSelectList";
import { joinWithSeparator } from "../../../utils/textSeparator";
import LaborRatePanel from "../../LaborRatePanel/LaborRatePanel";
import { noop } from "../shared";

import { AttributionRows, discountAmount, laborAmount, negative, otherAmount, productAmount, serviceDates, subtypeName } from "./lineDisplay";

import DiscountLinePanel from "./LinePanels/DiscountLinePanel";
import LaborLinePanel from "./LinePanels/LaborLinePanel";
import { DeleteLinePrompt } from "./LinePanels/LinePanel";
import OtherLinePanel from "./LinePanels/OtherLinePanel";
import ProductLinePanel from "./LinePanels/ProductLinePanel";
import DiscountLineForm from "./LineForms/DiscountLineForm";
import LaborLineForm from "./LineForms/LaborLineForm";
import OtherLineForm from "./LineForms/OtherLineForm";
import ProductLineForm from "./LineForms/ProductLineForm";

import styles from "./chargeLines.module.scss";

// ---------------------------------------------------------------------------
// THE CHARGE LINES both Charges concepts share (2026-11-03, Daniel: "the same
// select lists, the same edit forms and the same objects — the only
// difference is the way the objects are organised").
//
// Every line is an accordion ListItem (collapsed by default): the header shows
// the line, the open body the Delete + Edit buttons and its details as a
// ValueDisplayGroup. Each type follows its own module doc —
// Labor rates 27405-35295, Products 27831-59168, Other charges 27937-65412,
// Discounts 27940-66676 — and every value is the LINE's own
// (db/jobCharges.ts), pre-filled from the pricebook item it was picked from.
//
// `useChargeLines` owns the lines and everything that changes them: a type's
// plus opens its SelectList, a pick opens its line form (LineForms/) with the
// item as the template — "Add" puts a new line in; a row's Edit opens the
// same form on the line — "Save"; Delete takes the line out, after the side
// panels' prompt, with their toast. The lines are
// state, so a story reload starts over. The SelectLists' footer actions
// ("Add labor rate", …) still only close the list.
//
// A concept only lays out what the hook hands back: per type its rows, count,
// total and plus, then the subtotal — and renders `overlays` once.
// ---------------------------------------------------------------------------

// One charge line. Edit opens the line's form; Delete removes the line.
/**
 * How a concept draws its lines (the only row difference between them):
 *   "accordion"  Concept 2 — the row opens to show Delete and Edit buttons, with
 *                its details under them.
 *   "clickable"  Concept 1 — a click opens the line's edit form; the row drags
 *                to reorder its group; a "Delete" IconButton sits on the right.
 *   "draggable"  Concept 3 — a click opens the line's side panel; it drags like
 *                Concept 1's, with a chevron on the right.
 */
export type ChargeRowStyle = "accordion" | "clickable" | "draggable";

interface ChargeLineRowProps {
  title: string;
  caption?: string;
  /** The type's object avatar (xl), as the Figma rows draw it. */
  avatar: ReactNode;
  right: ReactNode;
  mobile: boolean;
  defaultOpen: boolean;
  rowStyle: ChargeRowStyle;
  /** "clickable" / "draggable" rows: the group has 2+ lines, so the row drags. */
  draggable: boolean;
  /** "draggable" rows: a click opens the line's side panel (Concept 3). */
  onOpen?: () => void;
  /** The lifted copy of a dragged row — see `LineItemProps.isDragging`. */
  isDragging?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  /** No Edit, no Delete, no click — a finalized or cancelled job. */
  readOnly?: boolean;
  /** The details — only an accordion row shows them. */
  children: ReactNode;
}

function ChargeLineRow(props: ChargeLineRowProps) {
  if (props.rowStyle === "accordion") return <AccordionRow {...props} />;
  return props.rowStyle === "clickable" ? <ClickableRow {...props} /> : <DraggableRow {...props} />;
}

// Concept 3's row: static, a chevron on the right (Figma 27942-67998), and
// draggable when its type holds 2+ lines.
function DraggableRow({ title, caption, avatar, right, draggable, isDragging, onOpen }: ChargeLineRowProps) {
  const row = {
    variant: caption != null ? ("titleCaption" as const) : ("title" as const),
    title,
    caption,
    avatar,
    right,
    slotRight: <ListItemSlotIcon icon="angle-right" />,
  };
  if (onOpen != null) {
    const clickable = { ...row, isClickable: true as const, onClick: onOpen };
    return draggable ? <ListItem {...clickable} isDraggable isDragging={isDragging} /> : <ListItem {...clickable} />;
  }
  return draggable ? <ListItem {...row} isDraggable isDragging={isDragging} /> : <ListItem {...row} />;
}

// Concept 1's row: clickable (opens the edit form), draggable, with a Delete
// IconButton. Read-only, it is a plain static row.
function ClickableRow({ title, caption, avatar, right, draggable, isDragging, onEdit, onDelete, readOnly = false }: ChargeLineRowProps) {
  const common = {
    variant: caption != null ? ("titleCaption" as const) : ("title" as const),
    title,
    caption,
    avatar,
    right,
  };
  if (readOnly) return <ListItem {...common} />;
  const clickable = {
    ...common,
    isClickable: true as const,
    onClick: onEdit,
    slotRight: (
      <HoverTooltip text="Delete">
        <IconButton icon="trash-can" variant="ghost" size="md" aria-label="Delete" onClick={onDelete} />
      </HoverTooltip>
    ),
  };
  return draggable ? <ListItem {...clickable} isDraggable isDragging={isDragging} /> : <ListItem {...clickable} />;
}

// Concept 2's row: an accordion (Figma 27415-88160). The open body holds Edit
// (filling) + a Delete IconButton (its icon in the error color), then the details
// 16px below them.
function AccordionRow({ title, caption, avatar, right, defaultOpen, onEdit, onDelete, readOnly = false, children }: ChargeLineRowProps) {
  return (
    <ListItem
      isAccordion
      defaultOpen={defaultOpen}
      variant={caption != null ? "titleCaption" : "title"}
      title={title}
      caption={caption}
      avatar={avatar}
      right={right}
    >
      <div className={styles.lineBody}>
        {!readOnly && (
          <div className={styles.lineActions}>
            <Button size="lg" variant="subtle" leftIcon="pen" isFullWidth onClick={onEdit}>
              Edit
            </Button>
            <HoverTooltip text="Delete">
              <IconButton icon="trash-can" variant="subtle" size="lg" aria-label="Delete" className={styles.deleteButton} onClick={onDelete} />
            </HoverTooltip>
          </div>
        )}
        {children}
      </div>
    </ListItem>
  );
}

interface LineItemProps {
  job: Job;
  charge: Charge;
  mobile: boolean;
  defaultOpen: boolean;
  readOnly: boolean;
  rowStyle: ChargeRowStyle;
  draggable: boolean;
  /**
   * ItemGroup clones its DIRECT child for the lifted drag copy and injects this
   * prop, so a row wrapper has to pass it down to the ListItem — without it the
   * copy keeps the resting look (no card, no shadow, the grip icon).
   */
  isDragging?: boolean;
  /** "draggable" rows: a click opens the line. */
  onOpen?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// LABOR RATES — built to the module doc (Figma 27405-35295, 2026-10-31).
// Every value is the LINE's own (Charge.labor), never re-read off the rate.
function LaborLineItem({ job, charge, mobile, defaultOpen, readOnly, rowStyle, draggable, isDragging, onOpen, onEdit, onDelete }: LineItemProps) {
  const labor = charge.labor!;
  const hourly = labor.type === "hourly";
  const perHour = (n: number) => (hourly ? `${formatCurrency(n)}/hr` : formatCurrency(n));
  const dates = serviceDates(labor);

  return (
    <ChargeLineRow
      title={charge.title}
      avatar={<AvatarLaborRate size="xl" />}
      onOpen={onOpen}
      onEdit={onEdit}
      onDelete={onDelete}
      readOnly={readOnly}
      rowStyle={rowStyle}
      draggable={draggable}
      isDragging={isDragging}
      caption={dates.text}
      mobile={mobile}
      defaultOpen={defaultOpen}
      // Hourly: the Amount over "Price × Hours". Flat: the Price alone.
      right={
        hourly ? (
          <ItemTextBlock
            align="right"
            variant="titleCaption"
            title={formatCurrency(laborAmount(labor))}
            caption={`${perHour(labor.price)} × ${labor.hours} hr`}
          />
        ) : (
          <ItemTextBlock align="right" variant="title" title={formatCurrency(labor.price)} />
        )
      }
    >
      <ValueDisplayGroup>
        {/* The demo company has subtypes enabled, so the row always shows. */}
        <ValueDisplay label="Subtype" value={subtypeName(LABOR_SUBTYPES, labor.subtypeId)} />
        <ValueDisplay label={dates.plural ? "Service dates" : "Service date"} value={dates.text} />
        <ValueDisplay label="Type" value={hourly ? "Hourly" : "Flat"} />
        <ValueDisplay label="Cost" value={perHour(labor.cost)} />
        <ValueDisplay label="Price" value={perHour(labor.price)} />
        {hourly && <ValueDisplay label="Hours" value={`${labor.hours} hr`} />}
        {hourly && <ValueDisplay label="Amount" value={formatCurrency(laborAmount(labor))} />}
        <AttributionRows job={job} equipmentId={labor.equipmentId} technicianId={labor.technicianId} />
        <ValueDisplay label="Description" orientation="vertical" value={labor.description} lineLimit={4} />
      </ValueDisplayGroup>
    </ChargeLineRow>
  );
}

// PRODUCTS — built to the module doc (Figma 27831-59168, 2026-11-03).
// Every value is the LINE's own (Charge.product).

function ProductLineItem({ job, charge, mobile, defaultOpen, readOnly, rowStyle, draggable, isDragging, onOpen, onEdit, onDelete }: LineItemProps) {
  const product = charge.product!;
  const photo = PRODUCT_ITEMS.find((row) => row.id === charge.productId)?.imageUrl;
  const location = product.inventoryLocationId != null ? INVENTORY_LOCATIONS.find((row) => row.id === product.inventoryLocationId) : undefined;

  return (
    <ChargeLineRow
      title={charge.title}
      // The product's photo when it has one, like the Products list, else the icon.
      avatar={photo != null ? <AvatarProduct size="xl" content="image" imageSrc={photo} /> : <AvatarProduct size="xl" />}
      onOpen={onOpen}
      onEdit={onEdit}
      onDelete={onDelete}
      readOnly={readOnly}
      rowStyle={rowStyle}
      draggable={draggable}
      isDragging={isDragging}
      // "No Manufacturer" / "No Part #" for a missing part, like the Products list.
      caption={joinWithSeparator(product.manufacturer || "No Manufacturer", product.partNumber || "No Part #")}
      mobile={mobile}
      defaultOpen={defaultOpen}
      right={
        <ItemTextBlock
          align="right"
          variant="titleCaption"
          title={formatCurrency(productAmount(product))}
          caption={`${formatCurrency(product.price)} × ${product.quantity}`}
        />
      }
    >
      <ValueDisplayGroup>
        <ValueDisplay label="Manufacturer" value={product.manufacturer} />
        <ValueDisplay label="Part #" value={product.partNumber} />
        {/* The demo company has subtypes enabled, so the row always shows. */}
        <ValueDisplay label="Subtype" value={subtypeName(PRODUCT_SUBTYPES, product.subtypeId)} />
        {/* Only a product tracked in inventory has a location. */}
        {location != null && (
          <ValueDisplay label="Inventory" value={locationTitle(location)} slotLeft={<Icon icon={LOCATION_TYPE_ICON[location.type]} size={14} />} />
        )}
        <ValueDisplay label="Cost" value={formatCurrency(product.cost)} />
        <ValueDisplay label="Price" value={formatCurrency(product.price)} />
        <ValueDisplay label="Quantity" value={String(product.quantity)} />
        <ValueDisplay label="Amount" value={formatCurrency(productAmount(product))} />
        <AttributionRows job={job} equipmentId={product.equipmentId} technicianId={product.technicianId} />
        <ValueDisplay label="Description" orientation="vertical" value={product.description} lineLimit={4} />
      </ValueDisplayGroup>
    </ChargeLineRow>
  );
}

// OTHER CHARGES — built to the module doc (Figma 27937-65412, 2026-11-03).
// Every value is the LINE's own (Charge.other). No caption under the name: a
// charge has no date, manufacturer or part #.

function OtherLineItem({ job, charge, mobile, defaultOpen, readOnly, rowStyle, draggable, isDragging, onOpen, onEdit, onDelete }: LineItemProps) {
  const other = charge.other!;
  return (
    <ChargeLineRow
      title={charge.title}
      avatar={<AvatarOther size="xl" />}
      onOpen={onOpen}
      onEdit={onEdit}
      onDelete={onDelete}
      readOnly={readOnly}
      rowStyle={rowStyle}
      draggable={draggable}
      isDragging={isDragging}
      mobile={mobile}
      defaultOpen={defaultOpen}
      right={
        <ItemTextBlock
          align="right"
          variant="titleCaption"
          title={formatCurrency(otherAmount(other))}
          caption={`${formatCurrency(other.price)} × ${other.quantity}`}
        />
      }
    >
      <ValueDisplayGroup>
        {/* The demo company has subtypes enabled, so the row always shows. */}
        <ValueDisplay label="Subtype" value={subtypeName(OTHER_SUBTYPES, other.subtypeId)} />
        <ValueDisplay label="Cost" value={formatCurrency(other.cost)} />
        <ValueDisplay label="Price" value={formatCurrency(other.price)} />
        <ValueDisplay label="Quantity" value={String(other.quantity)} />
        <ValueDisplay label="Amount" value={formatCurrency(otherAmount(other))} />
        <AttributionRows job={job} equipmentId={other.equipmentId} technicianId={other.technicianId} />
        <ValueDisplay label="Description" orientation="vertical" value={other.description} lineLimit={4} />
      </ValueDisplayGroup>
    </ChargeLineRow>
  );
}

// ---- the parts ----------------------------------------------------------------

// DISCOUNTS — built to the module doc (Figma 27940-66676, 2026-11-03). A
// discount is a fixed amount with no cost; the line stores it positive and
// every place shows it with the true minus sign. Zero is allowed, and reads
// "$0.00" — zero has no sign.

function DiscountLineItem({ job, charge, mobile, defaultOpen, readOnly, rowStyle, draggable, isDragging, onOpen, onEdit, onDelete }: LineItemProps) {
  const discount = charge.discount!;
  const perUnit = formatCurrency(negative(discount.discount));
  return (
    <ChargeLineRow
      title={charge.title}
      avatar={<AvatarDiscount size="xl" />}
      onOpen={onOpen}
      onEdit={onEdit}
      onDelete={onDelete}
      readOnly={readOnly}
      rowStyle={rowStyle}
      draggable={draggable}
      isDragging={isDragging}
      mobile={mobile}
      defaultOpen={defaultOpen}
      right={
        <ItemTextBlock
          align="right"
          variant="titleCaption"
          title={formatCurrency(discountAmount(discount))}
          // The node draws the unit WITHOUT a minus ("$150.00 × 1") under "−$150.00".
          caption={`${formatCurrency(discount.discount)} × ${discount.quantity}`}
        />
      }
    >
      <ValueDisplayGroup>
        {/* The demo company has subtypes enabled, so the row always shows. */}
        <ValueDisplay label="Subtype" value={subtypeName(DISCOUNT_SUBTYPES, discount.subtypeId)} />
        <ValueDisplay label="Discount" value={perUnit} />
        <ValueDisplay label="Quantity" value={String(discount.quantity)} />
        <ValueDisplay label="Amount" value={formatCurrency(discountAmount(discount))} />
        <AttributionRows job={job} equipmentId={discount.equipmentId} technicianId={discount.technicianId} />
        <ValueDisplay label="Description" orientation="vertical" value={discount.description} lineLimit={4} />
      </ValueDisplayGroup>
    </ChargeLineRow>
  );
}

/** Which line form is open — the pricebook item and, on an edit, the line. */
type LineForm =
  | { kind: "labor"; item: LaborItem; chargeId?: string }
  | { kind: "product"; item: ProductItem; chargeId?: string }
  | { kind: "other"; item: ChargeItem; chargeId?: string }
  | { kind: "discount"; item: ChargeItem; chargeId?: string };

let nextLineId = 0;
/** A new line the forms hand back, as the module's Charge. */
export const newCharge = (title: string, line: Partial<Charge>): Charge => ({
  id: `new-${++nextLineId}`,
  title,
  caption: "",
  total: "",
  unit: "",
  ...line,
});

export interface ChargeLinesOptions {
  /** The job the charges belong to — its date, equipment and assignees. */
  job: Job;
  /** The job's charge groups (db/jobCharges). */
  groups: ChargeGroup[];
  /** The job's discount lines (db/jobCharges `discountsOf`). Default none. */
  discounts?: Charge[];
  /** Every line is "Collapsed by default" (the module docs); true opens them. */
  linesOpen?: boolean;
  /** Mobile: menus, lists and forms are drawers. */
  mobile?: boolean;
  /** Finalized / Cancelled job: no plus, no row menu or Delete. */
  readOnly?: boolean;
  /** How the rows look and act — see `ChargeRowStyle`. Default "accordion". */
  rowStyle?: ChargeRowStyle;
}

/** One charge type as a concept lays it out. */
export interface ChargeTypeView {
  kind: "labor" | "product" | "other" | "discount";
  title: string;
  addLabel: string;
  empty: string;
  count: number;
  total: number;
  /** The type's line rows. */
  items: ReactNode[];
  /** The plus — opens the type's SelectList. */
  onAdd: () => void;
  /** "clickable" / "draggable" rows only, with 2+ lines: move a line within its group. */
  onReorder?: (from: number, to: number) => void;
}

export function useChargeLines({ job, groups, discounts = [], linesOpen = false, mobile = false, readOnly = false, rowStyle = "accordion" }: ChargeLinesOptions) {
  const itemsOf = (key: string) => groups.find((group) => group.key === key)?.items ?? [];
  // The lines live HERE (2026-11-03): Add puts a new one in, Save replaces it,
  // Delete takes it out — in the story only, so a reload starts over.
  const [labor, setLabor] = useState(() => itemsOf("labor").filter((charge) => charge.labor != null));
  const [products, setProducts] = useState(() => itemsOf("products").filter((charge) => charge.product != null));
  const [other, setOther] = useState(() => itemsOf("other").filter((charge) => charge.other != null));
  const [discountLines, setDiscountLines] = useState(() => discounts.filter((charge) => charge.discount != null));

  const laborTotal = labor.reduce((acc, charge) => acc + laborAmount(charge.labor!), 0);
  const productTotal = products.reduce((acc, charge) => acc + productAmount(charge.product!), 0);
  const otherTotal = other.reduce((acc, charge) => acc + otherAmount(charge.other!), 0);
  const discountTotal = discountLines.reduce((acc, charge) => acc + discountAmount(charge.discount!), 0);
  // Discounts can take it below zero — allowed for now (Daniel, 2026-11-03).
  const subtotal = laborTotal + productTotal + otherTotal + discountTotal;

  // Each plus opens its type's SelectList; a pick opens the type's form with
  // the item as the template ("Add"). A row's Edit opens it on the line ("Save").
  const [listOpen, setListOpen] = useState<LineForm["kind"] | null>(null);
  const [form, setForm] = useState<LineForm | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const openForm = (next: LineForm) => {
    setForm(next);
    setFormOpen(true);
  };
  const closeForm = () => setFormOpen(false);
  // Concept 3: a row opens its line's side panel (LinePanels/).
  const [panelChargeId, setPanelChargeId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const openPanel = (id: string) =>
    rowStyle === "draggable"
      ? () => {
          setPanelChargeId(id);
          setPanelOpen(true);
        }
      : undefined;
  // Kept after a Delete, so the panel can play its closing animation.
  const lastPanelCharge = useRef<Charge | undefined>(undefined);
  lastPanelCharge.current = [...labor, ...products, ...other, ...discountLines].find((charge) => charge.id === panelChargeId) ?? lastPanelCharge.current;
  const panelCharge = lastPanelCharge.current;
  const panelProps = {
    open: panelOpen,
    onClose: () => setPanelOpen(false),
    job,
    title: panelCharge?.title ?? "",
    breakpoint: mobile ? ("mobile" as const) : ("desktop" as const),
  };
  /** A panel's edit, put back on its line. */
  const patchPanelLine = (setList: (update: (list: Charge[]) => Charge[]) => void, patch: Partial<Charge>) =>
    setList((list) => list.map((charge) => (charge.id === panelCharge?.id ? { ...charge, ...patch } : charge)));
  /** A panel's Delete: the panel closes and the line goes. */
  const deletePanelLine = (setList: (update: (list: Charge[]) => Charge[]) => void) => {
    setPanelOpen(false);
    if (panelCharge != null) setList((list) => list.filter((charge) => charge.id !== panelCharge.id));
  };
  const panelRate = LABOR_ITEMS.find((row) => row.id === panelCharge?.laborRateId);
  const panelProduct = PRODUCT_ITEMS.find((row) => row.id === panelCharge?.productId);
  const panelOther = OTHER_ITEMS.find((row) => row.id === panelCharge?.otherChargeId);
  const panelDiscount = DISCOUNT_ITEMS.find((row) => row.id === panelCharge?.discountId);
  // "Click here" in a labor rate's Cost help text — the rate's side panel, above the form.
  const [ratePanel, setRatePanel] = useState<LaborItem | null>(null);

  const editing = <T,>(list: Charge[], pick: (charge: Charge) => T | undefined) =>
    form?.chargeId == null ? null : (pick(list.find((charge) => charge.id === form.chargeId)!) ?? null);
  /** Add a new line, or put the edited one back in its place. */
  const commit = (setList: (update: (list: Charge[]) => Charge[]) => void, title: string, patch: Partial<Charge>) =>
    setList((list) =>
      form?.chargeId == null
        ? [...list, newCharge(title, patch)]
        : list.map((charge) => (charge.id === form.chargeId ? { ...charge, ...patch } : charge)),
    );
  const remove = (setList: (update: (list: Charge[]) => Charge[]) => void, id: string) =>
    setList((list) => list.filter((charge) => charge.id !== id));
  // A row's Delete asks first. Kept after the answer, so the prompt can play
  // its closing animation with its text in place.
  const [deleting, setDeleting] = useState<{ noun: string; title: string; onConfirm: () => void } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteLine = (setList: (update: (list: Charge[]) => Charge[]) => void, charge: Charge, noun: string) => () => {
    setDeleting({ noun, title: charge.title, onConfirm: () => remove(setList, charge.id) });
    setDeleteOpen(true);
  };

  const breakpoint = mobile ? "mobile" : "desktop";

  // Concepts 1 and 3 drag a line within its group — only with 2+ lines (Daniel's
  // rule: a single row has nothing to reorder) and never read-only.
  const canReorder = (list: Charge[]) => rowStyle !== "accordion" && !readOnly && list.length > 1;
  const reorder = (setList: (update: (list: Charge[]) => Charge[]) => void) => (from: number, to: number) =>
    setList((list) => {
      const next = [...list];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  const types: ChargeTypeView[] = [
    {
      kind: "labor",
      title: "Labor rates",
      addLabel: "Add labor rate",
      empty: "No labor rates",
      count: labor.length,
      total: laborTotal,
      onAdd: () => setListOpen("labor"),
      onReorder: canReorder(labor) ? reorder(setLabor) : undefined,
      items: labor.map((charge) => {
        const item = LABOR_ITEMS.find((row) => row.id === charge.laborRateId);
        return (
          <LaborLineItem
            key={charge.id}
            job={job}
            charge={charge}
            mobile={mobile}
            defaultOpen={linesOpen}
            readOnly={readOnly}
            rowStyle={rowStyle}
            draggable={canReorder(labor)}
            onOpen={openPanel(charge.id)}
            onEdit={() => item != null && openForm({ kind: "labor", item, chargeId: charge.id })}
            onDelete={deleteLine(setLabor, charge, "labor rate")}
          />
        );
      }),
    },
    {
      kind: "product",
      title: "Products",
      addLabel: "Add product",
      empty: "No products",
      count: products.length,
      total: productTotal,
      onAdd: () => setListOpen("product"),
      onReorder: canReorder(products) ? reorder(setProducts) : undefined,
      items: products.map((charge) => {
        const item = PRODUCT_ITEMS.find((row) => row.id === charge.productId);
        return (
          <ProductLineItem
            key={charge.id}
            job={job}
            charge={charge}
            mobile={mobile}
            defaultOpen={linesOpen}
            readOnly={readOnly}
            rowStyle={rowStyle}
            draggable={canReorder(products)}
            onOpen={openPanel(charge.id)}
              onEdit={() => item != null && openForm({ kind: "product", item, chargeId: charge.id })}
            onDelete={deleteLine(setProducts, charge, "product")}
          />
        );
      }),
    },
    {
      kind: "other",
      title: "Other charges",
      addLabel: "Add other charge",
      empty: "No charges",
      count: other.length,
      total: otherTotal,
      onAdd: () => setListOpen("other"),
      onReorder: canReorder(other) ? reorder(setOther) : undefined,
      items: other.map((charge) => {
        const item = OTHER_ITEMS.find((row) => row.id === charge.otherChargeId);
        return (
          <OtherLineItem
            key={charge.id}
            job={job}
            charge={charge}
            mobile={mobile}
            defaultOpen={linesOpen}
            readOnly={readOnly}
            rowStyle={rowStyle}
            draggable={canReorder(other)}
            onOpen={openPanel(charge.id)}
              onEdit={() => item != null && openForm({ kind: "other", item, chargeId: charge.id })}
            onDelete={deleteLine(setOther, charge, "charge")}
          />
        );
      }),
    },
    {
      kind: "discount",
      title: "Discounts",
      addLabel: "Add discount",
      empty: "No discounts",
      count: discountLines.length,
      total: discountTotal,
      onAdd: () => setListOpen("discount"),
      onReorder: canReorder(discountLines) ? reorder(setDiscountLines) : undefined,
      items: discountLines.map((charge) => {
        const item = DISCOUNT_ITEMS.find((row) => row.id === charge.discountId);
        return (
          <DiscountLineItem
            key={charge.id}
            job={job}
            charge={charge}
            mobile={mobile}
            defaultOpen={linesOpen}
            readOnly={readOnly}
            rowStyle={rowStyle}
            draggable={canReorder(discountLines)}
            onOpen={openPanel(charge.id)}
              onEdit={() => item != null && openForm({ kind: "discount", item, chargeId: charge.id })}
            onDelete={deleteLine(setDiscountLines, charge, "discount")}
          />
        );
      }),
    },
  ];

  const overlays = (
    <>
      {/* The four SelectLists. A footer action ("Add labor rate", …) only closes its list. */}
      <LaborRateSelectList
        open={listOpen === "labor"}
        onClose={() => setListOpen(null)}
        rates={LABOR_ITEMS}
        onSelect={(item) => openForm({ kind: "labor", item })}
        onAddLaborRate={noop}
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

      {/* The four line forms (LineForms/). Cancel closes everything. */}
      {form?.kind === "labor" && (
        <LaborLineForm
          open={formOpen}
          onClose={closeForm}
          job={job}
          rate={form.item}
          line={editing(labor, (charge) => charge.labor)}
          onSubmit={(line) =>
            commit(setLabor, form.item.name, {
              labor: line,
              laborRateId: form.item.id,
            })
          }
          onOpenRate={() => setRatePanel(form.item)}
          breakpoint={breakpoint}
        />
      )}
      {form?.kind === "product" && (
        <ProductLineForm
          open={formOpen}
          onClose={closeForm}
          job={job}
          product={form.item}
          line={editing(products, (charge) => charge.product)}
          onSubmit={(line) =>
            commit(setProducts, form.item.name, {
              product: line,
              productId: form.item.id,
            })
          }
          breakpoint={breakpoint}
        />
      )}
      {form?.kind === "other" && (
        <OtherLineForm
          open={formOpen}
          onClose={closeForm}
          job={job}
          charge={form.item}
          line={editing(other, (charge) => charge.other)}
          onSubmit={(line) =>
            commit(setOther, form.item.name, {
              other: line,
              otherChargeId: form.item.id,
            })
          }
          breakpoint={breakpoint}
        />
      )}
      {form?.kind === "discount" && (
        <DiscountLineForm
          open={formOpen}
          onClose={closeForm}
          job={job}
          discount={form.item}
          line={editing(discountLines, (charge) => charge.discount)}
          onSubmit={(line) =>
            commit(setDiscountLines, form.item.name, {
              discount: line,
              discountId: form.item.id,
            })
          }
          breakpoint={breakpoint}
        />
      )}
      {/* The line's side panel — the type's own, on the line that was clicked. */}
      {panelCharge?.labor != null && panelRate != null && (
        <LaborLinePanel
          {...panelProps}
          rate={panelRate}
          line={panelCharge.labor}
          onChange={(line) => patchPanelLine(setLabor, { labor: line })}
          onDelete={() => deletePanelLine(setLabor)}
          onOpenRate={() => setRatePanel(panelRate)}
        />
      )}
      {panelCharge?.product != null && panelProduct != null && (
        <ProductLinePanel
          {...panelProps}
          product={panelProduct}
          line={panelCharge.product}
          onChange={(line) => patchPanelLine(setProducts, { product: line })}
          onDelete={() => deletePanelLine(setProducts)}
        />
      )}
      {panelCharge?.other != null && panelOther != null && (
        <OtherLinePanel
          {...panelProps}
          charge={panelOther}
          line={panelCharge.other}
          onChange={(line) => patchPanelLine(setOther, { other: line })}
          onDelete={() => deletePanelLine(setOther)}
        />
      )}
      {panelCharge?.discount != null && panelDiscount != null && (
        <DiscountLinePanel
          {...panelProps}
          discount={panelDiscount}
          line={panelCharge.discount}
          onChange={(line) => patchPanelLine(setDiscountLines, { discount: line })}
          onDelete={() => deletePanelLine(setDiscountLines)}
        />
      )}
      {deleting != null && (
        <DeleteLinePrompt
          open={deleteOpen}
          noun={deleting.noun}
          title={deleting.title}
          onConfirm={() => {
            setDeleteOpen(false);
            deleting.onConfirm();
          }}
          onCancel={() => setDeleteOpen(false)}
          breakpoint={breakpoint}
        />
      )}
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
    </>
  );

  return { types, subtotal, overlays };
}
