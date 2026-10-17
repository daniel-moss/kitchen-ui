import { useState } from "react";

import clsx from "clsx";

import AvatarVendor from "../../../components/Avatar/AvatarVendor";
import BadgeColor from "../../../components/Badge/BadgeColor";
import Button from "../../../components/Button/Button";
import Card from "../../../components/Card/Card";
import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import TextField from "../../../components/Fields/TextField/TextField";
import { Icon } from "../../../components/Icon/Icon";
import Input from "../../../components/Input/Input";
import ItemTextBlock from "../../../components/ItemText/ItemText/ItemTextBlock";
import Label from "../../../components/Label/Label";
import LinkButton from "../../../components/LinkButton/LinkButton";
import ListItem from "../../../components/ListItem/ListItem";
import ListItemSlotIcon from "../../../components/ListItem/ListItemSlotIcon";
import MenuItem from "../../../components/Menu/MenuItem";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import Prompt from "../../../components/Prompt/Prompt";
import SelectListFooter from "../../../components/SelectList/SelectListFooter";
import { Vendor } from "../../../data/db/types";

import ActiveInactiveList from "./ActiveInactiveList";
import { decimalText, isBlank, isMoneyText, MAX_TEXT, money, NO_SUGGESTIONS, numberOf, overLimitError, padMoneyOnBlur } from "./productRules";
import { NewProductVendorCost } from "./NewProductForm.types";

import styles from "./NewProductForm.module.scss";

// The "Vendor cost" field — the first thing in the Pricing module, because the
// three vendor cost strategies below it read exactly these cards (Figma
// 4066-15281).
//
// One card per vendor, and the pair (vendor, product) is UNIQUE in production,
// so a vendor that already has a card is kept out of the list rather than
// offered twice. A card has two shapes:
//
//   the Card           avatar (crown when preferred) · name · "Part #: …" ·
//                      the cost · a chevron. Clicking it opens the edit shape.
//   the DisplayModule  "Make preferred" or the "Preferred" badge in the header,
//                      Cost + Part #, and a footer: Remove (only once the card
//                      was saved) · Cancel · Done.
//
// ONE card is edited at a time: while one is open the others do not respond,
// "Add vendor cost" hides, and the form's Create scrolls back to the open card
// instead of creating (the parent reads `onEditingChange`).
//
// THE PREFERRED VENDOR: "The list must have a preferred vendor." The first
// card added is preferred by default; another card takes it over with "Make
// preferred" (applied on Done, like the two fields); removing the preferred
// card hands it to the first card left.

/** A card still being filled in — the edit shape, before it becomes a value. */
interface DraftCost {
  vendorId: string;
  cost: string;
  partNumber: string;
  isPreferred: boolean;
  /** False while the card is new: Cancel then drops it and Remove is hidden. */
  wasSaved: boolean;
}

export interface VendorCostFieldProps {
  /** Every vendor — the list splits them into active and inactive itself. */
  vendors: Vendor[];
  costs: NewProductVendorCost[];
  onChange: (costs: NewProductVendorCost[]) => void;
  /**
   * True while the product's cost follows the vendor costs. The remove prompt
   * has TWO bodies — one for Manual and one for Min / Max / Avg, which adds
   * that the product cost will be re-calculated.
   */
  costFollowsVendors: boolean;
  /** The "Add vendor" footer row exists only with the vendor-create permission. */
  canCreateVendor?: boolean;
  /** Opens the "New vendor" form above this one. */
  onCreateVendor?: () => void;
  /** Tells the form a card is open, so its Create can scroll here instead. */
  onEditingChange?: (editing: boolean) => void;
  mobile: boolean;
}

/** "Main street 123, Suite 45, San Francisco, CA 98765" — the list row's caption. */
const vendorAddress = (vendor: Vendor) => {
  const cityLine = [vendor.billingState, vendor.billingPostalCode].filter(Boolean).join(" ");
  const parts = [vendor.billingStreet, vendor.billingUnit, vendor.billingCity, cityLine].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : undefined;
};

