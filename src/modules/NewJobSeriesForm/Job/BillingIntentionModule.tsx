import { MouseEvent, useState } from "react";

import AlertBanner from "../../../components/AlertBanner/AlertBanner";
import AvatarClient from "../../../components/Avatar/AvatarClient";
import AvatarLocation from "../../../components/Avatar/AvatarLocation";
import Card from "../../../components/Card/Card";
import SelectField from "../../../components/Fields/SelectField/SelectField";
import FormModule from "../../../components/FormModule/FormModule";
import GroupLabel from "../../../components/GroupLabel/GroupLabel";
import HintTrigger from "../../../components/Hint/HintTrigger";
import { Icon } from "../../../components/Icon/Icon";
import Input from "../../../components/Input/Input";
import InputHelpText from "../../../components/InputHelpText/InputHelpText";
import ListItem from "../../../components/ListItem/ListItem";
import ListItemSlotIcon from "../../../components/ListItem/ListItemSlotIcon";
import MenuItem from "../../../components/Menu/MenuItem";
import RadioGroup from "../../../components/Radio/RadioGroup";
import RadioItem from "../../../components/Radio/RadioItem";
import SelectListFooter from "../../../components/SelectList/SelectListFooter";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import HoverTooltip from "../../../components/Tooltip/HoverTooltip";
import { clientById } from "../../../data/db";
import { BillingIntention, Client } from "../../../data/db/types";
import { joinWithSeparator } from "../../../utils/textSeparator";
import { SelectPopoverList, useSelectPopover } from "../../shared/selectPopover";

import { BillingIntentionModuleProps } from "./BillingIntentionModule.types";
import { clientIssues, clientsSorted } from "./newJobData";
import styles from "./BillingIntentionModule.module.scss";

// The "Billing Intention" module of the "New Job" form (Figma 17157-42112):
// who will likely be billed. Auto-populated from the picked location (the
// location's default wins, then the client's, then "Bill to this location" —
// wired in NewJobForm). The warning treatment (credit limit reached / billing
// address missing) lives on the "different client" path only — the service
// client's own issues already warn in the Location module. The rows' side
// panels and "Add client" are out of scope, so those stay non-interactive.

const TIP =
  "Consider this a starting point for billing — it can be revised anytime during the job or when invoicing.";

// Dismissing the tip hides it forever, like the Location module's.
let tipDismissedForever = false;

// The radio labels' tooltips (the Figma "Tooltips" frame).
const TOOLTIPS: Record<BillingIntention, string> = {
  location: "The location will be responsible for the payment",
  client: "The service client will be responsible for the payment",
  differentClient: "A different client will handle the payment",
};

/**
 * The step-validation rule for this module (Next gating): an intention is
 * picked; "different client" also needs a billing client WITHOUT issues —
 * "it's not allowed to go to the next step without fixing the issues".
 */
export const isBillingValid = (value: { intention: BillingIntention | null; billingClientId: string | null }): boolean => {
  if (value.intention == null) return false;
  if (value.intention !== "differentClient") return true;
  if (value.billingClientId == null) return false;
  const client = clientById(value.billingClientId);
  return client != null && clientIssues(client).length === 0;
};

const label = (text: string, intention: BillingIntention) => (
  <span className={styles.labelRow}>
    {text}
    <HoverTooltip text={TOOLTIPS[intention]}>
      <HintTrigger />
    </HoverTooltip>
  </span>
);

