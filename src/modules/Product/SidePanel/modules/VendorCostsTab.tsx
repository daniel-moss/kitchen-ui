import { MouseEvent, useMemo, useState } from "react";

import AvatarVendor from "../../../../components/Avatar/AvatarVendor";
import Card from "../../../../components/Card/Card";
import EmptyState from "../../../../components/EmptyState/EmptyState";
import SearchField from "../../../../components/Fields/SearchField/SearchField";
import IconButton from "../../../../components/IconButton/IconButton";
import ItemTextBlock from "../../../../components/ItemText/ItemText/ItemTextBlock";
import ListItem from "../../../../components/ListItem/ListItem";
import { NewProductVendorCost } from "../../NewProductForm/NewProductForm.types";
import { money } from "../../NewProductForm/productRules";
import { sortVendorCosts } from "../vendorCostRules";

import styles from "./VendorCostsTab.module.scss";

// The "Vendor costs" tab (Figma section "Vendor Costs" 3200-51187). One Card
// per vendor that sells this product:
//
//   avatar (crown when preferred) · vendor name · "Part #: …" · the cost · ⋯
//
//   Order          the preferred vendor on top, then A → Z (vendorCostRules).
//   Search         only above 8 vendor costs; matches the vendor NAME only;
//                  the results are A → Z. "No vendors match" when nothing does.
//   Empty          "No vendor costs" + "Add the first vendor cost" and an
//                  "Add vendor cost" button — or "Ask an admin to add a vendor
//                  cost" without the edit permission.
//   No permission  the cards do not respond and carry no ⋯ menu.
//   Loading        three skeleton cards, no search.
//
// The panel owns everything the cards open: the edit Dialog, the ⋯ menu, the
// delete Prompts and the footer's "Add vendor cost".

/** "Only shown if there are more than 8 vendor costs on the list." */
export const SEARCH_MIN = 9;

interface VendorCostsTabProps {
  costs: NewProductVendorCost[];
  nameOf: (vendorId: string) => string;
  /** Opens a vendor cost's edit Dialog. Undefined = no edit permission: the cards do not respond. */
  onEdit?: (vendorId: string) => void;
  /** Opens the ⋯ menu from its button. Undefined = no menu. */
  onMenu?: (vendorId: string, event: MouseEvent<HTMLButtonElement>) => void;
  /** The vendor whose ⋯ menu is open — its button stays pressed. */
  menuVendorId?: string | null;
  /** The empty state's "Add vendor cost". Undefined = the no-permission copy. */
  onAdd?: () => void;
  /** True when editing is impossible because the USER lacks the permission (not because the product is inactive). */
  noPermission?: boolean;
  isLoading?: boolean;
}

export default function VendorCostsTab({
  costs,
  nameOf,
  onEdit,
  onMenu,
  menuVendorId,
  onAdd,
  noPermission = false,
  isLoading = false,
}: VendorCostsTabProps) {
  const [query, setQuery] = useState("");

  const sorted = useMemo(() => sortVendorCosts(costs, nameOf), [costs, nameOf]);
  const hasSearch = costs.length >= SEARCH_MIN;
  const needle = hasSearch ? query.trim().toLowerCase() : "";
  const matches = useMemo(
    () =>
      needle === ""
        ? sorted
        : costs
            .filter((cost) => nameOf(cost.vendorId).toLowerCase().includes(needle))
            .sort((a, b) => nameOf(a.vendorId).localeCompare(nameOf(b.vendorId))),
    [costs, sorted, needle, nameOf],
  );

  if (isLoading) {
    return (
      <div className={styles.cards}>
        {[0, 1, 2].map((index) => (
          <Card key={index} padding="var(--size-1)" style={{ width: "100%" }}>
            <ListItem variant="titleCaption" avatar={<AvatarVendor size="xl" />} title="" caption="" isLoading />
          </Card>
        ))}
      </div>
    );
  }

  if (costs.length === 0) {
    return (
      <div className={styles.empty}>
        <EmptyState
          title="No vendor costs"
          caption={onAdd ? "Add the first vendor cost" : noPermission ? "Ask an admin to add a vendor cost" : undefined}
          primaryAction={onAdd ? { label: "Add vendor cost", leftIcon: "plus", onClick: onAdd } : undefined}
        />
      </div>
    );
  }

  const card = (cost: NewProductVendorCost) => (
    <Card
      key={cost.vendorId}
      padding="var(--size-1)"
      style={{ width: "100%" }}
      onClick={onEdit ? () => onEdit(cost.vendorId) : undefined}
    >
      <ListItem
        variant="titleCaption"
        avatar={<AvatarVendor size="xl" addOn={cost.isPreferred ? "preferred" : "none"} />}
        title={nameOf(cost.vendorId)}
        caption={`Part #: ${cost.partNumber}`}
        right={<ItemTextBlock align="right" variant="title" title={money(cost.cost)} />}
        slotRight={
          onMenu ? (
            <IconButton
              icon="ellipsis"
              variant="ghost"
              size="md"
              aria-label="Vendor cost actions"
              isPressed={menuVendorId === cost.vendorId}
              noDebounce
              onClick={(event) => {
                // The Card behind it opens the edit Dialog — the menu must not.
                event.stopPropagation();
                onMenu(cost.vendorId, event);
              }}
            />
          ) : undefined
        }
      />
    </Card>
  );

  return (
    <>
      {hasSearch && (
        <SearchField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery("")}
          placeholder="Vendor..."
        />
      )}
      {matches.length > 0 ? (
        <div className={styles.cards}>{matches.map(card)}</div>
      ) : (
        <EmptyState caption="No vendors match" />
      )}
    </>
  );
}
