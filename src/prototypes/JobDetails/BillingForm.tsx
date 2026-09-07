import { MouseEvent, useEffect, useState } from "react";

import AvatarClient from "../../components/Avatar/AvatarClient";
import Button from "../../components/Button/Button";
import Card from "../../components/Card/Card";
import Dialog from "../../components/Dialog/Dialog";
import GroupLabel from "../../components/GroupLabel/GroupLabel";
import { Icon } from "../../components/Icon/Icon";
import HintTrigger from "../../components/Hint/HintTrigger";
import Input from "../../components/Input/Input";
import ListItem from "../../components/ListItem/ListItem";
import ListItemSlotIcon from "../../components/ListItem/ListItemSlotIcon";
import MenuItem from "../../components/Menu/MenuItem";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import SelectField from "../../components/Fields/SelectField/SelectField";
import SelectListFooter from "../../components/SelectList/SelectListFooter";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { toast } from "../../components/Toast/Toaster";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import { JobLocation, locationCaption } from "./jobData";
import { noop } from "./shared";
import { SelectPopoverList, useSelectPopover } from "../../modules/shared/selectPopover";

import styles from "./BillingForm.module.scss";
import { CLIENTS as DB_CLIENTS } from "../../data/db";
import { joinWithSeparator, TEXT_SEPARATOR } from "../../utils/textSeparator";

// ---- data model -------------------------------------------------------------

export type BillingIntention = "inheritLocation" | "location" | "client" | "differentClient";

export interface Billing {
  intention: BillingIntention;
  /** The chosen client for "differentClient" (else null). */
  clientId: number | null;
}

interface Client {
  id: number;
  name: string;
  type: string;
  active: boolean;
}

// The client pool (Active + Inactive) — the DATABASE's clients since the
// 2026-09-04 migration, with the "Type  ·  Industry" caption built per client.
const CLIENTS: Client[] = DB_CLIENTS.map((client, index) => ({
  id: index + 1,
  name: client.name,
  type: joinWithSeparator(client.clientType, client.industryType),
  active: client.isActive,
}));

// The job's service CLIENT — "Bill to client" resolves to this (the database
// job's client, Wildwood Kitchen).
export const SERVICE_CLIENT = { name: CLIENTS[0].name, caption: CLIENTS[0].type };

/** The radio labels — reused by the activity log so it reads like the form. */
export const BILLING_INTENTION_LABELS: Record<BillingIntention, string> = {
  inheritLocation: "Inherit from location",
  location: "Bill to location",
  client: "Bill to client",
  differentClient: "Bill to different client",
};

/** The picked client's name ("Bill to different client" only). */
export const billingClientName = (clientId: number | null) =>
  clientId == null ? "" : (CLIENTS.find((c) => c.id === clientId)?.name ?? "");

// What the "Inherit from location" option resolves to (the location's own
// billing setting). Fixed for the demo.
const INHERIT_RESOLVED = "Bill to location";

const HINTS: Record<Exclude<BillingIntention, "inheritLocation">, string> = {
  location: "The service location will be responsible for payment",
  client: "The service client will be responsible for payment",
  differentClient: "A different client, not the service recipient, will handle payment",
};

/**
 * The biller shown in the Details panel's Billing intention module. `kind`
 * decides the avatar (location vs client):
 *  - inherit / location → the job's service LOCATION (the Location module's pick)
 *  - client            → the service CLIENT item
 *  - differentClient   → the chosen client item
 */
export function billingSummary(
  b: Billing,
  location: JobLocation,
): { kind: "location" | "client"; name: string; caption: string } {
  if (b.intention === "differentClient" && b.clientId != null) {
    const c = CLIENTS.find((x) => x.id === b.clientId);
    if (c != null) return { kind: "client", name: c.name, caption: c.type };
  }
  if (b.intention === "client") {
    return { kind: "client", ...SERVICE_CLIENT };
  }
  // inheritLocation / location (and an unfinished differentClient) → the location.
  return { kind: "location", name: location.client, caption: locationCaption(location) };
}

// A radio label with a trailing info-hint tooltip.
function HintLabel({ text, hint }: { text: string; hint: string }) {
  return (
    <span className={styles.hintLabel}>
      {text}
      <HoverTooltip text={hint} textAlign="left" tapToShow>
        <HintTrigger />
      </HoverTooltip>
    </span>
  );
}

// ---- the form ---------------------------------------------------------------

interface BillingFormProps {
  open: boolean;
  onClose: () => void;
  initial: Billing;
  onSave: (next: Billing) => void;
  mobile?: boolean;
}

