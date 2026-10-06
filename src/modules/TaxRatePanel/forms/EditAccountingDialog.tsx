import { MouseEvent, useEffect, useState } from "react";

import Button from "../../../components/Button/Button";
import Dialog from "../../../components/Dialog/Dialog";
import SelectField from "../../../components/Fields/SelectField/SelectField";
import Input from "../../../components/Input/Input";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import { toast } from "../../../components/Toast/Toaster";
import { QUICKBOOKS_VENDORS, TaxRateItem } from "../../../data/db";
import useIsDesktop from "../../../hooks/useIsDesktop";
import { SelectPopoverList, useSelectPopover } from "../../shared/selectPopover";

// The tax rate's "Accounting" edit form (Figma 25-5041): a default Dialog
// titled "Tax rate accounting" with the module's one editable field — the
// QuickBooks collection agency.
//
// The sync status is not here: nobody types it, and production only ever
// reports it.
//
// The agency is REQUIRED on QuickBooks Desktop, and this dialog only exists on
// companies that have the integration — so the field cannot be cleared, only
// changed. "Choose QuickBooks tax collection agency" is what SelectField
// derives from the label, so the error needs no override.

interface EditAccountingDialogProps {
  open: boolean;
  onClose: () => void;
  rate: TaxRateItem;
  /**
   * Save. Return `false` (or a Promise of it) to say the save FAILED: the form
   * shows the designed error toast and stays open with the value intact.
   */
  onSave: (quickbooksVendorId: string) => void | boolean | Promise<void | boolean>;
  breakpoint?: "auto" | "desktop" | "mobile";
}

export default function EditAccountingDialog({ open, onClose, rate, onSave, breakpoint = "auto" }: EditAccountingDialogProps) {
  const mobile = !useIsDesktop(breakpoint);

  const [vendorId, setVendorId] = useState<string | undefined>(rate.quickbooksVendorId);
  const [showErrors, setShowErrors] = useState(false);

  const pop = useSelectPopover(mobile);

  useEffect(() => {
    if (!open) return;
    setVendorId(rate.quickbooksVendorId);
    setShowErrors(false);
  }, [open, rate]);

  const missingVendor = vendorId == null;
  const dirty = vendorId !== rate.quickbooksVendorId;

  const save = async () => {
    if (missingVendor) {
      setShowErrors(true);
      return;
    }

    if ((await onSave(vendorId)) === false) {
      toast({
        type: "error",
        variant: "detailed",
        title: 'Could not update "Accounting" module',
        caption: "Something went wrong. Please try again.",
      });
      return;
    }

    toast({ type: "success", title: '"Accounting" module updated' });
    onClose();
  };

  const vendorName = QUICKBOOKS_VENDORS.find((vendor) => vendor.id === vendorId)?.name;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title="Tax rate accounting"
        breakpoint={breakpoint}
        confirmOnDismiss={dirty}
        footer={
          <PopoverFooter
            slotLeft={
              <Button size="lg" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            }
          >
            <Button size="lg" variant="solid" onClick={save}>
              Save
            </Button>
          </PopoverFooter>
        }
      >
        <Input label="QuickBooks tax collection agency">
          <SelectField
            value={vendorName}
            open={pop.open}
            onClick={(event: MouseEvent<HTMLDivElement>) => pop.toggle(event.currentTarget)}
            isValid={!(showErrors && missingVendor)}
          />
        </Input>
      </Dialog>

      <SelectPopoverList pop={pop} mobile={mobile} title="QuickBooks tax collection agency" searchable searchPlaceholder="Vendor...">
        <SelectListItemGroup>
          {[...QUICKBOOKS_VENDORS]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((vendor) => (
              <SelectListItem
                key={vendor.id}
                label={vendor.name}
                selected={vendor.id === vendorId}
                onClick={() => {
                  setVendorId(vendor.id);
                  pop.close();
                }}
              />
            ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </>
  );
}
