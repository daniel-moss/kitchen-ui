import { useState } from "react";

import Avatar from "../../components/Avatar/Avatar";
import Counter from "../../components/Counter/Counter";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import EmptyState from "../../components/EmptyState/EmptyState";
import IconButton from "../../components/IconButton/IconButton";
import ListItem from "../../components/ListItem/ListItem";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import Menu from "../../components/Menu/Menu";
import MenuItem from "../../components/Menu/MenuItem";
import MenuItemGroup from "../../components/Menu/MenuItemGroup";
import TabGroup from "../../components/Tabs/TabGroup";
import TabItem from "../../components/Tabs/TabItem";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import ChargesTab from "./ChargesTab";
import { noop, slot, useAnchoredMenu } from "./shared";

import styles from "./SummaryPanel.module.scss";

// ---- module header buttons (all display-only for now) ----------------------

const AddButton = ({ label }: { label: string }) => (
  <HoverTooltip text={label}>
    <IconButton icon="plus" variant="ghost" size="md" aria-label={label} onClick={noop} />
  </HoverTooltip>
);
const EditButton = ({ label }: { label: string }) => (
  <HoverTooltip text={label}>
    <IconButton icon="pen" variant="ghost" size="md" aria-label={label} onClick={noop} />
  </HoverTooltip>
);

// An UNCOMPLETED form row (Figma 24088-14278): a gray object-icon (`list`)
// avatar + the form name, no caption, and a Preview / Remove context menu
// (Figma 23899-17325 / 17336). All actions are display-only.
const FormRow = ({ mobile, name }: { mobile: boolean; name: string }) => {
  const menu = useAnchoredMenu(!mobile, "end");
  const body = (
    <>
      <MenuItemGroup>
        <MenuItem label="Preview" slotLeft={slot("eye")} onClick={menu.close} />
      </MenuItemGroup>
      <MenuItemGroup>
        <MenuItem label="Remove" slotLeft={slot("xmark")} onClick={menu.close} />
      </MenuItemGroup>
    </>
  );
  return (
    <>
      <ListItem
        variant="title"
        title={name}
        avatar={<Avatar shape="square" content="icon" icon="list" size="xl" />}
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
        <Menu open={menu.open} onClose={menu.close} title={name} breakpoint="mobile">
          {body}
        </Menu>
      ) : (
        menu.pos != null && (
          <div ref={menu.cardRef} className={styles.anchoredMenu} style={{ top: menu.pos.top, left: menu.pos.left, right: menu.pos.right }}>
            <Menu open={menu.open} onClose={menu.close} breakpoint="desktop">
              {body}
            </Menu>
          </div>
        )
      )}
    </>
  );
};

// The "Summary" tab (Figma 23824-25409): a segmented Tech work / Charges /
// Signature control. Tech work holds the Forms, Work summary and Notes-to-
// dispatcher modules; Charges / Signature are placeholders (not designed yet).
export default function SummaryPanel({ mobile = false }: { mobile?: boolean }) {
  const [sub, setSub] = useState("tech-work");

  return (
    <div className={styles.panel}>
      <TabGroup variant="contained" size="lg" isFullWidth value={sub} onChange={setSub}>
        <TabItem value="tech-work">Tech work</TabItem>
        <TabItem value="charges">Charges</TabItem>
        <TabItem value="signature">Signature</TabItem>
      </TabGroup>

      {sub === "charges" ? (
        <ChargesTab mobile={mobile} />
      ) : sub === "tech-work" ? (
        <>
          {/* Forms — 2 uncompleted forms (the completed-row variant isn't built yet). */}
          <DisplayModule
            title="Forms"
            titleSlotRight={<Counter value={2} />}
            slotRight={<AddButton label="Add form" />}
            content={
              <div className={styles.listBody}>
                <ItemGroup>
                  <FormRow mobile={mobile} name="Form #1" />
                  <FormRow mobile={mobile} name="Form #2" />
                </ItemGroup>
              </div>
            }
          />

          {/* Work summary — empty state (edit pencil to fill manually). */}
          <DisplayModule
            title="Work summary"
            slotRight={<EditButton label="Edit" />}
            content={<EmptyState caption="Complete the forms to enable AI generation or fill out manually" />}
          />

          {/* Notes to dispatcher — empty state (plus to add a note). */}
          <DisplayModule
            title="Notes to dispatcher"
            slotRight={<AddButton label="Add note" />}
            content={<EmptyState caption="No notes here yet" />}
          />
        </>
      ) : (
        <div className={styles.placeholder}>
          <span>Content</span>
        </div>
      )}
    </div>
  );
}