export default function BillingForm({ open, onClose, initial, onSave, mobile = false }: BillingFormProps) {
  const [intention, setIntention] = useState<BillingIntention>(initial.intention);
  const [clientId, setClientId] = useState<number | null>(initial.clientId);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIntention(initial.intention);
    setClientId(initial.clientId);
    setShowError(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const clientPop = useSelectPopover(mobile);
  // Force the client popover shut when the form closes (see SchedulingForm).
  useEffect(() => {
    if (!open) clientPop.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const selectedClient = clientId != null ? CLIENTS.find((c) => c.id === clientId) : undefined;
  // "different client" needs a client — flagged only after a Save attempt.
  const clientError = showError && intention === "differentClient" && clientId == null;

  const dirty = intention !== initial.intention || clientId !== initial.clientId;

  const save = () => {
    if (intention === "differentClient" && clientId == null) {
      setShowError(true);
      return;
    }
    onSave({ intention, clientId: intention === "differentClient" ? clientId : null });
    toast({ type: "success", title: '"Billing intention" module updated' });
    onClose();
  };

  const activeClients = CLIENTS.filter((c) => c.active);
  const inactiveClients = CLIENTS.filter((c) => !c.active);

  // The "Bill to different client" expandable content: pick a client.
  const clientPicker = (
    // preventDefault keeps clicks inside the picker from re-toggling the radio
    // (the whole RadioItem is a <label>).
    <div className={styles.clientPicker} onClick={(e) => e.preventDefault()}>
      <Input label="Default billing client">
        <SelectField
          value={selectedClient?.name}
          isValid={!clientError}
          open={clientPop.open}
          onClick={(e: MouseEvent<HTMLDivElement>) => clientPop.toggle(e.currentTarget)}
        />
      </Input>
      {selectedClient != null && (
        <div className={styles.clientCard}>
          <Card padding={4} onClick={noop}>
            <ListItem
              variant="titleCaption"
              title={selectedClient.name}
              caption={selectedClient.type}
              avatar={<AvatarClient size="xl" type="business" />}
              slotRight={<ListItemSlotIcon icon="angle-right" />}
            />
          </Card>
        </div>
      )}
    </div>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Billing intention"
      breakpoint={mobile ? "mobile" : "desktop"}
      confirmOnDismiss={dirty}
      footer={
        <PopoverFooter
          leadingButton={
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
      <div className={styles.form}>
        <RadioGroup value={intention} onChange={(v) => setIntention(v as BillingIntention)}>
          <RadioItem value="inheritLocation" label="Inherit from location" caption={INHERIT_RESOLVED} />
          <RadioItem value="location" label={<HintLabel text="Bill to location" hint={HINTS.location} />} />
          <RadioItem value="client" label={<HintLabel text="Bill to client" hint={HINTS.client} />} />
          <RadioItem
            value="differentClient"
            label={<HintLabel text="Bill to different client" hint={HINTS.differentClient} />}
            error={clientError}
            content={clientPicker}
          />
        </RadioGroup>
      </div>

      {/* Client picker list — Active + Inactive groups, searchable. */}
      <SelectPopoverList
        pop={clientPop}
        mobile={mobile}
        title="Default billing client"
        searchable
        searchPlaceholder="Search by client name..."
        footer={
          <SelectListFooter variant="menuItem">
            <MenuItem
              label="Add client"
              slotLeft={<Icon icon="plus" pack="regular" size={14} container="square" />}
              onClick={clientPop.close}
            />
          </SelectListFooter>
        }
      >
        <SelectListItemGroup
          label={
            <GroupLabel
              variant="primary"
              label="Active"
              // GroupLabel's slotLeft icon = 14px square (its standard sizing);
              // active = circle-minus solid rotated 90° (a vertical bar disc).
              slotLeft={<Icon icon="circle-minus" pack="solid" size={14} container="square" rotate={90} className={styles.activeDot} />}
            />
          }
        >
          {activeClients.map((c) => (
            <SelectListItem
              key={c.id}
              variant="object"
              avatar={<AvatarClient size="xl" type="business" />}
              label={c.name}
              caption={c.type}
              selected={c.id === clientId}
              onClick={() => {
                setClientId(c.id);
                setShowError(false);
                clientPop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
        <SelectListItemGroup
          label={
            <GroupLabel
              variant="primary"
              label="Inactive"
              slotLeft={<Icon icon="ban" pack="solid" size={14} container="square" className={styles.inactiveDot} />}
            />
          }
        >
          {inactiveClients.map((c) => (
            <SelectListItem
              key={c.id}
              variant="object"
              disabled
              avatar={<AvatarClient size="xl" type="business" />}
              label={c.name}
              caption={c.type}
              onClick={noop}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </Dialog>
  );
}
