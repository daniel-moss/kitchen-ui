import { ReactNode, useState } from "react";
import clsx from "clsx";

import AvatarDiscount from "../../components/Avatar/AvatarDiscount";
import AvatarLaborRate from "../../components/Avatar/AvatarLaborRate";
import AvatarOther from "../../components/Avatar/AvatarOther";
import AvatarProduct from "../../components/Avatar/AvatarProduct";
import Counter from "../../components/Counter/Counter";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import { Divider } from "../../components/Divider/Divider";
import EmptyState from "../../components/EmptyState/EmptyState";
import GroupLabel from "../../components/GroupLabel/GroupLabel";
import IconButton from "../../components/IconButton/IconButton";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import ItemTextBlock from "../../components/ItemText/ItemText/ItemTextBlock";
import ListItem from "../../components/ListItem/ListItem";
import MenuItem from "../../components/Menu/MenuItem";
import SelectList from "../../components/SelectList/SelectList";
import SelectListFooter from "../../components/SelectList/SelectListFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import { LABOR_ITEMS, TODAY } from "../../data/db";
import type { LaborItem } from "../../data/db/types";
import { Equipment } from "./equipment";
import LaborRateLineForm, { LaborRateLine } from "./LaborRateLineForm";
import { noop, slot } from "./shared";

import styles from "./ChargesTab.module.scss";

// ---------------------------------------------------------------------------
// The "Summary" tab's Charges segment (Figma "Job Details" Page — Next Update,
// desktop 23825-12772 / mobile 24161-53121). It is NOT a tab of its own: the
// Summary tab (Tech work / Charges / Signature) stays (Daniel, 2026-10-21).
//
// ONE module, "Charges", with FOUR groups that are ALWAYS shown — Labor rates,
// Products, Other charges, Discounts — each with an "No …" empty state when it
// holds nothing (Figma 27083-29090). The Profitability / Technician
// utilization modules are left out until Daniel brings them back.
//
// Only the Labor rates plus is wired (Figma 27083-30216 → 27083-33173): it
// opens the pricebook's labor rates, and a picked rate opens the line-item
// dialog with the rate as a TEMPLATE. The other three pluses are inert.
//
// A labor rate LINE is not the pricebook rate — only a copy of its values
// (Daniel, 2026-10-22). So a row opens the same line-item dialog the list
// opens, on that line's values, never the "Labor rate" side panel.
//
// The lines come from the JOB (db/jobCharges.ts); the labour ones are turned
// into full lines here, with their pricebook rate as the template.
// ---------------------------------------------------------------------------

// The line-item shapes live with the data (db/jobCharges.ts) — re-exported
// here so the components that already import them from this file still can.
export type { Charge, ChargeGroup } from "../../data/db";
import type { Charge, ChargeGroup } from "../../data/db";

export interface ChargesTabProps {
  /** The job's charge groups (db/jobCharges). */
  groups: ChargeGroup[];
  /**
   * The pricebook's labor rates the plus lists. Only CONFIRMED, active ones
   * are offered. Defaults to the database; the app passes its store, so a rate
   * created a moment ago is in the list.
   */
  laborRates?: LaborItem[];
  /** The job's equipment — the line-item dialog's "Equipment attribution". */
  jobEquipment?: Equipment[];
  /** "Add labor rate" / `Add "…" to Pricebook` — the "New labor rate" form. */
  onAddLaborRate?: () => void;
  mobile?: boolean;
}

const money = (n: number) => `$${n.toFixed(2)}`;
const amountOf = (items: Charge[]) => items.reduce((acc, item) => acc + Number(item.total.slice(1)), 0);

/** A labor line with its row id. */
interface LaborEntry {
  id: string;
  line: LaborRateLine;
}

// A line, in the shape jobCharges.ts writes its own lines in.
const chargeOf = ({ id, line }: LaborEntry): Charge => ({
  id,
  title: line.name,
  caption: line.description,
  total: money(line.rate * line.hours),
  unit: line.rateType === "hourly" ? `${money(line.rate)} x ${line.hours} hr` : `${money(line.rate)} x 1`,
  laborRateId: line.laborRateId,
});

