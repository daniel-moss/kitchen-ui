import { useState } from "react";

import Avatar from "../../components/Avatar/Avatar";
import Counter from "../../components/Counter/Counter";
import DisplayModule from "../../components/DisplayModule/DisplayModule";
import EmptyState from "../../components/EmptyState/EmptyState";
import IconButton from "../../components/IconButton/IconButton";
import ListItem from "../../components/ListItem/ListItem";
import FormsModule from "./FormsModule";
import ItemGroup from "../../components/ItemGroup/ItemGroup";
import Menu from "../../components/Menu/Menu";
import MenuItem from "../../components/Menu/MenuItem";
import MenuItemGroup from "../../components/Menu/MenuItemGroup";
import TabGroup from "../../components/Tabs/TabGroup";
import TabItem from "../../components/Tabs/TabItem";
import HoverTooltip from "../../components/Tooltip/HoverTooltip";
import ChargesTab from "./ChargesTab";
import { Equipment } from "./equipment";
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


// The "Summary" tab (Figma 23824-25409): a segmented Tech work / Charges /
// Signature control. Tech work holds the Forms, Work summary and Notes-to-
// dispatcher modules; Charges / Signature are placeholders (not designed yet).
export default function SummaryPanel({
  mobile = false,
  jobEquipment = [],
}: {
  mobile?: boolean;
  /** The job's live Equipment-module list — the Service call form reads it. */
  jobEquipment?: Equipment[];
}) {
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
          {/* Forms (Figma 21816-30805) — the full module: Public/Private
              groups, per-state rows + menus, rename/duplicate/visibility
              flows, and the Add-forms select list. */}
          <FormsModule mobile={mobile} jobEquipment={jobEquipment} />

          {/* Work summary — empty state (edit pencil to fill manually). */}
          <DisplayModule
            title="Work summary"
            slotRight={<EditButton label="Edit" />}
            content={
              <EmptyState caption="Complete the forms to enable AI generation or fill out manually" />
            }
          />

          {/* Notes to dispatcher — empty state (plus to add a note). */}
          <DisplayModule
            title="Notes to dispatcher"
            slotRight={<AddButton label="Add note" />}
            content={
              <EmptyState caption="No notes here yet" />
            }
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
