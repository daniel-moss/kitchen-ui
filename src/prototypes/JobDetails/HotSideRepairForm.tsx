import { MouseEvent, useEffect, useRef, useState } from "react";

import Button from "../../components/Button/Button";
import CardFile from "../../components/Card/CardFile";
import { FileType } from "../../components/Card/CardFile.types";
import Dialog from "../../components/Dialog/Dialog";
import MediaField from "../../components/Fields/MediaField/MediaField";
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
import { HOT_SIDE_REPAIR_SCHEMA } from "../../forms/formSchema/hotSideRepairSchema";
import { fieldMap } from "../../forms/formSchema/options";
import { useAnchoredMenu } from "./shared";

import styles from "./HotSideRepairForm.module.scss";

// Labels, help texts, "(optional)" flags, radio options and `accept` come from
// the SCHEMA (src/forms/formSchema/hotSideRepairSchema.ts) — the same data the
// read-only preview is built from, so the two cannot drift apart.
const F = fieldMap(HOT_SIDE_REPAIR_SCHEMA);
const labelOf = (key: string) => F[key].label ?? "";
const isOptional = (key: string) => F[key].optional === true;

type YesNo = "" | "Yes" | "No";

/** One picked file, kept as CardFile props (object URL previews). */
export interface MediaItem {
  name: string;
  type: FileType;
  src?: string;
}

// The media fields, in ORDER of appearance (interleaved with the text fields
// below). accept: photo fields take image/* (mobile offers the camera), the
// video recap video/*, the Issues-found media anything.
const fileTypeOf = (file: File): FileType => {
  if (file.type === "image/gif") return "gif";
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type === "application/pdf") return "pdf";
  return "generic";
};

// ---- the draft --------------------------------------------------------------

export interface HotSideDraft {
  checkIn: string;
  equipmentName: string;
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
  standaloneQuote: YesNo;
  /** Media per field key (dateTag / wideShot / … / issuesMedia / finalVideo). */
  media: Record<string, MediaItem[]>;
}

export const emptyHotSideDraft = (): HotSideDraft => ({
  checkIn: "",
  equipmentName: "",
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
  standaloneQuote: "",
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
  /** The saved draft to prefill (null = fresh form). */
  initial: HotSideDraft | null;
  /** Save progress — no validation; the parent stores the draft + row state. */
  onSaveProgress: (draft: HotSideDraft) => void;
  /** Submit — called only after full validation passes. */
  onSubmit: (draft: HotSideDraft) => void;
  mobile?: boolean;
}

// The "Hot Side - Repair" form (Figma 23920-13390): a standard Dialog with a
// FLAT field list — check-in/out TextFields (help texts under the labels),
// Yes/No card radios, TextAreas, and ELEVEN MediaFields (photo/video uploads;
// picked files render as CardFiles with a ⋯ → Remove menu). "Issues found" is
// the Input textAreaMedia pair — BOTH the text and at least one file are
// required (Daniel). Ten fields are "(optional)" per the node. Submit
// validates + scrolls to the first error; focusing an invalid field clears
// all error states; Save progress saves and closes.
export default function HotSideRepairForm({
  open,
  onClose,
  title = "Hot Side - Repair",
  initial,
  onSaveProgress,
  onSubmit,
  mobile = false,
}: HotSideRepairFormProps) {
  const [draft, setDraft] = useState<HotSideDraft>(emptyHotSideDraft());
  const [showErrors, setShowErrors] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  // The ⋯ menu of one file card (its field key + file index).
  const cardMenu = useAnchoredMenu(!mobile, "end");
  const [menuTarget, setMenuTarget] = useState<{ key: string; index: number } | null>(null);

  useEffect(() => {
    if (!open) {
      cardMenu.close();
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
          ...picked.map((file) => ({
            name: file.name,
            type: fileTypeOf(file),
            src:
              file.type.startsWith("image/") || file.type.startsWith("video/")
                ? URL.createObjectURL(file)
                : undefined,
          })),
        ],
      },
    }));
  const removeMedia = (key: string, index: number) =>
    setDraft((prev) => ({ ...prev, media: { ...prev.media, [key]: (prev.media[key] ?? []).filter((_, i) => i !== index) } }));

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial ?? emptyHotSideDraft());

  // ---- validation ------------------------------------------------------------
  const bad: Record<string, boolean> = {
    checkIn: draft.checkIn.trim() === "",
    equipmentName: draft.equipmentName.trim() === "",
    reportedIssue: draft.reportedIssue.trim() === "",
    operatingOnArrival: draft.operatingOnArrival === "",
    dateTag: filesOf("dateTag").length === 0,
    wideShot: filesOf("wideShot").length === 0,
    // "Issues found" requires BOTH the note and at least one file (Daniel).
    issues: draft.issuesText.trim() === "" || filesOf("issuesMedia").length === 0,
    actionsTaken: draft.actionsTaken.trim() === "",
    functioningOnDeparture: draft.functioningOnDeparture === "",
    needReturn: draft.needReturn === "",
    partsPicture: draft.partsPicture === "",
    finalVideo: filesOf("finalVideo").length === 0,
    checkOut: draft.checkOut.trim() === "",
    standaloneQuote: draft.standaloneQuote === "",
  };
  const FIELD_ORDER = [
    "checkIn",
    "equipmentName",
    "reportedIssue",
    "operatingOnArrival",
    "dateTag",
    "wideShot",
    "issues",
    "actionsTaken",
    "functioningOnDeparture",
    "needReturn",
    "partsPicture",
    "finalVideo",
    "checkOut",
    "standaloneQuote",
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

  const textField = (key: "checkIn" | "equipmentName" | "reportedIssue" | "temperature" | "checkOut") => {
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

  const yesNo = (
    key: "operatingOnArrival" | "functioningOnDeparture" | "needReturn" | "partsPicture" | "standaloneQuote",
  ) => {
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
        previewSrc={f.src}
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
        {textField("equipmentName")}
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

        {/* "Issues found" — the textAreaMedia pair; BOTH parts required. */}
        <div {...field("issues")}>
          <Input label={labelOf("issuesText")}>
            <TextArea
              value={draft.issuesText}
              onChange={(e) => set("issuesText", e.target.value)}
              isValid={!(showErrors && draft.issuesText.trim() === "")}
            />
            <MediaField
              breakpoint={mobile ? "mobile" : "desktop"}
              isValid={!(showErrors && filesOf("issuesMedia").length === 0)}
              onFilesSelected={(picked) => addMedia("issuesMedia", picked)}
            >
              {mediaCards("issuesMedia")}
            </MediaField>
          </Input>
        </div>

        {textAreaField("actionsTaken")}
        {media("postFlame")}
        {media("postElectrical")}
        {yesNo("functioningOnDeparture")}
        {yesNo("needReturn")}
        {yesNo("partsPicture")}
        {textAreaField("safetyConcerns")}
        {media("finalVideo")}
        {textField("checkOut")}
        {yesNo("standaloneQuote")}
      </div>

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
