import CardFile from "../../components/Card/CardFile";
import FormModule from "../../components/FormModule/FormModule";
import FormModuleGroup from "../../components/FormModule/FormModuleGroup";
import ListItem from "../../components/ListItem/ListItem";
import ListItemSlotIcon from "../../components/ListItem/ListItemSlotIcon";
import ValueDisplay from "../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../components/ValueDisplay/ValueDisplayGroup";

import { FileType } from "../../components/Card/CardFile.types";

import { buildFormPreview } from "./answerText";
import { FormPreviewProps } from "./FormPreview.types";
import { PreviewAnswer } from "./schema.types";

/** Only these kinds show their image in the card tile; the rest get the placeholder. */
const isPreviewable = (type: FileType) => type === "image" || type === "gif" || type === "video";

// FormPreview — a completed form, read-only. The structure mirrors the form
// one-to-one (Figma "Mapping / FormModuleGroup -> Preview" 24470-39311):
// FormModuleGroup (32px + Divider between modules) → FormModule (title +
// caption) → ValueDisplayGroup (answers 12px apart, Divider between each) →
// a vertical ValueDisplay per answer. A form with NO modules (Hot Side -
// Repair) previews as one flat ValueDisplayGroup, without a FormModule.
//
// What the form shows and the preview does NOT: the AlertBanner, help texts,
// the "(optional)" tags and the title's hint icon.
export default function FormPreview({ schema, answers, onFileMenuClick, openFileMenu, className }: FormPreviewProps) {
  const modules = buildFormPreview(schema, answers);

  // A completed form always has answers, so this is a guard, not a state.
  if (modules.length === 0) return null;

  // One answer → one vertical ValueDisplay. The kind comes from the mapping
  // (Figma 24469-37438): shortText / longText / files / objectCard.
  const renderAnswer = (answer: PreviewAnswer) => {
    switch (answer.kind) {
      case "shortText":
        return (
          <ValueDisplay
            key={answer.key}
            orientation="vertical"
            kind="shortText"
            label={answer.label}
            value={answer.value}
            slotLeft={answer.slotLeft}
          />
        );
      case "longText":
        // No line limit — "No truncation in preview mode".
        return (
          <ValueDisplay key={answer.key} orientation="vertical" kind="longText" label={answer.label} value={answer.value} />
        );
      case "files":
        return (
          <ValueDisplay
            key={answer.key}
            orientation="vertical"
            kind="files"
            label={answer.label}
            files={answer.files.map((file, index) => (
              <CardFile
                key={`${file.name}-${index}`}
                name={file.name}
                fileType={file.type}
                previewSrc={isPreviewable(file.type) ? file.src : undefined}
                onMenuClick={
                  onFileMenuClick ? (event) => onFileMenuClick(file, answer.key, index, event) : undefined
                }
                menuOpen={openFileMenu?.key === answer.key && openFileMenu?.index === index}
              />
            ))}
          />
        );
      case "objectCard":
        // A ListItem inside a Card is always STATIC — the Card owns the click
        // and the interaction states (Daniel, 2026-08-06). ValueDisplay owns
        // that Card and takes no click handler yet, so opening the object is
        // not wired here (flagged).
        return (
          <ValueDisplay
            key={answer.key}
            orientation="vertical"
            kind="objectCard"
            label={answer.label}
            card={
              <ListItem
                variant="titleCaption"
                title={answer.object.title}
                caption={answer.object.caption}
                avatar={answer.object.avatar}
                slotRight={<ListItemSlotIcon icon="angle-right" />}
                isClickable={false}
              />
            }
          />
        );
    }
  };

  return (
    <FormModuleGroup className={className}>
      {modules.map((module) => {
        const body = <ValueDisplayGroup key={module.id}>{module.answers.map(renderAnswer)}</ValueDisplayGroup>;
        if (module.title == null) return body;
        return (
          <FormModule key={module.id} title={module.title} caption={module.caption}>
            {body}
          </FormModule>
        );
      })}
    </FormModuleGroup>
  );
}
