import { useMemo, useState } from "react";

import EmptyState from "../../../../components/EmptyState/EmptyState";
import SearchField from "../../../../components/Fields/SearchField/SearchField";
import GroupLabel from "../../../../components/GroupLabel/GroupLabel";
import { InventoryLocation } from "../../../../data/db/types";
import { StockLevel } from "../../NewProductForm/productRules";
import InventoryLevelCard, {
  EMPTY_STOCK,
  InventoryLevelCardSkeleton,
  isNotStocked,
  StockFigures,
  statusOf,
} from "../../InventoryLevel/InventoryLevelCard";

import styles from "./InventoryLevelsTab.module.scss";

// The "Inventory levels" tab (Figma section "Inventory Levels" 3187-37507).
// It lists EVERY active inventory location of the company — no picker, no
// "Add" button: production keeps a row per product × location, and the
// locations themselves are made by Roopairs staff in Django.
//
//   Stocked        on top: the locations with an on hand, an on order, a
//                  target or an alert. Sorted Depleted → Low → Limited → Full
//                  → no target (Daniel, 2026-11-18), then A–Z by name.
//   Not stocked    a collapsed "Not stocked · N" accordion below, A–Z.
//   Up to 8        a company with 8 or fewer locations sees ONE list — the
//                  stocked rows, then the not-stocked ones — and no search.
//   None stocked   the group would hold everything, so there is no group:
//                  one A–Z list.
//   Search         only above 8 locations. Matches the name and the plate,
//                  across BOTH parts; the results are one A–Z list.
//                  "No locations match" when nothing does.
//   No locations   an EmptyState, no search.
//   Loading        three skeleton cards, no search.
//
// A card opens the location's edit Dialog — the panel owns that.

/** "8 or fewer inventory locations → one list without grouping, no search." */
export const SMALL_LIST_MAX = 8;

const STATUS_RANK: Record<StockLevel, number> = { depleted: 0, low: 1, limited: 2, full: 3 };
// A stocked location without a target has no status: it goes after Full.
const NO_TARGET_RANK = 4;

interface Row {
  location: InventoryLocation;
  level: StockFigures;
}

const byName = (a: Row, b: Row) => a.location.name.localeCompare(b.location.name);
const rankOf = (row: Row) => {
  const status = statusOf(row.level);
  return status ? STATUS_RANK[status] : NO_TARGET_RANK;
};
const byStatusThenName = (a: Row, b: Row) => rankOf(a) - rankOf(b) || byName(a, b);

interface InventoryLevelsTabProps {
  /** The company's ACTIVE inventory locations. */
  locations: InventoryLocation[];
  /** The product's level at each location, by location id. A missing id = not stocked. */
  levels: Record<string, StockFigures>;
  /** Opens a location's edit Dialog. Undefined = the cards do not respond. */
  onEdit?: (locationId: string) => void;
  isLoading?: boolean;
}

export default function InventoryLevelsTab({ locations, levels, onEdit, isLoading = false }: InventoryLevelsTabProps) {
  const [query, setQuery] = useState("");
  const [notStockedOpen, setNotStockedOpen] = useState(false);

  const rows = useMemo(
    () => locations.map((location) => ({ location, level: levels[location.id] ?? EMPTY_STOCK })),
    [locations, levels],
  );
  const stocked = useMemo(() => rows.filter((row) => !isNotStocked(row.level)).sort(byStatusThenName), [rows]);
  const notStocked = useMemo(() => rows.filter((row) => isNotStocked(row.level)).sort(byName), [rows]);

  const small = locations.length <= SMALL_LIST_MAX;
  const needle = small ? "" : query.trim().toLowerCase();
  const matches = useMemo(
    () =>
      needle === ""
        ? []
        : rows
            .filter((row) => `${row.location.name} ${row.location.plateNumber ?? ""}`.toLowerCase().includes(needle))
            .sort(byName),
    [rows, needle],
  );

  const card = (row: Row) => (
    <InventoryLevelCard
      key={row.location.id}
      level={row.level}
      location={row.location}
      onClick={onEdit ? () => onEdit(row.location.id) : undefined}
    />
  );

  if (isLoading) {
    return (
      <div className={styles.cards}>
        <InventoryLevelCardSkeleton />
        <InventoryLevelCardSkeleton />
        <InventoryLevelCardSkeleton />
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className={styles.empty}>
        <EmptyState title="No inventory locations" caption="Contact Roopairs support to set them up" />
      </div>
    );
  }

  const search = small ? null : (
    <SearchField
      value={query}
      onChange={(event) => setQuery(event.target.value)}
      onClear={() => setQuery("")}
      placeholder="Inventory location..."
    />
  );

  // Searching: one A–Z list over both parts.
  if (needle !== "") {
    return (
      <>
        {search}
        {matches.length > 0 ? (
          <div className={styles.cards}>{matches.map(card)}</div>
        ) : (
          <EmptyState caption="No locations match" />
        )}
      </>
    );
  }

  // One list without a group: a small company, or nothing stocked anywhere.
  if (small || stocked.length === 0) {
    return (
      <>
        {search}
        <div className={styles.cards}>{[...stocked, ...notStocked].map(card)}</div>
      </>
    );
  }

  return (
    <>
      {search}
      <div className={styles.cards}>{stocked.map(card)}</div>
      {notStocked.length > 0 && (
        <div className={styles.cards}>
          <GroupLabel
            label="Not stocked"
            counter={notStocked.length}
            isAccordion
            open={notStockedOpen}
            onOpenChange={setNotStockedOpen}
          />
          {notStockedOpen && notStocked.map(card)}
        </div>
      )}
    </>
  );
}
