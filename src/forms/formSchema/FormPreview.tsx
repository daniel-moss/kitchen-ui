import clsx from "clsx";

import CardFile from "../../components/Card/CardFile";
import FormModule from "../../components/FormModule/FormModule";
import FormModuleGroup from "../../components/FormModule/FormModuleGroup";
import ListItem from "../../components/ListItem/ListItem";
import ListItemSlotIcon from "../../components/ListItem/ListItemSlotIcon";
import ValueDisplay from "../../components/ValueDisplay/ValueDisplay";
import ValueDisplayGroup from "../../components/ValueDisplay/ValueDisplayGroup";

import { FileType } from "../../components/Card/CardFile.types";

import { buildFormPreview, buildPreviewSteps } from "./answerText";
import { FormPreviewProps } from "./FormPreview.types";
import { FormMediaAnswer, PreviewAnswer, PreviewModule } from "./schema.types";

import styles from "./FormPreview.module.scss";

/** Only these kinds show their image in the card tile; the rest get the placeholder. */
const isPreviewable = (type: FileType) => type === "image" || type === "gif" || type === "video";

/**
 * What the tile shows: the file itself for a picture, the POSTER frame for a
 * video (the tile is an `<img>` — a video file cannot be its own thumbnail).
 */
const tileSrc = (file: FormMediaAnswer) =>
  file.type === "video" ? file.poster : isPreviewable(file.type) ? file.src : undefined;

// FormPreview — a completed form, read-only. The structure mirrors the form
// one-to-one (Figma "Mapping / FormModuleGroup -> Preview" 24470-39311):
// FormModuleGroup (32px + Divider between modules) → FormModule (title +
// caption) → ValueDisplayGroup (answers 12px apart, Divider between each) →
// a vertical ValueDisplay per answer. A form with NO modules (Hot Side -
// Repair) previews as one flat ValueDisplayGroup, without a FormModule.
//
// A STEPPER form (PM - HVAC) adds one level above that (Figma "Mapping / Step
// -> Preview" 24631-58494): the steps are stacked 64px apart, each step's NAME
// sits above its content as an h2, 32px above it, and the content below is the
// step's own modules — FormModules when it has them, the flat answer list when
// it does not.
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
                previewSrc={tileSrc(file)}
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

  // One module: a FormModule (title + caption) around its answers, or the bare
  // answer list when the module has no title.
  const renderModule = (module: PreviewModule) => {
    const body = <ValueDisplayGroup key={module.id}>{module.answers.map(renderAnswer)}</ValueDisplayGroup>;
    if (module.title == null) return body;
    return (
      <FormModule key={module.id} title={module.title} caption={module.caption}>
        {body}
      </FormModule>
    );
  };

  // A stepper form: the step's name over the step's content. A single untitled
  // module is the flat answer list — FormModuleGroup adds nothing then (no
  // divider without a second module), so the same call covers both shapes.
  if (modules.some((module) => module.step != null)) {
    return (
      <div className={clsx(styles.steps, className)}>
        {buildPreviewSteps(modules).map((step) => (
          <section key={step.title} className={styles.step}>
            <h2 className={styles.stepTitle}>{step.title}</h2>
            <FormModuleGroup>{step.modules.map(renderModule)}</FormModuleGroup>
          </section>
        ))}
      </div>
    );
  }

  return <FormModuleGroup className={className}>{modules.map(renderModule)}</FormModuleGroup>;
}
