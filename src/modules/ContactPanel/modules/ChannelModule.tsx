import AvatarLive from "../../../components/Avatar/AvatarLive";
import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import EmptyState from "../../../components/EmptyState/EmptyState";
import IconButton from "../../../components/IconButton/IconButton";
import ItemGroup from "../../../components/ItemGroup/ItemGroup";
import ListItem from "../../../components/ListItem/ListItem";
import Menu from "../../../components/Menu/Menu";
import MenuItem from "../../../components/Menu/MenuItem";
import MenuItemGroup from "../../../components/Menu/MenuItemGroup";
import DrawerHeader from "../../../components/Popover/DrawerHeader";
import PopoverHeaderContent from "../../../components/Popover/PopoverHeaderContent";
import PopoverHeaderText from "../../../components/Popover/PopoverHeaderText";
import HoverTooltip from "../../../components/Tooltip/HoverTooltip";
import { User } from "../../../data/users";
import { semanticIcons } from "../../../styles/semanticIcons";
import { useAnchoredMenu } from "../../shared/anchoredMenu";
import { copyText, slot } from "../../shared/helpers";
import { shortName } from "../contactData";

import styles from "../ContactPanel.module.scss";

// ONE build for the two single-value modules — "Phone number" (Figma section
// 17013-16467) and "Email address" (17015-19022). They are drawn identically:
// the value as a one-line row with Copy · Call / Send email · a context menu
// (Edit, Delete), an "Add" button over an empty state when there is no value,
// and the warning state when NEITHER phone nor email exists.

export interface ChannelConfig {
  /** Module title and the quoted name in every toast — "Phone number". */
  title: string;
  /** Empty-state caption — "No phone number". */
  emptyCaption: string;
  /** The second row action — "phone" / "envelope". */
  actionIcon: string;
  /** Its tooltip — "Call" / "Send email". */
  actionLabel: string;
  /** Its link — `tel:` / `mailto:`. Opens the OS's own phone / mail app. */
  actionHref: (value: string) => string;
}

interface ChannelModuleProps {
  config: ChannelConfig;
  /**
   * The formatted value ("(987) 654-3210 ext. 123"), or undefined when empty.
   * Copy puts exactly this on the clipboard ("Copies phone number with extension").
   */
  value: string | undefined;
  mobile: boolean;
  onEdit: () => void;
  onDelete: () => void;
  /** Neither phone nor email — the warning state (only drawn where editing is possible). */
  warning: boolean;
  /** Someone else is editing this value: the menu button becomes their live avatar. */
  editingBy?: User;
  isLoading?: boolean;
  /** False = no Add, no menu, no warning: the public view and an inactive client. */
  canEdit?: boolean;
}

export default function ChannelModule({
  config,
  value,
  mobile,
  onEdit,
  onDelete,
  warning,
  editingBy,
  isLoading = false,
  canEdit = true,
}: ChannelModuleProps) {
  // Desktop: the card hangs under the ellipsis, RIGHT edges aligned, 4px below
  // (Context Menu / Desktop, 17013-17572).
  const menu = useAnchoredMenu(!mobile, "end");
  const showWarning = warning && canEdit && !isLoading;
  const isEmpty = value == null || value === "";

  const menuBody = (
    <>
      <MenuItemGroup>
        <MenuItem
          label="Edit"
          slotLeft={slot(semanticIcons.edit)}
          onClick={() => {
            menu.close();
            onEdit();
          }}
        />
      </MenuItemGroup>
      <MenuItemGroup>
        <MenuItem
          danger
          label="Delete"
          slotLeft={slot(semanticIcons.delete)}
          onClick={() => {
            menu.close();
            onDelete();
          }}
        />
      </MenuItemGroup>
    </>
  );

  // The third slot: the menu, or — while someone else edits the value — their
  // live avatar (lg) with "[Name S.] is editing" (Editing In Progress,
  // 23816-5099: "A user can not edit or delete … while it's being edited").
  const thirdSlot =
    !canEdit ? null : editingBy != null ? (
      <HoverTooltip text={`${shortName(editingBy)} is editing`}>
        <AvatarLive size="lg" content="image" imageSrc={editingBy.avatar} color="orange" />
      </HoverTooltip>
    ) : (
      <IconButton
        icon={semanticIcons.contextMenu}
        variant="ghost"
        size="md"
        aria-label="More actions"
        isPressed={menu.open}
        noDebounce
        onClick={menu.onActions}
      />
    );

  const content = isLoading ? (
    // The DS ListItem hides its right slot while loading — the node draws three
    // loading IconButtons there (flagged).
    <ItemGroup>
      <ListItem title="" isLoading />
    </ItemGroup>
  ) : isEmpty ? (
    <EmptyState caption={config.emptyCaption} />
  ) : (
    <ItemGroup>
      <ListItem
        title={value}
        // The node overrides the row's title style: body-400, not 500 — the
        // title is a value, not a name.
        titleStyle="bodyRegular"
        slotRight={
          <>
            <HoverTooltip text="Copy">
              <IconButton
                icon={semanticIcons.copy}
                variant="ghost"
                size="md"
                aria-label={`Copy ${config.title.toLowerCase()}`}
                onClick={() => copyText(value, config.title, undefined, `Couldn't copy "${config.title}"`)}
              />
            </HoverTooltip>
            <HoverTooltip text={config.actionLabel}>
              <IconButton
                icon={config.actionIcon}
                variant="ghost"
                size="md"
                aria-label={config.actionLabel}
                onClick={() => {
                  window.location.href = config.actionHref(value);
                }}
              />
            </HoverTooltip>
            {thirdSlot}
          </>
        }
      />
    </ItemGroup>
  );

  return (
    <>
      <DisplayModule
        title={config.title}
        status={showWarning ? "warning" : "none"}
        banner={showWarning ? { children: "Key details are missing", ctaLabel: "Edit", ctaOnClick: onEdit } : undefined}
        // "Add" only over the plain empty state; the warning frame drops it —
        // its banner's Edit opens the same form.
        slotRight={
          isEmpty && canEdit && !isLoading && !showWarning ? (
            <HoverTooltip text="Add">
              <IconButton icon="plus" variant="ghost" size="md" aria-label={`Add ${config.title.toLowerCase()}`} onClick={onEdit} />
            </HoverTooltip>
          ) : undefined
        }
        // The ItemGroup (4px) and the EmptyState bring their own padding.
        bodyPadded={false}
        content={content}
      />
      {canEdit &&
        !isEmpty &&
        (mobile ? (
          <Menu
            open={menu.open}
            onClose={menu.close}
            // The drawer repeats the value — title only (Context Menu / Mobile, 23818-5097).
            drawerHeader={
              <DrawerHeader>
                <PopoverHeaderContent>
                  <PopoverHeaderText variant="title" title={value} />
                </PopoverHeaderContent>
              </DrawerHeader>
            }
            breakpoint="mobile"
          >
            {menuBody}
          </Menu>
        ) : (
          menu.pos != null && (
            <div ref={menu.cardRef} className={styles.anchoredMenu} style={{ top: menu.pos.top, left: menu.pos.left, right: menu.pos.right }}>
              <Menu open={menu.open} onClose={menu.close} breakpoint="desktop">
                {menuBody}
              </Menu>
            </div>
          )
        ))}
    </>
  );
}
