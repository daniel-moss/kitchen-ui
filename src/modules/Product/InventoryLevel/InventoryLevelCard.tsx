import clsx from "clsx";

import Card from "../../../components/Card/Card";
import { Icon } from "../../../components/Icon/Icon";
import ProgressBar from "../../../components/Progress/ProgressBar";
import { SkeletonTypography } from "../../../components/SkeletonTypography/SkeletonTypography";
import HoverTooltip from "../../../components/Tooltip/HoverTooltip";
import { InventoryLocation } from "../../../data/db/types";
import { TEXT_SEPARATOR } from "../../../utils/textSeparator";
import { quantity, StockLevel, stockLevel } from "../NewProductForm/productRules";

import styles from "./InventoryLevelCard.module.scss";

// The "Inventory Location" Card — ONE build for the two places it shows: the
// "Create" form's Inventory levels field (Figma 4121-34006) and the Product
// side panel's "Inventory levels" tab (Figma 3200-48993). Moved here out of
// the form on 2026-11-18, when the panel needed it too.
//
//   icon · "[plate] · [name]"            on hand (+ on order 🚚)
//   ProgressBar + alert tick             only with a target; 100% = target
//   "Bin: …" / "No Bin location"         "Target: 20 · Full" / "No target"
//
// Status = on hand + ON ORDER against the target and the alert. A "Not
// stocked" location (nothing on hand, nothing on order, no target, no alert)
// is the same card with an empty level: "0", "No Bin location", "No target".

/** The location type's icon — the Avatar glyph the Figma location rows inherit. */
export const LOCATION_TYPE_ICON: Record<InventoryLocation["type"], string> = {
  warehouse: "warehouse",
  truck: "truck",
  dropPoint: "box",
};

/** "8XKT214 · Mike's truck" — the plate only when the truck has one. */
export const locationTitle = (location: InventoryLocation) =>
  location.plateNumber ? `${location.plateNumber}${TEXT_SEPARATOR}${location.name}` : location.name;

/** The numbers a card shows — production `InventoryLevel` without its keys. */
export interface StockFigures {
  /** May be negative. */
  onHand: number;
  /** 0 = none on order. */
  onOrder: number;
  /** Greater than 0 when set. */
  target?: number;
  /** Lower than the target; only with one. */
  alertAt?: number;
  /** "" = no bin location. */
  binLocation: string;
}

/** The figures of a location the product is NOT stocked at. */
export const EMPTY_STOCK: StockFigures = { onHand: 0, onOrder: 0, binLocation: "" };

/**
 * "Not stocked": on hand, on order, target and alert all empty or zero (Figma
 * "Not Stocked" annotation). A bin location alone does not make it stocked.
 */
export const isNotStocked = (level: StockFigures) =>
  level.onHand === 0 && level.onOrder === 0 && !level.target && !level.alertAt;

export const STATUS_WORD: Record<StockLevel, string> = { full: "Full", limited: "Limited", low: "Low", depleted: "Depleted" };

const STATUS_BAR: Record<StockLevel, string | undefined> = {
  full: "var(--jade-9)",
  limited: "var(--amber-9)",
  low: "var(--orange-9)",
  depleted: undefined,
};

export const statusOf = (level: StockFigures) => stockLevel(level.onHand, level.onOrder, level.target, level.alertAt);

interface InventoryLevelCardProps {
  level: StockFigures;
  location?: InventoryLocation;
  /** A fallback title when the location is unknown. */
  fallbackTitle?: string;
  /** "Opens the edit form." No handler = a card that does not respond. */
  onClick?: () => void;
}

export default function InventoryLevelCard({ level, location, fallbackTitle, onClick }: InventoryLevelCardProps) {
  const status = statusOf(level);
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
            <Icon icon={location ? LOCATION_TYPE_ICON[location.type] : "box"} size={14} container="square" className={styles.typeIcon} />
            <span className={styles.title}>{location ? locationTitle(location) : fallbackTitle}</span>
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

/**
 * The Loading card (Figma "Loading" 3200-50804): a 160px title bar and a 64px
 * number bar, an empty ProgressBar, then two 96px caption bars.
 */
export function InventoryLevelCardSkeleton() {
  return (
    <Card padding={0} style={{ width: "100%" }}>
      <div className={styles.card} aria-hidden>
        <div className={styles.header}>
          <div className={styles.name}>
            <SkeletonTypography variant="bodyCompact" width={160} />
          </div>
          <SkeletonTypography variant="bodyCompact" width={64} />
        </div>
        <ProgressBar value={0} isDecorative />
        <div className={clsx(styles.footer, styles.footerSkeleton)}>
          <SkeletonTypography variant="captionMD" width={96} />
          <SkeletonTypography variant="captionMD" width={96} />
        </div>
      </div>
    </Card>
  );
}
