import { MouseEvent, useEffect, useRef, useState } from "react";

import Button from "../../components/Button/Button";
import CardFile from "../../components/Card/CardFile";
import Dialog from "../../components/Dialog/Dialog";
import MediaField from "../../components/Fields/MediaField/MediaField";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import TextField from "../../components/Fields/TextField/TextField";
import Input from "../../components/Input/Input";
import Menu from "../../components/Menu/Menu";
import MenuItem from "../../components/Menu/MenuItem";
import MenuItemGroup from "../../components/Menu/MenuItemGroup";
import { Icon } from "../../components/Icon/Icon";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import { ICE_MACHINE_REPAIR_SCHEMA } from "../../modules/formSchema/iceMachineRepairSchema";
import { fieldMap, optionValues } from "../../modules/formSchema/options";
import ObjectCard from "../../modules/shared/ObjectCard";
import { SelectPopoverList, useSelectPopover } from "../../modules/shared/selectPopover";
import {
  Equipment,
  EquipmentAvatar,
  equipmentCaption,
  equipmentCaptionText,
  equipmentLabel,
  equipmentTitle,
} from "./equipment";
import { MediaItem, fileTypeOf, tileSrc } from "./mediaItem";
import { noop, useAnchoredMenu } from "./shared";

import styles from "./HotSideRepairForm.module.scss";

// Labels, help texts, "(optional)" flags, select/radio options and `accept`
// come from the SCHEMA (src/modules/formSchema/iceMachineRepairSchema.ts) — the
// same data the read-only preview is built from, so the two cannot drift apart.
const F = fieldMap(ICE_MACHINE_REPAIR_SCHEMA);
const labelOf = (key: string) => F[key].label ?? "";
const isOptional = (key: string) => F[key].optional === true;
const optionsOf = (key: string) => {
  const f = F[key];
  return f.type === "select" || f.type === "radio" ? (f.options ?? []) : [];
};

type YesNo = "" | "Yes" | "No";

// ---- the draft --------------------------------------------------------------

export interface IceMachineDraft {
  checkIn: string;
  equipmentId: string | null;
  reportedIssue: string;
  operatingOnArrival: YesNo;
  errorCodes: string;
  binSwitch: YesNo;
  scaleOrGrowth: YesNo;
  unusualNoise: YesNo;
  waterFlow: string;
  refrigerantType: string;
  issuesText: string;
  actionsTaken: string;
  portsCapped: YesNo;
  operatingOnDeparture: YesNo;
  checkOut: string;
  partsPicture: YesNo;
  /** Media per field key (dateTag / wideShot / … / finalVideo). */
  media: Record<string, MediaItem[]>;
}

export const emptyIceMachineDraft = (): IceMachineDraft => ({
  checkIn: "",
  equipmentId: null,
  reportedIssue: "",
  operatingOnArrival: "",
  errorCodes: "",
  binSwitch: "",
  scaleOrGrowth: "",
  unusualNoise: "",
  waterFlow: "",
  refrigerantType: "",
  issuesText: "",
  actionsTaken: "",
  portsCapped: "",
  operatingOnDeparture: "",
  checkOut: "",
  partsPicture: "",
  media: {},
});

/** Anything filled at all — Save progress only changes the row state when true. */
export const iceMachineDraftHasContent = (d: IceMachineDraft) =>
  JSON.stringify({ ...d, media: {} }) !== JSON.stringify({ ...emptyIceMachineDraft(), media: {} }) ||
  Object.values(d.media).some((files) => files.length > 0);

interface IceMachineRepairFormProps {
  open: boolean;
  onClose: () => void;
  /** Dialog title (= the form's name). */
  title?: string;
  /** The job's live Equipment-module list (the Equipment picker rows). */
  equipment: Equipment[];
  /** The saved draft to prefill (null = fresh form). */
  initial: IceMachineDraft | null;
  /** Save progress — no validation; the parent stores the draft + row state. */
  onSaveProgress: (draft: IceMachineDraft) => void;
  /** Submit — called only after full validation passes. */
  onSubmit: (draft: IceMachineDraft) => void;
  mobile?: boolean;
}

