import { useEffect, useState } from "react";

import AvatarUser from "../../components/Avatar/AvatarUser";
import SelectList from "../../components/SelectList/SelectList";
import SelectListItem from "../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../components/SelectList/SelectListItemGroup";
import SelectListFooter from "../../components/SelectList/SelectListFooter";
import Button from "../../components/Button/Button";
import { toast } from "../../components/Toast/Toaster";
import { users } from "../../data/users";
import { staffSelectLabel } from "./jobData";

// The people who can be assigned (the first 10 demo users), sorted A → Z —
// the node's own order (annotation "Sorting Order: From A to Z").
export const ASSIGNEE_POOL = [...users.slice(0, 10)].sort((a, b) => a.name.localeCompare(b.name));

interface AssigneesFormProps {
  open: boolean;
  onClose: () => void;
  /** The currently assigned user ids. */
  value: number[];
  /** Commits the new selection. */
  onSave: (ids: number[]) => void;
  mobile?: boolean;
}

// The "Assignees" picker (Figma 24522-63745): a multi-select SelectList —
// desktop dialog / mobile drawer — with a search header and one footer button
// that saves. Its copy follows the selection: "Assign" while people are
// picked, "Unassign" when the list is emptied (node annotation).
export default function AssigneesForm({ open, onClose, value, onSave, mobile = false }: AssigneesFormProps) {
  const [picked, setPicked] = useState<number[]>(value);

  // A fresh open starts from what the job has now.
  useEffect(() => {
    if (open) setPicked(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggle = (id: number) => setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const save = () => {
    onSave(picked);
    toast({ type: "success", title: "Assignees updated" });
    onClose();
  };

  return (
    <SelectList
      open={open}
      onClose={onClose}
      variant={mobile ? "drawer" : "dialog"}
      title="Assignees"
      // Without this the list is single-select and closes on the first click.
      multiSelect
      searchable
      // The node writes "Search by user name…", but Safari and Chrome classify
      // a field as a USERNAME from those very words and then pop the password
      // manager over the keyboard — they ignore `autocomplete="off"` once they
      // have (the SearchField already sets every opt-out there is). So the
      // placeholder avoids the phrase; flagged to Daniel, 2026-08-05.
      searchPlaceholder="Search assignees..."
      footer={
        <SelectListFooter variant="actionBar">
          <Button size="lg" variant="solid" isFullWidth={mobile} onClick={save}>
            {picked.length > 0 ? "Assign" : "Unassign"}
          </Button>
        </SelectListFooter>
      }
    >
      <SelectListItemGroup>
        {ASSIGNEE_POOL.map((u) => (
          <SelectListItem
            key={u.id}
            multiSelect
            selected={picked.includes(u.id)}
            slotLeft={<AvatarUser size="xs" imageSrc={u.avatar} />}
            label={staffSelectLabel(u)}
            onClick={() => toggle(u.id)}
          />
        ))}
      </SelectListItemGroup>
    </SelectList>
  );
}
