import { MouseEvent, useEffect, useState } from "react";

import AlertBanner from "../../../components/AlertBanner/AlertBanner";
import Button from "../../../components/Button/Button";
import Dialog from "../../../components/Dialog/Dialog";
import SelectField from "../../../components/Fields/SelectField/SelectField";
import Input from "../../../components/Input/Input";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import { toast } from "../../../components/Toast/Toaster";
import { LaborItem, QUICKBOOKS_ACCOUNTS, QuickbooksAccount } from "../../../data/db";
import useIsDesktop from "../../../hooks/useIsDesktop";
import { SelectPopoverList, useSelectPopover } from "../../shared/selectPopover";
import { accountLabelOf } from "../laborRateData";

// The labor rate's "Accounting" edit form (Figma 25-5041): a default Dialog
// titled "Accounting" with the module's one editable field — the QuickBooks
// revenue account.
//
// The sync status is not here: nobody types it, and production only ever
// reports it.
//
// The account is REQUIRED under the detailed line-item scheme, which is the
// only setup where this dialog exists at all — so the field can be changed but
// not cleared. With NOTHING synced from QuickBooks there is no option to pick,
// so the field gives way to the create form's warning banner: a picker with an
// empty list is a control that cannot do anything.

interface EditAccountingDialogProps {
  open: boolean;
  onClose: () => void;
  rate: LaborItem;
  /**
   * Save. Return `false` (or a Promise of it) to say the save FAILED: the form
   * shows the designed error toast and stays open with the value intact.
   */
  onSave: (quickbooksAccountId: string) => void | boolean | Promise<void | boolean>;
  breakpoint?: "auto" | "desktop" | "mobile";
}

/**
 * "Sorted by number from 0 to 9 and then by name from A to Z" — numbered
 * accounts first, the unnumbered ones after them alphabetically (the create
 * form's own order).
 */
const byAccount = (a: QuickbooksAccount, b: QuickbooksAccount) => {
  if (a.number && b.number) return a.number.localeCompare(b.number) || a.name.localeCompare(b.name);
  if (a.number) return -1;
  if (b.number) return 1;
  return a.name.localeCompare(b.name);
};

export default function EditAccountingDialog({ open, onClose, rate, onSave, breakpoint = "auto" }: EditAccountingDialogProps) {
  const mobile = !useIsDesktop(breakpoint);

  const [accountId, setAccountId] = useState<string | undefined>(rate.quickbooksAccountId);
  const [showErrors, setShowErrors] = useState(false);

  const pop = useSelectPopover(mobile);

  useEffect(() => {
    if (!open) return;
    setAccountId(rate.quickbooksAccountId);
    setShowErrors(false);
  }, [open, rate]);

  const nothingSynced = QUICKBOOKS_ACCOUNTS.length === 0;
  const missingAccount = !nothingSynced && accountId == null;
  const dirty = accountId !== rate.quickbooksAccountId;

  const save = async () => {
    if (missingAccount || accountId == null) {
      setShowErrors(true);
      return;
    }

    if ((await onSave(accountId)) === false) {
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

  const chosen = QUICKBOOKS_ACCOUNTS.find((account) => account.id === accountId);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title="Accounting"
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
            <Button size="lg" variant="solid" isDisabled={nothingSynced} onClick={save}>
              Save
            </Button>
          </PopoverFooter>
        }
      >
        {nothingSynced ? (
          <AlertBanner status="warning" orientation="vertical">
            No QuickBooks accounts have been synced yet. Run a sync in the QuickBooks Web Connector, then set the account.
          </AlertBanner>
        ) : (
          <Input label="QuickBooks revenue account">
            <SelectField
              value={chosen == null ? undefined : accountLabelOf(chosen)}
              open={pop.open}
              onClick={(event: MouseEvent<HTMLDivElement>) => pop.toggle(event.currentTarget)}
              isValid={!(showErrors && missingAccount)}
            />
          </Input>
        )}
      </Dialog>

      <SelectPopoverList pop={pop} mobile={mobile} title="QuickBooks revenue account" searchable searchPlaceholder="Account...">
        <SelectListItemGroup>
          {[...QUICKBOOKS_ACCOUNTS].sort(byAccount).map((account) => (
            <SelectListItem
              key={account.id}
              label={accountLabelOf(account)}
              selected={account.id === accountId}
              onClick={() => {
                setAccountId(account.id);
                pop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </>
  );
}
