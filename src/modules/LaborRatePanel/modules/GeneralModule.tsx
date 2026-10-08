import Avatar from "../../../components/Avatar/Avatar";
import AvatarUser from "../../../components/Avatar/AvatarUser";
import BadgePricebookStatus from "../../../components/Badge/BadgePricebookStatus";
import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import IconButton from "../../../components/IconButton/IconButton";
import ValueDisplay from "../../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../../components/ValueDisplay/ValueDisplayGroup";
import { LaborItem } from "../../../data/db";
import { formatShortDateTime } from "../../shared/dates";
import { createdByOf, laborRateStatusOf, subtypeNameOf } from "../laborRateData";

// The Labor rate panel's "General" module (Figma 1-7275). Six label–value
// pairs, in the node's order: the status badge first, then the two fields the
// edit form owns, then the three the system writes.
//
// Only Name and Subtype are editable — Status changes through the context menu
// or the Review footer, and the last three are production's `created_by`,
// `created_at` and `last_modified_at`, which nobody types. The money fields
// are NOT here: they are the "Pricing" module below.

interface GeneralModuleProps {
  rate: LaborItem;
  onEdit: () => void;
  /** Hidden while the rate is inactive or in Review, or without the edit permission. */
  canEdit?: boolean;
  isLoading?: boolean;
}

export default function GeneralModule({ rate, onEdit, canEdit = true, isLoading = false }: GeneralModuleProps) {
  const createdBy = createdByOf(rate);

  return (
    <DisplayModule
      title="General"
      // While loading there is nothing to edit yet, so the header loses its
      // button (the Loading frame draws the header with no right slot).
      slotRight={
        isLoading || !canEdit ? undefined : (
          <IconButton icon="pen" variant="ghost" size="md" aria-label="Edit general" onClick={onEdit} />
        )
      }
      content={
        <ValueDisplayGroup>
          <ValueDisplay
            label="Status"
            kind="badge"
            badge={<BadgePricebookStatus size="md" status={laborRateStatusOf(rate)} />}
            isLoading={isLoading}
          />
          <ValueDisplay label="Name" value={rate.name} isLoading={isLoading} />
          {/* Nullable in production, and empty on every system-minted Review
              item. The row then draws ValueDisplay's own "No Subtype"
              placeholder — the empty-state convention (Daniel, 2026-10-08). */}
          <ValueDisplay label="Subtype" value={subtypeNameOf(rate)} isLoading={isLoading} />
          {/* Created BY comes before created AT: who made the rate is the
              stronger fact, and the two timestamps then sit together.

              Three cases, one row (node 24-4654) — a user with their round
              photo, "QuickBooks" with the square brand tile, or the
              placeholder-colored "Unknown" with no avatar at all. See
              `createdByOf`. */}
          <ValueDisplay
            label="Created by"
            value={createdBy.value}
            valueColor={createdBy.color}
            slotLeft={
              createdBy.avatar == null ? undefined : createdBy.avatarShape === "square" ? (
                // The logo is decorative — the value next to it says the name.
                <Avatar size="xs" shape="square" content="image" imageSrc={createdBy.avatar} imageAlt="" />
              ) : (
                <AvatarUser size="xs" imageSrc={createdBy.avatar} />
              )
            }
            isLoading={isLoading}
          />
          <ValueDisplay label="Created at" value={formatShortDateTime(rate.createdAt)} isLoading={isLoading} />
          <ValueDisplay label="Last modified" value={formatShortDateTime(rate.lastModifiedAt)} isLoading={isLoading} />
        </ValueDisplayGroup>
      }
    />
  );
}
