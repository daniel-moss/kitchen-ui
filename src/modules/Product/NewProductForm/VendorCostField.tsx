import { useState } from "react";

import clsx from "clsx";

import AvatarVendor from "../../../components/Avatar/AvatarVendor";
import Button from "../../../components/Button/Button";
import Card from "../../../components/Card/Card";
import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import EmptyState from "../../../components/EmptyState/EmptyState";
import TextField from "../../../components/Fields/TextField/TextField";
import { Icon } from "../../../components/Icon/Icon";
import HoverTooltip from "../../../components/Tooltip/HoverTooltip";
import IconButton from "../../../components/IconButton/IconButton";
import Input from "../../../components/Input/Input";
import ItemTextBlock from "../../../components/ItemText/ItemText/ItemTextBlock";
import Label from "../../../components/Label/Label";
import ListItem from "../../../components/ListItem/ListItem";
import Prompt from "../../../components/Prompt/Prompt";
import MenuItem from "../../../components/Menu/MenuItem";
import SelectList from "../../../components/SelectList/SelectList";
import SelectListFooter from "../../../components/SelectList/SelectListFooter";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import { Vendor } from "../../../data/db/types";

import { isBlank, isMoneyText, MAX_TEXT, money, numberOf, padMoneyOnBlur } from "./productRules";
import { NewProductVendorCost } from "./NewProductForm.types";

import styles from "./NewProductForm.module.scss";

// The "Vendor cost" field — the first thing in the Pricing module, because the
// three vendor cost strategies below it read exactly these cards (Daniel moved
// it above them on 2026-10-13).
//
// One card per vendor, and the pair (vendor, product) is UNIQUE in production,
// so a vendor that already has a card is kept out of the list rather than
// offered twice. A card has two shapes: the saved Card (avatar, name, part #,
// cost, delete) and the open DisplayModule, which carries the two inputs and
// its own Cancel / Save. Cancel on a card that was never saved drops it.

/** A card still being filled in — the edit shape, before it becomes a value. */
interface DraftCost {
  vendorId: string;
  cost: string;
  partNumber: string;
  /** False while the card is new, so Cancel removes it instead of reverting. */
  wasSaved: boolean;
}

export interface VendorCostFieldProps {
  vendors: Vendor[];
  costs: NewProductVendorCost[];
  onChange: (costs: NewProductVendorCost[]) => void;
  /**
   * True while the product's cost follows the vendor costs. The delete prompt
   * has TWO bodies in the design — one for Manual and one for Min / Max / Avg,
   * which adds that the product cost will be recalculated.
   */
  costFollowsVendors: boolean;
  /** The "Add vendor" footer row exists only with the vendor-create permission. */
  canCreateVendor?: boolean;
  /** Opens the "New vendor" form above this one. */
  onCreateVendor?: () => void;
  mobile: boolean;
}

