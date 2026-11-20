import { useState } from "react";

import Avatar from "../../../components/Avatar/Avatar";
import Button from "../../../components/Button/Button";
import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import { Icon } from "../../../components/Icon/Icon";
import ItemTextLine from "../../../components/ItemText/ItemText/ItemTextLine";
import Label from "../../../components/Label/Label";
import LinkButton from "../../../components/LinkButton/LinkButton";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import Prompt from "../../../components/Prompt/Prompt";
import { InventoryLocation } from "../../../data/db/types";
import InventoryLevelCard, { LOCATION_TYPE_ICON, locationTitle } from "../InventoryLevel/InventoryLevelCard";
import InventoryLevelFields, { draftErrors, draftOf, LevelDraft, levelOf } from "../InventoryLevel/InventoryLevelFields";

import ActiveInactiveList from "./ActiveInactiveList";
import { NewProductInventoryLevel } from "./NewProductForm.types";

import styles from "./InventoryLevelsField.module.scss";

// The "Inventory levels" field — what the Inventory stock type reveals (Figma
// 4137-8999). The user ADDS the locations the product is stocked at, one by
// one, from the "Inventory locations" list; the cards stay in the order they
// were added, a new one at the bottom. The product can be saved with none.
//
// A card has two shapes, like a vendor cost card:
//
//   the Card           InventoryLevelCard — shared with the Product side
//                      panel's "Inventory levels" tab. Clicking it opens the
//                      edit shape.
//   the DisplayModule  InventoryLevelFields (also shared) · a footer: Remove
//                      (only once saved) · Cancel · Done.
//
// ONE card is edited at a time; while it is open the other cards do not
// respond, "Add inventory location" hides, and the form's Create scrolls back
// here instead of creating.

// Kept as re-exports: other modules import them from here.
export { LOCATION_TYPE_ICON, locationTitle };

interface DraftLevel extends LevelDraft {
  locationId: string;
  wasSaved: boolean;
}

export interface InventoryLevelsFieldProps {
  /** Every inventory location — split into active and inactive here. */
  locations: InventoryLocation[];
  levels: NewProductInventoryLevel[];
  onChange: (levels: NewProductInventoryLevel[]) => void;
  /** Tells the form a card is open, so its Create can scroll here instead. */
  onEditingChange?: (editing: boolean) => void;
  mobile: boolean;
}

export default function InventoryLevelsField({ locations, levels, onChange, onEditingChange, mobile }: InventoryLevelsFieldProps) {
  const [listOpen, setListOpen] = useState(false);
  const [draft, setDraftState] = useState<DraftLevel | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const setDraft = (next: DraftLevel | null) => {
    setDraftState(next);
    if ((next == null) !== (draft == null)) onEditingChange?.(next != null);
  };

  const locationOf = (id: string) => locations.find((location) => location.id === id);
  const titleOf = (id: string) => {
    const location = locationOf(id);
    return location ? locationTitle(location) : id;
  };

  const taken = new Set(levels.map((level) => level.locationId));
  const option = (location: InventoryLocation) => ({
    id: location.id,
    label: locationTitle(location),
    caption: location.address,
    searchText: `${location.plateNumber ?? ""} ${location.name}`,
    sortText: location.name,
    avatar: <Avatar size="xl" shape="square" content="icon" icon={LOCATION_TYPE_ICON[location.type]} iconPack="solid" />,
  });
  const active = locations.filter((location) => location.isActive && !taken.has(location.id)).map(option);
  const inactive = locations.filter((location) => !location.isActive).map(option);

  const openDraft = (locationId: string) => {
    const existing = levels.find((level) => level.locationId === locationId);
    setShowErrors(false);
    setDraft({ ...draftOf(existing), locationId, wasSaved: existing != null });
  };

  const done = () => {
    if (draft == null) return;
    if (draftErrors(draft).any) {
      setShowErrors(true);
      return;
    }
    const saved: NewProductInventoryLevel = { locationId: draft.locationId, ...levelOf(draft) };
    onChange(
      draft.wasSaved ? levels.map((level) => (level.locationId === draft.locationId ? saved : level)) : [...levels, saved],
    );
    setDraft(null);
    setShowErrors(false);
  };

  const remove = (locationId: string) => {
    onChange(levels.filter((level) => level.locationId !== locationId));
    setDraft(null);
    setRemoving(null);
  };

  const editCard = draft != null && (
    <div data-editing-card="">
      <DisplayModule
        title={
          <ItemTextLine
            label={titleOf(draft.locationId)}
            textStyle="bodyMedium"
            color="strong"
            slotLeft={<Icon icon={LOCATION_TYPE_ICON[locationOf(draft.locationId)?.type ?? "warehouse"]} />}
          />
        }
        bodyPadded={false}
        content={
          <>
            <div className={styles.editFields}>
              <InventoryLevelFields
                draft={draft}
                onChange={(next) => setDraft({ ...draft, ...next })}
                showErrors={showErrors}
              />
            </div>
            <PopoverFooter
              slotLeft={
                draft.wasSaved ? (
                  <LinkButton size="sm" colorScheme="tomato" onClick={() => setRemoving(draft.locationId)}>
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
    <div className={styles.field}>
      <Label variant="subtle" condition="optional">
        Inventory levels
      </Label>

      <div className={styles.cards}>
        {levels.map((level) =>
          draft?.locationId === level.locationId ? (
            <div key={level.locationId}>{editCard}</div>
          ) : (
            <InventoryLevelCard
              key={level.locationId}
              level={level}
              location={locationOf(level.locationId)}
              fallbackTitle={level.locationId}
              onClick={draft == null ? () => openDraft(level.locationId) : undefined}
            />
          ),
        )}

        {draft != null && !draft.wasSaved && editCard}

        {draft == null && (
          <Button size="lg" variant="ghost" leftIcon="plus" isFullWidth onClick={() => setListOpen(true)}>
            Add inventory location
          </Button>
        )}
      </div>

      <ActiveInactiveList
        open={listOpen}
        onClose={() => setListOpen(false)}
        mobile={mobile}
        title="Inventory locations"
        searchPlaceholder="Inventory location..."
        noun="locations"
        active={active}
        inactive={inactive}
        onPick={openDraft}
      />

      <Prompt
        open={removing != null}
        title={`Remove ${removing == null ? "" : titleOf(removing)}?`}
        body="Stock levels and bin location for this product are deleted when you save the product."
        actionLabel="Remove"
        actionVariant="danger"
        onAction={() => removing != null && remove(removing)}
        onCancel={() => setRemoving(null)}
        breakpoint={mobile ? "mobile" : "desktop"}
      />
    </div>
  );
}
