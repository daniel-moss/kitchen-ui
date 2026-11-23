import Prompt from "../../components/Prompt/Prompt";

// The pricebook "Create" forms' entry Prompts (Figma file qhebbfbPHDVnv8IF1EC7Zg,
// "↳ Shared Behavior" → "Can't Classify Subtype" 3254-82594 and "No QuickBooks
// Accounts Synced" 3254-82706; "↳ Tax Rate" → "No Synced Vendors" 3254-82819 —
// Daniel brought them back 2026-11-23). Each one REPLACES the form when the
// user opens it and could not finish it anyway. One "OK", no Cancel.
//
//   cantClassify  labor rate, product, other charge, discount — the user has the
//                 "can't classify subtypes" flag, the company requires subtypes
//                 and has 2 or more for the type.
//   noAccounts    the same four — QuickBooks Desktop with "Detailed Split" and
//                 no INCOME account synced yet.
//   noVendors     tax rate — QuickBooks Desktop (any setting) and no vendor
//                 synced yet.

export type PricebookEntryPromptReason = "cantClassify" | "noAccounts" | "noVendors";

/**
 * Which Prompt, if any, replaces a "Create" form — the conditions above, in
 * one place so every form agrees.
 */
export function entryPromptReason({
  cannotClassifySubtypes = false,
  requireSubtypes = false,
  subtypeCount = 0,
  accountCount,
  vendorCount,
}: {
  cannotClassifySubtypes?: boolean;
  requireSubtypes?: boolean;
  subtypeCount?: number;
  /** The synced income accounts — undefined when the form has no Revenue account field. */
  accountCount?: number;
  /** The synced vendors — undefined when the form has no Tax collection agency field. */
  vendorCount?: number;
}): PricebookEntryPromptReason | null {
  if (vendorCount === 0) return "noVendors";
  if (accountCount === 0) return "noAccounts";
  if (cannotClassifySubtypes && requireSubtypes && subtypeCount >= 2) return "cantClassify";
  return null;
}

interface PricebookEntryPromptProps {
  open: boolean;
  reason: PricebookEntryPromptReason;
  /** The item type, singular — "labor rate", "product", "other charge", "discount". */
  noun: string;
  onClose: () => void;
  breakpoint?: "auto" | "desktop" | "mobile";
}

export default function PricebookEntryPrompt({ open, reason, noun, onClose, breakpoint = "auto" }: PricebookEntryPromptProps) {
  const copy =
    reason === "cantClassify"
      ? {
          title: `You can't create ${noun}s`,
          body: `Every ${noun} needs a subtype, and your account can't choose one. Ask an admin to create the ${noun}.`,
        }
      : reason === "noAccounts"
        ? {
            title: "Sync QuickBooks accounts first",
            body: `No QuickBooks accounts have been synced yet. Run a sync in the QuickBooks Web Connector, then create the ${noun}.`,
          }
        : {
            title: "Sync QuickBooks vendors first",
            body: "No QuickBooks vendors have been synced yet. Run a sync in the QuickBooks Web Connector, then create a tax rate.",
          };

  return (
    <Prompt
      open={open}
      title={copy.title}
      body={copy.body}
      hasCancel={false}
      actionLabel="OK"
      onAction={onClose}
      breakpoint={breakpoint}
    />
  );
}