export default function VendorCostField({
  vendors,
  costs,
  onChange,
  costFollowsVendors,
  canCreateVendor = false,
  onCreateVendor,
  mobile,
}: VendorCostFieldProps) {
  const [listOpen, setListOpen] = useState(false);
  const [draft, setDraft] = useState<DraftCost | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const nameOf = (vendorId: string) => vendors.find((vendor) => vendor.id === vendorId)?.name ?? vendorId;

  // A vendor with a card is not offered again — the unique pair. The card being
  // edited stays in the list, because it is the one that is selected.
  const taken = new Set(costs.filter((cost) => cost.vendorId !== draft?.vendorId).map((cost) => cost.vendorId));
  const offered = vendors.filter((vendor) => !taken.has(vendor.id)).sort((a, b) => a.name.localeCompare(b.name));

  const openDraft = (vendorId: string) => {
    const existing = costs.find((cost) => cost.vendorId === vendorId);
    setShowErrors(false);
    setDraft({
      vendorId,
      cost: existing ? existing.cost.toFixed(2) : "",
      partNumber: existing?.partNumber ?? "",
      wasSaved: existing != null,
    });
  };

  const cancelDraft = () => {
    setShowErrors(false);
    setDraft(null);
  };

  const saveDraft = () => {
    if (draft == null) return;
    const missingCost = isBlank(draft.cost);
    const missingPartNumber = draft.partNumber.trim() === "";
    if (missingCost || missingPartNumber) {
      setShowErrors(true);
      return;
    }
    const saved: NewProductVendorCost = {
      vendorId: draft.vendorId,
      cost: numberOf(draft.cost),
      partNumber: draft.partNumber.trim(),
    };
    const next = draft.wasSaved
      ? costs.map((cost) => (cost.vendorId === draft.vendorId ? saved : cost))
      : [...costs, saved];
    onChange(next);
    setDraft(null);
    setShowErrors(false);
  };

  const removeCost = (vendorId: string) => {
    onChange(costs.filter((cost) => cost.vendorId !== vendorId));
    if (draft?.vendorId === vendorId) setDraft(null);
    setDeleting(null);
  };

  const costMissing = showErrors && draft != null && isBlank(draft.cost);
  const partNumberMissing = showErrors && draft != null && draft.partNumber.trim() === "";

  return (
    <div className={styles.vendorField}>
      <Label variant="subtle">Vendor cost</Label>

      <div className={styles.vendorCards}>
        {costs.map((cost) =>
          draft?.vendorId === cost.vendorId ? null : (
            <Card key={cost.vendorId} padding="var(--size-1)" style={{ width: "100%" }} onClick={() => openDraft(cost.vendorId)}>
              <ListItem
                variant="titleCaption"
                avatar={<AvatarVendor size="xl" />}
                title={nameOf(cost.vendorId)}
                caption={`Part #: ${cost.partNumber}`}
                right={<ItemTextBlock align="right" variant="title" title={money(cost.cost)} />}
                slotRight={
                  <HoverTooltip text="Delete">
                    <IconButton icon="trash-can" variant="ghost" size="md" aria-label="Delete" onClick={(event) => {
                        event.stopPropagation();
                        setDeleting(cost.vendorId);
                      }} />
                  </HoverTooltip>
                }
                isClickable={false}
              />
            </Card>
          ),
        )}

        {draft != null && (
          <DisplayModule
            title={nameOf(draft.vendorId)}
            slotLeft={<AvatarVendor size="lg" />}
            slotRight={
              <div className={styles.draftActions}>
                <Button size="md" variant="ghost" onClick={cancelDraft}>
                  Cancel
                </Button>
                <Button size="md" variant="solid" onClick={saveDraft}>
                  Save
                </Button>
              </div>
            }
            content={
              <div className={clsx(styles.draftFields, mobile && styles.draftFieldsStacked)}>
                <Input label="Cost">
                  <TextField
                    value={draft.cost}
                    onChange={(event) => isMoneyText(event.target.value) && setDraft({ ...draft, cost: event.target.value })}
                    onBlur={() => setDraft({ ...draft, cost: padMoneyOnBlur(draft.cost) })}
                    keyboard="decimal"
                    prefix="$"
                    isValid={!costMissing}
                  />
                </Input>
                <Input label="Part #">
                  <TextField
                    value={draft.partNumber}
                    onChange={(event) => setDraft({ ...draft, partNumber: event.target.value })}
                    maxLength={MAX_TEXT}
                    isValid={!partNumberMissing}
                  />
                </Input>
              </div>
            }
          />
        )}

        {/* Hidden while a card is being edited — one card at a time. */}
        {draft == null && (
          <Button
            size="lg"
            variant="ghost"
            leftIcon="plus"
            isFullWidth
            isDisabled={offered.length === 0}
            onClick={() => setListOpen(true)}
          >
            Add vendor cost
          </Button>
        )}
      </div>

      {/* "Active vendors only. Excludes already added vendors. Sorted by name
          from A to Z. Selecting a vendor closes the list and shows the
          DisplayModule." A DIALOG on desktop, a drawer on mobile — the node's
          own variants, not the anchored card the other pickers use. */}
      <SelectList
        variant={mobile ? "drawer" : "dialog"}
        breakpoint={mobile ? "mobile" : "desktop"}
        open={listOpen}
        onClose={() => setListOpen(false)}
        title="Vendors"
        searchable
        searchPlaceholder="Vendor..."
        noResultsState={<EmptyState caption="No matching active vendors" />}
        footer={
          canCreateVendor ? (
            <SelectListFooter>
              <MenuItem label="Add vendor" slotLeft={<Icon icon="plus" />} onClick={() => onCreateVendor?.()} />
            </SelectListFooter>
          ) : undefined
        }
      >
        <SelectListItemGroup>
          {offered.map((vendor) => (
            <SelectListItem
              key={vendor.id}
              label={vendor.name}
              onClick={() => {
                openDraft(vendor.id);
                setListOpen(false);
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectList>

      <Prompt
        open={deleting != null}
        title="Delete vendor cost?"
        body={
          `${deleting == null ? "" : nameOf(deleting)}'s cost for this product will be permanently deleted` +
          (costFollowsVendors ? " and the product cost will be recalculated" : "") +
          ". This action can not be undone."
        }
        actionLabel="Delete"
        actionVariant="danger"
        actionIcon="trash-can"
        onAction={() => deleting != null && removeCost(deleting)}
        onCancel={() => setDeleting(null)}
        breakpoint={mobile ? "mobile" : "desktop"}
      />
    </div>
  );
}
