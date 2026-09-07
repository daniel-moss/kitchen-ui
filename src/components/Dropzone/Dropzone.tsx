import { ChangeEvent, DragEvent, useRef, useState } from "react";

import clsx from "clsx";

import Avatar from "../Avatar/Avatar";
import AvatarWarning from "../Avatar/AvatarWarning";

import styles from "./Dropzone.module.scss";
import { DropzoneProps } from "./Dropzone.types";

// Dropzone — the drag-and-drop file input (Figma "Dropzone", 23873-7298).
// A large drop target: drag files onto it, or click (or Enter/Space) to open
// the system file picker. Used bare inside a FormModule — the module header
// labels it, so there is no Label / Input wrapper. The Dropzone only hands
// files over; size / type / count validation and the rejection Toasts are the
// consumer's (the docs page lists the Toast copy).
export default function Dropzone({
  title = "Add up to N files",
  caption = "Drag and drop or click to upload. Up to N MB per file.",
  warningTitle = "You've reached the N-file limit",
  warningCaption = "Remove a file to upload another one",
  isWarning = false,
  isDisabled = false,
  onFilesSelected,
  accept,
  multiple = true,
  _isDragOver = false,
  className,
}: DropzoneProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  // dragenter/dragleave fire per child element — count the depth so moving
  // over the icon or text does not flicker the drag-over state.
  const dragDepth = useRef(0);

  // Disabled wins over warning (the docs): a disabled Dropzone shows the
  // default copy, dimmed. Both are non-interactive.
  const inert = isDisabled || isWarning;
  const warned = isWarning && !isDisabled;
  const showDragOver = (_isDragOver || dragOver) && !inert;

  const handlePicked = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Reset the input, so picking the same file again still fires a change.
    event.target.value = "";
    if (files.length > 0) onFilesSelected?.(files);
  };

  const handleDragEnter = (event: DragEvent) => {
    event.preventDefault();
    dragDepth.current += 1;
    setDragOver(true);
  };

  const handleDragOver = (event: DragEvent) => {
    // Required — without it the browser refuses the drop.
    event.preventDefault();
  };

  const handleDragLeave = () => {
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDragOver(false);
    }
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    let files = Array.from(event.dataTransfer.files);
    if (!multiple) files = files.slice(0, 1);
    if (files.length > 0) onFilesSelected?.(files);
  };

  return (
    <div className={clsx(styles.host, className)}>
      <button
        type="button"
        className={clsx(
          styles.root,
          isDisabled ? styles.disabled : isWarning && styles.warning,
          showDragOver && styles.dragOver,
        )}
        disabled={inert}
        onClick={() => fileRef.current?.click()}
        onDragEnter={inert ? undefined : handleDragEnter}
        onDragOver={inert ? undefined : handleDragOver}
        onDragLeave={inert ? undefined : handleDragLeave}
        onDrop={inert ? undefined : handleDrop}
      >
        <svg className={styles.border} aria-hidden="true">
          <rect className={styles.borderRect} />
        </svg>
        {warned ? (
          <AvatarWarning size="xl" />
        ) : (
          <Avatar shape="square" content="icon" icon="download" iconPack="regular" iconClassName={styles.icon} size="xl" />
        )}
        <span className={styles.text}>
          <span className={styles.title}>{warned ? warningTitle : title}</span>
          <span className={styles.caption}>{warned ? warningCaption : caption}</span>
        </span>
      </button>
      <input
        ref={fileRef}
        className={styles.fileInput}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={inert}
        tabIndex={-1}
        onChange={handlePicked}
      />
    </div>
  );
}
