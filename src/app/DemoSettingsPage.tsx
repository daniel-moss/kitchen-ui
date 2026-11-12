import { MouseEvent, ReactNode, useState } from "react";

import AlertBanner from "../components/AlertBanner/AlertBanner";
import Button from "../components/Button/Button";
import SelectField from "../components/Fields/SelectField/SelectField";
import TextField from "../components/Fields/TextField/TextField";
import FormModule from "../components/FormModule/FormModule";
import FormModuleGroup from "../components/FormModule/FormModuleGroup";
import Input from "../components/Input/Input";
import SelectListItem from "../components/SelectList/SelectListItem";
import SelectListItemGroup from "../components/SelectList/SelectListItemGroup";
import { toast } from "../components/Toast/Toaster";
import ToggleItem from "../components/Toggle/ToggleItem";
import TopBarNav from "../components/TopBarNav/TopBarNav";
import TopBarNavLeftElements from "../components/TopBarNav/TopBarNavLeftElements";
import TopBarNavTitle from "../components/TopBarNav/TopBarNavTitle";
import {
  CompanySettings,
  CompanySubStatusSettings,
  QUICKBOOKS_ASSET_ACCOUNTS,
  QUICKBOOKS_COGS_ACCOUNTS,
  QuickbooksAccount,
} from "../data/db";
import useIsDesktop, { Breakpoint } from "../hooks/useIsDesktop";
import { SelectPopoverList, useSelectPopover } from "../modules/shared/selectPopover";

import { AppBottomBar, Page } from "./shell/appShell";
import TechStatusesSettings from "./TechStatusesSettings";
import { useCompanySettings } from "./store/CompanySettingsStore";

import appStyles from "./App.module.scss";
import styles from "./DemoSettingsPage.module.scss";

// The "Demo settings" page (Daniel, 2026-11-12) — a DEMO TOOL, not product UI,
// so no Figma draws it. It switches the service company's settings that have
// no UI of their own, and the rest of the Demo follows them: turn the pause
// sub-statuses off and the "Pause job" dialog stops asking for one.
//
// Only the settings the Demo actually READS are here — every one in the
// database's `CompanySettings`. Production has many more; they join when a
// part of the Demo starts to use them.
//
// Every change applies at once and is saved in this browser (see
// `CompanySettingsStore`). "Reset to defaults" goes back to the database's own
// values.

const SUB_STATUS_ROWS: {
  key: "active" | "quickPaused" | "onHold";
  required: keyof CompanySubStatusSettings;
  label: string;
  caption: string;
}[] = [
  {
    key: "active",
    required: "activeRequired",
    label: "Active sub-statuses",
    caption: "The Start and Resume dialogs ask for an active status",
  },
  {
    key: "quickPaused",
    required: "quickPausedRequired",
    label: "Pause sub-statuses",
    caption: "The Pause dialog asks for a pause status",
  },
  {
    key: "onHold",
    required: "onHoldRequired",
    label: "On hold sub-statuses",
    caption: "The Hold dialog asks for an on hold status",
  },
];

const JOB_ID_MODES: {
  value: CompanySettings["jobCustomIdGenerationMode"];
  label: string;
}[] = [
  { value: "off", label: "Off" },
  { value: "manual", label: "Manual" },
  { value: "automatic", label: "Automatic" },
];

const INTEGRATIONS: {
  value: CompanySettings["accountingIntegration"];
  label: string;
}[] = [
  { value: "none", label: "None" },
  { value: "apideck", label: "APIDeck" },
  { value: "quickbooksDesktop", label: "QuickBooks Desktop" },
];

// Production's own names for the two schemes (`QuickbooksLineItemScheme`).
const LINE_ITEM_SCHEMES: {
  value: CompanySettings["quickbooksLineItemScheme"];
  label: string;
}[] = [
  { value: "splitGeneric", label: "Generic split line items" },
  { value: "splitDetailed", label: "Detailed split line items" },
];

/** 5 to 60 minutes in steps of 5 (Daniel, 2026-11-12). The Demo's duration format: "55 min", "1 hr". */
const ROUNDING_STEPS = Array.from({ length: 12 }, (_, i) => (i + 1) * 5).map((minutes) => ({
  value: String(minutes),
  label: minutes === 60 ? "1 hr" : `${minutes} min`,
}));

