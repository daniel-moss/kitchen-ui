import Button from "../../components/Button/Button";
import { useDismiss } from "../../components/Popover/DismissContext";

/**
 * A footer's Cancel that asks through the overlay's own dismiss path, so it
 * gets the same "Discard changes?" Prompt as the ×, the scrim and the swipe.
 * Use it in place of a Cancel wired straight to `onClose`.
 */
export default function DismissCancelButton() {
  const dismiss = useDismiss();
  return (
    <Button size="lg" variant="ghost" onClick={() => dismiss?.()}>
      Cancel
    </Button>
  );
}
