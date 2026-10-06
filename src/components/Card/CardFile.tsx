import { forwardRef, MouseEvent, useLayoutEffect, useRef, useState } from "react";
import clsx from "clsx";

import Card from "./Card";
import { Divider } from "../Divider/Divider";
import { Icon } from "../Icon/Icon";
import IconButton from "../IconButton/IconButton";
import { SkeletonTypography } from "../SkeletonTypography/SkeletonTypography";
import TruncatingText from "../Tooltip/TruncatingText";

import styles from "./CardFile.module.scss";
import { CardFileProps, FILE_TYPE_META, FileType } from "./CardFile.types";

// Line height (px) of the filename text (caption-medium-500 = 13/20).
const NAME_LINE_HEIGHT = 20;

// The colored file-type placeholder (no preview): icon top-left, then the file
// name filling the rest of the tile — as many wrapped lines as fit, ellipsis on
// the last line. The fit is measured because the tile size varies (the cards
// grid flexes it 106–184px), so a fixed line count would not match.
function NoPreviewTile({ fileType, name }: { fileType: FileType; name: string }) {
  const meta = FILE_TYPE_META[fileType];
  const boxRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState(1);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (box == null) return undefined;
    // box is flex:1, so its height is the space left below the icon — stable
    // regardless of how much the (clamped) text fills, so no measure loop.
    const measure = () => setLines(Math.max(1, Math.floor(box.clientHeight / NAME_LINE_HEIGHT)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  return (
    <div className={clsx(styles.noPreview, styles[meta.color])}>
      <Icon icon={meta.icon} pack={meta.pack} size={14} className={styles.noPreviewIcon} />
      <div className={styles.noPreviewNameBox} ref={boxRef}>
        <span className={styles.noPreviewName} style={{ WebkitLineClamp: lines }}>
          {name}
        </span>
      </div>
    </div>
  );
}

// The loading tile: the neutral placeholder with the file name replaced by two
// skeleton lines (the icon stays top-left). It is always the `generic` tile and
// never the file type's own color — while the file loads the type is not known
// yet. See Figma "Loading".
function LoadingTile() {
  const meta = FILE_TYPE_META.generic;
  return (
    <div className={clsx(styles.noPreview, styles[meta.color], styles.loadingTile)}>
      <Icon icon={meta.icon} pack={meta.pack} size={14} className={styles.noPreviewIcon} />
      <div className={styles.loadingLines}>
        <SkeletonTypography variant="captionMD" />
        <SkeletonTypography variant="captionMD" />
      </div>
    </div>
  );
}

// The square preview tile: a real thumbnail (image / video), a loading skeleton,
// or the colored file-type placeholder when there is no preview.
function FileTile({
  fileType,
  previewSrc,
  name,
  isLoading,
}: {
  fileType: FileType;
  previewSrc?: string;
  name: string;
  isLoading?: boolean;
}) {
  return (
    <div className={styles.tile}>
      {isLoading ? (
        <LoadingTile />
      ) : previewSrc ? (
        <div className={styles.preview}>
          <img className={styles.previewImg} src={previewSrc} alt="" />
          {fileType === "video" && (
            <>
              <div className={styles.videoOverlay} />
              <Icon icon="circle-play" pack="solid" size={24} className={styles.playIcon} />
            </>
          )}
        </div>
      ) : (
        <NoPreviewTile fileType={fileType} name={name} />
      )}
    </div>
  );
}

// Divider + the file name + an optional action button. While loading, the name
// is a skeleton and the action button is dropped.
function Footer({
  name,
  onMenuClick,
  menuOpen,
  disabled,
  isLoading,
  actionIcon,
  actionLabel,
  actionDanger,
}: {
  name: string;
  onMenuClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  menuOpen?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  actionIcon?: string;
  actionLabel?: string;
  actionDanger?: boolean;
}) {
  return (
    <div className={styles.footer}>
      {/* Medium, not the Divider default — the card's own contrast (Figma). */}
      <Divider contrast="medium" />
      {/* No button — unset, or dropped while loading — means 16px on both sides. */}
      <div className={clsx(styles.footerRow, (isLoading || !onMenuClick) && styles.footerRowNoAction)}>
        {isLoading ? (
          <SkeletonTypography variant="captionMD" />
        ) : (
          <>
            {/* Truncates to one line; a tooltip reveals the full name on hover. */}
            <div className={styles.footerNameWrap}>
              <TruncatingText text={name} lines={1} className={styles.footerName} />
            </div>
            {onMenuClick && (
              <span className={styles.menuGuard}>
                <IconButton
                  aria-label={actionLabel ?? "File actions"}
                  icon={actionIcon ?? "ellipsis"}
                  size="sm"
                  variant="ghost"
                  // Danger (delete, etc.) recolors the ghost button red — the DS
                  // has no danger IconButton variant, so it is a CardFile-local
                  // override of the button's color vars.
                  className={actionDanger ? styles.dangerAction : undefined}
                  isDisabled={disabled}
                  // Held pressed while its menu is open.
                  isPressed={menuOpen}
                  // No debounce, so stopPropagation runs on every click (a debounced
                  // second click would otherwise bubble to the card's onClick).
                  noDebounce
                  onClick={(event) => {
                    event.stopPropagation();
                    onMenuClick(event);
                  }}
                />
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// A file card — a square file preview above a footer (name + action button).
// Built on top of Card (padding 0): Card provides the surface, radius, shadow,
// and the interactive / disabled / loading behavior. While loading, the tile and
// footer show skeletons and the action button is hidden. See Figma "CardFile".
const CardFile = forwardRef<HTMLDivElement, CardFileProps>(function CardFile(
  {
    name,
    fileType = "generic",
    previewSrc,
    onClick,
    onMenuClick,
    menuOpen,
    actionIcon,
    actionLabel,
    actionDanger,
    disabled = false,
    isLoading = false,
    dragging = false,
    className,
    bodyClassName,
  },
  ref,
) {
  return (
    <Card
      ref={ref}
      padding={0}
      onClick={onClick}
      disabled={disabled}
      loading={isLoading}
      dragging={dragging}
      className={className}
      bodyClassName={bodyClassName}
    >
      <FileTile fileType={fileType} previewSrc={previewSrc} name={name} isLoading={isLoading} />
      <Footer
        name={name}
        onMenuClick={onMenuClick}
        menuOpen={menuOpen}
        disabled={disabled}
        isLoading={isLoading}
        actionIcon={actionIcon}
        actionLabel={actionLabel}
        actionDanger={actionDanger}
      />
    </Card>
  );
});

export default CardFile;
