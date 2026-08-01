import { useContext, useEffect, useRef } from "react";

import clsx from "clsx";

import useControllableState from "../../hooks/useControllableState";
import useIsDesktop from "../../hooks/useIsDesktop";
import Avatar from "../Avatar/Avatar";
import { Icon } from "../Icon/Icon";
import SelectList from "../SelectList/SelectList";
import SelectListItem from "../SelectList/SelectListItem";
import SelectListItemGroup from "../SelectList/SelectListItemGroup";
import TruncatingText from "../Tooltip/TruncatingText";
import { NavSidebarBreakpointContext } from "./NavSidebarContext";

import styles from "./NavSidebarWorkspaceButton.module.scss";
import { NavSidebarWorkspaceButtonProps, WorkspaceItem } from "./NavSidebarWorkspaceButton.types";

// The workspace icon: the uploaded image, or the name's first character.
function WorkspaceAvatar({ workspace, size }: { workspace: WorkspaceItem; size: "md" | "xs" }) {
  return (
    <Avatar
      type="object"
      size={size}
      content={workspace.imageSrc != null ? "image" : "letters"}
      imageSrc={workspace.imageSrc}
      letter={workspace.name.charAt(0)}
    />
  );
}

// NavSidebarWorkspaceButton — switches between workspaces: a compact button
// (28px object avatar + name + angles icon) opening a SelectList (desktop:
// inline card 4px below; mobile: drawer). The button stays pressed while the
// list is open; a truncated name gets a full-name tooltip. With a SINGLE
// workspace the button is non-interactive and drops the angles icon. See
// Figma "NavSidebarWorkspaceButton".
export default function NavSidebarWorkspaceButton({
  workspaces,
  value,
  defaultValue,
  onChange,
  open,
  defaultOpen = false,
  onOpenChange,
  isDisabled = false,
  breakpoint,
  className,
}: NavSidebarWorkspaceButtonProps) {
  const inherited = useContext(NavSidebarBreakpointContext);
  const resolved = breakpoint ?? inherited ?? "auto";
  const isDesktop = useIsDesktop(resolved);
  const [isOpen, setOpen] = useControllableState(open, defaultOpen, onOpenChange);
  const [selectedId, setSelectedId] = useControllableState(value, defaultValue ?? workspaces[0]?.id, onChange);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = workspaces.find((w) => w.id === selectedId) ?? workspaces[0];
  const single = workspaces.length <= 1;

  // Desktop: clicking outside the button + list closes the list (the mobile
  // drawer closes itself via the scrim / swipe).
  useEffect(() => {
    if (!isDesktop || !isOpen) return undefined;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current != null && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [isDesktop, isOpen, setOpen]);

  if (selected == null) return null;

  const pick = (id: string) => {
    setSelectedId(id);
    setOpen(false);
  };

  const list = (
    <SelectList
      variant={isDesktop ? "inline" : "drawer"}
      breakpoint={resolved}
      open={isOpen}
      onClose={() => setOpen(false)}
    >
      <SelectListItemGroup>
        {workspaces.map((w) => (
          <SelectListItem
            key={w.id}
            label={w.name}
            slotLeft={<WorkspaceAvatar workspace={w} size="xs" />}
            selected={w.id === selectedId}
            onClick={() => pick(w.id)}
          />
        ))}
      </SelectListItemGroup>
    </SelectList>
  );

  return (
    <div ref={wrapRef} className={clsx(styles.wrap, isDesktop && styles.wrapDesktop, className)}>
      {single ? (
        // A single workspace: plain, non-interactive display.
        <div className={styles.button}>
          <WorkspaceAvatar workspace={selected} size="md" />
          <TruncatingText text={selected.name} className={styles.name} />
        </div>
      ) : (
        <button
          type="button"
          className={clsx(styles.button, styles.interactive, isOpen && styles.open, isDisabled && styles.disabled)}
          disabled={isDisabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => setOpen(!isOpen)}
        >
          <WorkspaceAvatar workspace={selected} size="md" />
          <TruncatingText text={selected.name} className={styles.name} />
          <span className={styles.angles} aria-hidden="true">
            <Icon icon="angles-up-down" size={14} />
          </span>
        </button>
      )}
      {!single && (isDesktop ? <div className={styles.listAnchor}>{list}</div> : list)}
    </div>
  );
}
