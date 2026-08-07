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
import { HOT_SIDE_REPAIR_SCHEMA } from "../../forms/formSchema/hotSideRepairSchema";
import { fieldMap } from "../../forms/formSchema/options";
import {
  Equipment,
  EquipmentAvatar,
  equipmentCaption,
  equipmentCaptionText,
  equipmentLabel,
  equipmentTitle,
} from "./equipment";
import ObjectCard from "../../forms/shared/ObjectCard";
import { SelectPopoverList, useSelectPopover } from "../../forms/shared/selectPopover";
import { fileTypeOf, isPreviewable, MediaItem } from "./mediaItem";
import { noop, useAnchoredMenu } from "./shared";

import styles from "./HotSideRepairForm.module.scss";

// Labels, help texts, "(optional)" flags, radio options and `accept` come from
// the SCHEMA (src/forms/formSchema/hotSideRepairSchema.ts) — the same data the
// read-only preview is built from, so the two cannot drift apart.
const F = fieldMap(HOT_SIDE_REPAIR_SCHEMA);
const labelOf = (key: string) => F[key].label ?? "";
const isOptional = (key: string) => F[key].optional === true;

type YesNo = "" | "Yes" | "No";

// The picked-file shape and its helpers moved to ./mediaItem when the Ice
// Machine form arrived; re-exported so existing imports keep working.
export type { MediaItem } from "./mediaItem";

// ---- the draft --------------------------------------------------------------

export interface HotSideDraft {
  checkIn: string;
  /** The picked equipment (the object select — 2026-08-06 Figma update). */
  equipmentId: number | null;
  reportedIssue: string;
  operatingOnArrival: YesNo;
  temperature: string;
  issuesText: string;
  actionsTaken: string;
  safetyConcerns: string;
  functioningOnDeparture: YesNo;
  needReturn: YesNo;
  partsPicture: YesNo;
  checkOut: string;
  /** Media per field key (dateTag / wideShot / … / issuesMedia / finalVideo). */
  media: Record<string, MediaItem[]>;
}

export const emptyHotSideDraft = (): HotSideDraft => ({
  checkIn: "",
  equipmentId: null,
  reportedIssue: "",
  operatingOnArrival: "",
  temperature: "",
  issuesText: "",
  actionsTaken: "",
  safetyConcerns: "",
  functioningOnDeparture: "",
  needReturn: "",
  partsPicture: "",
  checkOut: "",
  media: {},
});

/** Anything filled at all — Save progress only changes the row state when true. */
export const hotSideDraftHasContent = (d: HotSideDraft) =>
  JSON.stringify({ ...d, media: {} }) !== JSON.stringify({ ...emptyHotSideDraft(), media: {} }) ||
  Object.values(d.media).some((files) => files.length > 0);

interface HotSideRepairFormProps {
  open: boolean;
  onClose: () => void;
  /** Dialog title (= the form's name). */
  title?: string;
  /** The job's live Equipment-module list (the Equipment picker rows). */
  equipment: Equipment[];
  /** The saved draft to prefill (null = fresh form). */
  initial: HotSideDraft | null;
  /** Save progress — no validation; the parent stores the draft + row state. */
  onSaveProgress: (draft: HotSideDraft) => void;
  /** Submit — called only after full validation passes. */
  onSubmit: (draft: HotSideDraft) => void;
  mobile?: boolean;
}

