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

import { Charge } from "../../data/db";

import { Scheduling } from "./SchedulingForm";
import styles from "./CancelJobForm.module.scss";

import textDialog from "../shared/textDialog.module.scss";

interface CancelJobFormProps {
  open: boolean;
  onClose: () => void;
  /** The current scheduling — the form mirrors the page's Scheduled for / Duration. */
  scheduling: Scheduling;
  /** Cancels the job with the (required) reason. */
  onCancel: (reason: string) => void;
  /**
   * The job's product lines tracked in inventory (db `inventoryProductsOf`).
   * Any → the "returned to stock" block above the reason. Default none.
   */
  inventoryProducts?: Charge[];
  mobile?: boolean;
}

// "Cancel job" form (Figma 24047-12612 desktop / 24047-12610 mobile). Its body
// is ONE TextArea, which makes it a TEXT DIALOG: on mobile the drawer fills the
// screen (`fillHeight`) and the field stretches to use all of it — the shared
// `textDialog` rules, the same ones EditNotesDialog uses. Desktop keeps the DS
// TextArea's own 4-row minimum (the node draws 88px). The destructive
// "Cancel job" button confirms.
export default function CancelJobForm({ open, onClose, onCancel, inventoryProducts = [], mobile = false }: CancelJobFormProps) {
  const hasProducts = inventoryProducts.length > 0;
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

  const reasonField = (
    <Input
      label="Cancel reason"
      helpText="Why was this job cancelled?"
      className={mobile && !hasProducts ? textDialog.fillField : undefined}
    >
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
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Cancel job"
      breakpoint={mobile ? "mobile" : "desktop"}
      // A TEXT dialog only while the reason is its one field: with the products
      // block above it, the drawer hugs its content (Figma 27154-49932).
      fillHeight={!hasProducts}
      confirmOnDismiss={reason !== ""}
      footer={
        // The two buttons name the two OUTCOMES, not the dialog (Daniel,
        // 2026-10-04): leaving is "Don't cancel", going through with it is
        // "Cancel". The dialog's own title already says which job.
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Don&apos;t cancel
            </Button>
          }
        >
          <Button size="lg" variant="danger" leftIcon="ban" onClick={cancelJob}>
            Cancel
          </Button>
        </PopoverFooter>
      }
    >
      {hasProducts ? (
        <div className={styles.body}>
          {/* Inventory products (Figma 27154-49934): only when the job uses
              products tracked in inventory, only those, all of them. Each row
              names the product, the quantity going back on the right, and will
              open the product's page in a new tab — the click does nothing yet
              (Daniel, 2026-10-22). */}
          <DisplayModule
            variant="bodyOnly"
            status="info"
            banner={{ children: "Products tracked in inventory will be returned to stock" }}
            bodyPadded={false}
            content={
              <ItemGroup>
                {inventoryProducts.map((product) => (
                  <ListItem
                    key={product.id}
                    variant="titleCaption"
                    title={product.title}
                    caption={product.caption}
                    avatar={<AvatarProduct size="xl" />}
                    right={<ItemTextBlock align="right" variant="title" title={`+${product.qty ?? 1}`} />}
                    slotRight={<ListItemSlotIcon icon="arrow-up-right" />}
                    isClickable
                    onClick={() => {}}
                  />
                ))}
              </ItemGroup>
            }
          />
          {reasonField}
        </div>
      ) : (
        reasonField
      )}
    </Dialog>
  );
}