export default function VendorCostField({
  vendors,
  costs,
  onChange,
  costFollowsVendors,
  canCreateVendor = false,
  onCreateVendor,
  onEditingChange,
  mobile,
}: VendorCostFieldProps) {
  const [listOpen, setListOpen] = useState(false);
  const [draft, setDraftState] = useState<DraftCost | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const setDraft = (next: DraftCost | null) => {
    setDraftState(next);
    if ((next == null) !== (draft == null)) onEditingChange?.(next != null);
  };

  const nameOf = (vendorId: string) => vendors.find((vendor) => vendor.id === vendorId)?.name ?? vendorId;

  // A vendor with a card is not offered again — the unique pair.
  const taken = new Set(costs.map((cost) => cost.vendorId));
  const option = (vendor: Vendor) => ({
    id: vendor.id,
    label: vendor.name,
    caption: vendorAddress(vendor),
    avatar: <AvatarVendor size="xl" />,
  });
  const active = vendors.filter((vendor) => vendor.isActive && !taken.has(vendor.id)).map(option);
  const inactive = vendors.filter((vendor) => !vendor.isActive).map(option);

  const openDraft = (vendorId: string) => {
    const existing = costs.find((cost) => cost.vendorId === vendorId);
    setShowErrors(false);
    setDraft({
      vendorId,
      cost: existing ? padMoneyOnBlur(String(existing.cost)) : "",
      partNumber: existing?.partNumber ?? "",
      // A brand-new card is preferred when it is the first one.
      isPreferred: existing ? existing.isPreferred : costs.length === 0,
      wasSaved: existing != null,
    });
  };

  const missingCost = draft != null && isBlank(draft.cost);
  const missingPartNumber = draft != null && draft.partNumber.trim() === "";
  const partNumberTooLong = draft != null ? overLimitError(draft.partNumber, MAX_TEXT) : undefined;

  const done = () => {
    if (draft == null) return;
    if (missingCost || missingPartNumber || partNumberTooLong) {
      setShowErrors(true);
      return;
    }
    const saved: NewProductVendorCost = {
      vendorId: draft.vendorId,
      cost: numberOf(draft.cost),
      partNumber: draft.partNumber.trim(),
      isPreferred: draft.isPreferred,
    };
    let next = draft.wasSaved
      ? costs.map((cost) => (cost.vendorId === draft.vendorId ? saved : cost))
      : [...costs, saved];
    // Only one preferred vendor: taking it over clears the old one.
    if (saved.isPreferred) next = next.map((cost) => ({ ...cost, isPreferred: cost.vendorId === saved.vendorId }));
    onChange(next);
    setDraft(null);
    setShowErrors(false);
  };

  const remove = (vendorId: string) => {
    let next = costs.filter((cost) => cost.vendorId !== vendorId);
    // "If a preferred vendor is removed, the first vendor on the list becomes
    // a preferred one."
    if (next.length > 0 && !next.some((cost) => cost.isPreferred)) next = next.map((cost, index) => ({ ...cost, isPreferred: index === 0 }));
    onChange(next);
    setDraft(null);
    setRemoving(null);
  };

  const editCard = draft != null && (
    <div data-editing-card="">
      <DisplayModule
        title={nameOf(draft.vendorId)}
        slotLeft={<AvatarVendor size="md" />}
        slotRight={
          draft.isPreferred ? (
            <BadgeColor size="lg" colorScheme="amber" leftIcon="crown">
              Preferred
            </BadgeColor>
          ) : (
            <Button
              size="md"
              variant="ghost"
              leftIcon="crown"
              leftIconPack="solid"
              leftIconClassName={styles.preferredIcon}
              onClick={() => setDraft({ ...draft, isPreferred: true })}>
              Make preferred
            </Button>
          )
        }
        bodyPadded={false}
        content={
          <>
            <div className={clsx(styles.draftFields, mobile && styles.draftFieldsStacked)}>
              <Input label="Cost">
                <TextField
                  value={draft.cost}
                  onChange={(event) => isMoneyText(decimalText(event.target.value)) && setDraft({ ...draft, cost: decimalText(event.target.value) })}
                  onBlur={() => setDraft({ ...draft, cost: padMoneyOnBlur(draft.cost) })}
                  keyboard="decimal"
                  prefix="$"
                  placeholder="0.00"
                  isValid={!(showErrors && missingCost)}
                  errorMessage="Enter Cost"
                />
              </Input>
              <Input label="Part #">
                <TextField
                  value={draft.partNumber}
                  onChange={(event) => setDraft({ ...draft, partNumber: event.target.value })}
                  {...NO_SUGGESTIONS}
                  isValid={!(partNumberTooLong || (showErrors && missingPartNumber))}
                  errorMessage={partNumberTooLong ?? "Enter Part #"}
                />
              </Input>
            </div>
            <PopoverFooter
              slotLeft={
                draft.wasSaved ? (
                  <LinkButton size="sm" colorScheme="tomato" onClick={() => setRemoving(draft.vendorId)}>
                    Remove
                  </LinkButton>
                ) : undefined
              }
            >
              <Button size="lg" variant="ghost" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button size="lg" variant="solid" onClick={done}>
                Done
              </Button>
            </PopoverFooter>
          </>
        }
      />
    </div>
  );

  return (
    <div className={styles.vendorField}>
      <Label variant="subtle" condition="optional">
        Vendor cost
      </Label>

      <div className={styles.vendorCards}>
        {costs.map((cost) =>
          draft?.vendorId === cost.vendorId ? (
            <div key={cost.vendorId}>{editCard}</div>
          ) : (
            <Card
              key={cost.vendorId}
              padding="var(--size-1)"
              style={{ width: "100%" }}
              // While another card is open this one does not respond.
              onClick={draft == null ? () => openDraft(cost.vendorId) : undefined}
            >
              <ListItem
                variant="titleCaption"
                avatar={<AvatarVendor size="xl" addOn={cost.isPreferred ? "preferred" : "none"} />}
                title={nameOf(cost.vendorId)}
                caption={`Part #: ${cost.partNumber}`}
                right={<ItemTextBlock align="right" variant="title" title={money(cost.cost)} />}
                slotRight={<ListItemSlotIcon icon="angle-right" />}
              />
            </Card>
          ),
        )}

        {/* A new card, not yet in the list, opens at the bottom. */}
        {draft != null && !draft.wasSaved && editCard}

        {/* "Hidden when vendor card is in Edit mode." */}
        {draft == null && (
          <Button size="lg" variant="ghost" leftIcon="plus" isFullWidth onClick={() => setListOpen(true)}>
            Add vendor cost
          </Button>
        )}
      </div>

      <ActiveInactiveList
        open={listOpen}
        onClose={() => setListOpen(false)}
        mobile={mobile}
        title="Vendors"
        searchPlaceholder="Vendor..."
        noun="vendors"
        active={active}
        inactive={inactive}
        onPick={openDraft}
        emptySuffix={canCreateVendor ? "" : ". Ask an admin to add a vendor."}
        footer={
          canCreateVendor ? (
            <SelectListFooter>
              <MenuItem
                label="Add vendor"
                slotLeft={<Icon icon="plus" />}
                onClick={() => {
                  setListOpen(false);
                  onCreateVendor?.();
                }}
              />
            </SelectListFooter>
          ) : undefined
        }
      />

      <Prompt
        open={removing != null}
        title={`Remove ${removing == null ? "" : nameOf(removing)}?`}
        body={
          "Vendor cost and part # for this product are deleted when you save the product." +
          (costFollowsVendors ? " The product cost will be re-calculated." : "")
        }
        actionLabel="Remove"
        actionVariant="danger"
        onAction={() => removing != null && remove(removing)}
        onCancel={() => setRemoving(null)}
        breakpoint={mobile ? "mobile" : "desktop"}
      />
    </div>
  );
}