// The "Hot Side - Repair" form (Figma 24461-33288 "Edit"): a standard Dialog
// with a FLAT field list — check-in/out TextFields (help texts under the
// labels), the Equipment object picker, Yes/No card radios, TextAreas, and
// ELEVEN MediaFields (photo/video uploads; picked files render as CardFiles
// with a ⋯ → Remove menu). "Issues found" is TWO fields sharing one label (the
// note and its media, both required — the Input pair was removed from the DS
// on 2026-08-06). Eleven fields are "(optional)". Submit validates + scrolls to
// the first error; focusing an invalid field clears all error states; Save
// progress saves and closes.
export default function HotSideRepairForm({
  open,
  onClose,
  title = "Hot Side - Repair",
  equipment,
  initial,
  onSaveProgress,
  onSubmit,
  mobile = false,
}: HotSideRepairFormProps) {
  const [draft, setDraft] = useState<HotSideDraft>(emptyHotSideDraft());
  const [showErrors, setShowErrors] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const equipmentPop = useSelectPopover(mobile);
  // The ⋯ menu of one file card (its field key + file index).
  const cardMenu = useAnchoredMenu(!mobile);
  const [menuTarget, setMenuTarget] = useState<{ key: string; index: number } | null>(null);

  useEffect(() => {
    if (!open) {
      cardMenu.close();
      equipmentPop.close();
      return;
    }
    setDraft(initial != null ? (JSON.parse(JSON.stringify(initial)) as HotSideDraft) : emptyHotSideDraft());
    setShowErrors(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = <K extends keyof HotSideDraft>(key: K, value: HotSideDraft[K]) =>
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

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial ?? emptyHotSideDraft());

  const selectedEquipment = equipment.find((e) => e.id === draft.equipmentId);
  // Frozen while the list is open (the layout-freeze rule) — the card under the
  // field must not push the trigger away from the anchored list.
  const shownEquipment = equipmentPop.freeze(selectedEquipment);
  // Sorted by equipment name A→Z (the design annotation).
  const sortedEquipment = [...equipment].sort((a, b) => equipmentLabel(a).localeCompare(equipmentLabel(b)));

  // ---- validation ------------------------------------------------------------
  const bad: Record<string, boolean> = {
    checkIn: draft.checkIn.trim() === "",
    equipment: draft.equipmentId == null,
    reportedIssue: draft.reportedIssue.trim() === "",
    operatingOnArrival: draft.operatingOnArrival === "",
    dateTag: filesOf("dateTag").length === 0,
    wideShot: filesOf("wideShot").length === 0,
    // "Issues found" is two required fields sharing one label.
    issuesText: draft.issuesText.trim() === "",
    issuesMedia: filesOf("issuesMedia").length === 0,
    actionsTaken: draft.actionsTaken.trim() === "",
    functioningOnDeparture: draft.functioningOnDeparture === "",
    needReturn: draft.needReturn === "",
    partsPicture: draft.partsPicture === "",
    finalVideo: filesOf("finalVideo").length === 0,
    checkOut: draft.checkOut.trim() === "",
  };
  const FIELD_ORDER = [
    "checkIn",
    "equipment",
    "reportedIssue",
    "operatingOnArrival",
    "dateTag",
    "wideShot",
    "issuesText",
    "issuesMedia",
    "actionsTaken",
    "functioningOnDeparture",
    "needReturn",
    "partsPicture",
    "finalVideo",
    "checkOut",
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

  const textField = (key: "checkIn" | "reportedIssue" | "temperature" | "checkOut") => {
    const label = labelOf(key);
    return (
      <div {...field(key)} key={key}>
        <Input label={label} labelCondition={isOptional(key) ? "optional" : undefined} helpText={F[key].helpText}>
          <TextField
            value={draft[key]}
            onChange={(e) => set(key, e.target.value)}
            isValid={!(showErrors && bad[key])}
            // Question-style labels break the derived "Enter [Label]" copy —
            // explicit fallback (the "Equipment name" derived copy reads fine).
            errorMessage={label.endsWith("?") ? "Provide an answer" : undefined}
          />
        </Input>
      </div>
    );
  };

  const textAreaField = (key: "actionsTaken" | "safetyConcerns") => (
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

  const yesNo = (key: "operatingOnArrival" | "functioningOnDeparture" | "needReturn" | "partsPicture") => {
    const schemaField = F[key];
    const options = schemaField.type === "radio" ? schemaField.options : [];
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
            {options.map((o) => (
              <RadioItem key={o.value} value={o.value} variant="card" label={o.label ?? o.value} />
            ))}
          </RadioGroup>
        </Input>
      </div>
    );
  };

  const mediaCards = (key: string) =>
    filesOf(key).map((f, i) => (
      <CardFile
        key={`${f.name}-${i}`}
        name={f.name}
        fileType={f.type}
        previewSrc={isPreviewable(f.type) ? f.src : undefined}
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
        <Input label={labelOf(key)} labelCondition={optional ? "optional" : undefined}>
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

        {/* Equipment — the object picker (2026-08-06 Figma update; it replaced
            the "Equipment name" text field). An INLINE list, and the pick shows
            as a card 12px below the field (Figma DS 29019-62714); the card is
            frozen while the list is open (the layout-freeze rule). */}
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
        {media("controlPanel")}
        {textField("temperature")}
        {media("amperage")}
        {media("gasSupply")}
        {media("burnerFlame")}
        {/* Design typo "Thermostate" fixed per Daniel. */}
        {media("thermostatVsActual")}
        {media("gasPressure")}
        {media("solenoid")}

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
        {media("postFlame")}
        {media("postElectrical")}
        {yesNo("functioningOnDeparture")}
        {yesNo("needReturn")}
        {yesNo("partsPicture")}
        {textAreaField("safetyConcerns")}
        {media("finalVideo")}
        {textField("checkOut")}
      </div>

      {/* The Equipment picker — the same INLINE object list the Service call
          form uses (single select, search, A→Z). */}
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