// The "Ice Machine - Repair" form (Figma 24564-137511 "Edit"): the same shape
// as Hot Side - Repair — a Dialog with a FLAT field list of check-in/out
// TextFields, the Equipment object picker, Yes/No card radios, two option
// SELECTS (water flow + refrigerant type), TextAreas, and nine MediaFields.
// Only the two compressor-tag uploads are "(optional)". Submit validates +
// scrolls to the first error; focusing an invalid field clears all error
// states; Save progress saves and closes.
export default function IceMachineRepairForm({
  open,
  onClose,
  title = "Ice Machine - Repair",
  equipment,
  initial,
  onSaveProgress,
  onSubmit,
  mobile = false,
}: IceMachineRepairFormProps) {
  const [draft, setDraft] = useState<IceMachineDraft>(emptyIceMachineDraft());
  const [showErrors, setShowErrors] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const equipmentPop = useSelectPopover(mobile);
  const waterFlowPop = useSelectPopover(mobile);
  const refrigerantPop = useSelectPopover(mobile);
  // The ⋯ menu of one file card (its field key + file index).
  const cardMenu = useAnchoredMenu(!mobile);
  const [menuTarget, setMenuTarget] = useState<{ key: string; index: number } | null>(null);

  useEffect(() => {
    if (!open) {
      cardMenu.close();
      equipmentPop.close();
      waterFlowPop.close();
      refrigerantPop.close();
      return;
    }
    setDraft(initial != null ? (JSON.parse(JSON.stringify(initial)) as IceMachineDraft) : emptyIceMachineDraft());
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = <K extends keyof IceMachineDraft>(key: K, value: IceMachineDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const filesOf = (key: string) => draft.media[key] ?? [];
  const addMedia = (key: string, picked: File[]) =>
    setDraft((prev) => ({
      ...prev,
      media: {
        ...prev.media,
        [key]: [
          ...(prev.media[key] ?? []),
          // Every file gets an object URL (the preview downloads from it); only
          // the previewable kinds show it as the card's image.
          ...picked.map((file) => ({
            name: file.name,
            type: fileTypeOf(file),
            src: URL.createObjectURL(file),
            size: file.size,
          })),
        ],
      },
    }));
  const removeMedia = (key: string, index: number) =>
    setDraft((prev) => ({ ...prev, media: { ...prev.media, [key]: (prev.media[key] ?? []).filter((_, i) => i !== index) } }));

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial ?? emptyIceMachineDraft());

  const selectedEquipment = equipment.find((e) => e.id === draft.equipmentId);
  // Frozen while the list is open (the layout-freeze rule) — the card under the
  // field must not push the trigger away from the anchored list.
  const shownEquipment = equipmentPop.freeze(selectedEquipment);
  // Sorted by equipment name A→Z (the design annotation).
  const sortedEquipment = [...equipment].sort((a, b) => equipmentLabel(a).localeCompare(equipmentLabel(b)));

  // ---- validation ------------------------------------------------------------
  // Everything except the two compressor tags is required (the app-wide
  // "required unless (optional)" rule).
  const bad: Record<string, boolean> = {
    checkIn: draft.checkIn.trim() === "",
    equipment: draft.equipmentId == null,
    reportedIssue: draft.reportedIssue.trim() === "",
    operatingOnArrival: draft.operatingOnArrival === "",
    dateTag: filesOf("dateTag").length === 0,
    wideShot: filesOf("wideShot").length === 0,
    errorCodes: draft.errorCodes.trim() === "",
    binSwitch: draft.binSwitch === "",
    scaleOrGrowth: draft.scaleOrGrowth === "",
    unusualNoise: draft.unusualNoise === "",
    waterFlow: draft.waterFlow === "",
    refrigerantType: draft.refrigerantType === "",
    // "Issues found" is two required fields sharing one label.
    issuesText: draft.issuesText.trim() === "",
    issuesMedia: filesOf("issuesMedia").length === 0,
    actionsTaken: draft.actionsTaken.trim() === "",
    iceProduction1: filesOf("iceProduction1").length === 0,
    iceProduction2: filesOf("iceProduction2").length === 0,
    iceProduction3: filesOf("iceProduction3").length === 0,
    portsCapped: draft.portsCapped === "",
    operatingOnDeparture: draft.operatingOnDeparture === "",
    finalVideo: filesOf("finalVideo").length === 0,
    checkOut: draft.checkOut.trim() === "",
    partsPicture: draft.partsPicture === "",
  };
  // The order the form shows them — Submit scrolls to the FIRST bad one.
  const FIELD_ORDER = [
    "checkIn",
    "equipment",
    "reportedIssue",
    "operatingOnArrival",
    "dateTag",
    "wideShot",
    "errorCodes",
    "binSwitch",
    "scaleOrGrowth",
    "unusualNoise",
    "waterFlow",
    "refrigerantType",
    "issuesText",
    "issuesMedia",
    "actionsTaken",
    "iceProduction1",
    "iceProduction2",
    "iceProduction3",
    "portsCapped",
    "operatingOnDeparture",
    "finalVideo",
    "checkOut",
    "partsPicture",
  ];

  const submit = () => {
    const firstBad = FIELD_ORDER.find((k) => bad[k]);
    if (firstBad != null) {
      setShowErrors(true);
      setTimeout(() => {
        bodyRef.current?.querySelector(`[data-qid="${firstBad}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 0);
      return;
    }
    onSubmit(draft);
    onClose();
  };

  const saveProgress = () => {
    onSaveProgress(draft);
    onClose();
  };

  // Focusing (or tapping) any invalid field clears ALL error states at once.
  const clearErrors = () => setShowErrors(false);
  const field = (key: string) => ({
    "data-qid": key,
    ...(showErrors && bad[key] ? { onFocus: clearErrors, onPointerDown: clearErrors } : {}),
  });

  // ---- field builders --------------------------------------------------------

  const textField = (key: "checkIn" | "reportedIssue" | "errorCodes" | "checkOut") => {
    const label = labelOf(key);
    return (
      <div {...field(key)} key={key}>
        <Input label={label} labelCondition={isOptional(key) ? "optional" : undefined} helpText={F[key].helpText}>
          <TextField
            value={draft[key]}
            onChange={(e) => set(key, e.target.value)}
            isValid={!(showErrors && bad[key])}
            // Question-style labels break the derived "Enter [Label]" copy —
            // explicit fallback.
            errorMessage={label.endsWith("?") ? "Provide an answer" : undefined}
          />
        </Input>
      </div>
    );
  };

  const textAreaField = (key: "actionsTaken") => (
    <div {...field(key)} key={key}>
      <Input label={labelOf(key)} labelCondition={isOptional(key) ? "optional" : undefined}>
        <TextArea
          value={draft[key]}
          onChange={(e) => set(key, e.target.value)}
          isValid={!(showErrors && bad[key])}
          errorMessage="Provide an answer"
        />
      </Input>
    </div>
  );

  type YesNoKey =
    | "operatingOnArrival"
    | "binSwitch"
    | "scaleOrGrowth"
    | "unusualNoise"
    | "portsCapped"
    | "operatingOnDeparture"
    | "partsPicture";

  const yesNo = (key: YesNoKey) => {
    const schemaField = F[key];
    return (
      <div {...field(key)} key={key}>
        <Input label={labelOf(key)}>
          <RadioGroup
            orientation={schemaField.type === "radio" ? schemaField.orientation : undefined}
            value={draft[key]}
            onChange={(v) => set(key, v as YesNo)}
            isValid={!(showErrors && bad[key])}
            errorMessage="Choose an option"
          >
            {optionsOf(key).map((o) => (
              <RadioItem key={o.value} value={o.value} variant="card" label={o.label ?? o.value} />
            ))}
          </RadioGroup>
        </Input>
      </div>
    );
  };

  // The two option selects. Their wording reads like a Yes/No question, but the
  // design makes them selects on purpose (Daniel confirmed) — the answers are
  // readings, not yes/no.
  type SelectKey = "waterFlow" | "refrigerantType";
  const optionSelect = (key: SelectKey, pop: ReturnType<typeof useSelectPopover>) => (
    <div {...field(key)} key={key}>
      <Input label={labelOf(key)}>
        <SelectField
          value={draft[key] || undefined}
          isValid={!(showErrors && bad[key])}
          open={pop.open}
          onClick={(e: MouseEvent<HTMLDivElement>) => pop.toggle(e.currentTarget)}
        />
      </Input>
    </div>
  );

  const optionPicker = (key: SelectKey, pop: ReturnType<typeof useSelectPopover>) => (
    <SelectPopoverList pop={pop} mobile={mobile} title={labelOf(key)}>
      <SelectListItemGroup>
        {optionValues(optionsOf(key)).map((o) => (
          <SelectListItem
            key={o}
            label={o}
            selected={o === draft[key]}
            onClick={() => {
              set(key, o);
              pop.close();
            }}
          />
        ))}
      </SelectListItemGroup>
    </SelectPopoverList>
  );

  const mediaCards = (key: string) =>
    filesOf(key).map((f, i) => (
      <CardFile
        key={`${f.name}-${i}`}
        name={f.name}
        fileType={f.type}
        previewSrc={tileSrc(f)}
        onMenuClick={(e) => {
          setMenuTarget({ key, index: i });
          cardMenu.onActions(e);
        }}
        menuOpen={cardMenu.open && menuTarget?.key === key && menuTarget?.index === i}
      />
    ));

  const media = (key: string) => {
    const schemaField = F[key];
    const optional = isOptional(key);
    return (
      <div {...field(key)} key={key}>
        <Input label={labelOf(key)} labelCondition={optional ? "optional" : undefined} helpText={schemaField.helpText}>
          <MediaField
            breakpoint={mobile ? "mobile" : "desktop"}
            accept={schemaField.type === "media" ? schemaField.accept : undefined}
            isValid={!(showErrors && !optional && filesOf(key).length === 0)}
            onFilesSelected={(picked) => addMedia(key, picked)}
          >
            {mediaCards(key)}
          </MediaField>
        </Input>
      </div>
    );
  };

  const menuBody = (
    <MenuItemGroup>
      <MenuItem
        label="Remove"
        slotLeft={<Icon icon="xmark" container="square" />}
        onClick={() => {
          if (menuTarget != null) removeMedia(menuTarget.key, menuTarget.index);
          cardMenu.close();
        }}
      />
    </MenuItemGroup>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
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
          <Button size="lg" variant="ghost" leftIcon="save" onClick={saveProgress}>
            Save progress
          </Button>
          <Button size="lg" variant="solid" onClick={submit}>
            Submit
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.form} ref={bodyRef}>
        {textField("checkIn")}

        {/* Equipment — the object picker: an INLINE list, and the pick shows as
            a card 12px below the field. The card is frozen while the list is
            open (the layout-freeze rule). */}
        <div {...field("equipment")}>
          <div className={styles.objectField}>
            <Input label={labelOf("equipment")}>
              <SelectField
                value={selectedEquipment != null ? equipmentLabel(selectedEquipment) : undefined}
                isValid={!(showErrors && bad.equipment)}
                open={equipmentPop.open}
                onClick={(e: MouseEvent<HTMLDivElement>) => equipmentPop.toggle(e.currentTarget)}
              />
            </Input>
            {shownEquipment != null && (
              <ObjectCard
                avatar={<EquipmentAvatar equipment={shownEquipment} />}
                title={equipmentTitle(shownEquipment)}
                caption={equipmentCaptionText(shownEquipment)}
                onClick={noop}
              />
            )}
          </div>
        </div>

        {textField("reportedIssue")}
        {yesNo("operatingOnArrival")}
        {media("dateTag")}
        {media("wideShot")}
        {textField("errorCodes")}
        {yesNo("binSwitch")}
        {yesNo("scaleOrGrowth")}
        {yesNo("unusualNoise")}
        {optionSelect("waterFlow", waterFlowPop)}
        {optionSelect("refrigerantType", refrigerantPop)}

        {/* "Issues found" — TWO fields sharing the label, each with its own
            help text; both required. */}
        <div {...field("issuesText")}>
          <Input label={labelOf("issuesText")} helpText={F.issuesText.helpText}>
            <TextArea
              value={draft.issuesText}
              onChange={(e) => set("issuesText", e.target.value)}
              isValid={!(showErrors && bad.issuesText)}
              errorMessage="Provide an answer"
            />
          </Input>
        </div>
        {media("issuesMedia")}

        {textAreaField("actionsTaken")}
        {media("iceProduction1")}
        {media("iceProduction2")}
        {media("iceProduction3")}
        {media("oldCompressorTag")}
        {media("newCompressorTag")}
        {yesNo("portsCapped")}
        {yesNo("operatingOnDeparture")}
        {media("finalVideo")}
        {textField("checkOut")}
        {yesNo("partsPicture")}
      </div>

      {/* The Equipment picker — the same INLINE object list the other forms
          use (single select, search, A→Z). */}
      <SelectPopoverList
        pop={equipmentPop}
        mobile={mobile}
        title={labelOf("equipment")}
        searchable
        searchPlaceholder="Search by equipment name..."
        state={equipment.length === 0 ? "empty" : "default"}
        emptyState={{
          icon: "cube",
          title: "No equipment here yet",
          caption: "Add equipment to see it here",
        }}
        noResultsCaption="Try a different search or add a new equipment"
      >
        <SelectListItemGroup>
          {sortedEquipment.map((e) => (
            <SelectListItem
              key={e.id}
              variant="object"
              label={equipmentTitle(e)}
              searchText={`${equipmentLabel(e)} ${equipmentCaption(e)}`}
              caption={equipmentCaptionText(e)}
              avatar={<EquipmentAvatar equipment={e} />}
              selected={e.id === draft.equipmentId}
              onClick={() => {
                set("equipmentId", e.id);
                equipmentPop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>

      {optionPicker("waterFlow", waterFlowPop)}
      {optionPicker("refrigerantType", refrigerantPop)}

      {/* The file-card ⋯ menu — desktop anchored card / mobile drawer. */}
      {mobile ? (
        <Menu open={cardMenu.open} onClose={cardMenu.close} breakpoint="mobile">
          {menuBody}
        </Menu>
      ) : (
        cardMenu.pos != null && (
          <div
            ref={cardMenu.cardRef}
            className={styles.cardMenu}
            style={{ top: cardMenu.pos.top, left: cardMenu.pos.left, right: cardMenu.pos.right }}
          >
            <Menu open={cardMenu.open} onClose={cardMenu.close} breakpoint="desktop">
              {menuBody}
            </Menu>
          </div>
        )
      )}
    </Dialog>
  );
}
