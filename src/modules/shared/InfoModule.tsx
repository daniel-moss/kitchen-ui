import Avatar from "../../components/Avatar/Avatar";
import AvatarUser from "../../components/Avatar/AvatarUser";
import BadgePricebookStatus from "../../components/Badge/BadgePricebookStatus";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import ValueDisplay from "../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../components/ValueDisplay/ValueDisplayGroup";
import type { CreatedBy } from "../LaborRatePanel/laborRateData";
import { formatShortDateTime } from "./dates";

// The pricebook "Info" module (Figma file qhebbfbPHDVnv8IF1EC7Zg, page
// "↳ Shared Modules" → Info 3173-33601). Four rows the SYSTEM writes, so the
// module has no edit button:
//
//   Status         the BadgePricebookStatus — Active / Inactive / Review.
//   Created by     three cases (frame "Created By"): a known user with their
//                  round photo; "QuickBooks Desktop" with the square brand
//                  tile (an import); "Unknown" with no avatar (an onboarding
//                  bulk load, or a Review item the system minted). See
//                  `createdByOf`.
//   Created at     "Jan 1, 2027 at 12:00 PM".
//   Last modified  the same format.
//
// Used by every pricebook panel — labor rate, product, other charge,
// discount and tax rate (the tax rate since its 2026-11-23 rebuild).

interface InfoModuleProps {
  status: "active" | "inactive" | "review";
  createdBy: CreatedBy;
  createdAt: string;
  lastModifiedAt: string;
  isLoading?: boolean;
}

export default function InfoModule({ status, createdBy, createdAt, lastModifiedAt, isLoading = false }: InfoModuleProps) {
  return (
    <DisplayModule
      title="Info"
      content={
        <ValueDisplayGroup>
          <ValueDisplay
            label="Status"
            kind="badge"
            badge={<BadgePricebookStatus size="md" status={status} />}
            isLoading={isLoading}
          />
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
          <ValueDisplay label="Created at" value={formatShortDateTime(createdAt)} isLoading={isLoading} />
          <ValueDisplay label="Last modified" value={formatShortDateTime(lastModifiedAt)} isLoading={isLoading} />
        </ValueDisplayGroup>
      }
    />
  );
}
