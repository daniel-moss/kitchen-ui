import { useEffect, useState } from "react";

import AvatarJob from "../../components/Avatar/AvatarJob";
import Button from "../../components/Button/Button";
import Card from "../../components/Card/Card";
import Dialog from "../../components/Dialog/Dialog";
import SelectField from "../../components/Fields/SelectField/SelectField";
import TextArea from "../../components/Fields/TextArea/TextArea";
import { Icon } from "../../components/Icon/Icon";
import Input from "../../components/Input/Input";
import IconButton from "../../components/IconButton/IconButton";
import ListItem from "../../components/ListItem/ListItem";
import ListItemSlotIcon from "../../components/ListItem/ListItemSlotIcon";
import PopoverFooter from "../../components/Popover/PopoverFooter";
import RadioGroup from "../../components/Radio/RadioGroup";
import RadioItem from "../../components/Radio/RadioItem";
import { toast } from "../../components/Toast/Toaster";
import { JOB_ID, JOB_REASON_FOR_CALL, JOB_RECALL_TO, JOB_SERVICE, JOB_TECH_INSTRUCTIONS } from "./jobData";
import { noop } from "./shared";

import styles from "./ServiceForm.module.scss";

interface ServiceFormProps {
  open: boolean;
  onClose: () => void;
  mobile?: boolean;
}

// The priority value with its custom duotone bars icon (see the Service module).
const priorityValue = (
  <span className={styles.priority}>
    <Icon icon="duotone-solid-priority-medium" pack="custom-duotone" size={14} />
    Medium
  </span>
);

// "Service" edit form (Figma node 21758-54967): reason for call, the New/Recall
// type, the recalled job (when Recall), service, priority, and tech instructions.
// The select dropdowns are display-only for now (later flow).
export default function ServiceForm({ open, onClose, mobile = false }: ServiceFormProps) {
  const [reason, setReason] = useState(JOB_REASON_FOR_CALL);
  const [type, setType] = useState("recall");
  const [tech, setTech] = useState(JOB_TECH_INSTRUCTIONS);

  useEffect(() => {
    if (open) return;
    setReason(JOB_REASON_FOR_CALL);
    setType("recall");
    setTech(JOB_TECH_INSTRUCTIONS);
  }, [open]);

  const save = () => {
    toast({ type: "success", title: '"Service" updated' });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Service"
      breakpoint={mobile ? "mobile" : "desktop"}
      footer={
        <PopoverFooter
          leadingButton={
            <Button size="lg" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          }
        >
          <Button size="lg" variant="solid" onClick={save}>
            Save
          </Button>
        </PopoverFooter>
      }
    >
      <div className={styles.form}>
        <Input label="Reason for call">
          <TextArea value={reason} onChange={(e) => setReason(e.target.value)} />
        </Input>

        <Input label="Type">
          <RadioGroup orientation="horizontal" value={type} onChange={setType}>
            <RadioItem value="new" label="New" />
            <RadioItem value="recall" label="Recall" />
          </RadioGroup>
        </Input>

        {type === "recall" && (
          <div className={styles.recall}>
            <Input label="Recall to">
              <SelectField value={`${JOB_RECALL_TO} • ${JOB_SERVICE}`} onClick={noop} />
            </Input>
            <Card padding={0}>
              <ListItem
                variant="titleCaption"
                title={`${JOB_RECALL_TO} • ${JOB_SERVICE}`}
                caption="Finalized on Jan 1, 2025 by Lorne R."
                avatar={<AvatarJob size="xl" status="finalized" />}
                slotRight={<ListItemSlotIcon icon="arrow-up-right" />}
                isClickable
                onClick={noop}
              />
            </Card>
          </div>
        )}

        <Input label="Service">
          <SelectField value={JOB_SERVICE} onClick={noop} />
        </Input>
        <Input label="Priority">
          <SelectField value={priorityValue} onClick={noop} />
        </Input>

        <Input label="Tech instructions" labelCondition="optional" labelHint>
          <TextArea value={tech} onChange={(e) => setTech(e.target.value)} />
        </Input>
      </div>
    </Dialog>
  );
}
