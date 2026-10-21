import { useEffect, useState } from "react";

import Button from "../../../components/Button/Button";
import Dialog from "../../../components/Dialog/Dialog";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import { toast } from "../../../components/Toast/Toaster";
import { LaborItem, QUICKBOOKS_ACCOUNTS } from "../../../data/db";
import useIsDesktop from "../../../hooks/useIsDesktop";
import AccountField, { accountValue } from "../../Product/NewProductForm/AccountField";

// The labor rate's "Accounting" edit form (Figma 25-5041): a default Dialog
// titled "Accounting" with the module's one editable field — the shared
// "Revenue account" input (parent captions, A→Z as text, a lone account shown
// read-only). The sync status is not here: nobody types it.
//
// The account is always required here, so it can be changed but not cleared.

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

export default function EditAccountingDialog({ open, onClose, rate, onSave, breakpoint = "auto" }: EditAccountingDialogProps) {
  const mobile = !useIsDesktop(breakpoint);

  const [accountId, setAccountId] = useState<string | null>(rate.quickbooksAccountId ?? null);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAccountId(rate.quickbooksAccountId ?? null);
    setShowErrors(false);
  }, [open, rate]);

  const chosen = accountValue(QUICKBOOKS_ACCOUNTS, accountId);
  const dirty = chosen !== (rate.quickbooksAccountId ?? null);

  const save = async () => {
    if (chosen == null) {
      setShowErrors(true);
      return;
    }

    if ((await onSave(chosen)) === false) {
      toast({
        type: "error",
        variant: "detailed",
        title: 'Couldn\'t update "Accounting" module',
        caption: "Something went wrong. Please try again.",
      });
      return;
    }

    toast({ type: "success", title: '"Accounting" module updated' });
    onClose();
  };

  return (
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
          <Button size="lg" variant="solid" onClick={save}>
            Save
          </Button>
        </PopoverFooter>
      }
    >
      <AccountField
        label="Revenue account"
        accounts={QUICKBOOKS_ACCOUNTS}
        value={accountId}
        onChange={setAccountId}
        showErrors={showErrors}
        mobile={mobile}
      />
    </Dialog>
  );
}