interface GroupProps {
  label: string;
  /** The plus button's tooltip (Figma 27083-29746). */
  addLabel: string;
  onAdd?: () => void;
  empty: string;
  avatar: ReactNode;
  items: Charge[];
  onReorder?: (items: Charge[]) => void;
  onOpen?: (item: Charge) => void;
  isLast?: boolean;
}

// One charges group: an open accordion with a plus, its rows or its empty
// state. Drag reorder is on only when the group holds more than one line
// (Daniel's rule) — a single row has nothing to reorder.
function ChargesGroup({ label, addLabel, onAdd = noop, empty, avatar, items, onReorder, onOpen, isLast = false }: GroupProps) {
  const draggable = items.length > 1 && onReorder != null;
  const reorder = (from: number, to: number) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder?.(next);
  };

  return (
    <ItemGroup
      label={
        <GroupLabel
          variant="primary"
          label={label}
          // The empty node shows no amount — a "$0.00" there says nothing.
          caption={items.length > 0 ? money(amountOf(items)) : undefined}
          slotRight={
            <HoverTooltip text={addLabel}>
              <IconButton icon="plus" variant="ghost" size="md" aria-label={addLabel} onClick={onAdd} />
            </HoverTooltip>
          }
        />
      }
      isAccordion
      defaultOpen
      divider={!isLast}
      onReorder={draggable ? reorder : undefined}
    >
      {items.length === 0 ? (
        <EmptyState caption={empty} />
      ) : (
        items.map((item) => {
          const common = {
            isClickable: true as const,
            onClick: () => onOpen?.(item),
            variant: "titleCaption" as const,
            title: item.title,
            caption: item.caption,
            captionLines: 1 as const,
            avatar,
            right: <ItemTextBlock align="right" variant="titleCaption" title={item.total} caption={item.unit} />,
            slotRight: <IconButton icon="ellipsis" variant="ghost" size="md" aria-label="More actions" onClick={noop} />,
          };
          return draggable ? <ListItem key={item.id} {...common} isDraggable /> : <ListItem key={item.id} {...common} />;
        })
      )}
    </ItemGroup>
  );
}

// A database labour line as a full line: its pricebook rate fills in what the
// charge does not carry, and an hourly line's hours come back from its total.
const entryOf = (charge: Charge, rates: LaborItem[]): LaborEntry => {
  const rate = rates.find((row) => row.id === charge.laborRateId);
  const price = rate?.rate ?? Number(charge.total.slice(1));
  const hourly = rate?.unitType === "hourly";
  return {
    id: charge.id,
    line: {
      laborRateId: charge.laborRateId ?? "",
      name: charge.title,
      subtypeId: rate?.subtypeId ?? null,
      startDate: TODAY,
      endDate: TODAY,
      rateType: hourly ? "hourly" : "flat",
      cost: rate?.cost ?? 0,
      rate: price,
      hours: hourly && price > 0 ? Number(charge.total.slice(1)) / price : 1,
      description: charge.caption,
      technicianId: null,
      equipmentId: null,
    },
  };
};