/** Production's limits: up to 100 files per upload. The size has no upper limit there. */
const MAX_FILES_LIMIT = 100;

const accountLabel = (account: QuickbooksAccount) =>
  account.number != null ? `${account.number} · ${account.name}` : account.name;

// ---- fields ----------------------------------------------------------------

/** A SelectField over a short list of choices — the Demo's standard select. */
function ChoiceField<T extends string>({
  label,
  helpText,
  value,
  options,
  onChange,
  mobile,
  noneLabel,
}: {
  label: string;
  helpText?: ReactNode;
  value: T | undefined;
  options: { value: T; label: string }[];
  onChange: (next: T | undefined) => void;
  mobile: boolean;
  /** Adds a first row that clears the value — for an optional setting. */
  noneLabel?: string;
}) {
  const pop = useSelectPopover(mobile);
  const selected = options.find((option) => option.value === value);
  return (
    <>
      <Input label={label} helpText={helpText}>
        <SelectField
          value={selected?.label ?? noneLabel}
          open={pop.open}
          onClick={(event: MouseEvent<HTMLDivElement>) => pop.toggle(event.currentTarget)}
        />
      </Input>
      <SelectPopoverList pop={pop} mobile={mobile} title={label}>
        <SelectListItemGroup>
          {noneLabel != null && (
            <SelectListItem
              label={noneLabel}
              selected={value == null}
              onClick={() => {
                onChange(undefined);
                pop.close();
              }}
            />
          )}
          {options.map((option) => (
            <SelectListItem
              key={option.value}
              label={option.label}
              selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                pop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </>
  );
}

/**
 * A text setting. It keeps its own DRAFT, so a value that is not valid yet (an
 * empty required name, "0" files) can be typed through without reaching the
 * Demo; the setting changes only while the draft is valid.
 */
function TextSetting({
  label,
  labelCondition,
  helpText,
  value,
  onCommit,
  validate,
  keyboard,
  suffix,
}: {
  label: string;
  labelCondition?: "optional";
  helpText?: ReactNode;
  value: string;
  onCommit: (next: string) => void;
  /** An error message for a draft that must not be saved, or undefined. */
  validate?: (draft: string) => string | undefined;
  keyboard?: "text" | "email" | "tel" | "numeric";
  suffix?: ReactNode;
}) {
  const [draft, setDraft] = useState(value);
  const error = validate?.(draft);
  return (
    <Input label={label} labelCondition={labelCondition} helpText={helpText}>
      <TextField
        value={draft}
        keyboard={keyboard}
        suffix={suffix}
        isValid={error == null}
        errorMessage={error}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          if (validate?.(next) == null) onCommit(next);
        }}
      />
    </Input>
  );
}

const required = (what: string) => (draft: string) => (draft.trim() === "" ? `Enter ${what}` : undefined);

const wholeNumber = (min: number, max?: number) => (draft: string) => {
  if (!/^\d+$/.test(draft.trim())) return "Enter a whole number";
  const n = Number(draft);
  if (n < min) return `Enter ${min} or more`;
  if (max != null && n > max) return `Enter ${max} or less`;
  return undefined;
};

// ---- the form --------------------------------------------------------------

function SettingsForm({ mobile }: { mobile: boolean }) {
  const { settings, update } = useCompanySettings();
  const sub = settings.subStatuses;
  const setSub = (patch: Partial<CompanySubStatusSettings>) => update({ subStatuses: { ...sub, ...patch } });
  const onQuickbooks = settings.accountingIntegration === "quickbooksDesktop";

  return (
    <FormModuleGroup>
      <FormModule title="Company" caption="Shown in the sidebar and in a job's public view">
        <TextSetting
          label="Company name"
          value={settings.name}
          validate={required("company name")}
          onCommit={(next) => update({ name: next })}
        />
        <ToggleItem
          label="Company logo"
          caption="Off: the first letter of the company name shows instead"
          checked={settings.logo != null}
          onChange={(event) =>
            update({
              logo: event.target.checked ? { light: "roopairs-light.svg", dark: "roopairs-dark.svg" } : undefined,
            })
          }
        />
        <TextSetting
          label="Email"
          keyboard="email"
          value={settings.email}
          validate={required("email")}
          onCommit={(next) => update({ email: next })}
        />
        <TextSetting
          label="Phone"
          labelCondition="optional"
          keyboard="tel"
          value={settings.phone ?? ""}
          onCommit={(next) => update({ phone: next.trim() === "" ? undefined : next })}
        />
        <TextSetting
          label="Phone extension"
          labelCondition="optional"
          keyboard="numeric"
          value={settings.phoneExtension ?? ""}
          onCommit={(next) => update({ phoneExtension: next.trim() === "" ? undefined : next })}
        />
      </FormModule>

      <FormModule title="Jobs">
        <ChoiceField
          label="Custom job ID"
          helpText="Manual shows the Job ID field in the New job form and requires a value"
          value={settings.jobCustomIdGenerationMode}
          options={JOB_ID_MODES}
          onChange={(next) => next != null && update({ jobCustomIdGenerationMode: next })}
          mobile={mobile}
        />
        {SUB_STATUS_ROWS.map((row) => (
          <div key={row.key} className={styles.pair}>
            <ToggleItem
              label={row.label}
              caption={row.caption}
              checked={sub[row.key]}
              onChange={(event) => setSub({ [row.key]: event.target.checked })}
            />
            <ToggleItem
              className={styles.nested}
              label="Required"
              caption="Off: the field is optional"
              checked={sub[row.required]}
              disabled={!sub[row.key]}
              onChange={(event) => setSub({ [row.required]: event.target.checked })}
            />
          </div>
        ))}
      </FormModule>

      <FormModule title="Time tracking">
        <ToggleItem
          label="Round time up"
          caption="Logged time rounds up to the rounding step, and the Timesheet shows the exact time on hover. Production does not have this setting yet"
          checked={settings.roundsTimeUp}
          onChange={(event) => update({ roundsTimeUp: event.target.checked })}
        />
        <ChoiceField
          label="Rounding step"
          helpText={settings.roundsTimeUp ? undefined : "Used only when Round time up is on"}
          value={String(settings.timeRoundingStepMinutes)}
          options={ROUNDING_STEPS}
          onChange={(next) => next != null && update({ timeRoundingStepMinutes: Number(next) })}
          mobile={mobile}
        />
      </FormModule>

      <TechStatusesSettings mobile={mobile} />

      <FormModule title="Files">
        <TextSetting
          label="Max files per upload"
          keyboard="numeric"
          helpText={`Production allows up to ${MAX_FILES_LIMIT}`}
          value={String(settings.maxFileUploads)}
          validate={wholeNumber(1, MAX_FILES_LIMIT)}
          onCommit={(next) => update({ maxFileUploads: Number(next) })}
        />
        <TextSetting
          label="Max file size"
          keyboard="numeric"
          suffix="MB"
          value={String(settings.maxFileUploadSizeMb)}
          validate={wholeNumber(1)}
          onCommit={(next) => update({ maxFileUploadSizeMb: Number(next) })}
        />
      </FormModule>

      <FormModule title="Accounting">
        <ChoiceField
          label="Accounting integration"
          helpText="QuickBooks Desktop gives tax rates a collection agency and a sync state"
          value={settings.accountingIntegration}
          options={INTEGRATIONS}
          onChange={(next) => next != null && update({ accountingIntegration: next })}
          mobile={mobile}
        />
        <ChoiceField
          label="QuickBooks line item scheme"
          helpText={
            onQuickbooks
              ? "Detailed gives labor rates and products their own revenue account"
              : "Used only with QuickBooks Desktop"
          }
          value={settings.quickbooksLineItemScheme}
          options={LINE_ITEM_SCHEMES}
          onChange={(next) => next != null && update({ quickbooksLineItemScheme: next })}
          mobile={mobile}
        />
        <ChoiceField
          label="Default cost of goods account"
          helpText="A new inventory product opens with it"
          value={settings.quickbooksDefaultCogsAccountId}
          options={QUICKBOOKS_COGS_ACCOUNTS.map((account) => ({
            value: account.id,
            label: accountLabel(account),
          }))}
          onChange={(next) => update({ quickbooksDefaultCogsAccountId: next })}
          mobile={mobile}
          noneLabel="No default"
        />
        <ChoiceField
          label="Default asset account"
          helpText="A new inventory product opens with it"
          value={settings.quickbooksDefaultAssetAccountId}
          options={QUICKBOOKS_ASSET_ACCOUNTS.map((account) => ({
            value: account.id,
            label: accountLabel(account),
          }))}
          onChange={(next) => update({ quickbooksDefaultAssetAccountId: next })}
          mobile={mobile}
          noneLabel="No default"
        />
      </FormModule>

      <FormModule title="Pricebook">
        <ToggleItem
          label="Require subtypes"
          caption="Off: the Subtype field is optional and offers a No subtype row"
          checked={settings.requireSubtypes}
          onChange={(event) => update({ requireSubtypes: event.target.checked })}
        />
        <ToggleItem
          label="Use taxes"
          caption="Off: every Taxability field and row disappears"
          checked={settings.useTaxes}
          onChange={(event) => update({ useTaxes: event.target.checked })}
        />
        <ToggleItem
          label="New labor rates are taxable"
          caption="What the Taxability field opens on"
          checked={settings.pricebookDefaultTaxableLabor}
          disabled={!settings.useTaxes}
          onChange={(event) => update({ pricebookDefaultTaxableLabor: event.target.checked })}
        />
        <ToggleItem
          label="New products are taxable"
          caption="What the Taxability field opens on"
          checked={settings.pricebookDefaultTaxableProduct}
          disabled={!settings.useTaxes}
          onChange={(event) => update({ pricebookDefaultTaxableProduct: event.target.checked })}
        />
      </FormModule>

      <FormModule title="Inventory">
        <ToggleItem
          label="Inventory"
          caption="Off: the New product form has no Inventory module"
          checked={settings.featureInventoryEnabled}
          onChange={(event) => update({ featureInventoryEnabled: event.target.checked })}
        />
        <ToggleItem
          label="New products track inventory"
          caption="What the Stock type opens on"
          checked={settings.defaultTrackInventory}
          disabled={!settings.featureInventoryEnabled}
          onChange={(event) => update({ defaultTrackInventory: event.target.checked })}
        />
      </FormModule>
    </FormModuleGroup>
  );
}

// ---- the page --------------------------------------------------------------

export default function DemoSettingsPage({
  breakpoint = "auto",
  onNavigate,
}: {
  breakpoint?: Breakpoint;
  onNavigate: (next: Page) => void;
}) {
  const mobile = !useIsDesktop(breakpoint);
  const { reset, isDefault } = useCompanySettings();
  // Bumped by Reset, so every field drops its draft and re-reads the setting.
  const [generation, setGeneration] = useState(0);

  const resetButton = (
    <Button
      size="lg"
      variant="ghost"
      isDisabled={isDefault}
      onClick={() => {
        reset();
        setGeneration((n) => n + 1);
        toast({ type: "success", title: "Settings reset to defaults" });
      }}
    >
      Reset to defaults
    </Button>
  );

  const body = (
    <div className={styles.scroll}>
      <div className={styles.column}>
        <AlertBanner status="info" orientation="vertical">
          These settings change the service company for the whole Demo. They are saved in this browser only.
        </AlertBanner>
        <SettingsForm key={generation} mobile={mobile} />
      </div>
    </div>
  );

  const topBar = (
    <TopBarNav className={appStyles.topBar} breakpoint={mobile ? "mobile" : "desktop"} actions={resetButton}>
      <TopBarNavLeftElements>
        <TopBarNavTitle title="Demo settings" />
      </TopBarNavLeftElements>
    </TopBarNav>
  );

  return mobile ? (
    <div className={appStyles.mobile}>
      {topBar}
      {body}
      <AppBottomBar page="settings" onNavigate={onNavigate} />
    </div>
  ) : (
    <div className={appStyles.workArea}>
      {topBar}
      {body}
    </div>
  );
}
