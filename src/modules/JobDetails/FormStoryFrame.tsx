import { ReactNode, useEffect, useState } from "react";

import Button from "../../components/Button/Button";
import Toaster from "../../components/Toast/Toaster";
import { PhoneViewport, PressOnOpen } from "../../stories/helpers";

import { CurrentJobIdProvider } from "./currentJob";
import styles from "./SendSummaryForm.module.scss";

// The frame every job-action form story shares ("Start Job", "Cancel Job",
// "Reschedule Job", "Unschedule Job"): the form opens on load, a button
// reopens it after it closes, its toasts show, and `press` clicks the form's
// main button once to reveal the missing-value errors.
export default function FormStoryFrame({
  mobile,
  icon,
  press,
  children,
}: {
  mobile: boolean;
  /** The reopen button's icon — the form's own action icon. */
  icon: string;
  /** Label of the button to press once on open (the errors state). */
  press?: string;
  children: (open: boolean, close: () => void) => ReactNode;
}) {
  // Opened right AFTER mount, like a click: the phone container's drawer root
  // only exists after the first render, and a dialog that is already open on
  // that render never finds it.
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(true), 100);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <CurrentJobIdProvider id="JOB-1203">
      <PhoneViewport>
        <div className={styles.storyPage}>
          <Button size="lg" variant="subtle" leftIcon={icon} onClick={() => setOpen(true)}>
            Open the form
          </Button>
        </div>
        {children(open, () => setOpen(false))}
        {press != null && <PressOnOpen label={press} />}
        <Toaster breakpoint={mobile ? "mobile" : "desktop"} />
      </PhoneViewport>
    </CurrentJobIdProvider>
  );
}
