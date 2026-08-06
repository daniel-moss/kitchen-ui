import { useState } from "react";
import { createPortal } from "react-dom";

import { Icon } from "../../components/Icon/Icon";
import IconButton from "../../components/IconButton/IconButton";
import Menu from "../../components/Menu/Menu";
import MenuItem from "../../components/Menu/MenuItem";
import MenuItemGroup from "../../components/Menu/MenuItemGroup";
import SidePanel from "../../components/SidePanel/SidePanel";
import useIsDesktop from "../../hooks/useIsDesktop";
import { useAnchoredMenu } from "../shared/anchoredMenu";

import FormPreview from "./FormPreview";
import { FormPreviewPanelProps } from "./FormPreviewPanel.types";
import { FormMediaAnswer } from "./schema.types";

import styles from "./FormPreviewPanel.module.scss";

/** "4 MB" / "512 KB" / "980 B" — the size tag next to Download. */
export const formatFileSize = (bytes?: number): string | undefined => {
  if (bytes == null || Number.isNaN(bytes)) return undefined;
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb >= 10 ? Math.round(mb) : Math.round(mb * 10) / 10} MB`;
};

// Downloads the file behind its object URL. Files picked in a prototype live
// only as blob URLs, so a file without one can not be downloaded.
const downloadFile = (file: FormMediaAnswer) => {
  if (file.src == null) return;
  const link = document.createElement("a");
  link.href = file.src;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

// FormPreviewPanel — a completed form shown read-only in a SidePanel (Figma
// "CSI / Service Call / Preview" 24463-34993 and "WCE / Hot Side - Repair /
// Preview" 24467-36576): the form's name as the title, an ellipsis action and
// the close button, no back arrow and no footer. The body is the FormPreview.
//
// Each file card's ⋯ opens the file menu (Figma "File Context Menu"
// 24552-120379 / 24552-120393): Preview + Download with the file size as its
// tag — a desktop card anchored to the button, a drawer on mobile.
export default function FormPreviewPanel({
  open,
  onClose,
  schema,
  answers,
  title,
  headerMenu,
  onFilePreview,
  breakpoint = "auto",
}: FormPreviewPanelProps) {
  const autoDesktop = useIsDesktop();
  const isDesktop = breakpoint === "auto" ? autoDesktop : breakpoint === "desktop";
  const menu = useAnchoredMenu(isDesktop, "end");
  // The header's ⋯ — its own anchored menu, separate from the file cards'.
  const actions = useAnchoredMenu(isDesktop, "end");
  const [target, setTarget] = useState<{ file: FormMediaAnswer; key: string; index: number } | null>(null);

  const menuBody = (
    <MenuItemGroup>
      <MenuItem
        label="Preview"
        slotLeft={<Icon icon="eye" container="square" />}
        onClick={() => {
          menu.close();
          if (target != null) onFilePreview?.(target.file);
        }}
      />
      <MenuItem
        label="Download"
        tag={formatFileSize(target?.file.size)}
        slotLeft={<Icon icon="download" container="square" />}
        onClick={() => {
          menu.close();
          if (target != null) downloadFile(target.file);
        }}
      />
    </MenuItemGroup>
  );

  return (
    <>
      <SidePanel
        open={open}
        onClose={onClose}
        title={title ?? schema.name}
        breakpoint={breakpoint}
        headerActions={
          headerMenu ? (
            <IconButton
              icon="ellipsis"
              variant="ghost"
              size="md"
              aria-label="Form actions"
              isPressed={actions.open}
              noDebounce
              onClick={actions.onActions}
            />
          ) : undefined
        }
      >
        <FormPreview
          schema={schema}
          answers={answers}
          openFileMenu={target != null && menu.open ? { key: target.key, index: target.index } : null}
          onFileMenuClick={(file, key, index, event) => {
            setTarget({ file, key, index });
            menu.onActions(event);
          }}
        />
      </SidePanel>

      {/* The menus live OUTSIDE the panel — the panel's scroll container would
          clip an anchored card — and are portaled to <body> so no ancestor
          stacking context can trap them under the panel. */}
      {isDesktop
        ? menu.pos != null &&
          createPortal(
            <div ref={menu.cardRef} className={styles.cardMenu} style={{ top: menu.pos.top, left: menu.pos.left }}>
              <Menu open={menu.open} onClose={menu.close} breakpoint="desktop">
                {menuBody}
              </Menu>
            </div>,
            document.body,
          )
        : (
            <Menu open={menu.open} onClose={menu.close} breakpoint="mobile" title={target?.file.name}>
              {menuBody}
            </Menu>
          )}

      {/* The header's ⋯ menu — the form's own actions. */}
      {headerMenu != null &&
        (isDesktop
          ? actions.pos != null &&
            createPortal(
              <div ref={actions.cardRef} className={styles.cardMenu} style={{ top: actions.pos.top, left: actions.pos.left }}>
                <Menu open={actions.open} onClose={actions.close} breakpoint="desktop">
                  {headerMenu(actions.close)}
                </Menu>
              </div>,
              document.body,
            )
          : (
              <Menu open={actions.open} onClose={actions.close} breakpoint="mobile" title={title ?? schema.name}>
                {headerMenu(actions.close)}
              </Menu>
            ))}
    </>
  );
}