export default function ChargesTab({
  groups,
  laborRates = LABOR_ITEMS,
  jobEquipment,
  onAddLaborRate = noop,
  mobile = false,
}: ChargesTabProps) {
  const itemsOf = (key: string) => groups.find((group) => group.key === key)?.items ?? [];
  const [laborEntries, setLaborEntries] = useState(() => itemsOf("labor").map((charge) => entryOf(charge, laborRates)));
  const labor = laborEntries.map(chargeOf);
  const [products, setProducts] = useState(() => itemsOf("products"));
  const [other, setOther] = useState(() => itemsOf("other"));
  const discounts: Charge[] = [];

  const count = labor.length + products.length + other.length + discounts.length;
  const subtotal = amountOf(labor) + amountOf(products) + amountOf(other) + amountOf(discounts);

  // The plus → the rates list → the line-item dialog; a row → the same
  // dialog on that line.
  const [listOpen, setListOpen] = useState(false);
  const [template, setTemplate] = useState<LaborItem | null>(null);
  const [editing, setEditing] = useState<LaborEntry | null>(null);
  const [lineOpen, setLineOpen] = useState(false);
  const [addedCount, setAddedCount] = useState(0);
  const breakpoint = mobile ? "mobile" : "desktop";

  // "Confirmed labor rates only. Sorted by name from A to Z."
  const confirmed = laborRates
    .filter((rate) => rate.isActive && rate.status === "active")
    .sort((a, b) => a.name.localeCompare(b.name));

  // Both ways out to the pricebook close the list first — the form is a
  // dialog of its own.
  const toPricebook = () => {
    setListOpen(false);
    onAddLaborRate();
  };

  return (
    <>
      <DisplayModule
        title="Charges"
        titleSlotRight={count > 0 ? <Counter value={count} /> : undefined}
        bodyPadded={false}
        content={
          <div className={styles.body}>
            <ChargesGroup
              label="Labor rates"
              addLabel="Add labor rate"
              onAdd={() => setListOpen(true)}
              empty="No labor rates"
              avatar={<AvatarLaborRate size="xl" />}
              items={labor}
              onReorder={(next) => setLaborEntries(next.map((charge) => laborEntries.find((entry) => entry.id === charge.id)!))}
              onOpen={(charge) => {
                setTemplate(null);
                setEditing(laborEntries.find((entry) => entry.id === charge.id) ?? null);
                setLineOpen(true);
              }}
            />
            <ChargesGroup
              label="Products"
              addLabel="Add product"
              empty="No products"
              avatar={<AvatarProduct size="xl" />}
              items={products}
              onReorder={setProducts}
            />
            <ChargesGroup
              label="Other charges"
              addLabel="Add other charge"
              empty="No other charges"
              avatar={<AvatarOther size="xl" />}
              items={other}
              onReorder={setOther}
            />
            <ChargesGroup label="Discounts" addLabel="Add discount" empty="No discounts" avatar={<AvatarDiscount size="xl" />} items={discounts} isLast />

            {/* Footer (Figma): a medium divider, then the subtotal row. Nothing
                charged yet reads as a placeholder. */}
            <Divider contrast="medium" />
            <div className={styles.footer}>
              <span className={styles.footerLabel}>Subtotal (before tax)</span>
              <span className={clsx(styles.footerValue, subtotal === 0 && styles.footerValueEmpty)}>{money(subtotal)}</span>
            </div>
          </div>
        }
      />

      {/* "Labor rates" list (Figma 27083-30216): single-select; picking a rate
          closes the list and opens the line-item dialog. */}
      <SelectList
        variant="dialog"
        breakpoint={breakpoint}
        open={listOpen}
        onClose={() => setListOpen(false)}
        title="Labor rates"
        searchable={confirmed.length > 0}
        searchPlaceholder="Labor rate..."
        state={confirmed.length === 0 ? "empty" : "default"}
        emptyState={{ caption: "No labor rates" }}
        // No confirmed rates at all → the footer offers to make one.
        footer={
          confirmed.length === 0 ? (
            <SelectListFooter variant="menuItem">
              <MenuItem label="Add labor rate" slotLeft={slot("plus")} onClick={toPricebook} />
            </SelectListFooter>
          ) : undefined
        }
        // "If no labor rates match, the user is suggested to add a new one to
        // the pricebook."
        createFromSearch={{ label: (query) => `Add "${query}" to Pricebook`, onCreate: toPricebook }}
      >
        <SelectListItemGroup>
          {confirmed.map((rate) => (
            <SelectListItem
              key={rate.id}
              variant="object"
              avatar={<AvatarLaborRate size="xl" />}
              label={rate.name}
              caption={rate.summary !== "" ? rate.summary : undefined}
              captionPlaceholder="No description"
              onClick={() => {
                setListOpen(false);
                setEditing(null);
                setTemplate(rate);
                setLineOpen(true);
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectList>

      <LaborRateLineForm
        open={lineOpen}
        onClose={() => setLineOpen(false)}
        template={template}
        line={editing?.line}
        jobEquipment={jobEquipment}
        breakpoint={breakpoint}
        onSubmit={(line) => {
          if (editing != null) {
            setLaborEntries((prev) => prev.map((entry) => (entry.id === editing.id ? { id: entry.id, line } : entry)));
            return;
          }
          setLaborEntries((prev) => [...prev, { id: `added-${addedCount}`, line }]);
          setAddedCount((n) => n + 1);
        }}
      />
    </>
  );
}
