import { useEffect, useState } from "react";

import AvatarProduct from "../../components/Avatar/AvatarProduct";
import Button from "../../components/Button/Button";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import Dialog from "../../components/Dialog/Dialog";
import TextArea from "../../components/Fields/TextArea/TextArea";
import Input from "../../components/Input/Input";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import ItemTextBlock from "../../components/ItemText/ItemText/ItemTextBlock";
import ListItem from "../../components/ListItem/ListItem";
import ListItemSlotIcon from "../../components/ListItem/ListItemSlotIcon";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import { toast } from "../../components/Toast/Toaster";

import { Charge, PRODUCT_ITEMS } from "../../data/db";

import { Scheduling } from "./SchedulingForm";
import styles from "./CancelJobForm.module.scss";

import DismissCancelButton from "../shared/DismissCancelButton";

interface CancelJobFormProps {
  open: boolean;
  onClose: () => void;
  /** The current scheduling — the form mirrors the page's Scheduled for / Duration. */
  scheduling: Scheduling;
  /** Cancels the job with the (required) reason. */
  onCancel: (reason: string) => void;
  /**
   * The job's product lines tracked in inventory (db `inventoryProductsOf`).
   * Any → the "returned to stock" block below the reason. Default none.
   */
  inventoryProducts?: Charge[];
  mobile?: boolean;
}

// "Cancel job" form (Figma 24048-13210: 24047-12612 desktop / 24047-12610
// mobile). The required reason first, then — only when the job has products
// tracked in inventory — the block saying they go back to stock. It is NOT a
// text dialog any more (Daniel, 2026-10-25): on mobile the drawer hugs its
// content, the field keeps its default size, and the drawer has a drag handle
// instead of the close button. The destructive "Cancel" button confirms.
export default function CancelJobForm({ open, onClose, onCancel, inventoryProducts = [], mobile = false }: CancelJobFormProps) {
  const [reason, setReason] = useState("");
  // The cancel reason is mandatory — attempting to cancel while empty shows the
  // error; typing clears it.
  const [showError, setShowError] = useState(false);
  useEffect(() => {
    if (!open) {
      setReason("");
      setShowError(false);
    }
  }, [open]);

  const cancelJob = () => {
    if (reason.trim() === "") {
      setShowError(true);
      return;
    }
    onCancel(reason);
    // "Job", not the id (Figma 24048-13258, re-read 2026-10-22).
    toast({ type: "success", title: "Job cancelled" });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Cancel job"
      breakpoint={mobile ? "mobile" : "desktop"}
      drawerHeader="default"
      confirmOnDismiss={reason !== ""}
      footer={
        // The two buttons name the two OUTCOMES, not the dialog (Daniel,
        // 2026-10-04): leaving is "Don't cancel", going through with it is
        // "Cancel". The dialog's own title already says which job.
        <PopoverFooter leadingButton={<DismissCancelButton>Don&apos;t cancel</DismissCancelButton>}>
          <Button size="lg" variant="danger" leftIcon="ban" onClick={cancelJob}>
            Cancel
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.body}>
        <Input label="Cancel reason" helpText="Why was this job cancelled?">
          <TextArea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (showError) setShowError(false);
            }}
            isValid={!showError}
            // "Provide Cancel reason" — the Input's default, from its label
            // (Figma 24048-13141).
          />
        </Input>
        {/* Inventory products (Figma 27245-63091): only when the job uses
            products tracked in inventory, only those, all of them (no
            truncation). Each row is the PRODUCT — its name, its description
            ("No Description" when it has none), the quantity going back on the
            right — and will open the Product page in a new tab; the click does
            nothing yet (Daniel, 2026-10-22). */}
        {inventoryProducts.length > 0 && (
          <DisplayModule
            variant="bodyOnly"
            status="info"
            banner={{
              children:
                inventoryProducts.length === 1
                  ? "Cancelling will return this product to stock"
                  : "Cancelling will return these products to stock",
            }}
            bodyPadded={false}
            content={
              <ItemGroup>
                {inventoryProducts.map((line) => {
                  const product = PRODUCT_ITEMS.find((p) => p.id === line.productId);
                  return (
                    <ListItem
                      key={line.id}
                      variant="titleCaption"
                      title={product?.name ?? line.title}
                      caption={product?.summary || "No Description"}
                      avatar={<AvatarProduct size="xl" />}
                      right={<ItemTextBlock align="right" variant="title" title={`+${line.qty ?? 1}`} />}
                      slotRight={<ListItemSlotIcon icon="arrow-up-right" />}
                      isClickable
                      onClick={() => {}}
                    />
                  );
                })}
              </ItemGroup>
            }
          />
        )}
      </div>
    </Dialog>
  );
}
