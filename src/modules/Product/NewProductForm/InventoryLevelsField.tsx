import { useState } from "react";

import clsx from "clsx";

import Avatar from "../../../components/Avatar/Avatar";
import Button from "../../../components/Button/Button";
import Card from "../../../components/Card/Card";
import CheckboxItem from "../../../components/Checkbox/CheckboxItem";
import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import TextField from "../../../components/Fields/TextField/TextField";
import { Icon } from "../../../components/Icon/Icon";
import Input from "../../../components/Input/Input";
import ItemTextLine from "../../../components/ItemText/ItemText/ItemTextLine";
import Label from "../../../components/Label/Label";
import LinkButton from "../../../components/LinkButton/LinkButton";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import ProgressBar from "../../../components/Progress/ProgressBar";
import Prompt from "../../../components/Prompt/Prompt";
import HoverTooltip from "../../../components/Tooltip/HoverTooltip";
import { InventoryLocation } from "../../../data/db/types";
import { TEXT_SEPARATOR } from "../../../utils/textSeparator";

import ActiveInactiveList from "./ActiveInactiveList";
import {
  decimalText,
  isBlank,
  isQuantityText,
  isSignedQuantityText,
  MAX_BIN,
  NO_SUGGESTIONS,
  numberOf,
  overLimitError,
  quantity,
  StockLevel,
  stockLevel,
} from "./productRules";
import { NewProductInventoryLevel } from "./NewProductForm.types";

import styles from "./InventoryLevelsField.module.scss";

// The "Inventory levels" field — what the Inventory stock type reveals (Figma
// 4137-8999). The user ADDS the locations the product is stocked at, one by
// one, from the "Inventory locations" list; the cards stay in the order they
// were added, a new one at the bottom. The product can be saved with none.
//
// A card has two shapes, like a vendor cost card:
//
//   the Card           icon · "[plate] · [name]" · on hand (+ on order) ·
//                      a ProgressBar with the alert tick · "Bin: …" ·
//                      "Target: 20 · Full". Clicking it opens the edit shape.
//   the DisplayModule  On hand + On order · "Set target" (Target + Alert at)
//                      · Bin location · a footer: Remove (only once saved) ·
//                      Cancel · Done.
//
// ONE card is edited at a time; while it is open the other cards do not
// respond, "Add inventory location" hides, and the form's Create scrolls back
// here instead of creating.

const TYPE_ICON: Record<InventoryLocation["type"], string> = {
  warehouse: "warehouse",
  truck: "truck",
  dropPoint: "box",
};

/** "8XKT214 · Mike's truck" — the plate only when the truck has one. */
export const locationTitle = (location: InventoryLocation) =>
  location.plateNumber ? `${location.plateNumber}${TEXT_SEPARATOR}${location.name}` : location.name;

const STATUS_WORD: Record<StockLevel, string> = { full: "Full", limited: "Limited", low: "Low", depleted: "Depleted" };
const STATUS_BAR: Record<StockLevel, string | undefined> = {
  full: "var(--jade-9)",
  limited: "var(--amber-9)",
  low: "var(--orange-9)",
  depleted: undefined,
};

