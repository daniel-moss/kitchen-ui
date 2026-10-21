import AvatarWarranty from "../../../components/Avatar/AvatarWarranty";
import Counter from "../../../components/Counter/Counter";
import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import EmptyState from "../../../components/EmptyState/EmptyState";
import IconButton from "../../../components/IconButton/IconButton";
import ItemGroup from "../../../components/ItemGroup/ItemGroup";
import ListItem from "../../../components/ListItem/ListItem";
import ListItemSlotIcon from "../../../components/ListItem/ListItemSlotIcon";
import Menu from "../../../components/Menu/Menu";
import MenuItem from "../../../components/Menu/MenuItem";
import MenuItemGroup from "../../../components/Menu/MenuItemGroup";
import DrawerHeader from "../../../components/Popover/DrawerHeader";
import PopoverHeaderContent from "../../../components/Popover/PopoverHeaderContent";
import PopoverHeaderText from "../../../components/Popover/PopoverHeaderText";
import HoverTooltip from "../../../components/Tooltip/HoverTooltip";
import { useAnchoredMenu } from "../../shared/anchoredMenu";
import { slot } from "../../shared/helpers";
import { WarrantyRow } from "../equipmentData";

import styles from "../EquipmentPanel.module.scss";

// The "Warranties" tab (Figma 17200-63481). A counted list of warranties, each
// opening the Warranty side panel, each with a Preview / Delete context menu.

// One row plus its menu. The group clones this wrapper for the lifted drag
// copy, so the injected props have to be forwarded even though these rows do
// not drag.
const WarrantyEntry = ({
  warranty,
  mobile,
  onOpen,
  onDelete,
}: {
  warranty: WarrantyRow;
  mobile: boolean;
  onOpen: (warranty: WarrantyRow) => void;
  onDelete: (warranty: WarrantyRow) => void;
}) => {
  const menu = useAnchoredMenu(!mobile);

  const menuBody = (
    <>
      <MenuItemGroup>
        <MenuItem
          label="Preview"
          slotLeft={slot("eye")}
          onClick={() => {
            menu.close();
            onOpen(warranty);
          }}
        />
      </MenuItemGroup>
      <MenuItemGroup>
        <MenuItem
          danger
          label="Delete"
          slotLeft={slot("trash-can")}
          onClick={() => {
            menu.close();
            onDelete(warranty);
          }}
        />
      </MenuItemGroup>
    </>
  );

  return (
    <>
      <ListItem
        variant="titleCaption"
        title={warranty.name}
        caption={warranty.range}
        avatar={<AvatarWarranty size="xl" status={warranty.state} />}
        isClickable
        onClick={() => onOpen(warranty)}
        slotRight={
          <IconButton
            icon="ellipsis"
            variant="ghost"
            size="md"
            aria-label="More actions"
            isPressed={menu.open}
            noDebounce
            onClick={menu.onActions}
          />
        }
      />
      {mobile ? (
        <Menu
          open={menu.open}
          onClose={menu.close}
          drawerHeader={
            <DrawerHeader>
              <PopoverHeaderContent avatar={<AvatarWarranty size="xl" status={warranty.state} />}>
                <PopoverHeaderText variant="titleCaption" title={warranty.name} caption={warranty.range} />
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
      )}
    </>
  );
};

interface WarrantiesModuleProps {
  warranties: WarrantyRow[];
  mobile: boolean;
  onAdd: () => void;
  onOpen: (warranty: WarrantyRow) => void;
  onDelete: (warranty: WarrantyRow) => void;
  /**
   * The PUBLIC view (Figma 22438-36154): no add button and no context menu —
   * each row only opens, with a chevron on the right.
   */
  isPublicView?: boolean;
  /**
   * Loading: the Details tab has already told us HOW MANY warranties there
   * are, so the list shows that many skeleton rows (the Loading frame's own
   * annotation) — pass the count the tab carries.
   */
  isLoading?: boolean;
  loadingCount?: number;
}

export default function WarrantiesModule({
  warranties,
  mobile,
  onAdd,
  onOpen,
  onDelete,
  isLoading = false,
  loadingCount = 3,
  isPublicView = false,
}: WarrantiesModuleProps) {
  const count = isLoading ? loadingCount : warranties.length;

  const content = isLoading ? (
    <ItemGroup>
      {Array.from({ length: loadingCount }, (unused, index) => (
        <ListItem key={index} variant="titleCaption" title="" caption="" avatar={<AvatarWarranty size="xl" />} isLoading />
      ))}
    </ItemGroup>
  ) : warranties.length === 0 ? (
    <EmptyState caption="No warranties" />
  ) : (
    <ItemGroup>
      {warranties.map((warranty) =>
        isPublicView ? (
          <ListItem
            key={warranty.id}
            variant="titleCaption"
            title={warranty.name}
            caption={warranty.range}
            avatar={<AvatarWarranty size="xl" status={warranty.state} />}
            isClickable
            onClick={() => onOpen(warranty)}
            slotRight={<ListItemSlotIcon icon="angle-right" />}
          />
        ) : (
          <WarrantyEntry key={warranty.id} warranty={warranty} mobile={mobile} onOpen={onOpen} onDelete={onDelete} />
        ),
      )}
    </ItemGroup>
  );

  return (
    <DisplayModule
      title="Warranties"
      // None at zero (Daniel, 2026-09-28; the Empty State node sets the title's
      // right slot to false). While LOADING the count is already known — it is
      // what decides how many skeleton rows to draw — so the counter shows it
      // (node 22012-20142 draws "3" over 3 skeleton rows).
      titleSlotRight={count === 0 ? undefined : <Counter value={count} />}
      slotRight={
        isLoading || isPublicView ? undefined : (
          <HoverTooltip text="Add warranty">
            <IconButton icon="plus" variant="ghost" size="md" aria-label="Add warranty" onClick={onAdd} />
          </HoverTooltip>
        )
      }
      // Both the ItemGroup (4px) and the EmptyState (32px) bring their own
      // padding, so the body never adds any.
      bodyPadded={false}
      content={content}
    />
  );
}