export default function BillingIntentionModule({
  value,
  onChange,
  location,
  showErrors = false,
  mobile,
}: BillingIntentionModuleProps) {
  const [tipDismissed, setTipDismissed] = useState(tipDismissedForever);
  const pop = useSelectPopover(mobile);

  const serviceClient = location.clientId ? clientById(location.clientId) : undefined;
  const billingClient = value.billingClientId ? clientById(value.billingClientId) : undefined;
  const billingIssues = billingClient ? clientIssues(billingClient) : [];
  // The location's parent client is never on the billing list.
  const candidates = clientsSorted().filter((client) => client.id !== location.clientId);

  const setIntention = (intention: BillingIntention) =>
    onChange({ intention, billingClientId: intention === "differentClient" ? value.billingClientId : null });

  // The radio-content rows are hoverable no-ops (Daniel, 2026-09-08) — they
  // would open the side panels; the billing-client card's row stays static.
  const clientRow = (client: Client, clickable = false) =>
    clickable ? (
      <ListItem
        variant="titleCaption"
        title={client.name}
        caption={joinWithSeparator(client.clientType, client.industryType)}
        avatar={<AvatarClient size="xl" />}
        slotRight={<ListItemSlotIcon icon="angle-right" />}
        isClickable
        onClick={() => {}}
      />
    ) : (
      <ListItem
        variant="titleCaption"
        title={client.name}
        caption={joinWithSeparator(client.clientType, client.industryType)}
        avatar={<AvatarClient size="xl" />}
        slotRight={<ListItemSlotIcon icon="angle-right" />}
      />
    );

  // "Bill to this location" keeps the location-focused row (the 2026-09-07
  // card treatment applies to the Location module's card ONLY). Missing
  // values show placeholders per the ListItem Template doc (27171-15212).
  const locationRow = (
    <ListItem
      variant="titleCaption"
      title={location.address}
      titleLines="wrap"
      caption={location.name ?? <span className={styles.placeholderText}>No Location name</span>}
      avatar={<AvatarLocation size="xl" />}
      slotRight={<ListItemSlotIcon icon="angle-right" />}
      isClickable
      onClick={() => {}}
    />
  );

  const differentClientContent = (
    <div className={styles.stack}>
      <Input label="Billing client">
        <SelectField
          value={billingClient?.name}
          open={pop.open}
          isValid={!(showErrors && value.intention === "differentClient" && !value.billingClientId)}
          onClick={(event: MouseEvent<HTMLDivElement>) => pop.toggle(event.currentTarget)}
        />
      </Input>
      {billingClient && (
        <div className={styles.cardStack}>
          <Card
            padding={4}
            status={billingIssues.length > 0 ? "warning" : undefined}
            banner={
              billingIssues.length > 0
                ? { children: "Some details require your attention!", ctaLabel: "Review" }
                : undefined
            }
          >
            {clientRow(billingClient)}
          </Card>
          {/* The issues help text sits INSIDE the content slot, 6px below
              the client card (node 24069-36510). */}
          {showErrors && billingIssues.length > 0 && (
            <InputHelpText status="error" slotLeft>
              Fix the issues or select another client
            </InputHelpText>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <FormModule
        title="Billing intention"
        caption="Select who will likely be billed for this service"
        titleHintContent={tipDismissed ? TIP : undefined}
        banner={
          !tipDismissed && (
            <AlertBanner
              type="card"
              orientation="vertical"
              status="info"
              onDismiss={() => {
                tipDismissedForever = true;
                setTipDismissed(true);
              }}
            >
              {TIP}
            </AlertBanner>
          )
        }
      >
        <RadioGroup
          value={value.intention ?? undefined}
          onChange={(next) => setIntention(next as BillingIntention)}
          isValid={!(showErrors && value.intention == null)}
          errorMessage="Choose who will be billed for the service"
        >
          <RadioItem
            value="location"
            label={label("Bill to this location", "location")}
            // The row sits 4px from every content-slot side (the node).
            content={value.intention === "location" ? <div className={styles.rowPad}>{locationRow}</div> : undefined}
            contentPadded={false}
          />
          <RadioItem
            value="client"
            label={label("Bill to client", "client")}
            content={
              value.intention === "client" && serviceClient ? (
                <div className={styles.rowPad}>{clientRow(serviceClient, true)}</div>
              ) : undefined
            }
            contentPadded={false}
          />
          <RadioItem
            value="differentClient"
            label={label("Bill to different client", "differentClient")}
            // A blocked Next highlights THIS card while its billing client is
            // missing or has unresolved issues (Figma 22389-30838).
            error={
              showErrors &&
              value.intention === "differentClient" &&
              (value.billingClientId == null || billingIssues.length > 0)
            }
            content={value.intention === "differentClient" ? differentClientContent : undefined}
          />
        </RadioGroup>
      </FormModule>

      {/* The "Billing client" SelectList (Figma 23810-15294). "Add client"
          waits for the New Client form (out of scope). */}
      <SelectPopoverList
        pop={pop}
        mobile={mobile}
        title="Billing client"
        searchable={candidates.length > 0}
        searchPlaceholder="Client..."
        noResultsCaption="Try a different search or add a new client"
        state={candidates.length === 0 ? "empty" : "default"}
        emptyState={{
          icon: "building-user",
          title: "No clients here yet",
          caption: "Add a client to see it here",
          actionLabel: "Add client",
          onAction: () => {},
        }}
        footer={
          candidates.length > 0 ? (
            <SelectListFooter>
              <MenuItem label="Add client" slotLeft={<Icon icon="plus" pack="regular" size={14} container="square" />} onClick={() => {}} />
            </SelectListFooter>
          ) : undefined
        }
      >
        <SelectListItemGroup
          label={
            <GroupLabel
              variant="primary"
              label="Active"
              slotLeft={
                <Icon icon="circle-minus" pack="solid" size={14} container="square" rotate={90} className={styles.activeIcon} />
              }
            />
          }
        >
          {candidates
            .filter((client) => client.isActive)
            .map((client) => (
              <SelectListItem
                key={client.id}
                variant="object"
                label={client.name}
                caption={joinWithSeparator(client.clientType, client.industryType)}
                avatar={<AvatarClient size="xl" />}
                searchText={client.name}
                selected={value.billingClientId === client.id}
                onClick={() => onChange({ intention: "differentClient", billingClientId: client.id })}
              />
            ))}
        </SelectListItemGroup>
        <SelectListItemGroup
          label={
            <GroupLabel
              variant="primary"
              label="Inactive"
              slotLeft={<Icon icon="ban" pack="solid" size={14} container="square" className={styles.inactiveIcon} />}
            />
          }
          divider={false}
        >
          {candidates
            .filter((client) => !client.isActive)
            .map((client) => (
              <SelectListItem
                key={client.id}
                variant="object"
                label={client.name}
                caption={joinWithSeparator(client.clientType, client.industryType)}
                avatar={<AvatarClient size="xl" />}
                searchText={client.name}
                disabled
              />
            ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </>
  );
}