interface DraftLevel {
  locationId: string;
  onHand: string;
  onOrder: string;
  hasTarget: boolean;
  target: string;
  alertAt: string;
  binLocation: string;
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

const asText = (value?: number) => (value == null ? "" : String(value));

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
    avatar: <Avatar size="xl" shape="square" content="icon" icon={TYPE_ICON[location.type]} iconPack="solid" />,
  });
  const active = locations.filter((location) => location.isActive && !taken.has(location.id)).map(option);
  const inactive = locations.filter((location) => !location.isActive).map(option);

  const openDraft = (locationId: string) => {
    const existing = levels.find((level) => level.locationId === locationId);
    setShowErrors(false);
    setDraft({
      locationId,
      onHand: asText(existing?.onHand),
      onOrder: existing && existing.onOrder !== 0 ? String(existing.onOrder) : "",
      hasTarget: existing?.target != null,
      target: asText(existing?.target),
      alertAt: asText(existing?.alertAt),
      binLocation: existing?.binLocation ?? "",
      wasSaved: existing != null,
    });
  };

  // ---- the edit card's checks ----
  const missingOnHand = draft != null && isBlank(draft.onHand);
  const missingTarget = draft != null && draft.hasTarget && isBlank(draft.target);
  const targetNotPositive = draft != null && draft.hasTarget && !missingTarget && numberOf(draft.target) <= 0;
  const alertNotBelow =
    draft != null && draft.hasTarget && !missingTarget && !isBlank(draft.alertAt) && numberOf(draft.alertAt) >= numberOf(draft.target);
  const binTooLong = draft != null ? overLimitError(draft.binLocation, MAX_BIN) : undefined;

  const done = () => {
    if (draft == null) return;
    if (missingOnHand || missingTarget || targetNotPositive || alertNotBelow || binTooLong) {
      setShowErrors(true);
      return;
    }
    const saved: NewProductInventoryLevel = {
      locationId: draft.locationId,
      onHand: numberOf(draft.onHand),
      // "No value is treated as 0."
      onOrder: numberOf(draft.onOrder),
      // Unchecking "Set target" keeps the two values in the card while it is
      // open, but a level saved without a target carries none.
      target: draft.hasTarget ? numberOf(draft.target) : undefined,
      alertAt: draft.hasTarget && !isBlank(draft.alertAt) ? numberOf(draft.alertAt) : undefined,
      binLocation: draft.binLocation.trim(),
    };
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
            slotLeft={<Icon icon={TYPE_ICON[locationOf(draft.locationId)?.type ?? "warehouse"]} />}
          />
        }
        bodyPadded={false}
        content={
          <>
            <div className={styles.editFields}>
              <div className={styles.pair}>
                <Input label="On hand">
                  <TextField
                    value={draft.onHand}
                    onChange={(event) => isSignedQuantityText(decimalText(event.target.value)) && setDraft({ ...draft, onHand: decimalText(event.target.value) })}
                    placeholder="0"
                    {...NO_SUGGESTIONS}
                    isValid={!(showErrors && missingOnHand)}
                  />
                </Input>
                <Input label="On order" labelCondition="optional">
                  <TextField
                    value={draft.onOrder}
                    onChange={(event) => isQuantityText(decimalText(event.target.value)) && setDraft({ ...draft, onOrder: decimalText(event.target.value) })}
                    keyboard="decimal"
                    placeholder="0"
                  />
                </Input>
              </div>

              <CheckboxItem
                variant="card"
                icon="arrow-up-to-line"
                label="Set target"
                checked={draft.hasTarget}
                onChange={(event) => setDraft({ ...draft, hasTarget: event.target.checked })}
                content={
                  <div className={styles.targetFields}>
                    <Input label="Target">
                      <TextField
                        value={draft.target}
                        onChange={(event) => isQuantityText(decimalText(event.target.value)) && setDraft({ ...draft, target: decimalText(event.target.value) })}
                        keyboard="decimal"
                        placeholder="0"
                        isValid={!(showErrors && (missingTarget || targetNotPositive))}
                        errorMessage={targetNotPositive ? "Must be greater than 0" : undefined}
                      />
                    </Input>
                    <Input label="Alert at" labelCondition="optional">
                      <TextField
                        value={draft.alertAt}
                        onChange={(event) => isQuantityText(decimalText(event.target.value)) && setDraft({ ...draft, alertAt: decimalText(event.target.value) })}
                        keyboard="decimal"
                        placeholder="0"
                        isValid={!(showErrors && alertNotBelow)}
                        errorMessage="Must be lower than Target"
                      />
                    </Input>
                  </div>
                }
              />

              <Input label="Bin location" labelCondition="optional">
                <TextField
                  value={draft.binLocation}
                  onChange={(event) => setDraft({ ...draft, binLocation: event.target.value })}
                  {...NO_SUGGESTIONS}
                  isValid={binTooLong == null}
                  errorMessage={binTooLong}
                />
              </Input>
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
            <LevelCard
              key={level.locationId}
              level={level}
              location={locationOf(level.locationId)}
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

// ---- the saved card (Figma "Inventory Location" Card, 4121-34006) ----------

interface LevelCardProps {
  level: NewProductInventoryLevel;
  location?: InventoryLocation;
  onClick?: () => void;
}

function LevelCard({ level, location, onClick }: LevelCardProps) {
  const status = stockLevel(level.onHand, level.onOrder, level.target, level.alertAt);
  // The numbers take the status color; with no target they stay strong, and
  // an on hand of zero or less turns the placeholder gray.
  const numberClass = status ? styles[status] : undefined;
  const onHandClass = status ? styles[status] : level.onHand <= 0 ? styles.placeholder : undefined;
  const stock = level.onHand + level.onOrder;
  const fill = level.target ? Math.max(0, Math.min(100, (stock / level.target) * 100)) : 0;

  return (
    <Card padding={0} style={{ width: "100%" }} onClick={onClick}>
      <div className={clsx(styles.card, level.target == null && styles.cardNoTarget)}>
        <div className={styles.header}>
          <div className={styles.name}>
            <Icon icon={location ? TYPE_ICON[location.type] : "box"} size={14} container="square" className={styles.typeIcon} />
            <span className={styles.title}>{location ? locationTitle(location) : level.locationId}</span>
          </div>
          <div className={styles.numbers}>
            <HoverTooltip text={`${quantity(level.onHand)} on hand`}>
              <span className={clsx(styles.number, onHandClass)}>{quantity(level.onHand)}</span>
            </HoverTooltip>
            {/* "On order" only when there is some. */}
            {level.onOrder > 0 && (
              <>
                <Icon icon="plus" pack="solid" size={10} className={numberClass} />
                <HoverTooltip text={`${quantity(level.onOrder)} on order`}>
                  <span className={clsx(styles.onOrder, numberClass)}>
                    <span className={styles.number}>{quantity(level.onOrder)}</span>
                    <Icon icon="truck-fast" size={14} />
                  </span>
                </HoverTooltip>
              </>
            )}
          </div>
        </div>

        {/* "Only shown if the target provided. 100% = target." The tick marks
            the alert level on the same scale. */}
        {level.target != null && (
          <div className={styles.bar}>
            <ProgressBar value={fill} color={status ? STATUS_BAR[status] : undefined} isDecorative />
            {level.alertAt != null && (
              <span className={styles.alertTick} style={{ left: `${Math.min(100, (level.alertAt / level.target) * 100)}%` }} />
            )}
          </div>
        )}

        <div className={styles.footer}>
          <span className={clsx(styles.caption, level.binLocation === "" && styles.placeholder)}>
            {level.binLocation === "" ? "No Bin location" : `Bin: ${level.binLocation}`}
          </span>
          {status ? (
            <span className={styles.caption}>
              {`Target: ${quantity(level.target as number)}`}
              {TEXT_SEPARATOR}
              <span className={styles[status]}>{STATUS_WORD[status]}</span>
            </span>
          ) : (
            <span className={clsx(styles.caption, styles.placeholder)}>No target</span>
          )}
        </div>
      </div>
    </Card>
  );
}
